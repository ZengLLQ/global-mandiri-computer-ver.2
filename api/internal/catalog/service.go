package catalog

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/cache"
	"github.com/gmc/api/internal/platform/database"
	"github.com/gmc/api/internal/platform/whatsapp"
)

type Service struct {
	pool           *pgxpool.Pool
	queries        *db.Queries
	cache          *cache.MemoryCache
	waNumber       string
	storeName      string
	siteURL        string
}

func NewService(pool *pgxpool.Pool, queries *db.Queries, cache *cache.MemoryCache, waNumber, storeName, siteURL string) *Service {
	return &Service{
		pool:      pool,
		queries:   queries,
		cache:     cache,
		waNumber:  waNumber,
		storeName: storeName,
		siteURL:   siteURL,
	}
}

// GetCategories returns all categories with product counts, cached for 5 minutes.
func (s *Service) GetCategories(ctx context.Context) ([]gen.Category, error) {
	cacheKey := "catalog:categories"
	if cached, ok := s.cache.Get(cacheKey); ok {
		if cats, ok := cached.([]gen.Category); ok {
			return cats, nil
		}
	}

	val, err, _ := s.cache.Group().Do(cacheKey, func() (any, error) {
		rows, err := s.queries.ListCategories(ctx)
		if err != nil {
			return nil, err
		}

		cats := make([]gen.Category, 0, len(rows))
		for _, row := range rows {
			cats = append(cats, gen.Category{
				Id:           row.ID,
				Slug:         row.Slug,
				Name:         row.Name,
				ParentSlug:   database.TextToStringPtr(row.ParentSlug),
				ProductCount: int(row.ProductCount),
			})
		}
		s.cache.Set(cacheKey, cats, 5*time.Minute)
		return cats, nil
	})

	if err != nil {
		return nil, err
	}
	return val.([]gen.Category), nil
}

// GetBrands returns all brands with product counts, cached for 5 minutes.
func (s *Service) GetBrands(ctx context.Context) ([]gen.Brand, error) {
	cacheKey := "catalog:brands"
	if cached, ok := s.cache.Get(cacheKey); ok {
		if brands, ok := cached.([]gen.Brand); ok {
			return brands, nil
		}
	}

	val, err, _ := s.cache.Group().Do(cacheKey, func() (any, error) {
		rows, err := s.queries.ListBrands(ctx)
		if err != nil {
			return nil, err
		}

		brands := make([]gen.Brand, 0, len(rows))
		for _, row := range rows {
			brands = append(brands, gen.Brand{
				Id:           row.ID,
				Slug:         row.Slug,
				Name:         row.Name,
				ProductCount: int(row.ProductCount),
			})
		}
		s.cache.Set(cacheKey, brands, 5*time.Minute)
		return brands, nil
	})

	if err != nil {
		return nil, err
	}
	return val.([]gen.Brand), nil
}

type ProductFilter struct {
	Q           *string
	Categories  []string
	Brands      []string
	MinPriceIdr *int64
	MaxPriceIdr *int64
	InStock     *bool
	Featured    *bool
	Sort        gen.ProductSort
	Page        int
	PageSize    int
}

// ComputeStockStatus determines stock status based on stock count and preorder flag.
func ComputeStockStatus(stock int, isPreorder bool) gen.StockStatus {
	if isPreorder {
		return gen.Preorder
	}
	if stock <= 0 {
		return gen.OutOfStock
	}
	if stock <= 3 {
		return gen.LowStock
	}
	return gen.InStock
}

