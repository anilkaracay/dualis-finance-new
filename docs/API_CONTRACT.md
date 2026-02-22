# DUALIS FINANCE — API Contract

**Base URL:** `https://api.dualis.finance/v1`
**Auth (Retail):** `Authorization: Bearer <PartyLayer JWT>`
**Auth (Institutional):** `X-API-Key: <key>` + mTLS client certificate
**Content-Type:** `application/json`

**Standard Response Envelope:**
```
Success: { "data": <payload>, "pagination"?: <obj>, "transaction"?: <obj> }
Error:   { "error": { "code": string, "message": string, "details"?: any, "requestId": string, "timestamp": string } }
```

---

## Health

### `GET /health`
No auth. Returns server health.
```
Response 200:
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 123456,
  "canton": "connected",
  "database": "connected",
  "redis": "connected"
}
```

### `GET /ready`
No auth. Kubernetes readiness probe.
```
Response 200: { "ready": true }
Response 503: { "ready": false, "reason": "canton_disconnected" }
```

### `GET /live`
No auth. Kubernetes liveness probe.
```
Response 200: { "live": true }
```

---

## Lending Pools

### `GET /pools`
Public. List all lending pools with computed metrics.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| assetType | `stablecoin\|crypto\|treasury\|rwa\|all` | `all` | Filter by asset type |
| sortBy | `tvl\|supplyApy\|borrowApy\|utilization` | `tvl` | Sort field |
| sortOrder | `asc\|desc` | `desc` | Sort direction |
| limit | `number (1-100)` | `20` | Page size |
| offset | `number (≥0)` | `0` | Page offset |

```
Response 200:
{
  "data": [
    {
      "poolId": "usdc-main",
      "asset": {
        "symbol": "USDC",
        "type": "Stablecoin",
        "priceUSD": 1.0000
      },
      "totalSupply": 245600000.00,
      "totalSupplyUSD": 245600000.00,
      "totalBorrow": 189200000.00,
      "totalBorrowUSD": 189200000.00,
      "totalReserves": 2456000.00,
      "utilization": 0.7703,
      "supplyAPY": 0.0824,
      "borrowAPY": 0.1056,
      "isActive": true,
      "contractId": "00a1b2c3..."
    }
  ],
  "pagination": {
    "total": 6,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### `GET /pools/:poolId`
Public. Detailed pool info including parameters and recent activity.

```
Response 200:
{
  "data": {
    "poolId": "usdc-main",
    "asset": { "symbol": "USDC", "type": "Stablecoin", "priceUSD": 1.0000 },
    "totalSupply": 245600000.00,
    "totalSupplyUSD": 245600000.00,
    "totalBorrow": 189200000.00,
    "totalBorrowUSD": 189200000.00,
    "totalReserves": 2456000.00,
    "available": 56400000.00,
    "utilization": 0.7703,
    "supplyAPY": 0.0824,
    "borrowAPY": 0.1056,
    "isActive": true,
    "interestRateModel": {
      "type": "VariableRate",
      "baseRate": 0.02,
      "multiplier": 0.07,
      "kink": 0.80,
      "jumpMultiplier": 0.30
    },
    "collateralConfig": {
      "loanToValue": 0.75,
      "liquidationThreshold": 0.82,
      "liquidationPenalty": 0.05,
      "borrowCap": 100000000.00
    },
    "accumulatedBorrowIndex": 1.045678,
    "accumulatedSupplyIndex": 1.032456,
    "lastAccrualTimestamp": "2026-02-22T12:00:00Z",
    "contractId": "00a1b2c3..."
  }
}
```

### `GET /pools/:poolId/history`
Public. Historical pool data for charts.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | `7d\|30d\|90d\|1y\|all` | `30d` | Time range |

```
Response 200:
{
  "data": [
    {
      "timestamp": "2026-02-22T00:00:00Z",
      "totalSupply": 245600000.00,
      "totalBorrow": 189200000.00,
      "supplyAPY": 0.0824,
      "borrowAPY": 0.1056,
      "utilization": 0.7703,
      "priceUSD": 1.0000
    }
  ]
}
```

### `POST /pools/:poolId/deposit` 🔒
Authenticated. Deposit assets into a lending pool.

```
Request Body:
{
  "amount": "500000.00"
}

