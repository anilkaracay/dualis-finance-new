#!/usr/bin/env bash
# ============================================================================
# DUALIS FINANCE — Canton DAML Deploy Script
# ============================================================================
# Deploys the DAML contracts to a Canton ledger.
# Usage: ./scripts/deploy.sh [--host HOST] [--port PORT] [--sandbox]
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
DAML_DIR="$PROJECT_DIR/daml"
DAR_FILE="$DAML_DIR/.daml/dist/dualis-finance-2.0.0.dar"

# ─── Parse arguments ──────────────────────────────────────────────────────

HOST="localhost"
PORT="6865"
USE_SANDBOX=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --sandbox) USE_SANDBOX=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  DUALIS FINANCE — Canton DAML Deploy                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── Build if needed ──────────────────────────────────────────────────────

if [ ! -f "$DAR_FILE" ]; then
  echo "📦 DAR file not found, building..."
  cd "$DAML_DIR"
  daml build
  echo "✓ Build complete"
fi

# ─── Sandbox mode ─────────────────────────────────────────────────────────

if [ "$USE_SANDBOX" = true ]; then
  echo "🏖️  Starting DAML Sandbox..."
  echo "   Ledger API: localhost:$PORT"
  echo "   Press Ctrl+C to stop"
  echo ""

  cd "$DAML_DIR"
  daml sandbox "$DAR_FILE" --port "$PORT" &
  SANDBOX_PID=$!

  # Wait for sandbox to be ready
  echo "⏳ Waiting for sandbox to start..."
  sleep 5

  echo "✓ Sandbox running (PID: $SANDBOX_PID)"
  echo ""

  # Start Navigator
  echo "🌐 Starting DAML Navigator..."
  daml navigator server "localhost:$PORT" --port 7500 &
  NAV_PID=$!

  echo "✓ Navigator: http://localhost:7500"
  echo ""

  # Allocate parties
  echo "👥 Allocating parties..."
  for PARTY in Operator Alice Bob Carol Dave Eve Liquidator Oracle; do
    daml ledger allocate-parties --host localhost --port "$PORT" "$PARTY" 2>/dev/null || true
  done
  echo "✓ Parties allocated"
  echo ""

  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  Sandbox Ready                                              ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Ledger API:  localhost:$PORT                               ║"
  echo "║  Navigator:   http://localhost:7500                         ║"
  echo "║  Sandbox PID: $SANDBOX_PID                                  ║"
  echo "║  Nav PID:     $NAV_PID                                      ║"
  echo "╚══════════════════════════════════════════════════════════════╝"

  # Wait for both processes
  wait $SANDBOX_PID $NAV_PID
  exit 0
fi

# ─── Production deploy ────────────────────────────────────────────────────

echo "🚀 Deploying to Canton ledger..."
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   DAR:  $DAR_FILE"
echo ""

cd "$DAML_DIR"

# Upload DAR
echo "📤 Uploading DAR file..."
daml ledger upload-dar "$DAR_FILE" --host "$HOST" --port "$PORT"

if [ $? -eq 0 ]; then
  echo "✓ DAR uploaded successfully"
else
  echo "❌ DAR upload failed"
  exit 1
fi

# Allocate parties
echo ""
echo "👥 Allocating parties..."
for PARTY in Operator Alice Bob Carol Dave Eve Liquidator Oracle; do
  daml ledger allocate-parties --host "$HOST" --port "$PORT" "$PARTY" 2>/dev/null || true
done
echo "✓ Parties allocated"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✓ Deployment Complete                                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Contracts deployed to $HOST:$PORT                          ║"
echo "║  Use daml navigator to interact with the ledger             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
