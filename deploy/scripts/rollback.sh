#!/usr/bin/env bash
set -euo pipefail

# ─── Dualis Finance — Rollback Script ───
# Usage: ./deploy/scripts/rollback.sh

echo "=== Dualis Finance — Production Rollback ==="
echo ""

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

# ── Find deploy tags ──
CURRENT_TAG=$(git tag -l 'deploy-prod-*' --sort=-creatordate | head -n 1)
PREVIOUS_TAG=$(git tag -l 'deploy-prod-*' --sort=-creatordate | head -n 2 | tail -n 1)

if [ -z "$CURRENT_TAG" ]; then
  echo "ERROR: No deploy-prod-* tags found. Cannot determine current version."
  exit 1
fi

if [ -z "$PREVIOUS_TAG" ] || [ "$CURRENT_TAG" = "$PREVIOUS_TAG" ]; then
  echo "ERROR: No previous deploy tag found. Cannot rollback."
  exit 1
fi

echo "Current version:  $CURRENT_TAG"
echo "Rollback target:  $PREVIOUS_TAG"
echo ""
echo "Type 'ROLLBACK' to confirm:"
read -r CONFIRM
if [ "$CONFIRM" != "ROLLBACK" ]; then
  echo "Aborted."
  exit 1
fi

# ── Checkout previous version ──
echo "[$(date -Iseconds)] Checking out $PREVIOUS_TAG..."
git checkout "$PREVIOUS_TAG"

# ── Build & Deploy ──
echo "[$(date -Iseconds)] Building..."
pnpm build

echo "[$(date -Iseconds)] Deploying to Railway production..."
railway up --service api --environment production --detach

# ── Health check ──
echo "[$(date -Iseconds)] Waiting for deployment..."
sleep 30

HEALTH_URL="https://api.dualis.finance"
if ./deploy/scripts/health-check.sh "$HEALTH_URL"; then
  echo ""
  echo "[$(date -Iseconds)] Rollback to $PREVIOUS_TAG SUCCESS!"
else
  echo ""
  echo "ERROR: Rollback health check failed."
  exit 1
fi

echo ""
echo "NOTE: If you need to restore the database, run:"
echo "  DATABASE_URL=<url> ./deploy/scripts/db-restore.sh <backup-file>"
echo ""
echo "To return to main branch: git checkout main"
