import { Callout } from '@/components/docs/Callout';

export default function UndercollateralizedLendingPage() {
  return (
    <>
      <span className="docs-badge">Credit System</span>
      <h1>Under-Collateralized Lending</h1>
      <p className="docs-subtitle">
        How Diamond and Gold tier participants can access borrowing facilities
        that require less than 100% collateral, unlocking institutional-grade
        capital efficiency on Canton Network.
      </p>

      {/* ── Introduction ── */}
      <h2 id="introduction">Introduction</h2>
      <p>
        Over-collateralisation is the foundation of DeFi lending safety, but
        it is also its greatest limitation. Requiring 150&ndash;200%
        collateral locks up capital that institutions could otherwise deploy
        productively. Traditional finance solves this through credit
        relationships, but at the cost of opacity and counterparty risk.
      </p>
      <p>
        Dualis bridges these two worlds. Through the hybrid credit scoring
        system, participants who have demonstrated exceptional
        creditworthiness — Diamond and Gold tier — can access
        under-collateralised lending facilities. These facilities allow
        borrowing with less than 100% collateral, subject to rigorous risk
        controls and continuous monitoring.
      </p>

      <Callout type="warning" title="Restricted Access">
        Under-collateralised lending is available exclusively to Diamond tier
        (score 850&ndash;1000) and Gold tier (score 700&ndash;849)
        participants. Silver, Bronze, and Unrated tiers do not have access
        to these facilities.
      </Callout>

      {/* ── Eligibility ── */}
      <h2 id="eligibility">Eligibility Requirements</h2>
      <p>
        Beyond the tier score threshold, participants must meet additional
        eligibility criteria:
      </p>
      <ul>
        <li>
          <strong>Minimum protocol tenure</strong> — At least 90 days of
          active participation on Dualis, with a minimum of 10 completed
          loan cycles.
        </li>
        <li>
          <strong>Zero default history</strong> — No liquidation events or
          defaults in the preceding 180 days.
        </li>
        <li>
          <strong>KYC/AML verification</strong> — Full identity verification
          with enhanced due diligence (EDD) completed.
        </li>
        <li>
          <strong>Off-chain attestation</strong> — At least one valid
          zero-knowledge proof attesting to institutional credit standing
          (e.g., investment-grade rating, audited financial statements).
        </li>
      </ul>

      {/* ── Risk Framework ── */}
      <h2 id="risk-framework">Risk Framework</h2>
      <p>
        Under-collateralised lending introduces credit risk that does not
        exist in fully collateralised models. Dualis manages this risk
        through a multi-layered framework:
      </p>

      <h3>Exposure Limits</h3>
      <p>
        Each participant has a maximum under-collateralised exposure limit,
        determined by their credit tier and score:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Min Collateral Required</th>
              <th>Max Unsecured Exposure</th>
              <th>Per-Pool Cap</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Diamond</td>
              <td>50% of loan value</td>
              <td>$50M or 10% of pool TVL (whichever is lower)</td>
              <td>5% of individual pool</td>
            </tr>
            <tr>
              <td>Gold</td>
              <td>70% of loan value</td>
              <td>$20M or 5% of pool TVL (whichever is lower)</td>
              <td>3% of individual pool</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Insurance Reserve</h3>
      <p>
        A dedicated insurance reserve is funded by a surcharge on
        under-collateralised borrowing rates. This reserve covers potential
        losses from defaults. The surcharge is 2% of the base borrowing rate
        for Diamond and 4% for Gold, reflecting the differential risk
        profile.
      </p>

      <h3>Protocol-Level Caps</h3>
      <p>
        The total under-collateralised exposure across the entire protocol
        is capped at 15% of total value locked (TVL). This ensures that the
        protocol remains predominantly over-collateralised and that systemic
        risk from credit-based lending is bounded.
      </p>

      {/* ── Monitoring ── */}
      <h2 id="monitoring">Continuous Monitoring</h2>
      <p>
        Under-collateralised positions are subject to enhanced monitoring
        compared to standard positions:
      </p>
      <ul>
        <li>
          <strong>Real-time score tracking</strong> — The borrower&apos;s credit
          score is recalculated with every on-chain event. If the score
          drops below the tier threshold, a 48-hour cure period begins
          during which the borrower must either restore their score or
          post additional collateral to bring the position to standard
          collateralisation levels.
        </li>
        <li>
          <strong>Collateral mark-to-market</strong> — Even partial
          collateral is continuously marked to market. If collateral value
          declines below the minimum threshold, a margin call is triggered
          regardless of credit score.
        </li>
        <li>
          <strong>Concentration monitoring</strong> — The protocol tracks
          per-borrower and per-pool concentration to prevent any single
          participant from accumulating disproportionate unsecured exposure.
        </li>
        <li>
          <strong>Cross-position analysis</strong> — The risk engine
          evaluates the borrower&apos;s entire portfolio across all Dualis
          pools. A deterioration in any position can trigger enhanced
          scrutiny of under-collateralised facilities.
        </li>
      </ul>

      <Callout type="danger" title="Default Consequences">
        A default on an under-collateralised position triggers immediate
        liquidation of all posted collateral, a permanent credit score
        reduction of at least 200 points, and a 12-month exclusion from
        under-collateralised facilities. The insurance reserve covers
        residual losses to protect lenders.
      </Callout>

      {/* ── Safeguards ── */}
      <h2 id="safeguards">Limits and Safeguards</h2>
      <p>
        Multiple safeguards ensure that under-collateralised lending does not
        compromise overall protocol health:
      </p>
      <ul>
        <li>
          <strong>Gradual ramp-up</strong> — New eligible participants start
          with 25% of their maximum exposure limit and scale up over 60 days
          of successful borrowing.
        </li>
        <li>
          <strong>Automatic de-risking</strong> — If the insurance reserve
          falls below 80% of its target level, new under-collateralised
          loans are paused until the reserve is replenished.
        </li>
        <li>
          <strong>Governance circuit breaker</strong> — DUAL token holders
          can vote to temporarily suspend or permanently disable
          under-collateralised lending in response to market stress or
          elevated default rates.
        </li>
        <li>
          <strong>Lender opt-in</strong> — Lenders explicitly choose whether
          their supplied liquidity can be used for under-collateralised
          loans. This is an opt-in mechanism; by default, supplied liquidity
          is only available for fully collateralised borrowing.
        </li>
      </ul>

      <Callout type="tip" title="Lender Incentive">
        Lenders who opt into the under-collateralised pool receive enhanced
        yields from the borrower surcharge. Typical yield enhancement is
        1.5&ndash;3% above standard lending rates, compensating for the
        incremental credit risk.
      </Callout>
    </>
  );
}
