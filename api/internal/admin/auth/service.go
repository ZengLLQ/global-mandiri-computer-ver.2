package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/netip"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/gmc/api/internal/admin/audit"
	"github.com/gmc/api/internal/admin/rbac"
	"github.com/gmc/api/internal/gen/admingen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/clock"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/database"
	"github.com/gmc/api/internal/platform/ids"
	"github.com/gmc/api/internal/platform/security"
)

var (
	ErrAccountLocked       = errors.New("akun terkunci sementara karena terlalu banyak percobaan gagal (silakan coba lagi dalam 15 menit)")
	ErrInvalidCredentials  = errors.New("email atau kata sandi tidak valid")
	ErrAccountInactive     = errors.New("akun dinonaktifkan")
	ErrUnauthorized        = errors.New("sesi tidak valid atau telah berakhir")
	ErrRequires2FA         = errors.New("otentikasi dua faktor (2FA) diperlukan")
	ErrInvalidTOTP         = errors.New("kode 2FA tidak valid")
	ErrPasswordTooWeak     = errors.New("kata sandi baru terlalu lemah (minimal 8 karakter)")
	ErrIncorrectPassword   = errors.New("kata sandi saat ini tidak sesuai")
	ErrNoPendingTOTP       = errors.New("tidak ada penyiapan 2FA yang tertunda")
)

type AdminLoginResult struct {
	AccessToken        string
	RawRefreshToken    string
	MustChangePassword bool
	Require2FA         bool
	TempToken          string
	User               *admingen.AdminUserWithPermissions
}

type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
	cfg     *config.Config
	clk     clock.Clock
	idGen   ids.Generator
	logger  *slog.Logger
}

func NewService(
	pool *pgxpool.Pool,
	queries *db.Queries,
	cfg *config.Config,
	clk clock.Clock,
	idGen ids.Generator,
	logger *slog.Logger,
) *Service {
	return &Service{
		pool:    pool,
		queries: queries,
		cfg:     cfg,
		clk:     clk,
		idGen:   idGen,
		logger:  logger,
	}
}

func (s *Service) Login(ctx context.Context, email, password, totpCode string, userAgent, ip string) (*AdminLoginResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	// 1. Lockout check
	attempts, err := s.queries.GetLoginAttempts(ctx, email)
	if err == nil && attempts.LockedUntil.Valid {
		if s.clk.Now().Before(attempts.LockedUntil.Time) {
			return nil, ErrAccountLocked
		}
	}

	// 2. Fetch user
	user, err := s.queries.GetAdminByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			_ = s.queries.RecordLoginFailure(ctx, email)
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, ErrAccountInactive
	}

	// 3. Verify password
	match, err := security.VerifyPassword(password, user.PasswordHash)
	if err != nil || !match {
		_ = s.queries.RecordLoginFailure(ctx, email)
		return nil, ErrInvalidCredentials
	}

	// 4. Check TOTP
	totpRow, err := s.queries.GetUserTOTP(ctx, user.ID)
	hasTotp := err == nil && totpRow.ConfirmedAt.Valid

	if hasTotp {
		if totpCode == "" {
			// Generate temporary token for 2FA challenge
			tempToken, err := security.GenerateAccessToken(user.ID, uuid.Nil, "2fa_pending", 5*time.Minute, s.cfg.JWTSecret)
			if err != nil {
				return nil, err
			}
			return &AdminLoginResult{
				Require2FA: true,
				TempToken:  tempToken,
			}, nil
		}

		// Verify TOTP code
		plainSecret, err := security.DecryptTOTPSecret(totpRow.SecretEnc, s.cfg.TOTPEncKey)
		if err != nil {
			s.logger.Error("failed to decrypt totp secret", "error", err, "userId", user.ID)
			return nil, errors.New("gagal memverifikasi 2FA")
		}

		if !security.VerifyTOTPCode(totpCode, plainSecret) {
			// Check backup codes
			matchedBackup := false
			var updatedBackupCodes [][]byte
			for _, bcHash := range totpRow.BackupCodesHash {
				if ok, _ := security.VerifyPassword(totpCode, string(bcHash)); ok {
					matchedBackup = true
				} else {
					updatedBackupCodes = append(updatedBackupCodes, bcHash)
				}
			}

			if matchedBackup {
				_ = s.queries.UpsertUserTOTP(ctx, db.UpsertUserTOTPParams{
					UserID:          user.ID,
					SecretEnc:       totpRow.SecretEnc,
					BackupCodesHash: updatedBackupCodes,
					ConfirmedAt:     totpRow.ConfirmedAt,
				})
			} else {
				_ = s.queries.RecordLoginFailure(ctx, email)
				return nil, ErrInvalidTOTP
			}
		}
	}

	// Success: Reset failures & create session
	_ = s.queries.ResetLoginAttempts(ctx, email)
	_ = s.queries.UpdateAdminLastLogin(ctx, user.ID)

	sessionID := s.idGen.New()
	familyID := sessionID
	rawRefreshToken, refreshTokenHash, err := security.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	now := s.clk.Now()
	expiresAt := now.Add(s.cfg.AdminRefreshIdleTTL)
	absExpiresAt := now.Add(s.cfg.AdminAbsoluteTTL)

	var userAgentText pgtype.Text
	if userAgent != "" {
		userAgentText = pgtype.Text{String: userAgent, Valid: true}
	}

	var ipAddr *netip.Addr
	if ip != "" {
		if addr, err := netip.ParseAddr(ip); err == nil {
			ipAddr = &addr
		}
	}

	_, err = s.queries.CreateAdminSession(ctx, db.CreateAdminSessionParams{
		ID:                sessionID,
		UserID:            user.ID,
		FamilyID:          familyID,
		TokenHash:         refreshTokenHash,
		UserAgent:         userAgentText,
		Ip:                ipAddr,
		ExpiresAt:         expiresAt,
		AbsoluteExpiresAt: pgtype.Timestamptz{Time: absExpiresAt, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create admin session: %w", err)
	}

	accessToken, err := security.GenerateAdminAccessToken(user.ID, sessionID, string(user.Role), s.cfg.AccessTTL, s.cfg.JWTSecret)
	if err != nil {
		return nil, err
	}

	adminUser := s.mapAdminUser(user, hasTotp)

	// Audit login
	_ = database.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		actor := audit.Actor{
			ID:    user.ID,
			Email: user.Email,
			Role:  string(user.Role),
			IP:    ip,
		}
		actCtx := audit.ContextWithActor(ctx, actor)
		return audit.Record(actCtx, tx, audit.Entry{
			Action:     "admin.login",
			EntityType: "user",
			EntityID:   &user.Email,
			Summary:    fmt.Sprintf("Admin %s berhasil masuk", user.Email),
		})
	})

	return &AdminLoginResult{
		AccessToken:        accessToken,
		RawRefreshToken:    rawRefreshToken,
		MustChangePassword: user.MustChangePassword,
		User:               adminUser,
	}, nil
}

