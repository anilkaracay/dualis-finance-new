# Security Monitoring Alert Rules

**Document**: MP22 — Security Alert Definitions
**Protocol**: Dualis Finance
**Date**: 2026-02-23
**Monitoring Stack**: Prometheus + Grafana + PagerDuty

---

## Alert Severity Definitions

| Severity | Response SLA | Notification Channel | Escalation |
|----------|-------------|---------------------|------------|
| CRITICAL | 15 minutes | PagerDuty (phone + SMS) + Slack #security-critical | On-call engineer immediately, CTO within 30 min |
| WARNING | 1 hour | Slack #security-alerts + Email | On-call engineer during business hours |
| INFO | Next business day | Slack #security-info | Review in weekly security standup |

---

## CRITICAL Alerts

### CRIT-01: JWT Token Reuse Detected

**Metric**: `dualis_auth_token_reuse_total`
**Condition**: `rate(dualis_auth_token_reuse_total[5m]) > 0`
**Threshold**: Any occurrence
**Description**: A refresh token that has already been rotated is being presented again. This indicates either token theft and replay, or a client-side bug causing concurrent refresh attempts.
**Action Required**:
1. Immediately revoke all sessions for the affected user.
2. Investigate source IP and User-Agent for the replayed token.
3. If confirmed malicious, block the source IP at WAF level.
4. Notify the affected user via email.

---

### CRIT-02: Webhook Signature Failure Spike

**Metric**: `dualis_webhook_signature_failures_total`
**Condition**: `rate(dualis_webhook_signature_failures_total[1m]) > 5`
**Threshold**: >5 failures per minute
**Description**: Multiple webhook requests are failing signature verification. This may indicate an attacker attempting to forge compliance webhooks (e.g., fake KYC approvals from Sumsub).
**Action Required**:
1. Temporarily disable webhook processing.
2. Verify that the webhook signing secret has not been compromised.
3. Check source IPs against known Sumsub/Chainalysis IP ranges.
4. Review recent KYC status changes for unauthorized approvals.
5. If secret is compromised, rotate immediately with the provider.

---

### CRIT-03: Authentication Failure Rate Spike

**Metric**: `dualis_auth_failures_total`
**Condition**: `rate(dualis_auth_failures_total[1m]) > 50`
**Threshold**: >50 failures per minute
**Description**: Massive authentication failure rate indicating a credential stuffing or brute force attack.
**Action Required**:
1. Verify brute force protection is engaging (check Redis brute force counters).
2. Identify top source IPs from logs and add to WAF blocklist.
3. If attack persists, enable Cloudflare Under Attack mode.
4. Notify affected users if specific accounts are targeted.

---

### CRIT-04: Admin Privilege Escalation Attempt

**Metric**: `dualis_admin_access_denied_total`
**Condition**: `rate(dualis_admin_access_denied_total[5m]) > 10`
**Threshold**: >10 denied admin access attempts in 5 minutes
**Description**: Multiple requests to admin endpoints are being denied due to insufficient role. May indicate an attacker probing for privilege escalation.
**Action Required**:
1. Identify the user(s) making the requests.
2. Review their JWT claims for tampering.
3. If a single user, suspend the account pending investigation.
4. Review admin audit logs for any successful unauthorized access.

---

### CRIT-05: Oracle Price Deviation Beyond Circuit Breaker

**Metric**: `dualis_oracle_circuit_breaker_triggered_total`
**Condition**: `rate(dualis_oracle_circuit_breaker_triggered_total[5m]) > 0`
**Threshold**: Any occurrence
**Description**: An oracle price update was rejected because it exceeded the circuit breaker deviation threshold. This may indicate oracle manipulation or an extreme market event.
**Action Required**:
1. Verify the price against external sources (CoinGecko, CoinMarketCap).
2. If market is stable, investigate the oracle source that submitted the extreme price.
3. If legitimate market crash, monitor liquidation queue health.
4. Consider pausing new borrows if multiple assets are affected.

---

### CRIT-06: Protocol Emergency Pause Triggered

