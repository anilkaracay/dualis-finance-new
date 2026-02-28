'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function FlashLoansPage() {
  return (
    <>
      <h1>Flash Loans</h1>
      <p className="docs-lead">
        Dualis Finance offers flash loans that allow users to borrow any amount of available
        liquidity from a pool without collateral, provided the loan is repaid within the
        same transaction. Flash loans enable advanced DeFi strategies such as arbitrage,
        collateral swaps, and self-liquidation at a fee of <strong>0.09%</strong> of the
        borrowed amount.
      </p>

      <h2 id="mechanics">How Flash Loans Work</h2>
      <p>
        A flash loan is an atomic, single-transaction operation. The protocol lends the
        requested amount to the borrower, the borrower executes arbitrary logic, and the
        full principal plus fee must be returned before the transaction completes. If the
        repayment condition is not met, the entire transaction reverts as if it never
        happened.
      </p>
      <p>
        On Canton, this atomicity is guaranteed by DAML&apos;s transaction model. A flash
        loan is expressed as a single DAML exercise that checks the repayment invariant
        as a postcondition. The Canton runtime ensures that all sub-transactions within
        the exercise either succeed together or fail together.
      </p>
      <ol>
        <li>The borrower initiates a flash loan request specifying the asset and amount.</li>
        <li>The protocol transfers the requested amount to the borrower within the transaction.</li>
        <li>The borrower executes their strategy (e.g., arbitrage trade, collateral swap).</li>
        <li>The borrower returns the principal plus the 0.09% fee to the pool.</li>
        <li>The DAML postcondition verifies that the pool balance is whole. If not, the entire transaction is rolled back.</li>
      </ol>

      <Callout type="info" title="Fee Structure">
        The current flash loan fee is <strong>0.09%</strong> of the borrowed amount. This
        fee is split between pool suppliers (who receive the majority) and the protocol
        reserve (based on the pool&apos;s reserve factor). Flash loan fees contribute to
        supplier APY even during periods of low traditional borrowing activity.
      </Callout>

      <h2 id="use-cases">Use Cases</h2>

      <h3>Arbitrage</h3>
      <p>
        Flash loans enable risk-free arbitrage between Dualis pools and external markets.
        A trader can borrow an asset, sell it on a market where it is overpriced, buy it
        back on a market where it is underpriced, repay the loan, and pocket the
        difference &mdash; all in a single transaction with no capital at risk.
      </p>

      <h3>Collateral Swap</h3>
      <p>
        A borrower who wants to switch their collateral from wETH to wBTC can use a flash
        loan to repay their existing debt, withdraw their wETH collateral, swap it for
        wBTC, deposit the wBTC as new collateral, and re-borrow &mdash; without ever
        having the position uncollateralized.
      </p>

      <h3>Self-Liquidation</h3>
      <p>
        If a borrower&apos;s health factor is approaching the liquidation zone, they can
        use a flash loan to repay their debt, withdraw their collateral, sell enough
        collateral to cover the flash loan, and keep the remainder. This avoids the
        liquidation penalty entirely, which can be significantly more expensive than the
        0.09% flash loan fee.
      </p>

      <h3>Debt Refinancing</h3>
      <p>
        Borrowers can use flash loans to migrate debt between pools or restructure their
        positions. For example, a borrower can flash-borrow USDC to repay a wETH-denominated
        debt, swap the freed collateral, and re-establish the position in a different pool
        with more favorable rates.
      </p>

      <h2 id="api-example">API Integration</h2>
      <p>
        Flash loans are initiated through the Dualis API. The following example demonstrates
        a basic flash loan request:
      </p>
      <CodeBlock language="typescript" filename="flash-loan-example.ts">
{`const response = await fetch('https://api.dualis.finance/v1/flash-loan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your-api-key>',
  },
  body: JSON.stringify({
    asset: 'USDC',
    amount: '1000000.00',           // $1M USDC
    // Callback contains the operations to execute
    // during the flash loan window
    callback: {
      type: 'collateral-swap',
      params: {
        fromCollateral: 'wETH',
        toCollateral: 'wBTC',
        poolId: 'pool_usdc_main',
      },
    },
  }),
});

// Response includes transaction hash and fee paid
const result = await response.json();
// {
//   txHash: "canton:tx:abc123...",
//   borrowed: "1000000.00",
//   feePaid: "900.00",            // 0.09% of $1M
//   status: "completed"
// }`}
      </CodeBlock>

      <Callout type="warning" title="Atomicity Requirement">
        The callback operations must complete successfully and return the full principal
        plus fee within the same transaction. If any step in the callback fails, the
        entire flash loan transaction reverts. Ensure that your callback logic handles
        edge cases such as slippage, insufficient liquidity on external markets, and
        price movements between estimation and execution.
      </Callout>

      <h2 id="fee-governance">Fee Governance</h2>
      <p>
        The flash loan fee rate is a governance-controlled parameter. The current rate of
        0.09% was set at protocol launch to balance accessibility with revenue generation.
      </p>

      <Callout type="tip" title="DIP-002: Fee Reduction Proposal">
        Governance proposal <strong>DIP-002</strong> has been submitted to reduce the flash
        loan fee from 0.09% to 0.05%. The proposal argues that a lower fee would increase
        flash loan volume, attract more arbitrageurs (which improves market efficiency),
        and ultimately generate more total revenue despite the lower per-transaction fee.
        The proposal is currently in the community discussion phase.
      </Callout>

      <h2 id="risk-considerations">Risk Considerations</h2>
      <p>
        Flash loans are inherently low-risk for the protocol because the atomicity guarantee
        ensures that funds are never at risk. However, there are considerations for both
        the protocol and users:
      </p>
      <ul>
        <li>
          <strong>Pool liquidity impact:</strong> During a flash loan, the borrowed liquidity
          is temporarily unavailable. For extremely large flash loans (approaching total pool
          liquidity), this could theoretically affect other operations attempting to execute
          concurrently. Canton&apos;s transaction ordering mitigates this risk.
        </li>
        <li>
          <strong>Gas costs:</strong> Flash loan transactions are inherently more complex
          than standard operations. Users should account for higher transaction fees when
          calculating profitability.
        </li>
        <li>
          <strong>Oracle dependency:</strong> Strategies that depend on specific price
          conditions (e.g., arbitrage) should account for potential price movement between
          the time of estimation and the time of execution.
        </li>
      </ul>
    </>
  );
}
