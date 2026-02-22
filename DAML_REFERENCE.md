# DUALIS FINANCE — Daml Contract Reference

**Purpose:** This document defines every Daml contract interface in Dualis Finance. Use it to generate TypeScript types in `packages/shared/src/types/`. Claude Code should NOT write Daml — only derive TypeScript from these definitions.

**Convention:** Each contract lists its fields, key, signatories, observers, and choices. TypeScript types should mirror field names exactly. Daml `Decimal` → TypeScript `string` (for precision). Daml `Party` → TypeScript `string`. Daml `Time` → TypeScript `string` (ISO 8601). Daml `Optional a` → TypeScript `a | null`. Daml `[a]` → TypeScript `a[]`.

---

## Module: Dualis.Core.Types

### InstrumentType (enum)
```
Stablecoin | CryptoCurrency | TokenizedEquity | TokenizedBond |
TokenizedTreasury | TokenizedReceivable | LPToken
```
→ TypeScript: `type InstrumentType = 'Stablecoin' | 'CryptoCurrency' | 'TokenizedEquity' | 'TokenizedBond' | 'TokenizedTreasury' | 'TokenizedReceivable' | 'LPToken'`

### Asset (record)
| Field | Daml Type | Description |
|-------|-----------|-------------|
| tokenAdmin | Party | CIP-56 token administrator |
| symbol | Text | e.g., "USDC", "wBTC", "T-BILL-2026" |
| amount | Decimal | Token amount |
| instrumentType | InstrumentType | Asset classification |

### InterestRateModel (variant)
```
FixedRate Decimal
| VariableRate { baseRate: Decimal, multiplier: Decimal, kink: Decimal, jumpMultiplier: Decimal }
| OracleLinked { benchmarkId: Text, spread: Decimal }
```
→ TypeScript:
```typescript
type InterestRateModel =
  | { type: 'FixedRate'; rate: string }
  | { type: 'VariableRate'; baseRate: string; multiplier: string; kink: string; jumpMultiplier: string }
  | { type: 'OracleLinked'; benchmarkId: string; spread: string }
```

### CollateralConfig (record)
| Field | Daml Type | Description |
|-------|-----------|-------------|
| instrumentType | InstrumentType | Asset type this config applies to |
| loanToValue | Decimal | Max LTV (e.g., 0.75 = 75%) |
| liquidationThreshold | Decimal | Liquidation trigger (e.g., 0.82) |
| liquidationPenalty | Decimal | Penalty (e.g., 0.05 = 5%) |
| borrowCap | Optional Decimal | Max borrowable amount |

### HealthFactor (record)
| Field | Daml Type | Description |
|-------|-----------|-------------|
| value | Decimal | >1 safe, <1 liquidatable |
| collateralValueUSD | Decimal | Total collateral in USD |
| borrowValueUSD | Decimal | Total debt in USD |
| weightedLTV | Decimal | Weighted loan-to-value |
| timestamp | Time | Calculation time |

### CreditTier (enum)
```
Diamond | Gold | Silver | Bronze | Unrated
```

### Credit Tier Parameters
| Tier | Min Collateral Ratio | Max LTV | Rate Discount |
|------|---------------------|---------|---------------|
| Diamond | 1.10 (110%) | 0.90 (90%) | -50 bps |
| Gold | 1.20 (120%) | 0.83 (83%) | -25 bps |
| Silver | 1.35 (135%) | 0.74 (74%) | 0 bps |
| Bronze | 1.50 (150%) | 0.67 (67%) | +25 bps |
| Unrated | 1.75 (175%) | 0.57 (57%) | +75 bps |

---

## Module: Dualis.Core.Config

### ProtocolConfig (template)
**Key:** `protocolOperator`
**Signatory:** `protocolOperator`

| Field | Daml Type | Description |
|-------|-----------|-------------|
| protocolOperator | Party | Cayvox Labs operator party |
| version | Text | Protocol version string |
| collateralConfigs | [CollateralConfig] | Per-asset-type collateral parameters |
| interestRateModels | [(LendingPoolId, InterestRateModel)] | Pool → model mapping |
| protocolFeeRate | Decimal | Protocol fee (e.g., 0.001 = 0.1%) |
| flashLoanFeeRate | Decimal | Flash loan fee (e.g., 0.0009) |
| minCollateralRatio | Decimal | Global minimum (e.g., 1.10) |
| liquidationIncentive | Decimal | Liquidator reward (e.g., 0.05) |
| oracleProvider | Party | Chainlink oracle party |
| creditAssessor | Party | Credit scoring party |
| treasuryAddress | Party | Protocol treasury |
| paused | Bool | Emergency pause flag |
| lastUpdated | Time | Last config update |

