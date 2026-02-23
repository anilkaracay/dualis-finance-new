# DAML/Canton Smart Contract Security Audit

**Document**: MP22 — Smart Contract Security Audit Report
**Protocol**: Dualis Finance
**Daml SDK**: 2.9.3 (target LF 2.1)
**Date**: 2026-02-23
**Status**: Pre-audit preparation

---

## 1. Contract Inventory

| Module | Template | Signatory | Observer(s) | Key |
|--------|----------|-----------|-------------|-----|
| `Dualis.Lending.Pool` | `LendingPool` | `operator` | — | `(operator, poolId)` |
| `Dualis.Lending.Pool` | `SupplyPosition` | `operator, depositor` | — | `(operator, positionId)` |
| `Dualis.Lending.Borrow` | `BorrowPosition` | `operator, borrower` | — | `(operator, positionId)` |
| `Dualis.Lending.Collateral` | `CollateralVault` | `operator, owner` | — | `(operator, vaultId)` |
| `Dualis.Oracle.PriceFeed` | `PriceFeed` | `operator` | — | `(operator, asset)` |
| `Dualis.Oracle.PriceFeed` | `PriceOracle` | `operator` | — | `(operator, oracleId)` |
| `Dualis.Liquidation.Engine` | `LiquidationTrigger` | `operator` | — | `(operator, positionId)` |
| `Dualis.Liquidation.Engine` | `LiquidationResult` | `operator, liquidator` | — | `(operator, resultId)` |
| `Dualis.Liquidation.Engine` | `FlashLiquidation` | `operator, liquidator` | — | `(operator, flashId)` |
| `Dualis.Liquidation.Engine` | `BatchLiquidation` | `operator` | — | `(operator, batchId)` |
| `Dualis.Token.DUAL` | `DUALToken` | `operator` | — | `operator` |
| `Dualis.Token.DUAL` | `StakingPosition` | `operator, staker` | — | `(operator, positionId)` |
| `Dualis.Token.DUAL` | `TokenVesting` | `operator, beneficiary` | — | `(operator, vestingId)` |
| `Dualis.Credit.CompositeScore` | `CompositeCredit` | `operator, owner` | — | `(operator, owner)` |
| `Dualis.Core.Config` | `ProtocolConfig` | `operator` | — | `operator` |
| `Dualis.Privacy.Config` | `PrivacyConfig` | `operator, user` | — | `(operator, user)` |

### Signatory Review Notes

- **LendingPool** is signed only by `operator`. This means the operator can unilaterally modify pool parameters, pause pools, and withdraw reserves without depositor consent. This is intentional for operational efficiency but creates a trust dependency on the operator party.
- **LiquidationTrigger** is signed only by `operator`. The `ExecuteLiquidation` choice is controlled by `liquidator` (an arbitrary party), which means any party can act as a liquidator. This is the standard DeFi pattern but requires careful price validation.
- **SupplyPosition**, **BorrowPosition**, **CollateralVault**, **StakingPosition**, **TokenVesting**, **CompositeCredit**, and **PrivacyConfig** are dual-signatory (`operator` + user party), providing proper authorization guarantees for user-facing operations.

---

## 2. Choice Controller Analysis

