#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Dualis Finance — Full Stack Startup Script
# Starts: PostgreSQL, Redis, API, Frontend, Monitoring, Canton DAML
# Usage:  ./scripts/start-all.sh [options]
#   --skip-monitoring   Skip Prometheus + Grafana
#   --skip-daml         Skip DAML build
#   --skip-seed         Skip database seeding
#   --fresh-db          Drop & recreate database before migrate
#   --stop              Stop all running services
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()   { echo -e "${CYAN}[dualis]${NC} $*"; }
ok()    { echo -e "${GREEN}  ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}  ⚠${NC} $*"; }
fail()  { echo -e "${RED}  ✗${NC} $*"; }
header(){ echo -e "\n${BOLD}━━━ $* ━━━${NC}"; }

# ── Parse flags ──
SKIP_MONITORING=false
SKIP_DAML=false
SKIP_SEED=false
FRESH_DB=false
STOP_MODE=false

for arg in "$@"; do
  case $arg in
    --skip-monitoring) SKIP_MONITORING=true ;;
    --skip-daml)       SKIP_DAML=true ;;
    --skip-seed)       SKIP_SEED=true ;;
    --fresh-db)        FRESH_DB=true ;;
    --stop)            STOP_MODE=true ;;
    --help|-h)
      echo "Usage: ./scripts/start-all.sh [options]"
      echo "  --skip-monitoring   Skip Prometheus + Grafana"
      echo "  --skip-daml         Skip DAML build"
      echo "  --skip-seed         Skip database seeding"
      echo "  --fresh-db          Drop & recreate database before migrate"
      echo "  --stop              Stop all running services"
      exit 0
      ;;
    *) warn "Unknown flag: $arg" ;;
  esac
done

# ── Stop mode ──
if [ "$STOP_MODE" = true ]; then
  header "Stopping all Dualis services"

  log "Stopping local API & Frontend processes..."
  if [ -f "$ROOT_DIR/.pids/api.pid" ]; then
    kill "$(cat "$ROOT_DIR/.pids/api.pid")" 2>/dev/null && ok "API stopped" || warn "API was not running"
  fi
  if [ -f "$ROOT_DIR/.pids/frontend.pid" ]; then
    kill "$(cat "$ROOT_DIR/.pids/frontend.pid")" 2>/dev/null && ok "Frontend stopped" || warn "Frontend was not running"
  fi
  rm -rf "$ROOT_DIR/.pids"

  # Also kill by port as fallback
  lsof -ti:4000 2>/dev/null | xargs kill 2>/dev/null || true
  lsof -ti:3000 2>/dev/null | xargs kill 2>/dev/null || true

  log "Stopping Docker containers..."
  docker compose down 2>/dev/null && ok "Docker services stopped" || warn "No Docker services running"

  echo -e "\n${GREEN}${BOLD}All services stopped.${NC}"
  exit 0
fi

# ── Prerequisite checks ──
header "1/7  Checking prerequisites"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    ok "$1 $(eval "$2" 2>/dev/null || echo '')"
  else
    fail "$1 not found — $3"
    return 1
  fi
}

MISSING=0
check_cmd node   'node -v'                       'Install Node.js >= 20'   || MISSING=1
check_cmd pnpm   'pnpm -v'                       'Install pnpm >= 9'      || MISSING=1
check_cmd docker 'docker --version | cut -d" " -f3' 'Install Docker Desktop' || MISSING=1

if [ $MISSING -eq 1 ]; then
  fail "Missing prerequisites — install them and retry."
  exit 1
fi

# Docker daemon check
if ! docker info &>/dev/null; then
  fail "Docker daemon is not running. Start Docker Desktop and retry."
  exit 1
fi
ok "Docker daemon running"

# ── Infrastructure (PostgreSQL + Redis) ──
header "2/7  Starting infrastructure"

log "Starting PostgreSQL & Redis..."
docker compose up -d postgres redis 2>&1 | grep -E "(Started|Running|Created|Pulling)" || true

log "Waiting for containers to be healthy..."
RETRIES=0
MAX_RETRIES=30
while [ $RETRIES -lt $MAX_RETRIES ]; do
  PG_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' dualis-new-postgres-1 2>/dev/null || echo "unknown")
  RD_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' dualis-new-redis-1 2>/dev/null || echo "unknown")

  if [ "$PG_HEALTHY" = "healthy" ] && [ "$RD_HEALTHY" = "healthy" ]; then
    break
  fi

  RETRIES=$((RETRIES + 1))
  sleep 1
done

if [ "$PG_HEALTHY" = "healthy" ] && [ "$RD_HEALTHY" = "healthy" ]; then
  ok "PostgreSQL healthy (localhost:5432)"
  ok "Redis healthy (localhost:6379)"
else
  fail "Infrastructure did not become healthy in ${MAX_RETRIES}s"
  exit 1
fi

# ── Dependencies & Build ──
header "3/7  Installing dependencies & building"

log "Installing pnpm dependencies..."
pnpm install --frozen-lockfile 2>&1 | tail -3
ok "Dependencies installed"

log "Building @dualis/shared..."
pnpm --filter @dualis/shared build 2>&1 | tail -3
ok "Shared package built"

# ── Database ──
header "4/7  Database setup"

export DATABASE_URL="postgresql://dualis:dualis_dev_password@localhost:5432/dualis"

if [ "$FRESH_DB" = true ]; then
  log "Dropping & recreating database (--fresh-db)..."
  docker exec dualis-new-postgres-1 psql -U dualis -c \
    "DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;" \
    2>&1 | grep -v "^$"
  ok "Database reset"
