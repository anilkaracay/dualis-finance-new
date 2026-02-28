import { Callout } from '@/components/docs/Callout';

export default function SecuritiesLendingNettingPage() {
  return (
    <>
      <span className="docs-badge">Securities Lending</span>
      <h1>Netting &amp; Settlement</h1>
      <p className="docs-subtitle">
        Automated bilateral netting and batch settlement mechanics that
        reduce capital requirements and streamline securities lending
        operations on Canton.
      </p>

      {/* ── What Is Netting ── */}
      <h2 id="what-is-netting">Automated Netting</h2>
      <p>
        Netting is the process of consolidating multiple bilateral
        obligations between two parties into a single net position. In
        traditional securities lending, netting is performed manually by
        operations teams, often on a T+1 or T+2 basis, creating settlement
        risk and tying up excess capital.
      </p>
      <p>
        Dualis automates netting entirely on-chain. When two participants
        hold offsetting positions — for example, Party A has lent AAPL
        shares to Party B, and Party B has separately lent MSFT shares to
        Party A — the protocol identifies these bilateral exposures and
        computes net obligations in real time.
      </p>

      <Callout type="info" title="Capital Efficiency">
        Automated netting typically reduces gross settlement volumes by
        40&ndash;70%, freeing collateral that can be deployed elsewhere in
        the protocol. This capital efficiency improvement is one of the
        primary advantages of on-chain securities lending.
      </Callout>

      {/* ── How It Works ── */}
      <h2 id="how-netting-works">How Netting Works</h2>
      <p>
        The Dualis netting engine operates in three phases:
      </p>
      <ol>
        <li>
          <strong>Exposure Aggregation</strong> — The engine scans all active
          deal contracts between a given pair of counterparties. For each
          security, it calculates the gross lend and borrow positions held by
          each party, including accrued but unsettled fees.
        </li>
        <li>
          <strong>Net Calculation</strong> — For each security, the engine
          computes the net obligation: if Party A has lent 1,000 shares and
          borrowed 400 shares of the same instrument from Party B, the net
          obligation is 600 shares from A to B. Fee obligations are similarly
          netted to a single cash flow direction.
        </li>
        <li>
          <strong>Netting Proposal</strong> — The engine generates a netting
          proposal contract on Canton. Both counterparties must approve the
          proposal (via DAML choice exercise) before the netting is executed.
          Once both parties approve, the individual deal contracts are
          archived and replaced with a single net position contract.
        </li>
      </ol>

      <Callout type="warning" title="Bilateral Approval">
        Netting is never unilateral. Both counterparties must explicitly
        approve the netting proposal. This ensures that neither party is
        disadvantaged by the consolidation and that both have reviewed the
        net positions.
      </Callout>

      {/* ── Settlement on Canton ── */}
      <h2 id="settlement-mechanics">Settlement Mechanics on Canton</h2>
      <p>
        Canton Network provides the ideal substrate for securities settlement
        due to its atomic transaction model and privacy guarantees. All
        settlement on Dualis leverages these properties:
      </p>
      <ul>
        <li>
          <strong>Atomic execution</strong> — Every settlement transaction
          is all-or-nothing. The security transfer, collateral release, and
          fee distribution all occur in a single Canton transaction. There
          are no partial settlements or failed legs.
        </li>
        <li>
          <strong>Instant finality</strong> — Settlement is confirmed as
          soon as the Canton transaction is committed. There is no
          pending state, no clearing queue, and no reliance on end-of-day
          batch processes.
        </li>
        <li>
          <strong>Privacy preservation</strong> — Canton&apos;s sub-transaction
          privacy model ensures that only the counterparties involved in a
          deal can see the deal terms. Other network participants cannot
          observe the securities, quantities, or fees involved.
        </li>
        <li>
          <strong>Regulatory auditability</strong> — Despite the privacy
          model, authorised regulators can be granted observer rights on
          specific contracts, enabling supervisory oversight without
          compromising participant confidentiality.
        </li>
      </ul>

      {/* ── Batch Processing ── */}
      <h2 id="batch-processing">Batch Processing</h2>
      <p>
        While individual deals settle instantly upon termination, Dualis
        also supports batch processing for participants managing large
        portfolios with high deal volumes. Batch processing is particularly
        useful for:
      </p>
      <ul>
        <li>
          <strong>End-of-day netting cycles</strong> — Participants can
          schedule daily netting runs that aggregate all bilateral positions
          accumulated during the trading day and settle them in a single
          batch.
        </li>
        <li>
          <strong>Fee settlements</strong> — Rather than settling fees on
          each deal individually, participants can opt for batch fee
          settlement on a configurable schedule (daily, weekly, or monthly).
        </li>
        <li>
          <strong>Collateral rebalancing</strong> — Batch processing enables
          efficient rebalancing of collateral across multiple active deals,
          optimising capital allocation without triggering individual
          margin calls.
        </li>
      </ul>

      <p>
        Batch operations are submitted as a single Canton transaction
        containing multiple DAML choice exercises. The atomic nature of
        Canton transactions guarantees that either all operations in the
        batch succeed, or none do.
      </p>

      {/* ── Netting Frequency ── */}
      <h2 id="netting-frequency">Netting Frequency and Configuration</h2>
      <p>
        Participants can configure their netting preferences at the
        organisational level:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Mode</th>
              <th>Frequency</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Real-time</td>
              <td>Continuous</td>
              <td>Active traders seeking maximum capital efficiency</td>
            </tr>
            <tr>
              <td>Scheduled</td>
              <td>Daily / Weekly</td>
              <td>Portfolio managers with predictable settlement patterns</td>
            </tr>
            <tr>
              <td>Manual</td>
              <td>On-demand</td>
              <td>Participants preferring full control over netting timing</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="Operational Integration">
        The Dualis API exposes netting proposal and settlement endpoints,
        enabling participants to integrate netting operations directly into
        their existing treasury and operations systems. See the{' '}
        <a href="/docs/developers/api-reference">API Reference</a> for
        endpoint details.
      </Callout>
    </>
  );
}
