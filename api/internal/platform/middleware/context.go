package middleware

import (
	"context"
	"net/http"
)

type httpReqKey struct{}

func InjectRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), httpReqKey{}, r)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequestFromContext(ctx context.Context) *http.Request {
	if r, ok := ctx.Value(httpReqKey{}).(*http.Request); ok {
		return r
	}
	return nil
}