**Metric**: `dualis_protocol_paused`
**Condition**: `dualis_protocol_paused == 1`
**Threshold**: State change to paused
**Description**: The protocol has been emergency-paused via `ProtocolConfig.SetPauseStatus`. All deposits and borrows are halted.
**Action Required**:
1. Confirm the pause was authorized (check admin audit log).
2. Notify all stakeholders via status page and social channels.
3. Begin incident investigation.
4. Document all actions taken.

---

## WARNING Alerts

### WARN-01: Rate Limit Hit Spike

**Metric**: `dualis_rate_limit_hits_total`
**Condition**: `rate(dualis_rate_limit_hits_total[1h]) > 1000`
**Threshold**: >1,000 rate limit hits per hour
**Description**: Elevated rate limit rejections across the API. May indicate a low-volume DDoS, scraping, or an aggressive bot.
**Action Required**:
1. Identify top source IPs contributing to rate limit hits.
2. Determine if traffic is legitimate (e.g., market volatility causing increased user activity).
3. If malicious, add source IPs to WAF blocklist.
4. Consider tightening rate limits temporarily if attack persists.

---

### WARN-02: CORS Violation Spike

**Metric**: `dualis_cors_violations_total`
**Condition**: `rate(dualis_cors_violations_total[1h]) > 50`
**Threshold**: >50 CORS violations per hour
**Description**: Requests from unauthorized origins are being blocked by CORS policy. May indicate a phishing site attempting to interact with the API.
**Action Required**:
1. Identify the `Origin` headers in the blocked requests.
2. Check if any origins are typosquatting the legitimate domain.
3. If a phishing site is identified, report it to the hosting provider and domain registrar.
4. Alert users via in-app notification if a convincing phishing site is active.

---

### WARN-03: Banned/Blocked IP Requests

**Metric**: `dualis_blocked_ip_requests_total`
**Condition**: `rate(dualis_blocked_ip_requests_total[1h]) > 100`
**Threshold**: >100 requests per hour from blocked IPs
**Description**: IPs on the blocklist are still attempting to reach the API. Indicates persistent attacker or misconfigured block.
**Action Required**:
1. Verify blocklist is correctly applied at WAF level (not just application level).
2. Check if attacker is rotating IPs (may need subnet-level block).
3. Escalate to CRITICAL if volume exceeds 1,000/hour.

---

### WARN-04: Flash Loan Volume Anomaly

**Metric**: `dualis_flash_loan_volume_usd`
**Condition**: `rate(dualis_flash_loan_volume_usd[1h]) > 10000000`
**Threshold**: >$10M flash loan volume per hour
**Description**: Unusually high flash loan activity. Could indicate normal market activity or preparation for an economic attack.
**Action Required**:
1. Review flash loan transactions for patterns (same party, same asset, rapid cycling).
2. Cross-reference with oracle price movements.
3. If suspicious, reduce `maxFlashLoanAmount` in ProtocolConfig.
4. Monitor liquidation queue for correlated activity.

---

### WARN-05: Liquidation Queue Depth

**Metric**: `dualis_liquidation_queue_depth`
**Condition**: `dualis_liquidation_queue_depth > 50`
**Threshold**: >50 pending liquidations
**Description**: Large number of positions awaiting liquidation. May indicate cascading liquidations from a market downturn.
**Action Required**:
1. Monitor oracle price feeds for staleness.
2. Verify liquidation trigger is processing normally.
3. Check protocol reserves adequacy.
4. If queue is growing faster than processing, consider batch liquidation mode.

---

### WARN-06: Database Connection Pool Exhaustion

**Metric**: `dualis_db_pool_active_connections`
**Condition**: `dualis_db_pool_active_connections / dualis_db_pool_max_connections > 0.85`
**Threshold**: >85% pool utilization
**Description**: Database connection pool nearing capacity. Could cause request timeouts.
**Action Required**:
1. Check for long-running queries or leaked connections.
2. Consider increasing pool size if traffic is legitimate.
3. Investigate for potential slowloris-style attacks.

---

### WARN-07: Stale Oracle Price Feed

