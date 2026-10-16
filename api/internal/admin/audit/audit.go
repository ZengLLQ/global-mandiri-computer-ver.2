package audit

import (
	"context"
	"encoding/json"
	"net/netip"
	"regexp"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/logger"
)

var sensitiveKeyRegex = regexp.MustCompile(`(?i)(password|token|secret|totp|backup|hash)`)

type Actor struct {
	ID    uuid.UUID
	Email string
	Role  string
	IP    string
}

type ctxKey string

const actorCtxKey ctxKey = "audit_actor"

func ContextWithActor(ctx context.Context, actor Actor) context.Context {
	return context.WithValue(ctx, actorCtxKey, actor)
}

func ActorFromContext(ctx context.Context) (Actor, bool) {
	a, ok := ctx.Value(actorCtxKey).(Actor)
	return a, ok
}

type Entry struct {
	Action     string
	EntityType string
	EntityID   *string
	Summary    string
	Before     any
	After      any
}

func Record(ctx context.Context, tx pgx.Tx, entry Entry) error {
	queries := db.New(tx)
	actor, _ := ActorFromContext(ctx)
	reqID := logger.RequestIDFromContext(ctx)

	var beforeJSON []byte
	var afterJSON []byte
	var err error

	if entry.Before != nil {
		sanitizedBefore := sanitizeData(entry.Before)
		beforeJSON, err = json.Marshal(sanitizedBefore)
		if err != nil {
			return err
		}
	}

	if entry.After != nil {
		sanitizedAfter := sanitizeData(entry.After)
		afterJSON, err = json.Marshal(sanitizedAfter)
		if err != nil {
			return err
		}
	}

	auditID := uuid.New()

	var ipAddr *netip.Addr
	if actor.IP != "" {
		if addr, err := netip.ParseAddr(actor.IP); err == nil {
			ipAddr = &addr
		}
	}

	var actorUUID pgtype.UUID
	if actor.ID != uuid.Nil {
		actorUUID = pgtype.UUID{Bytes: actor.ID, Valid: true}
	}

	var entityIDText pgtype.Text
	if entry.EntityID != nil {
		entityIDText = pgtype.Text{String: *entry.EntityID, Valid: true}
	}

	var reqIDText pgtype.Text
	if reqID != "" {
		reqIDText = pgtype.Text{String: reqID, Valid: true}
	}

	actorEmail := actor.Email
	if actorEmail == "" {
		actorEmail = "system"
	}
	actorRole := actor.Role
	if actorRole == "" {
		actorRole = "system"
	}

	return queries.InsertAuditLog(ctx, db.InsertAuditLogParams{
		ID:         auditID,
		ActorID:    actorUUID,
		ActorEmail: actorEmail,
		ActorRole:  actorRole,
		Action:     entry.Action,
		EntityType: entry.EntityType,
		EntityID:   entityIDText,
		Summary:    entry.Summary,
		Before:     beforeJSON,
		After:      afterJSON,
		Ip:         ipAddr,
		RequestID:  reqIDText,
	})
}

func sanitizeData(val any) any {
	b, err := json.Marshal(val)
	if err != nil {
		return val
	}

	var m any
	if err := json.Unmarshal(b, &m); err != nil {
		return val
	}

	return maskMap(m)
}

func maskMap(v any) any {
	switch val := v.(type) {
	case map[string]any:
		res := make(map[string]any, len(val))
		for k, item := range val {
			if sensitiveKeyRegex.MatchString(k) {
				res[k] = "[REDACTED]"
			} else {
				res[k] = maskMap(item)
			}
		}
		return res
	case []any:
		res := make([]any, len(val))
		for i, item := range val {
			res[i] = maskMap(item)
		}
		return res
	default:
		return val
	}
}
