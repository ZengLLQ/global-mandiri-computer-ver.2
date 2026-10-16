package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gmc/api/internal/auth"
	"github.com/gmc/api/internal/cart"
	"github.com/gmc/api/internal/catalog"
	"github.com/gmc/api/internal/checkout"
	"github.com/gmc/api/internal/contact"
	"github.com/gmc/api/internal/customers"
	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/logger"
	"github.com/gmc/api/internal/platform/middleware"
)

type Server struct {
	pool         *pgxpool.Pool
	cfg          *config.Config
	catalogHdlr  *catalog.Handler
	authHdlr     *auth.Handler
	authSvc      *auth.Service
	custSvc      *customers.Service
	cartSvc      *cart.Service
	checkoutSvc  *checkout.Service
	contactSvc   *contact.Service
}

func NewServer(
	pool *pgxpool.Pool,
	cfg *config.Config,
	catalogHdlr *catalog.Handler,
	authHdlr *auth.Handler,
	authSvc *auth.Service,
	custSvc *customers.Service,
	cartSvc *cart.Service,
	checkoutSvc *checkout.Service,
	contactSvc *contact.Service,
) *Server {
	return &Server{
		pool:        pool,
		cfg:         cfg,
		catalogHdlr: catalogHdlr,
		authHdlr:    authHdlr,
		authSvc:     authSvc,
		custSvc:     custSvc,
		cartSvc:     cartSvc,
		checkoutSvc: checkoutSvc,
		contactSvc:  contactSvc,
	}
}

// Ensure Server implements gen.StrictServerInterface
var _ gen.StrictServerInterface = (*Server)(nil)

// Probes
func (s *Server) GetHealthz(ctx context.Context, _ gen.GetHealthzRequestObject) (gen.GetHealthzResponseObject, error) {
	return gen.GetHealthz200JSONResponse{Status: "ok"}, nil
}

func (s *Server) GetReadyz(ctx context.Context, _ gen.GetReadyzRequestObject) (gen.GetReadyzResponseObject, error) {
	pingCtx, cancel := context.WithTimeout(ctx, 1*time.Second)
	defer cancel()
	if err := s.pool.Ping(pingCtx); err != nil {
		reqID := logger.RequestIDFromContext(ctx)
		return gen.GetReadyz503JSONResponse{
			Error: gen.ErrorDetail{
				Code:      gen.ErrorCodeInternal,
				Message:   "Database tidak siap",
				RequestId: reqID,
			},
		}, nil
	}
	return gen.GetReadyz200JSONResponse{Status: "ready"}, nil
}

func (s *Server) GetSiteInfo(ctx context.Context, _ gen.GetSiteInfoRequestObject) (gen.GetSiteInfoResponseObject, error) {
	storeName := s.cfg.StoreName
	waNumber := s.cfg.WhatsAppNumber
	address := "ITC Mega Grosir Surabaya, Lantai 2 Blok E2 No. 7-8, Jl. Gembong No. 20-30, Kapasan, Simokerto, Surabaya, Jawa Timur 60141"
	email := "kontak@globalmandiricomputer.com"
	workingHours := "Senin - Minggu: 10.00 - 18.00 WIB"

	storeClosed := false
	var storeClosedNotice *string
	announcements := []string{
		"Bisa request spesifikasi PC Rakitan sesuai budget & kebutuhan Anda",
		"Semua produk dijamin 100% Original & Bergaransi Resmi Distributor",
		"Layanan konsultasi hardware & pengadaan kantor via WhatsApp",
	}

	return gen.GetSiteInfo200JSONResponse{
		StoreName:         storeName,
		WhatsappNumber:    waNumber,
		StoreClosed:       storeClosed,
		StoreClosedNotice: storeClosedNotice,
		Announcements:     announcements,
		Address:           &address,
		Email:             &email,
		WorkingHours:      &workingHours,
	}, nil
}

// Catalog endpoints
func (s *Server) GetCategories(ctx context.Context, req gen.GetCategoriesRequestObject) (gen.GetCategoriesResponseObject, error) {
	return s.catalogHdlr.GetCategories(ctx, req)
}