**Metric**: `dualis_oracle_price_age_seconds`
**Condition**: `dualis_oracle_price_age_seconds > 300`
**Threshold**: >300 seconds (5 minutes) since last price update
**Description**: One or more oracle price feeds have not been updated within the staleness threshold.
**Action Required**:
1. Check `oracleUpdate.job.ts` job status in BullMQ.
2. Verify external oracle source APIs are responsive.
3. If feed cannot be restored, mark as stale via `PriceFeed.MarkStale`.
4. Consider pausing borrows against affected assets.

---

## INFO Alerts

### INFO-01: New Admin Login

**Metric**: `dualis_admin_login_total`
**Condition**: `increase(dualis_admin_login_total[5m]) > 0`
**Threshold**: Any admin login event
**Description**: An admin, compliance officer, or viewer has logged into the admin panel.
**Action Required**:
1. Log for audit trail. No immediate action required.
2. Review in weekly security standup.
3. Flag if login occurs outside business hours or from unexpected geographic location.

---

### INFO-02: GDPR Data Deletion Request

**Metric**: `dualis_gdpr_deletion_requests_total`
**Condition**: `increase(dualis_gdpr_deletion_requests_total[1h]) > 0`
**Threshold**: Any occurrence
**Description**: A user has requested deletion of their personal data under GDPR right to erasure.
**Action Required**:
1. Verify request was authenticated.
2. Ensure the data deletion job processes within 30-day regulatory window.
3. Log the request for compliance audit trail.
4. Confirm completion and notify the user.

---

### INFO-03: KYC Rejection Spike

**Metric**: `dualis_kyc_rejections_total`
**Condition**: `rate(dualis_kyc_rejections_total[1h]) > 10`
**Threshold**: >10 KYC rejections per hour
**Description**: Elevated KYC rejection rate. May indicate a fraud ring using fake documents or a Sumsub configuration issue.
**Action Required**:
1. Review rejected applications for common patterns (same IP range, similar document features).
2. If fraud ring suspected, escalate to compliance team.
3. If Sumsub issue, contact their support.

---

### INFO-04: New Staking Position Above Diamond Threshold

**Metric**: `dualis_staking_position_created_total{tier="DiamondStake"}`
**Condition**: `increase(dualis_staking_position_created_total{tier="DiamondStake"}[1h]) > 0`
**Threshold**: Any new Diamond-tier staking position (100,000+ DUAL)
**Description**: A large staking position has been created, granting significant governance voting power.
**Action Required**:
1. Log for governance monitoring.
2. Review if the staker is a known entity.
3. Monitor for governance proposal activity from this party.

---

### INFO-05: Credit Tier Upgrade

**Metric**: `dualis_credit_tier_upgrade_total`
**Condition**: `increase(dualis_credit_tier_upgrade_total[1h]) > 0`
**Threshold**: Any tier upgrade
**Description**: A user's credit tier has been upgraded (e.g., Bronze to Silver), granting higher LTV and rate discounts.
**Action Required**:
1. Log for audit trail.
2. Review in weekly security standup if upgrade frequency is unusual.
3. Flag if user rapidly cycled through tiers (potential gaming).

---

### INFO-06: Institutional Onboarding Completed

**Metric**: `dualis_institutional_onboarding_completed_total`
**Condition**: `increase(dualis_institutional_onboarding_completed_total[1h]) > 0`
**Threshold**: Any occurrence
**Description**: An institutional account has completed the full onboarding flow (KYB verified, compliance approved).
**Action Required**:
1. Log for compliance audit trail.
2. No immediate action required.

---

## Dashboard Requirements

The following Grafana dashboards should be maintained:

| Dashboard | Contents |
|-----------|----------|
| **Security Overview** | All CRITICAL and WARNING alerts in real-time. Auth failure rate, rate limit hits, webhook failures. |
| **Authentication** | Login success/failure rates, brute force triggers, session counts, token rotation events. |
| **Oracle Health** | Price feed freshness, circuit breaker triggers, source confidence, TWAP deviation. |
| **Liquidation** | Queue depth, processing rate, total value liquidated, bad debt accumulation. |
| **Admin Activity** | Admin logins, parameter changes, user modifications, compliance actions. |
| **Infrastructure** | Database connections, Redis memory, API latency p50/p95/p99, error rates. |

---

*Alert thresholds should be tuned based on observed baseline traffic after launch. Review and adjust quarterly.*
