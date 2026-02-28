import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';
import Link from 'next/link';

export default function CoreConcepts() {
  return (
    <>
      <h1 id="core-concepts">Core Concepts</h1>
      <p>
        This page introduces the foundational ideas that underpin the Dualis Finance protocol.
        Each concept is covered in depth in its own dedicated section of the documentation;
        the goal here is to give you a complete mental model before you dive into the details.
      </p>

      {/* ─── Hybrid Lending ─── */}
      <h2 id="hybrid-lending">Hybrid Lending</h2>
      <p>
        Traditional DeFi lending protocols operate in a single mode: over-collateralized. Borrowers
        must deposit more value than they borrow, and the protocol liquidates positions when
        collateral ratios fall below a threshold. This model works for anonymous, permissionless
        markets, but it is inherently capital-inefficient and excludes the credit-based lending
        workflows that institutional finance depends on.
      </p>
      <p>
        Dualis operates a <strong>hybrid model</strong> that supports both over-collateralized and
        under-collateralized lending within the same protocol. Over-collateralized loans function
        similarly to Aave or Compound -- any verified participant can borrow against posted collateral
        with algorithmic interest rates and automated liquidation. Under-collateralized loans are
        available to participants who have been assessed by the{' '}
        <Link href="/docs/credit/scoring">credit scoring system</Link> and assigned a credit tier,
        allowing them to borrow at higher loan-to-value ratios commensurate with their
        creditworthiness.
      </p>
      <p>
        This dual approach means that a single pool can serve conservative lenders seeking
        fully-secured yields and institutional borrowers who need capital-efficient access to
        liquidity -- without fragmenting liquidity across separate markets.
      </p>

      {/* ─── Asset-Agnostic Collateral ─── */}
      <h2 id="asset-agnostic-collateral">Asset-Agnostic Collateral</h2>
      <p>
        The Dualis <Link href="/docs/protocol/collateral-framework">collateral framework</Link>{' '}
        accepts three categories of assets, each with its own risk parameters and haircut model:
      </p>
      <ul>
        <li>
          <strong>Crypto assets</strong> -- standard digital tokens (e.g., CC, wBTC, wETH).
          These carry no additional haircut beyond the base LTV defined by the collateral
          parameters.
        </li>
        <li>
          <strong>Real-world assets (RWAs)</strong> -- tokenized securities such as government
          bonds, corporate debt, and equity. RWAs receive a 5% haircut to account for redemption
          latency and valuation uncertainty.
        </li>
        <li>
          <strong>TIFA assets</strong> -- tokenized institutional fixed-income assets originated
          through TIFA Finance. TIFAs receive a 20% haircut reflecting their illiquidity and
          structured payoff profiles.
        </li>
      </ul>
      <p>
        By treating diverse asset types as first-class collateral with calibrated risk parameters,
        Dualis unlocks liquidity for tokenized assets that cannot be used as collateral anywhere
        else in DeFi.
      </p>

      {/* ─── Dual-Track Architecture ─── */}
      <h2 id="dual-track-architecture">Dual-Track Architecture</h2>
      <p>
        The protocol runs on a dual-track architecture that separates the computation layer from
        the settlement layer:
      </p>
      <ul>
        <li>
          <strong>Off-chain computation.</strong> Interest accrual, health factor calculations,
          oracle price aggregation, and credit scoring run on the Dualis backend (Fastify + PostgreSQL).
          This provides the throughput and flexibility needed for real-time risk monitoring across
          all positions.
        </li>
        <li>
          <strong>On-chain settlement.</strong> All state-changing operations -- deposits,
          withdrawals, borrows, repayments, liquidations, and collateral adjustments -- are
          executed as DAML contract exercises on the Canton Network. This provides deterministic
          finality, sub-transaction privacy, and an immutable audit trail.
        </li>
      </ul>
      <p>
        The two tracks are synchronized through 32 Canton write operations that map backend
        actions to smart contract exercises. This architecture provides the performance of
        centralized computation with the trust guarantees of on-chain settlement.
      </p>

      {/* ─── Health Factor ─── */}
      <h2 id="health-factor">Health Factor</h2>
      <p>
        The health factor is the primary risk metric for every borrowing position. It represents
        the ratio of a borrower{`'`}s risk-adjusted collateral value to their total debt, determining
        how close a position is to liquidation.
      </p>
      <CodeBlock language="math" filename="Health Factor Formula">
{`Health Factor = Sum(Collateral_i * Price_i * LTV_i) / Sum(Debt_j * Price_j)

Where:
  Collateral_i  = Amount of collateral asset i
  Price_i       = Oracle price of asset i in USD
  LTV_i         = Loan-to-value ratio for asset i (adjusted by credit tier)
  Debt_j        = Outstanding debt in asset j (principal + accrued interest)
  Price_j       = Oracle price of debt asset j in USD`}
      </CodeBlock>
      <p>
        A health factor of <strong>1.0</strong> means the position is exactly at the liquidation
        threshold. Positions with a health factor below 1.0 are eligible for liquidation. The
        protocol targets a safe operating range above 1.5 and issues warnings as positions
        approach 1.2.
      </p>
      <Callout type="info" title="Credit Tier Adjustments">
        The LTV values used in the health factor calculation are not static. They are adjusted
        based on the borrower{`'`}s credit tier. A Diamond-tier borrower may have an LTV cap of 90%,
        while an Unrated borrower is capped at 50%. See{' '}
        <Link href="/docs/credit/tiers">Credit Tiers</Link> for the full parameter table.
      </Callout>

      {/* ─── Reserve Factor ─── */}
      <h2 id="reserve-factor">Reserve Factor</h2>
      <p>
        The reserve factor is the percentage of interest income that the protocol retains as
        reserves rather than distributing to suppliers. Reserves serve as a first-loss buffer
        against bad debt from liquidation shortfalls and fund protocol development and governance
        operations.
      </p>
      <p>
        Each pool has an independently configurable reserve factor, typically ranging from 10% to
        25% depending on the risk profile of the underlying asset. Higher-risk assets carry
        higher reserve factors to build larger safety buffers. The reserve factor is a governance-controlled
        parameter that can be adjusted through the{' '}
        <Link href="/docs/governance/proposals">proposal system</Link>.
      </p>

      {/* ─── Utilization Rate ─── */}
      <h2 id="utilization-rate">Utilization Rate</h2>
      <p>
        The utilization rate measures how much of a pool{`'`}s total supplied liquidity is currently
        being borrowed. It is the primary input to the interest rate model and reflects the
        supply-demand balance for each asset.
      </p>
      <CodeBlock language="math" filename="Utilization Rate Formula">
{`Utilization Rate = Total Borrows / (Total Supplied + Total Borrows - Total Reserves)

Where:
  Total Borrows   = Sum of all outstanding loan principal + accrued interest
  Total Supplied  = Sum of all supplier deposits
  Total Reserves  = Protocol-owned reserve balance`}
      </CodeBlock>
      <p>
        As utilization rises, borrow rates increase to incentivize repayments and attract new
        supply. The <Link href="/docs/protocol/interest-rate-model">jump rate model</Link> defines
        a kink point (typically around 80% utilization) above which rates accelerate sharply to
        prevent full utilization and ensure suppliers can always withdraw.
      </p>

      {/* ─── Credit Tiers ─── */}
      <h2 id="credit-tiers">Credit Tiers</h2>
      <p>
        Dualis uses a five-tier credit scoring system that determines borrowing terms for each
        participant. Credit scores are computed by the{' '}
        <Link href="/docs/credit/scoring">hybrid credit scoring engine</Link>, which combines
        on-chain borrowing history with off-chain institutional credit data from partner oracles.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Score Range</th>
              <th>Rate Discount</th>
              <th>Max LTV</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Diamond</strong></td>
              <td>850 - 1000</td>
              <td>15%</td>
              <td>90%</td>
              <td>Highest creditworthiness. Full access to under-collateralized lending with maximum LTV.</td>
            </tr>
            <tr>
              <td><strong>Gold</strong></td>
              <td>700 - 849</td>
              <td>10%</td>
              <td>80%</td>
              <td>Strong credit profile. Access to under-collateralized lending with favorable terms.</td>
            </tr>
            <tr>
              <td><strong>Silver</strong></td>
              <td>500 - 699</td>
              <td>5%</td>
              <td>70%</td>
              <td>Moderate credit profile. Standard lending terms with moderate LTV allowance.</td>
            </tr>
            <tr>
              <td><strong>Bronze</strong></td>
              <td>300 - 499</td>
              <td>0%</td>
              <td>60%</td>
              <td>Below-average credit. Over-collateralized lending only with reduced LTV caps.</td>
            </tr>
            <tr>
              <td><strong>Unrated</strong></td>
              <td>0 - 299</td>
              <td>0%</td>
              <td>50%</td>
              <td>No credit history or assessment. Most conservative terms; over-collateralized only.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Credit tiers affect three dimensions of a borrower{`'`}s experience: the interest rate
        discount applied to base borrow rates, the maximum loan-to-value ratio allowed, and
        eligibility for under-collateralized lending. Tiers are reassessed periodically based on
        repayment history and updated off-chain credit data.
      </p>

      {/* ─── Canton Privacy ─── */}
      <h2 id="canton-privacy">Canton Privacy</h2>
      <p>
        Dualis is built on the <Link href="/docs/canton/why-canton">Canton Network</Link> specifically
        because of its sub-transaction privacy model. Unlike public blockchains where all data is
        visible to every participant, Canton ensures that each party in a transaction only sees the
        data that is relevant to their role.
      </p>
      <p>
        In practice, this means:
      </p>
      <ul>
        <li>
          A <strong>supplier</strong> can see their own deposits, earned interest, and pool-level
          utilization statistics, but cannot see individual borrower positions or their collateral
          composition.
        </li>
        <li>
          A <strong>borrower</strong> can see their own loans, collateral, and health factor, but
          cannot see what other borrowers have borrowed or at what rates.
        </li>
        <li>
          The <strong>protocol operator</strong> has the visibility needed to compute interest
          accrual and monitor system health, but cannot unilaterally move user funds -- all
          state transitions require multi-party authorization via DAML contract exercises.
        </li>
        <li>
          <strong>Liquidators</strong> can see that a position is eligible for liquidation and the
          relevant collateral details, but only after the health factor crosses below the
          liquidation threshold.
        </li>
      </ul>
      <p>
        This privacy model is enforced at the ledger level by DAML{`'`}s authorization rules. It is
        not an application-layer feature that can be bypassed -- it is a fundamental property of
        the Canton Network{`'`}s consensus and synchronization protocol. For institutional
        participants, this means their lending activity has the same confidentiality they expect
        from traditional prime brokerage relationships.
      </p>
    </>
  );
}
