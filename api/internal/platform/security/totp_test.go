package security_test

import (
	"testing"
	"time"

	"github.com/pquerna/otp/totp"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/gmc/api/internal/platform/security"
)

func TestTOTPEncryptionAndValidation(t *testing.T) {
	keyBytes := security.ParseEncryptionKey("0123456789abcdef0123456789abcdef")

	// 1. Generate TOTP secret
	res, err := security.GenerateTOTPSecret("test@example.com", "Global Mandiri Computer")
	require.NoError(t, err)
	assert.NotEmpty(t, res.SecretKey)
	assert.NotEmpty(t, res.URL)
	assert.Len(t, res.BackupCodes, 8)

	// 2. Encrypt and decrypt secret
	encrypted, err := security.EncryptTOTPSecret(res.SecretKey, keyBytes)
	require.NoError(t, err)
	assert.NotEmpty(t, encrypted)

	decrypted, err := security.DecryptTOTPSecret(encrypted, keyBytes)
	require.NoError(t, err)
	assert.Equal(t, res.SecretKey, decrypted)

	// 3. Generate current code and validate
	code, err := totp.GenerateCode(res.SecretKey, time.Now())
	require.NoError(t, err)

	valid := security.VerifyTOTPCode(code, res.SecretKey)
	assert.True(t, valid, "Current code should validate")

	// Invalid code fails
	assert.False(t, security.VerifyTOTPCode("000000", res.SecretKey))
}
