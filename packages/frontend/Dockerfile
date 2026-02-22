FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
RUN corepack enable && pnpm install --frozen-lockfile
COPY packages/shared/ packages/shared/
COPY packages/config/ packages/config/
COPY packages/frontend/ packages/frontend/
RUN pnpm --filter @dualis/shared build
RUN pnpm --filter @dualis/frontend build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./.next/static
COPY --from=builder /app/packages/frontend/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