Response 201:
{
  "data": {
    "poolContractId": "00a1b2c3...",
    "positionContractId": "00d4e5f6..."
  },
  "transaction": {
    "id": "tx_abc123def456",
    "status": "submitted",
    "timestamp": "2026-02-22T12:01:00Z"
  }
}
```

### `POST /pools/:poolId/withdraw` 🔒
Authenticated. Withdraw assets from a lending pool.

```
Request Body:
{
  "shares": "485000.00"
}

Response 200:
{
  "data": {
    "withdrawnAmount": "500234.56",
    "remainingShares": 0.00
  },
  "transaction": {
    "id": "tx_abc123def456",
    "status": "submitted",
    "timestamp": "2026-02-22T12:02:00Z"
  }
}
```

---

## Borrowing

### `POST /borrow/request` 🔒
Authenticated. Request a new loan.

```
Request Body:
{
  "lendingPoolId": "usdc-main",
  "borrowAmount": "200000.00",
  "collateralAssets": [
    { "symbol": "wBTC", "amount": "3.5" },
    { "symbol": "CC", "amount": "50000" }
  ]
}

Response 201:
{
  "data": {
    "borrowPositionId": "borrow-001",
    "collateralPositionId": "collat-001",
    "borrowedAmount": "200000.00",
    "healthFactor": {
      "value": 1.67,
      "collateralValueUSD": 456000.00,
      "borrowValueUSD": 200000.00,
      "weightedLTV": 0.4386
    },
    "creditTier": "gold",
    "borrowAPY": 0.1031
  },
  "transaction": {
    "id": "tx_borrow_001",
    "status": "submitted",
    "timestamp": "2026-02-22T12:05:00Z"
  }
}
```

### `GET /borrow/positions` 🔒
Authenticated. List user's borrow positions.

```
Response 200:
{
  "data": [
    {
      "positionId": "borrow-001",
      "lendingPoolId": "usdc-main",
      "borrowedAsset": { "symbol": "USDC", "type": "Stablecoin" },
      "borrowedAmountPrincipal": 200000.00,
      "currentDebt": 201234.56,
      "interestAccrued": 1234.56,
      "healthFactor": {
        "value": 1.67,
        "collateralValueUSD": 456000.00,
        "borrowValueUSD": 201234.56,
        "weightedLTV": 0.4413
      },
      "creditTier": "gold",
      "isLiquidatable": false,
      "collateral": [
        { "symbol": "wBTC", "amount": "3.5", "valueUSD": 341000.00 },
        { "symbol": "CC", "amount": "50000", "valueUSD": 115000.00 }
      ],
      "borrowTimestamp": "2026-02-15T10:00:00Z",
      "contractId": "00borrow01..."
    }
  ]
}
```

### `POST /borrow/positions/:positionId/repay` 🔒
Authenticated. Repay a loan (partial or full).

```
Request Body:
{
  "amount": "100000.00"
}

Response 200:
{
  "data": {
    "remainingDebt": 101234.56,
    "newHealthFactor": 2.34
  },
  "transaction": { "id": "tx_repay_001", "status": "submitted", "timestamp": "..." }
}
```

### `POST /borrow/positions/:positionId/add-collateral` 🔒
Authenticated. Add collateral to an existing position.

```
Request Body:
{
  "asset": { "symbol": "CC", "amount": "10000" }
}

