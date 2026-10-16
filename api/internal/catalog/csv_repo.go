package catalog

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type CSVRepository struct {
	mu         sync.RWMutex
	categories []Category
	brands     []Brand
	products   []ProductDetail
	cards      []ProductCard
}

func NewCSVRepository(csvPath string) (*CSVRepository, error) {
	repo := &CSVRepository{}
	if err := repo.LoadFromCSV(csvPath); err != nil {
		return nil, err
	}
	return repo, nil
}

func (r *CSVRepository) LoadFromCSV(csvPath string) error {
	file, err := os.Open(csvPath)
	if err != nil {
		return fmt.Errorf("unable to read seed csv file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	// Read header
	headers, err := reader.Read()
	if err != nil {
		return err
	}

	headerMap := make(map[string]int)
	for i, h := range headers {
		headerMap[strings.TrimSpace(h)] = i
	}

	catMap := make(map[string]Category)
	brandMap := make(map[string]Brand)
	var productDetails []ProductDetail
	var productCards []ProductCard

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
		brand := record[headerMap["brand"]]
		category := record[headerMap["category"]]
		priceIDR, _ := strconv.ParseInt(record[headerMap["price_idr"]], 10, 64)
		var compareAt *int64
		if cmpStr := record[headerMap["compare_at_price_idr"]]; cmpStr != "" {
			if v, err := strconv.ParseInt(cmpStr, 10, 64); err == nil {
				compareAt = &v
			}
		}
		stock, _ := strconv.Atoi(record[headerMap["stock"]])
		desc := record[headerMap["description"]]
		isFeatured := record[headerMap["is_featured"]] == "true"

		// Parse Variants
		var rawVariants []struct {
			Name  string `json:"name"`
			Price int64  `json:"price"`
			SKU   string `json:"sku"`
		}
		_ = json.Unmarshal([]byte(record[headerMap["variants_json"]]), &rawVariants)

		var variants []Variant
		if len(rawVariants) > 0 {
			for _, rv := range rawVariants {
				variants = append(variants, Variant{
					ID:                rv.SKU,
					SKU:               rv.SKU,
					OptionValues:      map[string]string{"Pilihan": rv.Name},
					PriceIDR:          rv.Price,
					CompareAtPriceIDR: compareAt,
					Stock:             stock,
					Status:            "ready",
				})
			}
		} else {
			variants = append(variants, Variant{
				ID:                sku,
				SKU:               sku,
				OptionValues:      map[string]string{"Standard": "Default"},
				PriceIDR:          priceIDR,
				CompareAtPriceIDR: compareAt,
				Stock:             stock,
				Status:            "ready",
			})
		}

		// Parse Specs
		specs := make(map[string]string)
		_ = json.Unmarshal([]byte(record[headerMap["specs_json"]]), &specs)

		// Parse Images
		var images []ProductImage
		imageSlugs := strings.Split(record[headerMap["image_slugs"]], ",")
		for _, img := range imageSlugs {
			img = strings.TrimSpace(img)
			if img != "" {
				images = append(images, ProductImage{URL: img, Alt: name})
			}
		}

		// Slug
		slug := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(name, " ", "-"), "/", "-"))
		slug = strings.ReplaceAll(slug, "(", "")
		slug = strings.ReplaceAll(slug, ")", "")
		slug = strings.ReplaceAll(slug, "--", "-")

		// Options
		var options []ProductOption
		if len(rawVariants) > 0 {
			var vals []string
			for _, rv := range rawVariants {
				vals = append(vals, rv.Name)
			}
			options = append(options, ProductOption{
				ID:     "opt-variant",
				Name:   "Pilihan Varian",
				Values: vals,
			})
		}

		detail := ProductDetail{
			ID:          sku,
			Slug:        slug,
			Name:        name,
			Brand:       brand,
			Category:    category,
			Description: desc,
			Specs:       specs,
			Images:      images,
			Options:     options,
			Variants:    variants,
			CreatedAt:   time.Now(),
		}

		primaryImg := ""
		secImg := ""
		if len(images) > 0 {
			primaryImg = images[0].URL
		}
		if len(images) > 1 {
			secImg = images[1].URL
		}

		card := ProductCard{
			ID:                sku,
			Slug:              slug,
			Name:              name,
			Brand:             brand,
			Category:          category,
			MinPriceIDR:       priceIDR,
			CompareAtPriceIDR: compareAt,
			PrimaryImageURL:   primaryImg,
			SecondaryImageURL: secImg,
			IsReady:           stock > 0,
			IsFeatured:        isFeatured,
		}

		productDetails = append(productDetails, detail)
		productCards = append(productCards, card)

		// Track categories & brands
		if _, exists := catMap[category]; !exists {
			catMap[category] = Category{
				ID:   category,
				Name: strings.Title(strings.ReplaceAll(category, "-", " ")),
			}
		}
		if _, exists := brandMap[brand]; !exists {
			brandMap[brand] = Brand{
				ID:   strings.ToLower(brand),
				Name: brand,
			}
		}
	}

	// Link cross sells
	for i := range productDetails {
		var crossSells []ProductCard
		for j, candidate := range productCards {
			if i != j && (candidate.Category == productDetails[i].Category || candidate.IsFeatured) {
				crossSells = append(crossSells, candidate)
				if len(crossSells) >= 4 {
					break
				}
			}
		}
		productDetails[i].CrossSells = crossSells
	}

	var categories []Category
	for _, c := range catMap {
		categories = append(categories, c)
	}
	sort.Slice(categories, func(i, j int) bool {
		return categories[i].Name < categories[j].Name
	})

	var brands []Brand
	for _, b := range brandMap {
		brands = append(brands, b)
	}
	sort.Slice(brands, func(i, j int) bool {
		return brands[i].Name < brands[j].Name
	})

	r.mu.Lock()
	defer r.mu.Unlock()
	r.categories = categories
	r.brands = brands
	r.products = productDetails
	r.cards = productCards

	return nil
}

