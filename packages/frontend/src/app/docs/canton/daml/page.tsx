'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function DamlPage() {
  return (
    <>
      <h1>DAML Smart Contracts</h1>
      <p className="docs-lead">
        DAML is the smart contract language of the Canton Network, created by Digital Asset. It is
        a type-safe, functional language purpose-built for modeling multi-party financial workflows.
        Dualis Finance uses DAML SDK 3.4.11 targeting Ledger Format 2.1, with 38 contract
        templates across 25 modules.
      </p>

      <h2 id="what-is-daml">What Is DAML</h2>
      <p>
        DAML (Digital Asset Modeling Language) is a high-level, Haskell-derived language for
        writing smart contracts that execute on the Canton Network. Unlike Solidity, which
        operates on a shared global state machine, DAML models workflows as contracts between
        identified parties. Each contract has explicit signatories (parties who must authorize
        its creation) and observers (parties who can see it). This model maps directly to how
        real financial agreements work.
      </p>
      <p>
        DAML contracts are compiled to Ledger Format (LF), a platform-independent intermediate
        representation that runs on any DAML-compatible ledger. Dualis targets LF 2.1, the
        current standard for Canton&apos;s production runtime.
      </p>

      <h2 id="why-daml">Why DAML</h2>
      <p>
        The choice of DAML over Solidity, Move, or Rust-based smart contract languages is driven
        by several technical and structural advantages:
      </p>
      <ul>
        <li>
          <strong>Formal type system:</strong> DAML&apos;s Haskell-derived type system catches
          errors at compile time. There is no <code>null</code>, no implicit type coercion, and
          no unchecked arithmetic overflow.
        </li>
        <li>
          <strong>Signatory/observer model:</strong> Every contract explicitly declares who must
          authorize it and who can see it. No contract can move assets without the owner&apos;s
          explicit consent, eliminating unauthorized transfer vulnerabilities.
        </li>
        <li>
          <strong>No reentrancy:</strong> DAML&apos;s execution model is fundamentally different
          from the EVM. Choices (the DAML equivalent of function calls) execute atomically within
          a transaction. There is no external call pattern that enables reentrancy attacks.
        </li>
        <li>
          <strong>Built-in privacy:</strong> The signatory/observer model integrates directly with
          Canton&apos;s sub-transaction privacy. Contract visibility is enforced at the protocol
          level, not bolted on after the fact.
        </li>
        <li>
          <strong>Deterministic execution:</strong> DAML contracts produce the same result
          regardless of which participant executes them, enabling Canton&apos;s consensus model.
        </li>
      </ul>

      <Callout type="info" title="No Contract Keys in LF 2.x">
        Dualis targets Ledger Format 2.1, which does not support contract keys or maintainers.
        All contract lookups use contract IDs rather than key-based queries. This is a deliberate
        design change in the Canton runtime to improve performance and simplify the privacy model.
      </Callout>

      <h2 id="dualis-modules">Dualis DAML Modules</h2>
      <p>
        The Dualis smart contract suite comprises 25 modules organized into logical domains.
        Together they define 38 contract templates that encode the full protocol lifecycle.
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Module</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={2}><strong>Core</strong></td>
              <td><code>Dualis.Types</code></td>
              <td>Shared type definitions: CreditTier, InterestRateModel, CollateralParams, AccrualState</td>
            </tr>
            <tr>
              <td><code>Dualis.Core.Config</code></td>
              <td>Protocol-wide configuration contract</td>
            </tr>
            <tr>
              <td rowSpan={4}><strong>Lending</strong></td>
              <td><code>Dualis.Lending.Pool</code></td>
              <td>LendingPool and SupplyPosition templates with index-based accrual</td>
            </tr>
            <tr>
              <td><code>Dualis.Lending.Borrow</code></td>
              <td>BorrowPosition lifecycle: open, repay, accrue</td>
            </tr>
            <tr>
              <td><code>Dualis.Lending.Collateral</code></td>
              <td>Collateral deposit, withdrawal, and valuation</td>
            </tr>
            <tr>
              <td><code>Dualis.Lending.Math</code></td>
              <td>On-chain interest rate calculations using Taylor series approximation</td>
            </tr>
            <tr>
              <td rowSpan={2}><strong>Credit</strong></td>
              <td><code>Dualis.Credit.Attestation</code></td>
              <td>Credit attestation issuance and verification</td>
            </tr>
            <tr>
              <td><code>Dualis.Credit.CompositeScore</code></td>
              <td>Composite credit scoring from multiple data sources</td>
            </tr>
            <tr>
              <td><strong>Liquidation</strong></td>
              <td><code>Dualis.Liquidation.Engine</code></td>
              <td>Four-tier liquidation cascade and incentive distribution</td>
            </tr>
            <tr>
              <td><strong>Oracle</strong></td>
              <td><code>Dualis.Oracle.PriceFeed</code></td>
              <td>Multi-source price feed aggregation with staleness checks</td>
            </tr>
            <tr>
              <td rowSpan={6}><strong>Governance</strong></td>
              <td><code>Dualis.Governance.Config</code></td>
              <td>Governance parameter configuration</td>
            </tr>
            <tr>
              <td><code>Dualis.Governance.Proposal</code></td>
              <td>Proposal creation, voting period, and execution</td>
            </tr>
            <tr>
              <td><code>Dualis.Governance.Vote</code></td>
              <td>Vote casting and tally computation</td>
            </tr>
            <tr>
              <td><code>Dualis.Governance.Delegation</code></td>
              <td>Vote delegation and power transfer</td>
            </tr>
            <tr>
              <td><code>Dualis.Governance.Timelock</code></td>
              <td>Time-locked execution of approved proposals</td>
            </tr>
            <tr>
              <td><code>Dualis.Governance.Token</code></td>
              <td>DUAL governance token contract</td>
            </tr>
            <tr>
              <td><strong>Token</strong></td>
              <td><code>Dualis.Token.DUAL</code></td>
              <td>DUAL token minting, transfer, and burn</td>
            </tr>
            <tr>
              <td><strong>Institutional</strong></td>
              <td><code>Dualis.Institutional.Core</code></td>
              <td>Institutional onboarding and securities lending workflows</td>
            </tr>
            <tr>
              <td><strong>SecLending</strong></td>
              <td><code>Dualis.SecLending.Advanced</code></td>
              <td>Advanced securities lending with netting and recall</td>
            </tr>
            <tr>
              <td><strong>Privacy</strong></td>
              <td><code>Dualis.Privacy.Config</code></td>
              <td>Privacy domain configuration and observer policies</td>
            </tr>
            <tr>
              <td><strong>Productive</strong></td>
              <td><code>Dualis.Productive.Core</code></td>
              <td>Productive collateral and yield-bearing position management</td>
            </tr>
            <tr>
              <td rowSpan={4}><strong>Triggers</strong></td>
              <td><code>Dualis.Trigger.InterestAccrual</code></td>
              <td>Automated interest accrual trigger</td>
            </tr>
            <tr>
              <td><code>Dualis.Trigger.LiquidationScanner</code></td>
              <td>Continuous health factor monitoring and liquidation initiation</td>
            </tr>
            <tr>
              <td><code>Dualis.Trigger.OracleAggregator</code></td>
              <td>Oracle price feed aggregation and update trigger</td>
            </tr>
            <tr>
              <td><code>Dualis.Trigger.StalenessChecker</code></td>
              <td>Price feed staleness detection and circuit breaker</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="code-example">Code Example</h2>
      <p>
        The following excerpt from <code>Dualis.Lending.Pool</code> shows the core structure of
        a DAML contract template. Note the explicit signatory declaration and the typed choice
        that exercises interest accrual:
      </p>

      <CodeBlock language="daml" filename="Dualis/Lending/Pool.daml">
{`template LendingPool
  with
    operator : Party
    poolId : PoolId
    asset : AssetInfo
    rateModel : InterestRateModel
    totalSupply : Decimal
    totalBorrow : Decimal
    totalReserves : Decimal
    accrual : AccrualState
    isActive : Bool
  where
    signatory operator

    choice AccrueInterest : ContractId LendingPool
      with
        currentTs : Int
      controller operator
      do
        let result = accrueInterest
              this.rateModel
              this.totalBorrow
              this.totalSupply
              this.totalReserves
              this.accrual.borrowIndex
              this.accrual.supplyIndex
              this.accrual.lastAccrualTs
              currentTs
        create this with
          totalBorrow = result.newTotalBorrow
          totalReserves = result.newReserves
          accrual = result.newAccrualState`}
      </CodeBlock>

      <h2 id="build-commands">Build and Test</h2>
      <p>
        The DAML contracts are built and tested using the Daml SDK CLI. From the canton package
        directory:
      </p>

      <CodeBlock language="bash" filename="Terminal">
{`# Build the DAR (DAML Archive)
cd packages/canton/daml
~/.daml/bin/daml build

# Run all DAML test scripts
~/.daml/bin/daml test

# Output DAR location
# .daml/dist/dualis-finance-2.0.0.dar`}
      </CodeBlock>

      <p>
        The build produces a DAR file containing all 25 modules. This archive is uploaded to the
        Canton participant node for deployment. The test suite includes 8 test modules covering
        pool operations, borrowing, liquidation, credit scoring, governance, oracle feeds,
        token operations, and configuration management.
      </p>
    </>
  );
}