func (s *Server) GetBrands(ctx context.Context, req gen.GetBrandsRequestObject) (gen.GetBrandsResponseObject, error) {
	return s.catalogHdlr.GetBrands(ctx, req)
}

func (s *Server) GetProducts(ctx context.Context, req gen.GetProductsRequestObject) (gen.GetProductsResponseObject, error) {
	return s.catalogHdlr.GetProducts(ctx, req)
}

func (s *Server) GetProductBySlug(ctx context.Context, req gen.GetProductBySlugRequestObject) (gen.GetProductBySlugResponseObject, error) {
	return s.catalogHdlr.GetProductBySlug(ctx, req)
}

func (s *Server) GetRelatedProducts(ctx context.Context, req gen.GetRelatedProductsRequestObject) (gen.GetRelatedProductsResponseObject, error) {
	return s.catalogHdlr.GetRelatedProducts(ctx, req)
}

func (s *Server) ResolveVariant(ctx context.Context, req gen.ResolveVariantRequestObject) (gen.ResolveVariantResponseObject, error) {
	return s.catalogHdlr.ResolveVariant(ctx, req)
}

// Auth endpoints
func (s *Server) RegisterCustomer(ctx context.Context, req gen.RegisterCustomerRequestObject) (gen.RegisterCustomerResponseObject, error) {
	return s.authHdlr.RegisterCustomer(ctx, req)
}

func (s *Server) LoginUser(ctx context.Context, req gen.LoginUserRequestObject) (gen.LoginUserResponseObject, error) {
	return s.authHdlr.LoginUser(ctx, req)
}

func (s *Server) RefreshToken(ctx context.Context, req gen.RefreshTokenRequestObject) (gen.RefreshTokenResponseObject, error) {
	return s.authHdlr.RefreshToken(ctx, req)
}

func (s *Server) LogoutUser(ctx context.Context, req gen.LogoutUserRequestObject) (gen.LogoutUserResponseObject, error) {
	return s.authHdlr.LogoutUser(ctx, req)
}

func (s *Server) ForgotPassword(ctx context.Context, req gen.ForgotPasswordRequestObject) (gen.ForgotPasswordResponseObject, error) {
	return s.authHdlr.ForgotPassword(ctx, req)
}

// Cart endpoints
func (s *Server) ValidateCart(ctx context.Context, req gen.ValidateCartRequestObject) (gen.ValidateCartResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	if req.Body == nil || len(req.Body.Items) == 0 {
		return gen.ValidateCart400JSONResponse{
			BadRequestJSONResponse: gen.BadRequestJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeBadRequest,
					Message:   "Daftar item tidak boleh kosong",
					RequestId: reqID,
				},
			},
		}, nil
	}

	res, err := s.cartSvc.ValidateCart(ctx, req.Body.Items)
	if err != nil {
		return nil, err
	}
	return gen.ValidateCart200JSONResponse(*res), nil
}

func (s *Server) GetMyCart(ctx context.Context, _ gen.GetMyCartRequestObject) (gen.GetMyCartResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.GetMyCart401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	items, err := s.cartSvc.GetUserCart(ctx, userID)
	if err != nil {
		return nil, err
	}
	return gen.GetMyCart200JSONResponse{Items: items}, nil
}

func (s *Server) ReplaceMyCart(ctx context.Context, req gen.ReplaceMyCartRequestObject) (gen.ReplaceMyCartResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.ReplaceMyCart401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	items := []gen.CartItemInput{}
	if req.Body != nil {
		items = req.Body.Items
	}

	if err := s.cartSvc.ReplaceUserCart(ctx, userID, items); err != nil {
		return nil, err
	}
	return gen.ReplaceMyCart204Response{}, nil
}

func (s *Server) MergeMyCart(ctx context.Context, req gen.MergeMyCartRequestObject) (gen.MergeMyCartResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.MergeMyCart401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	items := []gen.CartItemInput{}
	if req.Body != nil {
		items = req.Body.Items
	}

	res, err := s.cartSvc.MergeUserCart(ctx, userID, items)
	if err != nil {
		return nil, err
	}
	return gen.MergeMyCart200JSONResponse(*res), nil
}

