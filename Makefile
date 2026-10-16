.PHONY: help dev build build-api build-web migrate seed test test-api test-web lint lint-api lint-web lint-openapi gen gen-check smoke verify docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make verify       - Run full verification (lint, codegen check, unit tests, build)"
	@echo "  make gen          - Regenerate Go strict-server and TypeScript client types"
	@echo "  make gen-check    - Verify generated code is in sync with openapi.yaml (zero drift)"
	@echo "  make test         - Run Go and Web test suites"
	@echo "  make lint         - Run OpenAPI, Go, and Next.js linters"
	@echo "  make build        - Compile Go API and Next.js production builds"
	@echo "  make smoke        - Run end-to-end smoke tests through Next.js proxy"
	@echo "  make migrate      - Run Goose database migrations"
	@echo "  make seed         - Seed products catalog and admin user"
	@echo "  make docker-up    - Start services with docker-compose"
	@echo "  make docker-down  - Stop docker-compose services"

# Code Generation (Contract-first)
gen:
	@echo "==> Generating Go server and types from api/openapi.yaml..."
	cd api && oapi-codegen -config oapi-codegen.yaml openapi.yaml
	@echo "==> Generating Go admin server and types from api/openapi.yaml..."
	cd api && oapi-codegen -config oapi-codegen.admin.yaml openapi.yaml
	@echo "==> Generating TypeScript schema from api/openapi.yaml..."
	cd web && npx openapi-typescript ../api/openapi.yaml -o src/lib/api/schema.d.ts
	@echo "==> Generating sqlc database queries..."
	cd api && sqlc generate

gen-check: gen
	@echo "==> Checking for contract drift in generated files..."
	git diff --exit-code api/internal/gen/ web/src/lib/api/schema.d.ts

# Linting
lint-openapi:
	@echo "==> Linting OpenAPI specification with Redocly..."
	npx @redocly/cli lint api/openapi.yaml --config .redocly.yaml

lint-api:
	@echo "==> Running Go vet..."
	cd api && go vet ./...

lint-web:
	@echo "==> Running Next.js type-check..."
	cd web && npm run build

lint: lint-openapi lint-api lint-web

# Testing
test-api:
	@echo "==> Running Go unit and concurrency tests..."
	cd api && go test -v ./...

test-web:
	@echo "==> Testing web with Playwright e2e suite..."
	cd web && npx playwright test

test: test-api test-web

# Building
build-api:
	@echo "==> Compiling Go API..."
	cd api && go build -o bin/api.exe ./cmd/api

build-web:
	@echo "==> Compiling Next.js Web..."
	cd web && npm run build

build: build-api build-web

# Database Migrations & Seeding
migrate:
	@echo "==> Running Goose migrations..."
	goose -dir db/migrations postgres "$$DATABASE_URL" up

seed:
	@echo "==> Running catalog and admin seeder..."
	cd api && go run ./cmd/seed

# End-to-end Smoke Tests
smoke:
	@echo "==> Running end-to-end smoke test..."
	bash ./scripts/smoke.sh

# Single Command Verification
verify: lint test build
	@echo "=================================================="
	@echo "ALL VERIFICATION CHECKS PASSED WITH ZERO DRIFT!"
	@echo "=================================================="

# Docker Compose
docker-up:
	docker compose up -d

docker-down:
	docker compose down
