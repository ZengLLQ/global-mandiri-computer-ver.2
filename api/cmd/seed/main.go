package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/ids"
	"github.com/gmc/api/internal/platform/security"
)

var slugRegex = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugRegex.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Printf("Warning: config.Load() returned error: %v. Using fallback env.", err)
	}

	dbURL := ""
	if cfg != nil {
		dbURL = cfg.DatabaseURL
	}
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	if dbURL == "" {
		dbURL = "postgres://gmc:gmc@localhost:5432/gmc?sslmode=disable"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Database ping failed: %v", err)
	}

	log.Println("Database connection established. Starting seeder...")

	// Locate products.csv
	csvPath := findCSVPath()
	if csvPath == "" {
		log.Fatal("Could not find products.csv in standard paths (db/seed/products.csv, etc.)")
	}
	log.Printf("Reading seed data from %s", csvPath)

	idGen := ids.NewGenerator()

	if err := seedProducts(ctx, pool, idGen, csvPath); err != nil {
		log.Fatalf("Failed to seed products: %v", err)
	}

	// Bootstrap Admin
	adminEmail := ""
	adminPassword := ""
	if cfg != nil {
		adminEmail = cfg.AdminEmail
		adminPassword = cfg.AdminPassword
	}
	if adminEmail == "" {
		adminEmail = os.Getenv("ADMIN_EMAIL")
	}
	if adminPassword == "" {
		adminPassword = os.Getenv("ADMIN_PASSWORD")
	}

	if adminEmail != "" && adminPassword != "" {
		if err := seedAdmin(ctx, pool, idGen, adminEmail, adminPassword); err != nil {
			log.Fatalf("Failed to seed admin: %v", err)
		}
	} else {
		log.Println("ADMIN_EMAIL / ADMIN_PASSWORD not specified; skipping admin bootstrap")
	}

	log.Println("Seeder completed successfully!")
}

func findCSVPath() string {
	paths := []string{
		"db/seed/products.csv",
		"../db/seed/products.csv",
		"../../db/seed/products.csv",
		"../../../db/seed/products.csv",
	}

	for _, p := range paths {
		if abs, err := filepath.Abs(p); err == nil {
			if _, err := os.Stat(abs); err == nil {
				return abs
			}
		}
	}
	return ""
}

func seedAdmin(ctx context.Context, pool *pgxpool.Pool, idGen ids.Generator, email, password string) error {
	hash, err := security.HashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash admin password: %w", err)
	}

	adminID := idGen.New()
	cleanEmail := strings.ToLower(strings.TrimSpace(email))

	query := `
		INSERT INTO users (id, email, password_hash, name, phone, role)
		VALUES ($1, $2, $3, 'Administrator', '081234567890', 'admin')
		ON CONFLICT (email) DO UPDATE
		SET password_hash = EXCLUDED.password_hash,
		    role = 'admin',
		    updated_at = NOW();
	`
	_, err = pool.Exec(ctx, query, adminID, cleanEmail, hash)
	if err != nil {
		return fmt.Errorf("failed to upsert admin user: %w", err)
	}

	log.Printf("Admin user '%s' bootstrapped successfully (role: admin)", cleanEmail)
	return nil
}

