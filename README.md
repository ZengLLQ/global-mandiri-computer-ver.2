# Global Mandiri Computer (GMC) — Contract-First Storefront & Backend

Platform e-commerce katalog dan pemesanan hardware IT untuk **Global Mandiri Computer (GMC)**, berlokasi di **ITC Mega Grosir Lt. 2 Blok B/7, Surabaya, Jawa Timur**.

Sistem ini dirancang dengan standar keandalan tinggi dan **Zero Contract Drift** antara frontend **Next.js 16 (App Router, React 19, TypeScript)** dan backend **Go 1.23+ (Chi, pgx v5, sqlc, goose, oapi-codegen)**.

---

## 1. Arsitektur & Teknologi Information Teknis

```
gmc/
  api/
    cmd/
      api/main.go            # server CLI (`serve` and `healthcheck` subcommands)
      seed/main.go           # CSV catalog importer + admin bootstrap
    internal/
      platform/              # config, database, logger, httpx, security, ids, clock, whatsapp
      catalog/               # Product catalog, brands, categories, search facets
      cart/                  # Authoritative cart validation & sync
      checkout/              # Atomic checkout (SELECT ... FOR UPDATE), daily order sequence, background cancellation
      customers/             # Customer profile, addresses, wishlist
      auth/                  # Session family rotation, httpOnly cookies (gmc_at, gmc_rt), Argon2id
      contact/               # Inquiries with honeypot validation & newsletter
      gen/                   # oapi-codegen generated Go server & types (committed)
    db/
      migrations/*.sql       # goose SQL migrations (PostgreSQL 16)
      queries/*.sql          # sqlc SQL queries
      seed/products.csv      # Initial catalog data
    openapi.yaml             # Single source of truth (OpenAPI 3.1)
    sqlc.yaml                # sqlc configuration
    oapi-codegen.yaml        # oapi-codegen configuration
    Dockerfile               # Multi-stage build -> distroless static
  web/                       # Next.js 16 App Router Frontend
    src/app/api/[...path]/   # Streaming reverse proxy to Go backend
    src/lib/api/             # openapi-typescript generated types, openapi-fetch client, mappers
  scripts/
    smoke.sh                 # Full end-to-end API smoke test through proxy
  docker-compose.yml         # Multi-container orchestration (postgres, migrate, api, web)
  Makefile                   # Verification and build automation
  INTEGRATION_NOTES.md       # Architecture decisions, data map, and notes
```

### Prinsip Utama (Zero Contract Drift):
1. **Contract-First:** `api/openapi.yaml` adalah satu-satunya sumber kebenaran (*single source of truth*). Kode Go server types/interfaces dan TypeScript client types digenerate secara otomatis.
2. **Same-Origin di Browser:** Browser hanya berkomunikasi ke origin Next.js (`/api/*`), yang diproxy secara transparan ke Go backend via streaming proxy di `web/src/app/api/[...path]/route.ts`. Mencegah masalah CORS dan third-party cookie.
3. **Server Authority:** Backend Go adalah otoritas absolut untuk harga (`priceIdr`), reservasi stok (`SELECT ... FOR UPDATE`), penomoran pesanan (`GMC-YYMMDD-NNNN`), status transaksi, dan link WhatsApp.
4. **Machine-Verified:** Seluruh alur diverifikasi dengan unit test, race check, linter, dan script smoke test.

---

## 2. Menjalankan Aplikasi

### Opsi A: Docker Compose (Direkomendasikan)
Menjalankan seluruh stack (PostgreSQL 16, goose migrations, Go API, dan Next.js Web) dengan satu perintah:

```bash
# 1. Salin berkas environment
cp .env.example .env

# 2. Build dan jalankan seluruh container
docker compose up --build

# Untuk menyertakan data seeder produk dan admin bootstrap:
docker compose --profile seed up --build
```
Aplikasi web akan tersedia di `http://localhost:3000` dan API di `http://localhost:8080`.

---

### Opsi B: Development Lokal

#### 1. Prasyarat:
- Go 1.23+
- Node.js 20+ & npm / pnpm
- PostgreSQL 16 (atau gunakan container `postgres` dari docker-compose)

#### 2. Jalankan Go API Backend:
```bash
cd api
go run ./cmd/api serve
```
*API mendengarkan di `http://localhost:8080`.*

#### 3. Jalankan Next.js Frontend:
```bash
cd web
npm install
npm run dev
```
*Frontend mendengarkan di `http://localhost:3000`.*

---

## 3. Otomasi & Verifikasi (`make verify`)

Gunakan `Makefile` untuk memverifikasi integritas seluruh proyek:

```bash
# 1. Verifikasi menyeluruh (linter, codegen check, unit test, build frontend & backend)
make verify

# 2. Regenerasi kode dari OpenAPI spec (Go + TypeScript)
make gen

# 3. Cek tidak ada drift antara spec dan kode yang digenerate
make gen-check

# 4. Jalankan unit test Go (termasuk concurrency test stock reservation & idempotency)
make test

# 5. Jalankan automated smoke test end-to-end melalui proxy
make smoke
```

---

## 4. End-to-End Smoke Test (`scripts/smoke.sh`)

Script `scripts/smoke.sh` memverifikasi 10 alur transaksi melalui proxy Next.js:
1. Probe kesehatan (`GET /healthz` dan `/readyz`).
2. Pembacaan katalog produk (`GET /api/v1/products`).
3. Detail produk & varian (`GET /api/v1/products/{slug}`).
4. Validasi keranjang belanja berotoritas server (`POST /api/v1/cart/validate`).
5. Checkout guest dengan header `Idempotency-Key` (`POST /api/v1/checkout`).
6. Verifikasi idempotensi (pengiriman ulang payload menghasilkan nomor pesanan yang sama persis).
7. Pelacakan pesanan guest via `X-Order-Token` (`GET /api/v1/orders/{orderNo}`).
8. Pendaftaran akun pelanggan baru dan penerimaan HttpOnly cookie `gmc_at` / `gmc_rt` (`POST /api/v1/auth/register`).
9. Akses profil terlindungi menggunakan cookie yang diteruskan (`GET /api/v1/me`).
10. Rotasi token sesi dan pembaruan cookie (`POST /api/v1/auth/refresh`).

Jalankan smoke test saat stack aktif:
```bash
bash ./scripts/smoke.sh
```

---

## 5. Dokumentasi Integrasi

Rincian pemetaan data setiap halaman Next.js, penjelasan mapper data, dan catatan arsitektur dapat dibaca di berkas:
👉 `INTEGRATION_NOTES.md`
