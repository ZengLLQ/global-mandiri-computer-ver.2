package customers

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/gmc/api/internal/catalog"
	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/database"
	"github.com/gmc/api/internal/platform/ids"
	"github.com/gmc/api/internal/platform/security"
)

var (
	ErrMaxAddressesReached = errors.New("maksimal 10 alamat tersimpan tercapai")
	ErrAddressNotFound     = errors.New("alamat tidak ditemukan")
	ErrOrderNotFound       = errors.New("pesanan tidak ditemukan")
)

type Service struct {
	pool       *pgxpool.Pool
	queries    *db.Queries
	catalogSvc *catalog.Service
	idGen      ids.Generator
}

func NewService(pool *pgxpool.Pool, queries *db.Queries, catalogSvc *catalog.Service, idGen ids.Generator) *Service {
	return &Service{
		pool:       pool,
		queries:    queries,
		catalogSvc: catalogSvc,
		idGen:      idGen,
	}
}

func (s *Service) GetMe(ctx context.Context, userID uuid.UUID) (*gen.User, error) {
	row, err := s.queries.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &gen.User{
		Id:    row.ID,
		Email: openapi_types.Email(row.Email),
		Name:  row.Name,
		Phone: row.Phone,
		Role:  gen.UserRole(row.Role),
	}, nil
}

func (s *Service) UpdateMe(ctx context.Context, userID uuid.UUID, name, phone, email *string) (*gen.User, error) {
	curr, err := s.queries.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	newName := curr.Name
	if name != nil && strings.TrimSpace(*name) != "" {
		newName = strings.TrimSpace(*name)
	}

	newPhone := curr.Phone
	if phone != nil && strings.TrimSpace(*phone) != "" {
		p, err := security.NormalizeIndonesianPhone(*phone)
		if err != nil {
			return nil, err
		}
		newPhone = p
	}

	newEmail := curr.Email
	if email != nil && strings.TrimSpace(*email) != "" {
		newEmail = strings.ToLower(strings.TrimSpace(*email))
	}

	row, err := s.queries.UpdateUserProfile(ctx, db.UpdateUserProfileParams{
		ID:    userID,
		Name:  newName,
		Phone: newPhone,
		Email: newEmail,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, errors.New("email sudah terdaftar")
		}
		return nil, err
	}

	return &gen.User{
		Id:    row.ID,
		Email: openapi_types.Email(row.Email),
		Name:  row.Name,
		Phone: row.Phone,
		Role:  gen.UserRole(row.Role),
	}, nil
}

func (s *Service) ListAddresses(ctx context.Context, userID uuid.UUID) ([]gen.Address, error) {
	rows, err := s.queries.ListAddressesByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	addresses := make([]gen.Address, 0, len(rows))
	for _, r := range rows {
		addresses = append(addresses, gen.Address{
			Id:            r.ID,
			Label:         database.TextToStringPtr(r.Label),
			RecipientName: r.RecipientName,
			Phone:         r.Phone,
			Street:        r.Street,
			City:          r.City,
			Province:      r.Province,
			PostalCode:    r.PostalCode,
			IsDefault:     r.IsDefault,
		})
	}
	return addresses, nil
}

