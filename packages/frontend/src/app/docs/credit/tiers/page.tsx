import { Callout } from '@/components/docs/Callout';

export default function CreditTiersPage() {
  return (
    <>
      <span className="docs-badge">Credit System</span>
      <h1>Credit Tiers</h1>
      <p className="docs-subtitle">
        Five credit tiers that determine borrowing capacity, interest rate
        discounts, collateral requirements, and liquidation parameters for
        every participant on Dualis Finance.
      </p>

      {/* ── Tier Overview ── */}
      <h2 id="tier-overview">Tier Overview</h2>
      <p>
        Every participant on Dualis is assigned to one of five credit tiers
        based on their composite credit score. Tiers are not merely labels —
        they directly govern the financial parameters of every lending,
        borrowing, and securities lending interaction on the protocol. Higher
        tiers unlock more favourable terms, reflecting the lower
        counterparty risk associated with well-established participants.
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Score Range</th>
              <th>Max LTV</th>
              <th>Rate Discount</th>
              <th>Min Collateral Ratio</th>
              <th>Liquidation Buffer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Diamond</td>
              <td>850 &ndash; 1000</td>
              <td>0.85</td>
              <td>-25%</td>
              <td>1.15</td>
              <td>0.05</td>
            </tr>
            <tr>
              <td>Gold</td>
              <td>700 &ndash; 849</td>
              <td>0.78</td>
              <td>-15%</td>
              <td>1.25</td>
              <td>0.08</td>
            </tr>
            <tr>
              <td>Silver</td>
              <td>500 &ndash; 699</td>
              <td>0.70</td>
              <td>-8%</td>
              <td>1.35</td>
              <td>0.10</td>
            </tr>
            <tr>
              <td>Bronze</td>
              <td>300 &ndash; 499</td>
              <td>0.60</td>
              <td>0%</td>
              <td>1.50</td>
              <td>0.12</td>
            </tr>
            <tr>
              <td>Unrated</td>
              <td>0 &ndash; 299</td>
              <td>0.50</td>
              <td>0%</td>
              <td>1.75</td>
              <td>0.15</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="Parameter Definitions">
        <strong>Max LTV</strong> is the maximum loan-to-value ratio permitted
        at origination. <strong>Min Collateral Ratio</strong> is the inverse
        maintenance threshold below which margin calls are triggered.{' '}
        <strong>Liquidation Buffer</strong> is the additional margin between
        the maintenance threshold and the liquidation trigger.
      </Callout>

      {/* ── Diamond ── */}
      <h2 id="diamond-tier">Diamond Tier (850&ndash;1000)</h2>
      <p>
        Diamond is the highest tier, reserved for participants with
        exceptional credit histories and verified off-chain standing. Diamond
        tier participants benefit from:
      </p>
      <ul>
        <li>
          <strong>25% interest rate discount</strong> — The most significant
          rate reduction, applied to all borrow positions across every pool.
        </li>
        <li>
          <strong>0.85 max LTV</strong> — Borrow up to 85% of collateral
          value, maximising capital efficiency.
        </li>
        <li>
          <strong>1.15 minimum collateral ratio</strong> — Maintain only 115%
          collateralisation before margin calls trigger.
        </li>
        <li>
          <strong>Under-collateralised lending access</strong> — Exclusive
          access to borrow facilities that require less than 100%
          collateral, subject to additional risk limits.
        </li>
        <li>
          <strong>Priority liquidation protection</strong> — A narrow 5%
          liquidation buffer means Diamond participants have the tightest
          spread between margin call and liquidation, reflecting the
          protocol&apos;s confidence in their creditworthiness.
        </li>
      </ul>

      {/* ── Gold ── */}
      <h2 id="gold-tier">Gold Tier (700&ndash;849)</h2>
      <p>
        Gold tier represents established participants with strong credit
        profiles. Benefits include:
      </p>
      <ul>
        <li>
          <strong>15% interest rate discount</strong> on all borrowing.
        </li>
        <li>
          <strong>0.78 max LTV</strong> — Borrow up to 78% of collateral
          value.
        </li>
        <li>
          <strong>1.25 minimum collateral ratio</strong> with an 8%
          liquidation buffer.
        </li>
        <li>
          <strong>Under-collateralised lending access</strong> — Limited
          access to under-collateralised facilities with stricter caps than
          Diamond.
        </li>
      </ul>

      {/* ── Silver ── */}
      <h2 id="silver-tier">Silver Tier (500&ndash;699)</h2>
      <p>
        Silver tier participants have demonstrated consistent protocol
        engagement and responsible borrowing behaviour:
      </p>
      <ul>
        <li>
          <strong>8% interest rate discount</strong> on all borrowing.
        </li>
        <li>
          <strong>0.70 max LTV</strong> with a <strong>1.35 minimum
          collateral ratio</strong>.
        </li>
        <li>
          10% liquidation buffer provides reasonable protection against
          short-term market volatility.
        </li>
        <li>
          Full access to all lending pools and securities lending features.
        </li>
      </ul>

      {/* ── Bronze ── */}
      <h2 id="bronze-tier">Bronze Tier (300&ndash;499)</h2>
      <p>
        Bronze tier applies to participants who are building their on-chain
        credit history:
      </p>
      <ul>
        <li>
          <strong>No rate discount</strong> — Standard protocol rates apply.
        </li>
        <li>
          <strong>0.60 max LTV</strong> with a <strong>1.50 minimum
          collateral ratio</strong>.
        </li>
        <li>
          12% liquidation buffer provides additional safety margin.
        </li>
        <li>
          Full access to standard lending pools. Securities lending
          participation may require additional collateral.
        </li>
      </ul>

      {/* ── Unrated ── */}
      <h2 id="unrated-tier">Unrated Tier (0&ndash;299)</h2>
      <p>
        New participants or those with insufficient history begin at the
        Unrated tier:
      </p>
      <ul>
        <li>
          <strong>No rate discount</strong> — Standard protocol rates apply.
        </li>
        <li>
          <strong>0.50 max LTV</strong> — The most conservative borrowing
          limit, requiring at least 200% collateralisation.
        </li>
        <li>
          <strong>1.75 minimum collateral ratio</strong> with a 15%
          liquidation buffer.
        </li>
        <li>
          Access to core lending pools only. Some advanced features require
          tier progression.
        </li>
      </ul>

      <Callout type="tip" title="Tier Progression">
        Participants can improve their tier by building on-chain history
        (loan completions, timely repayments, volume) and submitting
        zero-knowledge proofs of off-chain creditworthiness. Score updates
        occur in real-time based on protocol activity. See{' '}
        <a href="/docs/credit/scoring">Hybrid Credit Scoring</a> for
        details on how scores are calculated.
      </Callout>

      {/* ── Tier Transitions ── */}
      <h2 id="tier-transitions">Tier Transitions</h2>
      <p>
        Tier upgrades take effect immediately upon score recalculation and
        apply to all new positions opened after the transition. Existing
        positions retain their original tier parameters for stability.
      </p>
      <p>
        Tier downgrades include a 7-day grace period during which the
        participant retains their current tier benefits. This prevents
        short-term score fluctuations from triggering cascading margin calls
        or forced position adjustments.
      </p>

      <Callout type="warning" title="Downgrade Protection">
        If a participant&apos;s score drops below their current tier threshold,
        they receive a notification and have 7 days to restore their score.
        After the grace period, the downgrade applies to all new positions.
        Existing positions continue under their original tier parameters
        until they are closed or refinanced.
      </Callout>
    </>
  );
}
