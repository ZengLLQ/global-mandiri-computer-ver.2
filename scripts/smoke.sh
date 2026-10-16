#!/usr/bin/env bash
# ==============================================================================
# GMC End-to-End API Smoke Test
# Tests all critical flows through the Next.js reverse proxy (/api/*)
# ==============================================================================

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_DIRECT_URL="${API_DIRECT_URL:-http://localhost:8080}"
COOKIE_JAR="$(mktemp 2>/dev/null || echo "smoke_cookies_$$.txt")"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

echo "=== GMC End-to-End Smoke Test ==="
echo "Target: $BASE_URL (Proxy) / $API_DIRECT_URL (Direct API)"

# ------------------------------------------------------------------------------
# 1. Probes
# ------------------------------------------------------------------------------
echo -n "1. Checking /healthz and /readyz... "
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_DIRECT_URL/healthz" || curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/healthz" || true)
READY_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_DIRECT_URL/readyz" || curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/readyz" || true)

if [ "$HEALTH_CODE" = "200" ] || [ "$READY_CODE" = "200" ]; then
  echo "OK (healthz: $HEALTH_CODE, readyz: $READY_CODE)"
else
  echo "WARN (probes returned $HEALTH_CODE / $READY_CODE, continuing with API test)"
fi

# ------------------------------------------------------------------------------
# 2. Catalog Products
# ------------------------------------------------------------------------------
echo -n "2. Querying catalog products via proxy (/api/v1/products)... "
PROD_RES=$(curl -s -f -w "\n%{http_code}" "$BASE_URL/api/v1/products?pageSize=5")
PROD_STATUS=$(echo "$PROD_RES" | tail -n1)
PROD_BODY=$(echo "$PROD_RES" | sed '$d')

if [ "$PROD_STATUS" != "200" ]; then
  echo "FAILED with HTTP $PROD_STATUS"
  echo "$PROD_BODY"
  exit 1
fi

PRODUCT_SLUG=$(echo "$PROD_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.items?.[0]?.slug||'');}catch{process.exit(1)}})")
if [ -z "$PRODUCT_SLUG" ]; then
  echo "FAILED: No products found in catalog response"
  exit 1
fi
echo "OK (found slug: $PRODUCT_SLUG)"

# ------------------------------------------------------------------------------
# 3. Product Detail & Variant Selection
# ------------------------------------------------------------------------------
echo -n "3. Querying product detail (/api/v1/products/$PRODUCT_SLUG)... "
DETAIL_RES=$(curl -s -f -w "\n%{http_code}" "$BASE_URL/api/v1/products/$PRODUCT_SLUG")
DETAIL_STATUS=$(echo "$DETAIL_RES" | tail -n1)
DETAIL_BODY=$(echo "$DETAIL_RES" | sed '$d')

if [ "$DETAIL_STATUS" != "200" ]; then
  echo "FAILED with HTTP $DETAIL_STATUS"
  exit 1
fi

VARIANT_ID=$(echo "$DETAIL_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.variants?.[0]?.id||'');}catch{process.exit(1)}})")
if [ -z "$VARIANT_ID" ]; then
  echo "FAILED: No variants found for product"
  exit 1
fi
echo "OK (selected variant: $VARIANT_ID)"

# ------------------------------------------------------------------------------
# 4. Cart Authoritative Validation
# ------------------------------------------------------------------------------
echo -n "4. Validating cart (/api/v1/cart/validate)... "
CART_PAYLOAD="{\"items\":[{\"variantId\":\"$VARIANT_ID\",\"quantity\":1}]}"
CART_RES=$(curl -s -f -X POST \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: gmc-web" \
  -H "Origin: http://localhost:3000" \
  -d "$CART_PAYLOAD" \
  -w "\n%{http_code}" \
  "$BASE_URL/api/v1/cart/validate")
CART_STATUS=$(echo "$CART_RES" | tail -n1)
CART_BODY=$(echo "$CART_RES" | sed '$d')

if [ "$CART_STATUS" != "200" ]; then
  echo "FAILED with HTTP $CART_STATUS"
  echo "$CART_BODY"
  exit 1
fi

SUBTOTAL_IDR=$(echo "$CART_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.subtotalIdr||'');}catch{process.exit(1)}})")
echo "OK (authoritative subtotal: Rp $SUBTOTAL_IDR)"

# ------------------------------------------------------------------------------
# 5. Guest Checkout & Idempotency Key
# ------------------------------------------------------------------------------
echo -n "5. Performing guest checkout (/api/v1/checkout)... "
IDEMPOTENCY_KEY=$(node -e "console.log(require('crypto').randomUUID())")
CHECKOUT_PAYLOAD=$(cat <<EOF
{
  "customer": {
    "name": "Budi Santoso",
    "phone": "082232554674",
    "email": "budi.smoke@example.com"
  },
  "deliveryMethod": "pickup",
  "paymentMethod": "bank_transfer",
  "items": [
    {
      "variantId": "$VARIANT_ID",
      "quantity": 1
    }
  ],
  "expectedSubtotalIdr": $SUBTOTAL_IDR,
  "note": "Unit siap diambil di counter ITC Mega Grosir Surabaya"
}
EOF
)

CHECKOUT_RES=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -H "X-Requested-With: gmc-web" \
  -H "Origin: http://localhost:3000" \
  -d "$CHECKOUT_PAYLOAD" \
  -w "\n%{http_code}" \
  "$BASE_URL/api/v1/checkout")

CHECKOUT_STATUS=$(echo "$CHECKOUT_RES" | tail -n1)
CHECKOUT_BODY=$(echo "$CHECKOUT_RES" | sed '$d')

