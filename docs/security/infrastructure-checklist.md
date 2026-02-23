# Infrastructure Security Checklist

**Document**: MP22 — Infrastructure Security
**Protocol**: Dualis Finance
**Date**: 2026-02-23
**Review Cycle**: Monthly

---

## 1. Secrets Management

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 1.1 | Environment variables encrypted at rest in deployment platform | TODO | DevOps | Use AWS Secrets Manager or Vault for production |
| 1.2 | Secret rotation policy documented and enforced | TODO | DevOps | Target: 90-day rotation for all API keys |
| 1.3 | No secrets in source code or git history | In Progress | Engineering | `security-test.sh` scans for hardcoded secrets; need git history audit |
| 1.4 | `.env` files excluded from version control | Done | Engineering | `.gitignore` includes `.env*` patterns; `.env.devnet` and `.env.sandbox` are present but gitignored |
| 1.5 | Separate secrets per environment (dev/staging/prod) | In Progress | DevOps | Dev and sandbox environments configured; prod pending |
| 1.6 | JWT signing key is unique per environment | TODO | Engineering | Currently configured via `JWT_SECRET` env var |
| 1.7 | Database credentials use IAM auth where possible | TODO | DevOps | PostgreSQL supports IAM in AWS RDS |
| 1.8 | API keys for external services (CoinGecko, Binance, Sumsub, Chainalysis) rotated regularly | TODO | Engineering | Define rotation calendar |
| 1.9 | Redis AUTH password configured and unique | TODO | DevOps | `packages/api/src/cache/redis.ts` supports password auth |
| 1.10 | Canton participant node API keys secured | TODO | DevOps | PartyLayer SDK credentials need secure storage |

---

## 2. Database Security

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 2.1 | PostgreSQL connections use SSL/TLS | In Progress | DevOps | Drizzle ORM client in `packages/api/src/db/client.ts` supports `ssl: true` |
| 2.2 | Connection pooling configured with limits | Done | Engineering | Drizzle + pg pool with max connections configured |
| 2.3 | Separate database users per service (API read/write, migration, readonly) | TODO | DevOps | Currently single user; need read-only user for analytics |
| 2.4 | Database encryption at rest (AES-256) | TODO | DevOps | Enable on AWS RDS or equivalent |
| 2.5 | Automated backups with tested restore procedure | TODO | DevOps | Target: daily backups, 30-day retention, monthly restore test |
| 2.6 | No `SELECT *` in production queries | In Progress | Engineering | Drizzle ORM encourages column selection; verify with `security-test.sh` |
| 2.7 | All queries parameterized (no SQL injection) | Done | Engineering | Drizzle ORM uses parameterized queries exclusively |
| 2.8 | Database audit logging enabled | TODO | DevOps | Enable pgaudit extension for prod |
| 2.9 | Schema migration access restricted to CI/CD pipeline | TODO | DevOps | `db/seed.ts` should not run in production |
| 2.10 | PII data encrypted at column level (email, wallet address) | TODO | Engineering | Evaluate pgcrypto for sensitive columns |

---

## 3. Network Security

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 3.1 | TLS 1.3 enforced for all external connections | TODO | DevOps | Configure Cloudflare/ALB to require TLS 1.3 minimum |
| 3.2 | HTTPS redirect enforced (no plaintext HTTP) | TODO | DevOps | Cloudflare "Always Use HTTPS" or ALB redirect rule |
| 3.3 | Cloudflare WAF deployed with managed rulesets | TODO | DevOps | Enable OWASP Core Rule Set, rate limiting rules |
| 3.4 | IP restrictions on admin endpoints | TODO | DevOps | Restrict `/admin/*` routes to VPN/office IP ranges |
| 3.5 | Database port (5432) not exposed to public internet | TODO | DevOps | Security group: allow only from API server subnet |
| 3.6 | Redis port (6379) not exposed to public internet | TODO | DevOps | Security group: allow only from API server subnet |
| 3.7 | Canton participant node API not publicly accessible | TODO | DevOps | Restrict to internal network only |
| 3.8 | WebSocket connections authenticated and rate-limited | In Progress | Engineering | `packages/api/src/ws/server.ts` supports auth; rate limiting needed |
| 3.9 | CORS policy restricts allowed origins | In Progress | Engineering | Verify no wildcard `*` in production CORS config |
| 3.10 | DNS security (DNSSEC, CAA records) | TODO | DevOps | Configure CAA to restrict certificate issuance |
| 3.11 | DDoS protection enabled | TODO | DevOps | Cloudflare provides L3/L4/L7 DDoS protection |
| 3.12 | SSH access uses key-based auth only (no passwords) | TODO | DevOps | Disable password auth in sshd_config |

---

