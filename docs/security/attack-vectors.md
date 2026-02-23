# Attack Vector Catalog

**Document**: MP22 — Security Threat Analysis
**Protocol**: Dualis Finance
**Date**: 2026-02-23
**Classification**: Internal / Auditor Use

---

## AV-01: Oracle Price Manipulation

### Description

An attacker manipulates the price feed to create artificial liquidation opportunities or to borrow against inflated collateral. In DeFi, oracle manipulation is the single most exploited attack vector, responsible for over $1B in losses across protocols.

Dualis aggregates prices from multiple sources (CoinGecko, Binance, manual feed, internal feed) and computes a median in `packages/api/src/oracle/aggregator.ts`. On-ledger, `PriceFeed` contracts store per-source prices with confidence scores.

### Attack Scenarios

1. **Single-source compromise**: Attacker compromises one oracle source API key. Submits extreme price. Median calculation in `PriceFeed.medianPrice` mitigates if `minSources >= 2`.
2. **Flash-crash exploitation**: Legitimate extreme price movement triggers mass liquidations before TWAP smoothing can dampen the signal.
3. **Stale price exploitation**: If oracle update job (`oracleUpdate.job.ts`) fails, stale prices remain on-ledger. Attacker borrows against a collateral whose real-world price has dropped.

### Existing Mitigations

- TWAP engine in `packages/api/src/oracle/twap.ts` smooths price over configurable window
- Circuit breaker in `packages/api/src/oracle/__tests__/circuit-breaker.test.ts` (deviation threshold)
- Multi-source aggregation with configurable `minSources` (default: 2)
- `PriceFeed.isValid` flag and `maxStaleness` configuration
- `StalenessChecker` trigger scans for stale feeds

### Additional Recommendations

- Enforce price deviation check on-ledger in `PriceFeed.SubmitPrice` (reject >10% deviation from previous aggregated price)
- Add a delay/confirmation period for large price movements before they affect liquidation eligibility
- Implement on-ledger cross-reference from `ExecuteLiquidation` to `PriceFeed` contracts
- Add redundant oracle source (Pyth, Chainlink via bridge)

---

## AV-02: Flash Loan Attacks

### Description

Flash loans enable an attacker to borrow massive amounts within a single atomic transaction, manipulate markets, and repay — all with zero capital risk. Classic vectors include governance vote manipulation, oracle manipulation via DEX price impact, and liquidation cascades.

### Canton-Specific Context

Canton's transaction model has limited atomic composability compared to Ethereum. A Canton transaction tree can span multiple exercises, but each is mediated by the sequencer. True same-block flash loan + manipulation + repay atomicity is architecturally difficult on Canton.

The Dualis backend implements flash loans in `packages/api/src/services/flashLoan.service.ts` and `FlashLiquidation` DAML template.

### Existing Mitigations

- Canton's sequencer provides transaction ordering that is less susceptible to miner/validator manipulation
- Flash loan cap enforced in `ProtocolConfig.maxFlashLoanAmount` ($50M default)
- Flash loan fee (0.09% default) in `ProtocolConfig.flashLoanFee`
- `FlashLiquidation` requires `profit > 0.0` assertion

### Additional Recommendations

- Add per-block flash loan limits (maximum total flash loan volume per sequencer round)
- Implement flash loan cooldown per party (e.g., max 1 flash loan per 10 seconds)
- Monitor flash loan usage patterns for anomaly detection
- Consider requiring minimum collateral for flash liquidation participants

---

## AV-03: Governance Attacks

### Description

An attacker accumulates sufficient voting power (DUAL tokens) to pass malicious governance proposals: draining treasury, modifying protocol parameters, or adding backdoor contracts.

### Existing Mitigations

- `ProtocolConfig` changes are operator-only (no on-chain governance vote yet)
- Staking tiers provide weighted voting power (`StakingPosition.votingPower`)
- Lock periods on staking prevent flash governance attacks

### Additional Recommendations

