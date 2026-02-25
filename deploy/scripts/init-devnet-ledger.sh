#!/usr/bin/env bash
set -euo pipefail

# ── Dualis Finance — Devnet Ledger Initialization ─────────────────────────────
# Creates bootstrap contracts on the Canton devnet participant.
# Run once after DAR upload to seed the ledger with initial state.
#
# Usage:
#   ./deploy/scripts/init-devnet-ledger.sh
#   ./deploy/scripts/init-devnet-ledger.sh --dry-run     # show commands only
# ──────────────────────────────────────────────────────────────────────────────

PARTICIPANT_IP="172.18.0.5"
API_PORT="7575"
API_URL="http://${PARTICIPANT_IP}:${API_PORT}"
PARTY="cantara-finance-validator-dev::12204bcabe5f617d26d082a442b560d61e60e57ad845260b01c98657285eeeb2e7ef"
USER_ID="ledger-api-user"
PKG="ca705a8440dd5c7f17a610151a92ae325b0b942e937ec79a144a97cbb36eb53f"
SERVER="84.32.223.16"
SSH_USER="root"
SSH_PASS="${DEVNET_SSH_PASS:-thzdn7ZychhF5h6}"
SSH_CMD="sshpass -p ${SSH_PASS} ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER}"

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

CMD_COUNTER=0

create_contract() {
  local template="$1"
  local args="$2"
  local label="$3"

  CMD_COUNTER=$((CMD_COUNTER + 1))
  local cmd_id="init-$(echo "$label" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')-$(printf '%03d' $CMD_COUNTER)"

  local body=$(cat <<EOFBODY
{
  "commandId": "${cmd_id}",
  "actAs": ["${PARTY}"],
  "userId": "${USER_ID}",
  "commands": [
    {
      "CreateCommand": {
        "templateId": "${PKG}:${template}",
        "createArguments": ${args}
      }
    }
  ]
}
EOFBODY
)

  if [[ $DRY_RUN -eq 1 ]]; then
    echo -e "${YELLOW}[DRY-RUN]${NC} $label ($template)"
    return
  fi

  local result
  result=$($SSH_CMD "curl -sf -X POST '${API_URL}/v2/commands/submit-and-wait' \
    -H 'Content-Type: application/json' \
    -d '$(echo "$body" | tr -d '\n' | sed "s/'/'\\''/g")'" 2>&1) || true

  if echo "$result" | grep -q "updateId"; then
    local offset=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('completionOffset','?'))" 2>/dev/null)
    echo -e "${GREEN}[+]${NC} $label → offset $offset"
  else
    echo -e "${RED}[-]${NC} $label FAILED: $result"
  fi
}

echo "═══════════════════════════════════════════════════════════════"
echo "  Dualis Finance — Devnet Ledger Initialization"
echo "  Participant: ${PARTICIPANT_IP}:${API_PORT}"
echo "  Party: ${PARTY:0:30}..."
echo "  Package: ${PKG:0:16}..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── 1. Protocol Config ───────────────────────────────────────────────────────
echo "── Protocol Config ──"
create_contract "Dualis.Core.Config:ProtocolConfig" "{
  \"operator\": \"${PARTY}\",
  \"protocolParams\": {
    \"closeFactorNormal\": \"0.50\",
    \"closeFactorCritical\": \"1.00\",
    \"criticalHFThreshold\": \"0.50\",
    \"liquidatorIncentive\": \"0.90\",
    \"protocolIncentive\": \"0.10\",
    \"maxPriceStaleness\": 300,
    \"minOracleSources\": 1,
    \"maxFlashLoanAmount\": \"50000000.0\",
    \"flashLoanFee\": \"0.0009\",
    \"globalBorrowCap\": \"5000000000.0\",
    \"globalSupplyCap\": \"10000000000.0\",
    \"isPaused\": false
  },
  \"supportedAssets\": [],
  \"version\": \"2.0.0\",
  \"lastUpdated\": \"${NOW}\"
}" "ProtocolConfig"

# ── 2. Price Feeds ───────────────────────────────────────────────────────────
echo ""
echo "── Price Feeds ──"

# ETH
create_contract "Dualis.Oracle.PriceFeed:PriceFeed" "{
  \"operator\": \"${PARTY}\",
  \"asset\": \"ETH\",
  \"aggregatedPrice\": \"3500.0\",
  \"sources\": [{
    \"source\": \"Chainlink\",
    \"priceUSD\": \"3500.0\",
    \"timestamp\": \"${NOW}\",
    \"confidence\": \"0.99\",
    \"isActive\": true
  }],
  \"lastUpdated\": \"${NOW}\",
  \"maxStaleness\": 300,
  \"minSources\": 1,
  \"isValid\": true
}" "PriceFeed ETH"

