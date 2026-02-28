'use client';

import { Callout } from '@/components/docs/Callout';

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Architecture</h1>
      <p className="docs-lead">
        Canton provides sub-transaction privacy -- a model where each participant in a transaction
        sees only the parts of that transaction they are authorized to observe. This page explains
        how it works, why it matters for institutional lending, and how Dualis leverages it.
      </p>

      <h2 id="the-problem">The Problem with Public Ledgers</h2>
      <p>
        On Ethereum, every transaction is visible to every node in the network. When a lending
        protocol processes a borrow, every validator sees the borrower&apos;s address, the
        collateral amount, the loan size, and the interest rate. For retail DeFi, this
        transparency is considered a feature. For institutional finance, it is a disqualifier.
      </p>
      <p>
        Consider a scenario: a global investment bank wants to borrow $50 million against its
        tokenized Treasury holdings. On a public blockchain, every competitor, every counterparty,
        and every predatory trading algorithm would see this position in real time. The bank&apos;s
        trading strategy would be exposed. Its collateral portfolio would be public. If the
        position approached liquidation, front-runners would extract value before the bank could
        respond.
      </p>
      <p>
        This is why DTCC, Goldman Sachs, Euroclear, and LSEG chose Canton. Not because it is
        faster or cheaper, but because it provides privacy guarantees that public blockchains
        cannot.
      </p>

      <h2 id="sub-transaction-privacy">How Sub-Transaction Privacy Works</h2>
      <p>
        Canton&apos;s privacy model operates at the sub-transaction level. A single transaction
        may involve multiple contracts, multiple parties, and multiple state changes. Canton
        ensures that each participant receives only the views -- the specific sub-transactions --
        that they are stakeholders in.
      </p>
      <p>
        The mechanism is built on three concepts:
      </p>
      <ul>
        <li>
          <strong>Signatories:</strong> Parties who must explicitly authorize a contract&apos;s
          creation. They always see the full contract. In a Dualis lending pool, the protocol
          operator is the signatory of the pool contract.
        </li>
        <li>
          <strong>Observers:</strong> Parties who are granted visibility of a contract but do not
          need to authorize it. A supplier can observe the pool they deposited into, but not
          other suppliers&apos; positions.
        </li>
        <li>
          <strong>Stakeholders:</strong> The union of signatories and observers. Canton&apos;s
          synchronization protocol delivers transaction data only to stakeholders of the affected
          contracts.
        </li>
      </ul>
      <p>
        When a borrower takes a loan on Dualis, the transaction touches the lending pool contract,
        the borrower&apos;s position contract, and the collateral contract. The borrower sees
        their own position and the pool update. The protocol operator sees the full transaction for
        operational and compliance purposes. Other suppliers and borrowers in the same pool see
        nothing -- they only see their own positions and the aggregate pool state when they
        interact with it.
      </p>

      <Callout type="info" title="Participant-Level Enforcement">
        Privacy in Canton is enforced at the participant node level. The synchronization protocol
        uses encrypted, authenticated messages between participants. A participant physically
        cannot access transaction data for contracts where it is not a stakeholder, because that
        data is never transmitted to it.
      </Callout>

      <h2 id="comparison">Ethereum vs Canton: Privacy Comparison</h2>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Ethereum</th>
              <th>Canton</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Transaction visibility</td>
              <td>All transactions visible to all nodes</td>
              <td>Sub-transaction data visible only to stakeholders</td>
            </tr>
            <tr>
              <td>Position data</td>
              <td>Public -- any explorer can view</td>
              <td>Private -- only the position owner and protocol operator</td>
            </tr>
            <tr>
              <td>Collateral portfolio</td>
              <td>Fully transparent on-chain</td>
              <td>Visible only to the borrower and relevant counterparties</td>
            </tr>
            <tr>
              <td>Liquidation information</td>
              <td>Front-runnable by MEV bots</td>
              <td>Processed by authorized liquidators only</td>
            </tr>
            <tr>
              <td>Pool aggregates</td>
              <td>Derived from public contract state</td>
              <td>Published by the protocol; individual positions remain private</td>
            </tr>
            <tr>
              <td>Regulatory audit</td>
              <td>Auditors see everything (or nothing with ZK)</td>
              <td>Auditors granted observer rights on specific contracts</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="institutional-adoption">Why Institutions Chose This Model</h2>
      <p>
        The institutions building on Canton did not choose it arbitrarily. Each had specific
        privacy requirements that public blockchains could not satisfy:
      </p>
      <ul>
        <li>
          <strong>Goldman Sachs</strong> requires that its repo and lending positions remain
          confidential from competitors, while still being auditable by regulators.
        </li>
        <li>
          <strong>DTCC</strong> processes settlement for virtually every U.S. equity trade. The
          details of clearing and netting must remain between the clearing members and DTCC, not
          broadcast to the world.
        </li>
        <li>
          <strong>Euroclear</strong> handles cross-border bond settlement where multiple
          jurisdictions impose different data residency and confidentiality requirements.
          Canton&apos;s selective disclosure model satisfies all of them simultaneously.
        </li>
      </ul>

      <h2 id="dualis-privacy-model">Dualis Privacy Model</h2>
      <p>
        Dualis leverages Canton&apos;s privacy architecture through its DAML contract design.
        The <code>Dualis.Privacy.Config</code> module defines observer policies that control
        which parties can see which contract types. Key principles:
      </p>
      <ul>
        <li>
          <strong>Position isolation:</strong> A supplier&apos;s position is visible only to that
          supplier and the protocol operator. No other user can see individual position details.
        </li>
        <li>
          <strong>Pool aggregation:</strong> Pool-level metrics (total supply, total borrow,
          utilization rate) are published as aggregate data. Individual contributions are not
          disclosed.
        </li>
        <li>
          <strong>Credit confidentiality:</strong> A borrower&apos;s credit tier and attestation
          are visible only to the borrower, the credit oracle, and the protocol. Other
          participants cannot determine a borrower&apos;s creditworthiness.
        </li>
        <li>
          <strong>Selective regulatory access:</strong> The contract design supports adding
          regulators as observers on specific contract types, enabling compliance audits without
          exposing data to market participants.
        </li>
      </ul>

      <Callout type="tip" title="Privacy Without Compromise">
        Canton&apos;s privacy model does not sacrifice composability or auditability. Contracts
        from different applications can still interact atomically across synchronization domains,
        and regulators can be granted precisely scoped observer rights. This is privacy engineered
        for regulated markets, not privacy as an afterthought.
      </Callout>
    </>
  );
}
