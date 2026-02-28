'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function HybridLendingPage() {
  return (
    <>
      <h1>Hybrid Lending</h1>
      <p className="docs-lead">
        Dualis Finance combines the permissionless composability of DeFi with the risk
        controls and compliance requirements of institutional finance. This page explains
        how supplying and borrowing work, how the protocol differs for institutional
        versus retail participants, and how interest accrues efficiently at scale.
      </p>

      <h2 id="supplying">Supplying Assets</h2>
      <p>
        When a user supplies an asset to a Dualis lending pool, the protocol mints
        interest-bearing <strong>dTokens</strong> (e.g., dUSDC, dwBTC) that represent a
        proportional claim on the underlying pool balance. As borrowers pay interest, the
        exchange rate between dTokens and the underlying asset increases, meaning suppliers
        earn yield simply by holding dTokens.
      </p>
      <p>
        Supply operations are settled atomically on Canton: the underlying asset is
        transferred into the pool contract and dTokens are minted to the supplier in a
        single DAML transaction. There is no approval step or two-transaction pattern
        required.
      </p>

      <h2 id="borrowing">Borrowing Assets</h2>
      <p>
        To borrow, a user must first deposit collateral into the protocol. Each asset
        has a specific Loan-to-Value (LTV) ratio that determines the maximum borrowable
        amount. For example, depositing $10,000 of USDC (LTV 80%) permits borrowing
        up to $8,000 in other assets.
      </p>
      <p>
        Borrow positions accrue interest continuously. The interest rate is determined by
        the pool&apos;s utilization ratio and the borrower&apos;s credit tier (see{' '}
        <a href="/docs/protocol/interest-rate-model">Interest Rate Model</a>). Borrowers
        with higher credit scores receive discounted rates, enabling more capital-efficient
        borrowing for established institutions.
      </p>
      <p>
        When a borrower repays, the protocol burns the corresponding debt tokens, releases
        a proportional share of collateral, and updates the pool&apos;s utilization ratio.
        Partial repayments are supported.
      </p>

      <h2 id="institutional-vs-retail">Institutional vs. Retail</h2>
      <p>
        Dualis Finance serves both institutional and retail participants, but with
        differentiated risk parameters and compliance requirements:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Institutional</th>
              <th>Retail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>KYC/AML</td>
              <td>Full institutional onboarding with document verification</td>
              <td>Standard identity verification</td>
            </tr>
            <tr>
              <td>Credit Scoring</td>
              <td>Hybrid on-chain + off-chain credit assessment</td>
              <td>On-chain history only</td>
            </tr>
            <tr>
              <td>Credit Tier</td>
              <td>Diamond, Gold, Silver (based on assessment)</td>
              <td>Bronze or Unrated</td>
            </tr>
            <tr>
              <td>Rate Discount</td>
              <td>Up to 25% reduction (Diamond tier)</td>
              <td>No discount (0%)</td>
            </tr>
            <tr>
              <td>Collateral Types</td>
              <td>Crypto + RWA (T-Bills) + Tokenized Invoices (TIFA)</td>
              <td>Crypto assets only</td>
            </tr>
            <tr>
              <td>Under-Collateralized Lending</td>
              <td>Available for Diamond and Gold tiers</td>
              <td>Not available</td>
            </tr>
            <tr>
              <td>Position Limits</td>
              <td>Higher pool caps based on credit tier</td>
              <td>Standard pool limits</td>
            </tr>
            <tr>
              <td>Privacy</td>
              <td>Enhanced or Full privacy levels</td>
              <td>Standard privacy</td>
            </tr>
            <tr>
              <td>Liquidation Buffer</td>
              <td>Wider health factor alert thresholds</td>
              <td>Narrower thresholds</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="Credit Tiers">
        Credit tiers are central to the Dualis risk model. A Diamond-tier institution
        benefits from a 25% rate discount, access to under-collateralized borrowing, and
        broader collateral options. See the{' '}
        <a href="/docs/credit/tiers">Credit Tiers</a> documentation for details on
        qualification criteria.
      </Callout>

      <h2 id="interest-accrual">Interest Accrual</h2>
      <p>
        Dualis uses an <strong>index-based</strong> interest accrual model that updates
        in O(1) time per block, regardless of the number of open positions. Rather than
        iterating over every borrow position to apply interest, the protocol maintains a
        global <em>borrow index</em> and <em>supply index</em> for each pool.
      </p>
      <p>
        When a position is opened or modified, the protocol snapshots the current global
        index. To compute accrued interest at any later point, the protocol simply divides
        the current global index by the position&apos;s snapshot index:
      </p>
      <CodeBlock language="typescript" filename="interest-accrual.ts">
{`// O(1) interest calculation
const accruedAmount = principalAmount * (currentBorrowIndex / positionSnapshotIndex);

// Global index update (once per block)
const blockDelta = currentBlock - lastAccrualBlock;
const borrowRate = calculateBorrowRate(utilization, rateModel);
const interestFactor = 1 + (borrowRate * blockDelta / BLOCKS_PER_YEAR);
newBorrowIndex = previousBorrowIndex * interestFactor;`}
      </CodeBlock>
      <p>
        This approach has two key advantages:
      </p>
      <ul>
        <li>
          <strong>Constant-time complexity:</strong> The global index update runs once per
          block, and individual position lookups require only a single multiplication. This
          scales to millions of positions without increasing computational cost.
        </li>
        <li>
          <strong>Exact precision:</strong> Because the index accumulates multiplicatively,
          there is no rounding drift over time. Every position receives the mathematically
          exact interest amount relative to its entry point.
        </li>
      </ul>

      <Callout type="tip" title="Background Processing">
        Interest index updates are processed by a dedicated BullMQ worker
        (<code>interestAccrual.job.ts</code>) that runs on a fixed schedule. The updated
        indices are persisted to PostgreSQL and cached in Redis for low-latency reads by
        the API and frontend.
      </Callout>

      <h2 id="pool-tokens">Pool Tokens (dTokens)</h2>
      <p>
        Each lending pool issues its own dToken (e.g., dUSDC, dwETH). These tokens are
        non-rebasing: the token balance stays constant, but the exchange rate against the
        underlying asset grows as interest accrues. This design simplifies accounting for
        institutional participants who need stable token quantities for their internal
        ledgers.
      </p>
      <p>
        dTokens are standard Canton asset contracts and can be transferred between parties,
        used as collateral in other Dualis pools, or redeemed for the underlying asset at
        any time (subject to pool liquidity).
      </p>
    </>
  );
}