// ListProducts lists and filters products, computing facets dynamically.
func (s *Service) ListProducts(ctx context.Context, filter ProductFilter) (*gen.ProductListResponse, error) {
	// Normalize pagination
	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 24
	}
	if pageSize > 60 {
		pageSize = 60
	}

	// Dynamic SQL query building with parameters to prevent SQL injection
	var whereClauses []string
	args := []any{}
	argIdx := 1

	whereClauses = append(whereClauses, "p.is_active = true")

	if filter.Featured != nil && *filter.Featured {
		whereClauses = append(whereClauses, "p.is_featured = true")
	}

	if filter.Q != nil && strings.TrimSpace(*filter.Q) != "" {
		q := strings.TrimSpace(*filter.Q)
		whereClauses = append(whereClauses, fmt.Sprintf(
			"(p.search_vector @@ websearch_to_tsquery('simple', $%d) OR similarity(p.name, $%d) > 0.3)",
			argIdx, argIdx,
		))
		args = append(args, q)
		argIdx++
	}

	if len(filter.Categories) > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("c.slug = ANY($%d)", argIdx))
		args = append(args, filter.Categories)
		argIdx++
	}

	if len(filter.Brands) > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("b.slug = ANY($%d)", argIdx))
		args = append(args, filter.Brands)
		argIdx++
	}

	if filter.MinPriceIdr != nil && *filter.MinPriceIdr > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("agg.min_price >= $%d", argIdx))
		args = append(args, *filter.MinPriceIdr)
		argIdx++
	}

	if filter.MaxPriceIdr != nil && *filter.MaxPriceIdr > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("agg.min_price <= $%d", argIdx))
		args = append(args, *filter.MaxPriceIdr)
		argIdx++
	}

	if filter.InStock != nil && *filter.InStock {
		whereClauses = append(whereClauses, "agg.total_stock > 0")
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Order by
	orderBy := "created_at DESC"
	switch filter.Sort {
	case gen.PriceAsc:
		orderBy = "min_price ASC"
	case gen.PriceDesc:
		orderBy = "min_price DESC"
	case gen.NameAsc:
		orderBy = "name ASC"
	case gen.Newest:
		orderBy = "created_at DESC"
	default:
		orderBy = "created_at DESC"
	}

	// Base CTE query with variant and image aggregations to avoid N+1
	baseQuery := fmt.Sprintf(`
		WITH product_aggregates AS (
			SELECT
				v.product_id,
				MIN(v.price_idr) AS min_price,
				MAX(v.price_idr) AS max_price,
				MIN(v.compare_at_price_idr) AS min_compare_price,
				SUM(v.stock) AS total_stock,
				BOOL_OR(v.is_preorder) AS has_preorder,
				COUNT(v.id) AS variant_count
			FROM variants v
			WHERE v.is_active = true
			GROUP BY v.product_id
		),
		filtered_products AS (
			SELECT
				p.id, p.slug, p.name, p.summary, p.is_featured, p.created_at,
				b.id AS brand_id, b.slug AS brand_slug, b.name AS brand_name,
				c.id AS category_id, c.slug AS category_slug, c.name AS category_name, parent.slug AS parent_category_slug,
				COALESCE(agg.min_price, 0) AS min_price,
				COALESCE(agg.max_price, 0) AS max_price,
				agg.min_compare_price,
				COALESCE(agg.total_stock, 0) AS total_stock,
				COALESCE(agg.has_preorder, false) AS has_preorder,
				COALESCE(agg.variant_count, 0) AS variant_count
			FROM products p
			JOIN brands b ON p.brand_id = b.id
			JOIN categories c ON p.category_id = c.id
			LEFT JOIN categories parent ON c.parent_id = parent.id
			LEFT JOIN product_aggregates agg ON p.id = agg.product_id
			WHERE %s
		)
	`, whereSQL)

	// Count total query
	countSQL := baseQuery + ` SELECT COUNT(*) FROM filtered_products;`
	var total int
	err := s.pool.QueryRow(ctx, countSQL, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count products: %w", err)
	}

	totalPages := 0
	if total > 0 {
		totalPages = (total + pageSize - 1) / pageSize
	}

	items := make([]gen.ProductCard, 0, pageSize)
	if total > 0 && page <= totalPages {
		offset := (page - 1) * pageSize
		selectSQL := fmt.Sprintf(`%s
			SELECT
				id, slug, name, summary, is_featured,
				brand_id, brand_slug, brand_name,
				category_id, category_slug, category_name, parent_category_slug,
				min_price, max_price, min_compare_price, total_stock, has_preorder, variant_count
			FROM filtered_products
			ORDER BY %s
			LIMIT %d OFFSET %d;
		`, baseQuery, orderBy, pageSize, offset)

		rows, err := s.pool.Query(ctx, selectSQL, args...)
		if err != nil {
			return nil, fmt.Errorf("failed to query products: %w", err)
		}
		defer rows.Close()

		var productIDs []uuid.UUID
		type rawRow struct {
			card gen.ProductCard
		}
		var rawRows []rawRow

		for rows.Next() {
			var (
				id, brandID, catID                           uuid.UUID
				slug, name, summary, brandSlug, brandName    string
				catSlug, catName                             string
				parentCatSlug                                *string
				isFeatured, hasPreorder                      bool
				minPrice, maxPrice                           int64
				minComparePrice                              *int64
				totalStock, variantCount                     int
			)

			if err := rows.Scan(
				&id, &slug, &name, &summary, &isFeatured,
				&brandID, &brandSlug, &brandName,
				&catID, &catSlug, &catName, &parentCatSlug,
				&minPrice, &maxPrice, &minComparePrice, &totalStock, &hasPreorder, &variantCount,
			); err != nil {
				return nil, err
			}

			productIDs = append(productIDs, id)
			stockStatus := ComputeStockStatus(totalStock, hasPreorder)

			card := gen.ProductCard{
				Id:                    id,
				Slug:                  slug,
				Name:                  name,
				Summary:               summary,
				IsFeatured:            isFeatured,
				HasVariants:           variantCount > 1,
				StockStatus:           stockStatus,
				PriceFromIdr:          minPrice,
				PriceToIdr:            maxPrice,
				CompareAtPriceFromIdr: minComparePrice,
				Brand: gen.Brand{
					Id:   brandID,
					Slug: brandSlug,
					Name: brandName,
				},
				Category: gen.Category{
					Id:         catID,
					Slug:       catSlug,
					Name:       catName,
					ParentSlug: parentCatSlug,
				},
				Images: []gen.Image{},
			}
			rawRows = append(rawRows, rawRow{card: card})
		}

		// Fetch up to 2 images per product
		if len(productIDs) > 0 {
			imagesRows, err := s.queries.GetProductImagesByProductIDs(ctx, productIDs)
			if err == nil {
				imageMap := make(map[uuid.UUID][]gen.Image)
				for _, img := range imagesRows {
					if len(imageMap[img.ProductID]) < 2 {
						imageMap[img.ProductID] = append(imageMap[img.ProductID], gen.Image{
							Url:    img.Url,
							Alt:    img.Alt,
							Width:  database.Int4ToIntPtr(img.Width),
							Height: database.Int4ToIntPtr(img.Height),
							Kind:   gen.ImageKind(img.Kind),
						})
					}
				}
				for i := range rawRows {
					if imgs, ok := imageMap[rawRows[i].card.Id]; ok {
						rawRows[i].card.Images = imgs
					}
				}
			}
		}

		for _, rr := range rawRows {
			items = append(items, rr.card)
		}
	}

	// Facets computation
	facets, err := s.computeFacets(ctx, filter)
	if err != nil {
		facets = gen.Facets{
			Categories: []gen.FacetCount{},
			Brands:     []gen.FacetCount{},
			PriceRange: gen.PriceRange{MinIdr: 0, MaxIdr: 0},
		}
	}

	return &gen.ProductListResponse{
		Items:      items,
		Page:       page,
		PageSize:   pageSize,
		Total:      total,
		TotalPages: totalPages,
		Facets:     facets,
	}, nil
}

