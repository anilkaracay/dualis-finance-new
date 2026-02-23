# Canton Network Deployment — Dualis Finance

## Overview

Canton participant node runs on the **devnet** — it is NOT deployed by us. We connect to it via JSON API and gRPC.

## Architecture

```
┌─────────────┐    JSON API / gRPC     ┌──────────────────────┐
│  Dualis API  │ ──────────────────────→ │  Canton Participant  │
│  (Railway)   │                         │  Node (Devnet)       │
└─────────────┘                         └──────────────────────┘
```

## Connection Setup

### 1. Obtain Devnet Access
- Contact Canton Network devnet team
- Get participant node URL and JWT token
- Get party identifiers for Operator, Oracle, CreditAssessor, Treasury

### 2. Configure Environment
Copy the template and fill in your values:
```bash
cp deploy/canton/devnet.env.example deploy/canton/devnet.env
# Edit devnet.env with your values
```

### 3. Set Railway Variables
In Railway Dashboard → API Service → Variables:
- `CANTON_JSON_API_URL` — devnet participant JSON API URL
- `CANTON_GRPC_URL` — devnet participant gRPC URL
- `CANTON_JWT_TOKEN` — authentication token
- `CANTON_MOCK=false` — disable mock mode
- `CANTON_ENV=devnet`
- `CANTON_OPERATOR_PARTY` — your operator party ID
- `CANTON_ORACLE_PARTY` — your oracle party ID

### 4. Verify Connection
After deploying to Railway:
```bash
curl https://api.dualis.finance/health/ready
# Should show canton: { status: "up", latency: <ms> }
```

## DAML Package Upload

DAML packages (`.dar` files) must be uploaded to the participant node:

```bash
cd packages/canton/daml
daml build                    # Produces .daml/dist/dualis-finance-2.0.0.dar
daml ledger upload-dar \
  --host <devnet-grpc-host> \
  --port <devnet-grpc-port> \
  .daml/dist/dualis-finance-2.0.0.dar
```

## Mock Mode

For development without a Canton node:
```
CANTON_MOCK=true    # API runs with mock Canton responses
CANTON_ENV=sandbox  # No real blockchain operations
```

The API will start successfully and log:
```
Canton integration initialized { env: 'sandbox', healthy: false, bridge: 'mock' }
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Canton bootstrap failed — running in degraded mode` | Check CANTON_JSON_API_URL and JWT_TOKEN |
| `health/ready` shows canton: `down` | Devnet node may be offline — this is non-critical |
| gRPC connection refused | Check firewall rules, TLS cert path |
| Party not found | Verify party identifiers with devnet operator |