## 4. Application Security

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 4.1 | Helmet security headers configured | Done | Engineering | Fastify Helmet plugin for CSP, X-Frame-Options, etc. |
| 4.2 | CSRF protection enabled for state-changing requests | Done | Engineering | `GET /auth/csrf-token` endpoint provides CSRF tokens |
| 4.3 | Input validation on all endpoints (Zod schemas) | Done | Engineering | Zod validation middleware in `middleware/validate.ts` |
| 4.4 | Rate limiting on authentication endpoints | Done | Engineering | 5-10 requests per time window per auth route |
| 4.5 | Brute force protection with exponential backoff | Done | Engineering | `security/brute-force.ts` with Redis-backed counters |
| 4.6 | JWT access token expiry configured (short-lived) | Done | Engineering | Access token expiry; refresh token rotation |
| 4.7 | Refresh token rotation on use | Done | Engineering | Old refresh token invalidated on rotation |
| 4.8 | Session revocation capability | Done | Engineering | `DELETE /auth/sessions/:id` and `POST /auth/revoke-all-sessions` |
| 4.9 | Error responses do not leak stack traces | Done | Engineering | `middleware/errorHandler.ts` strips internals |
| 4.10 | Debug/dev endpoints disabled in production | In Progress | Engineering | Verify `health.ts` does not expose sensitive info; no debug routes |
| 4.11 | File upload restrictions (size, type, content) | TODO | Engineering | If applicable to KYC document upload |
| 4.12 | Webhook signature verification (HMAC-SHA256) | In Progress | Engineering | `compliance-webhook.ts` handles Sumsub webhooks |

---

## 5. Monitoring and Incident Response

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 5.1 | Structured logging with Pino | Done | Engineering | `packages/api/src/config/logger.ts` — JSON structured logs |
| 5.2 | Prometheus metrics exported | Done | Engineering | `middleware/metrics.ts` exports request/response metrics |
| 5.3 | Sentry error tracking configured | Done | Engineering | `middleware/sentry.ts` integration |
| 5.4 | Admin audit logging | Done | Engineering | `middleware/admin-auth.ts` logs all admin actions with IP/UA |
| 5.5 | Alerting rules defined for security events | In Progress | DevOps | See `docs/security/alert-rules.md` |
| 5.6 | Incident response runbook documented | TODO | Security | Define severity levels, escalation paths, communication plan |
| 5.7 | Security on-call rotation established | TODO | Security | 24/7 coverage for critical alerts |
| 5.8 | Log retention policy (90 days minimum) | TODO | DevOps | Comply with regulatory requirements |
| 5.9 | Log integrity protection (write-once storage) | TODO | DevOps | S3 Object Lock or equivalent |
| 5.10 | Regular security metrics review (weekly) | TODO | Security | Dashboard for auth failures, rate limits, CORS violations |

---

## 6. CI/CD Security

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 6.1 | `pnpm audit` runs in CI pipeline | In Progress | DevOps | MP18 DevOps infrastructure includes CI/CD |
| 6.2 | Lockfile integrity check in CI | TODO | DevOps | Verify `pnpm-lock.yaml` matches `package.json` |
| 6.3 | License compliance check | TODO | DevOps | Block copyleft licenses in production dependencies |
| 6.4 | SAST (Static Application Security Testing) | TODO | DevOps | Integrate Semgrep or CodeQL |
| 6.5 | Container image scanning (if applicable) | TODO | DevOps | Scan Docker images for CVEs |
| 6.6 | Deployment requires approval for production | TODO | DevOps | GitHub required reviewers for main branch |
| 6.7 | Secrets never logged in CI output | TODO | DevOps | Mask secrets in GitHub Actions |
| 6.8 | Build artifacts signed and verified | TODO | DevOps | Future: sigstore or similar |

---

## 7. Canton/Blockchain Security

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 7.1 | Canton participant node TLS configured | TODO | DevOps | mTLS between participant and domain |
| 7.2 | DAML contract access control reviewed | Done | Engineering | See `docs/security/daml-audit.md` |
| 7.3 | Canton JSON API access restricted | TODO | DevOps | Internal network only |
| 7.4 | Party allocation follows least-privilege | In Progress | Engineering | `packages/api/src/canton/party-manager.ts` |
| 7.5 | Canton health monitoring | In Progress | Engineering | `packages/api/src/routes/health.ts` includes Canton status |
| 7.6 | DAML package versioning and upgrade plan | TODO | Engineering | Plan for safe contract upgrades |
| 7.7 | Canton backup and disaster recovery | TODO | DevOps | Participant node database backup plan |

---

## Summary

| Category | Total Items | Done | In Progress | TODO |
|----------|------------|------|-------------|------|
| Secrets Management | 10 | 1 | 2 | 7 |
| Database Security | 10 | 2 | 2 | 6 |
| Network Security | 12 | 0 | 2 | 10 |
| Application Security | 12 | 8 | 2 | 2 |
| Monitoring & Incident Response | 10 | 4 | 1 | 5 |
| CI/CD Security | 8 | 0 | 1 | 7 |
| Canton/Blockchain | 7 | 1 | 2 | 4 |
| **Total** | **69** | **16** | **12** | **41** |

**Overall Readiness**: 23% complete. Application-layer security is strong (67% done). Infrastructure and CI/CD security require significant work before production launch.

---

*Checklist should be reviewed monthly and updated as items are completed. Each TODO item should have an assigned owner and target completion date before the next review cycle.*
