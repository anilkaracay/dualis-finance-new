'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function PartyLayerPage() {
  return (
    <>
      <h1>PartyLayer Integration</h1>
      <p className="docs-lead">
        PartyLayer is the Canton wallet abstraction SDK that Dualis Finance uses to
        connect users to the Canton Network. It handles wallet discovery, party
        identification, transaction signing, and balance queries without exposing
        low-level Canton gRPC or JSON API details.
      </p>

      <h2 id="what-is-partylayer">What Is PartyLayer?</h2>
      <p>
        Canton operates on a party-based identity model rather than the address-based
        model common on EVM chains. Each participant on the network is identified by a
        party ID &mdash; a long opaque string tied to a specific Canton participant node.
        PartyLayer abstracts this complexity behind a familiar wallet-connection interface.
      </p>
      <p>
        When a user connects their Canton wallet through PartyLayer, the SDK:
      </p>
      <ul>
        <li>Discovers available Canton wallet providers in the browser</li>
        <li>Prompts the user to select and authorize a wallet connection</li>
        <li>Retrieves the user&apos;s party ID from the connected wallet</li>
        <li>Signs DAML command submissions on behalf of the user</li>
        <li>Queries Canton Coin (CC) balances via the Splice Scan external-party API</li>
      </ul>

      <Callout type="info" title="Wallet-Agnostic Design">
        Dualis Finance is wallet-agnostic. All DeFi operations (supply, borrow, repay,
        withdraw, add collateral) use PartyLayer signing payloads, meaning any
        Canton-compatible wallet can be used without code changes.
      </Callout>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        The integration follows a three-step pattern for every Canton transaction:
      </p>
      <ol>
        <li>
          <strong>Prepare:</strong> The API server builds a DAML command payload
          (e.g., exercise the <code>Supply</code> choice on a <code>LendingPool</code>{' '}
          contract) and returns it to the frontend as a signing request.
        </li>
        <li>
          <strong>Sign:</strong> The frontend passes the payload to PartyLayer, which
          routes it to the connected wallet for user approval and cryptographic signing.
          The connected wallet&apos;s party is used as the <code>actAs</code> party in
          the signing payload.
        </li>
        <li>
          <strong>Submit:</strong> The signed command is submitted to the Canton
          participant node via the JSON API. The transaction settles atomically on the
          Canton ledger.
        </li>
      </ol>

      <h2 id="integration-example">Integration Example</h2>
      <p>
        The following example shows how to connect a wallet and execute a supply
        operation using PartyLayer in a React component:
      </p>
      <CodeBlock language="typescript" filename="useCantonWallet.ts">
{`import { usePartyLayer } from '@aspect/party-layer-react';
import { useCallback } from 'react';

export function useCantonWallet() {
  const {
    connect,
    disconnect,
    connected,
    partyId,
    signPayload,
    getBalance,
  } = usePartyLayer();

  const supply = useCallback(async (poolId: string, amount: string) => {
    if (!connected || !partyId) {
      throw new Error('Wallet not connected');
    }

    // 1. Request signing payload from API
    const res = await fetch('/api/v1/supply/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poolId, amount, partyId }),
    });
    const { payload } = await res.json();

    // 2. Sign with connected wallet (actAs = connected party)
    const signed = await signPayload(payload);

    // 3. Submit signed command
    const submitRes = await fetch('/api/v1/supply/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signed }),
    });

    return submitRes.json();
  }, [connected, partyId, signPayload]);

  return { connect, disconnect, connected, partyId, supply, getBalance };
}`}
      </CodeBlock>

      <h2 id="balance-queries">Balance Queries</h2>
      <p>
        PartyLayer exposes Canton Coin (CC) balance queries through the Splice Scan
        external-party API. The SDK handles the authentication and request formatting:
      </p>
      <CodeBlock language="typescript" filename="BalanceDisplay.tsx">
{`import { useCantonWallet } from '@/hooks/useCantonWallet';
import { useEffect, useState } from 'react';

export function BalanceDisplay() {
  const { connected, partyId, getBalance } = useCantonWallet();
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (connected && partyId) {
      getBalance(partyId).then(setBalance);
    }
  }, [connected, partyId, getBalance]);

  if (!connected) return <p>Connect your wallet to view balance.</p>;

  return <p>CC Balance: {balance ?? 'Loading...'}</p>;
}`}
      </CodeBlock>

      <Callout type="tip" title="Fallback Behavior">
        If the Splice Scan API is unreachable, the SDK falls back to querying the
        Canton participant&apos;s JSON API directly. This ensures balance display
        remains functional even during Scan API outages.
      </Callout>

      <h2 id="devnet-configuration">Devnet Configuration</h2>
      <p>
        On the Dualis devnet, the PartyLayer SDK connects to the Canton validator
        running at <code>84.32.223.16</code>. The validator party ID is configured in
        the environment:
      </p>
      <CodeBlock language="bash" filename=".env">
{`NEXT_PUBLIC_CANTON_PARTICIPANT_URL=http://172.18.0.7:7575
NEXT_PUBLIC_PARTYLAYER_NETWORK=devnet`}
      </CodeBlock>
      <p>
        The participant container runs within the Docker network{' '}
        <code>splice-validator_splice_validator</code>. External access is routed
        through the host&apos;s Nginx reverse proxy.
      </p>

      <h2 id="error-handling">Error Handling</h2>
      <p>
        Canton errors from DAML command submissions are mapped to user-friendly messages
        by the API&apos;s error mapper (<code>packages/api/src/canton/error-mapper.ts</code>).
        Common scenarios include insufficient balance, contract not found, and
        authorization failures. PartyLayer surfaces these as typed exceptions that the
        frontend can catch and display.
      </p>

      <h2 id="resources">Resources</h2>
      <ul>
        <li>
          <a
            href="https://github.com/aspect-build/party-layer"
            target="_blank"
            rel="noopener noreferrer"
          >
            PartyLayer GitHub Repository
          </a>
          {' '}&mdash; Source code, API documentation, and release notes
        </li>
        <li>
          <a
            href="https://docs.canton.network"
            target="_blank"
            rel="noopener noreferrer"
          >
            Canton Network Documentation
          </a>
          {' '}&mdash; Canton participant setup, DAML basics, and network topology
        </li>
      </ul>
    </>
  );
}
