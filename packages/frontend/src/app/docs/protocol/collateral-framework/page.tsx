'use client';

import { Callout } from '@/components/docs/Callout';

export default function CollateralFrameworkPage() {
  return (
    <>
      <h1>Collateral Framework</h1>
      <p className="docs-lead">
        The Dualis collateral framework defines the risk parameters that govern borrowing
        capacity, liquidation thresholds, and penalty structures for each supported asset.
        The framework is designed for institutional-grade risk management while supporting
        a diverse range of collateral types including crypto assets, real-world assets, and
        tokenized invoices.
      </p>

      <h2 id="per-asset-parameters">Per-Asset Collateral Parameters</h2>
      <p>
        Each asset accepted as collateral has three key parameters that determine its risk
        profile within the protocol:
      </p>
      <ul>
        <li>
          <strong>Loan-to-Value (LTV):</strong> The maximum percentage of collateral value
          that can be borrowed against. A lower LTV indicates higher perceived risk.
        </li>
        <li>
          <strong>Liquidation Threshold:</strong> The collateral ratio at which a position
          becomes eligible for liquidation. This is always higher than LTV, providing a
          buffer zone.
        </li>
        <li>
          <strong>Liquidation Penalty:</strong> The discount applied to collateral during
          liquidation, serving as both an incentive for liquidators and a deterrent for
          borrowers who allow positions to become undercollateralized.
        </li>
      </ul>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Collateral Tier</th>
              <th>LTV</th>
              <th>Liquidation Threshold</th>
              <th>Liquidation Penalty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>USDC</strong></td>
              <td>Crypto</td>
              <td>80%</td>
              <td>85%</td>
              <td>4%</td>
            </tr>
            <tr>
              <td><strong>wBTC</strong></td>
              <td>Crypto</td>
              <td>73%</td>
              <td>80%</td>
              <td>6%</td>
            </tr>
            <tr>
              <td><strong>wETH / ETH</strong></td>
              <td>Crypto</td>
              <td>75%</td>
              <td>82%</td>
              <td>5%</td>
            </tr>
            <tr>
              <td><strong>CC (Canton Coin)</strong></td>
              <td>Crypto</td>
              <td>75%</td>
              <td>82%</td>
              <td>5%</td>
            </tr>
            <tr>
              <td><strong>T-BILL (RWA-TBILL)</strong></td>
              <td>RWA</td>
              <td>85%</td>
              <td>90%</td>
              <td>3%</td>
            </tr>
            <tr>
              <td><strong>TIFA-REC</strong></td>
              <td>TIFA</td>
              <td>50%</td>
              <td>60%</td>
              <td>10%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="Parameter Governance">
        All collateral parameters are subject to governance approval. Changes require a
        formal proposal (DIP), a 7-day voting period, and a 48-hour timelock before
        execution. This ensures that risk parameter adjustments receive thorough community
        review.
      </Callout>

      <h2 id="collateral-tiers">Collateral Tiers and Haircuts</h2>
      <p>
        Assets are grouped into three collateral tiers based on their liquidity profile,
        price discovery mechanisms, and settlement characteristics. Each tier applies a
        valuation haircut that reduces the effective collateral value used in health factor
        calculations:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Haircut</th>
              <th>Assets</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Crypto</strong></td>
              <td>0%</td>
              <td>USDC, wBTC, wETH, ETH, CC</td>
              <td>
                Deep on-chain liquidity, real-time price feeds, instant settlement.
                No additional valuation discount required.
              </td>
            </tr>
            <tr>
              <td><strong>RWA</strong></td>
              <td>5%</td>
              <td>T-BILL (RWA-TBILL)</td>
              <td>
                Backed by U.S. Treasury securities with high credit quality but
                limited on-chain liquidity. The 5% haircut accounts for redemption
                delays and potential NAV deviation.
              </td>
            </tr>
            <tr>
              <td><strong>TIFA</strong></td>
              <td>20%</td>
              <td>TIFA-REC (Tokenized Receivables)</td>
              <td>
                Invoice-backed assets with counterparty credit risk and longer
                settlement cycles. The 20% haircut reflects illiquidity, credit
                risk, and potential recovery shortfalls.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The effective collateral value used in all risk calculations is:
      </p>
      <p>
        <code>effectiveValue = marketValue * (1 - haircutRate) * LTV</code>
      </p>
      <p>
        For example, $100,000 of T-BILL collateral has an effective borrowing capacity of:
        $100,000 * (1 - 0.05) * 0.85 = <strong>$80,750</strong>.
      </p>

      <h2 id="cross-collateralization">Cross-Collateralization</h2>
      <p>
        Dualis supports cross-collateralization, meaning users can deposit multiple asset
        types into a single collateral portfolio. The protocol computes a unified health
        factor across all deposited collateral and all outstanding debt positions.
      </p>
      <p>
        This provides several advantages for institutional borrowers:
      </p>
      <ul>
        <li>
          <strong>Capital efficiency:</strong> A diversified collateral basket produces a
          blended LTV that is often higher than any single-asset position, because the
          portfolio benefits from asset decorrelation.
        </li>
        <li>
          <strong>Risk distribution:</strong> A price drop in one collateral asset may be
          offset by stability in another, reducing the probability of liquidation compared
          to single-asset collateral.
        </li>
        <li>
          <strong>Operational flexibility:</strong> Institutions can post the collateral
          they have available rather than acquiring specific assets, reducing friction and
          transaction costs.
        </li>
      </ul>

      <Callout type="warning" title="Cross-Tier Risk">
        While cross-collateralization improves capital efficiency, users should be aware
        that including lower-tier collateral (e.g., TIFA-REC) in a portfolio will lower the
        blended health factor. The protocol applies each asset&apos;s individual haircut and
        LTV before aggregating.
      </Callout>

      <h2 id="health-factor">Health Factor Calculation</h2>
      <p>
        The health factor (HF) is the primary risk metric for every borrowing position. It
        is defined as:
      </p>
      <p>
        <code>
          HF = Sum(collateralValue_i * liquidationThreshold_i * (1 - haircut_i)) / totalBorrowValueUSD
        </code>
      </p>
      <p>
        A health factor above 1.0 means the position is solvent. As it approaches 1.0, the
        position enters the margin call zone. Below specific thresholds, the protocol
        initiates graduated liquidation (see{' '}
        <a href="/docs/protocol/liquidation">Liquidation Engine</a>).
      </p>
      <p>
        The protocol recalculates health factors continuously as oracle prices update.
        Institutions with higher credit tiers receive earlier warning alerts, giving them
        more time to add collateral or reduce debt before liquidation triggers.
      </p>
    </>
  );
}
