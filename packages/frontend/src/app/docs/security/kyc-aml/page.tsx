'use client';

import { Callout } from '@/components/docs/Callout';

export default function KycAmlPage() {
  return (
    <>
      <h1>KYC / AML Compliance</h1>
      <p className="docs-lead">
        Dualis Finance integrates identity verification and transaction screening to meet
        regulatory requirements for both retail and institutional participants. The compliance
        stack combines Sumsub for KYC/KYB verification and Chainalysis for transfer screening.
      </p>

      <h2 id="overview">Compliance Overview</h2>
      <p>
        As an institutional-grade lending protocol on the Canton Network, Dualis operates in a
        regulatory environment that demands robust identity verification and anti-money laundering
        controls. The compliance architecture is designed to be proportional -- lighter
        requirements for retail users with limited access, and comprehensive verification for
        institutional participants with full protocol capabilities.
      </p>

      <h2 id="sumsub-integration">Sumsub KYC/KYB Integration</h2>
      <p>
        Dualis uses Sumsub as its identity verification provider. Sumsub handles document
        verification, liveness checks, and sanctions screening for both individual (KYC) and
        business (KYB) onboarding flows.
      </p>
      <ul>
        <li>
          <strong>Frontend widget:</strong> The Sumsub Web SDK is embedded directly in the Dualis
          frontend. Users complete identity verification within the application without being
          redirected to external sites. The widget handles document capture, selfie verification,
          and liveness detection.
        </li>
        <li>
          <strong>Backend webhooks:</strong> Sumsub sends verification results to the Dualis API
          via authenticated webhooks. The API processes these events to update user verification
          status, assign compliance tiers, and unlock protocol features based on verification
          level.
        </li>
        <li>
          <strong>Document types:</strong> Supported documents include government-issued ID
          (passport, national ID, driver&apos;s license), proof of address (utility bill, bank
          statement), and for KYB -- articles of incorporation, shareholder registry, and UBO
          declarations.
        </li>
      </ul>

      <Callout type="info" title="Data Handling">
        Dualis does not store identity documents or biometric data. All sensitive verification
        data is processed and stored by Sumsub in compliance with GDPR and relevant data
        protection regulations. The Dualis database stores only the verification status,
        assigned tier, and a reference ID for audit purposes.
      </Callout>

      <h2 id="chainalysis">Chainalysis Transfer Screening</h2>
      <p>
        All transfers into and out of the Dualis protocol are screened using Chainalysis KYT
        (Know Your Transaction). This real-time screening service identifies transactions
        associated with sanctioned entities, darknet markets, ransomware, and other illicit
        activity.
      </p>
      <ul>
        <li>
          <strong>Inbound screening:</strong> Deposits are checked against Chainalysis risk
          scores before being credited to user accounts. High-risk transfers are flagged for
          manual review by the compliance team.
        </li>
        <li>
          <strong>Outbound screening:</strong> Withdrawals are screened against sanctions lists
          and known illicit addresses. Transfers to flagged addresses are blocked and reported.
        </li>
        <li>
          <strong>Continuous monitoring:</strong> Existing positions are periodically rescreened
          as Chainalysis updates its risk intelligence. Addresses that become associated with
          illicit activity after initial screening are flagged for review.
        </li>
      </ul>

      <h2 id="compliance-tiers">Compliance Tiers</h2>
      <p>
        Dualis implements a tiered compliance model that matches verification requirements to
        protocol access levels:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Verification</th>
              <th>Access</th>
              <th>Limits</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Retail Basic</strong></td>
              <td>Email + wallet connection</td>
              <td>Supply only, crypto collateral</td>
              <td>Capped supply amount per pool</td>
            </tr>
            <tr>
              <td><strong>Retail Verified</strong></td>
              <td>Sumsub KYC (ID + liveness)</td>
              <td>Supply, borrow, all collateral types</td>
              <td>Standard position limits</td>
            </tr>
            <tr>
              <td><strong>Institutional</strong></td>
              <td>Sumsub KYB + enhanced due diligence</td>
              <td>Full protocol access including securities lending</td>
              <td>Custom limits based on credit assessment</td>
            </tr>
            <tr>
              <td><strong>Institutional Prime</strong></td>
              <td>KYB + credit attestation + legal agreement</td>
              <td>Under-collateralized lending, prime brokerage features</td>
              <td>Negotiated limits with credit-tier-based parameters</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="dual-track">Dual-Track Architecture</h2>
      <p>
        The protocol&apos;s dual-track design separates retail and institutional access paths.
        Retail users can access basic supply functionality with minimal verification, while
        institutional features such as securities lending, under-collateralized borrowing, and
        higher position limits require comprehensive KYB and credit assessment.
      </p>
      <p>
        This approach balances regulatory compliance with user accessibility. A retail user
        exploring DeFi lending on Canton can get started quickly, while an institutional treasury
        desk undergoes the thorough verification process their regulators expect.
      </p>

      <Callout type="warning" title="Jurisdictional Restrictions">
        Dualis Finance may not be available in all jurisdictions. Users from sanctioned countries
        or regions with explicit prohibitions on digital asset lending are blocked at the
        verification stage. The list of restricted jurisdictions is maintained and updated based
        on applicable sanctions regimes.
      </Callout>
    </>
  );
}