Response 200:
{
  "data": {
    "newCollateralValueUSD": 478000.00,
    "newHealthFactor": 1.95
  },
  "transaction": { "id": "tx_collat_001", "status": "submitted", "timestamp": "..." }
}
```

---

## Securities Lending

### `GET /sec-lending/offers`
Public. Browse available sec lending offers.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| assetType | `equity\|bond\|treasury\|all` | `all` | Filter |
| minFee | `number` | - | Min fee in bps |
| maxFee | `number` | - | Max fee in bps |
| minDuration | `number` | - | Min duration in days |
| sortBy | `fee\|value\|duration\|created` | `created` | Sort |
| limit | `number (1-50)` | `20` | Page size |
| offset | `number` | `0` | Offset |

```
Response 200:
{
  "data": [
    {
      "offerId": "offer-001",
      "lender": "party::abc123...",
      "lenderCreditTier": "diamond",
      "security": { "symbol": "SPY-2026", "amount": 1200000.00, "type": "TokenizedEquity" },
      "feeStructure": { "type": "FixedFee", "value": 45 },
      "collateralSchedule": {
        "acceptedCollateralTypes": ["Stablecoin", "TokenizedTreasury"],
        "initialMarginPercent": 1.05,
        "variationMarginPercent": 1.02,
        "marginCallThreshold": 1.02,
        "marginCallDeadlineHours": 24
      },
      "minLendDuration": 30,
      "maxLendDuration": 365,
      "isRecallable": true,
      "recallNoticeDays": 3,
      "createdAt": "2026-02-20T14:00:00Z"
    }
  ],
  "pagination": { "total": 45, "limit": 20, "offset": 0, "hasMore": true }
}
```

### `POST /sec-lending/offers` 🔒
Authenticated. Create a new sec lending offer.

```
Request Body:
{
  "security": { "symbol": "SPY-2026", "amount": "1200000.00" },
  "feeType": "fixed",
  "feeValue": 45,
  "acceptedCollateralTypes": ["Stablecoin", "TokenizedTreasury"],
  "initialMarginPercent": 1.05,
  "minLendDuration": 30,
  "maxLendDuration": 365,
  "isRecallable": true,
  "recallNoticeDays": 3
}

Response 201:
{
  "data": {
    "offerId": "offer-002",
    "status": "offered"
  },
  "transaction": { "id": "tx_offer_001", "status": "submitted", "timestamp": "..." }
}
```

### `POST /sec-lending/offers/:offerId/accept` 🔒
Authenticated. Accept an offer as borrower.

```
Request Body:
{
  "collateral": [
    { "symbol": "USDC", "amount": "1300000.00" }
  ],
  "requestedDuration": 90
}