| Template | Choice | Controller | Consuming | Risk Level |
|----------|--------|-----------|-----------|------------|
| **LendingPool** | `AccrueInterest` | `operator` | Yes | Low |
| **LendingPool** | `Deposit` | `depositor` | Yes | Medium |
| **LendingPool** | `ProcessWithdraw` | `operator` | Yes | Medium |
| **LendingPool** | `RecordBorrow` | `operator` | Yes | High |
| **LendingPool** | `RecordRepay` | `operator` | Yes | Low |
| **LendingPool** | `UpdateRateModel` | `operator` | Yes | High |
| **LendingPool** | `SetPoolActive` | `operator` | Yes | High |
| **LendingPool** | `WithdrawReserves` | `operator` | Yes | High |
| **SupplyPosition** | `Withdraw` | `depositor` | Yes | Medium |
| **BorrowPosition** | `Repay` | `borrower` | Yes | Low |
| **BorrowPosition** | `AddCollateral` | `borrower` | Yes | Low |
| **BorrowPosition** | `RemoveCollateral` | `borrower` | Yes | **Critical** |
| **BorrowPosition** | `UpdateHealthFactor` | `operator` | Yes | High |
| **BorrowPosition** | `MarkLiquidated` | `operator` | Yes | High |
| **CollateralVault** | `DepositCollateral` | `owner` | Yes | Low |
| **CollateralVault** | `TopUpCollateral` | `owner` | Yes | Low |
| **CollateralVault** | `WithdrawCollateral` | `owner` | Yes | **Critical** |
| **CollateralVault** | `SeizeCollateral` | `operator` | Yes | High |
| **CollateralVault** | `UpdateCollateralPrices` | `operator` | Yes | High |
| **PriceFeed** | `SubmitPrice` | `operator` | Yes | High |
| **PriceFeed** | `BatchUpdatePrices` | `operator` | Yes | High |
| **PriceFeed** | `MarkStale` | `operator` | Yes | Medium |
| **LiquidationTrigger** | `ExecuteLiquidation` | `liquidator` | Yes | **Critical** |
| **LiquidationTrigger** | `CancelTrigger` | `operator` | Yes | Medium |
| **FlashLiquidation** | `ExecuteFlashLiquidation` | `operator` | Yes | High |
| **DUALToken** | `MintTokens` | `operator` | Yes | **Critical** |
| **DUALToken** | `BurnTokens` | `operator` | Yes | High |
| **StakingPosition** | `AddStake` | `staker` | Yes | Low |
| **StakingPosition** | `Unstake` | `staker` | Yes | Medium |
| **StakingPosition** | `ClaimRewards` | `staker` | Yes | Medium |
| **StakingPosition** | `AccrueRewards` | `operator` | Yes | High |
| **StakingPosition** | `UnlockPosition` | `operator` | Yes | Medium |
| **TokenVesting** | `ClaimVested` | `beneficiary` | Yes | Medium |
| **TokenVesting** | `RevokeVesting` | `operator` | Yes | High |
| **CompositeCredit** | `RecalculateComposite` | `operator` | Yes | High |
| **ProtocolConfig** | `UpdateProtocolParams` | `operator` | Yes | **Critical** |
| **ProtocolConfig** | `SetPauseStatus` | `operator` | Yes | **Critical** |
| **PrivacyConfig** | `SetPrivacyLevel` | `user` | Yes | Low |
| **PrivacyConfig** | `AddDisclosure` | `user` | Yes | Low |
| **PrivacyConfig** | `RemoveDisclosure` | `user` | Yes | Low |

---

## 3. Precondition Completeness Audit

### Existing `assertMsg` Checks

