package catalog

import "time"

type Category struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	ParentID    *string `json:"parentId,omitempty"`
	SortOrder   int     `json:"sortOrder"`
	Description string  `json:"description,omitempty"`
}

type Brand struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ProductImage struct {
	URL string `json:"url"`
	Alt string `json:"alt"`
}

type ProductOption struct {
	ID     string   `json:"id"`
	Name   string   `json:"name"`
	Values []string `json:"values"`
}

type Variant struct {
	ID                string            `json:"id"`
	SKU               string            `json:"sku"`
	OptionValues      map[string]string `json:"optionValues"`
	PriceIDR          int64             `json:"priceIdr"`
	CompareAtPriceIDR *int64            `json:"compareAtPriceIdr,omitempty"`
	Stock             int               `json:"stock"`
	Status            string            `json:"status"` // ready, preorder, habis
}

type ProductCard struct {
	ID                string `json:"id"`
	Slug              string `json:"slug"`
	Name              string `json:"name"`
	Brand             string `json:"brand"`
	Category          string `json:"category"`
	MinPriceIDR       int64  `json:"minPriceIdr"`
	CompareAtPriceIDR *int64 `json:"compareAtPriceIdr,omitempty"`
	PrimaryImageURL   string `json:"primaryImageUrl"`
	SecondaryImageURL string `json:"secondaryImageUrl,omitempty"`
	IsReady           bool   `json:"isReady"`
	IsFeatured        bool   `json:"isFeatured"`
}

type ProductDetail struct {
	ID          string            `json:"id"`
	Slug        string            `json:"slug"`
	Name        string            `json:"name"`
	Brand       string            `json:"brand"`
	Category    string            `json:"category"`
	Description string            `json:"description"`
	Specs       map[string]string `json:"specs"`
	Images      []ProductImage    `json:"images"`
	Options     []ProductOption   `json:"options"`
	Variants    []Variant         `json:"variants"`
	CrossSells  []ProductCard     `json:"crossSells"`
	CreatedAt   time.Time         `json:"createdAt"`
}

type FilterParams struct {
	Category string
	Brand    string
	Query    string
	MinPrice int64
	MaxPrice int64
	InStock  bool
	Sort     string // latest, price_asc, price_desc, name_asc
	Page     int
	Limit    int
}

type ProductListResult struct {
	Items      []ProductCard `json:"items"`
	Total      int           `json:"total"`
	Page       int           `json:"page"`
	TotalPages int           `json:"totalPages"`
}
