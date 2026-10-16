package contact

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/database"
	"github.com/gmc/api/internal/platform/ids"
	"github.com/gmc/api/internal/platform/security"
	"github.com/gmc/api/internal/platform/whatsapp"
)

type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
	cfg     *config.Config
	idGen   ids.Generator
}

func NewService(pool *pgxpool.Pool, queries *db.Queries, cfg *config.Config, idGen ids.Generator) *Service {
	return &Service{
		pool:    pool,
		queries: queries,
		cfg:     cfg,
		idGen:   idGen,
	}
}

func (s *Service) SubmitContact(ctx context.Context, req gen.ContactRequest) (string, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return "", errors.New("nama tidak boleh kosong")
	}

	email := strings.ToLower(strings.TrimSpace(string(req.Email)))
	if email == "" || !strings.Contains(email, "@") {
		return "", errors.New("alamat email tidak valid")
	}

	phone, err := security.NormalizeIndonesianPhone(req.Phone)
	if err != nil {
		return "", err
	}

	message := strings.TrimSpace(req.Message)
	if len(message) < 10 || len(message) > 2000 {
		return "", errors.New("pesan harus antara 10 hingga 2000 karakter")
	}

	waURL := whatsapp.BuildContactInquiryURL(
		s.cfg.WhatsAppNumber,
		s.cfg.StoreName,
		name,
		string(req.Subject),
		message,
	)

	// Honeypot check: website field must be empty
	if req.Website != nil && strings.TrimSpace(*req.Website) != "" {
		// Silent discard: return valid whatsapp URL without saving to database
		return waURL, nil
	}

	msgID := s.idGen.New()
	_, err = s.queries.CreateContactMessage(ctx, db.CreateContactMessageParams{
		ID:      msgID,
		Name:    name,
		Email:   email,
		Phone:   phone,
		Subject: string(req.Subject),
		Message: message,
	})
	if err != nil {
		return "", err
	}

	return waURL, nil
}

func (s *Service) SubscribeNewsletter(ctx context.Context, email string, name *string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || !strings.Contains(email, "@") {
		return errors.New("alamat email tidak valid")
	}

	subID := s.idGen.New()
	return s.queries.CreateNewsletterSubscriber(ctx, db.CreateNewsletterSubscriberParams{
		ID:    subID,
		Email: email,
		Name:  database.StringPtrToText(name),
	})
}
