-- name: GetCartItemsByUserID :many
SELECT
    ci.variant_id,
    ci.quantity
FROM cart_items ci
WHERE ci.user_id = $1;

-- name: UpsertCart :exec
INSERT INTO carts (user_id, updated_at)
VALUES ($1, now())
ON CONFLICT (user_id)
DO UPDATE SET updated_at = now();

-- name: DeleteCartItemsByUserID :exec
DELETE FROM cart_items
WHERE user_id = $1;

-- name: UpsertCartItem :exec
INSERT INTO cart_items (user_id, variant_id, quantity)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, variant_id)
DO UPDATE SET quantity = $3;