**Choices:**
- `UpdateConfig(newCollateralConfigs?, newProtocolFeeRate?, newFlashLoanFeeRate?, newMinCollateralRatio?)` → Controller: protocolOperator
- `EmergencyPause` → Controller: protocolOperator
- `Resume` → Controller: protocolOperator

---

## Module: Dualis.Lending.Pool

### LendingPool (template)
**Key:** `(protocolOperator, poolId)`
**Signatory:** `protocolOperator`
**Observer:** `depositors`

| Field | Daml Type | Description |
|-------|-----------|-------------|
| poolId | LendingPoolId (Text) | Unique pool identifier |
| protocolOperator | Party | |
| asset | Asset | Pool's underlying asset |
| totalDeposits | Decimal | Total deposited |
| totalBorrows | Decimal | Total borrowed |
| totalReserves | Decimal | Protocol reserves |
| interestRateModel | InterestRateModel | Rate calculation model |
| lastAccrualTimestamp | Time | Last interest accrual |
| accumulatedBorrowIndex | Decimal | Compound borrow index |
| accumulatedSupplyIndex | Decimal | Compound supply index |
| depositors | [Party] | List of depositor parties |
| isActive | Bool | Pool active flag |

**Choices:**
- `GetUtilizationRate` → nonconsuming, returns Decimal
- `GetBorrowRate` → nonconsuming, returns Decimal
- `Deposit(lender: Party, depositAmount: Decimal)` → Controller: lender → returns (ContractId LendingPool, ContractId LendingPosition)
- `AccrueInterest` → Controller: protocolOperator → returns ContractId LendingPool

### LendingPosition (template)
**Key:** `(protocolOperator, positionId)`
**Signatory:** `protocolOperator`
**Observer:** `lender`

| Field | Daml Type | Description |
|-------|-----------|-------------|
| positionId | PositionId (Text) | Format: "{poolId}-{lenderParty}" |
| pool | LendingPool | Reference to parent pool |
| lender | Party | Depositor |
| depositedAmount | Decimal | Original deposit amount |
| shares | Decimal | Pool shares owned |
| depositTimestamp | Time | When deposited |
| lastClaimTimestamp | Time | Last reward claim |

**Choices:**
- `Withdraw(withdrawShares: Decimal)` → Controller: lender → returns Optional (ContractId LendingPosition)

---

## Module: Dualis.Lending.Borrow

### CollateralPosition (template)
**Key:** `(protocolOperator, positionId)`
**Signatory:** `protocolOperator`
**Observer:** `borrower`

| Field | Daml Type | Description |
|-------|-----------|-------------|
| positionId | PositionId | |
| protocolOperator | Party | |
| borrower | Party | |
| collateralAssets | [Asset] | Deposited collateral assets |
| collateralValuesUSD | [Decimal] | USD value per asset |
| totalCollateralUSD | Decimal | Sum of all collateral USD |
| lockedForBorrow | Bool | Whether locked for a borrow |
| oracleTimestamp | Time | Last oracle valuation |

**Choices:**
- `AddCollateral(newAsset: Asset, valueUSD: Decimal)` → Controller: borrower
- `UpdateCollateralValues(newValuesUSD: [Decimal], timestamp: Time)` → Controller: protocolOperator

### BorrowPosition (template)
**Key:** `(protocolOperator, positionId)`
**Signatory:** `protocolOperator`
**Observer:** `borrower`

| Field | Daml Type | Description |
|-------|-----------|-------------|
| positionId | PositionId | |
| protocolOperator | Party | |
| borrower | Party | |
| lendingPoolId | LendingPoolId | Which pool borrowed from |
| collateralPositionId | PositionId | Linked collateral |
| borrowedAsset | Asset | What was borrowed |
| borrowedAmountPrincipal | Decimal | Original borrow amount |
| borrowIndexAtOpen | Decimal | Borrow index at creation |
| borrowTimestamp | Time | When borrowed |
| interestAccrued | Decimal | Accumulated interest |
| healthFactor | HealthFactor | Current health |
| creditTier | CreditTier | Borrower's tier at time of borrow |
| isLiquidatable | Bool | Whether HF < 1.0 |

