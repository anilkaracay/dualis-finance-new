# Dualis Finance

Institutional lending protocol on Canton Network.

## Architecture

```
packages/
├── frontend/   — Next.js 14 App Router
├── api/        — Fastify backend
├── shared/     — Shared types & utilities
└── config/     — Shared tsconfig, eslint
```

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | TypeScript type checking |
