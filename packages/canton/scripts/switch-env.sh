#!/usr/bin/env bash
# ============================================================================
# DUALIS FINANCE — Environment Switching Script
# ============================================================================
# Switches between sandbox and devnet configurations.
# Usage: ./scripts/switch-env.sh <sandbox|devnet|mainnet>
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/../../.."

TARGET="${1:-}"

if [[ -z "$TARGET" ]] || [[ ! "$TARGET" =~ ^(sandbox|devnet|mainnet)$ ]]; then
  echo "Usage: $0 <sandbox|devnet|mainnet>"
  echo ""
  echo "Environments:"
  echo "  sandbox  — Local DAML sandbox, mock tokens, no auth"
  echo "  devnet   — Canton devnet, CIP-56 tokens, JWT auth, TLS"
  echo "  mainnet  — Canton mainnet, full security"
  exit 1
fi

ENV_FILE="$ROOT_DIR/.env.${TARGET}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found"
  echo "Create it first or copy from .env.${TARGET}.example"
  exit 1
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  DUALIS FINANCE — Environment Switch                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Switching to: $TARGET"
echo "Loading from: $ENV_FILE"
echo ""

# Export the environment variables
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

echo "Active configuration:"
echo "  CANTON_ENV          = ${CANTON_ENV:-not set}"
echo "  CANTON_JSON_API_URL = ${CANTON_JSON_API_URL:-not set}"
echo "  CANTON_GRPC_URL     = ${CANTON_GRPC_URL:-not set}"
echo "  CANTON_MOCK         = ${CANTON_MOCK:-not set}"
echo ""

if [[ "$TARGET" == "sandbox" ]]; then
  echo "Sandbox mode:"
  echo "  • Mock token bridge (no real ledger)"
  echo "  • Parties auto-allocated"
  echo "  • No authentication required"
  echo ""
  echo "Start sandbox: ./scripts/deploy.sh --sandbox"
elif [[ "$TARGET" == "devnet" ]]; then
  echo "Devnet mode:"
  echo "  • CIP-56 token bridge"
  echo "  • Pre-allocated parties required"
  echo "  • JWT authentication"
  echo "  • TLS enabled"
  echo ""
  echo "Ensure devnet ledger is accessible at $CANTON_JSON_API_URL"
elif [[ "$TARGET" == "mainnet" ]]; then
  echo "Mainnet mode:"
  echo "  • CIP-56 token bridge"
  echo "  • Strict party verification"
  echo "  • JWT + mTLS authentication"
  echo ""
  echo "WARNING: This connects to production ledger!"
fi

echo ""
echo "Done. Start the API server with: pnpm --filter @dualis/api dev"