**Choices:**
- `GetCurrentDebt(currentBorrowIndex: Decimal)` → nonconsuming, returns Decimal
- `Repay(repayAmount: Decimal)` → Controller: borrower
- `UpdateHealth(newHealthFactor: HealthFactor)` → Controller: protocolOperator

---

## Module: Dualis.SecLending.Deal

### SecLendingStatus (enum)
```
Offered | Matched | Active | RecallRequested | Returning | Settled | Defaulted
```

### FeeStructure (variant)
```
FixedFee Decimal
| FloatingFee { benchmark: Text, spread: Decimal }
| NegotiatedFee Decimal
```

### CollateralSchedule (record)
| Field | Daml Type | Description |
|-------|-----------|-------------|
| acceptedCollateralTypes | [InstrumentType] | Accepted collateral |
| initialMarginPercent | Decimal | Initial margin (e.g., 1.05 = 105%) |
| variationMarginPercent | Decimal | Variation margin |
| marginCallThreshold | Decimal | Margin call trigger |
| marginCallDeadlineHours | Int | Hours to meet margin call |

### SecLendingOffer (template)
**Signatory:** `protocolOperator, lender`

| Field | Daml Type | Description |
|-------|-----------|-------------|
| offerId | Text | |
| protocolOperator | Party | |
| lender | Party | |
| security | Asset | Security being offered |
| feeStructure | FeeStructure | Fee terms |
| collateralSchedule | CollateralSchedule | Collateral requirements |
| minLendDuration | Int | Min days |
| maxLendDuration | Optional Int | Max days |
| isRecallable | Bool | Whether lender can recall |
| recallNoticeDays | Int | Notice period |
| createdAt | Time | |

**Choices:**
- `AcceptOffer(borrower: Party, collateral: [Asset], collateralValueUSD: Decimal, requestedDuration: Int)` → Controller: borrower → returns ContractId SecLendingDeal
- `CancelOffer` → Controller: lender

### SecLendingDeal (template)
**Key:** `(protocolOperator, dealId)`
**Signatory:** `protocolOperator`
**Observer:** `lender, borrower`

| Field | Daml Type | Description |
|-------|-----------|-------------|
| dealId | SecLendingDealId (Text) | Format: "{offerId}-{borrowerParty}" |
| protocolOperator | Party | |
| lender | Party | |
| borrower | Party | |
| security | Asset | |
| feeStructure | FeeStructure | |
| collateralSchedule | CollateralSchedule | |
| collateral | [Asset] | Posted collateral |
| collateralValueUSD | Decimal | |
| securityValueUSD | Decimal | |
| currentFeeAccrued | Decimal | |
| status | SecLendingStatus | |
| startDate | Time | |
| expectedEndDate | Time | |
| recallDate | Optional Time | |
| lastMarkToMarket | Time | |
| corporateActions | [CorporateActionRecord] | |

**Choices:**
- `MarkToMarket(newSecurityValueUSD: Decimal, newCollateralValueUSD: Decimal, timestamp: Time)` → Controller: protocolOperator
- `RecallSecurities` → Controller: lender
- `ReturnSecurities` → Controller: borrower
- `ProcessCorporateAction(actionType: CorporateActionType, details: Text, valueUSD: Optional Decimal)` → Controller: protocolOperator

### CorporateActionType (enum)
```
Dividend | CouponPayment | StockSplit | VotingRight | MandatoryAction
```

### CorporateActionRecord (record)
| Field | Daml Type |
|-------|-----------|
| actionType | CorporateActionType |
| details | Text |
| valueUSD | Optional Decimal |
| processedAt | Time |
| compensated | Bool |

---

## Module: Dualis.Credit.Score

### CreditProfile (template)
**Signatory:** `protocolOperator, creditAssessor`
**Observer:** `borrower`

| Field | Daml Type | Description |
|-------|-----------|-------------|
| profileId | CreditScoreId (Text) | |
| protocolOperator | Party | |
| borrower | Party | |
| creditAssessor | Party | |
| totalLoansCompleted | Int | |
| totalLoansDefaulted | Int | |
| totalVolumeBorrowed | Decimal | |
| totalVolumeRepaid | Decimal | |
| totalInterestPaid | Decimal | |
| onTimeRepayments | Int | |
| lateRepayments | Int | |
| averageRepaymentDays | Decimal | |
| lowestHealthFactorEver | Decimal | |
| liquidationCount | Int | |
| secLendingDealsCompleted | Int | |
| secLendingTimlyReturns | Int | |
| rawScore | Decimal | 0-1000 |
| creditTier | CreditTier | |
| lastUpdated | Time | |