func seedProducts(ctx context.Context, pool *pgxpool.Pool, idGen ids.Generator, csvPath string) error {
	file, err := os.Open(csvPath)
	if err != nil {
		return err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		return err
	}

	headerMap := make(map[string]int)
	for i, h := range headers {
		headerMap[strings.TrimSpace(h)] = i
	}

	catCache := make(map[string]uuid.UUID)
	brandCache := make(map[string]uuid.UUID)

	productCount := 0
	variantCount := 0

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		sku := record[headerMap["sku"]]
		name := record[headerMap["name"]]
		brandName := record[headerMap["brand"]]
		catSlug := record[headerMap["category"]]
		priceIDR, _ := strconv.ParseInt(record[headerMap["price_idr"]], 10, 64)
		var compareAtPriceIDR *int64
		if cmpStr := record[headerMap["compare_at_price_idr"]]; cmpStr != "" {
			if v, err := strconv.ParseInt(cmpStr, 10, 64); err == nil && v > 0 {
				compareAtPriceIDR = &v
			}
		}
		stock, _ := strconv.Atoi(record[headerMap["stock"]])
		desc := record[headerMap["description"]]
		isFeatured := record[headerMap["is_featured"]] == "true"

		// 1. Category
		catID, ok := catCache[catSlug]
		if !ok {
			catName := strings.Title(strings.ReplaceAll(catSlug, "-", " "))
			catID = idGen.New()
			err = pool.QueryRow(ctx, `
				INSERT INTO categories (id, slug, name)
				VALUES ($1, $2, $3)
				ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
				RETURNING id
			`, catID, catSlug, catName).Scan(&catID)
			if err != nil {
				return fmt.Errorf("upsert category %s: %w", catSlug, err)
			}
			catCache[catSlug] = catID
		}

		// 2. Brand
		brandSlug := slugify(brandName)
		brandID, ok := brandCache[brandSlug]
		if !ok {
			brandID = idGen.New()
			err = pool.QueryRow(ctx, `
				INSERT INTO brands (id, slug, name)
				VALUES ($1, $2, $3)
				ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
				RETURNING id
			`, brandID, brandSlug, brandName).Scan(&brandID)
			if err != nil {
				return fmt.Errorf("upsert brand %s: %w", brandName, err)
			}
			brandCache[brandSlug] = brandID
		}

		// 3. Product
		prodSlug := slugify(name)
		prodID := idGen.New()

		// Parse Specs JSON
		specsJSON := record[headerMap["specs_json"]]
		if specsJSON == "" {
			specsJSON = "{}"
		}

		// Highlights
		highlights := []string{
			"Garansi Resmi Global Mandiri Computer",
			"Produk Original & Berkualitas",
		}

		err = pool.QueryRow(ctx, `
			INSERT INTO products (id, slug, name, brand_id, category_id, description, highlights, specs, is_featured)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (slug) DO UPDATE
			SET name = EXCLUDED.name,
			    brand_id = EXCLUDED.brand_id,
			    category_id = EXCLUDED.category_id,
			    description = EXCLUDED.description,
			    highlights = EXCLUDED.highlights,
			    specs = EXCLUDED.specs,
			    is_featured = EXCLUDED.is_featured,
			    updated_at = NOW()
			RETURNING id
		`, prodID, prodSlug, name, brandID, catID, desc, highlights, specsJSON, isFeatured).Scan(&prodID)
		if err != nil {
			return fmt.Errorf("upsert product %s: %w", name, err)
		}
		productCount++

		// 4. Images
		_, _ = pool.Exec(ctx, `DELETE FROM product_images WHERE product_id = $1`, prodID)
		imageSlugs := strings.Split(record[headerMap["image_slugs"]], ",")
		sortOrder := 0
		for _, imgURL := range imageSlugs {
			imgURL = strings.TrimSpace(imgURL)
			if imgURL == "" {
				continue
			}
			imgID := idGen.New()
			_, err = pool.Exec(ctx, `
				INSERT INTO product_images (id, product_id, url, alt, sort_order, kind)
				VALUES ($1, $2, $3, $4, $5, 'product')
			`, imgID, prodID, imgURL, name, sortOrder)
			if err != nil {
				return fmt.Errorf("insert product image %s: %w", imgURL, err)
			}
			sortOrder++
		}

		// 5. Variants & Options
		var rawVariants []struct {
			Name  string `json:"name"`
			Price int64  `json:"price"`
			SKU   string `json:"sku"`
		}
		if vJSON := record[headerMap["variants_json"]]; vJSON != "" {
			_ = json.Unmarshal([]byte(vJSON), &rawVariants)
		}

		if len(rawVariants) > 0 {
			// Create option "Pilihan"
			optID := idGen.New()
			err = pool.QueryRow(ctx, `
				INSERT INTO product_options (id, product_id, name, sort_order, display)
				VALUES ($1, $2, 'Pilihan', 0, 'pill')
				RETURNING id
			`, optID, prodID).Scan(&optID)
			if err != nil {
				return fmt.Errorf("insert product option: %w", err)
			}

			for idx, rv := range rawVariants {
				valID := idGen.New()
				err = pool.QueryRow(ctx, `
					INSERT INTO product_option_values (id, option_id, label, sort_order)
					VALUES ($1, $2, $3, $4)
					RETURNING id
				`, valID, optID, rv.Name, idx).Scan(&valID)
				if err != nil {
					return fmt.Errorf("insert option value %s: %w", rv.Name, err)
				}

				vPrice := rv.Price
				if vPrice == 0 {
					vPrice = priceIDR
				}

				variantID := idGen.New()
				vSKU := rv.SKU
				if vSKU == "" {
					vSKU = fmt.Sprintf("%s-%d", sku, idx+1)
				}

				var compPrice *int64
				if compareAtPriceIDR != nil && *compareAtPriceIDR > vPrice {
					compPrice = compareAtPriceIDR
				}

				_, err = pool.Exec(ctx, `
					INSERT INTO variants (id, product_id, sku, price_idr, compare_at_price_idr, stock, is_preorder, is_active, option_value_ids)
					VALUES ($1, $2, $3, $4, $5, $6, false, true, $7)
					ON CONFLICT (sku) DO UPDATE
					SET price_idr = EXCLUDED.price_idr,
					    compare_at_price_idr = EXCLUDED.compare_at_price_idr,
					    stock = EXCLUDED.stock,
					    option_value_ids = EXCLUDED.option_value_ids
				`, variantID, prodID, vSKU, vPrice, compPrice, stock, []uuid.UUID{valID})
				if err != nil {
					return fmt.Errorf("insert variant %s: %w", vSKU, err)
				}
				variantCount++
			}
		} else {
			// Single default variant
			variantID := idGen.New()
			var compPrice *int64
			if compareAtPriceIDR != nil && *compareAtPriceIDR > priceIDR {
				compPrice = compareAtPriceIDR
			}

			_, err = pool.Exec(ctx, `
				INSERT INTO variants (id, product_id, sku, price_idr, compare_at_price_idr, stock, is_preorder, is_active, option_value_ids)
				VALUES ($1, $2, $3, $4, $5, $6, false, true, '{}')
				ON CONFLICT (sku) DO UPDATE
				SET price_idr = EXCLUDED.price_idr,
				    compare_at_price_idr = EXCLUDED.compare_at_price_idr,
				    stock = EXCLUDED.stock
			`, variantID, prodID, sku, priceIDR, compPrice, stock)
			if err != nil {
				return fmt.Errorf("insert default variant %s: %w", sku, err)
			}
			variantCount++
		}
	}

	log.Printf("Successfully seeded %d categories, %d brands, %d products, %d variants",
		len(catCache), len(brandCache), productCount, variantCount)
	return nil
}
