-- name: GetAdminByEmail :one
SELECT * FROM users
WHERE email = $1 AND role IN ('admin', 'staff')
LIMIT 1;

-- name: UpdateAdminLastLogin :exec
UPDATE users
SET last_login_at = now()
WHERE id = $1;

-- name: UpdateAdminPassword :exec
UPDATE users
SET password_hash = $2,
    must_change_password = false,
    updated_at = now()
WHERE id = $1;

-- name: RecordLoginFailure :exec
INSERT INTO admin_login_attempts (email, consecutive_failures, last_failure_at, locked_until)
VALUES ($1, 1, now(), NULL)
ON CONFLICT (email) DO UPDATE
SET consecutive_failures = admin_login_attempts.consecutive_failures + 1,
    last_failure_at = now(),
    locked_until = CASE
        WHEN admin_login_attempts.consecutive_failures + 1 >= 10 THEN now() + INTERVAL '15 minutes'
        ELSE NULL
    END;

-- name: GetLoginAttempts :one
SELECT * FROM admin_login_attempts
WHERE email = $1
LIMIT 1;

-- name: ResetLoginAttempts :exec
DELETE FROM admin_login_attempts
WHERE email = $1;

-- name: GetUserTOTP :one
SELECT * FROM user_totp
WHERE user_id = $1
LIMIT 1;

-- name: UpsertUserTOTP :exec
INSERT INTO user_totp (user_id, secret_enc, backup_codes_hash, confirmed_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id) DO UPDATE
SET secret_enc = $2,
    backup_codes_hash = $3,
    confirmed_at = $4;

-- name: DeleteUserTOTP :exec
DELETE FROM user_totp
WHERE user_id = $1;

-- name: CreateAdminSession :one
INSERT INTO sessions (
    id, user_id, family_id, token_hash, user_agent, ip, expires_at, is_admin_session, absolute_expires_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, true, $8
) RETURNING *;

-- name: GetSiteSetting :one
SELECT value FROM site_settings
WHERE key = $1
LIMIT 1;

-- name: ListSiteSettings :many
SELECT key, value, version, updated_by, updated_at FROM site_settings;

-- name: UpsertSiteSetting :exec
INSERT INTO site_settings (key, value, version, updated_by, updated_at)
VALUES ($1, $2, 1, $3, now())
ON CONFLICT (key) DO UPDATE
SET value = $2,
    version = site_settings.version + 1,
    updated_by = $3,
    updated_at = now();

-- name: InsertAuditLog :exec
INSERT INTO audit_log (
    id, at, actor_id, actor_email, actor_role, action, entity_type, entity_id, summary, before, after, ip, request_id
) VALUES (
    $1, now(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
);

-- name: ListAuditLogs :many
SELECT * FROM audit_log
WHERE (sqlc.narg('actor_id')::uuid IS NULL OR actor_id = sqlc.narg('actor_id'))
  AND (sqlc.narg('entity_type')::text IS NULL OR entity_type = sqlc.narg('entity_type'))
  AND (sqlc.narg('action')::text IS NULL OR action = sqlc.narg('action'))
ORDER BY at DESC
LIMIT $1 OFFSET $2;

-- name: CountAuditLogs :one
SELECT COUNT(*) FROM audit_log
WHERE (sqlc.narg('actor_id')::uuid IS NULL OR actor_id = sqlc.narg('actor_id'))
  AND (sqlc.narg('entity_type')::text IS NULL OR entity_type = sqlc.narg('entity_type'))
  AND (sqlc.narg('action')::text IS NULL OR action = sqlc.narg('action'));