| Template | Choice | Assertion | Adequate? |
|----------|--------|-----------|-----------|
| `LendingPool.Deposit` | `amount > 0.0` | Yes |
| `LendingPool.Deposit` | `isActive` | Yes |
| `LendingPool.Deposit` | `supplyCap` check | Yes |
| `LendingPool.ProcessWithdraw` | `withdrawAmount <= available` | Yes |
| `LendingPool.RecordBorrow` | `borrowAmount <= available` | Yes |
| `LendingPool.RecordBorrow` | `borrowCap` check | Yes |
| `LendingPool.WithdrawReserves` | `amount <= totalReserves` | Yes |
| `BorrowPosition.Repay` | `repayAmount <= currentDebt` | Yes |
| `BorrowPosition.RemoveCollateral` | `not (null remaining)` | Yes |
| `BorrowPosition.RemoveCollateral` | `newHF.value >= 1.2` | Yes |
| `CollateralVault.TopUpCollateral` | `additionalAmount > 0.0` | Yes |
| `CollateralVault.WithdrawCollateral` | `withdrawAmount <= e.amount` | Partial |
| `LiquidationTrigger.ExecuteLiquidation` | `healthFactor < 1.0` | Yes |
| `LiquidationTrigger.ExecuteLiquidation` | `not isProcessed` | Yes |
| `LiquidationTrigger.ExecuteLiquidation` | `result.isLiquidatable` | Yes |
| `FlashLiquidation.ExecuteFlash` | `profit > 0.0` | Yes |
| `DUALToken.MintTokens` | `circulatingSupply + amount <= totalSupply` | Yes |
| `DUALToken.BurnTokens` | `amount <= circulatingSupply` | Yes |
| `StakingPosition.AddStake` | `additionalAmount > 0.0` | Yes |
| `StakingPosition.Unstake` | `not isLocked` | Yes |
| `StakingPosition.Unstake` | `unstakeAmount <= stakedAmount` | Yes |
| `StakingPosition.ClaimRewards` | `accruedRewards > 0.0` | Yes |
| `TokenVesting.ClaimVested` | `not isRevoked` | Yes |
| `TokenVesting.ClaimVested` | `claimedAmount + claimAmount <= totalAmount` | Yes |
| `ProtocolConfig.UpdateProtocolParams` | Unpause/cap sanity check | Partial |

### Missing Preconditions

| Location | Missing Check | Severity | Description |
|----------|--------------|----------|-------------|
| `CollateralVault.WithdrawCollateral` | **No health factor validation** | **CRITICAL** | Allows owner to withdraw collateral without verifying the associated borrow position remains healthy. An attacker could drain collateral and leave an undercollateralized position. |
| `CollateralVault.DepositCollateral` | No `amount > 0.0` check on entry | Low | The `entry` parameter is a full `CollateralEntry` struct; no assertion that `entry.amount > 0.0`. |
| `LiquidationTrigger.ExecuteLiquidation` | **No price validation** | **HIGH** | `debtPriceUSD` and `collateralPriceUSD` are passed as plain parameters by the liquidator. No on-ledger cross-reference to `PriceFeed` contracts. A malicious liquidator could submit manipulated prices. |
| `BorrowPosition.RemoveCollateral` | **Hardcoded `liqThreshold = 0.82`** | **HIGH** | The `toCollInput` helper hardcodes `liqThreshold = 0.82` and `liqPenalty = 0.05` for all collateral types, ignoring the actual per-asset `CollateralParams`. This breaks RWA and TIFA tier calculations. |
| `BorrowPosition.RemoveCollateral` | **Hardcoded `tier = CryptoTier`** | Medium | All collateral is treated as CryptoTier (no haircut). RWA (5% haircut) and TIFA (20% haircut) assets get incorrect HF calculations. |
| `LiquidationTrigger.ExecuteLiquidation` | Hardcoded `ltv = 0.75`, `liqThreshold = 0.82` | **HIGH** | Same hardcoding issue as `RemoveCollateral`. Liquidation math does not respect per-asset or per-tier parameters. |
| `PriceFeed.SubmitPrice` | No deviation check | Medium | No circuit breaker to reject a price that deviates more than X% from the current aggregated price. A compromised oracle source could push an extreme price. |
| `PriceFeed.BatchUpdatePrices` | No deviation check | Medium | Same issue as `SubmitPrice`. |
| `LendingPool.Deposit` | No pause check propagation | Low | Deposit checks `isActive` but does not cross-reference `ProtocolConfig.isPaused`. A pool could accept deposits when the global protocol is paused. |
| `DUALToken.MintTokens` | No allocation category tracking | Low | `MintTokens` does not update the `allocations` field, so token allocation accounting can drift. |
| `BatchLiquidation.ProcessBatchItem` | No validation of input amounts | Medium | `debtRepaid`, `collateralSeized`, `protocolFee` are accepted without any assertion. |

---

## 4. Key Findings

### FINDING-01: CollateralVault.WithdrawCollateral Has No Health Factor Check (CRITICAL)