**Choices:**
- `RecalculateScore` → Controller: creditAssessor

### Score Calculation Formula:
```
completionScore   = (completed / (completed + defaulted)) * 300    [max 300]
timelinessScore   = (onTime / (onTime + late)) * 250               [max 250]
volumeScore       = min(200, log10(volumeRepaid + 1) * 40)         [max 200]
healthScore       = 150 if lowest HF >= 1.5,                       [max 150]
                    100 if >= 1.2, 50 if >= 1.0, 0 otherwise
secLendingScore   = min(100, completedDeals * 10)                  [max 100]

TOTAL = sum of all (max 1000)
```

### CreditTierAttestation (template)
**Signatory:** `protocolOperator, creditAssessor`
**Observer:** `borrower`

| Field | Daml Type |
|-------|-----------|
| protocolOperator | Party |
| creditAssessor | Party |
| borrower | Party |
| creditTier | CreditTier |
| attestedAt | Time |
| validUntil | Time |

**Choices:**
- `VerifyTier(verifier: Party)` → nonconsuming, Controller: verifier, returns CreditTier

---

## Module: Dualis.Liquidation.Engine

### LiquidationTier (enum)
```
MarginCall | SoftLiquidation | ForcedLiquidation | FullLiquidation
```

### Tier Thresholds:
| Health Factor | Tier | Liquidation % |
|--------------|------|---------------|
| 0.95 - 1.00 | MarginCall | 0% (warning only) |
| 0.90 - 0.95 | SoftLiquidation | 25% |
| 0.85 - 0.90 | ForcedLiquidation | 50% |
| < 0.85 | FullLiquidation | 100% |

### LiquidationTrigger (template)
**Signatory:** `protocolOperator`
**Observer:** `liquidator, borrower`

| Field | Daml Type |
|-------|-----------|
| triggerId | Text |
| protocolOperator | Party |
| liquidator | Party |
| borrower | Party |
| borrowPositionId | PositionId |
| collateralPositionId | PositionId |
| healthFactor | Decimal |
| tier | LiquidationTier |
| liquidationAmount | Decimal |
| liquidatorReward | Decimal |
| protocolPenalty | Decimal |
| triggeredAt | Time |

**Choices:**
- `ExecuteLiquidation` → Controller: liquidator → returns ContractId LiquidationResult

### LiquidationResult (template)
**Signatory:** `protocolOperator`
**Observer:** `liquidator, borrower`

| Field | Daml Type |
|-------|-----------|
| resultId | Text |
| protocolOperator | Party |
| liquidator | Party |
| borrower | Party |
| borrowPositionId | PositionId |
| collateralSeized | Decimal |
| liquidatorRewardPaid | Decimal |
| protocolFeePaid | Decimal |
| returnedToBorrower | Decimal |
| executedAt | Time |
| tier | LiquidationTier |

---

## Module: Dualis.Oracle.PriceFeed

### PriceFeed (template)
**Key:** `(oracleProvider, feedId)`
**Signatory:** `oracleProvider`
**Observer:** `protocolOperator`

| Field | Daml Type |
|-------|-----------|
| feedId | Text |
| protocolOperator | Party |
| oracleProvider | Party |
| asset | Text |
| quoteCurrency | Text |
| price | Decimal |
| confidence | Decimal |
| timestamp | Time |
| source | Text |
| heartbeatSeconds | Int |
| deviationThresholdPercent | Decimal |

**Choices:**
- `UpdatePrice(newPrice: Decimal, newConfidence: Decimal, newTimestamp: Time)` → Controller: oracleProvider

### AggregatedPriceFeed (template)
**Signatory:** `protocolOperator`

| Field | Daml Type |
|-------|-----------|
| feedId | Text |
| protocolOperator | Party |
| sources | [(Party, Decimal, Time)] |
| aggregatedPrice | Decimal |
| minSources | Int |
| maxDeviation | Decimal |
| lastAggregated | Time |

**Choices:**
- `Aggregate(newSources: [(Party, Decimal, Time)])` → Controller: protocolOperator

