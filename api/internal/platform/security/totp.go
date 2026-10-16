package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"

	"github.com/pquerna/otp/totp"
)

var (
	ErrInvalidTOTPCode  = errors.New("kode 2FA tidak valid atau telah kedaluwarsa")
	ErrInvalidBackupKey = errors.New("kunci enkripsi TOTP tidak valid")
)

type TOTPSetupResult struct {
	SecretKey   string
	URL         string
	BackupCodes []string
}

// GenerateTOTPSecret generates a new TOTP key for the given email.
func GenerateTOTPSecret(email, issuer string) (*TOTPSetupResult, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: email,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate totp key: %w", err)
	}

	backupCodes := make([]string, 8)
	for i := 0; i < 8; i++ {
		codeBytes := make([]byte, 5)
		if _, err := io.ReadFull(rand.Reader, codeBytes); err != nil {
			return nil, err
		}
		backupCodes[i] = fmt.Sprintf("%X", codeBytes)
	}

	return &TOTPSetupResult{
		SecretKey:   key.Secret(),
		URL:         key.URL(),
		BackupCodes: backupCodes,
	}, nil
}

// VerifyTOTPCode verifies a passcode against a secret.
func VerifyTOTPCode(passcode, secret string) bool {
	return totp.Validate(passcode, secret)
}

// EncryptTOTPSecret encrypts the plaintext secret using AES-256-GCM.
func EncryptTOTPSecret(plainSecret string, encKey []byte) ([]byte, error) {
	key := derive32ByteKey(encKey)
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plainSecret), nil)
	return ciphertext, nil
}

// DecryptTOTPSecret decrypts an AES-256-GCM encrypted secret.
func DecryptTOTPSecret(cipherBytes []byte, encKey []byte) (string, error) {
	key := derive32ByteKey(encKey)
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(cipherBytes) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := cipherBytes[:nonceSize], cipherBytes[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt totp secret: %w", err)
	}

	return string(plaintext), nil
}

func derive32ByteKey(raw []byte) []byte {
	if len(raw) == 32 {
		return raw
	}
	hash := sha256.Sum256(raw)
	return hash[:]
}

// ParseEncryptionKey decodes base64 key or derives 32 bytes from raw string.
func ParseEncryptionKey(keyStr string) []byte {
	if decoded, err := base64.StdEncoding.DecodeString(keyStr); err == nil && len(decoded) == 32 {
		return decoded
	}
	hash := sha256.Sum256([]byte(keyStr))
	return hash[:]
}
