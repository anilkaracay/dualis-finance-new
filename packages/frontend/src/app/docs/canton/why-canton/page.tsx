'use client';

import { Callout } from '@/components/docs/Callout';

export default function WhyCantonPage() {
  return (
    <>
      <h1>Why Canton</h1>
      <p className="docs-lead">
        Dualis Finance is not built on Ethereum, Solana, or any general-purpose L1. It is built on
        Canton -- the institutional blockchain designed by Digital Asset for regulated financial
        markets. This page explains why that choice is foundational, not incidental.
      </p>

      <h2 id="where-the-assets-are">1. Where the Assets Are</h2>
      <p>
        The tokenized asset opportunity is not in retail speculation. It is in institutional
        securities. DTCC processes over $2.4 quadrillion in transactions annually and clears
        virtually every U.S. equity trade. DTCC runs on Canton. Euroclear, which settles
        approximately $1 trillion per day in bonds, has deployed its Digital Financial Market
        Infrastructure (D-FMI) on Canton. LSEG, the London Stock Exchange Group, is building
        its digital asset platform on Canton.
      </p>
      <p>
        When $99 trillion in assets under custody at DTCC alone starts moving on-chain, it will
        move on Canton -- not on chains designed for NFT mints and meme coins. Dualis Finance is
        positioned at the infrastructure layer where these assets will need lending, borrowing, and
        yield generation services.
      </p>

      <h2 id="privacy-by-design">2. Privacy by Design</h2>
      <p>
        Public blockchains expose every transaction to every participant. Goldman Sachs cannot
        broadcast its repo positions to the world. A pension fund cannot reveal its collateral
        portfolio to competing institutions. Canton solves this with sub-transaction privacy:
        each participant in a transaction sees only the parts they are authorized to see.
      </p>
      <p>
        This is not a bolt-on privacy layer or a zero-knowledge rollup. Privacy is built into
        Canton&apos;s consensus protocol itself. Every DAML contract defines signatories and
        observers, and the Canton synchronization protocol ensures that only relevant parties
        receive relevant data. For institutional lending, this is a non-negotiable requirement.
      </p>

      <h2 id="daml-smart-contracts">3. DAML Smart Contracts</h2>
      <p>
        Canton&apos;s smart contract language, DAML, was purpose-built for financial workflows.
        Unlike Solidity, DAML is a functional language with a formal type system that eliminates
        entire categories of vulnerabilities. There are no reentrancy attacks in DAML. There is no
        unchecked arithmetic overflow. The signatory model means no contract can move assets
        without explicit authorization from the asset owner.
      </p>
      <p>
        Dualis leverages 25 DAML modules containing 38 contract templates that encode the full
        lending lifecycle -- from pool creation and interest accrual to collateral management,
        liquidation cascades, and governance proposals. Every state transition is atomic and
        verifiable.
      </p>

      <h2 id="regulatory-alignment">4. Regulatory Alignment</h2>
      <p>
        Institutional DeFi cannot exist without regulatory compatibility. Canton was designed from
        the ground up to satisfy the requirements of banking regulators, securities commissions,
        and central banks. Its participant model supports KYC/AML at the network level. Its
        deterministic finality means settlement is legally final, not probabilistic. Its
        permissioned synchronization domains allow regulators to audit transactions without
        requiring all data to be public.
      </p>
      <p>
        Dualis inherits these properties. Our credit tier system, Sumsub KYC integration, and
        Chainalysis screening layer on top of Canton&apos;s built-in compliance architecture to
        deliver a lending protocol that institutional compliance officers can approve.
      </p>

      <h2 id="real-liquidity-pipeline">5. Real Liquidity Pipeline</h2>
      <p>
        Canton&apos;s ecosystem is not theoretical. It includes active participants that control
        real liquidity: DTCC, Euroclear, LSEG, Broadridge, Goldman Sachs, and others. As these
        institutions tokenize treasuries, bonds, equities, and fund shares on Canton, the demand
        for on-chain lending infrastructure grows. Dualis is building the lending layer that this
        pipeline requires.
      </p>
      <p>
        The path to real TVL does not run through liquidity mining incentives. It runs through
        tokenized U.S. Treasuries that need to be pledged as collateral, through institutional
        borrowers that need short-term liquidity against their security holdings, and through
        market makers that need flash loan capabilities for arbitrage between Canton
        synchronization domains.
      </p>

      <Callout type="info" title="Institutional Blockchain">
        Canton is not competing with Ethereum or Solana for retail DeFi users. It is the
        blockchain that DTCC, Euroclear, Goldman Sachs, and LSEG have chosen for regulated
        financial markets. Dualis Finance is the lending protocol built for that ecosystem --
        not a retail DeFi competitor, but an institutional DeFi primitive.
      </Callout>

      <h2 id="summary">Summary</h2>
      <p>
        The choice of Canton is not a technology preference. It is a market thesis. Institutional
        assets will tokenize on the blockchain that institutional players trust. That blockchain
        is Canton. Dualis Finance exists to serve the lending and borrowing needs of that market --
        with the privacy, compliance, and smart contract guarantees that institutional
        participants demand.
      </p>
    </>
  );
}
