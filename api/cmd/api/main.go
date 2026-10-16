package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chi_middleware "github.com/go-chi/chi/v5/middleware"
	"golang.org/x/time/rate"

	adminauth "github.com/gmc/api/internal/admin/auth"
	adminmid "github.com/gmc/api/internal/admin/middleware"
	"github.com/gmc/api/internal/admin/rbac"
	adminserver "github.com/gmc/api/internal/admin/server"
	"github.com/gmc/api/internal/auth"
	"github.com/gmc/api/internal/cart"
	"github.com/gmc/api/internal/catalog"
	"github.com/gmc/api/internal/checkout"
	"github.com/gmc/api/internal/contact"
	"github.com/gmc/api/internal/customers"
	"github.com/gmc/api/internal/gen"
	"github.com/gmc/api/internal/gen/admingen"
	"github.com/gmc/api/internal/gen/db"
	"github.com/gmc/api/internal/platform/cache"
	"github.com/gmc/api/internal/platform/clock"
	"github.com/gmc/api/internal/platform/config"
	"github.com/gmc/api/internal/platform/database"
	"github.com/gmc/api/internal/platform/ids"
	"github.com/gmc/api/internal/platform/logger"
	"github.com/gmc/api/internal/platform/middleware"
	"github.com/gmc/api/internal/server"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		runHealthcheck()
		return
	}

	runServer()
}

func runHealthcheck() {
	port := os.Getenv("API_PORT")
	if port == "" {
		port = os.Getenv("PORT")
	}
	if port == "" {
		port = "8080"
	}

	url := fmt.Sprintf("http://127.0.0.1:%s/readyz", port)
	client := http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Healthcheck failed: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "Healthcheck returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}

	os.Exit(0)
}

func runServer() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "FATAL: Configuration error:\n%v\n", err)
		os.Exit(1)
	}

	log := logger.New(cfg.AppEnv)
	log.Info("Starting GMC API Server",
		"env", cfg.AppEnv,
		"port", cfg.APIPort,
		"store", cfg.StoreName,
	)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize database pool
	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("Failed to initialize database pool", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	queries := db.New(pool)
	memCache := cache.NewMemoryCache()
	clk := clock.New()
	idGen := ids.NewGenerator()

	// Boot-time RBAC completeness check
	if err := rbac.ValidateAllOperationsRegistered(); err != nil {
		log.Error("RBAC validation failed at boot time", "err", err)
		os.Exit(1)
	}

	// Initialize services
	catalogSvc := catalog.NewService(pool, queries, memCache, cfg.WhatsAppNumber, cfg.StoreName, cfg.SiteURL)
	catalogHdlr := catalog.NewHandler(catalogSvc)

	authSvc := auth.NewService(pool, queries, cfg, clk, idGen, log)
	authHdlr := auth.NewHandler(authSvc, cfg)

	custSvc := customers.NewService(pool, queries, catalogSvc, idGen)
	cartSvc := cart.NewService(pool, queries)
	checkoutSvc := checkout.NewService(pool, queries, cfg, clk, idGen, log)
	contactSvc := contact.NewService(pool, queries, cfg, idGen)

	// Initialize admin services
	adminAuthSvc := adminauth.NewService(pool, queries, cfg, clk, idGen, log)
	adminSrv := adminserver.NewServer(pool, queries, cfg, adminAuthSvc)

	// Background worker for 48-hour order expiry
	expiryWorker := checkout.NewExpiryWorker(pool, queries, idGen, log)
	expiryWorker.Start()
	defer expiryWorker.Stop()

	// Strict server
	compServer := server.NewServer(
		pool,
		cfg,
		catalogHdlr,
		authHdlr,
		authSvc,
		custSvc,
		cartSvc,
		checkoutSvc,
		contactSvc,
	)

	// Global rate limiter: 120 req/min
	rateLimiter := middleware.NewIPRateLimiter(rate.Limit(2), 60)

	// Router setup
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP(cfg.TrustedProxies))
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.BodyLimit(1 << 20)) // 1 MB limit
	r.Use(middleware.Recoverer(log))
	r.Use(middleware.AccessLog(log))
	r.Use(chi_middleware.Compress(5))
	r.Use(middleware.RateLimit(rateLimiter))
	r.Use(middleware.InjectRequest)
	r.Use(middleware.AuthenticateCookie(cfg))
	r.Use(middleware.CSRFOriginCheck(cfg))

	// Mount generated public strict server handler
	strictHandler := gen.NewStrictHandler(compServer, nil)
	gen.HandlerFromMux(strictHandler, r)

	// Mount generated admin strict server handler
	adminStrictHandler := admingen.NewStrictHandler(adminSrv, []admingen.StrictMiddlewareFunc{
		adminmid.RBACStrictMiddleware(pool),
	})
	admingen.HandlerWithOptions(adminStrictHandler, admingen.ChiServerOptions{
		BaseRouter: r,
		Middlewares: []admingen.MiddlewareFunc{
			adminmid.RequireAdminSession(pool, queries, cfg),
		},
	})

	httpServer := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.APIPort),
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Server runner
	serverErrors := make(chan error, 1)
	go func() {
		log.Info("API listening", "addr", httpServer.Addr)
		serverErrors <- httpServer.ListenAndServe()
	}()

	// Graceful shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Error("Server error", "err", err)
	case sig := <-shutdown:
		log.Info("Shutdown signal received", "signal", sig.String())

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer shutdownCancel()

		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			log.Error("Failed to shutdown server cleanly", "err", err)
			_ = httpServer.Close()
		}
		log.Info("Server stopped cleanly")
	}
}
