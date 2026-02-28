'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function InterestRateModelPage() {
  return (
    <>
      <h1>Interest Rate Model</h1>
      <p className="docs-lead">
        Dualis Finance uses a <strong>Jump Rate Model</strong> to dynamically price
        borrowing costs based on pool utilization. This model incentivizes optimal capital
        allocation by keeping rates low during normal usage and sharply increasing them
        when liquidity is scarce. Credit tier adjustments further differentiate rates for
        institutional borrowers.
      </p>

      <h2 id="jump-rate-formula">Jump Rate Formula</h2>
      <p>
        The borrow rate is a piecewise linear function of utilization, with a &ldquo;kink&rdquo;
        point that triggers a steeper rate curve:
      </p>
      <CodeBlock language="typescript" filename="jump-rate-model.ts">
{`// Utilization ratio
const utilization = totalBorrows / (totalCash + totalBorrows - totalReserves);

// Borrow rate (per-year)
let borrowRate: number;
if (utilization <= kink) {
  // Below kink: gentle linear increase
  borrowRate = baseRate + (utilization * multiplier);
} else {
  // Above kink: steep jump multiplier kicks in
  const normalRate = baseRate + (kink * multiplier);
  const excessUtilization = utilization - kink;
  borrowRate = normalRate + (excessUtilization * jumpMultiplier);
}

// Supply rate (what lenders earn)
const supplyRate = borrowRate * utilization * (1 - reserveFactor);`}
      </CodeBlock>

      <h2 id="rate-curve">Rate Curve Behavior</h2>
      <p>
        The model creates two distinct regimes:
      </p>
      <ul>
        <li>
          <strong>Below the kink:</strong> Rates increase linearly and gradually. This
          region represents normal market conditions where sufficient liquidity exists.
          The gentle slope encourages borrowing while providing reasonable returns to
          suppliers.
        </li>
        <li>
          <strong>Above the kink:</strong> Rates increase steeply via the jump multiplier.
          This serves as a market-driven mechanism to attract new capital and discourage
          excessive borrowing when liquidity is thin. The sharp increase creates a natural
          equilibrium that pulls utilization back toward the target kink rate.
        </li>
      </ul>

      <Callout type="info" title="Kink as Target Utilization">
        The kink point represents the protocol&apos;s target utilization for each asset. For
        stablecoins like USDC (kink at 80%), the protocol tolerates higher utilization
        because of their price stability. For volatile assets like wBTC (kink at 65%), the
        kink is set lower to maintain larger liquidity buffers.
      </Callout>

      <h2 id="per-asset-parameters">Per-Asset Rate Parameters</h2>
      <p>
        Each asset pool is configured with its own rate model parameters, calibrated to its
        volatility, liquidity depth, and institutional demand profile:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Base Rate</th>
              <th>Multiplier</th>
              <th>Kink</th>
              <th>Jump Multiplier</th>
              <th>Reserve Factor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>USDC</strong></td>
              <td>2%</td>
              <td>7%</td>
              <td>80%</td>
              <td>30%</td>
              <td>10%</td>
            </tr>
            <tr>
              <td><strong>wBTC</strong></td>
              <td>1%</td>
              <td>4%</td>
              <td>65%</td>
              <td>50%</td>
              <td>15%</td>
            </tr>
            <tr>
              <td><strong>wETH</strong></td>
              <td>1%</td>
              <td>4%</td>
              <td>65%</td>
              <td>50%</td>
              <td>15%</td>
            </tr>
            <tr>
              <td><strong>CC (Canton Coin)</strong></td>
              <td>3%</td>
              <td>10%</td>
              <td>60%</td>
              <td>80%</td>
              <td>20%</td>
            </tr>
            <tr>
              <td><strong>T-BILL</strong></td>
              <td>4%</td>
              <td>3%</td>
              <td>90%</td>
              <td>15%</td>
              <td>5%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Parameter Rationale</h3>
      <ul>
        <li>
          <strong>USDC:</strong> As a stablecoin with deep liquidity, USDC has a moderate base
          rate (2%), a high kink (80%) allowing strong utilization, and a moderate jump
          multiplier (30%) to discourage complete pool drainage.
        </li>
        <li>
          <strong>wBTC / wETH:</strong> Major crypto assets share a conservative profile with
          a low base rate (1%) to attract borrowing, a lower kink (65%) to maintain liquidity
          buffers, and a high jump multiplier (50%) for volatility protection.
        </li>
        <li>
          <strong>CC (Canton Coin):</strong> The network&apos;s native asset carries the most
          aggressive parameters: a 3% base rate, 10% multiplier, low kink (60%), and an 80%
          jump multiplier. The 20% reserve factor ensures protocol sustainability given the
          asset&apos;s higher volatility.
        </li>
        <li>
          <strong>T-BILL:</strong> Treasury-backed tokens have a higher base rate (4%)
          reflecting their yield floor, a very high kink (90%) due to price stability, and
          the lowest jump multiplier (15%) since extreme utilization is less risky for a
          stable asset. The 5% reserve factor keeps protocol overhead minimal.
        </li>
      </ul>

      <h2 id="credit-tier-adjustments">Credit Tier Rate Adjustments</h2>
      <p>
        Borrowers with higher credit tiers receive discounted rates as a reward for their
        established creditworthiness. The discount is applied as a percentage reduction to
        the base borrow rate:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Credit Tier</th>
              <th>Rate Discount</th>
              <th>Effective Multiplier</th>
              <th>Typical Borrower</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Diamond</strong></td>
              <td>-25%</td>
              <td>0.75x</td>
              <td>Top-tier institutions with pristine credit history</td>
            </tr>
            <tr>
              <td><strong>Gold</strong></td>
              <td>-15%</td>
              <td>0.85x</td>
              <td>Established institutions with strong credit</td>
            </tr>
            <tr>
              <td><strong>Silver</strong></td>
              <td>-8%</td>
              <td>0.92x</td>
              <td>Verified institutions with good standing</td>
            </tr>
            <tr>
              <td><strong>Bronze</strong></td>
              <td>0%</td>
              <td>1.00x</td>
              <td>Newly onboarded institutions</td>
            </tr>
            <tr>
              <td><strong>Unrated</strong></td>
              <td>0%</td>
              <td>1.00x</td>
              <td>Retail users without credit assessment</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        For example, a Diamond-tier borrower in the USDC pool at 50% utilization would
        pay:
      </p>
      <CodeBlock language="text" filename="example-calculation">
{`Base borrow rate at 50% utilization:
  rate = 2% + (50% * 7%) = 5.5%

Diamond tier discount (-25%):
  effective rate = 5.5% * 0.75 = 4.125%

Compared to an Unrated borrower:
  effective rate = 5.5% * 1.00 = 5.5%

Savings: 1.375 percentage points`}
      </CodeBlock>

      <Callout type="tip" title="APR vs. APY">
        The rates shown above are Annual Percentage Rates (APR). The protocol also displays
        Annual Percentage Yield (APY), which accounts for the compounding effect of
        continuous interest accrual. APY is always slightly higher than APR:
        APY = (1 + APR/n)^n - 1, where n is the number of compounding periods per year.
      </Callout>

      <h2 id="reserve-factor">Reserve Factor</h2>
      <p>
        A portion of all interest paid by borrowers is diverted to the protocol reserve.
        The reserve factor determines this split: with a 10% reserve factor (USDC), 90% of
        interest goes to suppliers and 10% accrues to the protocol treasury. Reserves serve
        as a first-loss buffer against bad debt and fund protocol operations through
        governance-directed allocation.
      </p>
    </>
  );
}
