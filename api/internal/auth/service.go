package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/clock"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/database"
	"github.com/gmc/api/internal/platform/ids"
	"github.com/gmc/api/internal/platform/security"
)

var (
	ErrEmailTaken         = errors.New("email sudah terdaftar")
	ErrInvalidCredentials = errors.New("email atau kata sandi tidak sesuai")
	ErrUnauthorized       = errors.New("sesi tidak valid atau telah berakhir")
	ErrTokenExpired       = errors.New("token akses telah kedaluwarsa")
)

type TokenPair struct {
	AccessToken     string
	RawRefreshToken string
	User            *gen.User
}

type Service struct {
	pool       *pgxpool.Pool
	queries    *db.Queries
	cfg        *config.Config
	clk        clock.Clock
	idGen      ids.Generator
	logger     *slog.Logger
	refreshMu  sync.Mutex // Serializes refresh token rotation per session family
}

func NewService(
	pool *pgxpool.Pool,
	queries *db.Queries,
	cfg *config.Config,
	clk clock.Clock,
	idGen ids.Generator,
	log *slog.Logger,
) *Service {
	return &Service{
		pool:    pool,
		queries: queries,
		cfg:     cfg,
		clk:     clk,
		idGen:   idGen,
		logger:  log,
	}
}

func (s *Service) Register(ctx context.Context, name, email, phone, password string, userAgent, ip string) (*TokenPair, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errors.New("nama lengkap tidak boleh kosong")
	}

	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || !strings.Contains(email, "@") {
		return nil, errors.New("alamat email tidak valid")
	}

	normalizedPhone, err := security.NormalizeIndonesianPhone(phone)
	if err != nil {
		return nil, err
	}

	if err := security.ValidatePasswordStrength(password); err != nil {
		return nil, err
	}

	passwordHash, err := security.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	userID := s.idGen.New()

	userRow, err := s.queries.CreateUser(ctx, db.CreateUserParams{
		ID:           userID,
		Email:        email,
		Name:         name,
		Phone:        normalizedPhone,
		PasswordHash: passwordHash,
		Role:         "customer",
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // unique violation
			return nil, ErrEmailTaken
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Create session
	sessionID := s.idGen.New()
	rawRefresh, tokenHash, err := security.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	expiresAt := s.clk.Now().Add(s.cfg.RefreshTTL)

	_, err = s.queries.CreateSession(ctx, db.CreateSessionParams{
		ID:        sessionID,
		UserID:    userID,
		FamilyID:  sessionID,
		TokenHash: tokenHash,
		UserAgent: database.StringToText(userAgent),
		Ip:        database.IPToNetipAddr(ip),
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	accessToken, err := security.GenerateAccessToken(userID, sessionID, userRow.Role, s.cfg.AccessTTL, s.cfg.JWTSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	user := &gen.User{
		Id:    userRow.ID,
		Email: openapi_types.Email(userRow.Email),
		Name:  userRow.Name,
		Phone: userRow.Phone,
		Role:  gen.UserRole(userRow.Role),
	}

	return &TokenPair{
		AccessToken:     accessToken,
		RawRefreshToken: rawRefresh,
		User:            user,
	}, nil
}

func (s *Service) Login(ctx context.Context, email, password string, userAgent, ip string) (*TokenPair, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	userRow, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	valid, err := security.VerifyPassword(password, userRow.PasswordHash)
	if err != nil || !valid {
		return nil, ErrInvalidCredentials
	}

	sessionID := s.idGen.New()
	rawRefresh, tokenHash, err := security.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	expiresAt := s.clk.Now().Add(s.cfg.RefreshTTL)

	_, err = s.queries.CreateSession(ctx, db.CreateSessionParams{
		ID:        sessionID,
		UserID:    userRow.ID,
		FamilyID:  sessionID,
		TokenHash: tokenHash,
		UserAgent: database.StringToText(userAgent),
		Ip:        database.IPToNetipAddr(ip),
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	accessToken, err := security.GenerateAccessToken(userRow.ID, sessionID, userRow.Role, s.cfg.AccessTTL, s.cfg.JWTSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	user := &gen.User{
		Id:    userRow.ID,
		Email: openapi_types.Email(userRow.Email),
		Name:  userRow.Name,
		Phone: userRow.Phone,
		Role:  gen.UserRole(userRow.Role),
	}

	return &TokenPair{
		AccessToken:     accessToken,
		RawRefreshToken: rawRefresh,
		User:            user,
	}, nil
}

// Refresh handles token rotation with race tolerance (10-second grace window).
func (s *Service) Refresh(ctx context.Context, rawRefreshToken string, userAgent, ip string) (*TokenPair, error) {
	if rawRefreshToken == "" {
		return nil, ErrUnauthorized
	}

	s.refreshMu.Lock()
	defer s.refreshMu.Unlock()

	tokenHash := security.HashRefreshToken(rawRefreshToken)
	session, err := s.queries.GetSessionByTokenHash(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	now := s.clk.Now()

	// Check revocation
	if session.RevokedAt.Valid {
		return nil, ErrUnauthorized
	}

	// Check expiration
	if session.ExpiresAt.Before(now) {
		return nil, ErrUnauthorized
	}

	// Fetch user details
	userRow, err := s.queries.GetUserByID(ctx, session.UserID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	// Check if already rotated
	if session.RotatedAt.Valid {
		// Rotation grace check: 10 seconds
		if now.Sub(session.RotatedAt.Time) <= 10*time.Second && session.ReplacedBy.Valid {
			// Race tolerance: return new access token for the successor session
			successorID := uuid.UUID(session.ReplacedBy.Bytes)
			accessToken, err := security.GenerateAccessToken(userRow.ID, successorID, userRow.Role, s.cfg.AccessTTL, s.cfg.JWTSecret)
			if err != nil {
				return nil, err
			}
			return &TokenPair{
				AccessToken:     accessToken,
				RawRefreshToken: rawRefreshToken, // Retain existing refreshed token during grace
				User: &gen.User{
					Id:    userRow.ID,
					Email: openapi_types.Email(userRow.Email),
					Name:  userRow.Name,
					Phone: userRow.Phone,
					Role:  gen.UserRole(userRow.Role),
				},
			}, nil
		}

		// Reused after grace window -> suspected theft! Revoke the whole family!
		s.logger.WarnContext(ctx, "Suspected refresh token reuse after grace window. Revoking session family",
			"familyId", session.FamilyID.String(),
			"userId", session.UserID.String(),
		)
		_ = s.queries.RevokeSessionFamily(ctx, session.FamilyID)
		return nil, ErrUnauthorized
	}

	// Issue new successor session
	newSessionID := s.idGen.New()
	newRawRefresh, newTokenHash, err := security.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	_, err = s.queries.CreateSession(ctx, db.CreateSessionParams{
		ID:        newSessionID,
		UserID:    session.UserID,
		FamilyID:  session.FamilyID,
		TokenHash: newTokenHash,
		UserAgent: database.StringToText(userAgent),
		Ip:        database.IPToNetipAddr(ip),
		ExpiresAt: now.Add(s.cfg.RefreshTTL),
	})
	if err != nil {
		return nil, err
	}

	// Mark current session as rotated
	_, err = s.queries.RotateSession(ctx, db.RotateSessionParams{
		ID:         session.ID,
		ReplacedBy: database.UUIDPtrToUUID(&newSessionID),
	})
	if err != nil {
		return nil, err
	}

	accessToken, err := security.GenerateAccessToken(userRow.ID, newSessionID, userRow.Role, s.cfg.AccessTTL, s.cfg.JWTSecret)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:     accessToken,
		RawRefreshToken: newRawRefresh,
		User: &gen.User{
			Id:    userRow.ID,
			Email: openapi_types.Email(userRow.Email),
			Name:  userRow.Name,
			Phone: userRow.Phone,
			Role:  gen.UserRole(userRow.Role),
		},
	}, nil
}

func (s *Service) Logout(ctx context.Context, rawRefreshToken string) error {
	if rawRefreshToken == "" {
		return nil
	}
	tokenHash := security.HashRefreshToken(rawRefreshToken)
	session, err := s.queries.GetSessionByTokenHash(ctx, tokenHash)
	if err == nil {
		_ = s.queries.RevokeSession(ctx, session.ID)
	}
	return nil
}

func (s *Service) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string, currentSessionID uuid.UUID) error {
	userRow, err := s.queries.GetUserByID(ctx, userID)
	if err != nil {
		return ErrUnauthorized
	}

	valid, err := security.VerifyPassword(currentPassword, userRow.PasswordHash)
	if err != nil || !valid {
		return ErrInvalidCredentials
	}

	if err := security.ValidatePasswordStrength(newPassword); err != nil {
		return err
	}

	newHash, err := security.HashPassword(newPassword)
	if err != nil {
		return err
	}

	_, err = s.queries.UpdateUserPassword(ctx, db.UpdateUserPasswordParams{
		ID:           userID,
		PasswordHash: newHash,
	})
	if err != nil {
		return err
	}

	// Revoke all other sessions for this user except current session
	_ = s.queries.RevokeAllUserSessionsExcept(ctx, db.RevokeAllUserSessionsExceptParams{
		UserID: userID,
		ID:     currentSessionID,
	})

	return nil
}
