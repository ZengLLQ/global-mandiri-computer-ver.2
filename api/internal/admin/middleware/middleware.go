package middleware

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gmc/api/internal/admin/audit"
	"github.com/gmc/api/internal/admin/rbac"
	"github.com/gmc/api/internal/gen/admingen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/logger"
	"github.com/gmc/api/internal/platform/security"
)

type ctxKey string

const (
	adminContextKey ctxKey = "admin_context"
)

type AdminContext struct {
	User      db.User
	SessionID uuid.UUID
	Role      string
}

func ContextWithAdmin(ctx context.Context, adm AdminContext) context.Context {
	return context.WithValue(ctx, adminContextKey, adm)
}

func AdminFromContext(ctx context.Context) (AdminContext, bool) {
	adm, ok := ctx.Value(adminContextKey).(AdminContext)
	return adm, ok
}

// RequireAdminSession validates the JWT carrying adm: true and performs database re-validation.
func RequireAdminSession(pool *pgxpool.Pool, queries *db.Queries, cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if strings.HasSuffix(path, "/admin/auth/login") || strings.HasSuffix(path, "/admin/auth/refresh") {
				next.ServeHTTP(w, r)
				return
			}

			tokenString := ""

			// 1. Check Authorization header
			authHeader := r.Header.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			} else if cookie, err := r.Cookie("gmc_at"); err == nil {
				tokenString = cookie.Value
			}

			if tokenString == "" {
				renderError(w, r, http.StatusUnauthorized, admingen.ErrorCodeUnauthorized, "Token akses admin tidak ditemukan")
				return
			}

			claims, err := security.ParseAccessToken(tokenString, cfg.JWTSecret)
			if err != nil {
				if errors.Is(err, security.ErrTokenExpired) {
					renderError(w, r, http.StatusUnauthorized, admingen.ErrorCodeTokenExpired, "Token akses admin telah kedaluwarsa")
					return
				}
				renderError(w, r, http.StatusUnauthorized, admingen.ErrorCodeUnauthorized, "Token akses admin tidak valid")
				return
			}

			if !claims.IsAdmin {
				renderError(w, r, http.StatusForbidden, admingen.ErrorCodeForbidden, "Sesi ini bukan sesi admin")
				return
			}

			// 2. Re-read user from database
			user, err := queries.GetUserByID(r.Context(), claims.UserID)
			if err != nil || !user.IsActive || (user.Role != "admin" && user.Role != "staff") {
				renderError(w, r, http.StatusUnauthorized, admingen.ErrorCodeUnauthorized, "Pengguna admin tidak aktif atau tidak ditemukan")
				return
			}

			// 3. Password change gate
			if user.MustChangePassword {
				path := r.URL.Path
				if !strings.HasSuffix(path, "/admin/account/password") &&
					!strings.HasSuffix(path, "/admin/auth/logout") &&
					!strings.HasSuffix(path, "/admin/me") {
					renderError(w, r, http.StatusForbidden, admingen.ErrorCodeForbidden, "Wajib mengganti kata sandi terlebih dahulu")
					return
				}
			}

			admCtx := AdminContext{
				User:      user,
				SessionID: claims.SessionID,
				Role:      string(user.Role),
			}

			actor := audit.Actor{
				ID:    user.ID,
				Email: user.Email,
				Role:  string(user.Role),
				IP:    r.RemoteAddr,
			}

			ctx := ContextWithAdmin(r.Context(), admCtx)
			ctx = audit.ContextWithActor(ctx, actor)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RBACStrictMiddleware generates oapi-codegen StrictMiddlewareFunc that checks permissions per operation.
func RBACStrictMiddleware(pool *pgxpool.Pool) admingen.StrictMiddlewareFunc {
	return func(f admingen.StrictHandlerFunc, operationID string) admingen.StrictHandlerFunc {
		req, ok := rbac.OperationRequirements[operationID]
		if !ok {
			panic(fmt.Sprintf("security violation: operation %q is not registered in RBAC table", operationID))
		}

		return func(ctx context.Context, w http.ResponseWriter, r *http.Request, request any) (any, error) {
			if req.Public {
				return f(ctx, w, r, request)
			}

			adm, ok := AdminFromContext(ctx)
			if !ok {
				return admingen.AdminLogin401JSONResponse{
					UnauthorizedJSONResponse: admingen.UnauthorizedJSONResponse{
						Error: admingen.ErrorDetail{
							Code:      admingen.ErrorCodeUnauthorized,
							Message:   "Otentikasi admin diperlukan",
							RequestId: logger.RequestIDFromContext(ctx),
						},
					},
				}, nil
			}

			if req.AnyAdmin {
				return f(ctx, w, r, request)
			}

			if !rbac.HasPermission(adm.Role, req.Perm) {
				// Audit permission denied
				_ = audit.Record(ctx, nil, audit.Entry{
					Action:     "admin.permission_denied",
					EntityType: "operation",
					EntityID:   &operationID,
					Summary:    fmt.Sprintf("Akses ditolak untuk peran %s pada operasi %s", adm.Role, operationID),
				})

				return admingen.AdminLogin403JSONResponse{
					ForbiddenJSONResponse: admingen.ForbiddenJSONResponse{
						Error: admingen.ErrorDetail{
							Code:      admingen.ErrorCodeForbidden,
							Message:   fmt.Sprintf("Izin '%s' diperlukan untuk operasi ini", req.Perm),
							RequestId: logger.RequestIDFromContext(ctx),
						},
					},
				}, nil
			}

			return f(ctx, w, r, request)
		}
	}
}

func renderError(w http.ResponseWriter, r *http.Request, status int, code admingen.ErrorCode, message string) {
	reqID := logger.RequestIDFromContext(r.Context())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = fmt.Fprintf(w, `{"error":{"code":"%s","message":"%s","requestId":"%s"}}`, code, message, reqID)
}
