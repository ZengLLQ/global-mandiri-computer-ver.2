package server

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	adminauth "github.com/gmc/api/internal/admin/auth"
	adminmid "github.com/gmc/api/internal/admin/middleware"
	"github.com/gmc/api/internal/gen/admingen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/logger"
	"github.com/gmc/api/internal/platform/middleware"
	"github.com/gmc/api/internal/platform/security"
)

type Server struct {
	pool    *pgxpool.Pool
	queries *db.Queries
	cfg     *config.Config
	authSvc *adminauth.Service
}

func NewServer(
	pool *pgxpool.Pool,
	queries *db.Queries,
	cfg *config.Config,
	authSvc *adminauth.Service,
) *Server {
	return &Server{
		pool:    pool,
		queries: queries,
		cfg:     cfg,
		authSvc: authSvc,
	}
}

var _ admingen.StrictServerInterface = (*Server)(nil)

type adminLoginSuccessResponse struct {
	response        admingen.AdminLogin200JSONResponse
	rawRefreshToken string
	accessToken     string
	cfg             *config.Config
}

func (r adminLoginSuccessResponse) VisitAdminLoginResponse(w http.ResponseWriter) error {
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
	return r.response.VisitAdminLoginResponse(w)
}

type adminRefreshSuccessResponse struct {
	response        admingen.AdminRefresh200JSONResponse
	rawRefreshToken string
	accessToken     string
	cfg             *config.Config
}

func (r adminRefreshSuccessResponse) VisitAdminRefreshResponse(w http.ResponseWriter) error {
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
	return r.response.VisitAdminRefreshResponse(w)
}

type adminLogoutSuccessResponse struct {
	cfg *config.Config
}

func (r adminLogoutSuccessResponse) VisitAdminLogoutResponse(w http.ResponseWriter) error {
	security.ClearAuthCookies(w, r.cfg.CookieSecure, r.cfg.CookieSameSite, r.cfg.RefreshCookiePath)
	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (s *Server) AdminLogin(ctx context.Context, request admingen.AdminLoginRequestObject) (admingen.AdminLoginResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)

	var totpCode string
	if request.Body.TotpCode != nil {
		totpCode = *request.Body.TotpCode
	}

	userAgent := ""
	ip := ""
	httpReq := middleware.RequestFromContext(ctx)
	if httpReq != nil {
		userAgent = httpReq.UserAgent()
		ip = middleware.ClientIPFromContext(ctx)
	}

	result, err := s.authSvc.Login(ctx, string(request.Body.Email), request.Body.Password, totpCode, userAgent, ip)
	if err != nil {
		if errors.Is(err, adminauth.ErrAccountLocked) {
			return admingen.AdminLogin403JSONResponse{
				ForbiddenJSONResponse: admingen.ForbiddenJSONResponse{
					Error: admingen.ErrorDetail{
						Code:      admingen.ErrorCodeLocked,
						Message:   err.Error(),
						RequestId: reqID,
					},
				},
			}, nil
		}
		if errors.Is(err, adminauth.ErrInvalidCredentials) || errors.Is(err, adminauth.ErrAccountInactive) {
			return admingen.AdminLogin401JSONResponse{
				UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
					Error: admingen.ErrorDetail{
						Code:      admingen.ErrorCodeInvalidCredentials,
						Message:   err.Error(),
						RequestId: reqID,
					},
				},
			}, nil
		}
		if errors.Is(err, adminauth.ErrInvalidTOTP) {
			return admingen.AdminLogin401JSONResponse{
				UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
					Error: admingen.ErrorDetail{
						Code:      admingen.ErrorCodeInvalidTotp,
						Message:   err.Error(),
						RequestId: reqID,
					},
				},
			}, nil
		}
		return nil, err
	}

	if result.Require2FA {
		return admingen.AdminLogin400JSONResponse{
			Require2fa: true,
			TempToken:  result.TempToken,
		}, nil
	}

	return adminLoginSuccessResponse{
		response: admingen.AdminLogin200JSONResponse{
			Token:              result.AccessToken,
			MustChangePassword: result.MustChangePassword,
			User:               *result.User,
		},
		rawRefreshToken: result.RawRefreshToken,
		accessToken:     result.AccessToken,
		cfg:             s.cfg,
	}, nil
}

func (s *Server) AdminLogout(ctx context.Context, _ admingen.AdminLogoutRequestObject) (admingen.AdminLogoutResponseObject, error) {
	adm, ok := adminmid.AdminFromContext(ctx)
	if ok {
		_ = s.authSvc.Logout(ctx, adm.SessionID)
	}
	return adminLogoutSuccessResponse{cfg: s.cfg}, nil
}

func (s *Server) AdminRefresh(ctx context.Context, request admingen.AdminRefreshRequestObject) (admingen.AdminRefreshResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)

	userAgent := ""
	ip := ""
	httpReq := middleware.RequestFromContext(ctx)
	if httpReq != nil {
		userAgent = httpReq.UserAgent()
		ip = middleware.ClientIPFromContext(ctx)
	}

	// In web proxy, the cookie gmc_rt is forwarded
	rawRefreshToken := ""
	if httpReq != nil {
		if cookie, err := httpReq.Cookie("gmc_rt"); err == nil && cookie.Value != "" {
			rawRefreshToken = cookie.Value
		}
	}
	if rawRefreshToken == "" {
		if cookie := ctx.Value("refresh_cookie"); cookie != nil {
			rawRefreshToken = cookie.(string)
		}
	}

	if rawRefreshToken == "" {
		return admingen.AdminRefresh401JSONResponse{
			UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeUnauthorized,
					Message:   "Token penyegaran tidak ditemukan",
					RequestId: reqID,
				},
			},
		}, nil
	}

	result, err := s.authSvc.Refresh(ctx, rawRefreshToken, userAgent, ip)
	if err != nil {
		return admingen.AdminRefresh401JSONResponse{
			UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeUnauthorized,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}

	return adminRefreshSuccessResponse{
		response: admingen.AdminRefresh200JSONResponse{
			Token:              result.AccessToken,
			MustChangePassword: result.MustChangePassword,
			User:               *result.User,
		},
		rawRefreshToken: result.RawRefreshToken,
		accessToken:     result.AccessToken,
		cfg:             s.cfg,
	}, nil
}