func (s *Service) computeFacets(ctx context.Context, f ProductFilter) (gen.Facets, error) {
	// Category facets
	catRows, err := s.pool.Query(ctx, `
		SELECT c.slug, COUNT(p.id)::int
		FROM categories c
		JOIN products p ON c.id = p.category_id AND p.is_active = true
		GROUP BY c.slug
		ORDER BY c.slug ASC
	`)
	catFacets := []gen.FacetCount{}
	if err == nil {
		defer catRows.Close()
		for catRows.Next() {
			var fc gen.FacetCount
			if err := catRows.Scan(&fc.Slug, &fc.Count); err == nil {
				catFacets = append(catFacets, fc)
			}
		}
	}

	// Brand facets
	brandRows, err := s.pool.Query(ctx, `
		SELECT b.slug, COUNT(p.id)::int
		FROM brands b
		JOIN products p ON b.id = p.brand_id AND p.is_active = true
		GROUP BY b.slug
		ORDER BY b.slug ASC
	`)
	brandFacets := []gen.FacetCount{}
	if err == nil {
		defer brandRows.Close()
		for brandRows.Next() {
			var fc gen.FacetCount
			if err := brandRows.Scan(&fc.Slug, &fc.Count); err == nil {
				brandFacets = append(brandFacets, fc)
			}
		}
	}

	// Price range
	var minIdr, maxIdr *int64
	_ = s.pool.QueryRow(ctx, `
		SELECT MIN(price_idr), MAX(price_idr)
		FROM variants
		WHERE is_active = true
	`).Scan(&minIdr, &maxIdr)

	var minVal, maxVal int64
	if minIdr != nil {
		minVal = *minIdr
	}
	if maxIdr != nil {
		maxVal = *maxIdr
	}

	return gen.Facets{
		Categories: catFacets,
		Brands:     brandFacets,
		PriceRange: gen.PriceRange{
			MinIdr: minVal,
			MaxIdr: maxVal,
		},
	}, nil
}