- **Implement timelock** for all critical parameter changes (planned for MP23). Minimum 48-hour delay for: rate model changes, liquidation parameter changes, pause/unpause, reserve withdrawals
- Add proposal quorum requirements (minimum percentage of total staked DUAL)
- Implement vote delegation with snapshot-based voting power
- Add guardian/veto role that can cancel malicious proposals during timelock period

---

## AV-04: Reentrancy

### Description

Reentrancy occurs when an external call re-enters the calling contract before state updates complete. Classic vulnerability in Solidity; different profile in DAML.

### DAML Analysis

DAML is a purely functional language with immutable contract state. When a choice is exercised, the contract is consumed and a new contract is created. There is no mutable state to corrupt via reentrancy. The DAML ledger model prevents reentrancy by design.

### Backend Analysis

The Fastify API backend in Node.js is single-threaded but async. Concurrent requests to the same resource (e.g., two simultaneous withdrawals from the same position) could create race conditions.

### Existing Mitigations

- DAML's functional/immutable model eliminates smart contract reentrancy
- Canton's contract consumption model provides atomic state transitions

### Additional Recommendations

- **Implement Redis distributed locks** (via `packages/api/src/cache/redis.ts`) for critical backend operations: withdrawal processing, liquidation execution, position creation
- Add idempotency keys to all state-changing API endpoints
- Implement optimistic locking with version counters on database rows
- Use BullMQ job deduplication for critical jobs (interest accrual, oracle updates)

---

## AV-05: Sandwich Attacks

### Description

In traditional DeFi, a sandwich attack involves front-running a user's transaction by placing a buy order before and a sell order after, profiting from the price impact. This requires visibility into the mempool.

### Canton-Specific Context

Canton's mempool is private. Transactions are submitted to the participant node and forwarded to the sequencer. Other participants cannot observe pending transactions before they are sequenced.

### Existing Mitigations

- Canton's private mempool eliminates traditional MEV/sandwich attacks
- Transaction ordering is determined by the sequencer, not by gas price bidding
- No public mempool for front-running

### Additional Recommendations

- Monitor for insider sandwich attacks (if sequencer operator is compromised)
- Implement slippage protection on backend for large trades
- Add transaction ordering audit logs to detect sequencer manipulation
- Consider sequencer decentralization timeline

---

## AV-06: Economic Attacks

### Description

Economic attacks exploit protocol incentive design rather than code vulnerabilities.

### 6a. Utilization Manipulation

An attacker deposits large amounts to lower utilization rate, reducing borrow APY. Then borrows at the artificially low rate. When the attacker withdraws their supply, utilization spikes, causing existing borrowers to face jump-rate interest.

**Existing mitigations**: Jump rate model in `packages/shared/src/utils/math.ts` penalizes utilization above kink. Supply/borrow caps in `CollateralParams`.

**Recommendation**: Add rate smoothing to prevent sudden jumps. Consider implementing a utilization-weighted average rate window.

### 6b. Bad Debt Accumulation

If collateral value drops faster than liquidation can process, the protocol accumulates bad debt (debt exceeding collateral value). This is socialized across all depositors.

**Existing mitigations**: Liquidation penalty incentivizes timely liquidation. Close factor system (50% normal, 100% critical below HF 0.50). `LiquidationScanner` trigger.

**Recommendation**: Implement a bad debt insurance fund (reserve buffer). Add protocol-level auto-deleveraging for extreme scenarios. Set conservative LTV ratios for volatile assets.

### 6c. Credit Tier Gaming

An attacker manipulates their `CompositeCredit` score to unlock higher-tier lending parameters (higher LTV, rate discounts). On-chain component (max 400 points) could be gamed by cycling small loans.

**Existing mitigations**: Off-chain score component (350 points) requires external verification. Score is operator-calculated, not self-reported.

**Recommendation**: Add minimum loan duration requirements for on-chain score. Implement anomaly detection for rapid score changes. Add cooldown period after tier upgrades before new borrowing limits apply.

---

## AV-07: Web Application Attacks

### 7a. Cross-Site Scripting (XSS)

