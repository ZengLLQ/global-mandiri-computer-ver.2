package checkout

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/clock"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/database"
	"github.com/gmc/api/internal/platform/ids"
	"github.com/gmc/api/internal/platform/security"
	"github.com/gmc/api/internal/platform/whatsapp"
)

var (
	ErrPriceChanged        = errors.New("harga produk telah diperbarui, silakan periksa kembali keranjang belanja Anda")
	ErrOutOfStock          = errors.New("stok produk tidak mencukupi")
	ErrIdempotencyConflict = errors.New("idempotency key telah digunakan dengan data transaksi yang berbeda")
	ErrOrderNotFound       = errors.New("pesanan tidak ditemukan")
)

type CachedResponse struct {
	Response   []byte
	StatusCode int
}

type Service struct {
	pool       *pgxpool.Pool
	queries    *db.Queries
	cfg        *config.Config
	clk        clock.Clock
	idGen      ids.Generator
	logger     *slog.Logger
	tzLocation *time.Location
}

func NewService(
	pool *pgxpool.Pool,
	queries *db.Queries,
	cfg *config.Config,
	clk clock.Clock,
	idGen ids.Generator,
	log *slog.Logger,
) *Service {
	loc, err := time.LoadLocation(cfg.StoreTZ)
	if err != nil {
		loc = time.UTC
	}
	return &Service{
		pool:       pool,
		queries:    queries,
		cfg:        cfg,
		clk:        clk,
		idGen:      idGen,
		logger:     log,
		tzLocation: loc,
	}
}

