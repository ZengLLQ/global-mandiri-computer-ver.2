package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/logger"
	"github.com/gmc/api/internal/platform/middleware"
	"github.com/gmc/api/internal/platform/security"
)

type Handler struct {
	svc *Service
	cfg *config.Config
}

func NewHandler(svc *Service, cfg *config.Config) *Handler {
	return &Handler{
		svc: svc,
		cfg: cfg,
	}
}

// Custom response types implementing the visitor interface to set cookies

type registerCustomer201Response struct {
	user            gen.User
	accessToken     string
	rawRefreshToken string
	cfg             *config.Config
}

func (r registerCustomer201Response) VisitRegisterCustomerResponse(w http.ResponseWriter) error {
	security.SetAuthCookies(
		w,
		r.accessToken,
		r.rawRefreshToken,
		r.cfg.AccessTTL,
		r.cfg.RefreshTTL,
		r.cfg.CookieSecure,
		r.cfg.CookieSameSite,
		r.cfg.RefreshCookiePath,
	)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(gen.AuthResponse{User: r.user})
}

type loginUser200Response struct {
	user            gen.User
	accessToken     string
	rawRefreshToken string
	cfg             *config.Config
}

func (r loginUser200Response) VisitLoginUserResponse(w http.ResponseWriter) error {
	security.SetAuthCookies(
		w,
		r.accessToken,
		r.rawRefreshToken,
		r.cfg.AccessTTL,
		r.cfg.RefreshTTL,
		r.cfg.CookieSecure,
		r.cfg.CookieSameSite,
		r.cfg.RefreshCookiePath,
	)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	return json.NewEncoder(w).Encode(gen.AuthResponse{User: r.user})
}

type refreshToken204Response struct {
	accessToken     string
	rawRefreshToken string
	cfg             *config.Config
}

func (r refreshToken204Response) VisitRefreshTokenResponse(w http.ResponseWriter) error {
	security.SetAuthCookies(
		w,
		r.accessToken,
		r.rawRefreshToken,
		r.cfg.AccessTTL,
		r.cfg.RefreshTTL,
		r.cfg.CookieSecure,
		r.cfg.CookieSameSite,
		r.cfg.RefreshCookiePath,
	)
	w.WriteHeader(http.StatusNoContent)
	return nil
}

type logoutUser204Response struct {
	cfg *config.Config
}

func (r logoutUser204Response) VisitLogoutUserResponse(w http.ResponseWriter) error {
	security.ClearAuthCookies(
		w,
		r.cfg.CookieSecure,
		r.cfg.CookieSameSite,
		r.cfg.RefreshCookiePath,
	)
	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *Handler) RegisterCustomer(ctx context.Context, request gen.RegisterCustomerRequestObject) (gen.RegisterCustomerResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	if request.Body == nil {
		return gen.RegisterCustomer400JSONResponse{
			BadRequestJSONResponse: gen.BadRequestJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeBadRequest,
					Message:   "Data tidak boleh kosong",
					RequestId: reqID,
				},
			},
		}, nil
	}

	httpReq := middleware.RequestFromContext(ctx)
	var userAgent, ip string
	if httpReq != nil {
		userAgent = httpReq.UserAgent()
		ip = middleware.ClientIPFromContext(ctx)
	}

	pair, err := h.svc.Register(ctx, request.Body.Name, string(request.Body.Email), request.Body.Phone, request.Body.Password, userAgent, ip)
	if err != nil {
		if errors.Is(err, ErrEmailTaken) {
			return gen.RegisterCustomer409JSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeEmailTaken,
					Message:   "Alamat email sudah terdaftar",
					RequestId: reqID,
				},
			}, nil
		}
		return gen.RegisterCustomer422JSONResponse{
			ValidationFailedJSONResponse: gen.ValidationFailedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeValidationFailed,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}

	return registerCustomer201Response{
		user:            *pair.User,
		accessToken:     pair.AccessToken,
		rawRefreshToken: pair.RawRefreshToken,
		cfg:             h.cfg,
	}, nil
}

func (h *Handler) LoginUser(ctx context.Context, request gen.LoginUserRequestObject) (gen.LoginUserResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	if request.Body == nil {
		return gen.LoginUser401JSONResponse{
			Error: gen.ErrorDetail{
				Code:      gen.ErrorCodeInvalidCredentials,
				Message:   "Email atau kata sandi tidak valid",
				RequestId: reqID,
			},
		}, nil
	}

	httpReq := middleware.RequestFromContext(ctx)
	var userAgent, ip string
	if httpReq != nil {
		userAgent = httpReq.UserAgent()
		ip = middleware.ClientIPFromContext(ctx)
	}

	pair, err := h.svc.Login(ctx, string(request.Body.Email), request.Body.Password, userAgent, ip)
	if err != nil {
		return gen.LoginUser401JSONResponse{
			Error: gen.ErrorDetail{
				Code:      gen.ErrorCodeInvalidCredentials,
				Message:   "Email atau kata sandi tidak sesuai",
				RequestId: reqID,
			},
		}, nil
	}

	return loginUser200Response{
		user:            *pair.User,
		accessToken:     pair.AccessToken,
		rawRefreshToken: pair.RawRefreshToken,
		cfg:             h.cfg,
	}, nil
}

func (h *Handler) RefreshToken(ctx context.Context, _ gen.RefreshTokenRequestObject) (gen.RefreshTokenResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	httpReq := middleware.RequestFromContext(ctx)
	if httpReq == nil {
		return gen.RefreshToken401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Sesi tidak ditemukan",
					RequestId: reqID,
				},
			},
		}, nil
	}

	refreshCookie, err := httpReq.Cookie("gmc_rt")
	if err != nil || refreshCookie.Value == "" {
		return gen.RefreshToken401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Token penyegaran tidak ditemukan",
					RequestId: reqID,
				},
			},
		}, nil
	}

	pair, err := h.svc.Refresh(ctx, refreshCookie.Value, httpReq.UserAgent(), middleware.ClientIPFromContext(ctx))
	if err != nil {
		return gen.RefreshToken401JSONResponse{
			UnauthorizedJSONResponse: gen.UnauthorizedJSONResponse{
				Error: gen.ErrorDetail{
					Code:      gen.ErrorCodeUnauthorized,
					Message:   "Sesi tidak valid atau telah berakhir",
					RequestId: reqID,
				},
			},
		}, nil
	}

	return refreshToken204Response{
		accessToken:     pair.AccessToken,
		rawRefreshToken: pair.RawRefreshToken,
		cfg:             h.cfg,
	}, nil
}

func (h *Handler) LogoutUser(ctx context.Context, _ gen.LogoutUserRequestObject) (gen.LogoutUserResponseObject, error) {
	httpReq := middleware.RequestFromContext(ctx)
	if httpReq != nil {
		if c, err := httpReq.Cookie("gmc_rt"); err == nil && c.Value != "" {
			_ = h.svc.Logout(ctx, c.Value)
		}
	}

	return logoutUser204Response{cfg: h.cfg}, nil
}

func (h *Handler) ForgotPassword(ctx context.Context, _ gen.ForgotPasswordRequestObject) (gen.ForgotPasswordResponseObject, error) {
	// Always return 204 to prevent user enumeration
	return gen.ForgotPassword204Response{}, nil
}