Response 201:
{
  "data": {
    "dealId": "offer-001-party::xyz789",
    "status": "active",
    "startDate": "2026-02-22T12:10:00Z",
    "expectedEndDate": "2026-05-23T12:10:00Z"
  },
  "transaction": { "id": "tx_accept_001", "status": "submitted", "timestamp": "..." }
}
```

### `GET /sec-lending/deals` 🔒
Authenticated. List user's active sec lending deals.

```
Response 200:
{
  "data": [
    {
      "dealId": "offer-001-party::xyz789",
      "role": "lender",
      "security": { "symbol": "SPY-2026", "amount": 1200000.00 },
      "borrower": "party::xyz789...",
      "status": "active",
      "feeAccrued": 1234.56,
      "collateralValueUSD": 1310000.00,
      "securityValueUSD": 1215000.00,
      "collateralRatio": 1.078,
      "startDate": "2026-02-10T10:00:00Z",
      "expectedEndDate": "2026-05-11T10:00:00Z",
      "daysSinceStart": 12,
      "corporateActions": []
    }
  ]
}
```

### `POST /sec-lending/deals/:dealId/recall` 🔒
Authenticated (lender only). Recall securities.

```
Response 200:
{
  "data": { "dealId": "...", "status": "recall_requested", "recallDate": "2026-02-22T12:15:00Z" },
  "transaction": { "id": "tx_recall_001", "status": "submitted", "timestamp": "..." }
}
```

### `POST /sec-lending/deals/:dealId/return` 🔒
Authenticated (borrower only). Return securities.

```
Response 200:
{
  "data": {
    "dealId": "...",
    "status": "settled",
    "totalFeePaid": 4567.89,
    "collateralReturned": true
  },
  "transaction": { "id": "tx_return_001", "status": "submitted", "timestamp": "..." }
}
```

---

## Credit Score

### `GET /credit/score` 🔒
Authenticated. Get own credit profile.

```
Response 200:
{
  "data": {
    "rawScore": 742.0,
    "creditTier": "gold",
    "breakdown": {
      "loanCompletion": { "score": 256, "max": 300, "loansCompleted": 14, "loansDefaulted": 1 },
      "repaymentTimeliness": { "score": 218, "max": 250, "onTime": 12, "late": 2 },
      "volumeHistory": { "score": 142, "max": 200, "totalVolumeRepaid": 2450000.00 },
      "collateralHealth": { "score": 150, "max": 150, "lowestHealthFactor": 1.52 },
      "securitiesLending": { "score": 20, "max": 100, "dealsCompleted": 2 }
    },
    "tierBenefits": {
      "minCollateralRatio": 1.20,
      "maxLTV": 0.83,
      "rateDiscount": -0.0025
    },
    "nextTier": {
      "tier": "diamond",
      "scoreRequired": 850,
      "pointsNeeded": 108
    },
    "lastUpdated": "2026-02-22T06:00:00Z"
  }
}
```

### `GET /credit/history` 🔒
Authenticated. Credit score history over time.

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| period | `3m\|6m\|1y\|all` | `6m` |

```
Response 200:
{
  "data": [
    { "timestamp": "2026-01-01T00:00:00Z", "score": 680, "tier": "silver", "event": "loan_completed" },
    { "timestamp": "2026-01-15T00:00:00Z", "score": 710, "tier": "gold", "event": "tier_upgrade" },
    { "timestamp": "2026-02-22T00:00:00Z", "score": 742, "tier": "gold", "event": "recalculation" }
  ]
}
```

---

## Oracle / Prices

### `GET /oracle/prices`
Public. All current price feeds.

```
Response 200:
{
  "data": [
    {
      "asset": "USDC",
      "quoteCurrency": "USD",
      "price": 1.0000,
      "confidence": 0.9999,
      "source": "Chainlink PoR",
      "timestamp": "2026-02-22T12:00:00Z",
      "change24h": 0.0001,
      "change24hPercent": 0.01
    },
    {
      "asset": "wBTC",
      "quoteCurrency": "USD",
      "price": 97234.56,
      "confidence": 0.998,
      "source": "Chainlink Data Streams",
      "timestamp": "2026-02-22T12:00:01Z",
      "change24h": 1234.56,
      "change24hPercent": 1.29
    }
  ]
}
```

### `GET /oracle/prices/:asset`
Public. Specific asset price with history.

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| history | `boolean` | `false` |
| period | `1h\|24h\|7d\|30d` | `24h` |

```
Response 200 (history=true):
{
  "data": {
    "current": { "asset": "wBTC", "price": 97234.56, "timestamp": "...", ... },
    "history": [
      { "timestamp": "2026-02-21T12:00:00Z", "price": 96000.00 },
      { "timestamp": "2026-02-22T00:00:00Z", "price": 96500.00 },
      { "timestamp": "2026-02-22T12:00:00Z", "price": 97234.56 }
    ]
  }
}
```

---

## Governance

### `GET /governance/proposals`
Public. List governance proposals.

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| status | `active\|passed\|rejected\|executed\|all` | `all` |
| limit | `number` | `20` |
| offset | `number` | `0` |

```
Response 200:
{
  "data": [
    {
      "proposalId": "DIP-001",
      "title": "Increase USDC pool borrow cap to $200M",
      "description": "Proposal to increase the USDC pool borrow cap from $100M to $200M...",
      "proposer": "party::abc123...",
      "category": "parameter_change",
      "status": "active",
      "forVotes": 15000000.00,
      "againstVotes": 3000000.00,
      "abstainVotes": 500000.00,
      "quorum": 10000000.00,
      "quorumReached": true,
      "startTime": "2026-02-20T00:00:00Z",
      "endTime": "2026-02-27T00:00:00Z",
      "timeRemaining": "4d 12h"
    }
  ],
  "pagination": { "total": 12, "limit": 20, "offset": 0, "hasMore": false }
}
```

### `POST /governance/proposals` 🔒
Authenticated. Create a new proposal (requires minimum DUAL staked).

```
Request Body:
{
  "title": "Add wETH as collateral asset",
  "description": "This proposal adds wrapped Ethereum (wETH) as a supported collateral...",
  "category": "asset_listing",
  "actions": [
    { "type": "updateCollateralConfig", "params": { "asset": "wETH", "loanToValue": 0.75 } }
  ]
}

