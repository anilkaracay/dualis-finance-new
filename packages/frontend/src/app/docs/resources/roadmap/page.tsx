'use client';

import { Callout } from '@/components/docs/Callout';

export default function RoadmapPage() {
  return (
    <>
      <h1>Roadmap</h1>
      <p className="docs-lead">
        Dualis Finance follows a phased development roadmap from protocol foundation through
        mainnet launch and ecosystem growth. This page outlines the key milestones, current
        status, and planned timeline.
      </p>

      <h2 id="timeline">Development Timeline</h2>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Phase</th>
              <th>Period</th>
              <th>Status</th>
              <th>Key Milestones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Foundation</strong></td>
              <td>Q4 2024 -- Q1 2025</td>
              <td style={{ color: '#22c55e', fontWeight: 600 }}>Completed</td>
              <td>
                Protocol architecture design, financial math engine (Jump Rate Model, health
                factor, liquidation thresholds), shared package with 230+ unit tests, initial
                DAML contract design, database schema (63 tables), monorepo scaffolding with
                pnpm and Turborepo
              </td>
            </tr>
            <tr>
              <td><strong>Development</strong></td>
              <td>Q1 -- Q4 2025</td>
              <td style={{ color: '#22c55e', fontWeight: 600 }}>Completed</td>
              <td>
                Full-stack implementation: Fastify API (272 endpoints), Next.js frontend (43
                pages, 119 components), 25 DAML modules with 38 contract templates, credit
                tier system (5 tiers), governance contracts, oracle integration (11 feeds),
                flash loan engine, securities lending marketplace, Canton devnet deployment,
                PartyLayer wallet integration, Sumsub KYC/KYB integration, Chainalysis
                screening
              </td>
            </tr>
            <tr>
              <td><strong>Audit and Preparation</strong></td>
              <td>Q1 -- Q2 2026</td>
              <td style={{ color: 'var(--docs-accent)', fontWeight: 600 }}>Active</td>
              <td>
                External security audit of DAML contracts, API, and frontend. Devnet
                stabilization and performance testing. Documentation site completion.
                Institutional onboarding pipeline. Legal and compliance framework
                finalization. Mainnet deployment planning and infrastructure provisioning
              </td>
            </tr>
            <tr>
              <td><strong>Mainnet Launch</strong></td>
              <td>Q2 -- Q3 2026</td>
              <td style={{ color: '#a78bfa', fontWeight: 600 }}>Planned</td>
              <td>
                Canton mainnet deployment, initial pool launches (USDC, USDT, ETH, BTC),
                institutional partner onboarding, governance activation with DUAL token
                distribution, oracle feed production deployment, monitoring and alerting
                infrastructure
              </td>
            </tr>
            <tr>
              <td><strong>Growth</strong></td>
              <td>H2 2026</td>
              <td style={{ color: '#a78bfa', fontWeight: 600 }}>Planned</td>
              <td>
                RWA collateral pool expansion (tokenized treasuries, corporate bonds),
                TIFA invoice collateral activation, cross-domain lending via Canton
                synchronization domains, advanced institutional features (netting, recall,
                prime brokerage), SDK and API ecosystem for third-party integrations,
                additional credit data source integrations
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="current-phase">Current Phase: Audit and Preparation</h2>
      <p>
        Dualis Finance is currently in the Audit and Preparation phase. The full protocol has been
        built and deployed to Canton devnet, where all core DeFi operations -- supply, withdraw,
        borrow, repay, add collateral, and liquidation -- are functional. The focus is now on
        security hardening, external audit engagement, documentation completion, and preparing
        the infrastructure and partnerships needed for mainnet launch.
      </p>

      <Callout type="info" title="Devnet Available">
        The Dualis devnet deployment is live and accessible for testing. All DeFi operations
        work end-to-end on Canton. This environment will continue to serve as the staging
        ground for new features and pre-production testing after mainnet launch.
      </Callout>

      <h2 id="what-shipped">What Has Shipped</h2>
      <p>
        As of the current phase, the following has been built and deployed:
      </p>
      <ul>
        <li>116,000+ lines of TypeScript across the pnpm monorepo</li>
        <li>11,300+ lines of DAML defining 38 contract templates in 25 modules</li>
        <li>272 API endpoints backed by 63 PostgreSQL tables</li>
        <li>43 frontend pages with 119 React components</li>
        <li>11 oracle price feeds with staleness detection</li>
        <li>5-tier credit system with composite scoring</li>
        <li>4-tier liquidation cascade engine</li>
        <li>Full governance suite with proposals, voting, delegation, and timelock</li>
        <li>Securities lending marketplace for institutional users</li>
        <li>Flash loan engine with atomic execution on Canton</li>
        <li>Canton devnet deployment with end-to-end DeFi operations</li>
      </ul>

      <h2 id="beyond-2026">Beyond 2026</h2>
      <p>
        The long-term vision for Dualis extends beyond the initial mainnet launch. Future
        directions include multi-domain lending across Canton synchronization domains,
        integration with additional institutional asset issuers, advanced risk modeling
        with machine learning-based credit scoring, and expansion of the protocol&apos;s
        governance to include community-driven parameter management. Specific timelines for
        these initiatives will be published as the mainnet launch stabilizes and the
        institutional user base grows.
      </p>
    </>
  );
}
