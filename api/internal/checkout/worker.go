package checkout

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/database"
	"github.com/gmc/api/internal/platform/ids"
)

const (
	// Advisory lock ID for order expiry worker
	expiryLockID = 48010203
)

type ExpiryWorker struct {
	pool    *pgxpool.Pool
	queries *db.Queries
	idGen   ids.Generator
	logger  *slog.Logger
	stopCh  chan struct{}
}

func NewExpiryWorker(pool *pgxpool.Pool, queries *db.Queries, idGen ids.Generator, log *slog.Logger) *ExpiryWorker {
	return &ExpiryWorker{
		pool:    pool,
		queries: queries,
		idGen:   idGen,
		logger:  log,
		stopCh:  make(chan struct{}),
	}
}

func (w *ExpiryWorker) Start() {
	go func() {
		ticker := time.NewTicker(15 * time.Minute)
		defer ticker.Stop()

		// Run once on start
		w.processExpiredOrders()

		for {
			select {
			case <-ticker.C:
				w.processExpiredOrders()
			case <-w.stopCh:
				return
			}
		}
	}()
}

func (w *ExpiryWorker) Stop() {
	close(w.stopCh)
}

func (w *ExpiryWorker) processExpiredOrders() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Try advisory lock
	var locked bool
	err := w.pool.QueryRow(ctx, `SELECT pg_try_advisory_lock($1)`, expiryLockID).Scan(&locked)
	if err != nil || !locked {
		return
	}
	defer func() {
		_, _ = w.pool.Exec(context.Background(), `SELECT pg_advisory_unlock($1)`, expiryLockID)
	}()

	staleOrders, err := w.queries.GetStalePendingOrders(ctx)
	if err != nil || len(staleOrders) == 0 {
		return
	}

	for _, order := range staleOrders {
		if err := w.cancelOrderAndRestoreStock(ctx, order); err != nil {
			w.logger.ErrorContext(ctx, "Failed to cancel expired order",
				"orderNo", order.OrderNo,
				"err", err,
			)
		} else {
			w.logger.InfoContext(ctx, "Cancelled expired order and restored stock",
				"orderNo", order.OrderNo,
			)
		}
	}
}

func (w *ExpiryWorker) cancelOrderAndRestoreStock(ctx context.Context, order db.GetStalePendingOrdersRow) error {
	tx, err := w.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := w.queries.WithTx(tx)

	// Fetch order items to restore stock
	items, err := qtx.GetOrderItems(ctx, order.ID)
	if err != nil {
		return err
	}

	for _, item := range items {
		if item.VariantID.Valid {
			if err := qtx.IncrementVariantStock(ctx, db.IncrementVariantStockParams{
				ID:    uuid.UUID(item.VariantID.Bytes),
				Stock: item.Quantity,
			}); err != nil {
				return err
			}
		}
	}

	// Update order status to dibatalkan
	_, err = qtx.UpdateOrderStatus(ctx, db.UpdateOrderStatusParams{
		ID:     order.ID,
		Status: string(gen.Dibatalkan),
	})
	if err != nil {
		return err
	}

	// Append to history
	cancelNote := "Pesanan dibatalkan otomatis setelah 48 jam tanpa konfirmasi pembayaran"
	historyID := w.idGen.New()
	_, err = qtx.AddOrderStatusHistory(ctx, db.AddOrderStatusHistoryParams{
		ID:      historyID,
		OrderID: order.ID,
		Status:  string(gen.Dibatalkan),
		Note:    database.StringPtrToText(&cancelNote),
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