func (s *Server) GetAdminMe(ctx context.Context, _ admingen.GetAdminMeRequestObject) (admingen.GetAdminMeResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	adm, ok := adminmid.AdminFromContext(ctx)
	if !ok {
		return admingen.GetAdminMe401JSONResponse{
			UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeUnauthorized,
					Message:   "Otentikasi diperlukan",
					RequestId: reqID,
				},
			},
		}, nil
	}

	user, err := s.authSvc.GetMe(ctx, adm.User.ID)
	if err != nil {
		return admingen.GetAdminMe401JSONResponse{
			UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeUnauthorized,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}

	return admingen.GetAdminMe200JSONResponse(*user), nil
}

func (s *Server) AdminChangePassword(ctx context.Context, request admingen.AdminChangePasswordRequestObject) (admingen.AdminChangePasswordResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	adm, ok := adminmid.AdminFromContext(ctx)
	if !ok {
		return admingen.AdminChangePassword401JSONResponse{
			UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeUnauthorized,
					Message:   "Otentikasi diperlukan",
					RequestId: reqID,
				},
			},
		}, nil
	}

	err := s.authSvc.ChangePassword(ctx, adm.User.ID, request.Body.CurrentPassword, request.Body.NewPassword)
	if err != nil {
		return admingen.AdminChangePassword400JSONResponse{
			BadRequestJSONResponse: admingen.BadRequestJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeBadRequest,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}

	return admingen.AdminChangePassword200Response{}, nil
}

func (s *Server) AdminTotpSetup(ctx context.Context, _ admingen.AdminTotpSetupRequestObject) (admingen.AdminTotpSetupResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	adm, ok := adminmid.AdminFromContext(ctx)
	if !ok {
		return admingen.AdminTotpSetup401JSONResponse{
			UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeUnauthorized,
					Message:   "Otentikasi diperlukan",
					RequestId: reqID,
				},
			},
		}, nil
	}

	setup, err := s.authSvc.SetupTOTP(ctx, adm.User.ID, adm.User.Email)
	if err != nil {
		return nil, err
	}

	return admingen.AdminTotpSetup200JSONResponse{
		Secret:      setup.SecretKey,
		QrDataUrl:   setup.URL,
		BackupCodes: setup.BackupCodes,
	}, nil
}

func (s *Server) AdminTotpEnable(ctx context.Context, request admingen.AdminTotpEnableRequestObject) (admingen.AdminTotpEnableResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	adm, ok := adminmid.AdminFromContext(ctx)
	if !ok {
		return admingen.AdminTotpEnable401JSONResponse{
			UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeUnauthorized,
					Message:   "Otentikasi diperlukan",
					RequestId: reqID,
				},
			},
		}, nil
	}

	err := s.authSvc.EnableTOTP(ctx, adm.User.ID, request.Body.Code)
	if err != nil {
		return admingen.AdminTotpEnable400JSONResponse{
			BadRequestJSONResponse: admingen.BadRequestJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeBadRequest,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}

	return admingen.AdminTotpEnable200Response{}, nil
}

func (s *Server) AdminTotpDisable(ctx context.Context, request admingen.AdminTotpDisableRequestObject) (admingen.AdminTotpDisableResponseObject, error) {
	reqID := logger.RequestIDFromContext(ctx)
	adm, ok := adminmid.AdminFromContext(ctx)
	if !ok {
		return admingen.AdminTotpDisable401JSONResponse{
			UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeUnauthorized,
					Message:   "Otentikasi diperlukan",
					RequestId: reqID,
				},
			},
		}, nil
	}

	err := s.authSvc.DisableTOTP(ctx, adm.User.ID, request.Body.Password)
	if err != nil {
		return admingen.AdminTotpDisable400JSONResponse{
			BadRequestJSONResponse: admingen.BadRequestJSONResponse{
				Error: admingen.ErrorDetail{
					Code:      admingen.ErrorCodeBadRequest,
					Message:   err.Error(),
					RequestId: reqID,
				},
			},
		}, nil
	}

	return admingen.AdminTotpDisable200Response{}, nil
}

func (s *Server) GetAdminCounters(ctx context.Context, _ admingen.GetAdminCountersRequestObject) (admingen.GetAdminCountersResponseObject, error) {
	// Query current stats from the DB
	var pendingOrders int
	var lowStockVariants int

	// Count orders awaiting confirmation
	_ = s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM orders WHERE status = 'menunggu_konfirmasi'").Scan(&pendingOrders)

	// Count low stock variants (stock <= 3)
	_ = s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM variants WHERE stock <= 3").Scan(&lowStockVariants)

	return admingen.GetAdminCounters200JSONResponse{
		PendingOrders:    pendingOrders,
		LowStockVariants: lowStockVariants,
		UnreadMessages:   0,
		PendingReviews:   0,
	}, nil
}
