# Stage 1: Install + Build
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

# Stage 2: Runtime — preserve pnpm workspace structure
FROM node:20-alpine
WORKDIR /app

RUN addgroup -g 1001 -S dualis && \
    adduser -S dualis -u 1001 -G dualis && \
    apk add --no-cache curl

ENV NODE_ENV=production

# Copy workspace structure (pnpm symlinks need this)
COPY --from=builder --chown=dualis:dualis /app/package.json ./
COPY --from=builder --chown=dualis:dualis /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=dualis:dualis /app/node_modules ./node_modules

# Shared: full package (src + dist — pnpm resolves via main: ./src/index.ts)
COPY --from=builder --chown=dualis:dualis /app/packages/shared ./packages/shared

# API: compiled output + package-level node_modules
COPY --from=builder --chown=dualis:dualis /app/packages/api/dist ./packages/api/dist
COPY --from=builder --chown=dualis:dualis /app/packages/api/package.json ./packages/api/
COPY --from=builder --chown=dualis:dualis /app/packages/api/node_modules ./packages/api/node_modules

USER dualis
WORKDIR /app/packages/api
EXPOSE 3001
CMD ["node", "dist/index.js"]