// Checkout & Orders
type rawCachedResponse struct {
	data       []byte
	statusCode int
}

func (r rawCachedResponse) VisitCreateCheckoutResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(r.statusCode)
	_, err := w.Write(r.data)
	return err
}

func (s *Server) CreateCheckout(ctx context.Context, req gen.CreateCheckoutRequestObject) (gen.CreateCheckoutResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	if req.Body == nil {
		return gen.CreateCheckout400JSONResponse{
			BadRequestJSONResponse: gen.BadRequestJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeBadRequest,
					Message:   "Data pesanan tidak boleh kosong",
					RequestId: reqID,
				},
			},
		}, nil
	}

	var authUserID *uuid.UUID
	if uID, ok := middleware.UserIDFromContext(ctx); ok && uID != uuid.Nil {
		authUserID = &uID
	}

	bodyBytes, _ := json.Marshal(req.Body)

	res, cached, err := s.checkoutSvc.CreateOrder(ctx, req.Params.IdempotencyKey, bodyBytes, *req.Body, authUserID)
	if err != nil {
		if errors.Is(err, checkout.ErrIdempotencyConflict) {
			return gen.CreateCheckout409JSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeIdempotencyConflict,
					Message:   err.Error(),
					RequestId: reqID,
				},
			}, nil
		}
		if errors.Is(err, checkout.ErrOutOfStock) {
			return gen.CreateCheckout409JSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeOutOfStock,
					Message:   err.Error(),
					RequestId: reqID,
				},
			}, nil
		}
		if errors.Is(err, checkout.ErrPriceChanged) {
			return gen.CreateCheckout409JSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodePriceChanged,
					Message:   err.Error(),
					RequestId: reqID,
				},
			}, nil
		}
		return gen.CreateCheckout422JSONResponse{
			ValidationFailedJSONResponse: gen.ValidationFailedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeValidationFailed,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}

	if cached != nil {
		return rawCachedResponse{
			data:       cached.Response,
			statusCode: cached.StatusCode,
		}, nil
	}

	return gen.CreateCheckout201JSONResponse(*res), nil
}

func (s *Server) GetOrderByNumber(ctx context.Context, req gen.GetOrderByNumberRequestObject) (gen.GetOrderByNumberResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	var authUserID *uuid.UUID
	if uID, ok := middleware.UserIDFromContext(ctx); ok && uID != uuid.Nil {
		authUserID = &uID
	}

	order, err := s.checkoutSvc.GetOrderByNumber(ctx, req.OrderNo, req.Params.Token, authUserID)
	if err != nil {
		return gen.GetOrderByNumber404JSONResponse{
			NotFoundJSONResponse: gen.NotFoundJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeNotFound,
					Message:   "Pesanan tidak ditemukan",
					RequestId: reqID,
				},
			},
		}, nil
	}
	return gen.GetOrderByNumber200JSONResponse(*order), nil
}

// Customer account endpoints
func (s *Server) GetMe(ctx context.Context, _ gen.GetMeRequestObject) (gen.GetMeResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.GetMe401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	user, err := s.custSvc.GetMe(ctx, userID)
	if err != nil {
		return gen.GetMe401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Pengguna tidak ditemukan",
					RequestId: reqID,
				},
			},
		}, nil
	}
	return gen.GetMe200JSONResponse(*user), nil
}

func (s *Server) UpdateMe(ctx context.Context, req gen.UpdateMeRequestObject) (gen.UpdateMeResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.UpdateMe401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	var name, phone *string
	var email *string
	if req.Body != nil {
		name = req.Body.Name
		phone = req.Body.Phone
		if req.Body.Email != nil {
			e := string(*req.Body.Email)
			email = &e
		}
	}

	user, err := s.custSvc.UpdateMe(ctx, userID, name, phone, email)
	if err != nil {
		if strings.Contains(err.Error(), "email sudah terdaftar") {
			return gen.UpdateMe409JSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeEmailTaken,
					Message:   "Email sudah terdaftar",
					RequestId: reqID,
				},
			}, nil
		}
		return nil, err
	}
	return gen.UpdateMe200JSONResponse(*user), nil
}

