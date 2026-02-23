# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
RUN corepack enable && pnpm install --frozen-lockfile
COPY packages/shared/ packages/shared/
COPY packages/config/ packages/config/
COPY packages/api/ packages/api/
RUN pnpm --filter @dualis/shared build
RUN pnpm --filter @dualis/api build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S dualis && \
    adduser -S dualis -u 1001 -G dualis

ENV NODE_ENV=production
COPY --from=builder --chown=dualis:dualis /app/packages/api/dist ./dist
COPY --from=builder --chown=dualis:dualis /app/packages/api/package.json ./
COPY --from=builder --chown=dualis:dualis /app/node_modules ./node_modules

USER dualis
EXPOSE 3001
CMD ["node", "dist/index.js"]