func (r *CSVRepository) GetCategories(_ context.Context) ([]Category, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.categories, nil
}

func (r *CSVRepository) GetBrands(_ context.Context) ([]Brand, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.brands, nil
}

func (r *CSVRepository) ListProducts(_ context.Context, f FilterParams) (*ProductListResult, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []ProductCard
	for _, p := range r.cards {
		if f.Category != "" && !strings.EqualFold(p.Category, f.Category) {
			continue
		}
		if f.Brand != "" {
			brands := strings.Split(f.Brand, ",")
			match := false
			for _, b := range brands {
				if strings.EqualFold(p.Brand, strings.TrimSpace(b)) {
					match = true
					break
				}
			}
			if !match {
				continue
			}
		}
		if f.Query != "" {
			q := strings.ToLower(f.Query)
			if !strings.Contains(strings.ToLower(p.Name), q) &&
				!strings.Contains(strings.ToLower(p.Brand), q) &&
				!strings.Contains(strings.ToLower(p.Category), q) {
				continue
			}
		}
		if f.MinPrice > 0 && p.MinPriceIDR < f.MinPrice {
			continue
		}
		if f.MaxPrice > 0 && p.MinPriceIDR > f.MaxPrice {
			continue
		}
		if f.InStock && !p.IsReady {
			continue
		}
		filtered = append(filtered, p)
	}

	// Sort
	switch f.Sort {
	case "price_asc":
		sort.Slice(filtered, func(i, j int) bool {
			return filtered[i].MinPriceIDR < filtered[j].MinPriceIDR
		})
	case "price_desc":
		sort.Slice(filtered, func(i, j int) bool {
			return filtered[i].MinPriceIDR > filtered[j].MinPriceIDR
		})
	case "name_asc":
		sort.Slice(filtered, func(i, j int) bool {
			return filtered[i].Name < filtered[j].Name
		})
	default: // latest / featured first
		sort.Slice(filtered, func(i, j int) bool {
			if filtered[i].IsFeatured != filtered[j].IsFeatured {
				return filtered[i].IsFeatured
			}
			return filtered[i].ID < filtered[j].ID
		})
	}

	total := len(filtered)
	page := f.Page
	if page < 1 {
		page = 1
	}
	limit := f.Limit
	if limit < 1 {
		limit = 24
	}

	totalPages := (total + limit - 1) / limit
	start := (page - 1) * limit
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}

	items := filtered[start:end]
	return &ProductListResult{
		Items:      items,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (r *CSVRepository) GetProductBySlug(_ context.Context, slug string) (*ProductDetail, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, p := range r.products {
		if strings.EqualFold(p.Slug, slug) || strings.EqualFold(p.ID, slug) {
			copy := p
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("product not found")
}

func (r *CSVRepository) GetRelatedProducts(_ context.Context, slug string) ([]ProductCard, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, p := range r.products {
		if strings.EqualFold(p.Slug, slug) || strings.EqualFold(p.ID, slug) {
			return p.CrossSells, nil
		}
	}
	return nil, fmt.Errorf("product not found")
}

func (r *CSVRepository) GetVariantByID(_ context.Context, variantID string) (*Variant, string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, p := range r.products {
		for _, v := range p.Variants {
			if v.ID == variantID || v.SKU == variantID {
				vCopy := v
				return &vCopy, p.Name, nil
			}
		}
	}
	return nil, "", fmt.Errorf("variant not found: %s", variantID)
}
