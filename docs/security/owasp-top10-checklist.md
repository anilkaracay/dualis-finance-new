# OWASP Top 10 (2021) Compliance Checklist

**Document**: MP22 — OWASP Top 10 Mapping
**Protocol**: Dualis Finance
**Date**: 2026-02-23
**OWASP Version**: 2021

---

## A01: Broken Access Control

**Risk**: Users act outside their intended permissions. Unauthorized access to other users' data, privilege escalation, and CORS misconfiguration.

### Checklist

- [x] **Role-based access control (RBAC)**: Three-tier admin auth in `packages/api/src/middleware/admin-auth.ts` — `requireAdmin`, `requireCompliance`, `requireAdminViewer`. Roles: `admin`, `compliance_officer`, `viewer`.
- [x] **JWT-based authentication**: All protected endpoints require valid JWT via `authMiddleware`. User identity extracted from token claims, not from request parameters.
- [ ] **IDOR prevention**: Each endpoint must validate that the authenticated user owns the requested resource. **Audit needed**: verify all position/notification/session endpoints enforce ownership checks against `request.user.userId`.
- [x] **CORS configuration**: Fastify CORS plugin configured. **Action needed**: verify no wildcard `origin: '*'` in production config.
- [ ] **Path traversal prevention**: If any file-serving endpoints exist, verify path normalization. Currently no static file serving from API.
- [x] **Method restriction**: Routes explicitly define allowed HTTP methods (GET, POST, PATCH, DELETE).
- [ ] **Admin panel IP restriction**: Admin routes (`/admin/*`) should be restricted to VPN/internal IPs via network-level firewall rules. **Status: TODO**.
- [x] **Session revocation**: Users can revoke individual sessions (`DELETE /auth/sessions/:sessionId`) or all sessions (`POST /auth/revoke-all-sessions`).

### Dualis-Specific Notes

- The admin audit log (`admin-auth.ts:logAdminAction`) records all admin operations with IP address and User-Agent, providing an audit trail for access control violations.
- Canton DAML templates enforce signatory-based access control at the ledger level, providing a second layer of authorization.

---

## A02: Cryptographic Failures

**Risk**: Exposure of sensitive data due to weak or missing cryptography.

### Checklist

- [x] **TLS for all external connections**: All public endpoints served over HTTPS. **Action needed**: enforce TLS 1.3 minimum at load balancer level.
- [x] **Password hashing**: bcrypt used for password storage (configured in `auth.service.ts`). Adequate work factor.
- [x] **JWT signing**: HMAC-SHA256 (HS256) with secret key from environment variable `JWT_SECRET`.
- [ ] **JWT signing key strength**: Verify JWT_SECRET is at least 256 bits of entropy. **Recommendation**: migrate to RS256 (asymmetric) for production to enable public key verification without sharing the secret.
- [x] **Webhook signature verification**: HMAC-SHA256 used for Sumsub webhook signature validation in `compliance-webhook.ts`.
- [ ] **Database encryption at rest**: PostgreSQL encryption at rest not yet configured. **Status: TODO**.
- [ ] **PII encryption at column level**: Email addresses, wallet addresses stored in plaintext. **Recommendation**: encrypt sensitive columns with pgcrypto or application-level encryption.
- [x] **No sensitive data in URLs**: Authentication tokens passed in headers or body, never in query strings.
- [x] **No sensitive data in logs**: Pino logger configured to avoid logging passwords, tokens, or PII.

---

## A03: Injection

**Risk**: Untrusted data sent to an interpreter as part of a command or query.

### Checklist

- [x] **SQL injection prevention**: Drizzle ORM uses parameterized queries exclusively. No raw SQL string concatenation in the codebase.
- [x] **NoSQL injection prevention**: Redis operations use the ioredis client with typed commands, not string interpolation.
- [x] **XSS prevention (reflected/stored)**: React's JSX auto-escapes output by default. Next.js 14 provides additional protections.
- [ ] **XSS prevention (DOM-based)**: Verify no usage of `dangerouslySetInnerHTML` in frontend components. Run `security-test.sh` to scan.
- [x] **Input validation**: Zod schemas validate all API request bodies (`packages/api/src/middleware/validate.ts`). Type-safe parsing with explicit constraints (min/max lengths, email format, etc.).
- [x] **Command injection prevention**: No `child_process.exec` or `eval` usage in the API codebase.
- [x] **DAML injection prevention**: DAML is a statically typed, compiled language. No runtime code injection possible.
- [ ] **Header injection**: Verify no user input is reflected in response headers without sanitization.

### Dualis-Specific Notes

