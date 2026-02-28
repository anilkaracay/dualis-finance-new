'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function WebSocketPage() {
  return (
    <>
      <h1>WebSocket API</h1>
      <p className="docs-lead">
        The Dualis Finance WebSocket API provides real-time data streams for prices,
        pool updates, position changes, liquidation events, governance activity, and
        user notifications. The endpoint is powered by Fastify&apos;s built-in WebSocket
        support.
      </p>

      <h2 id="endpoint">Endpoint</h2>
      <CodeBlock language="text" filename="WebSocket URL">
{`GET ws://localhost:4000/v1/ws`}
      </CodeBlock>
      <p>
        In production, use the secure variant:{' '}
        <code>wss://api.dualis.finance/v1/ws</code>. The server accepts standard
        WebSocket upgrade requests.
      </p>

      <h2 id="authentication">Authentication</h2>
      <p>
        After establishing the WebSocket connection, the client must send an
        authentication message within <strong>30 seconds</strong>. Connections that
        fail to authenticate within this window are terminated automatically.
      </p>
      <CodeBlock language="json" filename="Auth Message">
{`{
  "type": "auth",
  "token": "your-jwt-token"
}`}
      </CodeBlock>
      <p>
        On successful authentication, the server responds with:
      </p>
      <CodeBlock language="json" filename="Auth Response">
{`{
  "type": "auth",
  "status": "ok",
  "userId": "usr_abc123"
}`}
      </CodeBlock>

      <Callout type="warning" title="Auth Timeout">
        The server enforces a strict 30-second authentication window. If your client
        does not send the auth message in time, the connection is closed with WebSocket
        close code 4001.
      </Callout>

      <h2 id="subscribing">Subscribing to Channels</h2>
      <p>
        Once authenticated, subscribe to one or more data channels. Each subscription
        message specifies a channel name and optional filter parameters:
      </p>
      <CodeBlock language="json" filename="Subscribe Message">
{`{
  "type": "subscribe",
  "channel": "prices",
  "params": {
    "assets": ["ETH", "BTC", "USDC"]
  }
}`}
      </CodeBlock>
      <p>To unsubscribe from a channel:</p>
      <CodeBlock language="json" filename="Unsubscribe Message">
{`{
  "type": "unsubscribe",
  "channel": "prices"
}`}
      </CodeBlock>

      <h2 id="channels">Available Channels</h2>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Description</th>
              <th>Update Frequency</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>prices</code></td>
              <td>Real-time asset price updates from oracle feeds</td>
              <td>~1s per asset</td>
            </tr>
            <tr>
              <td><code>pools</code></td>
              <td>Pool state changes: utilization, rates, TVL</td>
              <td>On change (typically every block)</td>
            </tr>
            <tr>
              <td><code>positions</code></td>
              <td>User position updates: supply balances, borrow balances, health factors</td>
              <td>On change</td>
            </tr>
            <tr>
              <td><code>liquidations</code></td>
              <td>Liquidation events: trigger, auction start, settlement</td>
              <td>On event</td>
            </tr>
            <tr>
              <td><code>governance</code></td>
              <td>Proposal creation, voting updates, execution results</td>
              <td>On event</td>
            </tr>
            <tr>
              <td><code>notifications</code></td>
              <td>User-specific alerts: health factor warnings, reward claims, system notices</td>
              <td>On event</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="message-format">Message Format</h2>
      <p>
        All server-sent messages follow a consistent envelope structure:
      </p>
      <CodeBlock language="json" filename="Server Message">
{`{
  "type": "data",
  "channel": "prices",
  "timestamp": "2026-02-28T10:30:00.000Z",
  "data": {
    "asset": "ETH",
    "price": "3245.67",
    "change24h": -0.0182,
    "source": "oracle_aggregated"
  }
}`}
      </CodeBlock>

      <h2 id="keepalive">Keepalive</h2>
      <p>
        The server sends WebSocket ping frames every <strong>30 seconds</strong>. Clients
        must respond with pong frames (most WebSocket libraries handle this automatically).
        If the server receives no pong within 30 seconds, it considers the connection
        dead and closes it.
      </p>
      <p>
        Clients can also send application-level heartbeat messages:
      </p>
      <CodeBlock language="json" filename="Heartbeat">
{`{
  "type": "ping"
}`}
      </CodeBlock>
      <p>The server responds with:</p>
      <CodeBlock language="json" filename="Heartbeat Response">
{`{
  "type": "pong",
  "timestamp": "2026-02-28T10:30:15.000Z"
}`}
      </CodeBlock>

      <h2 id="client-example">Client Example</h2>
      <p>
        A complete TypeScript client that connects, authenticates, subscribes to price
        updates, and handles reconnection:
      </p>
      <CodeBlock language="typescript" filename="ws-client.ts">
{`const WS_URL = 'ws://localhost:4000/v1/ws';
const AUTH_TOKEN = 'your-jwt-token';

let ws: WebSocket;
let reconnectTimer: ReturnType<typeof setTimeout>;

function connect() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    // Authenticate within 30s window
    ws.send(JSON.stringify({ type: 'auth', token: AUTH_TOKEN }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case 'auth':
        if (msg.status === 'ok') {
          // Subscribe to channels after auth
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'prices',
            params: { assets: ['ETH', 'BTC'] },
          }));
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'positions',
          }));
        }
        break;

      case 'data':
        console.log(\`[\${msg.channel}]\`, msg.data);
        break;

      case 'error':
        console.error('WS error:', msg.message);
        break;
    }
  };

  ws.onclose = (event) => {
    console.log(\`Connection closed: \${event.code}\`);
    // Reconnect after 3 seconds
    reconnectTimer = setTimeout(connect, 3000);
  };

  ws.onerror = () => {
    ws.close();
  };
}

connect();`}
      </CodeBlock>

      <Callout type="tip" title="React Integration">
        In the Dualis frontend, WebSocket state is managed by a Zustand 5 store that
        handles connection lifecycle, automatic reconnection, and channel subscriptions.
        Components subscribe to specific slices of the store for efficient re-rendering.
      </Callout>

      <h2 id="error-messages">Error Messages</h2>
      <p>
        The server sends error messages for invalid requests or server-side issues:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Close Code</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>4001</td><td>Authentication timeout (30s exceeded)</td></tr>
            <tr><td>4002</td><td>Invalid or expired JWT token</td></tr>
            <tr><td>4003</td><td>Unknown channel name</td></tr>
            <tr><td>4004</td><td>Rate limit exceeded</td></tr>
            <tr><td>1011</td><td>Internal server error</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