func (s *Service) Refresh(ctx context.Context, rawRefreshToken string, userAgent, ip string) (*AdminLoginResult, error) {
	tokenHash := security.HashRefreshToken(rawRefreshToken)
	session, err := s.queries.GetSessionByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, ErrUnauthorized
	}

	if !session.IsAdminSession {
		return nil, ErrUnauthorized
	}

	now := s.clk.Now()
	if session.RevokedAt.Valid || session.ExpiresAt.Before(now) {
		return nil, ErrUnauthorized
	}
	if session.AbsoluteExpiresAt.Valid && session.AbsoluteExpiresAt.Time.Before(now) {
		return nil, ErrUnauthorized
	}

	user, err := s.queries.GetUserByID(ctx, session.UserID)
	if err != nil || !user.IsActive || (user.Role != "admin" && user.Role != "staff") {
		return nil, ErrUnauthorized
	}

	newSessionID := s.idGen.New()
	newRawRefreshToken, newRefreshTokenHash, err := security.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	newExpiresAt := now.Add(s.cfg.AdminRefreshIdleTTL)

	// Rotate session
	_, err = s.queries.RotateSession(ctx, db.RotateSessionParams{
		ID:         session.ID,
		ReplacedBy: pgtype.UUID{Bytes: newSessionID, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	var userAgentText pgtype.Text
	if userAgent != "" {
		userAgentText = pgtype.Text{String: userAgent, Valid: true}
	}

	var ipAddr *netip.Addr
	if ip != "" {
		if addr, err := netip.ParseAddr(ip); err == nil {
			ipAddr = &addr
		}
	}

	_, err = s.queries.CreateAdminSession(ctx, db.CreateAdminSessionParams{
		ID:                newSessionID,
		UserID:            user.ID,
		FamilyID:          session.FamilyID,
		TokenHash:         newRefreshTokenHash,
		UserAgent:         userAgentText,
		Ip:                ipAddr,
		ExpiresAt:         newExpiresAt,
		AbsoluteExpiresAt: session.AbsoluteExpiresAt,
	})
	if err != nil {
		return nil, err
	}

	accessToken, err := security.GenerateAdminAccessToken(user.ID, newSessionID, string(user.Role), s.cfg.AccessTTL, s.cfg.JWTSecret)
	if err != nil {
		return nil, err
	}

	totpRow, err := s.queries.GetUserTOTP(ctx, user.ID)
	hasTotp := err == nil && totpRow.ConfirmedAt.Valid

	return &AdminLoginResult{
		AccessToken:        accessToken,
		RawRefreshToken:    newRawRefreshToken,
		MustChangePassword: user.MustChangePassword,
		User:               s.mapAdminUser(user, hasTotp),
	}, nil
}

func (s *Service) Logout(ctx context.Context, sessionID uuid.UUID) error {
	return s.queries.RevokeSession(ctx, sessionID)
}

func (s *Service) ChangePassword(ctx context.Context, adminID uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.queries.GetUserByID(ctx, adminID)
	if err != nil {
		return ErrUnauthorized
	}

	match, err := security.VerifyPassword(currentPassword, user.PasswordHash)
	if err != nil || !match {
		return ErrIncorrectPassword
	}

	if len(newPassword) < 8 {
		return ErrPasswordTooWeak
	}

	hash, err := security.HashPassword(newPassword)
	if err != nil {
		return err
	}

	return database.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		if err := q.UpdateAdminPassword(ctx, db.UpdateAdminPasswordParams{
			ID:           adminID,
			PasswordHash: hash,
		}); err != nil {
			return err
		}

		return audit.Record(ctx, tx, audit.Entry{
			Action:     "admin.password_change",
			EntityType: "user",
			EntityID:   &user.Email,
			Summary:    fmt.Sprintf("Admin %s mengubah kata sandi", user.Email),
		})
	})
}

