import Link from 'next/link';

export default function Glossary() {
  return (
    <>
      <h1 id="glossary">Glossary</h1>
      <p>
        A comprehensive reference of terms used throughout the Dualis Finance documentation and
        protocol. Terms are listed alphabetically.
      </p>

      {/* ─── A ─── */}
      <h2 id="section-a">A</h2>

      <h3 id="apy">APY (Annual Percentage Yield)</h3>
      <p>
        The annualized rate of return on a supplied or borrowed asset, accounting for the effect
        of compounding. Dualis computes APY from the base APR using continuous compounding over
        the interest accrual period. Supply APY reflects what suppliers earn; borrow APY reflects
        what borrowers pay. See{' '}
        <Link href="/docs/protocol/interest-rate-model">Interest Rate Model</Link>.
      </p>

      {/* ─── B ─── */}
      <h2 id="section-b">B</h2>

      <h3 id="borrower">Borrower</h3>
      <p>
        A verified participant who takes a loan from a Dualis lending pool by posting collateral
        and paying interest at the algorithmically determined borrow rate. Borrowers may access
        over-collateralized or under-collateralized loans depending on their credit tier.
      </p>

      {/* ─── C ─── */}
      <h2 id="section-c">C</h2>

      <h3 id="canton-network">Canton Network</h3>
      <p>
        A privacy-enabled, interoperable blockchain developed by Digital Asset. Canton provides
        sub-transaction privacy, deterministic finality, and DAML smart contracts. Dualis Finance
        is deployed on the Canton Network to leverage these properties for institutional lending.
        See <Link href="/docs/canton/why-canton">Why Canton</Link>.
      </p>

      <h3 id="collateral">Collateral</h3>
      <p>
        Assets deposited by a borrower to secure a loan. In Dualis, collateral can be crypto
        assets, tokenized real-world assets (RWAs), or tokenized institutional fixed-income assets
        (TIFAs). Each collateral type has a specific haircut and LTV ratio defined by the{' '}
        <Link href="/docs/protocol/collateral-framework">collateral framework</Link>.
      </p>

      <h3 id="credit-oracle">Credit Oracle</h3>
      <p>
        An external data provider that supplies off-chain institutional credit data to the Dualis
        protocol. Credit oracles feed into the hybrid credit scoring engine, combining traditional
        credit assessments with on-chain borrowing history. See{' '}
        <Link href="/docs/credit/oracle-api">Credit Oracle API</Link>.
      </p>

      <h3 id="credit-tier">Credit Tier</h3>
      <p>
        One of five creditworthiness classifications assigned to borrowers: Diamond (850-1000),
        Gold (700-849), Silver (500-699), Bronze (300-499), or Unrated (0-299). Each tier
        determines interest rate discounts, maximum LTV ratios, and eligibility for
        under-collateralized lending. See{' '}
        <Link href="/docs/credit/tiers">Credit Tiers</Link>.
      </p>

      {/* ─── D ─── */}
      <h2 id="section-d">D</h2>

      <h3 id="daml">DAML</h3>
      <p>
        Digital Asset Modeling Language. A purpose-built smart contract language used on the Canton
        Network. DAML enforces authorization rules, privacy boundaries, and atomic multi-party
        transactions. Dualis uses 38 DAML templates across 25 modules to define all on-chain
        protocol operations. See{' '}
        <Link href="/docs/canton/daml">DAML Smart Contracts</Link>.
      </p>

      <h3 id="delegation">Delegation</h3>
      <p>
        The act of assigning one{`'`}s DUAL token voting power to another address without
        transferring token ownership. Delegated voting power can be used in governance proposals
        and is revocable at any time. See{' '}
        <Link href="/docs/governance/voting">Voting & Delegation</Link>.
      </p>

      <h3 id="dual-token">DUAL Token</h3>
      <p>
        The native governance token of the Dualis Finance protocol. DUAL holders can create
        proposals, vote on protocol parameter changes, delegate voting power, and stake tokens
        to earn protocol revenue. See{' '}
        <Link href="/docs/governance/dual-token">DUAL Token</Link>.
      </p>

      {/* ─── F ─── */}
      <h2 id="section-f">F</h2>

      <h3 id="flash-loan">Flash Loan</h3>
      <p>
        An uncollateralized loan that must be borrowed and repaid within a single atomic
        transaction. Flash loans enable arbitrage, liquidation, and collateral swaps without
        requiring upfront capital. Dualis charges a 0.09% fee on flash loan principal. See{' '}
        <Link href="/docs/protocol/flash-loans">Flash Loans</Link>.
      </p>

      {/* ─── G ─── */}
      <h2 id="section-g">G</h2>

      <h3 id="governance">Governance</h3>
      <p>
        The system by which DUAL token holders collectively manage protocol parameters, risk
        settings, and treasury allocations. Governance operates through on-chain proposals with
        voting periods, quorum requirements, and timelock delays. See{' '}
        <Link href="/docs/governance/proposals">Proposal System</Link>.
      </p>

      {/* ─── H ─── */}
      <h2 id="section-h">H</h2>

      <h3 id="health-factor">Health Factor</h3>
      <p>
        A numerical measure of a borrowing position{`'`}s solvency, calculated as the ratio of
        risk-adjusted collateral value to total outstanding debt. A health factor below 1.0
        triggers liquidation eligibility. See{' '}
        <Link href="/docs/core-concepts#health-factor">Core Concepts: Health Factor</Link>.
      </p>

      {/* ─── I ─── */}
      <h2 id="section-i">I</h2>

      <h3 id="institutional-pool">Institutional Pool</h3>
      <p>
        A lending pool configured with access controls requiring KYC/KYB verification and
        optionally restricted to specific credential types or jurisdictions. Institutional pools
        enable compliant lending between verified counterparties while maintaining the algorithmic
        rate-setting and automated liquidation of DeFi.
      </p>

      {/* ─── K ─── */}
      <h2 id="section-k">K</h2>

      <h3 id="kyb">KYB (Know Your Business)</h3>
      <p>
        The identity verification process for institutional entities. KYB verifies corporate
        registration, beneficial ownership, regulatory status, and authorized signatories before
        granting access to institutional lending pools and higher credit tiers.
      </p>

      <h3 id="kyc">KYC (Know Your Customer)</h3>
      <p>
        The identity verification process for individual participants. KYC ensures compliance
        with anti-money laundering (AML) regulations and is required for access to regulated
        lending pools. See{' '}
        <Link href="/docs/security/kyc-aml">KYC/AML Compliance</Link>.
      </p>

      {/* ─── L ─── */}
      <h2 id="section-l">L</h2>

      <h3 id="liquidation">Liquidation</h3>
      <p>
        The process by which a borrower{`'`}s collateral is seized and sold to repay their debt
        when their health factor falls below 1.0. Liquidators receive a bonus (typically 5-10%
        of the liquidated collateral) as an incentive. See{' '}
        <Link href="/docs/protocol/liquidation">Liquidation Engine</Link>.
      </p>

      <h3 id="ltv">LTV (Loan-to-Value)</h3>
      <p>
        The ratio of a loan{`'`}s value to the value of the collateral securing it, expressed as
        a percentage. A 75% LTV means a borrower can borrow up to $75 for every $100 of
        collateral posted. Maximum LTV varies by collateral asset type and borrower credit tier.
      </p>

      {/* ─── N ─── */}
      <h2 id="section-n">N</h2>

      <h3 id="netting">Netting</h3>
      <p>
        The process of offsetting mutual obligations between counterparties to reduce the total
        number and value of settlements required. In securities lending, netting reduces
        collateral movement and settlement risk. See{' '}
        <Link href="/docs/securities-lending/netting">Netting & Settlement</Link>.
      </p>

      {/* ─── O ─── */}
      <h2 id="section-o">O</h2>

      <h3 id="oracle">Oracle</h3>
      <p>
        An external data feed that provides real-time asset prices to the protocol. Dualis
        aggregates data from 11 oracle feeds to determine collateral valuations, compute health
        factors, and trigger liquidations. Oracle prices are validated for staleness and deviation
        before use.
      </p>

      {/* ─── P ─── */}
      <h2 id="section-p">P</h2>

      <h3 id="partylayer">PartyLayer</h3>
      <p>
        The wallet SDK used to connect Canton Network participants to the Dualis protocol.
        PartyLayer manages key generation, transaction signing, and party identity on the Canton
        ledger. It provides a wallet-agnostic interface for DeFi operations including supply,
        borrow, repay, and collateral management. See{' '}
        <Link href="/docs/developers/partylayer">PartyLayer (Wallet SDK)</Link>.
      </p>

      <h3 id="pool">Pool</h3>
      <p>
        A lending market for a specific asset where suppliers deposit funds to earn interest and
        borrowers draw loans against posted collateral. Each pool has independent risk parameters
        including reserve factor, interest rate model, and collateral requirements.
      </p>

      <h3 id="privacy-level">Privacy Level</h3>
      <p>
        The degree of data visibility configured for a lending pool or transaction. Canton{`'`}s
        sub-transaction privacy ensures each party sees only the data relevant to their role.
        Privacy levels range from fully private institutional pools to semi-public pools with
        anonymized aggregate statistics.
      </p>

      <h3 id="proposal">Proposal</h3>
      <p>
        A formal governance action submitted by a DUAL token holder for community vote. Proposals
        can modify protocol parameters, adjust risk settings, allocate treasury funds, or upgrade
        smart contracts. Each proposal passes through creation, voting, timelock, and execution
        phases. See <Link href="/docs/governance/proposals">Proposal System</Link>.
      </p>

      {/* ─── Q ─── */}
      <h2 id="section-q">Q</h2>

      <h3 id="quorum">Quorum</h3>
      <p>
        The minimum percentage of total voting power that must participate in a governance vote
        for the result to be valid. Quorum requirements prevent low-turnout votes from making
        significant protocol changes. The quorum threshold is itself a governance-configurable
        parameter.
      </p>

      {/* ─── R ─── */}
      <h2 id="section-r">R</h2>

      <h3 id="reserve-factor">Reserve Factor</h3>
      <p>
        The percentage of interest income retained by the protocol as reserves. Reserves serve
        as a first-loss buffer against bad debt and fund protocol operations. Each pool has an
        independently configurable reserve factor. See{' '}
        <Link href="/docs/core-concepts#reserve-factor">Core Concepts: Reserve Factor</Link>.
      </p>

      {/* ─── S ─── */}
      <h2 id="section-s">S</h2>

      <h3 id="securities-lending">Securities Lending</h3>
      <p>
        The practice of temporarily transferring securities from a lender to a borrower in
        exchange for collateral and a fee. Dualis provides an on-chain securities lending
        marketplace with atomic settlement and automated fee collection. See{' '}
        <Link href="/docs/securities-lending/overview">Securities Lending Overview</Link>.
      </p>

      <h3 id="staking">Staking</h3>
      <p>
        The act of locking DUAL tokens in the protocol to earn a share of protocol revenue and
        gain enhanced governance voting weight. Staked tokens are subject to a cooldown period
        before withdrawal.
      </p>

      <h3 id="sub-transaction-privacy">Sub-transaction Privacy</h3>
      <p>
        A privacy model unique to the Canton Network where different parts of a single transaction
        are visible only to the parties who are directly involved in those parts. This allows
        complex multi-party transactions to execute atomically while preserving confidentiality
        between participants. See{' '}
        <Link href="/docs/canton/privacy">Privacy Architecture</Link>.
      </p>

      <h3 id="supplier">Supplier</h3>
      <p>
        A participant who deposits assets into a Dualis lending pool to earn interest. Suppliers
        provide the liquidity that borrowers draw from and receive a proportional share of the
        interest income generated by the pool, minus the reserve factor.
      </p>

      {/* ─── T ─── */}
      <h2 id="section-t">T</h2>

      <h3 id="timelock">Timelock</h3>
      <p>
        A mandatory delay between when a governance proposal passes and when it can be executed.
        The timelock provides a window for participants to review approved changes, exit
        positions if they disagree, or flag concerns before execution. See{' '}
        <Link href="/docs/governance/timelock">Timelock & Execution</Link>.
      </p>

      <h3 id="tifa-finance">TIFA Finance</h3>
      <p>
        Tokenized Institutional Fixed-income Assets. A category of structured financial products
        that are tokenized and can be used as collateral within the Dualis protocol. TIFA assets
        carry a 20% haircut to account for their illiquidity and complex payoff structures.
      </p>

      {/* ─── U ─── */}
      <h2 id="section-u">U</h2>

      <h3 id="utilization-rate">Utilization Rate</h3>
      <p>
        The percentage of a pool{`'`}s total available liquidity that is currently being borrowed.
        Utilization rate is the primary input to the interest rate model: as utilization increases,
        borrow and supply rates rise to incentivize repayments and attract new deposits. See{' '}
        <Link href="/docs/core-concepts#utilization-rate">Core Concepts: Utilization Rate</Link>.
      </p>

      {/* ─── V ─── */}
      <h2 id="section-v">V</h2>

      <h3 id="veto">Veto</h3>
      <p>
        A governance mechanism that allows designated guardians or a supermajority of token
        holders to block a passed proposal during the timelock period. Veto power serves as a
        safety mechanism against malicious or erroneous governance actions.
      </p>

      <h3 id="voting-power">Voting Power</h3>
      <p>
        The weight assigned to a participant{`'`}s vote in governance decisions, determined by the
        number of DUAL tokens held or delegated. Staked tokens may receive a multiplier on
        voting power to reward long-term protocol alignment. See{' '}
        <Link href="/docs/governance/voting">Voting & Delegation</Link>.
      </p>

      {/* ─── Z ─── */}
      <h2 id="section-z">Z</h2>

      <h3 id="zk-credentials">ZK Credentials</h3>
      <p>
        Zero-knowledge credential proofs that allow participants to demonstrate compliance
        attributes (e.g., accredited investor status, jurisdictional eligibility) without
        revealing the underlying personal data. ZK credentials enable privacy-preserving access
        control for institutional pools while satisfying regulatory requirements.
      </p>
    </>
  );
}
