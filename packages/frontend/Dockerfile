FROM node:20-alpine AS builder
WORKDIR /app

# Build-time env vars (Next.js bakes NEXT_PUBLIC_* at build time)
ARG NEXT_PUBLIC_API_URL=https://api.dualis.finance/v1
ARG NEXT_PUBLIC_WS_URL=wss://api.dualis.finance/v1/ws
ARG NEXT_PUBLIC_APP_URL=https://dualis.finance
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

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
RUN apk add --no-cache curl
ENV NODE_ENV=production
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public
EXPOSE 3000
CMD ["node", "packages/frontend/server.js"]
