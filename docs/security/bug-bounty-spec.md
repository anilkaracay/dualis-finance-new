# Bug Bounty Program Specification

**Document**: MP22 — Bug Bounty Program
**Protocol**: Dualis Finance
**Date**: 2026-02-23
**Platform**: Immunefi
**Contact**: security@dualis.finance

---

## 1. Program Overview

Dualis Finance invites security researchers to identify and responsibly disclose vulnerabilities in our protocol. We operate a bug bounty program through Immunefi to incentivize responsible security research.

This program covers the Dualis Finance web application, REST API, WebSocket service, and DAML smart contracts deployed on Canton.

---

## 2. Scope

### In Scope

| Asset | Type | Target |
|-------|------|--------|
| Web Application | Web | `https://app.dualis.finance` |
| REST API | API | `https://api.dualis.finance` |
| WebSocket Service | API | `wss://api.dualis.finance/ws` |
| DAML Smart Contracts | Smart Contract | Canton ledger contracts (Dualis.Lending.*, Dualis.Liquidation.*, Dualis.Token.*, Dualis.Oracle.*, Dualis.Credit.*, Dualis.Core.*, Dualis.Privacy.*) |
| Frontend Application | Web | Next.js 14 React application |
| Backend Services | API | Fastify 5.7 Node.js services |

### Out of Scope

| Exclusion | Reason |
|-----------|--------|
| Third-party services (Sumsub, Chainalysis, CoinGecko, Binance) | Not operated by Dualis |
| Canton network infrastructure (sequencer, mediator, domain) | Managed by Digital Asset |
| PartyLayer SDK infrastructure | Third-party service |
| Social engineering or phishing attacks | Not a technical vulnerability |
| DDoS or volumetric attacks | Disruptive; not permitted |
| Attacks requiring physical access | Out of scope |
| Vulnerabilities in outdated browsers | Not supported |
| Clickjacking on pages with no state-changing actions | Low impact |
| Self-XSS (requires user to paste code in console) | User-initiated |
| Missing security headers that do not lead to exploitable vulnerability | Informational only |
| Rate limiting bypass that does not lead to account takeover | Low impact |
| Email enumeration via registration/password reset timing | Accepted risk |
| Content spoofing without demonstrated impact | Low impact |

---

## 3. Severity Levels and Rewards

### Critical ($5,000 - $50,000)

Vulnerabilities that can lead to direct loss of user funds, protocol insolvency, or total compromise of the platform.

**Examples**:
- Unauthorized withdrawal of user deposits or collateral
- Manipulation of health factor calculations to prevent legitimate liquidation
- Oracle price manipulation leading to unauthorized fund extraction
- Smart contract logic error allowing unauthorized minting of DUAL tokens beyond total supply
- Authentication bypass granting admin-level access
- Remote code execution on API servers
- Private key or JWT secret extraction
- Database compromise with access to all user data
- Bypassing withdrawal limits to drain protocol reserves

**Payout factors**: Base reward scaled by potential loss amount and exploitability.

### High ($1,000 - $5,000)

Vulnerabilities that can lead to significant impact on protocol operations, partial fund loss, or sensitive data exposure.

**Examples**:
- IDOR allowing access to other users' borrow positions, credit scores, or compliance data
- Privilege escalation from regular user to admin or compliance officer
- Webhook signature bypass allowing forged KYC approvals
- SSRF allowing access to internal services or metadata endpoints
- Bypass of brute force protection enabling credential stuffing
- Cross-site WebSocket hijacking with data exfiltration
- Stale price exploitation leading to unfavorable user outcomes
- Liquidation of healthy positions through parameter manipulation

### Medium ($200 - $1,000)

Vulnerabilities with moderate impact, typically requiring specific conditions or user interaction.

