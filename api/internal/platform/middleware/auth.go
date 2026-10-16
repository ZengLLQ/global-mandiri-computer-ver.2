package middleware

import (
	"context"
	"errors"
	"net/http"

	"github.com/google/uuid"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/httpx"
	"github.com/gmc/api/internal/platform/logger"
	"github.com/gmc/api/internal/platform/security"
)

type authCtxKey string

const (
	sessionIDKey authCtxKey = "sessionID"
	userRoleKey  authCtxKey = "userRole"
)

func WithSessionID(ctx context.Context, sessionID uuid.UUID) context.Context {
	return context.WithValue(ctx, sessionIDKey, sessionID)
}

func SessionIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	val, ok := ctx.Value(sessionIDKey).(uuid.UUID)
	return val, ok
}

func UserRoleFromContext(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(userRoleKey).(string)
	return val, ok
}

// AuthenticateCookie checks the gmc_at cookie and injects claims if valid.
func AuthenticateCookie(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenCookie, err := r.Cookie("gmc_at")
			if err != nil || tokenCookie.Value == "" {
				next.ServeHTTP(w, r)
				return
			}

			claims, err := security.ParseAccessToken(tokenCookie.Value, cfg.JWTSecret)
			if err != nil {
				if errors.Is(err, security.ErrTokenExpired) {
					// Check if this is a protected route before failing or allow public routes to proceed as guest
					// We tag context with token_expired
					ctx := context.WithValue(r.Context(), "auth_error", "token_expired")
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
				next.ServeHTTP(w, r)
				return
			}

			ctx := r.Context()
			ctx = WithUserID(ctx, claims.UserID)
			ctx = WithSessionID(ctx, claims.SessionID)
			ctx = context.WithValue(ctx, userRoleKey, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAuth enforces that the request has a valid authenticated session.
func RequireAuth(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	reqID := logger.RequestIDFromContext(r.Context())
	if authErr, ok := r.Context().Value("auth_error").(string); ok && authErr == "token_expired" {
		httpx.WriteError(w, reqID, gen.ErrorCodeTokenExpired, "Sesi telah kedaluwarsa, silakan muat ulang", nil)
		return uuid.Nil, false
	}

	userID, ok := UserIDFromContext(r.Context())
	if !ok || userID == uuid.Nil {
		httpx.WriteError(w, reqID, gen.ErrorCodeUnauthorized, "Silakan masuk terlebih dahulu", nil)
		return uuid.Nil, false
	}

	return userID, true
}