func (s *Service) SetupTOTP(ctx context.Context, adminID uuid.UUID, email string) (*security.TOTPSetupResult, error) {
	setup, err := security.GenerateTOTPSecret(email, "Global Mandiri Computer")
	if err != nil {
		return nil, err
	}

	encSecret, err := security.EncryptTOTPSecret(setup.SecretKey, s.cfg.TOTPEncKey)
	if err != nil {
		return nil, err
	}

	var hashedBackupCodes [][]byte
	for _, code := range setup.BackupCodes {
		hash, err := security.HashPassword(code)
		if err != nil {
			return nil, err
		}
		hashedBackupCodes = append(hashedBackupCodes, []byte(hash))
	}

	err = s.queries.UpsertUserTOTP(ctx, db.UpsertUserTOTPParams{
		UserID:          adminID,
		SecretEnc:       encSecret,
		BackupCodesHash: hashedBackupCodes,
		ConfirmedAt:     pgtype.Timestamptz{Valid: false},
	})
	if err != nil {
		return nil, err
	}

	return setup, nil
}

func (s *Service) EnableTOTP(ctx context.Context, adminID uuid.UUID, code string) error {
	totpRow, err := s.queries.GetUserTOTP(ctx, adminID)
	if err != nil {
		return ErrNoPendingTOTP
	}

	plainSecret, err := security.DecryptTOTPSecret(totpRow.SecretEnc, s.cfg.TOTPEncKey)
	if err != nil {
		return err
	}

	if !security.VerifyTOTPCode(code, plainSecret) {
		return ErrInvalidTOTP
	}

	now := s.clk.Now()
	return database.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		if err := q.UpsertUserTOTP(ctx, db.UpsertUserTOTPParams{
			UserID:          adminID,
			SecretEnc:       totpRow.SecretEnc,
			BackupCodesHash: totpRow.BackupCodesHash,
			ConfirmedAt:     pgtype.Timestamptz{Time: now, Valid: true},
		}); err != nil {
			return err
		}

		return audit.Record(ctx, tx, audit.Entry{
			Action:     "admin.totp_enable",
			EntityType: "user",
			Summary:    "2FA (TOTP) diaktifkan",
		})
	})
}

func (s *Service) DisableTOTP(ctx context.Context, adminID uuid.UUID, password string) error {
	user, err := s.queries.GetUserByID(ctx, adminID)
	if err != nil {
		return ErrUnauthorized
	}

	match, err := security.VerifyPassword(password, user.PasswordHash)
	if err != nil || !match {
		return ErrIncorrectPassword
	}

	return database.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		if err := q.DeleteUserTOTP(ctx, adminID); err != nil {
			return err
		}

		return audit.Record(ctx, tx, audit.Entry{
			Action:     "admin.totp_disable",
			EntityType: "user",
			Summary:    "2FA (TOTP) dinonaktifkan",
		})
	})
}

func (s *Service) GetMe(ctx context.Context, adminID uuid.UUID) (*admingen.AdminUserWithPermissions, error) {
	user, err := s.queries.GetUserByID(ctx, adminID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	totpRow, err := s.queries.GetUserTOTP(ctx, adminID)
	hasTotp := err == nil && totpRow.ConfirmedAt.Valid

	return s.mapAdminUser(user, hasTotp), nil
}

func (s *Service) mapAdminUser(user db.User, hasTotp bool) *admingen.AdminUserWithPermissions {
	role := admingen.Staff
	if user.Role == "admin" {
		role = admingen.Admin
	}

	perms := rbac.PermissionsForRole(string(user.Role))

	var lastLogin *time.Time
	if user.LastLoginAt.Valid {
		lastLogin = &user.LastLoginAt.Time
	}

	return &admingen.AdminUserWithPermissions{
		Id:                 user.ID,
		Name:               user.Name,
		Email:              openapi_types.Email(user.Email),
		Phone:              &user.Phone,
		Role:               role,
		IsActive:           user.IsActive,
		MustChangePassword: user.MustChangePassword,
		HasTotp:            hasTotp,
		LastLoginAt:        lastLogin,
		CreatedAt:          user.CreatedAt,
		Permissions:        perms,
	}
}
