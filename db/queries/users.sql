-- name: CreateUser :one
INSERT INTO users (
    id, email, name, phone, password_hash, role
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1
LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1
LIMIT 1;

-- name: UpdateUserProfile :one
UPDATE users
SET name = COALESCE($2, name),
    phone = COALESCE($3, phone),
    email = COALESCE($4, email),
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateUserPassword :one
UPDATE users
SET password_hash = $2,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: CreateSession :one
INSERT INTO sessions (
    id, user_id, family_id, token_hash, user_agent, ip, expires_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetSessionByTokenHash :one
SELECT * FROM sessions
WHERE token_hash = $1
LIMIT 1;

-- name: RotateSession :one
UPDATE sessions
SET rotated_at = now(),
    replaced_by = $2
WHERE id = $1
RETURNING *;

-- name: RevokeSessionFamily :exec
UPDATE sessions
SET revoked_at = now()
WHERE family_id = $1 AND revoked_at IS NULL;

-- name: RevokeAllUserSessionsExcept :exec
UPDATE sessions
SET revoked_at = now()
WHERE user_id = $1 AND id != $2 AND revoked_at IS NULL;

-- name: RevokeSession :exec
UPDATE sessions
SET revoked_at = now()
WHERE id = $1;

-- name: ListAddressesByUserID :many
SELECT * FROM addresses
WHERE user_id = $1
ORDER BY is_default DESC, created_at DESC;

-- name: GetAddressByID :one
SELECT * FROM addresses
WHERE id = $1 AND user_id = $2
LIMIT 1;

-- name: UnsetDefaultAddresses :exec
UPDATE addresses
SET is_default = false
WHERE user_id = $1;

-- name: CreateAddress :one
INSERT INTO addresses (
    id, user_id, label, recipient_name, phone, street, city, province, postal_code, is_default
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: UpdateAddress :one
UPDATE addresses
SET label = COALESCE($3, label),
    recipient_name = COALESCE($4, recipient_name),
    phone = COALESCE($5, phone),
    street = COALESCE($6, street),
    city = COALESCE($7, city),
    province = COALESCE($8, province),
    postal_code = COALESCE($9, postal_code),
    is_default = COALESCE($10, is_default)
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteAddress :exec
DELETE FROM addresses
WHERE id = $1 AND user_id = $2;

-- name: GetWishlistProductIDs :many
SELECT product_id FROM wishlist_items
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: AddWishlistItem :exec
INSERT INTO wishlist_items (
    user_id, product_id
) VALUES (
    $1, $2
) ON CONFLICT (user_id, product_id) DO NOTHING;

-- name: RemoveWishlistItem :exec
DELETE FROM wishlist_items
WHERE user_id = $1 AND product_id = $2;