# BTC
create_contract "Dualis.Oracle.PriceFeed:PriceFeed" "{
  \"operator\": \"${PARTY}\",
  \"asset\": \"BTC\",
  \"aggregatedPrice\": \"95000.0\",
  \"sources\": [{
    \"source\": \"Chainlink\",
    \"priceUSD\": \"95000.0\",
    \"timestamp\": \"${NOW}\",
    \"confidence\": \"0.99\",
    \"isActive\": true
  }],
  \"lastUpdated\": \"${NOW}\",
  \"maxStaleness\": 300,
  \"minSources\": 1,
  \"isValid\": true
}" "PriceFeed BTC"

# T-BILL-2026
create_contract "Dualis.Oracle.PriceFeed:PriceFeed" "{
  \"operator\": \"${PARTY}\",
  \"asset\": \"T-BILL-2026\",
  \"aggregatedPrice\": \"98.50\",
  \"sources\": [{
    \"source\": \"InternalFeed\",
    \"priceUSD\": \"98.50\",
    \"timestamp\": \"${NOW}\",
    \"confidence\": \"0.95\",
    \"isActive\": true
  }],
  \"lastUpdated\": \"${NOW}\",
  \"maxStaleness\": 600,
  \"minSources\": 1,
  \"isValid\": true
}" "PriceFeed T-BILL-2026"

# CC (Canton Coin)
create_contract "Dualis.Oracle.PriceFeed:PriceFeed" "{
  \"operator\": \"${PARTY}\",
  \"asset\": \"CC\",
  \"aggregatedPrice\": \"0.10\",
  \"sources\": [{
    \"source\": \"InternalFeed\",
    \"priceUSD\": \"0.10\",
    \"timestamp\": \"${NOW}\",
    \"confidence\": \"0.90\",
    \"isActive\": true
  }],
  \"lastUpdated\": \"${NOW}\",
  \"maxStaleness\": 600,
  \"minSources\": 1,
  \"isValid\": true
}" "PriceFeed CC"

# ── 3. Lending Pools ────────────────────────────────────────────────────────
echo ""
echo "── Lending Pools ──"

# USDC Pool
create_contract "Dualis.Lending.Pool:LendingPool" "{
  \"operator\": \"${PARTY}\",
  \"poolId\": \"usdc-main\",
  \"asset\": {
    \"symbol\": \"USDC\",
    \"instrumentType\": \"Stablecoin\",
    \"priceUSD\": \"1.0\",
    \"decimals\": 6
  },
  \"rateModel\": {
    \"modelType\": \"VariableRate\",
    \"baseRate\": \"0.02\",
    \"multiplier\": \"0.1\",
    \"kink\": \"0.80\",
    \"jumpMultiplier\": \"1.0\",
    \"reserveFactor\": \"0.10\"
  },
  \"collateralParams\": {
    \"loanToValue\": \"0.85\",
    \"liquidationThreshold\": \"0.90\",
    \"liquidationPenalty\": \"0.05\",
    \"borrowCap\": null,
    \"supplyCap\": null,
    \"isCollateralEnabled\": true,
    \"isBorrowEnabled\": true,
    \"collateralTier\": \"CryptoTier\"
  },
  \"totalSupply\": \"1000000.0\",
  \"totalBorrow\": \"450000.0\",
  \"totalReserves\": \"15000.0\",
  \"accrual\": {
    \"borrowIndex\": \"1.0\",
    \"supplyIndex\": \"1.0\",
    \"lastAccrualTs\": 0
  },
  \"isActive\": true,
  \"contractRef\": \"canton::pool::usdc-main::001\"
}" "LendingPool USDC"

# ETH Pool
create_contract "Dualis.Lending.Pool:LendingPool" "{
  \"operator\": \"${PARTY}\",
  \"poolId\": \"eth-main\",
  \"asset\": {
    \"symbol\": \"ETH\",
    \"instrumentType\": \"CryptoCurrency\",
    \"priceUSD\": \"3500.0\",
    \"decimals\": 18
  },
  \"rateModel\": {
    \"modelType\": \"VariableRate\",
    \"baseRate\": \"0.01\",
    \"multiplier\": \"0.08\",
    \"kink\": \"0.75\",
    \"jumpMultiplier\": \"0.8\",
    \"reserveFactor\": \"0.10\"
  },
  \"collateralParams\": {
    \"loanToValue\": \"0.80\",
    \"liquidationThreshold\": \"0.85\",
    \"liquidationPenalty\": \"0.08\",
    \"borrowCap\": null,
    \"supplyCap\": null,
    \"isCollateralEnabled\": true,
    \"isBorrowEnabled\": true,
    \"collateralTier\": \"CryptoTier\"
  },
  \"totalSupply\": \"500.0\",
  \"totalBorrow\": \"200.0\",
  \"totalReserves\": \"5.0\",
  \"accrual\": {
    \"borrowIndex\": \"1.0\",
    \"supplyIndex\": \"1.0\",
    \"lastAccrualTs\": 0
  },
  \"isActive\": true,
  \"contractRef\": \"canton::pool::eth-main::002\"
}" "LendingPool ETH"

