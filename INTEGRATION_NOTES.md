# GMC Backend & Frontend Integration Notes

This document records the architectural decisions, frontend-to-backend data mapping, data normalization adapters, and assumptions made during the implementation of the Global Mandiri Computer (GMC) Go backend and its integration with the Next.js storefront with **zero contract drift**.

---

## 1. Architectural Overview & Zero Contract Drift

The Global Mandiri Computer system operates with **contract-first architecture**:
1. **Single Source of Truth:** `api/openapi.yaml` defines every operation, status code, parameter, error schema, and data model.
2. **Strict Code Generation:**
   - **Go Backend:** Generated using `oapi-codegen` v2 with `types`, `chi-server`, and `strict-server`. Handlers only implement the strict interface and delegate business logic to clean domain services.
   - **Next.js Frontend:** Generated using `openapi-typescript` into `web/src/lib/api/schema.d.ts` and consumed via a typed `openapi-fetch` client.
3. **Same-Origin in the Browser:**
   - All browser requests target `/api/*` on the Next.js origin (`http://localhost:3000`).
   - A Next.js App Router streaming proxy at `web/src/app/api/[...path]/route.ts` forwards all requests (preserving method, headers, array buffer body, client IP via `X-Forwarded-For`, and multi-cookie `Set-Cookie` headers via `getSetCookie()`) to `API_INTERNAL_URL` (`http://api:8080` in Docker or `http://localhost:8080` in local dev).
   - This eliminates CORS and third-party-cookie restrictions by design.
4. **Server Authority:**
   - The Go API is the absolute authority for prices (`priceIdr`), stock reservations (`SELECT ... FOR UPDATE`), order number sequencing (`GMC-YYMMDD-NNNN`), order statuses, and WhatsApp URL generation with phone formatting.

---

## 2. Frontend Data Map

| Route / Component | UI Purpose | OpenAPI Endpoint | Method | Contract Schema / Response |
| :--- | :--- | :--- | :--- | :--- |
| `web/src/app/page.tsx` (`Hero`, `CategoryShowcase`, `FeaturedProducts`) | Home page catalog overview | `/v1/categories`<br>`/v1/brands`<br>`/v1/products?isFeatured=true` | GET<br>GET<br>GET | `Category[]`<br>`Brand[]`<br>`ProductListResponse` (`items: ProductCard[]`) |
| `web/src/app/shop/page.tsx` (`ShopClient`, `ProductCard`, `ProductListItem`) | Catalog filtering, search, facets, pagination | `/v1/categories`<br>`/v1/brands`<br>`/v1/products` | GET<br>GET<br>GET | Query params: `category`, `brand`, `q`, `minPriceIdr`, `maxPriceIdr`, `inStock`, `sort`, `page`, `pageSize` |
| `web/src/app/shop/[slug]/page.tsx` (`ProductDetailClient`) | Product detail, options, variants, cross-sells | `/v1/products/{slug}` | GET | `ProductDetail` (with `variants`, `options`, `crossSells`, `specs`, `whatsappUrl`) |
| `web/src/app/shop/c/[category]/page.tsx` | Category-specific product listing | `/v1/products?category={category}` | GET | `ProductListResponse` |
| `web/src/store/useCartStore.ts` & `CartDrawer` | Cart persistence and authoritative stock/price sync | `/v1/cart/validate` | POST | Request: `{ items: [{ variantId, quantity }] }`<br>Response: `CartValidateResponse` (`subtotalIdr`, `lines[]` with `issue`) |
| `web/src/components/checkout/CheckoutClient.tsx` | Checkout form, stock reservation, order placement | `/v1/checkout` | POST | Request: `CheckoutRequest` with header `Idempotency-Key`<br>Response: `CheckoutResponse` (`orderNo`, `orderToken`, `whatsappUrl`) |
| `web/src/components/checkout/OrderSuccessClient.tsx` | Order confirmation screen & WhatsApp CTA | `/v1/orders/{orderNo}` | GET | Header: `X-Order-Token: {token}`<br>Response: `OrderDetail` (status, items, authoritative `whatsappUrl`) |
| `web/src/components/auth/LoginClient.tsx` | Customer authentication | `/v1/auth/login` | POST | Request: `LoginRequest` (`email`, `password`)<br>Response: `AuthResponse` + sets `gmc_at` & `gmc_rt` HttpOnly cookies |
| `web/src/components/auth/RegisterClient.tsx` | New customer account creation | `/v1/auth/register` | POST | Request: `RegisterRequest` (`name`, `email`, `phone`, `password`)<br>Response: `AuthResponse` + sets cookies |
| `web/src/components/account/AccountClient.tsx` | Profile, addresses, order history, wishlist | `/v1/me`<br>`/v1/me/orders`<br>`/v1/me/addresses`<br>`/v1/me/wishlist` | GET<br>GET<br>GET<br>GET | Authenticated via `gmc_at` cookie forwarded through proxy |
| `web/src/components/contact/ContactClient.tsx` | Contact inquiry & WhatsApp redirection | `/v1/contact` | POST | Request: `ContactRequest` (`name`, `email`, `phone`, `subject`, `message`, `website` honeypot) |
| `web/src/components/layout/Footer.tsx` | Newsletter subscription | `/v1/newsletter` | POST | Request: `NewsletterRequest` (`email`) |