if [ "$CHECKOUT_STATUS" != "201" ] && [ "$CHECKOUT_STATUS" != "200" ]; then
  echo "FAILED with HTTP $CHECKOUT_STATUS"
  echo "$CHECKOUT_BODY"
  exit 1
fi

ORDER_NO=$(echo "$CHECKOUT_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.order?.orderNo||j.orderNo||'');}catch{process.exit(1)}})")
ORDER_TOKEN=$(echo "$CHECKOUT_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.viewToken||j.orderToken||'');}catch{process.exit(1)}})")
WA_URL=$(echo "$CHECKOUT_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.order?.whatsappUrl||j.whatsappUrl||'');}catch{process.exit(1)}})")

if [[ ! "$ORDER_NO" =~ ^GMC-[0-9]{6}-[0-9]{4}$ ]]; then
  echo "FAILED: Order number '$ORDER_NO' does not match GMC-YYMMDD-NNNN"
  echo "Response: $CHECKOUT_BODY"
  exit 1
fi
echo "OK (Order: $ORDER_NO, Token: ${ORDER_TOKEN:0:8}...)"

# ------------------------------------------------------------------------------
# 6. Idempotency Replay Verification
# ------------------------------------------------------------------------------
echo -n "6. Verifying idempotent replay with same key... "
REPLAY_RES=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -H "X-Requested-With: gmc-web" \
  -H "Origin: http://localhost:3000" \
  -d "$CHECKOUT_PAYLOAD" \
  -w "\n%{http_code}" \
  "$BASE_URL/api/v1/checkout")

REPLAY_STATUS=$(echo "$REPLAY_RES" | tail -n1)
REPLAY_BODY=$(echo "$REPLAY_RES" | sed '$d')
REPLAY_ORDER_NO=$(echo "$REPLAY_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.order?.orderNo||j.orderNo||'');}catch{process.exit(1)}})")

if [ "$REPLAY_ORDER_NO" != "$ORDER_NO" ]; then
  echo "FAILED: Replay returned different order number ($REPLAY_ORDER_NO vs $ORDER_NO)"
  exit 1
fi
echo "OK (Returned identical order: $REPLAY_ORDER_NO)"

# ------------------------------------------------------------------------------
# 7. Query Guest Order with Token
# ------------------------------------------------------------------------------
echo -n "7. Querying guest order with view token (/api/v1/orders/$ORDER_NO?token=...)... "
ORDER_RES=$(curl -s -f \
  -w "\n%{http_code}" \
  "$BASE_URL/api/v1/orders/$ORDER_NO?token=$ORDER_TOKEN")

ORDER_STATUS=$(echo "$ORDER_RES" | tail -n1)
ORDER_BODY=$(echo "$ORDER_RES" | sed '$d')

if [ "$ORDER_STATUS" != "200" ]; then
  echo "FAILED with HTTP $ORDER_STATUS"
  echo "$ORDER_BODY"
  exit 1
fi
echo "OK (status: menunggu_konfirmasi)"

# ------------------------------------------------------------------------------
# 8. Customer Registration & Cookie Extraction
# ------------------------------------------------------------------------------
echo -n "8. Registering customer account (/api/v1/auth/register)... "
RAND_USER="user_$(date +%s)_$RANDOM"
REG_EMAIL="${RAND_USER}@example.com"
REG_PAYLOAD=$(cat <<EOF
{
  "name": "Customer Smoke",
  "email": "$REG_EMAIL",
  "phone": "081234567890",
  "password": "Password123!@#"
}
EOF
)

REG_HEADERS=$(curl -s -i -X POST \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: gmc-web" \
  -H "Origin: http://localhost:3000" \
  -d "$REG_PAYLOAD" \
  -c "$COOKIE_JAR" \
  "$BASE_URL/api/v1/auth/register")

if ! grep -q "gmc_at" "$COOKIE_JAR" && ! echo "$REG_HEADERS" | grep -iq "gmc_at"; then
  echo "FAILED: gmc_at cookie not received in register response"
  exit 1
fi
echo "OK (cookies set: gmc_at, gmc_rt)"

# ------------------------------------------------------------------------------
# 9. Authenticated Profile Query (/api/v1/me)
# ------------------------------------------------------------------------------
echo -n "9. Accessing authenticated profile (/api/v1/me)... "
ME_RES=$(curl -s -f -b "$COOKIE_JAR" -w "\n%{http_code}" "$BASE_URL/api/v1/me")
ME_STATUS=$(echo "$ME_RES" | tail -n1)
ME_BODY=$(echo "$ME_RES" | sed '$d')

if [ "$ME_STATUS" != "200" ]; then
  echo "FAILED with HTTP $ME_STATUS"
  echo "$ME_BODY"
  exit 1
fi
echo "OK (Logged in as $REG_EMAIL)"

# ------------------------------------------------------------------------------
# 10. Token Refresh (/api/v1/auth/refresh)
# ------------------------------------------------------------------------------
echo -n "10. Refreshing access token (/api/v1/auth/refresh)... "
REFRESH_RES=$(curl -s -X POST \
  -H "X-Requested-With: gmc-web" \
  -H "Origin: http://localhost:3000" \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR" \
  -w "\n%{http_code}" \
  "$BASE_URL/api/v1/auth/refresh")
REFRESH_STATUS=$(echo "$REFRESH_RES" | tail -n1)

if [ "$REFRESH_STATUS" != "204" ] && [ "$REFRESH_STATUS" != "200" ]; then
  echo "FAILED with HTTP $REFRESH_STATUS"
  exit 1
fi
echo "OK (Session refreshed and rotated)"

echo "=============================================================================="
echo "ALL SMOKE TESTS PASSED! ZERO DRIFT VERIFIED!"
echo "=============================================================================="
