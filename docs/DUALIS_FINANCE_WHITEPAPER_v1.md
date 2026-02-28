# DUALIS FINANCE

## Technical Whitepaper

### Institutional-Grade Hybrid Lending Infrastructure for the Tokenized Economy

**Version 1.0 -- March 2026**

**Organization:** Cayvox Labs
**Contact:** info@dualis.finance

---

## Abstract

Dualis Finance introduces the first hybrid lending protocol purpose-built for Canton Network -- the enterprise blockchain infrastructure selected by DTCC, Euroclear, and the world's largest financial institutions for real-asset tokenization. Traditional securities lending, representing $2.8 trillion in outstanding loans (ISLA, 2024), operates on T+2 settlement cycles, opaque pricing models, and prime broker intermediation that excludes smaller institutions. Existing decentralized lending protocols have demonstrated the viability of on-chain lending but remain unsuitable for institutional adoption due to the absence of transaction privacy, compliance frameworks, and credit risk differentiation.

Dualis bridges this divide through five architectural innovations: (1) a hybrid credit scoring system combining on-chain behavioral analytics, zero-knowledge off-chain credential verification, and ecosystem reputation into a five-tier classification enabling differentiated lending terms; (2) productive real-world lending deploying capital into verified physical and digital economy projects; (3) an advanced securities lending protocol reducing fees by approximately 90% versus prime brokers through atomic Canton settlement; (4) a dual-track architecture serving institutional participants via KYB-verified dedicated pools and retail users via standard shared pools; and (5) privacy-by-design leveraging Canton's sub-transaction privacy to ensure position confidentiality while maintaining regulatory auditability. The protocol comprises 101,000+ lines of code, 38 DAML smart contract templates across 25 modules, 262 API endpoints, and is deployed on Canton devnet with all core DeFi operations functional.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Protocol Architecture](#2-protocol-architecture)
3. [Hybrid Lending Protocol](#3-hybrid-lending-protocol)
4. [Asset-Agnostic Collateral Framework](#4-asset-agnostic-collateral-framework)
5. [Hybrid Credit Scoring System](#5-hybrid-credit-scoring-system)
6. [Liquidation Engine](#6-liquidation-engine)
7. [Securities Lending Protocol](#7-securities-lending-protocol)
8. [Governance and Tokenomics](#8-governance-and-tokenomics)
9. [Privacy and Dual-Track Architecture](#9-privacy-and-dual-track-architecture)
10. [Oracle and Price Feed System](#10-oracle-and-price-feed-system)
11. [Security Considerations](#11-security-considerations)
12. [Canton Network and Ecosystem](#12-canton-network-and-ecosystem)
13. [Roadmap and Conclusion](#13-roadmap-and-conclusion)

---

## 1. Introduction

### 1.1 The Structural Gap

The global lending ecosystem operates along two disconnected tracks. Traditional securities lending ($2.8 trillion outstanding, ISLA 2024) is constrained by T+2 settlement, manual reconciliation consuming 15-20% of back-office costs, and an oligopolistic structure where the top ten prime brokers control 85%+ of the market with fees of 50-200 basis points. DeFi lending protocols -- Aave V3 ($69B TVL), Compound, Maple Finance -- have proven on-chain lending viable at scale, but suffer from three structural deficiencies preventing institutional adoption: fully transparent positions visible to all participants, absence of credit risk differentiation where all borrowers pay identical rates, and a circular crypto economy generating no productive economic value.

No protocol in production combines institutional-grade privacy, hybrid credit scoring, asset-agnostic collateral frameworks accepting tokenized real-world assets, productive lending, and regulatory compliance sufficient for bank participation. This gap is a structural impediment to the tokenized economy's growth.

### 1.2 The Tokenization Catalyst

The convergence of regulatory clarity and institutional commitment has created an unprecedented opportunity. Tokenized real-world assets have grown from $5 billion (2022) to over $36 billion (2025), with projections of $16-30 trillion by 2030 (BCG, Standard Chartered, Citigroup). DTCC -- custodian of $99 trillion in securities -- has selected Canton Network for its digital asset initiatives. BlackRock's BUIDL fund has accumulated $2.85 billion in tokenized Treasury bills. In February 2026, Canton's expanded institutional working group -- comprising LSEG, Euroclear, Citadel Securities, Tradeweb, Goldman Sachs -- convened to develop standards for interoperable financial applications, including lending and collateral management.

### 1.3 Thesis Statement

> *Dualis Finance is the lending infrastructure layer for Canton Network -- the blockchain where the world's largest financial institutions tokenize real assets. We do not tokenize assets; we build the lending markets those assets need.*

Dualis delivers on this thesis through five core innovations:

1. **Hybrid Credit Scoring.** A three-layer composite system combining on-chain behavioral analytics (40%), zero-knowledge off-chain credentials (35%), and ecosystem reputation (25%) to classify borrowers into five tiers -- Diamond, Gold, Silver, Bronze, Unrated -- each with differentiated terms.

2. **Productive Real-World Lending.** Borrowed capital deployed into verified physical and digital economy projects -- trade finance, equipment leasing, renewable energy -- generating yield from real economic activity.

3. **Institutional Securities Lending.** On-chain securities lending leveraging Canton's atomic settlement to reduce fees by ~90% versus prime brokers, from 50-200 bps to 5-20 bps.

4. **Dual-Track Architecture.** Institutional participants access KYB-verified dedicated pools; retail users access standard shared pools; both draw from a unified liquidity layer.

5. **Privacy-by-Design.** Canton's sub-transaction privacy ensures position confidentiality visible only to transaction participants and authorized regulators.

---

## 2. Protocol Architecture

### 2.1 System Overview

Dualis Finance is a monorepo comprising five packages -- shared utilities, backend API, frontend application, configuration, and Canton smart contracts -- orchestrated by pnpm workspaces and Turborepo.

```
+-------------------------------------------------------------+
|                    Users (Institutional / Retail)             |
+-------------------------------------------------------------+
        |                                            |
        v                                            v
+-------------------+                    +--------------------+
| PartyLayer SDK    |                    | External Wallets   |
| (CIP-0103 wallet  |                    | (Console, Loop,    |
|  abstraction)     |                    |  Cantor8, Nightly)  |
+-------------------+                    +--------------------+
        |                                            |
        +--------------------+  +--------------------+
                             |  |
                             v  v
+-------------------------------------------------------------+
|           Frontend (Next.js 14.2 App Router)                 |
|           89 pages | 116 components | Zustand state          |
+-------------------------------------------------------------+
        |                         |
        v                         v
+---------------------------+  +---------------------------+
| REST API (262 endpoints)  |  | WebSocket (real-time)     |
| Fastify 5.7 + Node.js    |  | Position updates, prices  |
+---------------------------+  +---------------------------+
        |           |           |            |
        v           v           v            v
+----------+  +-----------+  +----------+  +--------+
| PostgreSQL|  | Canton    |  | Oracle   |  | Redis  |
| (63 tables|  | Ledger    |  | Service  |  | (cache,|
| Drizzle   |  | (38 DAML  |  | (11 feeds|  |  rate  |
| ORM)      |  |  templates|  |  4 sources| |  limit)|
+----------+  |  25 modules|  +----------+  +--------+
              +-----------+
```

The architecture separates concerns along three axes: *confidentiality* (Canton), *performance* (Redis + PostgreSQL), and *correctness* (DAML smart contracts).

### 2.2 Hybrid On-Chain / Off-Chain Design

**On-Chain State (Canton DAML).** All financial state requiring cryptographic integrity resides on-ledger: position contracts, atomic settlement transactions, collateral locks, and governance votes. Canton provides sub-transaction privacy (only participants see data), atomic settlement (all-or-nothing execution), and regulatory auditability.

**Off-Chain State (PostgreSQL).** Derived and non-financial state resides in PostgreSQL via Drizzle ORM: analytics aggregations, user preferences, credit score components, and oracle price cache. Synchronization operates through Canton's gRPC transaction stream subscription with sub-second propagation delay.

This hybrid approach enables sub-100ms page loads while preserving Canton's guarantees for all financial state modifications.

### 2.3 Canton Network Integration

**Command Submission** via Canton JSON API v2 for all write operations with built-in command deduplication. **Transaction Stream** via gRPC Ledger API for real-time state synchronization.

**DAML Smart Contracts.** 38 templates across 25 modules, compiled to Daml-LF 2.1. Key design decisions: no contract keys (LF 2.1 constraint -- lookups via contract IDs with off-chain mapping), signatory/observer authorization replacing role-based access control, and atomic multi-party transactions eliminating reentrancy risks.

### 2.4 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Smart Contracts | DAML 3.4.11 (LF 2.1) | On-chain financial logic, atomic settlement |
| API Framework | Fastify 5.7 | High-performance REST API (262 endpoints) |
| ORM | Drizzle | Type-safe PostgreSQL query builder |
| Database | PostgreSQL 16 | Persistent storage (63 tables) |
| Cache | Redis (ioredis) | Sessions, rate limiting, caching |
| Job Queue | BullMQ | Interest accrual, oracle sync |
| Frontend | Next.js 14.2 | React SSR (89 pages, 116 components) |
| Client State | Zustand | Lightweight state management |
| UI | Radix UI + Tailwind CSS | Accessible components |
| Wallet | PartyLayer SDK | CIP-0103 Canton wallet abstraction |
| Identity | Sumsub | KYB/KYC verification |
| Compliance | Chainalysis | Transaction screening, AML |
| Build | Turborepo + pnpm | Monorepo orchestration |
| Testing | Vitest | 230+ unit/integration tests |

---

## 3. Hybrid Lending Protocol

### 3.1 Supply and Borrow Mechanics

**Supply.** Liquidity providers deposit assets into lending pools. The protocol records a supply position with principal $A$ and captures the current supply index $I_s(t_0)$. No receipt token is minted -- the Canton contract itself serves as the authoritative record. At any time $t$:

$$\text{Balance}(t) = A \times \frac{I_s(t)}{I_s(t_0)}$$

**Borrow.** Borrowers post collateral and draw loans up to their borrowing capacity:

$$\text{BorrowingCapacity} = \sum_{i=1}^{n} \left( \text{Collateral}_i \times \text{Price}_i \times \text{LTV}_i \times \text{TierHaircut}_i \right)$$

Outstanding debt at time $t$: $\text{Debt}(t) = \text{Principal} \times I_b(t) / I_b(t_0)$

### 3.2 Interest Rate Model -- Jump Rate Model

Dualis employs a Jump Rate Model with a utilization kink that provides predictable rates at normal levels and sharply escalating rates as utilization approaches 100%.

$$R_{borrow}(U) = \begin{cases} R_{base} + U \times R_{slope1} & \text{if } U \leq U_{optimal} \\ R_{base} + U_{optimal} \times R_{slope1} + (U - U_{optimal}) \times R_{slope2} & \text{if } U > U_{optimal} \end{cases}$$

$$R_{supply}(U) = R_{borrow}(U) \times U \times (1 - \text{ReserveFactor})$$

**Per-Asset Rate Parameters:**

| Asset | $R_{base}$ | $R_{slope1}$ | $U_{optimal}$ | $R_{slope2}$ | Reserve Factor |
|---|---|---|---|---|---|
| USDC / USDT | 2.0% | 7.0% | 80% | 30.0% | 10% |
| wBTC / wETH / ETH | 1.0% | 4.0% | 65% | 50.0% | 15% |
| CC (Canton Coin) | 3.0% | 10.0% | 60% | 80.0% | 20% |
| RWA T-Bills | 4.0% | 3.0% | 90% | 15.0% | 5% |
| TIFA Receivables | 8.0% | 12.0% | 70% | 60.0% | 15% |
| Tokenized Equity | 2.0% | 5.0% | 75% | 18.0% | 10% |

### 3.3 Index-Based Interest Accrual

Each pool maintains supply and borrow indices (initialized to 1.0), updated at each accrual event:

$$I_b(t + \Delta t) = I_b(t) \times \left(1 + r_b \times \Delta t\right)$$

where $r_b = R_{borrow}(U) / 31{,}557{,}600$. Any user's balance is computed as $P \times I(t) / I(t_0)$ -- capturing all accrued interest in O(1) computation regardless of position count. This mechanism is validated against 230+ unit tests covering edge cases including zero-time deltas and multi-year compounding.

### 3.4 Health Factor and Liquidation

$$HF = \frac{\sum_{i} \left( \text{Collateral}_i \times \text{Price}_i \times \text{LiqThreshold}_i \times \text{TierHaircut}_i \right)}{\text{TotalBorrowsUSD}}$$

| Status | HF Range | Description |
|---|---|---|
| **Safe** | HF > 2.0 | Well over-collateralized |
| **Healthy** | 1.5 < HF ≤ 2.0 | Adequate margin |
| **Caution** | 1.2 < HF ≤ 1.5 | Reduced margin, warnings issued |
| **Danger** | 1.0 < HF ≤ 1.2 | Approaching liquidation |
| **Liquidatable** | HF ≤ 1.0 | Eligible for third-party liquidation |

When HF ≤ 1.0, liquidators repay up to 50% of debt ($\text{CloseFactor}_{normal} = 0.50$; for HF < 0.50, full liquidation at $\text{CloseFactor}_{critical} = 1.00$). Collateral seized: $\text{DebtRepaid} \times (1 + \text{LiqPenalty}) / \text{CollateralPrice}$. Of the penalty, 90% goes to the liquidator and 10% to the protocol treasury.

### 3.5 Flash Loans

Atomic, single-transaction uncollateralized loans that must be repaid within the same Canton transaction. Fee: 0.09% (9 bps). Use cases include arbitrage, collateral swaps, self-liquidation (avoiding 3-10% penalty), and debt refinancing. Canton's atomic multi-party transactions guarantee the lending pool is never exposed to credit risk.

---

## 4. Asset-Agnostic Collateral Framework

### 4.1 Three-Tier Classification

The protocol classifies collateral into three tiers based on liquidity, volatility, and settlement risk:

| Tier | Asset Class | Haircut | Effective Value | Rationale |
|---|---|---|---|---|
| **crypto** | USDC, wBTC, wETH, ETH, CC | 0% | 100% | Deep 24/7 liquidity, instant settlement |
| **rwa** | T-Bills, bonds, structured products | 5% | 95% | Settlement risk, oracle latency, transfer restrictions |
| **tifa** | Trade receivables and invoices | 20% | 80% | Illiquid secondary markets, counterparty risk |

### 4.2 Per-Asset Risk Parameters

| Asset | LTV | Liq. Threshold | Liq. Penalty | Borrow Cap | Supply Cap | Tier |
|---|---|---|---|---|---|---|
| USDC | 80% | 85% | 4% | $500M | $1B | crypto |
| wBTC | 73% | 80% | 6% | $50M | $100M | crypto |
| wETH | 75% | 82% | 5% | $100M | $200M | crypto |
| ETH | 75% | 82% | 5% | $100M | $200M | crypto |
| CC | 55% | 65% | 8% | $20M | $50M | crypto |
| RWA-TBILL | 85% | 90% | 3% | $200M | $500M | rwa |
| TIFA-REC | 50% | 60% | 10% | -- | $100M | tifa |
| SPY (Equity) | 65% | 75% | 6% | $50M | $100M | crypto |

The LTV-to-Liquidation Threshold gap creates a buffer zone (5-10 percentage points per asset). TIFA-REC is collateral-only (`isBorrowEnabled: false`). Cross-collateralization allows multiple asset types simultaneously, with the Health Factor calculation independently weighting each asset's contribution.

### 4.3 Governance-Driven Asset Onboarding

New collateral assets are onboarded through a four-phase governance process: (1) Proposal submission with oracle, liquidity, and risk analysis; (2) Risk assessment covering oracle reliability, liquidity depth, regulatory status, and smart contract review; (3) Supermajority governance vote (67% with 10% quorum); (4) Staged activation with conservative initial parameters progressively relaxed as usage data validates behavior.

---

## 5. Hybrid Credit Scoring System

### 5.1 Composite Architecture

The Dualis credit score combines three independent dimensions:

$$S_{credit} = 0.40 \times S_{onchain} + 0.35 \times S_{offchain} + 0.25 \times S_{ecosystem}$$

**Layer 1: On-Chain History (40%).** Analyzes verifiable protocol behavior across four sub-factors: repayment ratio ($\alpha_1 = 0.35$, max 300 pts), utilization volume on logarithmic scale ($\alpha_2 = 0.25$, max 200 pts), risk management discipline via lowest-ever HF ($\alpha_3 = 0.25$, max 150 pts), and tenure via securities lending activity ($\alpha_4 = 0.15$, max 100 pts).

**Layer 2: Off-Chain ZK Credentials (35%).** Borrowers submit zero-knowledge proofs of real-world credentials -- credit score ranges, employment verification, asset thresholds -- without revealing underlying data. ZK circuits produce boolean attestations as public output while keeping credentials private.

**Layer 3: Ecosystem Reputation (25%).** Measures Canton Network participation: governance activity, validator staking, multi-protocol interactions. Anti-sybil measures include time-weighted scoring, diminishing marginal returns, and cross-correlation analysis.

### 5.2 Credit Tiers and Benefits

| Tier | Score | Max LTV | Rate Discount | Min Collateral | Liq. Buffer |
|---|---|---|---|---|---|
| **Diamond** | 850-1000 | 85% | 25% | 1.15x | 5% |
| **Gold** | 700-849 | 78% | 15% | 1.25x | 8% |
| **Silver** | 500-699 | 70% | 8% | 1.35x | 10% |
| **Bronze** | 300-499 | 60% | 0% | 1.50x | 12% |
| **Unrated** | 0-299 | 50% | 0% | 1.75x | 15% |

The effective LTV is always $\min(\text{AssetLTV}, \text{TierMaxLTV})$. A Diamond borrower using wETH (LTV 75%) borrows at $7.60\% \times 0.75 = 5.70\%$ -- saving $19,000/year on a $1M loan versus an Unrated borrower.

### 5.3 Pre-Liquidation Alerts and Credit Oracle

Tiered alerts calibrated per credit tier: Diamond receives first warning at HF 1.30, Unrated at HF 1.80. The **Credit Oracle API** exposes composite scores and tier information to third-party Canton applications, with volume-tiered pricing ($5-$50/query) and explicit user consent enforced through Canton's authorization model.

---

## 6. Liquidation Engine

### 6.1 Four-Tier Liquidation Cascade

Unlike binary liquidation models, Dualis implements a graduated cascade mirroring institutional risk management:

| Tier | Health Factor | Max Liquidation % | Behavior |
|---|---|---|---|
| Margin Call | 0.95 ≤ HF < 1.00 | 0% | Warning only; no forced action |
| Soft Liquidation | 0.90 ≤ HF < 0.95 | 25% | Partial liquidation to restore solvency |
| Forced Liquidation | 0.85 ≤ HF < 0.90 | 50% | Standard half-debt liquidation |
| Full Liquidation | HF < 0.85 | 100% | Emergency full position closure |

The Margin Call tier provides an institutional grace period for internal approval workflows. Soft Liquidation's 25% cap preserves borrower capital while often restoring HF above 1.0. The entire liquidation sequence executes atomically within a single Canton transaction.

### 6.2 Protective Mechanisms

- **Circuit Breaker**: 20%+ price movement within 5 minutes pauses all liquidation
- **Institutional Grace Period**: Margin Call zone extensible via governance
- **Emergency Admin Pause**: Global liquidation halt for black-swan events
- **Per-asset penalties**: 3% (T-Bills) to 10% (TIFA), split 90/10 between liquidator and treasury

---

## 7. Securities Lending Protocol

### 7.1 Market Structure

Securities lending on Dualis operates as a peer-to-peer marketplace for tokenized securities with five lifecycle steps: offer creation (`FractionalOffer`), offer matching with collateral lock, atomic asset transfer, continuous fee accrual, and return with settlement.

$$\text{LendingFee} = \text{Notional} \times r_{\text{annual}} \times \frac{t_{\text{duration}}}{365}$$

Expected rates of 5-20 bps annually versus 50-200 bps from prime brokers -- a ~90% fee reduction. The protocol extracts 10% of the lending fee for the treasury.

### 7.2 Structural Advantages

| Parameter | Traditional | Dualis Finance |
|---|---|---|
| Settlement | T+2 (2 business days) | Atomic (sub-second) |
| Fee Range | 50-200 bps | 5-20 bps |
| Market Access | Top-tier only | Any verified participant |
| Operating Hours | Market hours (M-F) | 24/7/365 |
| Counterparty Risk | Credit limits + ISDA | Eliminated via collateral lock |

Additional features: automated multilateral netting via `NettingAgreement` (reducing settlement operations from O(n) to O(1) per counterparty pair), and automated corporate action handling via `CorporateActionHandler` for dividends, coupons, and splits during active loans.

---

## 8. Governance and Tokenomics

### 8.1 The DUAL Token

Canton-native governance token (CIP-56) with 1 billion fixed supply:

| Allocation | % | Vesting |
|---|---|---|
| Protocol Development | 25% | 4-year linear, 12-month cliff |
| Community Rewards | 25% | Per-epoch, usage-based |
| Ecosystem Growth | 20% | 3-year linear, 6-month cliff |
| Treasury | 15% | DAO-controlled |
| Investors | 10% | 2-year linear, 6-month cliff |
| Advisors | 5% | 2-year linear, 12-month cliff |

Each token confers one governance vote, with delegation via `VoteDelegation` template.

### 8.2 Governance Process

Proposals require 100,000 DUAL (0.01%) to create. **Lifecycle:** Draft → Active (5-day voting) → Succeeded/Failed (10% quorum, simple majority) → Queued (48h timelock) → Executed. Emergency proposals: 24h voting + 6h timelock. Governance controls all protocol parameters: rate models, collateral parameters, reserve factors, asset onboarding, and fee structures.

### 8.3 Economic Model

| Action | Fee | Revenue Destination |
|---|---|---|
| Borrow Interest | 5-20% reserve factor | Treasury |
| Flash Loan | 0.09% of principal | Treasury |
| Liquidation | 3-10% penalty | 90% Liquidator / 10% Treasury |
| Securities Lending | 10% of fee | Treasury |
| Credit Oracle Query | $5-$50/query | Treasury |
| Supply / Withdraw | Free | -- |

Revenue projections: Year 1 ($10M TVL, $410K revenue), Year 2 ($100M TVL, $4.1M revenue, 35% margin), Year 3 ($500M TVL, $20.5M revenue, 84% margin). Break-even at ~$50M TVL (months 14-16).

Value accrual: governance rights, staking rewards from protocol revenue, fee discounts for staked DUAL, and planned buyback-and-distribute mechanism from Year 2.

---

## 9. Privacy and Dual-Track Architecture

### 9.1 Canton Sub-Transaction Privacy

Canton's privacy model provides four guarantees:

- **Need-to-Know Visibility**: Only transaction signatories and designated observers see data
- **Encrypted Commitments**: Validators verify transaction validity without accessing plaintext
- **GDPR Compatibility**: Data exists only on participant nodes, not globally replicated
- **MEV Immunity**: No public mempool, no fee-based sequencing -- front-running and sandwich attacks are architecturally impossible

### 9.2 Three Privacy Levels

| Level | Visible To | Use Case |
|---|---|---|
| Standard | Counterparty only | Default for all operations |
| Enhanced | Counterparty + auditor | Internal compliance |
| Full Disclosure | Counterparty + auditor + regulator | Regulated securities |

These levels are composable: a single user may operate with different privacy levels for different transaction types simultaneously.

### 9.3 Dual-Track Design

**Institutional Track.** KYB-verified entities (banks, asset managers, hedge funds) receive dedicated pools (`InstitutionalPool`), full API integration (262 endpoints), elevated limits, and credit tier acceleration via off-chain credential attestation.

**Retail Track.** Permissionless wallet-based access via PartyLayer SDK. Self-custody, shared pool access, frontend-optimized experience. New users begin at Bronze tier and progress through on-chain behavioral history.

**Shared Liquidity.** Both tracks draw from unified pools -- institutional deposits increase retail borrowing liquidity and vice versa, creating deeper markets, better rates, and network effects.

---

## 10. Oracle and Price Feed System

The `OracleAggregator` collects data from four independent sources (Chainlink Data Streams, Proof of Reserve, NAVLink/DTCC feeds, TIFA Oracle). The aggregated price is the **median** with outlier detection:

$$P_{\text{agg}} = \text{Median}(S_1, S_2, S_3, S_4) \quad \text{excluding } |S_i - \text{Median}| > 2\sigma$$

**Staleness Detection.** Maximum oracle staleness: 300 seconds. Affected pool operations pause until fresh price is received.

**Circuit Breakers.** Price movement exceeding 20% within 5 minutes pauses all lending, borrowing, and liquidation for the affected asset until manual review confirms the movement is genuine.

---

## 11. Security Considerations

### 11.1 Smart Contract Security

DAML provides foundational advantages: purely functional language eliminating reentrancy attacks, built-in integer overflow protection via `Decimal` types, cryptographic signatory/observer authorization, and strong type system with compile-time correctness assurance. The 38 DAML templates are validated through 8 dedicated test suites.

### 11.2 Infrastructure Security

Role-based access control with JWT + 2FA, Redis-backed rate limiting, Zod schema input validation, parameterized queries via Drizzle ORM (eliminating SQL injection), TLS 1.3 with Helmet.js security headers.

### 11.3 Economic Security

Multi-source median oracle aggregation requires compromising 3+ sources. Canton's lack of public mempool eliminates flash-loan-based governance attacks. The four-tier liquidation cascade prevents cascading sell spirals.

### 11.4 Audit Plan

Internal security hardening (completed) → External smart contract audit (pre-mainnet) → Economic stress simulation → Bug bounty program (post-mainnet).

---

## 12. Canton Network and Ecosystem

### 12.1 Why Canton

Five requirements no other platform satisfies simultaneously: sub-transaction privacy, institutional credibility (DTCC, Euroclear, LSEG), atomic multi-party transactions, DAML's formal guarantees, and regulatory compliance by design.

### 12.2 Ecosystem Position

| Layer | Participants | Relationship |
|---|---|---|
| Settlement | LSEG, Euroclear, Tradeweb | Working Group co-members |
| Custody | Fireblocks, BitGo, Copper.co | Wallet integration |
| Asset Issuers | DTCC, BlackRock, Franklin Templeton | Collateral sources |
| Wallet Providers | Console, Loop, Helvault, Lace, Begin | PartyLayer SDK |

### 12.3 Cayvox Labs Product Stack

| Product | Function | Status |
|---|---|---|
| PartyLayer (Wallet SDK) | Wallet-agnostic Canton connectivity | Production |
| Dualis Finance | Institutional lending protocol | Devnet live |
| TIFA Finance | Receivables tokenization | Devnet live |

PartyLayer provides wallet abstraction; TIFA Finance creates tokenized receivables serving as TIFA-REC collateral in Dualis -- a vertically integrated ecosystem.

---

## 13. Roadmap and Conclusion

### 13.1 Development Roadmap

| Phase | Timeline | Status | Key Milestones |
|---|---|---|---|
| Foundation | Q4 2025 | Complete | Architecture, DAML spec, devnet setup |
| Development | Q4 2025-Q1 2026 | Complete | 101K+ LOC, 38 DAML templates, 262 endpoints |
| Audit | Q1-Q2 2026 | Active | External audit, stress testing, mainnet prep |
| Mainnet Launch | Q2-Q3 2026 | Planned | Canton mainnet, initial pools, institutional onboarding |
| Growth | H2 2026 | Planned | Securities lending, Credit Oracle API |
| Scale | 2027+ | Planned | Multi-domain deployment, cross-chain bridging |

### 13.2 Conclusion

When DTCC tokenizes the first US Treasury on Canton, that token will need a lending market. When Euroclear enables cross-border settlement of tokenized European government bonds, those securities will need borrowing infrastructure that institutional counterparties can trust with their balance sheet data.

Dualis Finance is building that market -- combining a five-tier hybrid credit system, four-tier liquidation cascade, Canton sub-transaction privacy, on-chain securities lending, and dual-track architecture. The infrastructure for a $16 trillion tokenized asset economy is being built now. The institutions building it have chosen Canton. Dualis Finance transforms that settlement layer into a capital-efficient lending market.

---

## References

[1] ISLA, "Securities Lending Market Report," 2024.
[2] BCG and Standard Chartered, "On-Chain Asset Tokenization in Financial Markets," 2024.
[3] DTCC, "Annual Report," 2024.
[4] E. Frangella, L. Herskind, "Aave V3 Technical Paper," 2022.
[5] R. Leshner, G. Hayes, "Compound: The Money Market Protocol," 2019.
[6] Digital Asset, "Canton Network Technical Documentation," 2025.
[7] Digital Asset, "DAML Language Reference," v3.4, 2025.
[8] S. Kulechov, "Abundance Assets: The Future of Tokenized Finance," 2026.
[9] DeFiLlama, "Aave V3 TVL," accessed February 2026.
[10] BlackRock, "BUIDL Fund Documentation," 2025.
[11] M. Gontier Delaunay, P. Frambot, "Morpho Blue Whitepaper," 2023.
[12] Maple Finance, "Orthogonal Trading Default Post-Mortem," 2022.
[13] Canton Network Foundation, "Working Group Results," 2026.
[14] Aave Protocol, "Aave Horizon: Institutional DeFi," 2025.

---

## Appendix A: DAML Smart Contract Templates

| # | Template | Module | Purpose |
|---|----------|--------|---------|
| 1 | LendingPool | Lending.Pool | Pool state: supply, borrows, reserves, indices |
| 2 | SupplyPosition | Lending.Pool | Supplier position with entry index |
| 3 | BorrowPosition | Lending.Borrow | Borrower debt with entry index |
| 4 | CollateralVault | Lending.Collateral | Locked collateral with tier classification |
| 5 | PriceOracle | Oracle.PriceFeed | Authoritative price state per asset |
| 6 | PriceFeed | Oracle.PriceFeed | Individual price source submission |
| 7 | OracleAggregator | Trigger.OracleAggregator | Multi-source median + outlier filtering |
| 8 | StalenessChecker | Trigger.StalenessChecker | 300s freshness monitoring |
| 9 | LiquidationTrigger | Liquidation.Engine | Initiate liquidation for eligible positions |
| 10 | LiquidationScanner | Trigger.LiquidationScanner | Periodic position scanning |
| 11 | LiquidationResult | Liquidation.Engine | Immutable liquidation record |
| 12 | InterestAccrualTrigger | Trigger.InterestAccrual | Periodic index updates |
| 13 | FlashLiquidation | Liquidation.Engine | Flash-loan-funded liquidation |
| 14 | BatchLiquidation | Liquidation.Engine | Multi-liquidation batch processing |
| 15 | Proposal | Governance.Proposal | Governance proposal + voting state |
| 16 | VoteRecord | Governance.Vote | Individual vote record |
| 17 | VoteDelegation | Governance.Delegation | Voting power delegation |
| 18 | GovernanceConfig | Governance.Config | Quorum, periods, thresholds |
| 19 | TimelockExecution | Governance.Timelock | Execution delay enforcement |
| 20 | ProtocolConfig | Core.Config | Global protocol configuration |
| 21 | DUALToken | Governance.Token | Token with transfer + delegation |
| 22 | DualTokenBalance | Token.DUAL | Per-party balance + staking metadata |
| 23 | DualMintFactory | Token.DUAL | Authorized minting |
| 24 | TokenVesting | Token.DUAL | Vesting schedule enforcement |
| 25 | StakingPosition | Token.DUAL | Staking state + reward accumulator |
| 26 | CompositeCredit | Credit.CompositeScore | Combined credit score |
| 27 | CreditAttestationBundle | Credit.Attestation | ZK credential bundle |
| 28 | InstitutionalPool | Institutional.Core | Dedicated institutional pool |
| 29 | VerifiedInstitution | Institutional.Core | KYB-verified institution record |
| 30 | NettingAgreement | SecLending.Advanced | Multilateral netting |
| 31 | FractionalOffer | SecLending.Advanced | Securities lending offer |
| 32 | CorporateActionHandler | SecLending.Advanced | Dividend/coupon automation |
| 33 | ProductiveProject | Productive.Core | Project definition + cashflow |
| 34 | ProductiveBorrow | Productive.Core | Active productive loan |
| 35 | ProductiveLendingPool | Productive.Core | Project-based underwriting pool |
| 36 | PrivacyConfig | Privacy.Config | Per-party privacy levels |
| 37 | BulkOperation | Core.Config | Batch operation wrapper |
| 38 | BalanceSnapshot | Core.Config | Point-in-time balance snapshot |

---

*Copyright 2026 Cayvox Labs. All rights reserved.*
