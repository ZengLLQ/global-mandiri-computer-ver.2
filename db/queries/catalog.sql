-- name: ListCategories :many
SELECT
    c.id,
    c.slug,
    c.name,
    parent.slug AS parent_slug,
    c.sort_order,
    c.description,
    COALESCE(cnt.product_count, 0)::int AS product_count
FROM categories c
LEFT JOIN categories parent ON c.parent_id = parent.id
LEFT JOIN (
    SELECT category_id, COUNT(*) AS product_count
    FROM products
    WHERE is_active = true
    GROUP BY category_id
) cnt ON cnt.category_id = c.id
ORDER BY c.sort_order ASC, c.name ASC;

-- name: ListBrands :many
SELECT
    b.id,
    b.slug,
    b.name,
    COALESCE(cnt.product_count, 0)::int AS product_count
FROM brands b
LEFT JOIN (
    SELECT brand_id, COUNT(*) AS product_count
    FROM products
    WHERE is_active = true
    GROUP BY brand_id
) cnt ON cnt.brand_id = b.id
ORDER BY b.name ASC;

-- name: GetProductBySlug :one
SELECT
    p.id,
    p.slug,
    p.name,
    p.brand_id,
    b.id AS brand_id_val,
    b.slug AS brand_slug,
    b.name AS brand_name,
    p.category_id,
    c.id AS category_id_val,
    c.slug AS category_slug,
    c.name AS category_name,
    parent.slug AS category_parent_slug,
    p.summary,
    p.description,
    p.highlights,
    p.specs,
    p.is_featured,
    p.is_active,
    p.created_at,
    p.updated_at
FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN categories parent ON c.parent_id = parent.id
WHERE p.slug = $1 AND p.is_active = true
LIMIT 1;

-- name: GetProductImages :many
SELECT
    id,
    product_id,
    url,
    alt,
    width,
    height,
    sort_order,
    kind
FROM product_images
WHERE product_id = $1
ORDER BY sort_order ASC;

-- name: GetProductImagesByProductIDs :many
SELECT
    id,
    product_id,
    url,
    alt,
    width,
    height,
    sort_order,
    kind
FROM product_images
WHERE product_id = ANY($1::uuid[])
ORDER BY product_id, sort_order ASC;

-- name: GetProductOptions :many
SELECT
    id,
    product_id,
    name,
    sort_order,
    display
FROM product_options
WHERE product_id = $1
ORDER BY sort_order ASC;

-- name: GetProductOptionValues :many
SELECT
    pov.id,
    pov.option_id,
    pov.label,
    pov.swatch_hex,
    pov.sort_order
FROM product_option_values pov
JOIN product_options po ON pov.option_id = po.id
WHERE po.product_id = $1
ORDER BY pov.sort_order ASC;

-- name: GetProductVariants :many
SELECT
    v.id,
    v.product_id,
    v.sku,
    v.option_value_ids,
    v.price_idr,
    v.compare_at_price_idr,
    v.stock,
    v.is_preorder,
    v.is_active,
    v.image_id,
    pi.url AS image_url
FROM variants v
LEFT JOIN product_images pi ON v.image_id = pi.id
WHERE v.product_id = $1 AND v.is_active = true
ORDER BY v.price_idr ASC;

-- name: GetVariantBySKU :one
SELECT
    v.id,
    v.product_id,
    v.sku,
    v.option_value_ids,
    v.price_idr,
    v.compare_at_price_idr,
    v.stock,
    v.is_preorder,
    v.is_active,
    v.image_id,
    pi.url AS image_url,
    p.slug AS product_slug
FROM variants v
JOIN products p ON v.product_id = p.id
LEFT JOIN product_images pi ON v.image_id = pi.id
WHERE v.sku = $1 AND v.is_active = true
LIMIT 1;

-- name: GetVariantByID :one
SELECT
    v.id,
    v.product_id,
    v.sku,
    v.option_value_ids,
    v.price_idr,
    v.compare_at_price_idr,
    v.stock,
    v.is_preorder,
    v.is_active,
    v.image_id,
    pi.url AS image_url,
    p.slug AS product_slug,
    p.name AS product_name,
    b.name AS brand_name
FROM variants v
JOIN products p ON v.product_id = p.id
JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_images pi ON v.image_id = pi.id
WHERE v.id = $1
LIMIT 1;

-- name: GetVariantsByIDs :many
SELECT
    v.id,
    v.product_id,
    v.sku,
    v.option_value_ids,
    v.price_idr,
    v.compare_at_price_idr,
    v.stock,
    v.is_preorder,
    v.is_active,
    v.image_id,
    pi.url AS image_url,
    p.slug AS product_slug,
    p.name AS product_name,
    b.name AS brand_name
FROM variants v
JOIN products p ON v.product_id = p.id
JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_images pi ON v.image_id = pi.id
WHERE v.id = ANY($1::uuid[]);

-- name: GetCuratedRelatedProducts :many
SELECT
    p.id,
    p.slug,
    p.name,
    p.summary,
    p.is_featured,
    b.id AS brand_id,
    b.slug AS brand_slug,
    b.name AS brand_name,
    c.id AS category_id,
    c.slug AS category_slug,
    c.name AS category_name,
    parent.slug AS category_parent_slug
FROM related_products rp
JOIN products p ON rp.related_id = p.id
JOIN brands b ON p.brand_id = b.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN categories parent ON c.parent_id = parent.id
WHERE rp.product_id = $1 AND p.is_active = true
ORDER BY rp.sort_order ASC
LIMIT 8;

-- name: GetFallbackRelatedProducts :many
SELECT
    p.id,
    p.slug,
    p.name,
    p.summary,
    p.is_featured,
    b.id AS brand_id,
    b.slug AS brand_slug,
    b.name AS brand_name,
    c.id AS category_id,
    c.slug AS category_slug,
    c.name AS category_name,
    parent.slug AS category_parent_slug
FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN categories parent ON c.parent_id = parent.id
WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true
ORDER BY p.created_at DESC
LIMIT 8;
