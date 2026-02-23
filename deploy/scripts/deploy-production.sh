#!/usr/bin/env bash
set -euo pipefail

# ─── Dualis Finance — Production Deploy Script ───
# Usage: ./deploy/scripts/deploy-production.sh

echo "=== Dualis Finance — PRODUCTION Deploy ==="
echo ""
echo "WARNING: You are deploying to PRODUCTION."
echo "Type 'DEPLOY' to confirm:"
read -r CONFIRM
if [ "$CONFIRM" != "DEPLOY" ]; then
  echo "Aborted."
  exit 1
fi

# ── Pre-flight checks ──
if ! command -v railway &> /dev/null; then
  echo "ERROR: Railway CLI not installed. Run: npm i -g @railway/cli"
  exit 1
fi

if [ -z "${RAILWAY_PRODUCTION_TOKEN:-}" ]; then
  echo "ERROR: RAILWAY_PRODUCTION_TOKEN environment variable is not set"
  exit 1
fi

export RAILWAY_TOKEN="$RAILWAY_PRODUCTION_TOKEN"

# ── Tag current state ──
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PRE_TAG="pre-deploy-${TIMESTAMP}"
echo "[$(date -Iseconds)] Tagging current state: $PRE_TAG"
git tag "$PRE_TAG"

# ── Database backup ──
echo "[$(date -Iseconds)] Taking database backup..."
if [ -n "${DATABASE_URL:-}" ]; then
  ./deploy/scripts/db-backup.sh
else
  echo "WARNING: DATABASE_URL not set — skipping backup"
fi

# ── Build ──
echo "[$(date -Iseconds)] Building project..."
pnpm build
echo "[$(date -Iseconds)] Build complete."

# ── Deploy ──
echo "[$(date -Iseconds)] Deploying to Railway production..."
railway up --service api --environment production --detach
echo "[$(date -Iseconds)] Deploy initiated."

# ── Health check ──
echo "[$(date -Iseconds)] Waiting for deployment to stabilize..."
sleep 30

HEALTH_URL="https://api.dualis.finance"

if ./deploy/scripts/health-check.sh "$HEALTH_URL"; then
  # Tag successful deploy
  VERSION=$(node -p "require('./packages/api/package.json').version")
  DEPLOY_TAG="deploy-prod-v${VERSION}-${TIMESTAMP}"
  echo "[$(date -Iseconds)] Tagging deployment: $DEPLOY_TAG"
  git tag "$DEPLOY_TAG"
  echo ""
  echo "[$(date -Iseconds)] Production deploy SUCCESS!"
else
  echo ""
  echo "============================================"
  echo "  DEPLOY FAILED — Health check did not pass"
  echo "  ROLLBACK: ./deploy/scripts/rollback.sh"
  echo "============================================"
  exit 1
fi