**Location**: `Dualis.Lending.Collateral`, line 90-113
**Risk**: A borrower can withdraw collateral below the liquidation threshold without any on-ledger enforcement. The comment on line 89 states "requires HF check externally" but this creates a critical gap if the backend service fails to enforce it.

**Proof of concept**: A borrower with a BorrowPosition and CollateralVault could exercise `WithdrawCollateral` directly via the Canton JSON API, bypassing the backend HF check entirely.

**Recommendation**: Add an on-ledger HF recalculation within the choice body, similar to `BorrowPosition.RemoveCollateral`, or require the operator as a co-controller so that only the backend (acting as operator) can authorize withdrawals.

### FINDING-02: LiquidationTrigger.ExecuteLiquidation Accepts Arbitrary Prices (HIGH)

**Location**: `Dualis.Liquidation.Engine`, lines 44-46
**Risk**: The `debtPriceUSD` and `collateralPriceUSD` are free parameters provided by the liquidator. There is no on-ledger cross-reference to a `PriceFeed` contract. A malicious liquidator could submit manipulated prices to maximize collateral seizure.

**Recommendation**: Either (a) read the price on-ledger from the `PriceFeed` contract via `exerciseByKey`, or (b) make the operator a co-controller who validates prices against the on-ledger oracle before submission.

### FINDING-03: BorrowPosition.RemoveCollateral Uses Hardcoded Parameters (HIGH)

**Location**: `Dualis.Lending.Borrow`, lines 116-123
**Risk**: The `toCollInput` helper hardcodes `liqThreshold = 0.82`, `liqPenalty = 0.05`, and `tier = CryptoTier` for all collateral types. For RWA assets (actual threshold may differ) and TIFA assets (20% haircut), this produces an incorrect health factor calculation, potentially allowing unsafe collateral removal.

**Recommendation**: Store per-asset `CollateralParams` on the `CollateralRef` or look them up from the `ProtocolConfig` template.

### FINDING-04: Timestamps Are Unvalidated Text (MEDIUM)

**Location**: `Dualis.Types`, line 16
**Risk**: `Timestamp` is aliased to `Text` across the entire protocol. No validation is performed on timestamp format, ordering, or monotonicity. A malicious party could submit future-dated or past-dated timestamps.

**Impact**: Interest accrual (`AccrualState.lastAccrualTs`) uses `Int` for Unix seconds (properly typed), but all user-facing timestamps in `PrivacyConfig`, `CompositeCredit`, `FlashLiquidation`, and `CollateralEntry` use `Text` with no format enforcement.

**Recommendation**: Use Daml's built-in `DA.Time.Time` type or at minimum validate ISO 8601 format and enforce monotonic ordering (new timestamp > previous timestamp).

### FINDING-05: Operator Single Point of Trust (MEDIUM)

**Location**: All templates
**Risk**: The `operator` party has unilateral control over critical functions: minting tokens, updating protocol parameters, seizing collateral, modifying interest rates, and pausing the protocol. There is no multi-sig, timelock, or governance vote requirement at the DAML layer.

**Recommendation**: Implement a governance or multi-sig template that requires M-of-N approvals for critical parameter changes (planned for MP23 timelock). Until then, document the trust assumptions clearly.

---

## 5. Canton-Specific Security Analysis

### 5.1 Double-Spend Prevention

Canton provides native double-spend protection through its UTXO-like contract consumption model. When a choice is exercised on a contract, the contract is consumed atomically. Two competing exercises on the same contract ID will result in one succeeding and the other failing with a `ContractNotActive` error. This is enforced at the sequencer level.

**Assessment**: No additional mitigation required. Canton's architecture inherently prevents double-spend.

### 5.2 Deterministic Execution

All DAML choice bodies execute deterministically. The protocol uses:
- Taylor series approximation for `exp`/`ln` in `Dualis.Lending.Math` (no floating-point non-determinism)
- `Decimal` type throughout (fixed-point arithmetic)
- No external I/O or randomness within choice bodies

