package catalog

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/platform/logger"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetCategories(ctx context.Context, _ gen.GetCategoriesRequestObject) (gen.GetCategoriesResponseObject, error) {
	cats, err := h.svc.GetCategories(ctx)
	if err != nil {
		return nil, err
	}
	return gen.GetCategories200JSONResponse(cats), nil
}

func (h *Handler) GetBrands(ctx context.Context, _ gen.GetBrandsRequestObject) (gen.GetBrandsResponseObject, error) {
	brands, err := h.svc.GetBrands(ctx)
	if err != nil {
		return nil, err
	}
	return gen.GetBrands200JSONResponse(brands), nil
}

func (h *Handler) GetProducts(ctx context.Context, request gen.GetProductsRequestObject) (gen.GetProductsResponseObject, error) {
	page := 1
	if request.Params.Page != nil && *request.Params.Page > 0 {
		page = *request.Params.Page
	}
	pageSize := 24
	if request.Params.PageSize != nil && *request.Params.PageSize > 0 {
		pageSize = *request.Params.PageSize
	}

	var sortOrder gen.ProductSort
	if request.Params.Sort != nil {
		sortOrder = *request.Params.Sort
	}

	var cats []string
	if request.Params.Category != nil {
		cats = *request.Params.Category
	}

	var brands []string
	if request.Params.Brand != nil {
		brands = *request.Params.Brand
	}

	filter := ProductFilter{
		Q:           request.Params.Q,
		Categories:  cats,
		Brands:      brands,
		MinPriceIdr: request.Params.MinPriceIdr,
		MaxPriceIdr: request.Params.MaxPriceIdr,
		InStock:     request.Params.InStock,
		Featured:    request.Params.Featured,
		Sort:        sortOrder,
		Page:        page,
		PageSize:    pageSize,
	}

	res, err := h.svc.ListProducts(ctx, filter)
	if err != nil {
		return nil, err
	}
	return gen.GetProducts200JSONResponse(*res), nil
}

func (h *Handler) GetProductBySlug(ctx context.Context, request gen.GetProductBySlugRequestObject) (gen.GetProductBySlugResponseObject, error) {
	detail, err := h.svc.GetProductBySlug(ctx, request.Slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			reqID := logger.RequestIDFromContext(ctx)
			return gen.GetProductBySlug404JSONResponse{
				NotFoundJSONResponse: gen.NotFoundJSONResponse{
					Error: gen.ErrorDetail{
						Code:      gen.ErrorCodeNotFound,
						Message:   "Produk tidak ditemukan",
						RequestId: reqID,
					},
				},
			}, nil
		}
		return nil, err
	}
	return gen.GetProductBySlug200JSONResponse(*detail), nil
}

func (h *Handler) GetRelatedProducts(ctx context.Context, request gen.GetRelatedProductsRequestObject) (gen.GetRelatedProductsResponseObject, error) {
	related, err := h.svc.GetRelatedProducts(ctx, request.Slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			reqID := logger.RequestIDFromContext(ctx)
			return gen.GetRelatedProducts404JSONResponse{
				NotFoundJSONResponse: gen.NotFoundJSONResponse{
					Error: gen.ErrorDetail{
						Code:      gen.ErrorCodeNotFound,
						Message:   "Produk tidak ditemukan",
						RequestId: reqID,
					},
				},
			}, nil
		}
		return nil, err
	}
	return gen.GetRelatedProducts200JSONResponse(related), nil
}

func (h *Handler) ResolveVariant(ctx context.Context, request gen.ResolveVariantRequestObject) (gen.ResolveVariantResponseObject, error) {
	resolved, err := h.svc.ResolveVariant(ctx, request.Params.Sku, request.Params.ProductSlug, request.Params.OptionValueIds)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			reqID := logger.RequestIDFromContext(ctx)
			return gen.ResolveVariant404JSONResponse{
				NotFoundJSONResponse: gen.NotFoundJSONResponse{
					Error: gen.ErrorDetail{
						Code:      gen.ErrorCodeNotFound,
						Message:   "Varian produk tidak ditemukan",
						RequestId: reqID,
					},
				},
			}, nil
		}
		return nil, err
	}
	return gen.ResolveVariant200JSONResponse(*resolved), nil
}