func (s *Service) CreateAddress(ctx context.Context, userID uuid.UUID, input gen.AddressInput) (*gen.Address, error) {
	currentAddresses, err := s.queries.ListAddressesByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(currentAddresses) >= 10 {
		return nil, ErrMaxAddressesReached
	}

	normalizedPhone, err := security.NormalizeIndonesianPhone(input.Phone)
	if err != nil {
		return nil, err
	}

	isDefault := false
	if input.IsDefault != nil && *input.IsDefault {
		isDefault = true
	}
	// If first address, make default
	if len(currentAddresses) == 0 {
		isDefault = true
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	if isDefault {
		if err := qtx.UnsetDefaultAddresses(ctx, userID); err != nil {
			return nil, err
		}
	}

	addressID := s.idGen.New()
	row, err := qtx.CreateAddress(ctx, db.CreateAddressParams{
		ID:            addressID,
		UserID:        userID,
		Label:         database.StringPtrToText(input.Label),
		RecipientName: strings.TrimSpace(input.RecipientName),
		Phone:         normalizedPhone,
		Street:        strings.TrimSpace(input.Street),
		City:          strings.TrimSpace(input.City),
		Province:      strings.TrimSpace(input.Province),
		PostalCode:    strings.TrimSpace(input.PostalCode),
		IsDefault:     isDefault,
	})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &gen.Address{
		Id:            row.ID,
		Label:         database.TextToStringPtr(row.Label),
		RecipientName: row.RecipientName,
		Phone:         row.Phone,
		Street:        row.Street,
		City:          row.City,
		Province:      row.Province,
		PostalCode:    row.PostalCode,
		IsDefault:     row.IsDefault,
	}, nil
}

func (s *Service) UpdateAddress(ctx context.Context, userID uuid.UUID, addressID uuid.UUID, input gen.AddressPatchInput) (*gen.Address, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	existing, err := qtx.GetAddressByID(ctx, db.GetAddressByIDParams{
		ID:     addressID,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAddressNotFound
		}
		return nil, err
	}

	if input.IsDefault != nil && *input.IsDefault {
		if err := qtx.UnsetDefaultAddresses(ctx, userID); err != nil {
			return nil, err
		}
	}

	label := existing.Label
	if input.Label != nil {
		label = database.StringPtrToText(input.Label)
	}

	recipientName := existing.RecipientName
	if input.RecipientName != nil && strings.TrimSpace(*input.RecipientName) != "" {
		recipientName = strings.TrimSpace(*input.RecipientName)
	}

	phone := existing.Phone
	if input.Phone != nil && strings.TrimSpace(*input.Phone) != "" {
		p, err := security.NormalizeIndonesianPhone(*input.Phone)
		if err != nil {
			return nil, err
		}
		phone = p
	}

	street := existing.Street
	if input.Street != nil && strings.TrimSpace(*input.Street) != "" {
		street = strings.TrimSpace(*input.Street)
	}

	city := existing.City
	if input.City != nil && strings.TrimSpace(*input.City) != "" {
		city = strings.TrimSpace(*input.City)
	}

	province := existing.Province
	if input.Province != nil && strings.TrimSpace(*input.Province) != "" {
		province = strings.TrimSpace(*input.Province)
	}

	postalCode := existing.PostalCode
	if input.PostalCode != nil && strings.TrimSpace(*input.PostalCode) != "" {
		postalCode = strings.TrimSpace(*input.PostalCode)
	}

	isDefault := existing.IsDefault
	if input.IsDefault != nil {
		isDefault = *input.IsDefault
	}

	row, err := qtx.UpdateAddress(ctx, db.UpdateAddressParams{
		ID:            addressID,
		UserID:        userID,
		Label:         label,
		RecipientName: recipientName,
		Phone:         phone,
		Street:        street,
		City:          city,
		Province:      province,
		PostalCode:    postalCode,
		IsDefault:     isDefault,
	})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &gen.Address{
		Id:            row.ID,
		Label:         database.TextToStringPtr(row.Label),
		RecipientName: row.RecipientName,
		Phone:         row.Phone,
		Street:        row.Street,
		City:          row.City,
		Province:      row.Province,
		PostalCode:    row.PostalCode,
		IsDefault:     row.IsDefault,
	}, nil
}

func (s *Service) DeleteAddress(ctx context.Context, userID, addressID uuid.UUID) error {
	return s.queries.DeleteAddress(ctx, db.DeleteAddressParams{
		ID:     addressID,
		UserID: userID,
	})
}

func (s *Service) GetWishlist(ctx context.Context, userID uuid.UUID) ([]gen.ProductCard, error) {
	productIDs, err := s.queries.GetWishlistProductIDs(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(productIDs) == 0 {
		return []gen.ProductCard{}, nil
	}

	res, err := s.catalogSvc.ListProducts(ctx, catalog.ProductFilter{
		Page:     1,
		PageSize: 60,
	})
	if err != nil {
		return nil, err
	}

	idMap := make(map[uuid.UUID]bool)
	for _, id := range productIDs {
		idMap[id] = true
	}

	var cards []gen.ProductCard
	for _, card := range res.Items {
		if idMap[card.Id] {
			cards = append(cards, card)
		}
	}
	return cards, nil
}

func (s *Service) AddToWishlist(ctx context.Context, userID, productID uuid.UUID) error {
	return s.queries.AddWishlistItem(ctx, db.AddWishlistItemParams{
		UserID:    userID,
		ProductID: productID,
	})
}

func (s *Service) RemoveFromWishlist(ctx context.Context, userID, productID uuid.UUID) error {
	return s.queries.RemoveWishlistItem(ctx, db.RemoveWishlistItemParams{
		UserID:    userID,
		ProductID: productID,
	})
}
