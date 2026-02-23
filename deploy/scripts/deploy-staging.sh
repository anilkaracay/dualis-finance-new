#!/usr/bin/env bash
set -euo pipefail

# ─── Dualis Finance — Staging Deploy Script ───
# Usage: ./deploy/scripts/deploy-staging.sh

echo "=== Dualis Finance — Staging Deploy ==="
echo ""

# ── Pre-flight checks ──
if ! command -v railway &> /dev/null; then
  echo "ERROR: Railway CLI not installed. Run: npm i -g @railway/cli"
  exit 1
fi

if [ -z "${RAILWAY_STAGING_TOKEN:-}" ]; then
  echo "ERROR: RAILWAY_STAGING_TOKEN environment variable is not set"
  exit 1
fi

export RAILWAY_TOKEN="$RAILWAY_STAGING_TOKEN"

# ── Build ──
echo "[$(date -Iseconds)] Building project..."
pnpm build
echo "[$(date -Iseconds)] Build complete."

# ── Deploy ──
echo "[$(date -Iseconds)] Deploying to Railway staging..."
railway up --service api --environment staging --detach
echo "[$(date -Iseconds)] Deploy initiated."

# ── Health check ──
echo "[$(date -Iseconds)] Waiting for deployment to stabilize..."
sleep 15

HEALTH_URL="https://api-staging.dualis.finance"
./deploy/scripts/health-check.sh "$HEALTH_URL"

echo ""
echo "[$(date -Iseconds)] Staging deploy complete!"