func (s *Server) ChangePassword(ctx context.Context, req gen.ChangePasswordRequestObject) (gen.ChangePasswordResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	sessionID, hasSession := middleware.SessionIDFromContext(ctx)
	if !ok || userID == uuid.Nil || !hasSession {
		return gen.ChangePassword401JSONResponse{
			Error: gen.ErrorDetail{
				Code:      gen.ErrorCodeUnauthorized,
				Message:   "Silakan masuk terlebih dahulu",
				RequestId: reqID,
			},
		}, nil
	}

	if req.Body == nil {
		return gen.ChangePassword422JSONResponse{
			ValidationFailedJSONResponse: gen.ValidationFailedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeValidationFailed,
					Message:   "Data tidak boleh kosong",
					RequestId: reqID,
				},
			},
		}, nil
	}

	err := s.authSvc.ChangePassword(ctx, userID, req.Body.CurrentPassword, req.Body.NewPassword, sessionID)
	if err != nil {
		if errors.Is(err, auth.ErrInvalidCredentials) {
			return gen.ChangePassword401JSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeInvalidCredentials,
					Message:   "Kata sandi saat ini tidak sesuai",
					RequestId: reqID,
				},
			}, nil
		}
		return gen.ChangePassword422JSONResponse{
			ValidationFailedJSONResponse: gen.ValidationFailedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeValidationFailed,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}

	return gen.ChangePassword204Response{}, nil
}

func (s *Server) GetAddresses(ctx context.Context, _ gen.GetAddressesRequestObject) (gen.GetAddressesResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.GetAddresses401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	addrs, err := s.custSvc.ListAddresses(ctx, userID)
	if err != nil {
		return nil, err
	}
	return gen.GetAddresses200JSONResponse(addrs), nil
}

func (s *Server) CreateAddress(ctx context.Context, req gen.CreateAddressRequestObject) (gen.CreateAddressResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.CreateAddress401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	if req.Body == nil {
		return gen.CreateAddress400JSONResponse{
			BadRequestJSONResponse: gen.BadRequestJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeBadRequest,
					Message:   "Data alamat tidak boleh kosong",
					RequestId: reqID,
				},
			},
		}, nil
	}

	addr, err := s.custSvc.CreateAddress(ctx, userID, *req.Body)
	if err != nil {
		return gen.CreateAddress400JSONResponse{
			BadRequestJSONResponse: gen.BadRequestJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeBadRequest,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}
	return gen.CreateAddress201JSONResponse(*addr), nil
}

func (s *Server) UpdateAddress(ctx context.Context, req gen.UpdateAddressRequestObject) (gen.UpdateAddressResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.UpdateAddress401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	body := gen.AddressPatchInput{}
	if req.Body != nil {
		body = *req.Body
	}

	addr, err := s.custSvc.UpdateAddress(ctx, userID, req.Id, body)
	if err != nil {
		if errors.Is(err, customers.ErrAddressNotFound) {
			return gen.UpdateAddress404JSONResponse{
				NotFoundJSONResponse: gen.NotFoundJSONResponse{
					Error: gen.ErrorDetail{
						Code:      gen.ErrorCodeNotFound,
						Message:   "Alamat tidak ditemukan",
						RequestId: reqID,
					},
				},
			}, nil
		}
		return nil, err
	}
	return gen.UpdateAddress200JSONResponse(*addr), nil
}

func (s *Server) DeleteAddress(ctx context.Context, req gen.DeleteAddressRequestObject) (gen.DeleteAddressResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.DeleteAddress401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	if err := s.custSvc.DeleteAddress(ctx, userID, req.Id); err != nil {
		return nil, err
	}
	return gen.DeleteAddress204Response{}, nil
}

