package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"runtime/debug"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"golang.org/x/time/rate"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/httpx"
	"github.com/gmc/api/internal/platform/logger"
)

type ctxKey string

const (
	clientIPKey ctxKey = "clientIP"
	userIDKey   ctxKey = "userID"
)

func WithUserID(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	val, ok := ctx.Value(userIDKey).(uuid.UUID)
	return val, ok
}

func ClientIPFromContext(ctx context.Context) string {
	if val, ok := ctx.Value(clientIPKey).(string); ok {
		return val
	}
	return ""
}

// RequestID middleware ensures every request has an X-Request-Id header.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-Id")
		if reqID == "" {
			reqID = uuid.NewString()
		}
		w.Header().Set("X-Request-Id", reqID)
		ctx := logger.WithRequestID(r.Context(), reqID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RealIP extracts client IP safely only from trusted proxies.
func RealIP(trustedProxies []*net.IPNet) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientIP := extractIP(r, trustedProxies)
			ctx := context.WithValue(r.Context(), clientIPKey, clientIP)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func extractIP(r *http.Request, trustedProxies []*net.IPNet) string {
	remoteHost, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		remoteHost = r.RemoteAddr
	}
	remoteIP := net.ParseIP(remoteHost)
	if remoteIP == nil {
		return remoteHost
	}

	isTrusted := false
	for _, ipNet := range trustedProxies {
		if ipNet.Contains(remoteIP) {
			isTrusted = true
			break
		}
	}

	if isTrusted {
		xff := r.Header.Get("X-Forwarded-For")
		if xff != "" {
			parts := strings.Split(xff, ",")
			clientIP := strings.TrimSpace(parts[0])
			if ip := net.ParseIP(clientIP); ip != nil {
				return clientIP
			}
		}
		xri := r.Header.Get("X-Real-IP")
		if xri != "" {
			if ip := net.ParseIP(strings.TrimSpace(xri)); ip != nil {
				return strings.TrimSpace(xri)
			}
		}
	}

	return remoteHost
}

// SecurityHeaders applies security headers to every response.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-site")
		next.ServeHTTP(w, r)
	})
}

// BodyLimit limits the incoming request body size to maxBytes.
func BodyLimit(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}

// CSRFOriginCheck validates Origin/Referer and X-Requested-With header on state mutations.
func CSRFOriginCheck(cfg *config.Config) func(http.Handler) http.Handler {
	allowedSet := make(map[string]bool)
	for _, origin := range cfg.AllowedOrigins {
		allowedSet[strings.TrimRight(origin, "/")] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
				// Skip health probes
				if r.URL.Path == "/healthz" || r.URL.Path == "/readyz" {
					next.ServeHTTP(w, r)
					return
				}

				reqWith := r.Header.Get("X-Requested-With")
				if reqWith != "gmc-web" {
					reqID := logger.RequestIDFromContext(r.Context())
					httpx.WriteError(w, reqID, gen.ErrorCodeForbidden, "Header X-Requested-With tidak valid", nil)
					return
				}

				origin := r.Header.Get("Origin")
				if origin == "" {
					referer := r.Header.Get("Referer")
					if referer != "" {
						if u, err := url.Parse(referer); err == nil {
							origin = fmt.Sprintf("%s://%s", u.Scheme, u.Host)
						}
					}
				}

				origin = strings.TrimRight(origin, "/")
				if origin == "" || !allowedSet[origin] {
					reqID := logger.RequestIDFromContext(r.Context())
					httpx.WriteError(w, reqID, gen.ErrorCodeForbidden, "Origin tidak diizinkan", nil)
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
	bytesWritten int
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	if r.statusCode == 0 {
		r.statusCode = http.StatusOK
	}
	n, err := r.ResponseWriter.Write(b)
	r.bytesWritten += n
	return n, err
}

// AccessLog logs every incoming request in structured JSON format.
func AccessLog(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &responseRecorder{ResponseWriter: w, statusCode: http.StatusOK}

			next.ServeHTTP(rec, r)

			duration := time.Since(start)
			reqID := logger.RequestIDFromContext(r.Context())
			clientIP := ClientIPFromContext(r.Context())

			fields := []any{
				"requestId", reqID,
				"method", r.Method,
				"path", r.URL.Path,
				"status", rec.statusCode,
				"durationMs", duration.Milliseconds(),
				"ip", clientIP,
			}

			if userID, ok := UserIDFromContext(r.Context()); ok {
				fields = append(fields, "userId", userID.String())
			}

			log.InfoContext(r.Context(), "HTTP access", fields...)
		})
	}
}

// Recoverer recovers from panics and logs with stack trace.
func Recoverer(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rvr := recover(); rvr != nil {
					reqID := logger.RequestIDFromContext(r.Context())
					stack := string(debug.Stack())
					log.ErrorContext(r.Context(), "Panic recovered",
						"requestId", reqID,
						"panic", fmt.Sprint(rvr),
						"stack", stack,
					)
					httpx.WriteError(w, reqID, gen.ErrorCodeInternal, "Terjadi kesalahan internal server", nil)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// IPTokenBucketRateLimiter tracks rate limits in memory per IP address.
type IPRateLimiter struct {
	mu      sync.Mutex
	limits  map[string]*rate.Limiter
	rate    rate.Limit
	burst   int
	cleanup time.Duration
}

func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	limiter := &IPRateLimiter{
		limits:  make(map[string]*rate.Limiter),
		rate:    r,
		burst:   b,
		cleanup: 10 * time.Minute,
	}
	return limiter
}

func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	lim, exists := i.limits[ip]
	if !exists {
		lim = rate.NewLimiter(i.rate, i.burst)
		i.limits[ip] = lim
	}
	return lim
}

func RateLimit(limiter *IPRateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := ClientIPFromContext(r.Context())
			if ip == "" {
				ip = r.RemoteAddr
			}

			l := limiter.GetLimiter(ip)
			if !l.Allow() {
				reqID := logger.RequestIDFromContext(r.Context())
				w.Header().Set("Retry-After", "60")
				httpx.WriteError(w, reqID, gen.ErrorCodeRateLimited, "Terlalu banyak permintaan, coba beberapa saat lagi", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