// CreateOrder executes an atomic checkout transaction with row-level stock locks.
func (s *Service) CreateOrder(
	ctx context.Context,
	idempotencyKey uuid.UUID,
	reqBodyBytes []byte,
	req gen.CheckoutRequest,
	authenticatedUserID *uuid.UUID,
) (*gen.CheckoutResponse, *CachedResponse, error) {
	// Check idempotency first
	reqHash := sha256.Sum256(reqBodyBytes)
	existingKey, err := s.queries.GetIdempotencyKey(ctx, idempotencyKey)
	if err == nil {
		// Key exists
		if subtle.ConstantTimeCompare(existingKey.RequestHash, reqHash[:]) == 1 {
			// Idempotent replay: return cached response
			return nil, &CachedResponse{
				Response:   existingKey.Response,
				StatusCode: int(existingKey.StatusCode),
			}, nil
		}
		// Same key, different body -> 409 idempotency conflict
		return nil, nil, ErrIdempotencyConflict
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, fmt.Errorf("failed to check idempotency key: %w", err)
	}

	// Validate customer input
	custName := strings.TrimSpace(req.Customer.Name)
	if custName == "" {
		return nil, nil, errors.New("nama pelanggan tidak boleh kosong")
	}
	custPhone, err := security.NormalizeIndonesianPhone(req.Customer.Phone)
	if err != nil {
		return nil, nil, err
	}
	custEmail := strings.ToLower(strings.TrimSpace(string(req.Customer.Email)))

	// Validate delivery method and address
	if req.DeliveryMethod == gen.Delivery {
		if req.ShippingAddress == nil ||
			strings.TrimSpace(req.ShippingAddress.Street) == "" ||
			strings.TrimSpace(req.ShippingAddress.City) == "" {
			return nil, nil, errors.New("alamat pengiriman lengkap wajib diisi untuk metode pengiriman kurir")
		}
	}

	// Begin atomic transaction
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// Collect requested variant IDs and quantities
	itemQtyMap := make(map[uuid.UUID]int)
	variantIDs := make([]uuid.UUID, 0, len(req.Items))
	for _, it := range req.Items {
		itemQtyMap[it.VariantId] += it.Quantity
		variantIDs = append(variantIDs, it.VariantId)
	}

	// Sort variant IDs for consistent lock order (prevents deadlocks under high concurrency)
	sort.Slice(variantIDs, func(i, j int) bool {
		return variantIDs[i].String() < variantIDs[j].String()
	})

	// Lock variant rows: SELECT ... FOR UPDATE
	lockedVariants, err := qtx.LockVariantsForUpdate(ctx, variantIDs)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to lock variants: %w", err)
	}

	lockedMap := make(map[uuid.UUID]db.LockVariantsForUpdateRow)
	for _, lv := range lockedVariants {
		lockedMap[lv.ID] = lv
	}

	// Verify stock and active state
	var outOfStockSkus []string
	var calculatedSubtotal int64

	for vID, requestedQty := range itemQtyMap {
		v, exists := lockedMap[vID]
		if !exists || !v.IsActive {
			outOfStockSkus = append(outOfStockSkus, fmt.Sprintf("%s (tidak aktif/dihapus)", vID))
			continue
		}

		if !v.IsPreorder {
			if int(v.Stock) < requestedQty {
				outOfStockSkus = append(outOfStockSkus, fmt.Sprintf("%s (tersedia: %d, diminta: %d)", v.Sku, v.Stock, requestedQty))
			}
		} else {
			if requestedQty > 5 {
				outOfStockSkus = append(outOfStockSkus, fmt.Sprintf("%s (preorder maksimal 5 unit)", v.Sku))
			}
		}

		calculatedSubtotal += v.PriceIdr * int64(requestedQty)
	}

	if len(outOfStockSkus) > 0 {
		return nil, nil, fmt.Errorf("%w: %s", ErrOutOfStock, strings.Join(outOfStockSkus, ", "))
	}

	// Verify price authority: if expectedSubtotalIdr provided, ensure exact match
	if req.ExpectedSubtotalIdr != nil && *req.ExpectedSubtotalIdr != calculatedSubtotal {
		return nil, nil, fmt.Errorf("%w: subtotal yang diharapkan Rp %s, subtotal saat ini Rp %s",
			ErrPriceChanged,
			whatsapp.FormatRupiah(*req.ExpectedSubtotalIdr),
			whatsapp.FormatRupiah(calculatedSubtotal),
		)
	}

	// Decrement stock in database
	for vID, requestedQty := range itemQtyMap {
		if !lockedMap[vID].IsPreorder {
			if err := qtx.DecrementVariantStock(ctx, db.DecrementVariantStockParams{
				ID:    vID,
				Stock: int32(requestedQty),
			}); err != nil {
				return nil, nil, fmt.Errorf("failed to decrement stock: %w", err)
			}
		}
	}

	// Generate order number in Asia/Jakarta timezone
	nowUTC := s.clk.Now()
	nowLoc := nowUTC.In(s.tzLocation)
	dayDate := time.Date(nowLoc.Year(), nowLoc.Month(), nowLoc.Day(), 0, 0, 0, 0, time.UTC)
	dayStr := nowLoc.Format("060102") // YYMMDD

	seq, err := qtx.GetNextOrderSequence(ctx, database.TimeToDate(dayDate))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate order sequence: %w", err)
	}
	orderNo := fmt.Sprintf("GMC-%s-%04d", dayStr, seq)

	// Generate 256-bit random view token
	rawViewTokenBytes := make([]byte, 32)
	if _, err := rand.Read(rawViewTokenBytes); err != nil {
		return nil, nil, fmt.Errorf("failed to generate view token: %w", err)
	}
	rawViewToken := hex.EncodeToString(rawViewTokenBytes)
	viewTokenHash := sha256.Sum256([]byte(rawViewToken))

	orderID := s.idGen.New()
	shippingIdr := int64(0) // Confirmed via WhatsApp
	totalIdr := calculatedSubtotal + shippingIdr

	// Shipping address JSON
	var shippingAddressJSON []byte
	if req.ShippingAddress != nil {
		shippingAddressJSON, _ = json.Marshal(req.ShippingAddress)
	}

	// Insert order record
	orderRow, err := qtx.CreateOrder(ctx, db.CreateOrderParams{
		ID:              orderID,
		OrderNo:         orderNo,
		UserID:          database.UUIDPtrToUUID(authenticatedUserID),
		CustomerName:    custName,
		CustomerPhone:   custPhone,
		CustomerEmail:   custEmail,
		DeliveryMethod:  string(req.DeliveryMethod),
		ShippingAddress: shippingAddressJSON,
		PaymentMethod:   string(req.PaymentMethod),
		Note:            database.StringPtrToText(req.Note),
		SubtotalIdr:     calculatedSubtotal,
		ShippingIdr:     shippingIdr,
		TotalIdr:        totalIdr,
		Status:          string(gen.MenungguKonfirmasi),
		ViewTokenHash:   viewTokenHash[:],
		IdempotencyKey:  database.UUIDPtrToUUID(&idempotencyKey),
		RequestHash:     reqHash[:],
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create order: %w", err)
	}

	// Fetch catalog snapshot details for order items
	detailRows, err := s.queries.GetVariantsByIDs(ctx, variantIDs)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to snapshot order items: %w", err)
	}
	detailMap := make(map[uuid.UUID]db.GetVariantsByIDsRow)
	for _, d := range detailRows {
		detailMap[d.ID] = d
	}

	// Fetch option value labels for variant label snapshots
	var allOptValIDs []uuid.UUID
	for _, d := range detailRows {
		allOptValIDs = append(allOptValIDs, d.OptionValueIds...)
	}
	optLabelMap := make(map[uuid.UUID]string)
	if len(allOptValIDs) > 0 {
		rows, err := s.pool.Query(ctx, `SELECT id, label FROM product_option_values WHERE id = ANY($1::uuid[])`, allOptValIDs)
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

	orderItems := make([]gen.OrderItem, 0, len(req.Items))
	var waSummaryItems []whatsapp.OrderItemSummary

	for _, it := range req.Items {
		d := detailMap[it.VariantId]
		var labels []string
		for _, optValID := range d.OptionValueIds {
			if lbl, ok := optLabelMap[optValID]; ok {
				labels = append(labels, lbl)
			}
		}
		variantLabel := strings.Join(labels, " / ")

		lineTotal := d.PriceIdr * int64(it.Quantity)
		itemID := s.idGen.New()

		_, err := qtx.CreateOrderItem(ctx, db.CreateOrderItemParams{
			ID:           itemID,
			OrderID:      orderID,
			VariantID:    database.UUIDValToPgUUID(it.VariantId),
			ProductSlug:  d.ProductSlug,
			Sku:          d.Sku,
			Name:         d.ProductName,
			Brand:        d.BrandName,
			VariantLabel: variantLabel,
			ImageUrl:     d.ImageUrl,
			UnitPriceIdr: d.PriceIdr,
			Quantity:     int32(it.Quantity),
			LineTotalIdr: lineTotal,
		})
		if err != nil {
			return nil, nil, fmt.Errorf("failed to insert order item: %w", err)
		}

		orderItems = append(orderItems, gen.OrderItem{
			Id:           itemID,
			VariantId:    &it.VariantId,
			ProductSlug:  d.ProductSlug,
			Sku:          d.Sku,
			Name:         d.ProductName,
			Brand:        d.BrandName,
			VariantLabel: variantLabel,
			ImageUrl:     database.TextToStringPtr(d.ImageUrl),
			UnitPriceIdr: d.PriceIdr,
			Quantity:     it.Quantity,
			LineTotalIdr: lineTotal,
		})

		waSummaryItems = append(waSummaryItems, whatsapp.OrderItemSummary{
			Name:         d.ProductName,
			VariantLabel: variantLabel,
			Quantity:     it.Quantity,
			LineTotalIdr: lineTotal,
		})
	}

	// Insert status history
	historyID := s.idGen.New()
	initNote := "Pesanan dibuat, menunggu konfirmasi"
	_, err = qtx.AddOrderStatusHistory(ctx, db.AddOrderStatusHistoryParams{
		ID:      historyID,
		OrderID: orderID,
		Status:  string(gen.MenungguKonfirmasi),
		Note:    database.StringPtrToText(&initNote),
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to record status history: %w", err)
	}

	// City for delivery WhatsApp message
	var city string
	if req.ShippingAddress != nil {
		city = req.ShippingAddress.City
	}

	waURL := whatsapp.BuildOrderConfirmationURL(
		s.cfg.WhatsAppNumber,
		s.cfg.StoreName,
		orderNo,
		custName,
		string(req.DeliveryMethod),
		city,
		waSummaryItems,
		totalIdr,
	)

	// Prepare Order response
	history := []gen.OrderStatusHistoryItem{
		{
			Status:    gen.MenungguKonfirmasi,
			Note:      &initNote,
			CreatedAt: orderRow.CreatedAt,
		},
	}

	var shippingAddress *gen.ShippingAddressInput
	if req.ShippingAddress != nil {
		shippingAddress = req.ShippingAddress
	}

	var viewTokenReturn *string
	if authenticatedUserID == nil {
		viewTokenReturn = &rawViewToken
	}

	orderResponse := gen.Order{
		Id:              orderID,
		OrderNo:         orderNo,
		Status:          gen.MenungguKonfirmasi,
		CreatedAt:       orderRow.CreatedAt,
		CustomerName:    custName,
		CustomerPhone:   custPhone,
		CustomerEmail:   openapi_types.Email(custEmail),
		DeliveryMethod:  req.DeliveryMethod,
		PaymentMethod:   req.PaymentMethod,
		ShippingAddress: shippingAddress,
		Note:            req.Note,
		Items:           orderItems,
		SubtotalIdr:     calculatedSubtotal,
		ShippingIdr:     shippingIdr,
		TotalIdr:        totalIdr,
		History:         history,
		WhatsappUrl:     waURL,
	}

	finalResponse := &gen.CheckoutResponse{
		Order:     orderResponse,
		ViewToken: viewTokenReturn,
	}

	// Cache in idempotency_keys table
	responseJSON, _ := json.Marshal(finalResponse)
	_ = qtx.InsertIdempotencyKey(ctx, db.InsertIdempotencyKeyParams{
		Key:         idempotencyKey,
		RequestHash: reqHash[:],
		Response:    responseJSON,
		StatusCode:  201,
	})

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to commit checkout transaction: %w", err)
	}

	return finalResponse, nil, nil
}