// GetProductBySlug returns the complete ProductDetail with all variants, options, and WhatsApp URL.
func (s *Service) GetProductBySlug(ctx context.Context, slug string) (*gen.ProductDetail, error) {
	cacheKey := fmt.Sprintf("catalog:product:%s", slug)
	if cached, ok := s.cache.Get(cacheKey); ok {
		if detail, ok := cached.(*gen.ProductDetail); ok {
			return detail, nil
		}
	}

	val, err, _ := s.cache.Group().Do(cacheKey, func() (any, error) {
		prod, err := s.queries.GetProductBySlug(ctx, slug)
		if err != nil {
			return nil, err
		}

		// Options and Values
		optionsRows, err := s.queries.GetProductOptions(ctx, prod.ID)
		if err != nil {
			return nil, err
		}
		valuesRows, err := s.queries.GetProductOptionValues(ctx, prod.ID)
		if err != nil {
			return nil, err
		}

		valuesByOption := make(map[uuid.UUID][]gen.ProductOptionValue)
		for _, v := range valuesRows {
			valuesByOption[v.OptionID] = append(valuesByOption[v.OptionID], gen.ProductOptionValue{
				Id:        v.ID,
				Label:     v.Label,
				SwatchHex: database.TextToStringPtr(v.SwatchHex),
			})
		}

		options := make([]gen.ProductOption, 0, len(optionsRows))
		for _, o := range optionsRows {
			vals := valuesByOption[o.ID]
			if vals == nil {
				vals = []gen.ProductOptionValue{}
			}
			options = append(options, gen.ProductOption{
				Id:      o.ID,
				Name:    o.Name,
				Display: gen.ProductOptionDisplay(o.Display),
				Values:  vals,
			})
		}

		// Variants
		varRows, err := s.queries.GetProductVariants(ctx, prod.ID)
		if err != nil {
			return nil, err
		}

		var (
			minPrice, maxPrice int64
			minComparePrice    *int64
			totalStock         int
			hasPreorder        bool
		)

		variants := make([]gen.ProductVariant, 0, len(varRows))
		for i, v := range varRows {
			if i == 0 || v.PriceIdr < minPrice {
				minPrice = v.PriceIdr
			}
			if i == 0 || v.PriceIdr > maxPrice {
				maxPrice = v.PriceIdr
			}
			cmpPtr := database.Int8ToInt64Ptr(v.CompareAtPriceIdr)
			if cmpPtr != nil {
				if minComparePrice == nil || *cmpPtr < *minComparePrice {
					minComparePrice = cmpPtr
				}
			}
			totalStock += int(v.Stock)
			if v.IsPreorder {
				hasPreorder = true
			}

			variantStockStatus := ComputeStockStatus(int(v.Stock), v.IsPreorder)

			variants = append(variants, gen.ProductVariant{
				Id:                v.ID,
				Sku:               v.Sku,
				OptionValueIds:    v.OptionValueIds,
				PriceIdr:          v.PriceIdr,
				CompareAtPriceIdr: cmpPtr,
				Stock:             int(v.Stock),
				StockStatus:       variantStockStatus,
				ImageUrl:          database.TextToStringPtr(v.ImageUrl),
			})
		}

		// Images
		imgRows, err := s.queries.GetProductImages(ctx, prod.ID)
		if err != nil {
			return nil, err
		}
		images := make([]gen.Image, 0, len(imgRows))
		for _, img := range imgRows {
			images = append(images, gen.Image{
				Url:    img.Url,
				Alt:    img.Alt,
				Width:  database.Int4ToIntPtr(img.Width),
				Height: database.Int4ToIntPtr(img.Height),
				Kind:   gen.ImageKind(img.Kind),
			})
		}

		// Specs json parse
		specsMap := make(map[string]string)
		if len(prod.Specs) > 0 {
			_ = json.Unmarshal(prod.Specs, &specsMap)
		}

		// WhatsApp URL
		productURL := fmt.Sprintf("%s/shop/%s", s.siteURL, prod.Slug)
		waURL := whatsapp.BuildProductInquiryURL(s.waNumber, s.storeName, prod.Name, productURL)

		detail := &gen.ProductDetail{
			Id:                    prod.ID,
			Slug:                  prod.Slug,
			Name:                  prod.Name,
			Summary:               prod.Summary,
			Description:           prod.Description,
			Highlights:            prod.Highlights,
			Specs:                 specsMap,
			IsFeatured:            prod.IsFeatured,
			HasVariants:           len(variants) > 1,
			StockStatus:           ComputeStockStatus(totalStock, hasPreorder),
			PriceFromIdr:          minPrice,
			PriceToIdr:            maxPrice,
			CompareAtPriceFromIdr: minComparePrice,
			Brand: gen.Brand{
				Id:   prod.BrandIDVal,
				Slug: prod.BrandSlug,
				Name: prod.BrandName,
			},
			Category: gen.Category{
				Id:         prod.CategoryIDVal,
				Slug:       prod.CategorySlug,
				Name:       prod.CategoryName,
				ParentSlug: database.TextToStringPtr(prod.CategoryParentSlug),
			},
			Options:     options,
			Variants:    variants,
			Images:      images,
			WhatsappUrl: waURL,
		}

		s.cache.Set(cacheKey, detail, 60*time.Second)
		return detail, nil
	})

	if err != nil {
		return nil, err
	}
	return val.(*gen.ProductDetail), nil
}