**Description**: Injecting malicious scripts into the web frontend to steal session tokens, modify displayed data, or redirect transactions.

**Existing mitigations**: React's JSX auto-escaping, Next.js CSP headers, Helmet middleware in API.

**Recommendation**: Audit for `dangerouslySetInnerHTML` usage. Implement strict CSP with nonce-based script loading. Sanitize all user-generated content (display names, company names).

### 7b. Server-Side Request Forgery (SSRF)

**Description**: Exploiting webhook URL configuration to make the server send requests to internal network resources.

**Existing mitigations**: Webhook URL validation in `packages/api/src/routes/compliance-webhook.ts`.

**Recommendation**: Implement private IP range blocking (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x). Whitelist allowed webhook domains. Use a dedicated outbound proxy for webhook delivery.

### 7c. Insecure Direct Object Reference (IDOR)

**Description**: Accessing resources belonging to other users by manipulating identifiers in API requests (e.g., changing `positionId` to view another user's position).

**Existing mitigations**: Auth middleware extracts `userId` from JWT. Admin auth guards enforce role hierarchy.

**Recommendation**: Audit every endpoint to ensure resource ownership is validated against `request.user.userId`. Add automated IDOR testing to CI pipeline. Pay special attention to: `/auth/sessions/:sessionId`, position queries, notification preferences.

### 7d. Session Hijacking

**Description**: Stealing or replaying JWT access tokens to impersonate users.

**Existing mitigations**: JWT with expiry, refresh token rotation in `packages/api/src/routes/auth.ts`, session revocation via `/auth/revoke-all-sessions`, brute force protection in `security/brute-force.ts`.

**Recommendation**: Bind JWT to client fingerprint (IP + User-Agent hash). Implement sliding session expiry. Add session anomaly detection (geographic impossible travel). Consider refresh token binding to device.

---

## AV-08: Infrastructure Attacks

### 8a. API Key/Secret Leakage

**Description**: Hardcoded secrets in source code or environment variable exposure.

**Existing mitigations**: Environment-based configuration in `.env.*` files (gitignored).

**Recommendation**: Run `scripts/security-test.sh` in CI. Use a secrets manager (AWS Secrets Manager, Vault). Rotate API keys regularly. Audit git history for past secret commits.

### 8b. Denial of Service

**Description**: Overwhelming API endpoints to degrade service for legitimate users.

**Existing mitigations**: Rate limiting per endpoint in auth routes (5-20 requests per time window). Fastify built-in request size limits.

**Recommendation**: Deploy behind Cloudflare WAF with DDoS protection. Implement adaptive rate limiting based on server load. Add WebSocket connection limits. Rate limit the Canton JSON API.

### 8c. Supply Chain Attack

**Description**: Compromised npm dependency injecting malicious code.

**Existing mitigations**: pnpm lockfile (`pnpm-lock.yaml`) ensures reproducible installs.

**Recommendation**: Run `pnpm audit` in CI with fail-on-high. Pin exact dependency versions. Enable Dependabot/Renovate for automated security updates. Consider using `socket.dev` for supply chain monitoring.

---

## Risk Summary Matrix

| Vector | Likelihood | Impact | Overall Risk | Status |
|--------|-----------|--------|-------------|--------|
| AV-01: Oracle Manipulation | Medium | Critical | **High** | Partially mitigated |
| AV-02: Flash Loan | Low | High | **Medium** | Partially mitigated |
| AV-03: Governance | Low | Critical | **Medium** | Open (MP23) |
| AV-04: Reentrancy | Very Low (DAML) / Medium (Backend) | High | **Medium** | Partially mitigated |
| AV-05: Sandwich | Very Low | Medium | **Low** | Mitigated (Canton) |
| AV-06: Economic | Medium | High | **High** | Partially mitigated |
| AV-07: Web App | Medium | High | **High** | Partially mitigated |
| AV-08: Infrastructure | Low | Critical | **Medium** | In progress |

---

*This catalog should be reviewed and updated quarterly, and after each major protocol upgrade.*
