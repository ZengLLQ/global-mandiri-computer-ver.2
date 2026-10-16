package cart

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gmc/api/internal/catalog"
	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/database"
)

type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewService(pool *pgxpool.Pool, queries *db.Queries) *Service {
	return &Service{
		pool:    pool,
		queries: queries,
	}
}

// ValidateCart takes variant items, looks them up authoritative in DB, computes lines and issues.
func (s *Service) ValidateCart(ctx context.Context, items []gen.CartItemInput) (*gen.CartValidateResponse, error) {
	if len(items) == 0 {
		return &gen.CartValidateResponse{
			Lines:       []gen.CartLine{},
			SubtotalIdr: 0,
			HasIssues:   false,
		}, nil
	}

	variantIDs := make([]uuid.UUID, 0, len(items))
	qtyMap := make(map[uuid.UUID]int)
	for _, it := range items {
		variantIDs = append(variantIDs, it.VariantId)
		qtyMap[it.VariantId] += it.Quantity
	}

	variants, err := s.queries.GetVariantsByIDs(ctx, variantIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to query variants for cart: %w", err)
	}

	varMap := make(map[uuid.UUID]db.GetVariantsByIDsRow)
	for _, v := range variants {
		varMap[v.ID] = v
	}

	// Fetch option values labels for human-readable variant labels
	var allOptValIDs []uuid.UUID
	for _, v := range variants {
		allOptValIDs = append(allOptValIDs, v.OptionValueIds...)
	}

	optLabelMap := make(map[uuid.UUID]string)
	if len(allOptValIDs) > 0 {
		rows, err := s.pool.Query(ctx, `
			SELECT id, label FROM product_option_values WHERE id = ANY($1::uuid[])
		`, allOptValIDs)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id uuid.UUID
				var lbl string
				if err := rows.Scan(&id, &lbl); err == nil {
					optLabelMap[id] = lbl
				}
			}
		}
	}

	lines := make([]gen.CartLine, 0, len(items))
	var subtotalIdr int64
	hasIssues := false

	// Preserve order of incoming items
	seen := make(map[uuid.UUID]bool)
	for _, item := range items {
		if seen[item.VariantId] {
			continue
		}
		seen[item.VariantId] = true

		requestedQty := qtyMap[item.VariantId]
		v, found := varMap[item.VariantId]

		if !found || !v.IsActive {
			hasIssues = true
			issue := gen.CartLineIssueUnavailable
			lines = append(lines, gen.CartLine{
				VariantId:    item.VariantId,
				Sku:          "UNAVAILABLE",
				ProductSlug:  "",
				Name:         "Produk tidak tersedia",
				Brand:        "",
				VariantLabel: "",
				ImageUrl:     nil,
				UnitPriceIdr: 0,
				Quantity:     requestedQty,
				LineTotalIdr: 0,
				Stock:        0,
				StockStatus:  gen.OutOfStock,
				Issue:        &issue,
			})
			continue
		}

		// Build human-friendly variant label
		var labels []string
		for _, optValID := range v.OptionValueIds {
			if lbl, ok := optLabelMap[optValID]; ok {
				labels = append(labels, lbl)
			}
		}
		variantLabel := strings.Join(labels, " / ")

		stock := int(v.Stock)
		stockStatus := catalog.ComputeStockStatus(stock, v.IsPreorder)

		var issue *gen.CartLineIssue
		if !v.IsPreorder {
			if stock <= 0 {
				iss := gen.CartLineIssueOutOfStock
				issue = &iss
				hasIssues = true
			} else if requestedQty > stock {
				iss := gen.CartLineIssueInsufficientStock
				issue = &iss
				hasIssues = true
			}
		} else {
			// Preorder allows ordering up to 5
			if requestedQty > 5 {
				iss := gen.CartLineIssueInsufficientStock
				issue = &iss
				hasIssues = true
			}
		}

		lineTotal := v.PriceIdr * int64(requestedQty)
		if issue == nil {
			subtotalIdr += lineTotal
		}

		lines = append(lines, gen.CartLine{
			VariantId:    v.ID,
			Sku:          v.Sku,
			ProductSlug:  v.ProductSlug,
			Name:         v.ProductName,
			Brand:        v.BrandName,
			VariantLabel: variantLabel,
			ImageUrl:     database.TextToStringPtr(v.ImageUrl),
			UnitPriceIdr: v.PriceIdr,
			Quantity:     requestedQty,
			LineTotalIdr: lineTotal,
			Stock:        stock,
			StockStatus:  stockStatus,
			Issue:        issue,
		})
	}

	return &gen.CartValidateResponse{
		Lines:       lines,
		SubtotalIdr: subtotalIdr,
		HasIssues:   hasIssues,
	}, nil
}

// GetUserCart retrieves stored variant items for authenticated user.
func (s *Service) GetUserCart(ctx context.Context, userID uuid.UUID) ([]gen.CartItemInput, error) {
	rows, err := s.queries.GetCartItemsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	items := make([]gen.CartItemInput, 0, len(rows))
	for _, r := range rows {
		items = append(items, gen.CartItemInput{
			VariantId: r.VariantID,
			Quantity:  int(r.Quantity),
		})
	}
	return items, nil
}

// ReplaceUserCart replaces all items in the user's cart in a transaction.
func (s *Service) ReplaceUserCart(ctx context.Context, userID uuid.UUID, items []gen.CartItemInput) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	if err := qtx.UpsertCart(ctx, userID); err != nil {
		return err
	}
	if err := qtx.DeleteCartItemsByUserID(ctx, userID); err != nil {
		return err
	}

	for _, item := range items {
		if item.Quantity <= 0 {
			continue
		}
		qty := item.Quantity
		if qty > 99 {
			qty = 99
		}
		if err := qtx.UpsertCartItem(ctx, db.UpsertCartItemParams{
			UserID:    userID,
			VariantID: item.VariantId,
			Quantity:  int32(qty),
		}); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// MergeUserCart merges guest cart items with the server cart, capping quantities.
func (s *Service) MergeUserCart(ctx context.Context, userID uuid.UUID, guestItems []gen.CartItemInput) (*gen.CartValidateResponse, error) {
	currentItems, err := s.GetUserCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	mergedQty := make(map[uuid.UUID]int)
	for _, it := range currentItems {
		mergedQty[it.VariantId] += it.Quantity
	}
	for _, it := range guestItems {
		mergedQty[it.VariantId] += it.Quantity
	}

	mergedItems := make([]gen.CartItemInput, 0, len(mergedQty))
	for id, qty := range mergedQty {
		if qty > 99 {
			qty = 99
		}
		mergedItems = append(mergedItems, gen.CartItemInput{
			VariantId: id,
			Quantity:  qty,
		})
	}

	sort.Slice(mergedItems, func(i, j int) bool {
		return mergedItems[i].VariantId.String() < mergedItems[j].VariantId.String()
	})

	// Validate merged items
	validated, err := s.ValidateCart(ctx, mergedItems)
	if err != nil {
		return nil, err
	}

	// Update DB cart with valid items
	validItems := make([]gen.CartItemInput, 0, len(validated.Lines))
	for _, line := range validated.Lines {
		if line.Issue == nil || *line.Issue != gen.CartLineIssueUnavailable {
			qty := line.Quantity
			if line.StockStatus != gen.Preorder && qty > line.Stock {
				qty = line.Stock
			}
			if qty > 0 {
				validItems = append(validItems, gen.CartItemInput{
					VariantId: line.VariantId,
					Quantity:  qty,
				})
			}
		}
	}

	_ = s.ReplaceUserCart(ctx, userID, validItems)

	return validated, nil
}