Response 201:
{
  "data": { "proposalId": "DIP-013", "status": "active" },
  "transaction": { "id": "tx_proposal_001", "status": "submitted", "timestamp": "..." }
}
```

### `POST /governance/proposals/:proposalId/vote` 🔒
Authenticated. Cast a vote.

```
Request Body:
{
  "vote": "for",
  "weight": "50000.00"
}

Response 200:
{
  "data": { "recorded": true, "newForVotes": 15050000.00 },
  "transaction": { "id": "tx_vote_001", "status": "submitted", "timestamp": "..." }
}
```

---

## Flash Loans

### `POST /flash-loan/execute` 🔒
Authenticated. Execute a flash loan.

```
Request Body:
{
  "poolId": "usdc-main",
  "amount": "10000000.00",
  "callbackData": {
    "operations": [
      { "type": "swap", "fromAsset": "USDC", "toAsset": "wBTC", "amount": "5000000" },
      { "type": "deposit", "poolId": "wbtc-main", "amount": "51.5" }
    ]
  }
}

Response 200:
{
  "data": {
    "borrowed": 10000000.00,
    "fee": 9000.00,
    "returned": 10009000.00,
    "operations": [ { "type": "swap", "status": "success" }, { "type": "deposit", "status": "success" } ]
  },
  "transaction": { "id": "tx_flash_001", "status": "confirmed", "timestamp": "..." }
}

Error 422 (if repayment fails):
{
  "error": { "code": "FLASH_LOAN_REPAY_FAILED", "message": "Insufficient funds to repay flash loan + fee" }
}
```

---

## Staking

### `GET /staking/info`
Public. DUAL staking pool info.

```
Response 200:
{
  "data": {
    "totalStaked": 150000000.00,
    "stakingAPY": 0.1234,
    "safetyModuleSize": 50000000.00,
    "safetyModuleAPY": 0.1890,
    "rewardsDistributed24h": 45678.00,
    "totalStakers": 2345
  }
}
```

### `GET /staking/position` 🔒
Authenticated. User's staking position.

```
Response 200:
{
  "data": {
    "stakedAmount": 50000.00,
    "safetyModuleStake": 10000.00,
    "pendingRewards": 1234.56,
    "claimableRewards": 5678.90,
    "stakingSince": "2026-01-01T00:00:00Z",
    "cooldownEnd": null,
    "votingPower": 60000.00
  }
}
```

### `POST /staking/stake` 🔒
```
Request Body: { "amount": "10000.00", "safetyModule": false }
Response 201: { "data": { "newStakedAmount": 60000.00 }, "transaction": { ... } }
```

### `POST /staking/unstake` 🔒
```
Request Body: { "amount": "5000.00" }
Response 200: { "data": { "cooldownEnd": "2026-03-01T12:00:00Z" }, "transaction": { ... } }
```

### `POST /staking/claim` 🔒
```
Response 200: { "data": { "claimed": 5678.90, "remaining": 0.00 }, "transaction": { ... } }
```

---

## Protocol Analytics

### `GET /analytics/overview`
Public. Protocol-wide metrics.

```
Response 200:
{
  "data": {
    "tvl": 2450000000.00,
    "totalBorrowed": 1230000000.00,
    "totalFees24h": 345678.00,
    "totalFees7d": 2345678.00,
    "totalLiquidations24h": 56789.00,
    "uniqueUsers24h": 1234,
    "totalTransactions24h": 5678,
    "avgHealthFactor": 1.85,
    "secLendingVolume24h": 45000000.00,
    "activeSecLendingDeals": 89,
    "flashLoanVolume24h": 120000000.00,
    "protocolRevenue30d": 12345678.00
  }
}
```

### `GET /analytics/history`
Public. Historical protocol metrics for charts.

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| metric | `tvl\|borrowed\|fees\|users\|liquidations` | `tvl` |
| period | `7d\|30d\|90d\|1y` | `30d` |

```
Response 200:
{
  "data": [
    { "timestamp": "2026-02-01T00:00:00Z", "value": 2100000000.00 },
    { "timestamp": "2026-02-22T00:00:00Z", "value": 2450000000.00 }
  ]
}
```

---

## Admin (Protocol Operator Only)

### `POST /admin/pause` 🔒🔑
Operator only. Emergency pause.

```
Response 200: { "data": { "paused": true, "timestamp": "..." }, "transaction": { ... } }
```

### `POST /admin/resume` 🔒🔑
Operator only. Resume after pause.

```
Response 200: { "data": { "paused": false, "timestamp": "..." }, "transaction": { ... } }
```

### `PUT /admin/config` 🔒🔑
Operator only. Update protocol configuration.

```
Request Body:
{
  "collateralConfigs": [...],
  "protocolFeeRate": 0.001,
  "flashLoanFeeRate": 0.0009,
  "minCollateralRatio": 1.10
}

