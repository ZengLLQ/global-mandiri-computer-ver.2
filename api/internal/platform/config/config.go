package config

import (
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv            string
	SiteURL           string
	APIPort           int
	DatabaseURL       string
	JWTSecret         string
	AccessTTL         time.Duration
	RefreshTTL        time.Duration
	CookieSecure      bool
	CookieSameSite    string
	RefreshCookiePath string
	AllowedOrigins    []string
	CORSAllowedOrigins []string
	TrustedProxies    []*net.IPNet
	WhatsAppNumber    string
	StoreName         string
	StoreTZ           string
	AdminEmail        string
	AdminPassword     string
	TOTPEncKey        []byte
	AdminRefreshIdleTTL time.Duration
	AdminAbsoluteTTL  time.Duration
}

func Load() (*Config, error) {
	// Load .env if present (ignore error if missing)
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	var errs []string

	appEnv := getEnv("APP_ENV", "development")
	if appEnv != "development" && appEnv != "production" {
		errs = append(errs, fmt.Sprintf("APP_ENV must be 'development' or 'production', got %q", appEnv))
	}

	siteURL := getEnv("SITE_URL", "http://localhost:3000")
	if _, err := url.ParseRequestURI(siteURL); err != nil {
		errs = append(errs, fmt.Sprintf("SITE_URL must be a valid URL, got %q", siteURL))
	}

	apiPortStr := getEnv("API_PORT", getEnv("PORT", "8080"))
	apiPort, err := strconv.Atoi(apiPortStr)
	if err != nil || apiPort <= 0 || apiPort > 65535 {
		errs = append(errs, fmt.Sprintf("API_PORT must be a valid port number, got %q", apiPortStr))
	}

	dbURL := getEnv("DATABASE_URL", "")
	if dbURL == "" {
		errs = append(errs, "DATABASE_URL is required")
	}

	jwtSecret := getEnv("JWT_SECRET", "")
	if len(jwtSecret) < 32 {
		errs = append(errs, "JWT_SECRET must be at least 32 characters long")
	}
	if appEnv == "production" && strings.Contains(jwtSecret, "change-me") {
		errs = append(errs, "JWT_SECRET must not use placeholder value in production")
	}

	accessTTLStr := getEnv("ACCESS_TTL", "15m")
	accessTTL, err := time.ParseDuration(accessTTLStr)
	if err != nil || accessTTL <= 0 {
		errs = append(errs, fmt.Sprintf("ACCESS_TTL must be a valid duration (e.g. 15m), got %q", accessTTLStr))
	}

	refreshTTLStr := getEnv("REFRESH_TTL", "720h")
	refreshTTL, err := time.ParseDuration(refreshTTLStr)
	if err != nil || refreshTTL <= 0 {
		errs = append(errs, fmt.Sprintf("REFRESH_TTL must be a valid duration (e.g. 720h), got %q", refreshTTLStr))
	}

	cookieSecureStr := getEnv("COOKIE_SECURE", "false")
	cookieSecure := cookieSecureStr == "true" || cookieSecureStr == "1"
	if appEnv == "production" && !cookieSecure {
		errs = append(errs, "COOKIE_SECURE must be true in production")
	}

	cookieSameSite := getEnv("COOKIE_SAMESITE", "Lax")
	switch strings.ToLower(cookieSameSite) {
	case "lax":
		cookieSameSite = "Lax"
	case "strict":
		cookieSameSite = "Strict"
	case "none":
		cookieSameSite = "None"
	default:
		errs = append(errs, fmt.Sprintf("COOKIE_SAMESITE must be Lax, Strict, or None, got %q", cookieSameSite))
	}

	refreshCookiePath := getEnv("REFRESH_COOKIE_PATH", "/")

	allowedOriginsRaw := getEnv("ALLOWED_ORIGINS", siteURL)
	var allowedOrigins []string
	for _, o := range strings.Split(allowedOriginsRaw, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			allowedOrigins = append(allowedOrigins, o)
		}
	}

	corsOriginsRaw := getEnv("CORS_ALLOWED_ORIGINS", "")
	var corsAllowedOrigins []string
	if corsOriginsRaw != "" {
		for _, o := range strings.Split(corsOriginsRaw, ",") {
			o = strings.TrimSpace(o)
			if o != "" {
				corsAllowedOrigins = append(corsAllowedOrigins, o)
			}
		}
	}

	trustedProxiesRaw := getEnv("TRUSTED_PROXIES", "127.0.0.1/32,::1/128,172.16.0.0/12,10.0.0.0/8,192.168.0.0/16")
	var trustedProxies []*net.IPNet
	for _, cidr := range strings.Split(trustedProxiesRaw, ",") {
		cidr = strings.TrimSpace(cidr)
		if cidr == "" {
			continue
		}
		if !strings.Contains(cidr, "/") {
			if strings.Contains(cidr, ":") {
				cidr += "/128"
			} else {
				cidr += "/32"
			}
		}
		_, ipNet, err := net.ParseCIDR(cidr)
		if err != nil {
			errs = append(errs, fmt.Sprintf("invalid CIDR in TRUSTED_PROXIES %q: %v", cidr, err))
		} else {
			trustedProxies = append(trustedProxies, ipNet)
		}
	}

	waNumber := getEnv("WHATSAPP_NUMBER", "6282232554674")
	storeName := getEnv("STORE_NAME", "Global Mandiri Computer")
	storeTZ := getEnv("STORE_TZ", "Asia/Jakarta")
	if _, err := time.LoadLocation(storeTZ); err != nil {
		errs = append(errs, fmt.Sprintf("STORE_TZ must be a valid timezone, got %q", storeTZ))
	}

	adminEmail := getEnv("ADMIN_EMAIL", "admin@globalmandiri.com")
	adminPassword := getEnv("ADMIN_PASSWORD", "AdminGMC2026!Secure")

	totpKeyRaw := getEnv("TOTP_ENC_KEY", "")
	var totpEncKey []byte
	if totpKeyRaw != "" {
		decoded, err := base64.StdEncoding.DecodeString(totpKeyRaw)
		if err != nil || len(decoded) != 32 {
			errs = append(errs, "TOTP_ENC_KEY must be a valid 32-byte base64 encoded string")
		} else {
			totpEncKey = decoded
		}
	} else {
		if appEnv == "production" {
			errs = append(errs, "TOTP_ENC_KEY is required in production (32-byte base64)")
		} else {
			h := sha256.Sum256([]byte(jwtSecret + ":totp-dev-salt"))
			totpEncKey = h[:]
		}
	}

	adminRefreshIdleTTL := 2 * time.Hour
	adminAbsoluteTTL := 12 * time.Hour

	if len(errs) > 0 {
		return nil, fmt.Errorf("configuration errors:\n  - %s", strings.Join(errs, "\n  - "))
	}

	return &Config{
		AppEnv:             appEnv,
		SiteURL:            siteURL,
		APIPort:            apiPort,
		DatabaseURL:        dbURL,
		JWTSecret:          jwtSecret,
		AccessTTL:          accessTTL,
		RefreshTTL:         refreshTTL,
		CookieSecure:       cookieSecure,
		CookieSameSite:     cookieSameSite,
		RefreshCookiePath:  refreshCookiePath,
		AllowedOrigins:     allowedOrigins,
		CORSAllowedOrigins: corsAllowedOrigins,
		TrustedProxies:     trustedProxies,
		WhatsAppNumber:     waNumber,
		StoreName:          storeName,
		StoreTZ:            storeTZ,
		AdminEmail:          adminEmail,
		AdminPassword:       adminPassword,
		TOTPEncKey:          totpEncKey,
		AdminRefreshIdleTTL: adminRefreshIdleTTL,
		AdminAbsoluteTTL:   adminAbsoluteTTL,
	}, nil
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
