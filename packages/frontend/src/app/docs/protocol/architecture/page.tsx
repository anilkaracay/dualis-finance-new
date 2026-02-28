'use client';

import { Callout } from '@/components/docs/Callout';

export default function ArchitecturePage() {
  return (
    <>
      <h1>System Architecture</h1>
      <p className="docs-lead">
        Dualis Finance is built as a modular monorepo that bridges traditional financial
        infrastructure with decentralized smart contracts on the Canton Network. This page
        describes the system topology, technology stack, and data flow for core operations.
      </p>

      <h2 id="high-level-overview">High-Level Overview</h2>
      <p>
        The platform follows a hybrid on-chain/off-chain architecture. User-facing operations
        originate in the frontend, pass through a centralized API layer for validation and
        orchestration, and ultimately settle on Canton via DAML smart contracts. Off-chain
        components handle rate computation, indexing, and caching, while Canton provides
        atomic settlement, privacy-preserving execution, and an immutable audit trail.
      </p>

      <Callout type="info" title="Hybrid Architecture">
        Dualis Finance intentionally separates compute-intensive operations (interest accrual,
        risk calculations) from settlement (Canton). This design keeps gas costs predictable
        while preserving the integrity guarantees of a distributed ledger.
      </Callout>

      <h2 id="tech-stack">Technology Stack</h2>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Technology</th>
              <th>Version</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Frontend</td>
              <td>Next.js / React</td>
              <td>14.2 / 18</td>
              <td>Server-rendered UI with client-side state management</td>
            </tr>
            <tr>
              <td>State Management</td>
              <td>Zustand</td>
              <td>4.x</td>
              <td>Lightweight global state for wallet, positions, pools</td>
            </tr>
            <tr>
              <td>Styling</td>
              <td>Tailwind CSS / Radix UI</td>
              <td>3.x / 1.x</td>
              <td>Utility-first styling with accessible primitives</td>
            </tr>
            <tr>
              <td>API Server</td>
              <td>Fastify</td>
              <td>5.7</td>
              <td>High-performance HTTP + WebSocket API</td>
            </tr>
            <tr>
              <td>ORM</td>
              <td>Drizzle ORM</td>
              <td>0.3x</td>
              <td>Type-safe SQL with zero runtime overhead</td>
            </tr>
            <tr>
              <td>Database</td>
              <td>PostgreSQL</td>
              <td>16</td>
              <td>63 tables covering positions, pools, users, credit, governance</td>
            </tr>
            <tr>
              <td>Cache / Queue</td>
              <td>Redis / BullMQ</td>
              <td>7.x</td>
              <td>Rate caching, session store, and background job processing</td>
            </tr>
            <tr>
              <td>Smart Contracts</td>
              <td>DAML (Canton)</td>
              <td>3.4 / LF 2.1</td>
              <td>38 templates for lending, collateral, liquidation, governance</td>
            </tr>
            <tr>
              <td>Testing</td>
              <td>Vitest</td>
              <td>1.x</td>
              <td>Unit and integration tests (230+ shared package tests)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="monorepo-structure">Monorepo Structure</h2>
      <p>
        The codebase is organized as a pnpm workspace managed by Turborepo. Each package has
        a clear boundary and well-defined dependency graph:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Package</th>
              <th>Path</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>frontend</strong></td>
              <td><code>packages/frontend</code></td>
              <td>Next.js 14 application with App Router, Zustand stores, and Tailwind</td>
            </tr>
            <tr>
              <td><strong>api</strong></td>
              <td><code>packages/api</code></td>
              <td>Fastify server with Drizzle ORM, BullMQ jobs, Canton client</td>
            </tr>
            <tr>
              <td><strong>shared</strong></td>
              <td><code>packages/shared</code></td>
              <td>Financial math engine, type definitions, formatters, constants</td>
            </tr>
            <tr>
              <td><strong>canton</strong></td>
              <td><code>packages/canton</code></td>
              <td>DAML source (25 modules), DAR build scripts, deployment tooling</td>
            </tr>
            <tr>
              <td><strong>config</strong></td>
              <td><code>packages/config</code></td>
              <td>Shared ESLint, TypeScript, and Tailwind configuration</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The <code>shared</code> package must build first because both <code>api</code> and{' '}
        <code>frontend</code> depend on its exported types and utility functions. Turborepo
        handles this ordering automatically via the dependency graph.
      </p>

      <h2 id="data-flow-supply">Data Flow: Supply Operation</h2>
      <p>
        To illustrate how the layers interact, here is the step-by-step data flow when a user
        supplies USDC to a lending pool:
      </p>
      <ol>
        <li>
          <strong>Frontend:</strong> The user connects their Canton wallet via PartyLayer and
          selects an amount to supply. The frontend validates the input and sends a{' '}
          <code>POST /api/v1/pools/:id/supply</code> request.
        </li>
        <li>
          <strong>API &mdash; Validation:</strong> Fastify middleware authenticates the session,
          checks KYC status, and validates the amount against pool limits and the user&apos;s
          wallet balance.
        </li>
        <li>
          <strong>API &mdash; Rate Computation:</strong> The shared math engine calculates
          the current supply index using the jump rate model. The accrued index is persisted
          to PostgreSQL and cached in Redis for subsequent reads.
        </li>
        <li>
          <strong>Canton &mdash; Settlement:</strong> The API submits a DAML command to exercise
          the <code>Supply</code> choice on the <code>LendingPool</code> contract. Canton
          atomically mints pool tokens (dTokens) and transfers the underlying asset.
        </li>
        <li>
          <strong>API &mdash; Indexing:</strong> A BullMQ worker listens for the Canton
          transaction result, updates the position in PostgreSQL, and pushes a WebSocket
          event to the frontend.
        </li>
        <li>
          <strong>Frontend &mdash; Update:</strong> The Zustand store receives the WebSocket
          event, updates the user&apos;s position, and re-renders the portfolio view with the
          new supply balance and projected APY.
        </li>
      </ol>

      <Callout type="tip" title="Atomic Settlement">
        Canton&apos;s DAML runtime guarantees that the token mint and asset transfer in step 4
        either both succeed or both fail. There is no partial state, eliminating an entire
        class of re-entrancy and front-running vulnerabilities common on EVM chains.
      </Callout>

      <h2 id="infrastructure">Infrastructure</h2>
      <p>
        In the current devnet deployment, all services run on a single host behind an Nginx
        reverse proxy with Let&apos;s Encrypt TLS. The Canton validator node (v0.5.12)
        operates within a Docker network, with the JSON API accessible on port 7575 and gRPC
        on port 5001. PostgreSQL, Redis, the API server, and the frontend each run in
        dedicated containers orchestrated by Docker Compose.
      </p>
      <p>
        For mainnet, the architecture is designed to scale horizontally: the API layer is
        stateless (session state lives in Redis), BullMQ workers can be replicated across
        nodes, and PostgreSQL supports read replicas for query-heavy paths such as portfolio
        analytics and pool listings.
      </p>
    </>
  );
}
