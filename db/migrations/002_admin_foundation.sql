-- +goose Up
-- Admin foundation: roles, admin sessions, TOTP, login lockout, audit log, settings.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'staff', 'admin'));
ALTER TABLE users
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN last_login_at timestamptz,
  ADD COLUMN must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN internal_note text;
CREATE INDEX idx_users_role ON users(role) WHERE role <> 'customer';

ALTER TABLE sessions
  ADD COLUMN is_admin_session boolean NOT NULL DEFAULT false,
  ADD COLUMN absolute_expires_at timestamptz;

CREATE TABLE user_totp (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret_enc bytea NOT NULL,
  confirmed_at timestamptz,
  backup_codes_hash bytea[] NOT NULL DEFAULT '{}'
);

CREATE TABLE admin_login_attempts (
  email citext PRIMARY KEY,
  consecutive_failures int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_failure_at timestamptz
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES users(id),
  actor_email text NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  summary text NOT NULL,
  before jsonb,
  after jsonb,
  ip inet,
  request_id text
);
CREATE INDEX idx_audit_at ON audit_log(at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_id, at DESC);

-- +goose StatementBegin
CREATE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

CREATE TABLE site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  version int NOT NULL DEFAULT 1,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS site_settings;
DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
DROP TABLE IF EXISTS audit_log;
DROP FUNCTION IF EXISTS audit_log_immutable();
DROP TABLE IF EXISTS admin_login_attempts;
DROP TABLE IF EXISTS user_totp;
ALTER TABLE sessions DROP COLUMN IF EXISTS absolute_expires_at, DROP COLUMN IF EXISTS is_admin_session;
DROP INDEX IF EXISTS idx_users_role;
ALTER TABLE users
  DROP COLUMN IF EXISTS internal_note,
  DROP COLUMN IF EXISTS must_change_password,
  DROP COLUMN IF EXISTS last_login_at,
  DROP COLUMN IF EXISTS is_active;
UPDATE users SET role = 'customer' WHERE role = 'staff';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin'));
