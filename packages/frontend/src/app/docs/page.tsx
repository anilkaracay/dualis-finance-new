import Link from 'next/link';

const STATS = [
  { value: '116K+', label: 'Lines of Code' },
  { value: '272', label: 'API Endpoints' },
  { value: '38', label: 'DAML Templates' },
  { value: '11', label: 'Oracle Feeds' },
];

const START_HERE = [
  {
    title: 'Core Concepts',
    description: 'Understand hybrid lending, credit tiers, health factors, and the dual-track architecture that powers Dualis.',
    href: '/docs/core-concepts',
  },
  {
    title: 'Architecture',
    description: 'Explore the full-stack protocol architecture from DAML smart contracts to the React frontend.',
    href: '/docs/protocol/architecture',
  },
  {
    title: 'Getting Started',
    description: 'Set up your development environment, connect to the Canton Network, and deploy your first integration.',
    href: '/docs/developers/getting-started',
  },
  {
    title: 'Fee Structure',
    description: 'Review the protocol fee model including supply spreads, borrow premiums, flash loan fees, and liquidation incentives.',
    href: '/docs/economics/fees',
  },
];

export default function DocsIntroduction() {
  return (
    <>
      {/* ─── Hero ─── */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="introduction" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Dualis Finance Documentation
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          The institutional-grade lending protocol built for the tokenized economy
        </p>
        <p>
          Dualis Finance is a hybrid lending protocol deployed on the Canton Network that bridges
          institutional securities lending with decentralized finance. It enables regulated
          institutions to lend and borrow tokenized real-world assets, digital securities, and
          cryptocurrencies through a unified, privacy-preserving platform. By combining on-chain
          credit scoring, sub-transaction privacy, and programmable risk parameters via DAML smart
          contracts, Dualis delivers capital-efficient lending with the compliance guarantees that
          institutional participants require. The protocol supports both over-collateralized and
          under-collateralized lending, powered by a proprietary credit tier system that adjusts
          loan-to-value ratios and interest rates based on borrower creditworthiness.
        </p>
      </div>

      {/* ─── Stats Grid ─── */}
      <h2 id="protocol-at-a-glance">Protocol at a Glance</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--docs-border)',
              background: 'var(--docs-bg-card)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--docs-accent)',
                marginBottom: '0.25rem',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--docs-text-secondary)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Start Here ─── */}
      <h2 id="start-here">Start Here</h2>
      <p>
        Whether you are a protocol integrator, institutional client, or contributor, these four
        entry points will orient you within the Dualis documentation.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}
      >
        {START_HERE.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              display: 'block',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--docs-border)',
              background: 'var(--docs-bg-card)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.2s',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: 'var(--docs-accent)',
              }}
            >
              {card.title}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--docs-text-secondary)', lineHeight: 1.5 }}>
              {card.description}
            </div>
          </Link>
        ))}
      </div>

      {/* ─── What Dualis Covers ─── */}
      <h2 id="what-dualis-covers">What This Documentation Covers</h2>
      <p>
        This documentation is organized into ten sections that span the full depth of the protocol:
      </p>
      <ul>
        <li>
          <strong>Overview</strong> -- motivation, core concepts, and glossary to build foundational understanding.
        </li>
        <li>
          <strong>Protocol</strong> -- architecture, hybrid lending mechanics, collateral framework, interest rate model,
          liquidation engine, flash loans, and the privacy model.
        </li>
        <li>
          <strong>Securities Lending</strong> -- institutional marketplace, fee structure, netting, and settlement.
        </li>
        <li>
          <strong>Credit System</strong> -- hybrid credit scoring, the five credit tiers, under-collateralized lending
          workflows, and the Credit Oracle API.
        </li>
        <li>
          <strong>Governance</strong> -- DUAL token mechanics, proposal lifecycle, voting and delegation, and timelock
          execution.
        </li>
        <li>
          <strong>Economics</strong> -- fee structure, revenue model, token economics, and Canton Coin reward distribution.
        </li>
        <li>
          <strong>Canton Network</strong> -- why Canton was chosen, ecosystem positioning, DAML smart contract design, and
          privacy architecture.
        </li>
        <li>
          <strong>Developers</strong> -- getting started guide, API reference for all 272 endpoints, SDK integration,
          PartyLayer wallet SDK, smart contract reference, WebSocket API, and error codes.
        </li>
        <li>
          <strong>Security</strong> -- security model, audit status, KYC/AML compliance, and bug bounty program.
        </li>
        <li>
          <strong>Resources</strong> -- FAQ, roadmap, brand assets, and contact information.
        </li>
      </ul>

      {/* ─── Ecosystem Context ─── */}
      <h2 id="ecosystem">Ecosystem</h2>
      <p>
        Dualis Finance is built by{' '}
        <strong>Cayvox Labs</strong>, a fintech engineering studio focused on institutional DeFi
        infrastructure. The protocol is deployed on the Canton Network -- a privacy-enabled,
        interoperable blockchain designed by Digital Asset for regulated financial markets. Canton
        provides sub-transaction privacy, deterministic finality, and composable smart contracts
        written in DAML, making it the ideal foundation for an institutional lending protocol that
        must meet stringent compliance and confidentiality requirements.
      </p>
      <p>
        The Dualis codebase spans over 116,000 lines of TypeScript across a pnpm monorepo, with
        11,300+ lines of DAML defining 38 contract templates across 25 modules. The backend serves
        272 API endpoints backed by 63 database tables, while the frontend delivers 43 pages through
        119 React components. Every layer -- from interest rate calculations to liquidation cascades --
        is designed for institutional-grade reliability and auditability.
      </p>
    </>
  );
}