- The Zod validation layer (`middleware/validate.ts`) provides a strong defense against injection attacks at the API boundary.
- All financial calculations use the math engine in `packages/shared/src/utils/math.ts` with typed numeric inputs, preventing formula injection.

---

## A04: Insecure Design

**Risk**: Architectural flaws that cannot be fixed by implementation alone.

### Checklist

- [x] **Health factor calculation**: Implemented in both TypeScript (`packages/shared/src/utils/math.ts`) and DAML (`Dualis.Lending.Math`). Cross-validated in tests.
- [ ] **Health factor design gap**: `CollateralVault.WithdrawCollateral` defers HF check to the backend. This is an insecure design pattern — the on-ledger contract should enforce the invariant. **See: FINDING-01 in daml-audit.md**.
- [x] **Rate limiting by design**: Auth endpoints have per-route rate limits. Brute force protection with Redis-backed counters.
- [ ] **Threat modeling**: Formal threat model not yet documented. **Recommendation**: conduct STRIDE threat modeling workshop for all major user flows (deposit, borrow, liquidation, governance).
- [x] **Separation of concerns**: Monorepo with clear package boundaries (shared, api, frontend, canton). Business logic isolated in service layer.
- [x] **Fail-safe defaults**: `ProtocolConfig.isPaused` defaults to `false`. Pool `isActive` must be explicitly set. Emergency pause is available.
- [ ] **Liquidation design review**: `ExecuteLiquidation` accepts prices as parameters rather than reading from on-ledger oracle. This is an insecure design pattern. **See: FINDING-02 in daml-audit.md**.

---

## A05: Security Misconfiguration

**Risk**: Missing or incorrect security settings, default credentials, unnecessary features enabled.

### Checklist

- [x] **Helmet security headers**: Fastify Helmet plugin configured for CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- [ ] **Debug mode disabled in production**: Verify `NODE_ENV=production` in deployment. Verify no debug logging of sensitive data.
- [ ] **Default credentials removed**: Verify no default admin accounts in `db/seed.ts` persist to production. Seed data must be development-only.
- [x] **Error handling**: Custom `errorHandler.ts` returns generic error messages. No stack traces in production responses.
- [ ] **Unnecessary endpoints disabled**: Verify `/health` endpoint does not expose sensitive system information (versions, internal IPs, database status details).
- [ ] **HTTP methods restricted**: Verify no unintended methods are accepted (OPTIONS responses reviewed).
- [x] **Dependencies up to date**: pnpm lockfile pins dependency versions. `pnpm audit` identifies known vulnerabilities.
- [ ] **Canton configuration hardened**: Verify participant node does not expose admin API publicly. Review Canton logging level for production.

---

## A06: Vulnerable and Outdated Components

**Risk**: Known vulnerabilities in third-party libraries.

### Checklist

- [x] **Dependency audit**: `pnpm audit` available for scanning. **Action needed**: integrate into CI pipeline with `--audit-level high` fail threshold.
- [ ] **Automated dependency updates**: Configure Dependabot or Renovate for automated PRs on security updates.
- [ ] **License compliance check**: Verify no copyleft (GPL) licenses in production dependencies. Use `license-checker` or equivalent.
- [x] **Lockfile committed**: `pnpm-lock.yaml` is committed to version control, ensuring reproducible builds.
- [ ] **Component inventory**: Maintain a Software Bill of Materials (SBOM) for regulatory compliance.
- [x] **Major framework versions**: Next.js 14.2, Fastify 5.7, React 18 — all within supported/maintained versions.
- [x] **DAML SDK version**: Daml 2.9.3 targeting LF 2.1. Supported version.

---

## A07: Identification and Authentication Failures

**Risk**: Weak authentication mechanisms allowing unauthorized access.

### Checklist

- [x] **Brute force protection**: Redis-backed brute force counter (`security/brute-force.ts`) with exponential backoff. Keyed by `IP:email` combination.
- [x] **JWT expiry**: Access tokens have short expiry. Refresh tokens used for session extension.
- [x] **Refresh token rotation**: On refresh, old token is invalidated and new token issued.
- [x] **Session management**: Active sessions listed via `GET /auth/sessions`. Individual and bulk revocation supported.
- [x] **Password complexity**: Zod schema enforces minimum 8 characters, maximum 128 characters.
- [ ] **Password complexity enhancement**: Add rules for uppercase, lowercase, digit, and special character requirements.
- [x] **Email verification**: `POST /auth/verify-email` endpoint with token-based verification.
- [x] **Password reset flow**: Time-limited tokens for `forgot-password` / `reset-password` flow. Rate limited to 3/hour.
- [x] **Wallet authentication**: Cryptographic signature verification for wallet-based login (nonce + signature).
- [ ] **Multi-factor authentication (MFA)**: Not yet implemented. **Recommendation**: add TOTP-based 2FA, especially for admin and institutional accounts.
- [ ] **Account lockout notification**: Users not notified when brute force protection triggers. **Recommendation**: send email notification on lockout.

