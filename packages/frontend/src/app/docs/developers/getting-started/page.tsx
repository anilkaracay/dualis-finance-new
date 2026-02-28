'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function GettingStartedPage() {
  return (
    <>
      <h1>Getting Started</h1>
      <p className="docs-lead">
        Set up a local Dualis Finance development environment from scratch. This guide
        covers prerequisites, repository setup, environment configuration, and running
        the full stack in development mode.
      </p>

      <h2 id="prerequisites">Prerequisites</h2>
      <p>
        Ensure the following tools are installed before proceeding. Version constraints
        are strict &mdash; the codebase relies on APIs and behaviors specific to these
        releases.
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Version</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Node.js</td>
              <td>&gt;=20 &lt;22</td>
              <td>LTS recommended. Node 22+ is not yet supported.</td>
            </tr>
            <tr>
              <td>pnpm</td>
              <td>&gt;=9</td>
              <td>Workspace package manager. Install via <code>corepack enable</code>.</td>
            </tr>
            <tr>
              <td>PostgreSQL</td>
              <td>16</td>
              <td>63 tables &mdash; schema managed by Drizzle ORM migrations.</td>
            </tr>
            <tr>
              <td>Redis</td>
              <td>7.2</td>
              <td>Used for caching, sessions, and BullMQ job queues.</td>
            </tr>
            <tr>
              <td>Docker</td>
              <td>Latest</td>
              <td>Recommended for running infrastructure services.</td>
            </tr>
            <tr>
              <td>DAML SDK</td>
              <td>3.4.11</td>
              <td>Required only if you plan to build or modify smart contracts.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="Quick Check">
        Run <code>node -v && pnpm -v && docker -v</code> to verify your toolchain
        before continuing.
      </Callout>

      <h2 id="clone-and-install">Clone and Install</h2>
      <p>
        Clone the monorepo and install all workspace dependencies. pnpm handles
        cross-package linking automatically.
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`git clone https://github.com/cayvox/dualis-finance.git
cd dualis-finance
pnpm install`}
      </CodeBlock>
      <p>
        The <code>shared</code> package must build first because both <code>api</code> and{' '}
        <code>frontend</code> depend on its exported types. Turborepo handles this
        ordering automatically:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`pnpm run build`}
      </CodeBlock>

      <h2 id="environment-configuration">Environment Configuration</h2>
      <p>
        Copy the example environment files and fill in your local values. Each package
        that requires configuration ships a <code>.env.example</code>.
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`cp packages/api/.env.example packages/api/.env
cp packages/frontend/.env.example packages/frontend/.env`}
      </CodeBlock>
      <p>Key variables for the API package:</p>
      <CodeBlock language="bash" filename="packages/api/.env">
{`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dualis
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-development-secret
CANTON_JSON_API_URL=http://localhost:7575
PORT=4000`}
      </CodeBlock>

      <Callout type="warning" title="Secrets">
        Never commit <code>.env</code> files to version control. The repository&apos;s{' '}
        <code>.gitignore</code> already excludes them, but double-check before pushing.
      </Callout>

      <h2 id="docker-setup">Docker Setup</h2>
      <p>
        The project ships four Docker Compose files for different environments:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>docker-compose.yml</code></td>
              <td>Local development &mdash; PostgreSQL, Redis, and optional Canton sandbox</td>
            </tr>
            <tr>
              <td><code>docker-compose.devnet.yml</code></td>
              <td>Devnet deployment with Nginx, SSL, and Canton validator</td>
            </tr>
            <tr>
              <td><code>docker-compose.test.yml</code></td>
              <td>Isolated test databases and services for CI</td>
            </tr>
            <tr>
              <td><code>docker-compose.prod.yml</code></td>
              <td>Production-ready configuration with resource limits and health checks</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Start the local infrastructure stack:</p>
      <CodeBlock language="bash" filename="Terminal">
{`docker compose up -d`}
      </CodeBlock>
      <p>
        This brings up PostgreSQL on port 5432 and Redis on port 6379. Run the database
        migrations next:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`pnpm --filter @dualis/api run db:migrate`}
      </CodeBlock>

      <h2 id="start-development">Start Development</h2>
      <p>
        With infrastructure running, start the API and frontend in parallel using Turborepo:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`pnpm run dev`}
      </CodeBlock>
      <p>
        The API server starts on <code>http://localhost:4000</code> and the frontend on{' '}
        <code>http://localhost:3000</code>. Both support hot reload.
      </p>

      <h2 id="first-api-call">First API Call</h2>
      <p>
        Verify the stack is healthy by hitting the health endpoint:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`curl http://localhost:4000/v1/health`}
      </CodeBlock>
      <p>Expected response:</p>
      <CodeBlock language="json" filename="Response">
{`{
  "status": "ok",
  "version": "2.0.0",
  "uptime": 12.34,
  "services": {
    "database": "connected",
    "redis": "connected",
    "canton": "connected"
  }
}`}
      </CodeBlock>

      <Callout type="info" title="Canton Optional">
        The API operates in mock mode when Canton is unavailable. Pool data, positions,
        and rate calculations all function with simulated data, making it possible to
        develop frontend features without a running Canton node.
      </Callout>

      <h2 id="running-tests">Running Tests</h2>
      <p>
        The shared math engine has over 230 tests. Run the full suite with Vitest:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`pnpm --filter @dualis/shared test`}
      </CodeBlock>
      <p>
        To run Canton smart contract tests (requires DAML SDK 3.4.11):
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`cd packages/canton/daml
daml build && daml test`}
      </CodeBlock>

      <h2 id="next-steps">Next Steps</h2>
      <ul>
        <li>
          <strong>API Reference</strong> &mdash; Explore the full set of 272 endpoints
          across 19 domain groups.
        </li>
        <li>
          <strong>SDK</strong> &mdash; Learn how to use the <code>@dualis/shared</code>{' '}
          package for financial calculations.
        </li>
        <li>
          <strong>Smart Contracts</strong> &mdash; Dive into the 25 DAML modules that
          power on-chain settlement.
        </li>
        <li>
          <strong>WebSocket</strong> &mdash; Subscribe to real-time price and position
          updates.
        </li>
      </ul>
    </>
  );
}
