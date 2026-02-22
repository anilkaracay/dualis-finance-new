#!/usr/bin/env bash
# ============================================================================
# DUALIS FINANCE — Protocol Initialization Script
# ============================================================================
# Creates the initial protocol state on a running Canton ledger:
# - Protocol config with default parameters
# - Lending pools (USDC, ETH, wBTC, T-BILL, CC-REC, SPY)
# - Price feeds for all supported assets
# - Interest accrual trigger
# - Liquidation scanner
# - Oracle aggregator
# - Staleness checker
#
# Usage: ./scripts/init-protocol.sh [--host HOST] [--port PORT]
# ============================================================================

set -euo pipefail

HOST="${1:-localhost}"
PORT="${2:-6865}"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  DUALIS FINANCE — Protocol Initialization                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Note: This script documents the initialization sequence."
echo "In production, initialization is done via the API backend"
echo "which submits DAML commands to the Canton ledger."
echo ""
echo "The protocol initialization creates:"
echo "  1. ProtocolConfig with default parameters"
echo "  2. 6 LendingPool contracts (USDC, ETH, wBTC, T-BILL, CC-REC, SPY)"
echo "  3. 6 PriceFeed contracts (one per supported asset)"
echo "  4. InterestAccrualTrigger (300s interval)"
echo "  5. LiquidationScanner (30s scan interval)"
echo "  6. OracleAggregator (60s aggregation interval)"
echo "  7. StalenessChecker (60s check interval)"
echo "  8. DUALToken contract (1B total supply)"
echo ""
echo "Supported Assets:"
echo "  ┌──────────┬─────────────────────┬──────────┬───────┐"
echo "  │ Symbol   │ Type                │ Base APR │ Kink  │"
echo "  ├──────────┼─────────────────────┼──────────┼───────┤"
echo "  │ USDC     │ Stablecoin          │ 2.00%    │ 80%   │"
echo "  │ ETH      │ Cryptocurrency      │ 1.00%    │ 75%   │"
echo "  │ wBTC     │ Cryptocurrency      │ 0.50%    │ 65%   │"
echo "  │ T-BILL   │ Tokenized Treasury  │ 3.50%    │ 90%   │"
echo "  │ CC-REC   │ Tokenized Receivable│ 4.00%    │ 85%   │"
echo "  │ SPY      │ Tokenized Equity    │ 1.50%    │ 70%   │"
echo "  └──────────┴─────────────────────┴──────────┴───────┘"
echo ""
echo "Credit Tiers:"
echo "  ┌──────────┬───────────┬──────────┬──────────────────┐"
echo "  │ Tier     │ Score     │ Max LTV  │ Rate Discount    │"
echo "  ├──────────┼───────────┼──────────┼──────────────────┤"
echo "  │ Diamond  │ 850-1000  │ 85%      │ 25%              │"
echo "  │ Gold     │ 650-849   │ 78%      │ 15%              │"
echo "  │ Silver   │ 450-649   │ 70%      │ 8%               │"
echo "  │ Bronze   │ 250-449   │ 60%      │ 0%               │"
echo "  │ Unrated  │ 0-249     │ 50%      │ 0%               │"
echo "  └──────────┴───────────┴──────────┴──────────────────┘"
echo ""
echo "To initialize in sandbox mode:"
echo "  1. Start sandbox:  ./scripts/deploy.sh --sandbox"
echo "  2. Use Navigator:  http://localhost:7500"
echo "  3. Create ProtocolConfig as Operator"
echo "  4. Create LendingPool contracts for each asset"
echo ""
echo "To initialize via API backend:"
echo "  1. Start the API server: cd packages/api && pnpm dev"
echo "  2. POST /api/admin/init-protocol"
echo ""