// GetRelatedProducts returns up to 8 related product cards, falling back to same category.
func (s *Service) GetRelatedProducts(ctx context.Context, slug string) ([]gen.ProductCard, error) {
	prod, err := s.queries.GetProductBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	curated, err := s.queries.GetCuratedRelatedProducts(ctx, prod.ID)
	if err != nil {
		return nil, err
	}

	var candidateIDs []uuid.UUID
	for _, c := range curated {
		candidateIDs = append(candidateIDs, c.ID)
	}

	if len(candidateIDs) < 4 {
		fallback, err := s.queries.GetFallbackRelatedProducts(ctx, db.GetFallbackRelatedProductsParams{
			CategoryID: prod.CategoryID,
			ID:         prod.ID,
		})
		if err == nil {
			for _, fb := range fallback {
				if len(candidateIDs) >= 8 {
					break
				}
				candidateIDs = append(candidateIDs, fb.ID)
			}
		}
	}

	if len(candidateIDs) == 0 {
		return []gen.ProductCard{}, nil
	}

	// Fetch cards
	res, err := s.ListProducts(ctx, ProductFilter{
		Page:     1,
		PageSize: 8,
	})
	if err != nil {
		return []gen.ProductCard{}, nil
	}

	idMap := make(map[uuid.UUID]bool)
	for _, cid := range candidateIDs {
		idMap[cid] = true
	}

	var results []gen.ProductCard
	for _, item := range res.Items {
		if idMap[item.Id] {
			results = append(results, item)
		}
	}
	return results, nil
}

// ResolveVariant resolves a variant by SKU or optionValueIds.
func (s *Service) ResolveVariant(ctx context.Context, sku *string, productSlug *string, optionValueIDsStr *string) (*gen.ResolvedVariant, error) {
	if sku != nil && strings.TrimSpace(*sku) != "" {
		v, err := s.queries.GetVariantBySKU(ctx, strings.TrimSpace(*sku))
		if err != nil {
			return nil, err
		}
		return &gen.ResolvedVariant{
			ProductSlug: v.ProductSlug,
			Variant: gen.ProductVariant{
				Id:                v.ID,
				Sku:               v.Sku,
				OptionValueIds:    v.OptionValueIds,
				PriceIdr:          v.PriceIdr,
				CompareAtPriceIdr: database.Int8ToInt64Ptr(v.CompareAtPriceIdr),
				Stock:             int(v.Stock),
				StockStatus:       ComputeStockStatus(int(v.Stock), v.IsPreorder),
				ImageUrl:          database.TextToStringPtr(v.ImageUrl),
			},
		}, nil
	}

	if productSlug != nil && optionValueIDsStr != nil {
		detail, err := s.GetProductBySlug(ctx, *productSlug)
		if err != nil {
			return nil, err
		}

		targetIDs := strings.Split(*optionValueIDsStr, ",")
		sort.Strings(targetIDs)

		for _, v := range detail.Variants {
			var ids []string
			for _, id := range v.OptionValueIds {
				ids = append(ids, id.String())
			}
			sort.Strings(ids)

			if strings.Join(ids, ",") == strings.Join(targetIDs, ",") {
				return &gen.ResolvedVariant{
					ProductSlug: detail.Slug,
					Variant:     v,
				}, nil
			}
		}
	}

	return nil, pgx.ErrNoRows
}

func intPointer(val *int32) *int {
	if val == nil {
		return nil
	}
	v := int(*val)
	return &v
}
