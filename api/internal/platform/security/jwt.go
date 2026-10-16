package security

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrTokenExpired = errors.New("token expired")
)

type JWTClaims struct {
	UserID    uuid.UUID `json:"sub"`
	Role      string    `json:"role"`
	SessionID uuid.UUID `json:"sid"`
	IsAdmin   bool      `json:"adm,omitempty"`
	jwt.RegisteredClaims
}

func GenerateAccessToken(userID, sessionID uuid.UUID, role string, ttl time.Duration, secret string) (string, error) {
	now := time.Now().UTC()
	claims := JWTClaims{
		UserID:    userID,
		Role:      role,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "gmc-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func GenerateAdminAccessToken(userID, sessionID uuid.UUID, role string, ttl time.Duration, secret string) (string, error) {
	now := time.Now().UTC()
	claims := JWTClaims{
		UserID:    userID,
		Role:      role,
		SessionID: sessionID,
		IsAdmin:   true,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "gmc-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseAccessToken(tokenString string, secret string) (*JWTClaims, error) {
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
		jwt.WithLeeway(30*time.Second),
	)

	token, err := parser.ParseWithClaims(tokenString, &JWTClaims{}, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing algorithm: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// GenerateRefreshToken generates a secure 256-bit opaque refresh token.
// Returns the hex raw token (for the cookie) and the raw SHA-256 byte slice (for database storage).
func GenerateRefreshToken() (string, []byte, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", nil, err
	}
	rawToken := hex.EncodeToString(b)
	hash := sha256.Sum256([]byte(rawToken))
	return rawToken, hash[:], nil
}

// HashRefreshToken hashes an opaque refresh token using SHA-256 for database lookup.
func HashRefreshToken(rawToken string) []byte {
	hash := sha256.Sum256([]byte(rawToken))
	return hash[:]
}
