import { Callout } from '@/components/docs/Callout';

export default function SecuritiesLendingFeesPage() {
  return (
    <>
      <span className="docs-badge">Securities Lending</span>
      <h1>Fee Structure</h1>
      <p className="docs-subtitle">
        Transparent, competitive fee structure for securities lending on
        Dualis Finance, with volume-based tiers that reward active
        participants.
      </p>

      {/* ── Fee Overview ── */}
      <h2 id="fee-overview">Fee Overview</h2>
      <p>
        Securities lending fees on Dualis range from <strong>5 to 20 basis
        points</strong> annualised, paid by the borrower to the lender. This
        represents a 70&ndash;97% reduction compared to traditional prime
        brokerage fees of 50&ndash;200 basis points. The dramatic cost
        reduction is made possible by eliminating intermediaries, automating
        settlement through DAML smart contracts, and removing the operational
        overhead of manual reconciliation.
      </p>
      <p>
        Fees accrue continuously on a per-second basis throughout the
        duration of the loan. The accrual is computed using the protocol&apos;s
        interest index, ensuring precision and consistency across all
        active deals. Accrued fees are settled atomically when the loan
        terminates.
      </p>

      {/* ── Fee Distribution ── */}
      <h2 id="fee-distribution">Fee Distribution</h2>
      <p>
        The borrower&apos;s fee is split between the lender and the protocol
        according to the following structure:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Share</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Lender</td>
              <td>95%</td>
              <td>Compensation for providing the security</td>
            </tr>
            <tr>
              <td>Protocol Treasury</td>
              <td>5%</td>
              <td>Funds protocol development, insurance reserves, and DUAL staking rewards</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="Protocol Fee Governance">
        The 5% protocol fee share is a governance-controlled parameter. DUAL
        token holders may propose adjustments through the governance process.
        The protocol fee can range from 2% to 10% based on governance votes.
      </Callout>

      {/* ── Comparison vs TradFi ── */}
      <h2 id="comparison">Comparison with Traditional Prime Brokers</h2>
      <p>
        Traditional securities lending involves multiple intermediaries, each
        taking a cut of the transaction. The following comparison illustrates
        the cost advantage of the Dualis model:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Cost Component</th>
              <th>Traditional</th>
              <th>Dualis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Borrower fee (annualised)</td>
              <td>50 &ndash; 200 bps</td>
              <td>5 &ndash; 20 bps</td>
            </tr>
            <tr>
              <td>Intermediary take rate</td>
              <td>35 &ndash; 50% of gross fee</td>
              <td>5% protocol fee only</td>
            </tr>
            <tr>
              <td>Settlement costs</td>
              <td>Per-trade clearing and custody fees</td>
              <td>Included in protocol fee</td>
            </tr>
            <tr>
              <td>Reconciliation</td>
              <td>Manual, daily or weekly</td>
              <td>Automatic, real-time on-chain</td>
            </tr>
            <tr>
              <td>Fail costs (T+2 fails)</td>
              <td>Penalty fees + opportunity cost</td>
              <td>Zero (atomic settlement)</td>
            </tr>
            <tr>
              <td>Lender net yield</td>
              <td>50 &ndash; 65% of gross fee</td>
              <td>95% of gross fee</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        For a lender earning 20 bps on a $100M loan, the traditional model
        delivers approximately $100K&ndash;$130K net after intermediary fees.
        On Dualis, the same loan delivers $190K net — a 46&ndash;90%
        increase in lender yield.
      </p>

      {/* ── Volume-Based Tiers ── */}
      <h2 id="volume-tiers">Volume-Based Fee Tiers</h2>
      <p>
        Active participants benefit from volume-based fee discounts. The
        discount applies to the protocol&apos;s 5% share, effectively reducing
        the total cost for high-volume traders:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Monthly Volume (USD)</th>
              <th>Protocol Fee Share</th>
              <th>Effective Discount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>&lt; $10M</td>
              <td>5.0%</td>
              <td>None (standard)</td>
            </tr>
            <tr>
              <td>$10M &ndash; $50M</td>
              <td>4.0%</td>
              <td>20% reduction</td>
            </tr>
            <tr>
              <td>$50M &ndash; $250M</td>
              <td>3.0%</td>
              <td>40% reduction</td>
            </tr>
            <tr>
              <td>$250M &ndash; $1B</td>
              <td>2.5%</td>
              <td>50% reduction</td>
            </tr>
            <tr>
              <td>&gt; $1B</td>
              <td>2.0%</td>
              <td>60% reduction</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Volume is calculated on a rolling 30-day basis across all securities
        lending activity for a given participant. The tier is evaluated at
        the start of each deal and locked for the deal&apos;s duration.
      </p>

      <Callout type="tip" title="Credit Tier Synergy">
        Volume-based fee tiers compound with credit tier benefits. A Diamond
        tier participant trading over $1B monthly benefits from both the
        credit-tier rate discount and the lowest protocol fee share,
        maximising cost efficiency.
      </Callout>

      {/* ── Fee Settlement ── */}
      <h2 id="fee-settlement">Fee Settlement</h2>
      <p>
        Fees are settled in the denomination currency of the loan (typically
        USDC or Canton Coin). Settlement occurs atomically alongside the
        collateral release when the deal closes. For long-duration loans,
        periodic fee settlements can be configured at weekly or monthly
        intervals, debited automatically from the borrower&apos;s collateral
        buffer.
      </p>
      <p>
        All fee calculations, distributions, and settlements are recorded
        on-chain, providing a complete and auditable trail for regulatory
        reporting and reconciliation purposes.
      </p>
    </>
  );
}