**Examples**:
- Stored XSS in user-controlled fields (display names, company names)
- CSRF bypass on state-changing endpoints
- Sensitive data exposure in API error responses (stack traces, internal paths)
- Race condition in concurrent operations (double-spend at application layer)
- Insufficient rate limiting on financial operations
- Information disclosure via timing side-channels
- Improper session invalidation after password change
- Credit score manipulation through rapid loan cycling

### Low ($50 - $200)

Minor vulnerabilities with limited impact.

**Examples**:
- Reflected XSS requiring specific URL crafting
- Missing security headers with minimal exploitability
- Verbose error messages revealing software versions
- Open redirect in non-authenticated flows
- CORS misconfiguration on non-sensitive endpoints
- Minor information leakage in API responses
- Weak password policy enforcement

---

## 4. Rules and Guidelines

### Responsible Disclosure

- **90-day disclosure window**: We request that you do not publicly disclose any vulnerability for 90 days from the date of your report, or until a fix is deployed, whichever comes first.
- **Good faith**: Act in good faith to avoid privacy violations, data destruction, and interruption of service.
- **Minimization**: Stop testing and report immediately upon discovering a vulnerability. Do not exploit it further.

### Testing Rules

1. **No automated scanning** of production systems. Automated tools may only be used against the staging environment (available upon request).
2. **No DDoS or denial of service** testing.
3. **No social engineering** of Dualis employees or users.
4. **No physical attacks** or attempts to access physical infrastructure.
5. **Staging environment preferred**: Request access to `staging.app.dualis.finance` for active testing.
6. **Do not access, modify, or delete** data belonging to other users.
7. **Create your own test accounts** for testing. Do not use accounts belonging to real users.
8. **One report per vulnerability**. If you find multiple instances of the same class of vulnerability, submit a single report with all instances.

### Eligibility

- You must be the first reporter of the vulnerability.
- You must not be a current or recent (within 6 months) employee or contractor of Dualis Finance.
- You must comply with all applicable laws in your jurisdiction.
- Vulnerabilities must be reproducible and include sufficient detail for our team to verify.
- Findings from automated scanners without manual verification are not eligible.

### Report Requirements

Each report must include:

1. **Vulnerability title and description**
2. **Severity assessment** with justification
3. **Step-by-step reproduction instructions**
4. **HTTP request/response pairs** (for API vulnerabilities)
5. **Proof of concept** (screenshots, video, or code)
6. **Impact assessment** (what an attacker could achieve)
7. **Suggested remediation** (optional but appreciated)

---

## 5. Submission Process

1. Submit your report via the Immunefi platform at the Dualis Finance program page.
2. Our security team will acknowledge receipt within **2 business days**.
3. We will triage and assess severity within **5 business days**.
4. You will receive status updates at least every **10 business days**.
5. Rewards are paid within **14 business days** of fix verification.
6. Payments are made in USDC or USDT to a wallet address of your choice, or via wire transfer.

---

## 6. Safe Harbor

Dualis Finance will not pursue legal action against security researchers who:

- Act in accordance with this bug bounty policy.
- Make a good faith effort to avoid privacy violations, data destruction, and service disruption.
- Report vulnerabilities promptly and do not exploit them.
- Do not access, modify, or exfiltrate data belonging to other users.

This safe harbor applies to claims under computer fraud laws, trade secret laws, and any similar state or federal laws.

---

## 7. Contact

| Channel | Address | Use For |
|---------|---------|---------|
| Primary | Immunefi platform | All bug bounty submissions |
| Urgent/Critical | security@dualis.finance | Critical findings requiring immediate attention |
| PGP Key | Available on request | Encrypted communication for sensitive details |

---

## 8. Program Updates

This program specification may be updated at any time. Changes will be announced on the Immunefi platform. The most recent version always takes precedence.

**Version History**:

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-23 | Initial program launch |

---

*Dualis Finance reserves the right to modify reward amounts, scope, and rules at any time. Disputes will be resolved at the sole discretion of the Dualis Finance security team.*
