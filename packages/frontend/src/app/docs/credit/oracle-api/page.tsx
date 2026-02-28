import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function CreditOracleApiPage() {
  return (
    <>
      <span className="docs-badge">Credit System</span>
      <h1>Credit Oracle API</h1>
      <p className="docs-subtitle">
        External API for querying participant credit scores and tier
        information, enabling third-party platforms to integrate Dualis
        credit data into their own risk and lending decisions.
      </p>

      {/* ── Overview ── */}
      <h2 id="overview">Overview</h2>
      <p>
        The Dualis Credit Oracle API provides read-only access to participant
        credit scores, tier classifications, and scoring component
        breakdowns. Third-party platforms — including other DeFi protocols,
        institutional risk systems, and compliance tools — can query the
        oracle to incorporate Dualis credit data into their own workflows.
      </p>
      <p>
        All API responses are cryptographically signed by the Dualis oracle
        service, enabling on-chain verification of the data&apos;s authenticity
        and freshness. Scores are updated in real time and reflect the
        latest on-chain activity and ZK-verified off-chain attestations.
      </p>

      <Callout type="info" title="Authentication">
        The Credit Oracle API requires an API key issued to verified
        institutional clients. Contact the Dualis team to request access
        credentials. Rate limits and usage terms are outlined in the API
        agreement.
      </Callout>

      {/* ── Endpoint ── */}
      <h2 id="endpoint">Query Endpoint</h2>
      <p>
        The primary endpoint for retrieving a participant&apos;s credit data
        is:
      </p>

      <CodeBlock language="http" filename="Request">
{`GET /api/v1/credit/score/{partyId}

Headers:
  Authorization: Bearer <api-key>
  Accept: application/json`}
      </CodeBlock>

      <p>
        Replace <code>{'{partyId}'}</code> with the Canton party identifier
        of the participant whose score you wish to query. The party ID is the
        full Canton party string including the namespace.
      </p>

      <h3>Example Request</h3>

      <CodeBlock language="bash" filename="cURL">
{`curl -X GET \\
  https://api.dualis.finance/api/v1/credit/score/participant-1::12204bcabe5f \\
  -H "Authorization: Bearer dk_live_abc123..." \\
  -H "Accept: application/json"`}
      </CodeBlock>

      {/* ── Response Format ── */}
      <h2 id="response-format">Response Format</h2>
      <p>
        The API returns a JSON object containing the composite score, tier
        classification, individual component scores, and metadata:
      </p>

      <CodeBlock language="json" filename="Response — 200 OK">
{`{
  "partyId": "participant-1::12204bcabe5f",
  "score": {
    "composite": 872,
    "tier": "Diamond",
    "tierRange": {
      "min": 850,
      "max": 1000
    }
  },
  "components": {
    "onChain": {
      "weight": 0.40,
      "score": 910,
      "subFactors": {
        "loanCompletion": 285,
        "repaymentTimeliness": 240,
        "volumeHistory": 180,
        "collateralHealth": 130,
        "securitiesLending": 75
      }
    },
    "offChain": {
      "weight": 0.35,
      "score": 850,
      "zkProofValid": true,
      "lastAttestationDate": "2026-02-15T10:30:00Z"
    },
    "ecosystemReputation": {
      "weight": 0.25,
      "score": 820
    }
  },
  "tierParameters": {
    "maxLTV": 0.85,
    "rateDiscount": -0.25,
    "minCollateralRatio": 1.15,
    "liquidationBuffer": 0.05
  },
  "metadata": {
    "lastUpdated": "2026-02-28T14:22:15Z",
    "nextScheduledUpdate": "2026-03-01T00:00:00Z",
    "signatureHash": "0x7f3a...b42d",
    "oracleVersion": "1.2.0"
  }
}`}
      </CodeBlock>

      {/* ── Field Reference ── */}
      <h2 id="field-reference">Field Reference</h2>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>score.composite</code></td>
              <td>integer</td>
              <td>The weighted composite score (0&ndash;1000)</td>
            </tr>
            <tr>
              <td><code>score.tier</code></td>
              <td>string</td>
              <td>Current tier: Diamond, Gold, Silver, Bronze, or Unrated</td>
            </tr>
            <tr>
              <td><code>components.onChain.subFactors</code></td>
              <td>object</td>
              <td>Breakdown of the five on-chain sub-factor scores</td>
            </tr>
            <tr>
              <td><code>components.offChain.zkProofValid</code></td>
              <td>boolean</td>
              <td>Whether the latest ZK proof is valid and unexpired</td>
            </tr>
            <tr>
              <td><code>tierParameters</code></td>
              <td>object</td>
              <td>Active lending parameters for the participant&apos;s current tier</td>
            </tr>
            <tr>
              <td><code>metadata.signatureHash</code></td>
              <td>string</td>
              <td>Cryptographic signature for on-chain verification</td>
            </tr>
            <tr>
              <td><code>metadata.lastUpdated</code></td>
              <td>ISO 8601</td>
              <td>Timestamp of the most recent score recalculation</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Error Responses ── */}
      <h2 id="error-responses">Error Responses</h2>

      <CodeBlock language="json" filename="404 — Party Not Found">
{`{
  "error": "PARTY_NOT_FOUND",
  "message": "No credit record exists for the specified party ID.",
  "statusCode": 404
}`}
      </CodeBlock>

      <CodeBlock language="json" filename="401 — Unauthorized">
{`{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired API key.",
  "statusCode": 401
}`}
      </CodeBlock>

      {/* ── Use Cases ── */}
      <h2 id="use-cases">Use Cases for Third-Party Platforms</h2>
      <p>
        The Credit Oracle API enables a range of integrations across the
        Canton ecosystem and beyond:
      </p>
      <ul>
        <li>
          <strong>Cross-protocol lending</strong> — Other DeFi protocols on
          Canton can query a borrower&apos;s Dualis credit score to offer
          preferential terms, creating a composable credit layer across the
          network.
        </li>
        <li>
          <strong>Institutional risk management</strong> — Traditional
          financial institutions can integrate Dualis scores into their
          counterparty risk models, supplementing internal credit
          assessments with on-chain behavioural data.
        </li>
        <li>
          <strong>Compliance and audit</strong> — Compliance platforms can
          monitor participant credit standing in real time, flagging score
          deterioration or tier downgrades for review.
        </li>
        <li>
          <strong>Insurance underwriting</strong> — DeFi insurance providers
          can use credit scores to price coverage for under-collateralised
          positions, enabling more granular risk-based pricing.
        </li>
      </ul>

      <Callout type="tip" title="On-Chain Verification">
        The <code>signatureHash</code> in the response metadata can be
        verified against the Dualis oracle&apos;s public key, which is
        published on-chain. This allows smart contracts on Canton or other
        networks to trustlessly validate the authenticity of credit data
        fetched through the API.
      </Callout>

      {/* ── Rate Limits ── */}
      <h2 id="rate-limits">Rate Limits</h2>
      <p>
        API access is subject to the following rate limits, based on the
        client&apos;s subscription tier:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Requests / Minute</th>
              <th>Requests / Day</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Standard</td>
              <td>60</td>
              <td>10,000</td>
            </tr>
            <tr>
              <td>Professional</td>
              <td>300</td>
              <td>100,000</td>
            </tr>
            <tr>
              <td>Enterprise</td>
              <td>1,000</td>
              <td>Unlimited</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        For WebSocket-based real-time score streaming, see the{' '}
        <a href="/docs/developers/websocket">WebSocket API</a> documentation.
      </p>
    </>
  );
}