func (s *Server) GetMyOrders(ctx context.Context, req gen.GetMyOrdersRequestObject) (gen.GetMyOrdersResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.GetMyOrders401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	page := 1
	if req.Params.Page != nil && *req.Params.Page > 0 {
		page = *req.Params.Page
	}
	pageSize := 20
	if req.Params.PageSize != nil && *req.Params.PageSize > 0 {
		pageSize = *req.Params.PageSize
	}

	res, err := s.checkoutSvc.ListUserOrders(ctx, userID, req.Params.Status, req.Params.Q, page, pageSize)
	if err != nil {
		return nil, err
	}
	return gen.GetMyOrders200JSONResponse(*res), nil
}

func (s *Server) GetMyOrderByNumber(ctx context.Context, req gen.GetMyOrderByNumberRequestObject) (gen.GetMyOrderByNumberResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.GetMyOrderByNumber401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	order, err := s.checkoutSvc.GetOrderByNumber(ctx, req.OrderNo, nil, &userID)
	if err != nil {
		return gen.GetMyOrderByNumber404JSONResponse{
			NotFoundJSONResponse: gen.NotFoundJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeNotFound,
					Message:   "Pesanan tidak ditemukan",
					RequestId: reqID,
				},
			},
		}, nil
	}
	return gen.GetMyOrderByNumber200JSONResponse(*order), nil
}

func (s *Server) GetMyWishlist(ctx context.Context, _ gen.GetMyWishlistRequestObject) (gen.GetMyWishlistResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.GetMyWishlist401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	items, err := s.custSvc.GetWishlist(ctx, userID)
	if err != nil {
		return nil, err
	}
	return gen.GetMyWishlist200JSONResponse(items), nil
}

func (s *Server) AddToWishlist(ctx context.Context, req gen.AddToWishlistRequestObject) (gen.AddToWishlistResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.AddToWishlist401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	if err := s.custSvc.AddToWishlist(ctx, userID, req.ProductId); err != nil {
		return nil, err
	}
	return gen.AddToWishlist204Response{}, nil
}

func (s *Server) RemoveFromWishlist(ctx context.Context, req gen.RemoveFromWishlistRequestObject) (gen.RemoveFromWishlistResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok || userID == uuid.Nil {
		return gen.RemoveFromWishlist401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Silakan masuk terlebih dahulu",
					RequestId: reqID,
				},
			},
		}, nil
	}

	if err := s.custSvc.RemoveFromWishlist(ctx, userID, req.ProductId); err != nil {
		return nil, err
	}
	return gen.RemoveFromWishlist204Response{}, nil
}

// Contact & Newsletter
func (s *Server) SubmitContact(ctx context.Context, req gen.SubmitContactRequestObject) (gen.SubmitContactResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	if req.Body == nil {
		return gen.SubmitContact400JSONResponse{
			BadRequestJSONResponse: gen.BadRequestJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeBadRequest,
					Message:   "Data tidak boleh kosong",
					RequestId: reqID,
				},
			},
		}, nil
	}

	waURL, err := s.contactSvc.SubmitContact(ctx, *req.Body)
	if err != nil {
		return gen.SubmitContact422JSONResponse{
			ValidationFailedJSONResponse: gen.ValidationFailedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeValidationFailed,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}
	return gen.SubmitContact201JSONResponse{WhatsappUrl: waURL}, nil
}

func (s *Server) SubscribeNewsletter(ctx context.Context, req gen.SubscribeNewsletterRequestObject) (gen.SubscribeNewsletterResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	if req.Body == nil {
		return gen.SubscribeNewsletter400JSONResponse{
			BadRequestJSONResponse: gen.BadRequestJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeBadRequest,
					Message:   "Alamat email tidak boleh kosong",
					RequestId: reqID,
				},
			},
		}, nil
	}

	if err := s.contactSvc.SubscribeNewsletter(ctx, string(req.Body.Email), req.Body.Name); err != nil {
		return gen.SubscribeNewsletter400JSONResponse{
			BadRequestJSONResponse: gen.BadRequestJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeBadRequest,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}
	return gen.SubscribeNewsletter204Response{}, nil
}