---

## A08: Software and Data Integrity Failures

**Risk**: Code or data modifications without integrity verification.

### Checklist

- [x] **CI pipeline**: Turbo-based build pipeline with type checking and tests.
- [x] **Lockfile integrity**: `pnpm-lock.yaml` committed and verified on install.
- [x] **Webhook signature verification**: Inbound webhooks from Sumsub verified with HMAC-SHA256.
- [ ] **Outbound webhook signing**: Verify that outbound notification webhooks are signed so recipients can verify origin.
- [ ] **Supply chain verification**: npm package signature verification not yet enabled.
- [x] **DAML contract integrity**: Canton ledger provides cryptographic proof of contract integrity via Merkle trees.
- [ ] **API response integrity**: Consider adding response signatures for critical financial data (balances, positions, health factors).

---

## A09: Security Logging and Monitoring Failures

**Risk**: Insufficient logging to detect, escalate, or respond to attacks.

### Checklist

- [x] **Structured logging**: Pino JSON logger in `packages/api/src/config/logger.ts` with child loggers per module.
- [x] **Prometheus metrics**: Request/response metrics exported via `middleware/metrics.ts`.
- [x] **Error tracking**: Sentry integration in `middleware/sentry.ts` for runtime error capture.
- [x] **Admin audit log**: All admin actions logged to `admin_audit_logs` table with userId, action, IP, User-Agent.
- [x] **Auth event logging**: Failed login attempts logged. Brute force triggers logged.
- [ ] **Security event alerting**: Alert rules defined (see `alert-rules.md`) but not yet integrated with PagerDuty/OpsGenie.
- [ ] **Log retention**: No formal retention policy. **Target**: 90 days minimum for security logs, 1 year for audit logs.
- [ ] **Log integrity**: Logs should be written to append-only storage (S3 Object Lock, WORM).
- [x] **Request ID tracing**: Fastify request IDs enable correlation across log entries.

### Dualis-Specific Notes

- Canton provides its own audit trail via the ledger's append-only transaction log. All contract exercises are permanently recorded.
- The compliance audit routes (`compliance-audit-routes.ts`) provide regulatory audit trail access.

---

## A10: Server-Side Request Forgery (SSRF)

**Risk**: Server makes requests to attacker-controlled or internal URLs.

### Checklist

- [ ] **Webhook URL validation**: Verify that user-configured webhook URLs are validated against a whitelist of allowed domains. Block private IP ranges.
- [ ] **Private IP blocking**: Implement blocking for: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `0.0.0.0/8`, `::1`, `fc00::/7`.
- [ ] **DNS rebinding protection**: Resolve DNS before making requests and verify the resolved IP is not in a private range.
- [x] **Oracle source URLs hardcoded**: CoinGecko, Binance source URLs are hardcoded in `packages/api/src/oracle/sources/`, not user-configurable.
- [ ] **Outbound request proxy**: Route all outbound HTTP requests through a dedicated proxy that enforces URL/IP restrictions.
- [ ] **URL scheme restriction**: Only allow `https://` scheme for webhooks and external requests. Block `file://`, `ftp://`, `gopher://`, etc.

### Dualis-Specific Notes

- The primary SSRF risk is in webhook URL configuration (compliance webhooks, notification webhooks).
- Oracle source URLs are defined in code, not user-configurable, which significantly reduces SSRF risk for price feeds.
- The Canton JSON API URL is configured via environment variable; ensure it is not exposed to user modification.

---

## Compliance Summary

| OWASP ID | Category | Compliance Level | Priority |
|----------|----------|-----------------|----------|
| A01 | Broken Access Control | Partial | High |
| A02 | Cryptographic Failures | Partial | Medium |
| A03 | Injection | Strong | Low |
| A04 | Insecure Design | Partial | High |
| A05 | Security Misconfiguration | Partial | Medium |
| A06 | Vulnerable Components | Partial | Medium |
| A07 | Auth Failures | Strong | Medium |
| A08 | Data Integrity | Partial | Medium |
| A09 | Logging & Monitoring | Strong | Low |
| A10 | SSRF | Weak | High |

**Overall**: Strong in injection prevention (A03) and authentication (A07). Requires immediate attention on SSRF (A10), access control IDOR testing (A01), and insecure design patterns in DAML contracts (A04).

---

*This checklist should be re-evaluated after each penetration test and major release.*
