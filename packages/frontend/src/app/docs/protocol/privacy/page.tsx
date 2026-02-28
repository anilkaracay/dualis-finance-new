'use client';

import { Callout } from '@/components/docs/Callout';

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Model</h1>
      <p className="docs-lead">
        Dualis Finance leverages Canton Network&apos;s sub-transaction privacy to offer
        institutional-grade confidentiality that is impossible on transparent blockchains.
        The protocol provides three configurable privacy levels, allowing participants to
        balance transparency, regulatory compliance, and competitive confidentiality
        according to their requirements.
      </p>

      <h2 id="canton-privacy">Canton Sub-Transaction Privacy</h2>
      <p>
        Unlike Ethereum, Solana, and other public blockchains where every transaction is
        visible to all network participants, Canton implements privacy at the protocol
        level through a concept called <strong>sub-transaction privacy</strong>.
      </p>
      <p>
        In Canton, a transaction can consist of multiple sub-transactions, and each
        sub-transaction is only visible to the parties that are directly involved in it.
        A party that is not a stakeholder in a particular sub-transaction cannot see its
        contents, cannot infer its existence, and cannot correlate it with other
        sub-transactions in the same top-level transaction.
      </p>
      <p>
        This is not an application-layer privacy layer or a zero-knowledge proof system.
        It is a fundamental property of the Canton ledger model: the synchronization
        protocol itself ensures that data is only distributed to parties who need it.
        There is no global state that any node can observe.
      </p>

      <Callout type="info" title="Privacy by Default">
        Canton&apos;s privacy model is not opt-in. Every transaction on Canton is private
        by default. Only the counterparties to a specific contract or transaction can see
        its details. Dualis Finance builds on this foundation to offer additional,
        configurable privacy controls.
      </Callout>

      <h2 id="privacy-levels">Three Privacy Levels</h2>
      <p>
        Dualis Finance provides three privacy levels that participants can configure per
        position or per account. Each level offers a different balance of confidentiality
        and transparency:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th>Position Details</th>
              <th>Transaction History</th>
              <th>Identity</th>
              <th>Analytics Inclusion</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Standard</strong></td>
              <td>Visible to counterparties and protocol</td>
              <td>Visible to counterparties and protocol</td>
              <td>Pseudonymous (Canton party ID)</td>
              <td>Included in aggregate pool statistics</td>
              <td>Retail users, public funds, transparent institutions</td>
            </tr>
            <tr>
              <td><strong>Enhanced</strong></td>
              <td>Visible only to direct counterparties</td>
              <td>Visible only to the position holder</td>
              <td>Shielded party ID with alias</td>
              <td>Excluded from granular analytics; included in aggregates only</td>
              <td>Hedge funds, asset managers, proprietary trading desks</td>
            </tr>
            <tr>
              <td><strong>Full</strong></td>
              <td>Encrypted; visible only to position holder and settlement engine</td>
              <td>Encrypted; visible only to position holder</td>
              <td>Fully shielded; no linkable identifier</td>
              <td>Excluded from all analytics</td>
              <td>Central banks, sovereign wealth funds, sensitive institutional operations</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Standard Privacy</h3>
      <p>
        Standard privacy is the default level. Positions and transactions are visible to
        the protocol and direct counterparties, but not to the broader network. This
        provides a significant improvement over public blockchains while maintaining
        enough transparency for regulatory reporting and basic counterparty due diligence.
      </p>

      <h3>Enhanced Privacy</h3>
      <p>
        Enhanced privacy restricts visibility further. Transaction history is hidden from
        all parties except the position holder, and the party identity is shielded behind
        an alias. This prevents other market participants from analyzing trading patterns,
        inferring position sizes, or front-running large orders.
      </p>

      <h3>Full Privacy</h3>
      <p>
        Full privacy provides the maximum level of confidentiality. Position details are
        encrypted and only accessible to the position holder and the settlement engine
        (which requires access to validate transactions). There is no externally linkable
        identifier, and the position is excluded from all analytics, including aggregate
        pool statistics.
      </p>

      <Callout type="warning" title="Regulatory Compliance">
        Even at Full privacy, the protocol retains the ability to disclose information
        to regulators through a governed compliance process. Canton&apos;s privacy model
        supports regulatory disclosure without compromising the privacy of other
        participants. This is achieved through Canton&apos;s divulgence mechanism, which
        allows selective disclosure to authorized parties.
      </Callout>

      <h2 id="comparison">Privacy Comparison: Dualis vs. Public Chains</h2>
      <p>
        To understand the significance of Canton&apos;s privacy model, consider how Dualis
        compares to lending protocols on public blockchains:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Privacy Aspect</th>
              <th>Ethereum / Solana (Aave, Compound)</th>
              <th>Dualis on Canton</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Transaction visibility</td>
              <td>Every transaction visible to all nodes and block explorers</td>
              <td>Transactions visible only to involved parties</td>
            </tr>
            <tr>
              <td>Position sizes</td>
              <td>Anyone can query any address&apos;s supply, borrow, and collateral</td>
              <td>Position details visible only per privacy level</td>
            </tr>
            <tr>
              <td>Liquidation exposure</td>
              <td>Health factors publicly observable; MEV bots compete to liquidate</td>
              <td>Health factors private; liquidation executed by authorized bots only</td>
            </tr>
            <tr>
              <td>Trading patterns</td>
              <td>Full on-chain history enables pattern analysis and front-running</td>
              <td>Transaction history shielded at Enhanced and Full levels</td>
            </tr>
            <tr>
              <td>Identity linkage</td>
              <td>Wallet addresses linkable through on-chain analysis</td>
              <td>Party IDs shielded; no cross-transaction linkability at Full level</td>
            </tr>
            <tr>
              <td>Regulatory access</td>
              <td>Open access (no special mechanism needed)</td>
              <td>Governed disclosure through Canton divulgence</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="why-institutions-need-privacy">Why Institutions Need Privacy</h2>
      <p>
        Privacy is not merely a preference for institutional participants &mdash; it is a
        regulatory and competitive requirement:
      </p>
      <ul>
        <li>
          <strong>Fiduciary duty:</strong> Asset managers and fund administrators have a
          legal obligation to protect client portfolio information. Public blockchains
          make this impossible, which is a primary reason institutional adoption of DeFi
          has been limited.
        </li>
        <li>
          <strong>Market impact:</strong> When a large institution&apos;s positions are
          publicly visible, other market participants can front-run their trades, copy
          their strategies, or deliberately move prices against them. This creates direct
          financial harm.
        </li>
        <li>
          <strong>Competitive intelligence:</strong> In securities lending and institutional
          borrowing, the terms and sizes of positions represent valuable competitive
          information. Public exposure of this data undermines negotiating leverage.
        </li>
        <li>
          <strong>Regulatory compliance:</strong> Regulations such as MiFID II, GDPR, and
          banking secrecy laws in various jurisdictions require that client financial data
          be kept confidential. A blockchain that exposes this data by design is
          incompatible with these requirements.
        </li>
        <li>
          <strong>MEV protection:</strong> On public chains, Maximal Extractable Value
          (MEV) bots extract value from ordinary users by reordering, inserting, or
          censoring transactions. Canton&apos;s privacy model eliminates this attack
          vector entirely because pending transactions are not visible to third parties.
        </li>
      </ul>

      <Callout type="tip" title="Configurable Per Position">
        Privacy levels can be set per position, not just per account. An institution could
        maintain a Standard-privacy supply position (for transparency reporting) alongside
        a Full-privacy borrow position (to protect trading strategy details). This
        granularity is unique to the Dualis protocol.
      </Callout>
    </>
  );
}
