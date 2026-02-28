'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function ErrorCodesPage() {
  return (
    <>
      <h1>Error Codes</h1>
      <p className="docs-lead">
        The Dualis Finance API uses standard HTTP status codes combined with structured
        error responses. This page documents every status code, the custom error code
        format, common errors with troubleshooting steps, and rate limiting behavior.
      </p>

      <h2 id="http-status-codes">HTTP Status Codes</h2>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>200</td><td>OK</td><td>Request succeeded. Response body contains the requested data.</td></tr>
            <tr><td>201</td><td>Created</td><td>Resource created successfully (e.g., new borrow position, supply position).</td></tr>
            <tr><td>400</td><td>Bad Request</td><td>Malformed request body, missing required fields, or invalid parameter types.</td></tr>
            <tr><td>401</td><td>Unauthorized</td><td>Missing, invalid, or expired JWT token in the Authorization header.</td></tr>
            <tr><td>403</td><td>Forbidden</td><td>Valid token but insufficient permissions (e.g., non-admin accessing admin routes).</td></tr>
            <tr><td>404</td><td>Not Found</td><td>The requested resource does not exist (e.g., unknown pool ID, position ID).</td></tr>
            <tr><td>409</td><td>Conflict</td><td>State conflict (e.g., duplicate supply to the same pool, position already liquidated).</td></tr>
            <tr><td>422</td><td>Unprocessable Entity</td><td>Validation passed but business logic rejected the request (e.g., health factor too low).</td></tr>
            <tr><td>429</td><td>Too Many Requests</td><td>Rate limit exceeded. Check <code>Retry-After</code> header for backoff duration.</td></tr>
            <tr><td>500</td><td>Internal Server Error</td><td>Unexpected server error. Includes a correlation ID for debugging.</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="error-response-format">Error Response Format</h2>
      <p>
        All error responses follow a consistent JSON structure. The <code>code</code>{' '}
        field uses a namespaced format that identifies both the domain and the specific
        error:
      </p>
      <CodeBlock language="json" filename="Error Response">
{`{
  "error": {
    "code": "BORROW_HEALTH_FACTOR_TOO_LOW",
    "message": "Borrow would reduce health factor below 1.0",
    "details": {
      "currentHealthFactor": 1.82,
      "projectedHealthFactor": 0.91,
      "minimumRequired": 1.0
    },
    "correlationId": "req_7f3a2b1c",
    "timestamp": "2026-02-28T10:30:00Z"
  }
}`}
      </CodeBlock>

      <h2 id="custom-error-codes">Custom Error Code Format</h2>
      <p>
        Error codes follow the pattern{' '}
        <code>DOMAIN_SPECIFIC_ERROR</code> using uppercase snake_case. The domain
        prefix maps to the API endpoint group:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Error Code</th>
              <th>HTTP Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Auth</td><td><code>AUTH_INVALID_CREDENTIALS</code></td><td>401</td><td>Email or password is incorrect</td></tr>
            <tr><td>Auth</td><td><code>AUTH_TOKEN_EXPIRED</code></td><td>401</td><td>JWT token has expired</td></tr>
            <tr><td>Auth</td><td><code>AUTH_INSUFFICIENT_PERMISSIONS</code></td><td>403</td><td>User lacks required role</td></tr>
            <tr><td>Pool</td><td><code>POOL_NOT_FOUND</code></td><td>404</td><td>Pool ID does not exist</td></tr>
            <tr><td>Pool</td><td><code>POOL_PAUSED</code></td><td>422</td><td>Pool is temporarily paused by governance</td></tr>
            <tr><td>Supply</td><td><code>SUPPLY_EXCEEDS_CAP</code></td><td>422</td><td>Amount exceeds pool supply cap</td></tr>
            <tr><td>Supply</td><td><code>SUPPLY_INSUFFICIENT_BALANCE</code></td><td>422</td><td>Wallet balance too low for requested supply</td></tr>
            <tr><td>Borrow</td><td><code>BORROW_HEALTH_FACTOR_TOO_LOW</code></td><td>422</td><td>Borrow would reduce health factor below 1.0</td></tr>
            <tr><td>Borrow</td><td><code>BORROW_EXCEEDS_CAPACITY</code></td><td>422</td><td>Amount exceeds available borrowing power</td></tr>
            <tr><td>Borrow</td><td><code>BORROW_NO_COLLATERAL</code></td><td>422</td><td>No collateral positions found for borrower</td></tr>
            <tr><td>Credit</td><td><code>CREDIT_TIER_INSUFFICIENT</code></td><td>422</td><td>Credit tier does not qualify for this pool</td></tr>
            <tr><td>Oracle</td><td><code>ORACLE_PRICE_STALE</code></td><td>422</td><td>Price feed data is too old for safe operation</td></tr>
            <tr><td>Canton</td><td><code>CANTON_SUBMISSION_FAILED</code></td><td>500</td><td>DAML command submission rejected by Canton</td></tr>
            <tr><td>Canton</td><td><code>CANTON_CONTRACT_NOT_FOUND</code></td><td>404</td><td>Referenced contract ID not active on ledger</td></tr>
            <tr><td>Canton</td><td><code>CANTON_AUTHORIZATION_FAILED</code></td><td>403</td><td>Signing party not authorized for this choice</td></tr>
            <tr><td>Rate</td><td><code>RATE_LIMIT_EXCEEDED</code></td><td>429</td><td>Too many requests in the current window</td></tr>
            <tr><td>Validation</td><td><code>VALIDATION_FAILED</code></td><td>400</td><td>Zod schema validation failed</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="common-errors">Common Errors and Troubleshooting</h2>

      <h3>AUTH_TOKEN_EXPIRED</h3>
      <p>
        JWT tokens expire after 24 hours. Use the refresh endpoint to obtain a new
        token without re-entering credentials:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`curl -X POST http://localhost:4000/v1/auth/refresh \\
  -H "Authorization: Bearer <expired-token>"`}
      </CodeBlock>

      <h3>BORROW_HEALTH_FACTOR_TOO_LOW</h3>
      <p>
        The requested borrow would push the health factor below the minimum threshold
        of 1.0. To resolve this:
      </p>
      <ul>
        <li>Reduce the borrow amount</li>
        <li>Add more collateral via <code>POST /v1/borrow/add-collateral</code></li>
        <li>Repay existing debt to free up borrowing capacity</li>
      </ul>

      <h3>CANTON_SUBMISSION_FAILED</h3>
      <p>
        The DAML command was rejected by the Canton participant. Check the{' '}
        <code>details</code> field for the raw Canton error. Common causes include
        stale contract IDs (the contract was already archived) and insufficient
        party authorization. The API&apos;s error mapper{' '}
        (<code>packages/api/src/canton/error-mapper.ts</code>) translates raw Canton
        errors into the structured format shown above.
      </p>

      <h3>VALIDATION_FAILED</h3>
      <p>
        Request body did not pass Zod 4 schema validation. The <code>details</code>{' '}
        field contains the specific validation errors:
      </p>
      <CodeBlock language="json" filename="Validation Error">
{`{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "details": {
      "issues": [
        {
          "path": ["amount"],
          "message": "Expected string, received number"
        },
        {
          "path": ["poolId"],
          "message": "Required"
        }
      ]
    }
  }
}`}
      </CodeBlock>

      <Callout type="tip" title="Correlation ID">
        Every error response includes a <code>correlationId</code>. When reporting
        issues, include this ID so the team can trace the request through API logs,
        BullMQ job history, and Canton transaction records.
      </Callout>

      <h2 id="rate-limiting">Rate Limiting</h2>
      <p>
        The API enforces rate limits per authenticated user. Limits vary by endpoint
        group:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Endpoint Group</th>
              <th>Window</th>
              <th>Max Requests</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Read endpoints (GET)</td><td>1 minute</td><td>300</td></tr>
            <tr><td>Write endpoints (POST/PUT/DELETE)</td><td>1 minute</td><td>60</td></tr>
            <tr><td>Auth endpoints</td><td>15 minutes</td><td>10</td></tr>
            <tr><td>Admin endpoints</td><td>1 minute</td><td>30</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        When a rate limit is exceeded, the API returns HTTP 429 with headers indicating
        the limit state:
      </p>
      <CodeBlock language="text" filename="Rate Limit Headers">
{`X-RateLimit-Limit: 300
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1709118660
Retry-After: 42`}
      </CodeBlock>

      <Callout type="warning" title="Backoff Strategy">
        Implement exponential backoff when receiving 429 responses. Repeatedly hitting
        rate limits without backing off may result in temporary IP-level blocking.
      </Callout>

      <h2 id="canton-errors">Canton-Specific Errors</h2>
      <p>
        Errors originating from the Canton ledger are mapped through the error mapper
        before reaching the client. The original Canton error is preserved in the{' '}
        <code>details.cantonError</code> field for debugging purposes. Canton errors
        typically indicate contract-level issues: archived contracts, unauthorized
        parties, or DAML runtime exceptions. These map to either 403, 404, or 500
        HTTP status codes depending on the root cause.
      </p>
    </>
  );
}
