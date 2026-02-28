'use client';

import { Callout } from '@/components/docs/Callout';

export default function SecurityModelPage() {
  return (
    <>
      <h1>Security Model</h1>
      <p className="docs-lead">
        Dualis Finance implements a defense-in-depth security architecture spanning five layers:
        authentication, API hardening, access control, smart contract safety, and infrastructure
        resilience. Every layer is designed to fail independently, so a breach in one does not
        compromise the others.
      </p>

      <h2 id="security-layers">Security Layers</h2>
      <p>
        The following table summarizes the security controls deployed across each layer of the
        Dualis stack. Together, they form a comprehensive perimeter that protects user assets,
        sensitive data, and protocol operations.
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Controls</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Authentication</strong></td>
              <td>JWT + bcrypt</td>
              <td>
                Stateless JWT tokens with configurable expiration. Passwords hashed with bcrypt
                using a cost factor of 12. Refresh token rotation prevents session hijacking.
                Canton wallet authentication via PartyLayer signature verification.
              </td>
            </tr>
            <tr>
              <td><strong>API Hardening</strong></td>
              <td>Rate limiting, Helmet, CORS, CSRF, Zod</td>
              <td>
                Rate limiting via Redis-backed sliding window (configurable per-endpoint).
                Helmet sets security headers including CSP, HSTS, and X-Frame-Options. CORS
                restricted to allowed origins. CSRF tokens on state-changing requests. All
                request bodies validated with Zod schemas -- invalid payloads are rejected
                before reaching business logic.
              </td>
            </tr>
            <tr>
              <td><strong>Access Control</strong></td>
              <td>RBAC, admin audit logging</td>
              <td>
                Role-based access control with four roles: user, institutional, admin, and
                super-admin. Administrative actions (parameter changes, pool creation, emergency
                pause) are logged to an immutable audit trail in PostgreSQL. Sensitive operations
                require multi-step confirmation.
              </td>
            </tr>
            <tr>
              <td><strong>Smart Contracts</strong></td>
              <td>DAML signatory model</td>
              <td>
                DAML&apos;s signatory/observer model ensures no contract can be created or exercised
                without explicit authorization from required parties. No reentrancy is possible
                due to DAML&apos;s atomic execution model. All asset transfers require the asset
                owner&apos;s signature. The functional type system eliminates overflow, underflow,
                and null pointer vulnerabilities at compile time.
              </td>
            </tr>
            <tr>
              <td><strong>Infrastructure</strong></td>
              <td>Circuit breaker (Opossum), Sentry, TLS</td>
              <td>
                Opossum circuit breakers protect against cascading failures when downstream
                services (Canton, oracles) become unresponsive. Sentry captures and alerts on
                runtime errors across API and frontend. All traffic encrypted via TLS 1.3 with
                Let&apos;s Encrypt certificates. Docker containers run with minimal privileges.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="defense-in-depth">Defense in Depth</h2>
      <p>
        The security architecture is designed so that no single control is a single point of
        failure. Even if an attacker bypasses rate limiting and exploits an API vulnerability,
        they still face RBAC enforcement, Zod validation, DAML signatory requirements, and
        audit logging. Each layer operates independently:
      </p>
      <ul>
        <li>
          <strong>Perimeter:</strong> Nginx reverse proxy with TLS termination, IP-based rate
          limiting, and request size limits.
        </li>
        <li>
          <strong>Application:</strong> Fastify middleware chain -- authentication, CORS, CSRF,
          Helmet headers, Zod schema validation -- runs before any route handler.
        </li>
        <li>
          <strong>Business logic:</strong> RBAC checks verify the authenticated user has the
          required role for the requested operation. Pool limits and position constraints are
          enforced server-side.
        </li>
        <li>
          <strong>Settlement:</strong> DAML contracts on Canton provide the final authorization
          layer. Even if the API is compromised, Canton will reject any transaction that lacks
          proper signatory authorization.
        </li>
        <li>
          <strong>Monitoring:</strong> Sentry error tracking, structured logging, and admin audit
          trails provide real-time visibility into anomalous behavior.
        </li>
      </ul>

      <Callout type="info" title="Canton as the Final Guard">
        The DAML signatory model acts as the ultimate security boundary. Even in a worst-case
        scenario where the entire API layer is compromised, an attacker cannot move assets on
        Canton without the legitimate party&apos;s cryptographic signature. This is a
        fundamentally stronger guarantee than smart contracts on public blockchains, where
        contract vulnerabilities can lead to unauthorized fund transfers.
      </Callout>

      <h2 id="input-validation">Input Validation</h2>
      <p>
        Every API endpoint validates its request body, query parameters, and path parameters
        using Zod schemas. These schemas are defined alongside the route handlers and enforce
        type safety, value ranges, and format requirements. Examples include:
      </p>
      <ul>
        <li>Amount fields must be positive decimals with a maximum precision of 18 decimal places.</li>
        <li>Address fields must match Canton party ID format.</li>
        <li>Enum fields (asset type, credit tier, order side) must be one of the allowed values.</li>
        <li>Pagination parameters are bounded to prevent resource exhaustion.</li>
      </ul>
      <p>
        Requests that fail validation receive a structured error response with field-level
        details, enabling clients to display meaningful error messages without exposing
        internal implementation details.
      </p>

      <h2 id="error-handling">Error Handling</h2>
      <p>
        The API uses a centralized error mapper (<code>error-mapper.ts</code>) that translates
        raw Canton errors, database errors, and internal exceptions into user-friendly error
        responses. Raw error details are logged to Sentry but never exposed to clients. This
        prevents information leakage that could aid an attacker in understanding the system&apos;s
        internal architecture.
      </p>
    </>
  );
}
