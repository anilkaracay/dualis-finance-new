'use client';

import { Callout } from '@/components/docs/Callout';

export default function ContactPage() {
  return (
    <>
      <h1>Contact</h1>
      <p className="docs-lead">
        Get in touch with the Dualis Finance team for general inquiries, security reports,
        partnership discussions, or technical support.
      </p>

      <h2 id="contact-channels">Contact Channels</h2>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Contact</th>
              <th>Use For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>General Inquiries</strong></td>
              <td>
                <a href="mailto:info@cayvox.com" style={{ color: 'var(--docs-accent)' }}>
                  info@cayvox.com
                </a>
              </td>
              <td>
                Partnership inquiries, institutional onboarding, business development,
                media requests, and general questions about Dualis Finance.
              </td>
            </tr>
            <tr>
              <td><strong>Security</strong></td>
              <td>
                <a href="mailto:security@cayvox.com" style={{ color: 'var(--docs-accent)' }}>
                  security@cayvox.com
                </a>
              </td>
              <td>
                Security vulnerability reports, bug bounty submissions, and responsible
                disclosure. See the{' '}
                <a href="/docs/security/bug-bounty" style={{ color: 'var(--docs-accent)' }}>
                  Bug Bounty
                </a>{' '}
                page for reporting guidelines.
              </td>
            </tr>
            <tr>
              <td><strong>Protocol Website</strong></td>
              <td>
                <a
                  href="https://dualis.finance"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--docs-accent)' }}
                >
                  dualis.finance
                </a>
              </td>
              <td>
                Protocol landing page, application access, and documentation.
              </td>
            </tr>
            <tr>
              <td><strong>Company Website</strong></td>
              <td>
                <a
                  href="https://cayvox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--docs-accent)' }}
                >
                  cayvox.com
                </a>
              </td>
              <td>
                Cayvox Labs corporate site. Information about the team, company mission,
                and other products.
              </td>
            </tr>
            <tr>
              <td><strong>GitHub</strong></td>
              <td>
                <a
                  href="https://github.com/cayvox/dualis-finance"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--docs-accent)' }}
                >
                  github.com/cayvox/dualis-finance
                </a>
              </td>
              <td>
                Source code, issue tracking, feature requests, and technical discussions.
                Open issues for bugs or submit pull requests for contributions.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="security-reports">Security Reports</h2>
      <p>
        If you have discovered a security vulnerability, please do not open a public GitHub issue.
        Instead, email{' '}
        <a href="mailto:security@cayvox.com" style={{ color: 'var(--docs-accent)' }}>
          security@cayvox.com
        </a>{' '}
        directly with details of the vulnerability, reproduction steps, and your severity
        assessment. The security team will acknowledge your report within 48 hours. For full
        details on scope, severity levels, and the responsible disclosure policy, refer to the{' '}
        <a href="/docs/security/bug-bounty" style={{ color: 'var(--docs-accent)' }}>
          Bug Bounty Program
        </a>{' '}
        documentation.
      </p>

      <Callout type="warning" title="Do Not Disclose Publicly">
        Never share security vulnerability details on public channels including GitHub issues,
        social media, or community forums. Always use the private security email for initial
        reporting. Public disclosure before remediation puts users at risk.
      </Callout>

      <h2 id="institutional-inquiries">Institutional Inquiries</h2>
      <p>
        Institutions interested in using Dualis Finance for treasury management, securities
        lending, or collateral optimization should contact{' '}
        <a href="mailto:info@cayvox.com" style={{ color: 'var(--docs-accent)' }}>
          info@cayvox.com
        </a>{' '}
        with the subject line &quot;Institutional Inquiry&quot;. Please include your organization
        name, use case description, and estimated volume. The team will schedule a technical
        walkthrough and discuss onboarding requirements.
      </p>

      <h2 id="developer-support">Developer Support</h2>
      <p>
        For technical questions about integrating with the Dualis API, SDK, or smart contracts,
        the best channel is the GitHub repository. Open an issue with the &quot;question&quot;
        label for general technical inquiries, or the &quot;bug&quot; label if you have
        encountered unexpected behavior. The API reference documentation, SDK guides, and
        smart contract reference in this documentation site cover the full integration surface.
      </p>

      <h2 id="built-by">Built by Cayvox Labs</h2>
      <p>
        Dualis Finance is designed and engineered by{' '}
        <a
          href="https://cayvox.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--docs-accent)' }}
        >
          Cayvox Labs
        </a>
        , a fintech engineering studio focused on institutional DeFi infrastructure for the
        Canton Network. Cayvox Labs builds protocol-level software for regulated financial
        markets, combining deep expertise in financial engineering with modern full-stack
        development.
      </p>
    </>
  );
}
