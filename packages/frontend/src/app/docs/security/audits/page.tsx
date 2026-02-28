'use client';

import { Callout } from '@/components/docs/Callout';

export default function AuditsPage() {
  return (
    <>
      <h1>Security Audits</h1>
      <p className="docs-lead">
        Security auditing is a critical milestone on the path to mainnet. Dualis Finance has
        completed internal security hardening across all protocol layers and is preparing for
        external audit engagement ahead of the mainnet launch.
      </p>

      <h2 id="current-status">Current Status</h2>
      <p>
        As of the current development phase, Dualis has completed comprehensive internal security
        hardening across the full stack. This includes systematic review of all DAML smart
        contracts, API endpoint security, frontend input handling, and infrastructure
        configuration. The protocol is deployed on Canton devnet, where all DeFi operations --
        supply, withdraw, borrow, repay, add collateral, and liquidation -- have been tested
        end-to-end.
      </p>

      <Callout type="warning" title="Pre-Audit Stage">
        Dualis Finance has not yet undergone a formal external security audit. The protocol is
        currently on Canton devnet. An external audit is a prerequisite for mainnet deployment
        and is planned for Q1-Q2 2026.
      </Callout>

      <h2 id="hardening-completed">Security Hardening Completed</h2>
      <p>
        The following security measures have been implemented and tested internally:
      </p>
      <ul>
        <li>
          <strong>DAML contract review:</strong> All 38 contract templates across 25 modules
          reviewed for signatory correctness, observer scope, choice authorization, and state
          transition integrity.
        </li>
        <li>
          <strong>API security:</strong> Rate limiting, Helmet headers, CORS policy, CSRF
          protection, and Zod schema validation deployed across all 272 endpoints.
        </li>
        <li>
          <strong>Authentication:</strong> JWT token lifecycle, bcrypt password hashing, refresh
          token rotation, and session management reviewed and hardened.
        </li>
        <li>
          <strong>Input validation:</strong> Zod schemas enforce strict type and range checking
          on all request payloads. Fuzz testing performed on critical financial endpoints.
        </li>
        <li>
          <strong>Error handling:</strong> Centralized error mapper prevents information leakage.
          Raw Canton and database errors are logged internally but never exposed to clients.
        </li>
        <li>
          <strong>Infrastructure:</strong> Docker containers run with minimal privileges. TLS 1.3
          enforced on all external connections. Canton participant access restricted to Docker
          internal network.
        </li>
        <li>
          <strong>Financial math:</strong> 230+ unit tests in the shared package validate interest
          rate calculations, health factor computation, liquidation thresholds, and accrual logic.
        </li>
      </ul>

      <h2 id="planned-audit">Planned External Audit</h2>
      <p>
        An external security audit is planned for the Q1-Q2 2026 timeframe, prior to mainnet
        deployment. The audit will be conducted by a reputable blockchain security firm with
        experience in both DAML/Canton and TypeScript/Node.js application security.
      </p>

      <h2 id="audit-scope">Audit Scope</h2>
      <p>
        The external audit will cover four primary areas:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Scope</th>
              <th>Focus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>DAML Smart Contracts</strong></td>
              <td>25 modules, 38 templates</td>
              <td>
                Signatory/observer correctness, choice authorization, state machine integrity,
                interest calculation accuracy, liquidation logic, governance execution safety
              </td>
            </tr>
            <tr>
              <td><strong>API Layer</strong></td>
              <td>272 endpoints, middleware chain</td>
              <td>
                Authentication bypass, authorization escalation, input validation completeness,
                rate limiting effectiveness, CSRF/CORS configuration, error information leakage
              </td>
            </tr>
            <tr>
              <td><strong>Frontend</strong></td>
              <td>119 React components, 43 pages</td>
              <td>
                XSS vectors, sensitive data exposure in client state, wallet interaction security,
                client-side validation bypass paths
              </td>
            </tr>
            <tr>
              <td><strong>Infrastructure</strong></td>
              <td>Docker, Nginx, PostgreSQL, Redis</td>
              <td>
                Container isolation, network segmentation, TLS configuration, database access
                controls, Redis authentication, secret management
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="post-audit">Post-Audit Process</h2>
      <p>
        Once the external audit is complete, the following steps will be taken:
      </p>
      <ol>
        <li>
          All findings will be triaged by severity (Critical, High, Medium, Low, Informational).
        </li>
        <li>
          Critical and High severity findings will be remediated before mainnet deployment.
        </li>
        <li>
          Medium findings will be addressed in the first post-launch maintenance window.
        </li>
        <li>
          The full audit report will be published on the Dualis documentation site.
        </li>
        <li>
          A re-audit of remediated findings will confirm that fixes are effective.
        </li>
      </ol>

      <Callout type="info" title="Continuous Security">
        Security does not end with a single audit. Dualis will implement a continuous security
        program post-launch that includes regular penetration testing, dependency vulnerability
        scanning, and an ongoing bug bounty program to incentivize responsible disclosure from
        the security research community.
      </Callout>
    </>
  );
}
