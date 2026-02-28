'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function SdkPage() {
  return (
    <>
      <h1>SDK &mdash; @dualis/shared</h1>
      <p className="docs-lead">
        The <code>@dualis/shared</code> package is the TypeScript SDK at the heart of
        Dualis Finance. It provides 94 shared type definitions, 30+ utility functions
        for financial math, and configuration constants used by both the API server and
        the frontend.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        Rather than duplicating financial logic across packages, Dualis centralizes all
        rate calculations, health factor computations, formatting utilities, and protocol
        configuration in a single shared package. This guarantees that the numbers
        displayed in the frontend exactly match those computed on the server and validated
        on Canton.
      </p>
      <p>
        The package is built with TypeScript and outputs CommonJS modules. It must build
        before the <code>api</code> and <code>frontend</code> packages, which Turborepo
        handles automatically via the dependency graph.
      </p>

      <h2 id="installation">Installation</h2>
      <p>
        Within the monorepo, the shared package is already linked as a workspace
        dependency. If you need to reference it explicitly:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`pnpm --filter @dualis/api add @dualis/shared@workspace:*
pnpm --filter @dualis/frontend add @dualis/shared@workspace:*`}
      </CodeBlock>

      <h2 id="key-exports">Key Exports</h2>
      <p>
        The package exposes several categories of utilities:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Function</th>
              <th>Module</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>calculateAPY</code></td>
              <td>math</td>
              <td>Converts APR to APY using continuous compounding</td>
            </tr>
            <tr>
              <td><code>calculateBorrowRate</code></td>
              <td>math</td>
              <td>Jump Rate Model &mdash; returns borrow rate for a given utilization</td>
            </tr>
            <tr>
              <td><code>calculateSupplyRate</code></td>
              <td>math</td>
              <td>Derives supply rate from borrow rate, utilization, and reserve factor</td>
            </tr>
            <tr>
              <td><code>calculateHealthFactor</code></td>
              <td>math</td>
              <td>Computes health factor from collateral and debt positions</td>
            </tr>
            <tr>
              <td><code>calculateUtilization</code></td>
              <td>math</td>
              <td>Returns pool utilization ratio (totalBorrow / totalSupply)</td>
            </tr>
            <tr>
              <td><code>calculateLiquidationThreshold</code></td>
              <td>math</td>
              <td>Determines the price level at which a position becomes liquidatable</td>
            </tr>
            <tr>
              <td><code>formatCurrency</code></td>
              <td>format</td>
              <td>Formats a number as a USD string with proper separators</td>
            </tr>
            <tr>
              <td><code>formatPercentage</code></td>
              <td>format</td>
              <td>Formats a decimal as a percentage string (e.g., 0.05 to &quot;5.00%&quot;)</td>
            </tr>
            <tr>
              <td><code>formatCompact</code></td>
              <td>format</td>
              <td>Formats large numbers with K/M/B suffixes</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="usage-example">Usage Example</h2>
      <p>
        The following example demonstrates how to compute pool rates and a borrower&apos;s
        health factor using the shared math engine:
      </p>
      <CodeBlock language="typescript" filename="example.ts">
{`import {
  calculateBorrowRate,
  calculateSupplyRate,
  calculateAPY,
  calculateHealthFactor,
  formatCurrency,
  formatPercentage,
} from '@dualis/shared';

// Pool parameters
const utilization = 0.72; // 72% utilized
const rateModel = {
  baseRate: 0.02,
  multiplier: 0.1,
  jumpMultiplier: 0.8,
  kink: 0.8,
};
const reserveFactor = 0.1;

// Calculate rates
const borrowRate = calculateBorrowRate(utilization, rateModel);
const supplyRate = calculateSupplyRate(borrowRate, utilization, reserveFactor);
const borrowAPY = calculateAPY(borrowRate);
const supplyAPY = calculateAPY(supplyRate);

console.log(\`Borrow APY: \${formatPercentage(borrowAPY)}\`);
// => "Borrow APY: 9.65%"

console.log(\`Supply APY: \${formatPercentage(supplyAPY)}\`);
// => "Supply APY: 6.25%"

// Health factor calculation (new overload)
const healthResult = calculateHealthFactor(
  [
    { asset: 'ETH', valueUSD: 10000, collateralFactor: 0.82 },
    { asset: 'BTC', valueUSD: 25000, collateralFactor: 0.78 },
  ],
  [
    { asset: 'USDC', valueUSD: 15000 },
  ]
);

console.log(\`Health Factor: \${healthResult.healthFactor.toFixed(2)}\`);
// => "Health Factor: 1.85"

console.log(\`Liquidation at: \${formatCurrency(healthResult.liquidationThresholdUSD)}\`);
// => "Liquidation at: $18,292.68"`}
      </CodeBlock>

      <Callout type="warning" title="Overloaded Signatures">
        The <code>calculateHealthFactor</code> function has two overloads. The legacy
        signature accepts raw arrays and returns a plain <code>number</code>. The new
        signature accepts typed <code>CollateralPositionInput[]</code> and{' '}
        <code>DebtPositionInput[]</code> and returns a <code>HealthFactorResult</code>{' '}
        object. If you use the legacy overload, cast the return value:{' '}
        <code>as number</code>.
      </Callout>

      <h2 id="configuration-exports">Configuration Exports</h2>
      <p>
        The <code>config</code> module exports protocol parameters that mirror the
        on-chain DAML contract state:
      </p>
      <ul>
        <li>
          <strong>Rate Models</strong> &mdash; Jump Rate Model parameters per asset class
        </li>
        <li>
          <strong>Collateral Parameters</strong> &mdash; LTV caps, liquidation bonuses,
          and haircuts by tier (crypto: 0%, RWA: 5%, TIFA: 20%)
        </li>
        <li>
          <strong>Credit Tiers</strong> &mdash; Diamond, Gold, Silver, Bronze, and
          Unrated with corresponding rate discounts and LTV caps
        </li>
      </ul>

      <h2 id="testing">Testing</h2>
      <p>
        The shared package ships with 230+ tests covering all math functions, edge
        cases, and configuration invariants. Run them with Vitest:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`pnpm --filter @dualis/shared test`}
      </CodeBlock>

      <Callout type="tip" title="Stale Builds">
        If tests pass locally but fail in CI, or vice versa, the <code>dist/</code>{' '}
        directory may be stale. Delete it and rebuild: <code>rm -rf packages/shared/dist
        && pnpm run build</code>.
      </Callout>

      <h2 id="type-definitions">Type Definitions</h2>
      <p>
        The package exports 94 TypeScript types covering every domain entity: pools,
        positions, users, credit tiers, governance proposals, oracle prices, and more.
        These types are the single source of truth shared between the Fastify API routes
        (Zod 4 validation schemas) and the Next.js 14.2 frontend (Zustand 5 stores).
      </p>
    </>
  );
}
