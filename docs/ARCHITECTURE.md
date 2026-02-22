# Architecture

## System Overview

```
+-------------------+     +-------------------+     +--------------------+
|                   |     |                   |     |                    |
|  Next.js App      |---->|  Fastify API      |---->|  Canton Network    |
|  (Port 3000)      |     |  (Port 4000)      |     |  (JSON API v2)     |
|                   |<----|                   |<----|                    |
+-------------------+     +---------+---------+     +--------------------+
        |                           |
        | WebSocket                 |
        |<------------------------->|
        |                           |
                            +-------+-------+
                            |               |
                      +-----+------+  +-----+------+
                      | PostgreSQL |  |   Redis    |
                      |  (5432)    |  |   (6379)   |
                      +------------+  +------------+
```

## Design Decisions

### 1. Canton Network Integration
- **Mock Mode**: `CANTON_MOCK=true` allows running without Canton
- **JSON API v2**: RESTful interface to Daml ledger
- **Circuit Breaker**: opossum-based circuit breaker prevents cascade failures
- **Retry Logic**: p-retry with exponential backoff for transient failures

### 2. Data Architecture
- **PostgreSQL**: Analytics, history, audit trails (10 tables via Drizzle ORM)
- **Redis**: Hot cache with domain-specific TTLs (pools=30s, prices=10s)
- **Canton Ledger**: Source of truth for all financial state

### 3. Frontend State Management
- **Zustand Stores**: Lightweight state with mock data fallback
- **API Hooks**: Generic useQuery/useMutation pattern with error handling
- **WebSocket**: Real-time price and position updates
- **Demo Mode**: Frontend works fully offline with mock data

### 4. Security
- **JWT Authentication**: Short-lived tokens with party ID claims
- **API Key Support**: SHA-256 hashed keys for institutional access
- **Rate Limiting**: Per-IP rate limiting via @fastify/rate-limit
- **Input Validation**: Zod schemas on all request bodies/params
- **CORS**: Configurable origin restriction
- **Helmet**: Security headers via @fastify/helmet

### 5. Caching Strategy
| Data Type | TTL | Invalidation |
|-----------|-----|-------------|
| Pool list | 30s | On deposit/withdraw |
| Pool detail | 60s | On state change |
| Prices | 10s | WebSocket push |
| Credit scores | 300s | On recalculation |
| Analytics | 120s | Background job |

### 6. Background Jobs
| Job | Interval | Purpose |
|-----|----------|---------|
| Oracle Update | 30s | Fetch latest prices |
| Health Check | 30s | Monitor position health factors |
| Interest Accrual | 5min | Update interest calculations |
| Credit Recalc | Daily | Recalculate credit scores |
| Analytics | 15min | Aggregate protocol metrics |
| Cleanup | Daily | Prune old data |

## Data Flow

### Deposit Flow
1. User clicks "Deposit" -- Frontend sends POST /v1/pools/:id/deposit
2. API validates request (auth + Zod schema)
3. Service builds Canton command -- Canton JSON API creates contract
4. Response returned -- Cache invalidated -- WebSocket broadcasts update
5. Frontend updates store -- UI reflects new position

### Price Update Flow
1. Oracle Update job fetches prices from external feeds
2. Prices written to Redis cache
3. WebSocket server broadcasts to `prices:*` channel subscribers
4. Frontend `usePriceStore` updates in real-time
5. Health Factor job re-evaluates positions against new prices