// GetOrderByNumber retrieves an order, validating guest viewToken or owner session.
func (s *Service) GetOrderByNumber(
	ctx context.Context,
	orderNo string,
	viewToken *string,
	authenticatedUserID *uuid.UUID,
) (*gen.Order, error) {
	orderRow, err := s.queries.GetOrderByNumber(ctx, orderNo)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}

	// Authorize access
	authorized := false

	// Check owner session
	if authenticatedUserID != nil && orderRow.UserID.Valid && uuid.UUID(orderRow.UserID.Bytes) == *authenticatedUserID {
		authorized = true
	}

	// Check guest viewToken
	if !authorized && viewToken != nil && strings.TrimSpace(*viewToken) != "" {
		hash := sha256.Sum256([]byte(strings.TrimSpace(*viewToken)))
		if subtle.ConstantTimeCompare(orderRow.ViewTokenHash, hash[:]) == 1 {
			authorized = true
		}
	}

	if !authorized {
		// Return 404 to prevent order number enumeration
		return nil, ErrOrderNotFound
	}

	// Fetch items
	itemRows, err := s.queries.GetOrderItems(ctx, orderRow.ID)
	if err != nil {
		return nil, err
	}

	items := make([]gen.OrderItem, 0, len(itemRows))
	var waSummaryItems []whatsapp.OrderItemSummary
	for _, it := range itemRows {
		items = append(items, gen.OrderItem{
			Id:           it.ID,
			VariantId:    database.UUIDToUUIDPtr(it.VariantID),
			ProductSlug:  it.ProductSlug,
			Sku:          it.Sku,
			Name:         it.Name,
			Brand:        it.Brand,
			VariantLabel: it.VariantLabel,
			ImageUrl:     database.TextToStringPtr(it.ImageUrl),
			UnitPriceIdr: it.UnitPriceIdr,
			Quantity:     int(it.Quantity),
			LineTotalIdr: it.LineTotalIdr,
		})

		waSummaryItems = append(waSummaryItems, whatsapp.OrderItemSummary{
			Name:         it.Name,
			VariantLabel: it.VariantLabel,
			Quantity:     int(it.Quantity),
			LineTotalIdr: it.LineTotalIdr,
		})
	}

	// Fetch status history
	historyRows, err := s.queries.GetOrderStatusHistory(ctx, orderRow.ID)
	if err != nil {
		return nil, err
	}

	history := make([]gen.OrderStatusHistoryItem, 0, len(historyRows))
	for _, h := range historyRows {
		history = append(history, gen.OrderStatusHistoryItem{
			Status:    gen.OrderStatus(h.Status),
			Note:      database.TextToStringPtr(h.Note),
			CreatedAt: h.CreatedAt,
		})
	}

	var shippingAddress *gen.ShippingAddressInput
	var city string
	if len(orderRow.ShippingAddress) > 0 {
		_ = json.Unmarshal(orderRow.ShippingAddress, &shippingAddress)
		if shippingAddress != nil {
			city = shippingAddress.City
		}
	}

	waURL := whatsapp.BuildOrderConfirmationURL(
		s.cfg.WhatsAppNumber,
		s.cfg.StoreName,
		orderRow.OrderNo,
		orderRow.CustomerName,
		orderRow.DeliveryMethod,
		city,
		waSummaryItems,
		orderRow.TotalIdr,
	)

	return &gen.Order{
		Id:              orderRow.ID,
		OrderNo:         orderRow.OrderNo,
		Status:          gen.OrderStatus(orderRow.Status),
		CreatedAt:       orderRow.CreatedAt,
		CustomerName:    orderRow.CustomerName,
		CustomerPhone:   orderRow.CustomerPhone,
		CustomerEmail:   openapi_types.Email(orderRow.CustomerEmail),
		DeliveryMethod:  gen.DeliveryMethod(orderRow.DeliveryMethod),
		PaymentMethod:   gen.PaymentMethod(orderRow.PaymentMethod),
		ShippingAddress: shippingAddress,
		Note:            database.TextToStringPtr(orderRow.Note),
		Items:           items,
		SubtotalIdr:     orderRow.SubtotalIdr,
		ShippingIdr:     orderRow.ShippingIdr,
		TotalIdr:        orderRow.TotalIdr,
		History:         history,
		WhatsappUrl:     waURL,
	}, nil
}

