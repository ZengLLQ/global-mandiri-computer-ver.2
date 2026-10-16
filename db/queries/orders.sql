-- name: GetNextOrderSequence :one
INSERT INTO order_counters (day, last_seq)
VALUES ($1, 1)
ON CONFLICT (day)
DO UPDATE SET last_seq = order_counters.last_seq + 1
RETURNING last_seq;

-- name: LockVariantsForUpdate :many
SELECT id, product_id, sku, price_idr, stock, is_preorder, is_active
FROM variants
WHERE id = ANY($1::uuid[])
ORDER BY id ASC
FOR UPDATE;

-- name: DecrementVariantStock :exec
UPDATE variants
SET stock = stock - $2
WHERE id = $1;

-- name: IncrementVariantStock :exec
UPDATE variants
SET stock = stock + $2
WHERE id = $1;

-- name: CreateOrder :one
INSERT INTO orders (
    id, order_no, user_id, customer_name, customer_phone, customer_email,
    delivery_method, shipping_address, payment_method, note,
    subtotal_idr, shipping_idr, total_idr, status,
    view_token_hash, idempotency_key, request_hash
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
) RETURNING *;

-- name: CreateOrderItem :one
INSERT INTO order_items (
    id, order_id, variant_id, product_slug, sku,
    name, brand, variant_label, image_url,
    unit_price_idr, quantity, line_total_idr
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING *;

-- name: AddOrderStatusHistory :one
INSERT INTO order_status_history (
    id, order_id, status, note
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetOrderByNumber :one
SELECT * FROM orders
WHERE order_no = $1
LIMIT 1;

-- name: GetOrderByID :one
SELECT * FROM orders
WHERE id = $1
LIMIT 1;

-- name: GetOrderItems :many
SELECT * FROM order_items
WHERE order_id = $1;

-- name: GetOrderStatusHistory :many
SELECT * FROM order_status_history
WHERE order_id = $1
ORDER BY created_at ASC;

-- name: ListOrdersByUserID :many
SELECT * FROM orders
WHERE user_id = $1
  AND ($2::text IS NULL OR status = $2)
  AND ($3::text IS NULL OR order_no ILIKE $3 || '%')
ORDER BY created_at DESC
LIMIT $4 OFFSET $5;

-- name: CountOrdersByUserID :one
SELECT COUNT(*) FROM orders
WHERE user_id = $1
  AND ($2::text IS NULL OR status = $2)
  AND ($3::text IS NULL OR order_no ILIKE $3 || '%');

-- name: UpdateOrderStatus :one
UPDATE orders
SET status = $2,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: GetIdempotencyKey :one
SELECT request_hash, response, status_code
FROM idempotency_keys
WHERE key = $1
LIMIT 1;

-- name: InsertIdempotencyKey :exec
INSERT INTO idempotency_keys (
    key, request_hash, response, status_code
) VALUES (
    $1, $2, $3, $4
) ON CONFLICT (key) DO NOTHING;

-- name: GetStalePendingOrders :many
SELECT id, order_no
FROM orders
WHERE status = 'menunggu_konfirmasi'
  AND created_at < now() - INTERVAL '48 hours'
LIMIT 100;
