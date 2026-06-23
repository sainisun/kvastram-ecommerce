#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
EXPECTED_PRODUCTION_ROOT="${EXPECTED_PRODUCTION_ROOT:-/root/kvastram-ecommerce}"

cd "$PROJECT_ROOT"

if [[ "${KVASTRAM_PRODUCTION_DEPLOY:-0}" == "1" && "$PROJECT_ROOT" != "$EXPECTED_PRODUCTION_ROOT" ]]; then
  echo "Refusing production deploy from $PROJECT_ROOT"
  echo "Expected canonical checkout: $EXPECTED_PRODUCTION_ROOT"
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Refusing deploy from a checkout with tracked changes."
  git status --short
  exit 1
fi

export APP_GIT_SHA
APP_GIT_SHA="$(git rev-parse HEAD)"

log() {
  echo "=== $1 ==="
}

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Missing required env file: $path"
    echo "Create it on the VPS from the matching .env.example before deploying."
    exit 1
  fi
}

compose_up_with_retry() {
  local retry_label="$1"
  shift

  if docker compose -f "$COMPOSE_FILE" up -d --build --no-deps "$@"; then
    return 0
  fi

  echo "Retrying $retry_label after removing stale containers..."
  docker compose -f "$COMPOSE_FILE" rm -fsv "$@" || true
  docker compose -f "$COMPOSE_FILE" up -d --build --no-deps "$@"
}

wait_for_service_health() {
  local service="$1"
  local timeout_seconds="${2:-120}"
  local elapsed=0

  while (( elapsed < timeout_seconds )); do
    local container_id
    container_id="$(docker compose -f "$COMPOSE_FILE" ps -q "$service")"

    if [[ -n "$container_id" ]]; then
      local status
      status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"

      case "$status" in
        healthy|running)
          echo "$service is $status after ${elapsed}s"
          return 0
          ;;
        unhealthy|exited|dead)
          echo "$service entered terminal status: $status"
          docker compose -f "$COMPOSE_FILE" logs --tail=160 "$service" || true
          exit 1
          ;;
      esac

      echo "  Waiting for $service... (${elapsed}s/${timeout_seconds}s) status=${status:-unknown}"
    else
      echo "  Waiting for $service container to appear... (${elapsed}s/${timeout_seconds}s)"
    fi

    sleep 5
    elapsed=$((elapsed + 5))
  done

  echo "$service did not become healthy in ${timeout_seconds}s"
  docker compose -f "$COMPOSE_FILE" logs --tail=160 "$service" || true
  exit 1
}

trap 'echo "=== Deployment failed ==="; docker compose -f "$COMPOSE_FILE" ps || true; docker compose -f "$COMPOSE_FILE" logs --tail=120 backend storefront admin || true' ERR

log "Verifying production env files"
for file in \
  .env.hostinger \
  backend/.env.production \
  storefront/.env.production \
  admin/.env.production \
  deploy/hostinger/.env
do
  require_file "$file"
done

log "Validating compose configuration"
docker compose -f "$COMPOSE_FILE" config >/dev/null

log "Starting database first"
docker compose -f "$COMPOSE_FILE" up -d postgres
wait_for_service_health postgres 90

log "Building and starting backend"
compose_up_with_retry backend backend
wait_for_service_health backend 150

log "Syncing real_products images to backend volume"
docker compose -f "$COMPOSE_FILE" exec -T backend mkdir -p /app/uploads/real_products
docker cp backend/uploads/real_products/. "$(docker compose -f "$COMPOSE_FILE" ps -q backend):/app/uploads/real_products/" || echo "Warning: Image sync failed"

log "Running manual backend migrations"
docker compose -f "$COMPOSE_FILE" exec -T backend node dist/run-manual-migrations.js

log "Building and starting storefront and admin"
compose_up_with_retry frontend-services storefront admin
wait_for_service_health storefront 180
wait_for_service_health admin 180

log "Building and starting MCP (best effort)"
if [[ -d "$PROJECT_ROOT/kvastram-mcp-server" && -f /root/kvastram-secrets/mcp.env ]]; then
  docker compose -f "$COMPOSE_FILE" --profile mcp up -d --build mcp || {
    echo "MCP deploy failed; continuing because storefront/admin/backend are healthy."
  }
else
  echo "Skipping MCP: source directory or external secret file is not present."
fi

log "Final service status"
docker compose -f "$COMPOSE_FILE" ps

log "Health checks"
verify_health_sha() {
  local service="$1"
  local url="$2"
  local response
  response="$(curl -sf "$url")" || { echo "$service health check FAILED"; exit 1; }
  if [[ "$response" != *"\"gitSha\":\"$APP_GIT_SHA\""* ]]; then
    echo "$service health SHA mismatch: expected $APP_GIT_SHA"
    echo "Health response: $response"
    exit 1
  fi
  echo "$service health SHA verified: $APP_GIT_SHA"
}

verify_health_sha backend http://localhost:4000/health
verify_health_sha storefront http://localhost:3000/health
verify_health_sha admin http://localhost:3001/health

log "Removing unused Docker images"
docker image prune -f --filter "until=24h"

log "Deployment complete"