Response 200: { "data": { "updated": true, "newConfigContractId": "..." }, "transaction": { ... } }
```

---

## WebSocket Channels

**URL:** `wss://stream.dualis.finance/v1/ws`

### Connection Flow:
```
1. Connect to WSS URL
2. Send auth: { "type": "auth", "token": "<JWT>" }
3. Receive: { "type": "auth:success", "partyId": "..." }
4. Subscribe: { "type": "subscribe", "channel": "prices:wBTC" }
5. Receive: { "type": "subscribed", "channel": "prices:wBTC" }
6. Receive updates: { "type": "data", "channel": "prices:wBTC", "payload": { ... } }
7. Keepalive: send { "type": "ping" }, receive { "type": "pong", "ts": ... }
```

### Channel Definitions:

| Channel | Auth | Description | Payload Example |
|---------|------|-------------|-----------------|
| `prices:{asset}` | Public | Real-time price | `{ "asset": "wBTC", "price": 97234.56, "change": 0.5, "ts": "..." }` |
| `pool:{poolId}` | Public | Pool state changes | `{ "poolId": "usdc-main", "totalSupply": ..., "utilization": ..., "ts": "..." }` |
| `position:{positionId}` | Private (owner) | Health factor updates | `{ "positionId": "borrow-001", "healthFactor": 1.67, "ts": "..." }` |
| `liquidations` | Public | Global liquidation events | `{ "borrower": "...", "poolId": "...", "amount": ..., "tier": "soft", "ts": "..." }` |
| `sec-lending:offers` | Public | New offers | `{ "offerId": "...", "security": "SPY-2026", "fee": 45, "ts": "..." }` |
| `sec-lending:deal:{dealId}` | Private (parties) | Deal updates | `{ "dealId": "...", "status": "...", "feeAccrued": ..., "ts": "..." }` |
| `governance:votes` | Public | Live vote tallies | `{ "proposalId": "DIP-001", "forVotes": ..., "againstVotes": ..., "ts": "..." }` |
| `notifications:{partyId}` | Private (owner) | Personal alerts | `{ "type": "health_warning", "positionId": "...", "hf": 1.15, "ts": "..." }` |

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing/invalid/expired auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request body/params validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `POOL_NOT_FOUND` | 404 | Lending pool not found |
| `POSITION_NOT_FOUND` | 404 | Position not found |
| `INSUFFICIENT_BALANCE` | 422 | Not enough balance for operation |
| `INSUFFICIENT_COLLATERAL` | 422 | Collateral below required threshold |
| `HEALTH_FACTOR_TOO_LOW` | 422 | Operation would make HF < min |
| `POOL_INACTIVE` | 422 | Pool is paused or inactive |
| `PROTOCOL_PAUSED` | 503 | Protocol is in emergency pause |
| `BORROW_CAP_REACHED` | 422 | Pool borrow cap exceeded |
| `FLASH_LOAN_REPAY_FAILED` | 422 | Flash loan repayment insufficient |
| `CREDIT_CHECK_FAILED` | 422 | Credit tier doesn't allow operation |
| `OFFER_EXPIRED` | 422 | Sec lending offer no longer available |
| `DEAL_NOT_ACTIVE` | 422 | Sec lending deal not in active state |
| `RECALL_NOT_ALLOWED` | 422 | Offer is non-recallable |
| `ORACLE_STALE` | 503 | Price feed too old (>5 minutes) |
| `CANTON_ERROR` | 502 | Canton Ledger API error |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
