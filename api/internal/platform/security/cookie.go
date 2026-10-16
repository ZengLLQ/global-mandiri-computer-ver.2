package security

import (
	"net/http"
	"strings"
	"time"
)

func ParseSameSite(s string) http.SameSite {
	switch strings.ToLower(s) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func SetAuthCookies(
	w http.ResponseWriter,
	accessToken string,
	rawRefreshToken string,
	accessTTL time.Duration,
	refreshTTL time.Duration,
	secure bool,
	sameSiteStr string,
	refreshPath string,
) {
	sameSite := ParseSameSite(sameSiteStr)

	http.SetCookie(w, &http.Cookie{
		Name:     "gmc_at",
		Value:    accessToken,
		Path:     "/",
		MaxAge:   int(accessTTL.Seconds()),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	if refreshPath == "" {
		refreshPath = "/"
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "gmc_rt",
		Value:    rawRefreshToken,
		Path:     refreshPath,
		MaxAge:   int(refreshTTL.Seconds()),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})
}

func ClearAuthCookies(
	w http.ResponseWriter,
	secure bool,
	sameSiteStr string,
	refreshPath string,
) {
	sameSite := ParseSameSite(sameSiteStr)

	http.SetCookie(w, &http.Cookie{
		Name:     "gmc_at",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	if refreshPath == "" {
		refreshPath = "/"
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "gmc_rt",
		Value:    "",
		Path:     refreshPath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})
}

func GetCookie(r *http.Request, name string) string {
	c, err := r.Cookie(name)
	if err != nil {
		return ""
	}
	return c.Value
}