// ListUserOrders returns paginated order summaries for authenticated user.
func (s *Service) ListUserOrders(
	ctx context.Context,
	userID uuid.UUID,
	status *gen.OrderStatus,
	prefixQuery *string,
	page int,
	pageSize int,
) (*gen.OrderSummaryPagination, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 60 {
		pageSize = 60
	}

	var statusStr string
	if status != nil {
		statusStr = string(*status)
	}

	var qStr string
	if prefixQuery != nil {
		qStr = *prefixQuery
	}

	offset := (page - 1) * pageSize

	rows, err := s.queries.ListOrdersByUserID(ctx, db.ListOrdersByUserIDParams{
		UserID:  database.UUIDValToPgUUID(userID),
		Column2: statusStr,
		Column3: qStr,
		Limit:   int32(pageSize),
		Offset:  int32(offset),
	})
	if err != nil {
		return nil, err
	}

	total, err := s.queries.CountOrdersByUserID(ctx, db.CountOrdersByUserIDParams{
		UserID:  database.UUIDValToPgUUID(userID),
		Column2: statusStr,
		Column3: qStr,
	})
	if err != nil {
		return nil, err
	}

	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(pageSize) - 1) / int64(pageSize))
	}

	summaries := make([]gen.OrderSummary, 0, len(rows))
	for _, r := range rows {
		// Get first item
		firstItems, _ := s.queries.GetOrderItems(ctx, r.ID)
		var firstItemName string
		var firstItemImg *string
		if len(firstItems) > 0 {
			firstItemName = firstItems[0].Name
			firstItemImg = database.TextToStringPtr(firstItems[0].ImageUrl)
		}

		summaries = append(summaries, gen.OrderSummary{
			OrderNo:           r.OrderNo,
			Status:            gen.OrderStatus(r.Status),
			CreatedAt:         r.CreatedAt,
			TotalIdr:          r.TotalIdr,
			ItemCount:         len(firstItems),
			FirstItemName:     firstItemName,
			FirstItemImageUrl: firstItemImg,
		})
	}

	return &gen.OrderSummaryPagination{
		Items:      summaries,
		Page:       page,
		PageSize:   pageSize,
		Total:      int(total),
		TotalPages: totalPages,
	}, nil
}
