#!/usr/bin/env bash
# ============================================================================
# DUALIS FINANCE — Canton DAML Setup Script
# ============================================================================
# Builds the DAML project and runs the test suite.
# Usage: ./scripts/setup.sh
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
DAML_DIR="$PROJECT_DIR/daml"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  DUALIS FINANCE — Canton DAML Smart Contracts               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── Check prerequisites ───────────────────────────────────────────────────

if ! command -v daml &> /dev/null; then
  echo "❌ DAML SDK not found. Install from: https://docs.daml.com/getting-started/installation.html"
  echo ""
  echo "Quick install:"
  echo "  curl -sSL https://get.daml.com/ | sh"
  echo ""
  exit 1
fi

DAML_VERSION=$(daml version 2>/dev/null | head -1 || echo "unknown")
echo "✓ DAML SDK found: $DAML_VERSION"

# ─── Build ─────────────────────────────────────────────────────────────────

echo ""
echo "📦 Building DAML project..."
cd "$DAML_DIR"
daml build

if [ $? -eq 0 ]; then
  echo "✓ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi

# ─── Run Tests ─────────────────────────────────────────────────────────────

echo ""
echo "🧪 Running DAML test suite..."
daml test

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ All tests passed"
else
  echo ""
  echo "❌ Some tests failed"
  exit 1
fi

# ─── Summary ───────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✓ Build & Test Complete                                    ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  DAR file: .daml/dist/dualis-finance-2.0.0.dar             ║"
echo "║  To deploy: daml deploy --host <ledger> --port <port>      ║"
echo "║  To sandbox: daml sandbox .daml/dist/dualis-finance-2.0.0  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
