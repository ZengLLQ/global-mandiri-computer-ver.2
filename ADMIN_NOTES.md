# ADMIN_NOTES.md: GMC Admin Panel engineering notes

Decisions, deviations, assumptions, and known limitations for the admin panel build.
Full plan: see the implementation plan artifact. This file is the in-repo record.

## Current-state findings (before the admin work)
- Monorepo: `api/` (Go, chi, pgx, sqlc, goose, oapi-codegen strict server), `web/` (Next.js 16.4, React 19.3, Tailwind v4 via `@tailwindcss/turbopack`, pnpm 11), `db/` (migrations, queries, seed CSV), `docker-compose.yml`.
- The public API is implemented by one composite `internal/server.Server` that satisfies `gen.StrictServerInterface`.
- Auth: HS256 JWT access cookie `gmc_at` (claims `sub`, `role`, `sid`), opaque refresh cookie `gmc_rt` with family rotation in `sessions`.
- Stock is decremented directly in `checkout/service.go` and restored in `checkout/worker.go`.
- Storefront chrome (AnnouncementBar, Header, CartDrawer, Footer, Lenis, the `template.tsx` page transition) lived in the root layout.

## Deviations from the spec
1. **No git repository in the workspace.** Route-group moves are plain moves (URLs unchanged). `make gen-check` used `git diff`; it now uses `scripts/gen-check.sh`, which regenerates into a temp dir and diffs against the committed output.
2. **No pre-existing Playwright suite.** `e2e/` is created first, with a storefront regression baseline that renders every public route with zero `console.error`. That baseline is the regression gate for later work.
3. **Admin codegen is tag-split.** Same single `api/openapi.yaml`; operations tagged `admin` are generated into `internal/gen/admingen`, and the public package excludes them. The public strict server stays unchanged.
4. **Font.** The spec suggests Inter 14px for admin. The admin uses the storefront's PP Neue Montreal at 14px for brand consistency (no extra font download).
5. **Next.js 16** instead of 15 (already installed); only stable APIs are used.
6. **Makefile uses pnpm** (the repo's package manager), not npm.

## Assumptions
- `staff` permissions are exactly as in spec §4; `admin` has all permissions.
- Admin access token TTL = `ACCESS_TTL` (15m). Admin refresh window (idle) = 2h, absolute = 12h.
- The persistent lockout counter lives in the `admin_login_attempts` table (keyed by lowercase email). The per-minute limit is in-memory per IP+email.
- `TOTP_ENC_KEY` must be 32 bytes base64. In development, if it's unset, a deterministic dev key derived from `JWT_SECRET` is used and a warning is logged. Production refuses to boot without it.

## Known limitations
- Milestone 1 is complete. Milestone 2 (Order processing & receipt generation) and Milestone 3 (Catalog & Inventory) will add subsequent endpoints and pages.

## Milestone 1: Foundations & Auth (COMPLETED)
- **Database**: Applied migration `002_admin_foundation.sql` (roles check, admin sessions, `user_totp` with AES-256-GCM encrypted secrets, `admin_login_attempts` with lockout after 5 consecutive failures, `audit_log` with PostgreSQL trigger preventing UPDATE/DELETE, `site_settings`).
- **Storefront Isolation**: Storefront chrome (Header, Footer, AnnouncementBar, Lenis, Framer Motion) was moved cleanly into `(store)/` route group with dedicated layout and template. Root layout remains minimal and clean.
- **Contract & Codegen**: Single contract `api/openapi.yaml` maintained with zero drift. Go admin types generated into `internal/gen/admingen`, public server types into `internal/gen`, TypeScript types into `web/src/lib/api/schema.d.ts`. Redocly lint passes with zero warnings.
- **Server Authority & RBAC**:
  - Boot-time RBAC check validates all admin operations against `OperationRequirements` table.
  - JWT claims include `adm: true`.
  - Database re-validation on every request ensures user is active with role `admin` or `staff`.
  - Sensitive keys (`password`, `token`, `secret`, `totp`, `backup`) redacted from audit logging.
- **Admin Frontend**:
  - `/admin/login`: Dark-themed login screen with 2FA TOTP / backup code verification step and Indonesian copy.
  - `/admin`: Dashboard with live counters for `pendingOrders`, `lowStockVariants`, and `unreadMessages`, plus operational shortcuts.
  - `/admin/account`: Admin profile view, password update form, and 2FA TOTP setup with QR code generation via `qrcode.react` and emergency recovery codes.
  - Command palette (`⌘K`) implemented using `cmdk` with keyboard shortcuts.
- **Automated Verification**:
  - Go unit tests: `internal/admin/rbac` (RBAC registration & permission rules), `internal/platform/security` (Argon2id, JWT, AES-256-GCM TOTP encryption & validation).
  - Playwright e2e test suite: 14 tests passing in 11.6s (11 storefront routes + 3 admin auth & navigation flows). Zero console errors. Zero contract drift.
