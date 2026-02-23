# Secrets Management — Dualis Finance

## 1. Where Secrets Are Stored

**NEVER** store secrets in the repository. All `.env*` files are in `.gitignore`.

```
Frontend (Vercel):
  → Vercel Dashboard → Project Settings → Environment Variables
  → NEXT_PUBLIC_* prefixed variables are exposed to the browser

Backend (Railway):
  → Railway Dashboard → Service → Variables
  → DATABASE_URL and REDIS_URL are auto-injected from plugins
  → Other secrets must be added manually

CI/CD (GitHub):
  → GitHub → Settings → Secrets and Variables → Actions
  → Used by deploy workflows
```

## 2. Secret Inventory

### Railway (Backend API)

| Secret | Source | Description |
|--------|--------|-------------|
| `DATABASE_URL` | Railway (auto) | PostgreSQL connection string from plugin |
| `REDIS_URL` | Railway (auto) | Redis connection string from plugin |
| `JWT_SECRET` | Manual | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Manual | `openssl rand -hex 32` |
| `CANTON_JWT_TOKEN` | Canton devnet | Auth token for Canton JSON API |
| `CANTON_OPERATOR_PARTY` | Canton devnet | Operator party identifier |
| `CANTON_ORACLE_PARTY` | Canton devnet | Oracle party identifier |
| `COINGECKO_API_KEY` | CoinGecko | API key for price feeds |
| `SENTRY_DSN` | Sentry | Error tracking DSN |

### Vercel (Frontend)

| Secret | Source | Description |
|--------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | Config | `https://api.dualis.finance/v1` |
| `NEXT_PUBLIC_WS_URL` | Config | `wss://api.dualis.finance/v1/ws` |
| `NEXT_PUBLIC_APP_URL` | Config | `https://app.dualis.finance` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | Frontend error tracking DSN |

### GitHub Actions (CI/CD)

| Secret | Source | Description |
|--------|--------|-------------|
| `RAILWAY_STAGING_TOKEN` | Railway | Project → Settings → Tokens (staging) |
| `RAILWAY_PRODUCTION_TOKEN` | Railway | Project → Settings → Tokens (production) |
| `VERCEL_TOKEN` | Vercel | Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Vercel | `.vercel/project.json` after `vercel link` |
| `PRODUCTION_DATABASE_URL` | Railway | PostgreSQL connection string for migrations |

## 3. GitHub Environments

Create two environments in GitHub → Settings → Environments:

### `staging`
- No protection rules
- Used by `deploy-staging.yml`

### `production`
- Required reviewers: 1 minimum
- Wait timer: optional (e.g., 5 minutes)
- Used by `deploy-production.yml`

## 4. Generating Secrets

```bash
# JWT secrets (256-bit hex)
openssl rand -hex 32

# Random password
openssl rand -base64 24
```

## 5. Secret Rotation Schedule

| Secret | Rotation Period | Notes |
|--------|----------------|-------|
| `JWT_SECRET` | 90 days | Invalidates all active tokens |
| `JWT_REFRESH_SECRET` | 90 days | Invalidates all refresh tokens |
| `COINGECKO_API_KEY` | 6 months | |
| `CANTON_JWT_TOKEN` | Per Canton devnet reset | |
| `DATABASE_URL` password | Railway manages | Auto-rotated by plugin |
| `VERCEL_TOKEN` | 6 months | |
| `RAILWAY_*_TOKEN` | 6 months | |

## 6. Emergency Procedures

### Compromised JWT Secret
1. Generate new secret: `openssl rand -hex 32`
2. Update in Railway variables
3. Restart API service (all sessions invalidated)

### Compromised Database Credentials
1. Railway: Re-provision PostgreSQL plugin
2. Update `PRODUCTION_DATABASE_URL` in GitHub Secrets
3. Verify API reconnects successfully

### Compromised API Token (Railway/Vercel)
1. Revoke token in respective dashboard
2. Generate new token
3. Update GitHub Secrets
4. Re-run failed deploys