### Supported Feeds:
| Asset | Feed ID | Source | Frequency |
|-------|---------|--------|-----------|
| ETH | eth-usd | Chainlink Data Streams | Sub-second |
| BTC | btc-usd | Chainlink Data Streams | Sub-second |
| CC | cc-usd | Chainlink Data Streams | Sub-second |
| USDC | usdc-usd | Chainlink PoR | 1 hour |
| USD1 | usd1-usd | Chainlink PoR | 1 hour |
| T-BILL-2026 | tbill-2026-usd | Chainlink NAVLink + DTCC | 15 min |
| T-NOTE-10Y | tnote-10y-usd | Chainlink NAVLink + DTCC | 15 min |
| SPY-2026 | spy-2026-usd | Chainlink + market data | Real-time |
| TIFA RWA | tifa-rwa-usd | TIFA Oracle + Chainlink | Daily |

---

## Module: Dualis.Token (DUAL)

### Token Parameters:
| Parameter | Value |
|-----------|-------|
| Name | Dualis Token |
| Symbol | DUAL |
| Standard | CIP-56 |
| Total Supply | 1,000,000,000 |

### Distribution:
| Allocation | % | Amount | Vesting |
|-----------|---|--------|---------|
| Protocol Development | 25% | 250,000,000 | 4yr linear, 12mo cliff |
| Ecosystem | 20% | 200,000,000 | 3yr linear, 6mo cliff |
| Community Rewards | 25% | 250,000,000 | Per epoch, usage-based |
| Treasury | 15% | 150,000,000 | DAO-controlled |
| Investors | 10% | 100,000,000 | 2yr linear, 6mo cliff |
| Advisors | 5% | 50,000,000 | 2yr linear, 12mo cliff |

### StakingPosition (conceptual — not full Daml spec)
| Field | Type |
|-------|------|
| staker | Party |
| stakedAmount | Decimal |
| safetyModuleStake | Decimal |
| pendingRewards | Decimal |
| stakingSince | Time |
| cooldownEnd | Optional Time |
| votingPower | Decimal |

---

## Module: Dualis.Integration.TIFA

### TIFACollateralBridge (template)
**Signatory:** `protocolOperator`
**Observer:** `borrower, tifaTokenAdmin`

| Field | Daml Type |
|-------|-----------|
| bridgeId | Text |
| protocolOperator | Party |
| borrower | Party |
| tifaTokenAdmin | Party |
| receivableId | Text |
| originalInvoiceValueUSD | Decimal |
| discountedValueUSD | Decimal |
| maturityDate | Time |
| debtorCreditRating | Text |
| haircut | Decimal |
| effectiveCollateralUSD | Decimal |
| status | BridgeStatus |
| createdAt | Time |

### BridgeStatus (enum)
```
Pending | Active | Matured | Released | Liquidated
```

**Choices:**
- `UpdateValuation(newDiscountedValue: Decimal, timestamp: Time)` → Controller: protocolOperator

### TIFA Haircut Schedule:
| Debtor Rating | < 30 days | 30-90 days | 90-180 days |
|--------------|-----------|------------|-------------|
| AAA/AA | 10% | 15% | 20% |
| A/BBB | 20% | 25% | 30% |
| BB/B | 30% | 35% | 40% |
| Unrated | 40% | 45% | 50% |

---

## TypeScript Type Generation Guide

When generating TypeScript types from this reference:

1. **Naming:** Match Daml module structure → TypeScript namespace or flat exports
   - `Dualis.Core.Types.Asset` → `export interface Asset { ... }`
   - `Dualis.Lending.Pool.LendingPool` → `export interface LendingPool { ... }`

2. **Type mapping:**
   - Daml `Decimal` → `string` (use string to preserve precision, parse with Decimal.js)
   - Daml `Party` → `string`
   - Daml `Time` → `string` (ISO 8601)
   - Daml `Int` → `number`
   - Daml `Bool` → `boolean`
   - Daml `Text` → `string`
   - Daml `Optional a` → `a | null`
   - Daml `[a]` → `a[]`
   - Daml `ContractId a` → `string`

3. **Enums:** Use TypeScript union types (not enum keyword)
   ```typescript
   export type CreditTier = 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Unrated';
   ```

4. **Variants:** Use discriminated unions
   ```typescript
   export type InterestRateModel =
     | { type: 'FixedRate'; rate: string }
     | { type: 'VariableRate'; baseRate: string; multiplier: string; kink: string; jumpMultiplier: string }
     | { type: 'OracleLinked'; benchmarkId: string; spread: string };
   ```

5. **Contract wrappers:** For Canton API responses
   ```typescript
   export interface CantonContract<T> {
     contractId: string;
     templateId: string;
     payload: T;
     signatories: string[];
     observers: string[];
     createdAt: string;
   }
   ```

6. **Add JSDoc:** Every interface and field should have a JSDoc comment with the description from this reference.
