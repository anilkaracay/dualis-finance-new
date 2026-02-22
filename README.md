# Dualis Finance

> Institutional lending protocol on Canton Network -- privacy-preserving lending,
> securities lending, and RWA collateralization.

## Architecture

```
[Browser] -> [Next.js Frontend] -> [Fastify API] -> [Canton Network]
                                       |                 |
                                   [PostgreSQL]    [Daml Smart Contracts]
                                   [Redis Cache]
                                   [BullMQ Jobs]
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Zustand |
| Backend | Fastify, Drizzle ORM, PostgreSQL, Redis |
| Blockchain | Canton Network, Daml smart contracts |
| Shared | TypeScript types, utilities, constants |
| Monitoring | Prometheus, Grafana |
| CI/CD | GitHub Actions |

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 9+

# Install dependencies
pnpm install

# Start development (frontend + backend)
pnpm dev

# Or with Docker (includes PostgreSQL + Redis + Monitoring):
docker compose up
```

## Project Structure

```
dualis-finance/
├── packages/
│   ├── frontend/          # Next.js 14 dashboard + landing page
│   ├── api/               # Fastify REST API + WebSocket server
│   ├── shared/            # TypeScript types, utils, constants
│   └── config/            # Shared TSConfig, ESLint configs
├── deploy/
│   └── monitoring/        # Prometheus, Grafana, Alertmanager
├── docs/                  # Architecture docs, API contract
├── docker-compose.yml     # Full stack deployment
└── .github/workflows/     # CI/CD pipeline
```

## Development

```bash
# Type checking
pnpm typecheck

# Run tests
pnpm test

# Build all packages
pnpm build

# Docker commands
pnpm docker:up          # Start full stack
pnpm docker:dev         # Start with hot reload
pnpm docker:down        # Stop all services
pnpm docker:logs        # View logs
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | API server port |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/v1` | Frontend API URL |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `CANTON_MOCK` | `true` | Use mock Canton data |
| `JWT_SECRET` | `dev-...` | JWT signing secret |

See `.env.example` for the complete list.

## Key Features

- **Lending Pools**: Supply/borrow with dynamic interest rates (jump rate model)
- **Credit Scoring**: On-chain reputation with 5-tier system (Diamond to Unrated)
- **Securities Lending**: Institutional sec lending with customizable terms
- **Governance**: On-chain proposals with DUAL token voting
- **Flash Loans**: Single-transaction uncollateralized loans
- **Real-time**: WebSocket price feeds, position updates, notifications
- **Privacy**: Canton Network ensures transaction privacy between parties

## Monitoring

Access monitoring dashboards when running with Docker:
- **Grafana**: http://localhost:3002 (admin/admin)
- **Prometheus**: http://localhost:9090

## License

Private -- All rights reserved.