fi

log "Running migrations..."
MIGRATE_OUT=$(pnpm --filter @dualis/api db:migrate 2>&1) || {
  if echo "$MIGRATE_OUT" | grep -q "already exists"; then
    warn "Migration drift detected — retrying with --fresh-db..."
    docker exec dualis-new-postgres-1 psql -U dualis -c \
      "DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;" \
      2>&1 | grep -v "^$"
    pnpm --filter @dualis/api db:migrate 2>&1 | tail -3
    ok "Migrations applied (after fresh reset)"
  else
    echo "$MIGRATE_OUT"
    fail "Migration failed"
    exit 1
  fi
}
if echo "$MIGRATE_OUT" | grep -q "applied successfully"; then
  ok "Migrations applied"
fi

if [ "$SKIP_SEED" = false ]; then
  log "Seeding database..."
  pnpm --filter @dualis/api db:seed 2>&1 | tail -5
  ok "Database seeded"
fi

# ── Kill stale processes on ports ──
header "5/7  Starting API & Frontend"

lsof -ti:4000 2>/dev/null | xargs kill 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill 2>/dev/null || true
sleep 1

# Create PID directory
mkdir -p "$ROOT_DIR/.pids"

# Start API
log "Starting Fastify API (port 4000)..."
DATABASE_URL="postgresql://dualis:dualis_dev_password@localhost:5432/dualis" \
REDIS_URL="redis://localhost:6379" \
  pnpm --filter @dualis/api dev > "$ROOT_DIR/log/api.log" 2>&1 &
echo $! > "$ROOT_DIR/.pids/api.pid"

# Start Frontend
log "Starting Next.js frontend (port 3000)..."
pnpm --filter @dualis/frontend dev > "$ROOT_DIR/log/frontend.log" 2>&1 &
echo $! > "$ROOT_DIR/.pids/frontend.pid"

# Wait for API to be ready
RETRIES=0
while [ $RETRIES -lt 30 ]; do
  if curl -s http://localhost:4000/health | grep -q "healthy" 2>/dev/null; then
    break
  fi
  RETRIES=$((RETRIES + 1))
  sleep 1
done

if curl -s http://localhost:4000/health | grep -q "healthy" 2>/dev/null; then
  ok "API running → http://localhost:4000"
else
  warn "API not yet responding (check log/api.log)"
fi

# Wait for Frontend
RETRIES=0
while [ $RETRIES -lt 20 ]; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
    break
  fi
  RETRIES=$((RETRIES + 1))
  sleep 1
done

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
  ok "Frontend running → http://localhost:3000"
else
  warn "Frontend not yet responding (check log/frontend.log)"
fi

# ── Monitoring ──
header "6/7  Monitoring stack"

if [ "$SKIP_MONITORING" = true ]; then
  warn "Skipped (--skip-monitoring)"
else
  log "Starting Prometheus & Grafana..."
  docker compose up -d prometheus grafana 2>&1 | grep -E "(Started|Running|Created)" || true
  ok "Prometheus → http://localhost:9090"
  ok "Grafana    → http://localhost:3002 (admin/admin)"
fi

# ── DAML ──
header "7/7  Canton DAML contracts"

if [ "$SKIP_DAML" = true ]; then
  warn "Skipped (--skip-daml)"
else
  DAML_BIN="$HOME/.daml/bin/daml"
  if command -v daml &>/dev/null; then
    DAML_BIN="daml"
  elif [ -x "$HOME/.daml/bin/daml" ]; then
    DAML_BIN="$HOME/.daml/bin/daml"
  else
    warn "DAML SDK not found — skipping. Install: curl -sSL https://get.daml.com/ | sh"
    DAML_BIN=""
  fi

  if [ -n "$DAML_BIN" ]; then
    log "Building DAML contracts..."
    (cd "$ROOT_DIR/packages/canton/daml" && $DAML_BIN build 2>&1 | tail -3)
    ok "DAR built → packages/canton/daml/.daml/dist/dualis-finance-2.0.0.dar"

    log "Running DAML tests..."
    TEST_RESULT=$(cd "$ROOT_DIR/packages/canton/daml" && $DAML_BIN test 2>&1)
    PASSED=$(echo "$TEST_RESULT" | grep -c ": ok,")
    FAILED=$(echo "$TEST_RESULT" | grep -c "FAILED" || true)
    if [ "$FAILED" -gt 0 ]; then
      fail "$PASSED passed, $FAILED failed"
    else
      ok "$PASSED tests passed"
    fi
  fi
fi

# ── Summary ──
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  Dualis Finance — All Systems Running${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Frontend${NC}    http://localhost:3000"
echo -e "  ${CYAN}API${NC}         http://localhost:4000"
echo -e "  ${CYAN}API Health${NC}  http://localhost:4000/health"
echo -e "  ${CYAN}PostgreSQL${NC}  localhost:5432"
echo -e "  ${CYAN}Redis${NC}       localhost:6379"
if [ "$SKIP_MONITORING" = false ]; then
  echo -e "  ${CYAN}Prometheus${NC}  http://localhost:9090"
  echo -e "  ${CYAN}Grafana${NC}    http://localhost:3002  (admin/admin)"
fi
echo ""
echo -e "  ${YELLOW}Demo login${NC}  demo@dualis.finance / Demo1234!"
echo ""
echo -e "  ${BOLD}Logs:${NC}       tail -f log/api.log"
echo -e "              tail -f log/frontend.log"
echo -e "  ${BOLD}Stop:${NC}       ./scripts/start-all.sh --stop"
echo ""
