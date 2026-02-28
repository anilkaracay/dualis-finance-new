import { Callout } from '@/components/docs/Callout';

export default function SecuritiesLendingOverviewPage() {
  return (
    <>
      <span className="docs-badge">Securities Lending</span>
      <h1>Securities Lending Overview</h1>
      <p className="docs-subtitle">
        Institutional-grade securities lending on Canton Network, delivering
        instant settlement, full transparency, and dramatically lower costs.
      </p>

      {/* ── What Is Securities Lending ── */}
      <h2 id="what-is-securities-lending">What Is Securities Lending</h2>
      <p>
        Securities lending is the temporary transfer of financial instruments
        — equities, fixed income, ETFs, or tokenized real-world assets — from
        a lender to a borrower. The borrower posts collateral and pays a
        periodic fee for the duration of the loan. Traditionally, this market
        is dominated by custodian banks and prime brokers who intermediate
        every transaction, adding layers of cost, counterparty risk, and
        settlement delay.
      </p>
      <p>
        Dualis Finance reimagines securities lending as a peer-to-peer,
        on-chain marketplace built on Canton Network. By leveraging DAML smart
        contracts for atomic settlement and Canton&apos;s privacy sub-transaction
        model, Dualis enables institutions to lend and borrow securities
        directly — without a central intermediary — while maintaining full
        regulatory compliance and data confidentiality.
      </p>

      {/* ── TradFi vs Dualis ── */}
      <h2 id="tradfi-vs-dualis">Traditional vs. Dualis Comparison</h2>
      <p>
        The table below highlights the key structural differences between
        conventional securities lending and the Dualis on-chain model.
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Traditional</th>
              <th>Dualis Finance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Settlement</td>
              <td>T+2 (often T+3 cross-border)</td>
              <td>Instant atomic settlement</td>
            </tr>
            <tr>
              <td>Borrower Fees</td>
              <td>50 &ndash; 200 bps</td>
              <td>5 &ndash; 20 bps</td>
            </tr>
            <tr>
              <td>Market Access</td>
              <td>Large institutions with prime broker relationships</td>
              <td>Any verified institutional participant</td>
            </tr>
            <tr>
              <td>Transparency</td>
              <td>Opaque; bilateral OTC terms</td>
              <td>Full on-chain audit trail</td>
            </tr>
            <tr>
              <td>Counterparty Risk</td>
              <td>Relies on intermediary creditworthiness</td>
              <td>Smart-contract-enforced collateral</td>
            </tr>
            <tr>
              <td>Collateral Reuse</td>
              <td>Rehypothecation with limited visibility</td>
              <td>Programmable reuse with full traceability</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── High-Level Workflow ── */}
      <h2 id="workflow">High-Level Workflow</h2>
      <p>
        Every securities lending transaction on Dualis follows a six-stage
        lifecycle managed entirely by DAML smart contracts on Canton.
      </p>
      <ol>
        <li>
          <strong>Offer</strong> — A lender publishes an offer specifying the
          security, quantity, minimum collateral ratio, acceptable collateral
          types, and the lending fee rate. Offers are visible to all eligible
          counterparties on the platform.
        </li>
        <li>
          <strong>Match</strong> — A borrower accepts the offer or the Dualis
          matching engine pairs compatible offers and bids. The match creates
          a pending deal contract on Canton.
        </li>
        <li>
          <strong>Collateral Lock</strong> — The borrower&apos;s collateral is
          atomically locked into the deal contract. Collateral adequacy is
          validated against the lender&apos;s requirements and the borrower&apos;s
          credit tier parameters before the deal can activate.
        </li>
        <li>
          <strong>Active</strong> — The security is transferred to the
          borrower and the deal enters its active phase. Fees accrue
          continuously and collateral is monitored in real time. Margin calls
          are triggered automatically if the collateral ratio falls below the
          maintenance threshold.
        </li>
        <li>
          <strong>Return</strong> — The borrower returns the equivalent
          securities (fungible return). The smart contract verifies the
          returned quantity and quality before proceeding to settlement.
        </li>
        <li>
          <strong>Settle</strong> — Collateral is released to the borrower,
          accrued fees are distributed to the lender and protocol, and the
          deal contract is archived. Settlement is atomic — all legs execute
          in a single Canton transaction.
        </li>
      </ol>

      <Callout type="info" title="Atomic Settlement">
        Because Canton transactions are atomic and synchronised across all
        participants, there is zero settlement risk. Either every leg of the
        transaction succeeds, or the entire operation is rolled back.
      </Callout>

      {/* ── Supported Securities ── */}
      <h2 id="supported-securities">Supported Securities</h2>
      <p>
        Dualis supports lending across multiple asset classes, each
        represented as tokenized instruments on Canton Network:
      </p>
      <ul>
        <li>
          <strong>Equities</strong> — Tokenized shares of publicly listed
          companies, including fractional positions.
        </li>
        <li>
          <strong>Fixed Income</strong> — Government and corporate bonds with
          automated coupon handling.
        </li>
        <li>
          <strong>ETFs</strong> — Exchange-traded fund units with real-time
          NAV-based collateral valuation.
        </li>
        <li>
          <strong>Tokenized RWAs</strong> — Real-world assets such as
          trade finance receivables, structured products, and commodity-backed
          tokens.
        </li>
      </ul>

      <Callout type="tip" title="Credit Tier Integration">
        A participant&apos;s credit tier directly impacts the collateral
        requirements and fee rates available in securities lending. Higher
        tiers unlock lower fees and reduced collateral ratios. See the{' '}
        <a href="/docs/credit/tiers">Credit Tiers</a> documentation for
        details.
      </Callout>

      {/* ── Next Steps ── */}
      <h2 id="next-steps">Next Steps</h2>
      <p>
        Continue to the following sections for a deeper dive into the
        securities lending module:
      </p>
      <ul>
        <li>
          <a href="/docs/securities-lending/mechanics">Marketplace Mechanics</a>{' '}
          — offer creation, matching logic, and deal lifecycle details.
        </li>
        <li>
          <a href="/docs/securities-lending/fees">Fee Structure</a>{' '}
          — borrower fees, protocol share, and volume-based tiers.
        </li>
        <li>
          <a href="/docs/securities-lending/netting">Netting &amp; Settlement</a>{' '}
          — automated bilateral netting and batch processing.
        </li>
      </ul>
    </>
  );
}