**Assessment**: Sound. The Taylor series precision should be validated against the TypeScript math engine to ensure cross-layer consistency.

### 5.3 Privacy Model

Canton's sub-transaction privacy ensures that:
- Only signatories and observers of a contract can see its contents
- `LendingPool` (operator-only signatory) data is visible only to the operator
- `BorrowPosition`, `CollateralVault`, and `StakingPosition` (dual signatory) data is visible to both operator and the respective user
- `PrivacyConfig` template provides user-controlled selective disclosure

**Assessment**: The privacy model is well-designed. One concern: the `PrivacyConfig.CheckAccess` choice uses `show user` to convert a `Party` to `Text` for comparison with `requester`. This is implementation-dependent and could break if party display names change.

### 5.4 Key Uniqueness and Collision

All templates use composite keys (`operator` + identifier). Key collision would cause contract creation to fail with `DuplicateKey`. The `positionId` generation pattern in `LendingPool.Deposit` uses `poolId <> "-supply-" <> show depositor`, which is deterministic but could collide if a depositor creates multiple supply positions in the same pool.

**Assessment**: The deposit position ID generation should be made unique (e.g., append a nonce or use `getTime`).

---

## 6. Recommendations

### Critical Priority (Fix Before Mainnet)

1. **Add on-ledger HF check to `CollateralVault.WithdrawCollateral`** or require operator co-control. This is the single most exploitable gap.
2. **Validate prices in `ExecuteLiquidation`** by cross-referencing `PriceFeed` contracts or requiring operator co-signature with validated prices.
3. **Replace hardcoded parameters** in `BorrowPosition.RemoveCollateral` and `LiquidationTrigger.ExecuteLiquidation` with actual per-asset values from `CollateralParams`.

### High Priority

4. Add price deviation circuit breaker to `PriceFeed.SubmitPrice` and `BatchUpdatePrices`.
5. Enforce timestamp monotonicity (new timestamp > previous timestamp) on all consuming choices.
6. Add `amount > 0.0` assertions to all deposit/mint/stake entry points that lack them.

### Medium Priority

7. Implement operator multi-sig or timelock for `ProtocolConfig` changes, `MintTokens`, and `SetPoolActive`.
8. Add global `isPaused` check propagation to `LendingPool.Deposit` and `LendingPool.RecordBorrow`.
9. Validate `BatchLiquidation.ProcessBatchItem` input amounts.
10. Replace `type Timestamp = Text` with `DA.Time.Time` or add format validation.

### Low Priority

11. Track allocation category in `DUALToken.MintTokens`.
12. Make supply position IDs unique across multiple deposits.
13. Add staleness check to `PriceFeed.GetPrice` using `DA.Time` comparison rather than relying solely on the `isValid` flag.

---

## 7. Test Coverage Assessment

| Test Module | Templates Covered | Coverage Level |
|-------------|-------------------|----------------|
| `Test.PoolTest` | LendingPool, SupplyPosition | Good |
| `Test.BorrowTest` | BorrowPosition | Good |
| `Test.LiquidationTest` | LiquidationTrigger, LiquidationResult | Good |
| `Test.CreditTest` | CompositeCredit | Good |
| `Test.TokenTest` | DUALToken, StakingPosition, TokenVesting | Good |
| `Test.OracleTest` | PriceFeed, PriceOracle | Good |
| `Test.ConfigTest` | ProtocolConfig | Good |
| `Test.MathTest` | Math helpers | Good |
| `Test.TriggerTest` | Trigger logic | Good |
| `Test.IntegrationTest` | Cross-template flows | Partial |

**Gaps**: No negative test cases for the identified findings (arbitrary price injection, collateral withdrawal without HF check, hardcoded parameter exploitation). Integration tests should cover adversarial scenarios.

---

*This document is prepared for external auditor review. All line numbers reference the DAML source files in `packages/canton/daml/`.*
