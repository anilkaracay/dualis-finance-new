'use client';

import { Callout } from '@/components/docs/Callout';

export default function LiquidationPage() {
  return (
    <>
      <h1>Liquidation Engine</h1>
      <p className="docs-lead">
        Dualis Finance employs a graduated, four-tier liquidation system designed to
        protect protocol solvency while giving borrowers multiple opportunities to restore
        their positions before full liquidation occurs. This institutional-grade approach
        minimizes unnecessary value destruction and reduces cascading liquidation risk.
      </p>

      <h2 id="four-tier-system">Four-Tier Liquidation System</h2>
      <p>
        Unlike protocols that liquidate a fixed percentage at a single threshold, Dualis
        progressively increases the severity of liquidation as a position&apos;s health
        factor deteriorates. Each tier triggers a proportionally larger liquidation,
        providing natural stopping points where a borrower can intervene.
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Health Factor Range</th>
              <th>Position Liquidated</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Margin Call</strong></td>
              <td>0.95 &ndash; 1.00</td>
              <td>0%</td>
              <td>
                Warning phase only. The borrower receives alerts through the UI,
                WebSocket notifications, and email. No collateral is seized. The
                borrower should add collateral or repay debt.
              </td>
            </tr>
            <tr>
              <td><strong>Soft Liquidation</strong></td>
              <td>0.90 &ndash; 0.95</td>
              <td>25%</td>
              <td>
                A quarter of the debt position is liquidated. This is designed to
                nudge the health factor back above 1.0 with minimal disruption to
                the borrower&apos;s overall position.
              </td>
            </tr>
            <tr>
              <td><strong>Forced Liquidation</strong></td>
              <td>0.85 &ndash; 0.90</td>
              <td>50%</td>
              <td>
                Half the position is liquidated. At this stage, the position
                represents meaningful risk to the protocol and requires aggressive
                remediation.
              </td>
            </tr>
            <tr>
              <td><strong>Full Liquidation</strong></td>
              <td>&lt; 0.85</td>
              <td>100%</td>
              <td>
                The entire position is liquidated. All collateral is seized and
                sold to cover outstanding debt. Any remaining value after debt
                repayment and penalty deduction is returned to the borrower.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="warning" title="Liquidation Is Automated">
        Liquidations are executed by protocol-authorized liquidator bots that monitor
        health factors in real time. Once a position crosses a tier boundary, liquidation
        can occur within the next block. Borrowers should not rely on manual intervention
        and should configure alert thresholds well above the margin call zone.
      </Callout>

      <h2 id="alert-thresholds">Credit Tier Alert Thresholds</h2>
      <p>
        Different credit tiers receive health factor alerts at different thresholds.
        Higher-tier institutions receive earlier warnings, reflecting their larger position
        sizes and the protocol&apos;s expectation that they will manage risk proactively:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Credit Tier</th>
              <th>Warning Alert</th>
              <th>Danger Alert</th>
              <th>Critical Alert</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Diamond</strong></td>
              <td>HF &le; 1.30</td>
              <td>HF &le; 1.20</td>
              <td>HF &le; 1.10</td>
            </tr>
            <tr>
              <td><strong>Gold</strong></td>
              <td>HF &le; 1.40</td>
              <td>HF &le; 1.30</td>
              <td>HF &le; 1.15</td>
            </tr>
            <tr>
              <td><strong>Silver</strong></td>
              <td>HF &le; 1.50</td>
              <td>HF &le; 1.35</td>
              <td>HF &le; 1.20</td>
            </tr>
            <tr>
              <td><strong>Bronze</strong></td>
              <td>HF &le; 1.60</td>
              <td>HF &le; 1.40</td>
              <td>HF &le; 1.25</td>
            </tr>
            <tr>
              <td><strong>Unrated</strong></td>
              <td>HF &le; 1.80</td>
              <td>HF &le; 1.50</td>
              <td>HF &le; 1.30</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Diamond-tier institutions, with their established risk management capabilities,
        receive warnings closer to the liquidation boundary (1.30), while Unrated users
        receive warnings much earlier (1.80) to account for less sophisticated risk
        management practices.
      </p>

      <h2 id="liquidation-penalties">Liquidation Penalties by Asset</h2>
      <p>
        The liquidation penalty is the premium paid on seized collateral. It serves two
        purposes: compensating liquidators for execution risk and discouraging borrowers
        from operating near liquidation thresholds.
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Liquidation Penalty</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>USDC</strong></td>
              <td>4%</td>
              <td>Low volatility, deep liquidity, minimal execution risk</td>
            </tr>
            <tr>
              <td><strong>T-BILL (RWA-TBILL)</strong></td>
              <td>3%</td>
              <td>Government-backed stability, extremely low default risk</td>
            </tr>
            <tr>
              <td><strong>wETH / ETH</strong></td>
              <td>5%</td>
              <td>Moderate volatility with strong liquidity</td>
            </tr>
            <tr>
              <td><strong>wBTC</strong></td>
              <td>6%</td>
              <td>Higher value per unit with moderate volatility</td>
            </tr>
            <tr>
              <td><strong>CC (Canton Coin)</strong></td>
              <td>8%</td>
              <td>Emerging asset with thinner liquidity and higher volatility</td>
            </tr>
            <tr>
              <td><strong>TIFA-REC</strong></td>
              <td>10%</td>
              <td>Illiquid asset class with counterparty risk and longer settlement</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="protective-mechanisms">Protective Mechanisms</h2>
      <p>
        The Dualis liquidation engine includes several mechanisms designed to protect both
        borrowers and the protocol from adverse outcomes:
      </p>

      <h3>Graduated Execution</h3>
      <p>
        By liquidating only the minimum necessary at each tier (25% at soft, 50% at forced),
        the protocol avoids over-liquidation. After a partial liquidation, if the health
        factor recovers above the tier boundary, no further action is taken. This preserves
        borrower equity whenever possible.
      </p>

      <h3>Margin Call Buffer</h3>
      <p>
        The margin call zone (HF 0.95&ndash;1.00) provides a critical window where
        borrowers are warned but no collateral is seized. This is particularly valuable for
        institutional borrowers who need time to execute treasury operations, obtain
        internal approvals, or move assets across chains.
      </p>

      <h3>Bad Debt Socialization</h3>
      <p>
        In the rare event that a liquidation does not fully cover outstanding debt (e.g.,
        during extreme market volatility), the shortfall is absorbed first by the protocol
        reserve fund, then by a governance-controlled insurance pool. Suppliers are not
        directly exposed to bad debt unless both buffers are exhausted.
      </p>

      <h3>Oracle Circuit Breakers</h3>
      <p>
        Price oracle feeds include circuit breaker logic that pauses liquidations if a
        price deviation exceeds configurable bounds within a short time window. This
        prevents liquidations triggered by oracle manipulation or flash crashes.
      </p>

      <Callout type="tip" title="Liquidation Avoidance">
        The most effective way to avoid liquidation is to maintain a health factor well
        above the margin call zone. Institutional users should target a health factor
        of 1.5 or higher. The protocol provides real-time health factor monitoring via
        the dashboard and WebSocket API.
      </Callout>

      <h3>Liquidation Cooldown</h3>
      <p>
        After a partial liquidation (soft or forced), a brief cooldown period prevents
        immediate re-liquidation of the same position. This gives the borrower time to
        react and add collateral before the next evaluation cycle, reducing the risk of
        cascading liquidations during rapid market movements.
      </p>
    </>
  );
}
