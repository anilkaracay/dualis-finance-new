# Dualis Finance — Innovation Architecture

## System Overview

The 5 strategic innovations extend Dualis Finance from a standard DeFi lending protocol
into a comprehensive institutional-grade platform bridging traditional and decentralized finance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      DUALIS FINANCE v2.0                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   FRONTEND   │     API      │    CANTON    │   DATABASE     │
│   (Next.js)  │  (Fastify)   │    (Daml)    │  (PostgreSQL)  │
├──────────────┼──────────────┼──────────────┼────────────────┤
│              │              │              │                 │
│ Composite    │ Credit       │ Composite    │ composite_      │
│ ScoreRing    │ Service      │ Credit       │ scores          │
│ Attestation  │ Attestation  │ Attestation  │ credit_         │
│ Cards        │ Service      │ Bundle       │ attestations    │
│              │              │              │                 │
│ Project      │ Productive   │ Productive   │ productive_     │
│ Cards        │ Service      │ Project      │ projects        │
│ Cashflow     │              │ Borrow       │ productive_     │
│ Timeline     │              │ Pool         │ borrows         │
│              │              │              │                 │
│ Fractional   │ SecLending   │ Fractional   │ fractional_     │
│ Offers       │ Service      │ Offer        │ offers          │
│ Netting      │              │ Netting      │ netting_        │
│ CorpActions  │              │ CorpAction   │ agreements      │
│              │              │              │                 │
│ Onboarding   │ Institution  │ Verified     │ verified_       │
│ Wizard       │ Service      │ Institution  │ institutions    │
│ API Keys     │              │ InstPool     │ inst_api_keys   │
│              │              │              │                 │
│ Privacy      │ Privacy      │ Privacy      │ privacy_        │
│ Toggle       │ Service      │ Config       │ configs         │
│ Disclosures  │              │              │ privacy_audit   │
│              │              │              │                 │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

## Innovation Details

### 1. Hybrid Credit Score (Composite Credit Score - CCS)

**Problem:** Traditional DeFi requires 150-200% over-collateralization.
**Solution:** 3-layer score combining on-chain behavior, off-chain financial data (via ZK-proofs), and ecosystem reputation.

| Layer | Max Score | Components |
|-------|-----------|------------|
| On-Chain | 400 | Loan completion, repayment speed, collateral health, protocol history, sec-lending |
| Off-Chain | 350 | Credit bureau (ZK), income verification (ZK), business verification, KYC |
| Ecosystem | 250 | TIFA performance, cross-protocol refs, governance & staking |

**Tier Benefits:**
| Tier | Score Range | Max LTV | Rate Discount | Min Collateral |
|------|------------|---------|---------------|----------------|
| Diamond | 850-1000 | 85% | -25% | 115% |
| Gold | 650-849 | 78% | -15% | 125% |
| Silver | 450-649 | 70% | -8% | 135% |
| Bronze | 250-449 | 60% | 0% | 150% |
| Unrated | 0-249 | 50% | 0% | 175% |

### 2. Productive Lending

**Problem:** DeFi capital circulates within DeFi, not financing real economic activity.
**Solution:** Dedicated pools for 10 project categories with hybrid collateral and revenue-based repayment.

**Project Categories:** Solar, Wind, Battery, Data Center, Supply Chain, Export Finance, Equipment, Real Estate, Agriculture, Telecom

**Hybrid Collateral:** 40% crypto + 40% project assets + 20% TIFA receivables

**Key Features:**
- IoT-verified production data feeds into repayment schedule
- ESG-adjusted interest rates reward high-impact projects
- Cash flow repayment from project revenue (not just liquidation)
- Category-specific metadata and risk models

### 3. Advanced Securities Lending

- **Fractional Offers:** Split large positions into smaller tranches with minimum accept amounts
- **Dynamic Fees:** Base + demand + duration + credit multipliers for fair pricing
- **Corporate Actions:** Automated dividend/coupon manufacturing for lent securities
- **Bilateral Netting:** Offset mutual obligations to reduce capital requirements

### 4. Institutional Track

- **KYB Verification:** Multi-level (Basic/Enhanced/Full) with expiry and renewal
- **Sub-Account Management:** Segregated trading accounts under a single institution
- **API Key Lifecycle:** Create, rotate, revoke with granular permissions (read, trade, admin)
- **Bulk Operations:** Batch deposit/withdraw/borrow with atomic execution and partial failure handling
- **Tiered Fee Schedules:** Lower fees for verified institutions based on KYB level

### 5. Privacy System

- **Public:** All data visible (default for retail users)
- **Selective:** Only disclosed parties can view specified data scopes
- **Maximum:** Explicit disclosure required for any access
- **Data Scopes:** CreditScore, PositionDetails, TransactionHistory, PortfolioValue
- **Audit Trail:** All access attempts logged for compliance and regulatory reporting

## Data Flow

```
User Action → Frontend Store → API Hook → Backend Service → Canton Client → Daml Ledger
                    ↑                            │
                    └── WebSocket ←── Event Bus ──┘
```

### Innovation-Specific Data Flows

**Credit Attestation Flow:**
```
User submits proof → API validates ZK-proof → Canton creates OffChainAttestation
  → Score engine recalculates CompositeCredit → Frontend updates ScoreRing
```

**Productive Lending Flow:**
```
Operator creates project → Lenders fund pool → Borrower requests loan
  → IoT reports production → Cash flow repayment → Loan settles
```

**Privacy Check Flow:**
```
Data requester → CheckAccess choice (non-consuming) → PrivacyConfig evaluates rules
  → Grant/Deny → Audit log entry created → Response returned
```

## Technology Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Zustand, lucide-react
- **Backend:** Fastify, PostgreSQL, Redis, BullMQ, Zod
- **Blockchain:** Canton Network, Daml smart contracts
- **Privacy:** ZK-proofs (Groth16), Canton sub-transaction privacy
- **Monitoring:** Prometheus, Grafana, Sentry, Pino logging
- **Infrastructure:** Docker, Turborepo, pnpm workspaces

## Cross-Innovation Dependencies

```
Privacy System ──────────────────────────────────────────────┐
    │                                                        │
    ├── Credit Attestation (ZK-proofs require privacy layer) │
    │       │                                                │
    │       └── Composite Score (attestations feed score)     │
    │               │                                        │
    │               ├── Productive Lending (score affects rates)
    │               │                                        │
    │               └── Securities Lending (score affects fees)
    │                       │                                │
    │                       └── Institutional (netting, bulk) │
    │                               │                        │
    └───────────────────────────────┴────────────────────────┘
```

All 5 innovations share the Privacy System as a foundational layer. The Composite Credit
Score acts as a central hub, influencing lending parameters across both productive lending
and securities lending. The Institutional Track builds on top of all other innovations to
provide enterprise-grade access to the full platform.
