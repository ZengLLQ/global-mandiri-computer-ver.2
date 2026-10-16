package logger

import (
	"context"
	"log/slog"
	"os"
)

type ctxKey string

const requestIDKey ctxKey = "requestID"

func New(env string) *slog.Logger {
	var handler slog.Handler
	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}
	if env == "development" {
		opts.Level = slog.LevelDebug
	}

	handler = slog.NewJSONHandler(os.Stdout, opts)
	return slog.New(handler)
}

func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey, requestID)
}

func RequestIDFromContext(ctx context.Context) string {
	if val, ok := ctx.Value(requestIDKey).(string); ok {
		return val
	}
	return ""
}

func MaskPhone(phone string) string {
	if len(phone) <= 3 {
		return "***"
	}
	return phone[:len(phone)-3] + "***"
}
