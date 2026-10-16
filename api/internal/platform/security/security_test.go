package security_test

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/gmc/api/internal/platform/security"
)

func TestNormalizeIndonesianPhone(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{
			name:    "Standard 08xx",
			input:   "082232554674",
			want:    "6282232554674",
			wantErr: false,
		},
		{
			name:    "International with plus +628xx",
			input:   "+6282232554674",
			want:    "6282232554674",
			wantErr: false,
		},
		{
			name:    "International without plus 628xx",
			input:   "6282232554674",
			want:    "6282232554674",
			wantErr: false,
		},
		{
			name:    "Formatted with dashes and spaces",
			input:   "0812 - 3456 - 7890",
			want:    "6281234567890",
			wantErr: false,
		},
		{
			name:    "Min length valid (10 original digits -> 11 chars)",
			input:   "0812345678",
			want:    "62812345678",
			wantErr: false,
		},
		{
			name:    "Max length valid (14 original digits -> 15 chars)",
			input:   "08123456789012",
			want:    "628123456789012",
			wantErr: false,
		},
		{
			name:    "Invalid: too short",
			input:   "081234",
			wantErr: true,
		},
		{
			name:    "Invalid: too long",
			input:   "081234567890123456",
			wantErr: true,
		},
		{
			name:    "Invalid prefix (not 08/628)",
			input:   "071234567890",
			wantErr: true,
		},
		{
			name:    "Foreign prefix (+1 US)",
			input:   "+15551234567",
			wantErr: true,
		},
		{
			name:    "Empty string",
			input:   "",
			wantErr: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := security.NormalizeIndonesianPhone(tc.input)
			if tc.wantErr {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tc.want, got)
			}
		})
	}
}

func TestArgon2idPasswordHashing(t *testing.T) {
	password := "S4fePassw0rd!#GMC"

	hash, err := security.HashPassword(password)
	require.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.Contains(t, hash, "$argon2id$")

	// Must verify successfully
	match, err := security.VerifyPassword(password, hash)
	require.NoError(t, err)
	assert.True(t, match)

	// Must reject wrong password
	match, err = security.VerifyPassword("WrongPassword123", hash)
	require.NoError(t, err)
	assert.False(t, match)

	// Must reject malformed hash
	_, err = security.VerifyPassword(password, "malformed-hash-string")
	assert.Error(t, err)
}

func TestJWT(t *testing.T) {
	secret := "a-very-long-secret-key-that-is-at-least-32-chars-long!"
	ttl := 15 * time.Minute

	userID := uuid.New()
	sessionID := uuid.New()
	role := "customer"

	// 1. Issue access token
	tokenStr, err := security.GenerateAccessToken(userID, sessionID, role, ttl, secret)
	require.NoError(t, err)
	assert.NotEmpty(t, tokenStr)

	// 2. Validate token
	claims, err := security.ParseAccessToken(tokenStr, secret)
	require.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, sessionID, claims.SessionID)
	assert.Equal(t, role, claims.Role)

	// 3. Reject invalid secret
	_, err = security.ParseAccessToken(tokenStr, "different-secret-key-that-is-also-32-chars-long!!")
	assert.Error(t, err)

	// 4. Reject expired token
	expiredToken, err := security.GenerateAccessToken(userID, sessionID, role, -1*time.Minute, secret)
	require.NoError(t, err)

	_, err = security.ParseAccessToken(expiredToken, secret)
	assert.Error(t, err)
}