# T-BILL-2026 Pool
create_contract "Dualis.Lending.Pool:LendingPool" "{
  \"operator\": \"${PARTY}\",
  \"poolId\": \"tbill-2026\",
  \"asset\": {
    \"symbol\": \"T-BILL-2026\",
    \"instrumentType\": \"TokenizedTreasury\",
    \"priceUSD\": \"98.50\",
    \"decimals\": 6
  },
  \"rateModel\": {
    \"modelType\": \"VariableRate\",
    \"baseRate\": \"0.03\",
    \"multiplier\": \"0.06\",
    \"kink\": \"0.85\",
    \"jumpMultiplier\": \"0.5\",
    \"reserveFactor\": \"0.08\"
  },
  \"collateralParams\": {
    \"loanToValue\": \"0.90\",
    \"liquidationThreshold\": \"0.95\",
    \"liquidationPenalty\": \"0.03\",
    \"borrowCap\": null,
    \"supplyCap\": null,
    \"isCollateralEnabled\": true,
    \"isBorrowEnabled\": true,
    \"collateralTier\": \"RWATier\"
  },
  \"totalSupply\": \"100000.0\",
  \"totalBorrow\": \"30000.0\",
  \"totalReserves\": \"1000.0\",
  \"accrual\": {
    \"borrowIndex\": \"1.0\",
    \"supplyIndex\": \"1.0\",
    \"lastAccrualTs\": 0
  },
  \"isActive\": true,
  \"contractRef\": \"canton::pool::tbill-2026::003\"
}" "LendingPool T-BILL-2026"

# CC (Canton Coin) Pool
create_contract "Dualis.Lending.Pool:LendingPool" "{
  \"operator\": \"${PARTY}\",
  \"poolId\": \"cc-main\",
  \"asset\": {
    \"symbol\": \"CC\",
    \"instrumentType\": \"CryptoCurrency\",
    \"priceUSD\": \"0.10\",
    \"decimals\": 18
  },
  \"rateModel\": {
    \"modelType\": \"VariableRate\",
    \"baseRate\": \"0.02\",
    \"multiplier\": \"0.15\",
    \"kink\": \"0.70\",
    \"jumpMultiplier\": \"1.2\",
    \"reserveFactor\": \"0.15\"
  },
  \"collateralParams\": {
    \"loanToValue\": \"0.65\",
    \"liquidationThreshold\": \"0.75\",
    \"liquidationPenalty\": \"0.10\",
    \"borrowCap\": null,
    \"supplyCap\": null,
    \"isCollateralEnabled\": true,
    \"isBorrowEnabled\": true,
    \"collateralTier\": \"CryptoTier\"
  },
  \"totalSupply\": \"200000.0\",
  \"totalBorrow\": \"80000.0\",
  \"totalReserves\": \"2000.0\",
  \"accrual\": {
    \"borrowIndex\": \"1.0\",
    \"supplyIndex\": \"1.0\",
    \"lastAccrualTs\": 0
  },
  \"isActive\": true,
  \"contractRef\": \"canton::pool::cc-main::004\"
}" "LendingPool CC"

# ── 4. DUAL Token ───────────────────────────────────────────────────────────
echo ""
echo "── DUAL Token ──"
create_contract "Dualis.Token.DUAL:DUALToken" "{
  \"operator\": \"${PARTY}\",
  \"totalSupply\": \"1000000000.0\",
  \"circulatingSupply\": \"250000000.0\",
  \"totalStaked\": \"75000000.0\",
  \"allocations\": [
    {\"_1\": \"CommunityRewards\", \"_2\": \"300000000.0\"},
    {\"_1\": \"TeamAdvisors\", \"_2\": \"200000000.0\"},
    {\"_1\": \"TreasuryReserve\", \"_2\": \"200000000.0\"},
    {\"_1\": \"LiquidityMining\", \"_2\": \"150000000.0\"},
    {\"_1\": \"EcosystemGrants\", \"_2\": \"100000000.0\"},
    {\"_1\": \"StrategicSale\", \"_2\": \"50000000.0\"}
  ],
  \"tokenAddress\": \"0xDUAL\",
  \"createdAt\": \"${NOW}\"
}" "DUALToken"

# ── 5. Oracle Aggregator ────────────────────────────────────────────────────
echo ""
echo "── Oracle Aggregator ──"
create_contract "Dualis.Trigger.OracleAggregator:OracleAggregator" "{
  \"operator\": \"${PARTY}\",
  \"aggregatorId\": \"main-aggregator\",
  \"config\": {
    \"aggregationIntervalSec\": 60,
    \"minSourcesRequired\": 1,
    \"maxPriceDeviationPct\": \"0.05\",
    \"outlierThreshold\": \"0.10\",
    \"isEnabled\": true
  },
  \"lastAggregationTs\": 0,
  \"totalAggregations\": 0,
  \"lastResults\": [],
  \"outlierCount\": 0
}" "OracleAggregator"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Initialization complete. $CMD_COUNTER contracts submitted."
echo "═══════════════════════════════════════════════════════════════"