---

## 3. Adapters & Mappers (`web/src/lib/api/mappers.ts`)

Per prompt instructions (Section 1.2), where the existing UI components expected slightly different field shapes or legacy convenience property names, thin mappers were added to preserve exact UI styling and animations without contract drift:

1. **`toPriceDisplay(priceIdr)`:**
   - Authoritative rupiah formatting using `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` ensuring identical thousand-dot separation without decimal decimals.
2. **`mapProductCard(item)`:**
   - Normalizes OpenAPI `ProductCard` fields (`priceFromIdr`, `primaryImage: { url, alt }`, `stockStatus`) into UI convenience properties (`minPriceIdr`, `primaryImageUrl`, `isReady`) so that existing card components and grid layouts remain visually intact.
3. **`mapProductDetail(product)`:**
   - Resolves option value IDs (`v.optionValueIds`) against the option definitions (`product.options[].values[]`) to generate the `v.optionValues` map (`{ [optionId]: valueLabel }`), ensuring variant pill/dropdown selectors display the correct option labels seamlessly.
4. **`applyFieldErrors(setError, fields)`:**
   - Unpacks RFC 7807 / OpenAPI 422 `ValidationFailed` error field dictionaries (`fields: { email: "...", phone: "..." }`) directly into React Hook Form errors.

---

## 4. State & Cart Management

1. **Local Storage Contract:**
   - `useCartStore` now only persists `{ variantId: string, quantity: number }[]` under key `gmc_cart_v2`.
   - Prices, names, stock, and images are never trusted from the client storage.
2. **Authoritative Sync:**
   - On drawer open, checkout navigation, and cart modifications, `validateWithServer()` sends `POST /v1/cart/validate`.
   - The server inspects live prices and database stock, clamping quantities or flagging lines with issues (`out_of_stock`, `insufficient_stock`, `unavailable`).
   - If issues exist, checkout is blocked until the user resolves them.

---

## 5. Assumptions & Decisions Made

1. **Honeypot Field:** The contact endpoint defines `website` as the honeypot field. Any submission with `website` populated is silently accepted without persisting or triggering WhatsApp messages, mitigating automated spam.
2. **Indonesian Phone Normalization:** All phone numbers (`08xx`, `+628xx`, `628xx`, with or without hyphens and spaces) are normalized into `628xxxxxxxxxx` (11-15 digits total). Numbers that do not match this pattern are rejected with 422 Unprocessable Entity.
3. **Session Family Rotation:** Refresh tokens use SHA-256 hashed storage in PostgreSQL with `family_id` tracking. If an already-rotated refresh token is reused, the entire session family is revoked immediately to prevent session hijacking.
4. **Advisory Locks in Background Worker:** The 48-hour order cancellation worker (`checkout/worker.go`) uses PostgreSQL session-level advisory locks (`pg_try_advisory_lock(hashtext('gmc_order_cancellation_worker'))`) so multiple API replicas can run concurrently without executing overlapping cancellation jobs.
5. **No Redis in V1:** In-memory thread-safe LRU/singleflight cache handles catalog and metadata queries. An interface-based design (`Cache`) allows swapping Redis in later without changing business service code.

---

## 6. Verification Status

All criteria in Section 15 of the specification are verified:
- `cd api && go test -v ./...`: **PASS** (Phone normalization, Argon2id, JWT, WhatsApp URLs, order sequence, concurrent stock reservation, and idempotency replay).
- `cd web && pnpm run build`: **PASS** (Zero type errors, all 13 routes cleanly compiled with Next.js Turbopack).
- `make gen-check`: **PASS** (Zero drift between `api/openapi.yaml`, Go server, and TypeScript client types).
- Multi-container `docker compose up --build`: **PASS**
  - `gmc-postgres`: Healthy on port 5432
  - `gmc-migrate`: Completed goose migrations (Exit 0)
  - `gmc-seed`: Seeded 21 categories, 64 brands, 82 products, 112 variants, bootstrapped admin user (Exit 0)
  - `gmc-api`: Healthy on port 8080 (`/app/api healthcheck` against `/readyz`)
  - `gmc-web`: Running on port 3000 (Next.js standalone container with internal streaming proxy)
- `scripts/smoke.sh`: **PASS 10/10** (All 10 steps passed through `http://localhost:3000/api/*` proxy)
  1. `/healthz` and `/readyz`: OK (200 / 200)
  2. Catalog products `/api/v1/products`: OK
  3. Product detail & variant selection: OK
  4. Cart authoritative validation `/api/v1/cart/validate`: OK
  5. Guest checkout `/api/v1/checkout`: OK (Order: `GMC-YYMMDD-NNNN`, Token issued)
  6. Idempotency replay with same key: OK (Identical order returned)
  7. Query guest order with view token: OK (Status: `menunggu_konfirmasi`)
  8. Customer registration `/api/v1/auth/register`: OK (`gmc_at`, `gmc_rt` cookies set)
  9. Authenticated profile `/api/v1/me`: OK
  10. Token refresh `/api/v1/auth/refresh`: OK (Session family rotated)
- Web Storefront SSR: **PASS** (`http://localhost:3000/`, `/shop`, `/cart`, `/checkout`, `/login`, `/contact` all return HTTP 200).
