import { Callout } from '@/components/docs/Callout';
import Link from 'next/link';

export default function WhyDualis() {
  return (
    <>
      <h1 id="why-dualis">Why Dualis Finance Exists</h1>
      <p>
        Capital markets are undergoing a generational transformation. Trillions of dollars in
        traditional securities are being tokenized, yet the lending infrastructure for these assets
        remains fragmented between opaque institutional workflows and permissionless DeFi protocols
        that cannot meet regulatory requirements. Dualis Finance was built to close that gap.
      </p>

      {/* ─── Securities Lending is Broken ─── */}
      <h2 id="securities-lending-broken">Securities Lending is Broken</h2>
      <p>
        The global securities lending market exceeds <strong>$2.8 trillion</strong> in outstanding
        loans. Despite its scale, the market operates on infrastructure that has not fundamentally
        changed in decades. Borrowing securities today requires navigating a chain of intermediaries
        -- prime brokers, custodians, tri-party agents, and clearing houses -- each adding cost,
        latency, and opacity to the process.
      </p>
      <p>
        Settlement cycles still default to <strong>T+2</strong> in most markets, meaning capital
        remains locked for days while counterparties wait for delivery-versus-payment to complete.
        Prime brokers act as gatekeepers, bundling lending with other services in ways that obscure
        true borrowing costs. The result is a market where:
      </p>
      <ul>
        <li>
          <strong>Small and mid-sized institutions</strong> are priced out of direct lending markets,
          forced to accept unfavorable terms from a handful of dominant brokers.
        </li>
        <li>
          <strong>Price discovery is poor</strong> because loan terms are negotiated bilaterally
          with minimal transparency into market-wide rates.
        </li>
        <li>
          <strong>Capital efficiency is low</strong> because collateral is over-pledged to
          compensate for the lack of real-time risk monitoring and counterparty visibility.
        </li>
        <li>
          <strong>Operational risk is high</strong> due to manual reconciliation across
          disconnected systems, with settlement failures costing the industry billions annually.
        </li>
      </ul>

      {/* ─── DeFi Lending is Incomplete ─── */}
      <h2 id="defi-lending-incomplete">DeFi Lending is Incomplete</h2>
      <p>
        Decentralized lending protocols like Aave and Compound have demonstrated that algorithmic
        interest rates, automated liquidation, and permissionless market creation can dramatically
        improve lending efficiency. However, these protocols were designed for retail cryptocurrency
        markets and carry fundamental limitations when applied to institutional use cases:
      </p>
      <ul>
        <li>
          <strong>Over-collateralization only.</strong> DeFi lending protocols universally require
          borrowers to post more collateral than they borrow, typically 120-150% of the loan value.
          This eliminates the possibility of credit-based lending, which is the backbone of
          institutional finance.
        </li>
        <li>
          <strong>No transaction privacy.</strong> Every position, liquidation, and trade is visible
          on-chain to all participants. Institutional borrowers cannot operate in an environment where
          competitors can monitor their lending positions and trading strategies in real time.
        </li>
        <li>
          <strong>No compliance framework.</strong> Permissionless protocols have no mechanism for
          KYC/KYB verification, accredited investor checks, or jurisdictional restrictions. This
          makes them unusable for regulated entities operating under SEC, MiFID II, or MAS frameworks.
        </li>
        <li>
          <strong>Limited asset support.</strong> Existing protocols are designed for fungible
          cryptocurrency tokens. They cannot natively handle tokenized bonds with coupon schedules,
          equity securities with corporate action events, or structured products with complex
          payoff profiles.
        </li>
      </ul>

      {/* ─── The Gap Dualis Fills ─── */}
      <h2 id="the-gap">The Gap Dualis Fills</h2>
      <Callout type="tip" title="The Dualis Thesis">
        Institutional lending needs the capital efficiency of DeFi and the privacy and compliance
        guarantees of traditional finance. These are not competing requirements -- they are
        complementary layers that belong in a single protocol.
      </Callout>
      <p>
        Dualis Finance combines the best mechanisms from both worlds into a unified lending protocol:
      </p>
      <ul>
        <li>
          <strong>Hybrid lending.</strong> Both over-collateralized and under-collateralized lending
          in a single protocol, with loan-to-value ratios adjusted dynamically by a{' '}
          <Link href="/docs/credit/tiers">five-tier credit system</Link> (Diamond, Gold, Silver,
          Bronze, Unrated).
        </li>
        <li>
          <strong>Sub-transaction privacy.</strong> Built on the Canton Network, Dualis leverages
          DAML smart contracts where each party only sees the portions of a transaction relevant to
          them. A borrower{`'`}s position details are invisible to other borrowers and suppliers.
        </li>
        <li>
          <strong>Asset-agnostic collateral.</strong> The{' '}
          <Link href="/docs/protocol/collateral-framework">collateral framework</Link> supports
          cryptocurrency, tokenized real-world assets (RWAs), and tokenized institutional fixed-income
          assets (TIFAs), each with tier-specific haircut models.
        </li>
        <li>
          <strong>Institutional compliance.</strong> KYC/KYB verification, credential-gated pool
          access, and jurisdiction-aware lending rules are enforced at the smart contract layer, not
          bolted on as an afterthought.
        </li>
        <li>
          <strong>Atomic settlement.</strong> Canton{`'`}s deterministic finality eliminates T+2
          delays. Lending, collateral posting, and settlement occur in a single atomic transaction.
        </li>
        <li>
          <strong>Algorithmic pricing.</strong> Interest rates are governed by a{' '}
          <Link href="/docs/protocol/interest-rate-model">jump rate model</Link> that responds to
          pool utilization in real time, providing transparent and efficient price discovery.
        </li>
      </ul>

      {/* ─── Why Now ─── */}
      <h2 id="why-now">Why Now</h2>
      <p>
        Several converging trends make this the right moment for an institutional-grade DeFi lending
        protocol:
      </p>
      <ul>
        <li>
          <strong>Tokenization is accelerating.</strong> DTCC has launched tokenized U.S. Treasury
          clearing. BlackRock, Franklin Templeton, and JP Morgan are actively tokenizing money market
          funds and fixed-income products. The tokenized asset market is projected to reach $16
          trillion by 2030.
        </li>
        <li>
          <strong>DeFi is moving institutional.</strong> Aave has launched Aave Horizon for
          institutional participants with permissioned pools. MakerDAO has rebranded to Sky and
          integrated real-world asset vaults. The boundary between TradFi and DeFi is dissolving.
        </li>
        <li>
          <strong>Regulatory clarity is emerging.</strong> The EU{`'`}s MiCA regulation, Singapore{`'`}s
          MAS digital asset framework, and evolving SEC guidance are creating clearer rules for
          on-chain financial products, giving institutions the confidence to participate.
        </li>
        <li>
          <strong>Canton Network is production-ready.</strong> Canton has grown from a concept to a
          live network with participants including Goldman Sachs, BNY Mellon, Cboe, and others. Its
          privacy model and DAML smart contract language are purpose-built for the multi-party
          workflows that institutional lending demands.
        </li>
      </ul>
      <p>
        Dualis Finance is not building a theoretical product for a future market. The tokenized
        lending market exists today, growing rapidly, and it needs infrastructure that takes both
        capital efficiency and institutional requirements seriously. That is what Dualis delivers.
      </p>
    </>
  );
}
