'use client';

import { Callout } from '@/components/docs/Callout';

export default function BugBountyPage() {
  return (
    <>
      <h1>Bug Bounty Program</h1>
      <p className="docs-lead">
        Dualis Finance values the security research community and encourages responsible
        disclosure of vulnerabilities. This page outlines the scope, severity levels, and
        reporting process for our bug bounty program.
      </p>

      <h2 id="reporting">Reporting Vulnerabilities</h2>
      <p>
        If you have discovered a security vulnerability in Dualis Finance, please report it
        responsibly. Do not disclose the vulnerability publicly until it has been addressed.
      </p>
      <p>
        Send all vulnerability reports to:
      </p>
      <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>
        <a href="mailto:security@cayvox.com" style={{ color: 'var(--docs-accent)' }}>
          security@cayvox.com
        </a>
      </p>
      <p>
        Include the following information in your report:
      </p>
      <ul>
        <li>A clear description of the vulnerability and its potential impact.</li>
        <li>Step-by-step reproduction instructions.</li>
        <li>The affected component (DAML contracts, API, frontend, infrastructure).</li>
        <li>Any proof-of-concept code or screenshots that demonstrate the issue.</li>
        <li>Your assessment of the severity level (see below).</li>
      </ul>

      <Callout type="info" title="Response Time">
        The Dualis security team will acknowledge your report within 48 hours and provide an
        initial assessment within 5 business days. We will keep you informed of our progress
        as we investigate and remediate the issue.
      </Callout>

      <h2 id="scope">Scope</h2>
      <p>
        The bug bounty program covers the following components of the Dualis Finance protocol:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>In Scope</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>DAML Smart Contracts</strong></td>
              <td>Yes</td>
              <td>
                Signatory bypass, unauthorized choice exercise, interest calculation errors,
                liquidation logic flaws, state manipulation
              </td>
            </tr>
            <tr>
              <td><strong>API (Fastify)</strong></td>
              <td>Yes</td>
              <td>
                Authentication bypass, authorization escalation, injection attacks, rate limit
                bypass, sensitive data exposure
              </td>
            </tr>
            <tr>
              <td><strong>Frontend (Next.js)</strong></td>
              <td>Yes</td>
              <td>
                XSS, CSRF, open redirects, client-side logic that bypasses server validation,
                wallet interaction vulnerabilities
              </td>
            </tr>
            <tr>
              <td><strong>Infrastructure</strong></td>
              <td>Limited</td>
              <td>
                TLS misconfiguration, exposed services, Docker escape vectors. Note: denial of
                service attacks against infrastructure are out of scope.
              </td>
            </tr>
            <tr>
              <td><strong>Third-party services</strong></td>
              <td>No</td>
              <td>
                Vulnerabilities in Sumsub, Chainalysis, PartyLayer, or Canton itself should be
                reported to those providers directly.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="severity-levels">Severity Levels</h2>
      <p>
        Vulnerabilities are classified into four severity levels based on their potential impact
        on user funds, data integrity, and protocol operations:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Description</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style={{ color: '#ef4444' }}>Critical</strong></td>
              <td>Direct loss of user funds or complete protocol compromise</td>
              <td>
                Unauthorized asset transfer, DAML signatory bypass allowing fund drain,
                authentication bypass granting admin access
              </td>
            </tr>
            <tr>
              <td><strong style={{ color: '#f97316' }}>High</strong></td>
              <td>Significant financial impact or data breach</td>
              <td>
                Interest rate manipulation, incorrect liquidation thresholds, access to other
                users&apos; position data, privilege escalation to admin role
              </td>
            </tr>
            <tr>
              <td><strong style={{ color: '#eab308' }}>Medium</strong></td>
              <td>Limited financial impact or partial data exposure</td>
              <td>
                Rate limit bypass enabling resource exhaustion, information leakage in error
                responses, CSRF on non-critical state-changing endpoints
              </td>
            </tr>
            <tr>
              <td><strong style={{ color: '#22c55e' }}>Low</strong></td>
              <td>Minimal impact, best practice violations</td>
              <td>
                Missing security headers on non-sensitive pages, verbose error messages in
                development endpoints, minor UI rendering issues with security implications
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="responsible-disclosure">Responsible Disclosure Policy</h2>
      <p>
        Dualis Finance follows a responsible disclosure model to protect users while giving
        the security team adequate time to address vulnerabilities:
      </p>
      <ol>
        <li>
          <strong>Report privately:</strong> Send your findings to{' '}
          <a href="mailto:security@cayvox.com" style={{ color: 'var(--docs-accent)' }}>
            security@cayvox.com
          </a>. Do not post vulnerabilities on social media, GitHub issues, Discord, or any
          public forum.
        </li>
        <li>
          <strong>Allow remediation time:</strong> Give the Dualis team a reasonable timeframe
          (typically 90 days) to investigate, develop a fix, and deploy it before any public
          disclosure.
        </li>
        <li>
          <strong>Do not exploit:</strong> Do not use the vulnerability to access, modify, or
          delete data beyond what is necessary to demonstrate the issue. Do not interact with
          other users&apos; accounts or funds.
        </li>
        <li>
          <strong>Coordinated disclosure:</strong> Once the fix is deployed, the Dualis team
          will coordinate with the reporter on a joint disclosure that credits their contribution.
        </li>
      </ol>

      <Callout type="warning" title="Out of Scope">
        The following are explicitly out of scope: social engineering attacks against Dualis
        team members, denial of service attacks, spam or rate limiting tests against production
        infrastructure, and vulnerabilities in third-party dependencies that do not have a
        demonstrated impact on Dualis specifically.
      </Callout>

      <h2 id="recognition">Recognition</h2>
      <p>
        We believe in recognizing the contributions of security researchers who help make Dualis
        safer. With the reporter&apos;s consent, we will credit them in our security advisories
        and maintain a public Hall of Fame on this documentation site. Bounty rewards will be
        determined based on severity, quality of the report, and impact assessment.
      </p>
    </>
  );
}
