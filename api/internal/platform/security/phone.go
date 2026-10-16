package security

import (
	"errors"
	"regexp"
	"strings"
)

var (
	ErrInvalidPhone = errors.New("nomor telepon tidak valid, gunakan format 08xx atau +628xx (10-14 digit)")
	phoneCleanRegex = regexp.MustCompile(`[^\d+]`)
)

// NormalizeIndonesianPhone normalizes Indonesian phone numbers into 628xxxxxxxxxx format.
// Accepts: 08..., +628..., 628... with length between 10 and 14 digits.
func NormalizeIndonesianPhone(phone string) (string, error) {
	cleaned := strings.TrimSpace(phone)
	cleaned = phoneCleanRegex.ReplaceAllString(cleaned, "")

	if strings.HasPrefix(cleaned, "+62") {
		cleaned = cleaned[1:] // strip '+'
	} else if strings.HasPrefix(cleaned, "08") {
		cleaned = "62" + cleaned[1:]
	} else if !strings.HasPrefix(cleaned, "628") {
		return "", ErrInvalidPhone
	}

	// Must be digits only and start with 628
	if !strings.HasPrefix(cleaned, "628") {
		return "", ErrInvalidPhone
	}

	// Total length between 11 and 15 characters (corresponding to 10-14 original digits)
	if len(cleaned) < 11 || len(cleaned) > 15 {
		return "", ErrInvalidPhone
	}

	return cleaned, nil
}
