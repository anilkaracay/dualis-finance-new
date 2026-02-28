'use client';

import { Callout } from '@/components/docs/Callout';

export default function FaqPage() {
  return (
    <>
      <h1>Frequently Asked Questions</h1>
      <p className="docs-lead">
        Answers to the most common questions about Dualis Finance, the Canton Network, and how
        the protocol works.
      </p>

      {/* ─── General ─── */}

      <h2 id="general">General</h2>

      <h3 id="what-is-dualis">What is Dualis Finance?</h3>
      <p>
        Dualis Finance is an institutional-grade hybrid lending protocol built on the Canton
        Network. It enables users to supply, borrow, and earn yield on tokenized assets including
        cryptocurrencies, real-world assets (RWAs), and tokenized invoices (TIFA). The protocol
        supports both over-collateralized and under-collateralized lending through a proprietary
        credit tier system.
      </p>

      <h3 id="is-dualis-rwa">Is Dualis an RWA platform?</h3>
      <p>
        No. Dualis is not an asset tokenization platform. It is a lending layer. Other participants
        in the Canton ecosystem -- such as DTCC, BlackRock, and TIFA Finance -- tokenize assets.
        Dualis provides the lending, borrowing, and yield infrastructure that those tokenized assets
        need. Think of Dualis as Aave for institutional tokenized assets, not as the tokenizer itself.
      </p>

      <h3 id="who-built-dualis">Who built Dualis Finance?</h3>
      <p>
        Dualis Finance is built by Cayvox Labs, a fintech engineering studio focused on
        institutional DeFi infrastructure. The protocol is designed and engineered for regulated
        financial markets.
      </p>

      <h3 id="is-it-open-source">Is Dualis open source?</h3>
      <p>
        The protocol codebase is maintained at{' '}
        <a href="https://github.com/cayvox/dualis-finance" style={{ color: 'var(--docs-accent)' }}>
          github.com/cayvox/dualis-finance
        </a>. The documentation, shared utility libraries, and integration SDKs are available for
        developer reference. Smart contract source code and core protocol logic will be published
        following the completion of the external security audit.
      </p>

      {/* ─── Canton & Technology ─── */}

      <h2 id="canton-technology">Canton and Technology</h2>

      <h3 id="what-is-canton">What is the Canton Network?</h3>
      <p>
        Canton is a privacy-enabled, interoperable blockchain designed by Digital Asset for
        regulated financial markets. It provides sub-transaction privacy, deterministic finality,
        and smart contracts written in DAML. Institutions including DTCC, Euroclear, LSEG, and
        Goldman Sachs are building on Canton.
      </p>

      <h3 id="why-not-ethereum">Why not Ethereum or Solana?</h3>
      <p>
        Institutional lending requires privacy, regulatory compliance, and deterministic settlement.
        Public blockchains expose all transaction data, have probabilistic finality, and lack
        built-in identity and privacy primitives. Canton was specifically designed for regulated
        financial markets, which is where the tokenized assets Dualis serves are being issued.
      </p>

      <h3 id="what-wallets">What wallets are supported?</h3>
      <p>
        Dualis supports Canton-native wallets through the PartyLayer SDK integration. Users can
        connect with Console, Loop, or any Canton-compatible wallet that supports the PartyLayer
        interface. Wallet connection manages Canton party identity, transaction signing, and
        Canton Coin balance queries.
      </p>

      <h3 id="what-is-daml">What is DAML?</h3>
      <p>
        DAML (Digital Asset Modeling Language) is the smart contract language for Canton. It is a
        type-safe, functional language derived from Haskell that models multi-party workflows with
        explicit authorization via signatories and observers. Dualis uses 38 DAML contract
        templates across 25 modules.
      </p>

      {/* ─── Lending & Rates ─── */}

      <h2 id="lending-rates">Lending and Rates</h2>

      <h3 id="how-rates-determined">How are interest rates determined?</h3>
      <p>
        Dualis uses a Jump Rate Model that adjusts supply and borrow rates based on pool
        utilization. Below the optimal utilization threshold, rates increase gradually. Above it,
        rates jump sharply to incentivize repayment and new supply. Each pool has configurable
        parameters: base rate, rate slope 1, rate slope 2, and optimal utilization. Credit tier
        discounts are applied on top of the base model.
      </p>

      <h3 id="what-is-health-factor">What is a health factor?</h3>
      <p>
        The health factor is a numeric measure of a borrower&apos;s collateral adequacy. It equals
        the risk-adjusted collateral value divided by the total borrow value. A health factor
        above 1.0 means the position is solvent. At exactly 1.0 or below, the position becomes
        eligible for liquidation.
      </p>

      <h3 id="what-happens-liquidation">What happens when my health factor drops below 1.0?</h3>
      <p>
        Dualis uses a four-tier liquidation cascade. First, a gentle partial liquidation closes a
        small portion of the position to restore solvency. If that is insufficient, progressively
        more aggressive liquidation steps are triggered, up to full position closure. Liquidators
        receive an incentive bonus for executing liquidations. The cascade design minimizes
        unnecessary collateral loss for borrowers while ensuring protocol solvency.
      </p>

      <h3 id="what-are-credit-tiers">What are credit tiers?</h3>
      <p>
        Dualis implements five credit tiers -- Diamond, Gold, Silver, Bronze, and Unrated -- that
        determine a borrower&apos;s maximum loan-to-value ratio and interest rate discount.
        Higher-tier borrowers can access more favorable terms, including under-collateralized
        lending. Credit tiers are assigned based on on-chain credit attestations and composite
        scoring from multiple data sources.
      </p>

      <h3 id="what-collateral-types">What types of collateral are accepted?</h3>
      <p>
        Dualis supports three collateral classes: crypto assets (no haircut applied), real-world
        assets or RWAs (5% haircut), and TIFA tokenized invoices (20% haircut). Each class has
        different risk parameters including liquidation thresholds, LTV caps, and liquidation
        bonuses calibrated to the asset&apos;s risk profile.
      </p>

      {/* ─── Features ─── */}

      <h2 id="features">Features</h2>

      <h3 id="flash-loans">How do flash loans work on Dualis?</h3>
      <p>
        Flash loans allow users to borrow any amount from a lending pool without collateral,
        provided the full amount plus a fee is returned within the same transaction. On Canton,
        this is implemented as an atomic DAML choice that must complete within a single
        transaction boundary. If the repayment condition is not met, the entire transaction
        reverts. Flash loans are useful for arbitrage, collateral swaps, and self-liquidation.
      </p>

      <h3 id="securities-lending">Does Dualis support securities lending?</h3>
      <p>
        Yes. The institutional track includes a securities lending marketplace where verified
        institutions can lend and borrow tokenized securities. This includes features such as
        recall rights, netting, and fee negotiation. Securities lending is available to
        Institutional and Institutional Prime tier users who have completed KYB verification.
      </p>

      <h3 id="can-use-without-kyc">Can I use Dualis without KYC?</h3>
      <p>
        The retail basic track allows users to supply crypto assets to lending pools with only
        an email and wallet connection, without full KYC. However, borrowing, RWA collateral,
        and higher position limits require Sumsub KYC verification. Institutional features
        require full KYB and enhanced due diligence.
      </p>

      {/* ─── Token & Governance ─── */}

      <h2 id="token-governance">Token and Governance</h2>

      <h3 id="what-is-dual-token">What is the DUAL token?</h3>
      <p>
        DUAL is the governance token of Dualis Finance. It is used for voting on protocol
        proposals, delegating voting power, and participating in governance decisions such as
        parameter changes, pool additions, and protocol upgrades. DUAL is implemented as a
        DAML contract on Canton with standard transfer, mint, and burn capabilities.
      </p>

      <h3 id="how-governance-works">How does governance work?</h3>
      <p>
        Protocol governance follows a proposal lifecycle: creation, voting period, timelock, and
        execution. Any DUAL holder above the proposal threshold can create a proposal. During the
        voting period, token holders cast votes weighted by their DUAL balance. Approved proposals
        enter a timelock period before execution, providing a security window for review.
      </p>

      <h3 id="what-are-fees">What fees does Dualis charge?</h3>
      <p>
        Dualis collects revenue through supply spreads (a portion of borrow interest), borrow
        premiums, flash loan fees, and liquidation incentive spreads. Fee parameters are set
        per pool and can be adjusted through governance proposals. Protocol reserves accumulate
        from fee revenue and serve as a backstop against bad debt.
      </p>

      {/* ─── Technical ─── */}

      <h2 id="technical">Technical</h2>

      <h3 id="how-oracle-works">How do price oracles work?</h3>
      <p>
        Dualis aggregates price data from 11 oracle feeds through the{' '}
        <code>Dualis.Oracle.PriceFeed</code> DAML module. Prices are aggregated using a median
        filter with staleness checks. If a price feed becomes stale (exceeds the configured
        freshness threshold), the staleness checker trigger activates a circuit breaker that
        pauses affected operations until fresh data is available.
      </p>

      <h3 id="how-interest-accrues">How does interest accrual work?</h3>
      <p>
        Interest accrues using an index-based model that operates in O(1) time per update.
        Rather than iterating over individual positions, the protocol maintains global supply
        and borrow indices that compound over time. Individual position values are calculated
        by multiplying the user&apos;s principal by the ratio of the current index to the
        index at the time of their last interaction. This approach scales efficiently regardless
        of the number of positions in a pool.
      </p>

      <Callout type="tip" title="More Questions?">
        If your question is not covered here, reach out to the Dualis team at{' '}
        <a href="mailto:info@cayvox.com" style={{ color: 'var(--docs-accent)' }}>
          info@cayvox.com
        </a>{' '}
        or review the detailed protocol documentation in the sidebar.
      </Callout>
    </>
  );
}
