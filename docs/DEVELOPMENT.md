# Development Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (for full stack)
- Git

## Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd dualis-finance
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env if needed
```

4. Start development:
```bash
# Frontend only (with mock data):
pnpm --filter @dualis/frontend dev

# Full stack with Docker:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Running Tests

```bash
# All packages
pnpm test

# Specific package
pnpm --filter @dualis/shared test
pnpm --filter @dualis/frontend test
pnpm --filter @dualis/api test
```

## Code Conventions

- **TypeScript Strict Mode**: exactOptionalPropertyTypes, noUncheckedIndexedAccess
- **Zero `any` types**: Use proper types from @dualis/shared
- **Optional props**: Use `prop?: T | undefined` pattern
- **Imports**: Use `@/` path alias in frontend, `.js` extensions in API
- **Components**: Named exports, forwardRef for interactive elements
- **Stores**: Zustand with mock data fallback
- **API Routes**: Fastify plugin pattern with Zod validation

## Adding a New Feature

### New API Route
1. Add types to `packages/shared/src/api/requests.ts` and `responses.ts`
2. Create route in `packages/api/src/routes/`
3. Create service in `packages/api/src/services/`
4. Register route in `packages/api/src/index.ts`
5. Add tests

### New Frontend Page
1. Create page in `packages/frontend/src/app/(dashboard)/`
2. Add API hooks in `packages/frontend/src/hooks/api/`
3. Add navigation entry to Sidebar and MobileNav
4. Add tests

## Database

```bash
# Generate migration from schema changes
pnpm --filter @dualis/api db:generate

# Run migrations
pnpm --filter @dualis/api db:migrate

# Seed development data
pnpm --filter @dualis/api db:seed
```
