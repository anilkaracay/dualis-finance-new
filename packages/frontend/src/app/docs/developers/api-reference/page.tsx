'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function ApiReferencePage() {
  return (
    <>
      <h1>API Reference</h1>
      <p className="docs-lead">
        The Dualis Finance API exposes 272 endpoints across 19 domain groups, served by
        Fastify 5.7 over HTTP and WebSocket. This page provides an overview of the API
        structure, authentication, and example requests.
      </p>

      <h2 id="base-url">Base URL</h2>
      <p>
        All API endpoints are served under a versioned base path:
      </p>
      <CodeBlock language="text" filename="Base URL">
{`http://localhost:4000/v1`}
      </CodeBlock>
      <p>
        In production, replace the host with your deployment domain (e.g.,{' '}
        <code>https://api.dualis.finance/v1</code>). All responses use{' '}
        <code>application/json</code> content type.
      </p>

      <h2 id="authentication">Authentication</h2>
      <p>
        Protected endpoints require a JWT Bearer token in the <code>Authorization</code>{' '}
        header. Obtain a token by authenticating through the <code>/v1/auth/login</code>{' '}
        endpoint.
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`curl -X POST http://localhost:4000/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "demo@dualis.finance", "password": "Demo1234!"}'`}
      </CodeBlock>
      <p>
        Include the returned token in subsequent requests:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`curl http://localhost:4000/v1/pools \\
  -H "Authorization: Bearer <your-jwt-token>"`}
      </CodeBlock>

      <Callout type="info" title="Token Lifetime">
        JWT tokens expire after 24 hours. Use the <code>/v1/auth/refresh</code> endpoint
        to obtain a new token without re-authenticating.
      </Callout>

      <h2 id="endpoint-groups">Endpoint Groups</h2>
      <p>
        The 272 endpoints are organized into the following domain groups:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Prefix</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Health</td><td><code>/v1/health</code></td><td>Service health and readiness checks</td></tr>
            <tr><td>Auth</td><td><code>/v1/auth</code></td><td>Login, registration, token refresh, sessions</td></tr>
            <tr><td>Pools</td><td><code>/v1/pools</code></td><td>Lending pool listings, details, and statistics</td></tr>
            <tr><td>Supply</td><td><code>/v1/supply</code></td><td>Deposit and withdraw from lending pools</td></tr>
            <tr><td>Borrow</td><td><code>/v1/borrow</code></td><td>Borrow requests, repayments, collateral management</td></tr>
            <tr><td>Credit</td><td><code>/v1/credit</code></td><td>Credit tier assignments, score queries, tier parameters</td></tr>
            <tr><td>Oracle</td><td><code>/v1/oracle</code></td><td>Price feeds, asset valuations, historical prices</td></tr>
            <tr><td>Flash Loans</td><td><code>/v1/flash-loans</code></td><td>Atomic flash loan execution and history</td></tr>
            <tr><td>Securities Lending</td><td><code>/v1/sec-lending</code></td><td>Securities lending offers, matches, and settlements</td></tr>
            <tr><td>Governance</td><td><code>/v1/governance</code></td><td>Proposals, voting, delegation, results</td></tr>
            <tr><td>Staking</td><td><code>/v1/staking</code></td><td>Stake, unstake, rewards, validator info</td></tr>
            <tr><td>Productive</td><td><code>/v1/productive</code></td><td>Yield strategies, vault deposits, auto-compound</td></tr>
            <tr><td>Institutional</td><td><code>/v1/institutional</code></td><td>Institutional accounts, sub-accounts, bulk operations</td></tr>
            <tr><td>Privacy</td><td><code>/v1/privacy</code></td><td>Privacy-preserving transaction controls</td></tr>
            <tr><td>Compliance</td><td><code>/v1/compliance</code></td><td>KYC/AML status, sanctions screening, audit logs</td></tr>
            <tr><td>Analytics</td><td><code>/v1/analytics</code></td><td>Portfolio analytics, TVL, utilization, historical data</td></tr>
            <tr><td>Notifications</td><td><code>/v1/notifications</code></td><td>User notification preferences and delivery</td></tr>
            <tr><td>Admin</td><td><code>/v1/admin</code></td><td>Platform administration and configuration (privileged)</td></tr>
            <tr><td>WebSocket</td><td><code>/v1/ws</code></td><td>Real-time data streams for prices, pools, positions</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="example-get-pools">Example: List Lending Pools</h2>
      <p>
        Retrieve all active lending pools with their current rates and utilization:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`curl http://localhost:4000/v1/pools \\
  -H "Authorization: Bearer <token>"`}
      </CodeBlock>
      <CodeBlock language="json" filename="Response">
{`{
  "data": [
    {
      "id": "pool_usdc_01",
      "asset": "USDC",
      "totalSupply": "12500000.00",
      "totalBorrow": "8750000.00",
      "utilization": 0.70,
      "supplyAPY": 0.0342,
      "borrowAPR": 0.0521,
      "collateralFactor": 0.85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8
  }
}`}
      </CodeBlock>

      <h2 id="example-post-borrow">Example: Request a Borrow</h2>
      <p>
        Submit a borrow request against existing collateral:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`curl -X POST http://localhost:4000/v1/borrow/request \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "poolId": "pool_usdc_01",
    "amount": "5000.00",
    "collateralPositionIds": ["pos_eth_01", "pos_btc_02"]
  }'`}
      </CodeBlock>
      <CodeBlock language="json" filename="Response">
{`{
  "data": {
    "borrowId": "brw_abc123",
    "poolId": "pool_usdc_01",
    "amount": "5000.00",
    "borrowRate": 0.0521,
    "healthFactor": 1.82,
    "status": "pending_settlement",
    "createdAt": "2026-02-28T10:30:00Z"
  }
}`}
      </CodeBlock>

      <Callout type="warning" title="Health Factor">
        The API rejects borrow requests that would push the health factor below 1.0.
        Always check available borrowing power via{' '}
        <code>GET /v1/borrow/capacity</code> before submitting.
      </Callout>

      <h2 id="request-format">Request and Response Format</h2>
      <p>
        All request bodies must be valid JSON. The API validates inputs using Zod 4
        schemas and returns structured errors for invalid payloads (see the{' '}
        <strong>Error Codes</strong> page for details). Successful responses wrap data
        in a <code>{`{ "data": ... }`}</code> envelope. Paginated endpoints include a{' '}
        <code>pagination</code> object with <code>page</code>, <code>limit</code>, and{' '}
        <code>total</code> fields.
      </p>

      <h2 id="full-specification">Full Specification</h2>
      <p>
        For the complete endpoint specification including all request/response schemas,
        query parameters, and error responses, refer to the{' '}
        <code>docs/API_CONTRACT.md</code> file in the repository. The contract document
        covers all 272 endpoints with exhaustive type definitions.
      </p>

      <Callout type="tip" title="OpenAPI">
        An OpenAPI 3.1 specification is auto-generated from the Fastify route schemas.
        Access it at <code>GET /v1/docs/openapi.json</code> when running in development
        mode.
      </Callout>
    </>
  );
}
