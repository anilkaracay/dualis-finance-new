/**
 * Canton bootstrap — initializes the Canton integration layer on server start.
 *
 * Sequence:
 *   1. Load environment config
 *   2. Create environment-aware client
 *   3. Test ledger connection (skip in mock mode)
 *   4. Verify / allocate required parties
 *   5. Initialize token bridge
 *   6. Log startup summary
 */

import { createChildLogger } from '../config/logger.js';
import { cantonConfig, type CantonConfig } from '../config/canton-env.js';
import { CantonEnvClient } from './env-client.js';
import { PartyManager, type PartyVerificationResult } from './party-manager.js';
import { createTokenBridge, type ITokenBridge } from './token-bridge.js';

const log = createChildLogger('canton-startup');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CantonBootstrapResult {
  config: CantonConfig;
  client: CantonEnvClient;
  partyManager: PartyManager;
  tokenBridge: ITokenBridge;
  healthy: boolean;
  partyResult: PartyVerificationResult;
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let _bootstrapResult: CantonBootstrapResult | null = null;

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

export async function initializeCanton(): Promise<CantonBootstrapResult> {
  const config = cantonConfig();

  log.info(
    {
      env: config.environment,
      jsonApi: config.jsonApiUrl,
      grpc: config.grpcUrl,
      mock: config.useMockData,
      auth: config.requireAuth,
      tls: config.useTls,
      bridgeMode: config.tokenBridgeMode,
    },
    'Canton bootstrap starting',
  );

  // ── 1. Create environment-aware client ──────────────────────────────────
  const client = CantonEnvClient.getInstance(config);

  // ── 2. Test ledger connection ───────────────────────────────────────────
  let healthy = false;

  if (config.useMockData) {
    log.info('Mock mode — skipping ledger connection test');
    healthy = true;
  } else {
    healthy = await client.isHealthy();
    if (healthy) {
      log.info('Ledger connection verified');

      const identity = await client.getLedgerIdentity();
      if (identity) {
        log.info({ ledgerId: identity.ledgerId }, 'Ledger identity');
      }
    } else {
      log.warn(
        'Ledger connection failed — server will start in degraded mode',
      );
    }
  }

  // ── 3. Verify / allocate parties ────────────────────────────────────────
  const partyManager = new PartyManager(config);
  let partyResult: PartyVerificationResult;

  if (config.useMockData) {
    log.info('Mock mode — skipping party verification');
    partyResult = {
      allFound: true,
      found: [config.parties.operator, config.parties.oracle, config.parties.liquidator, config.parties.treasury],
      missing: [],
    };
  } else if (healthy) {
    partyResult = await partyManager.ensureParties();
    if (!partyResult.allFound) {
      log.warn(
        { missing: partyResult.missing },
        'Some required parties are missing',
      );
    }
  } else {
    log.warn('Skipping party verification — ledger not reachable');
    partyResult = {
      allFound: false,
      found: [],
      missing: [config.parties.operator, config.parties.oracle, config.parties.liquidator, config.parties.treasury],
    };
  }

  // ── 4. Initialize token bridge ──────────────────────────────────────────
  const tokenBridge = createTokenBridge(config);
  const bridgeHealthy = await tokenBridge.isHealthy();
  log.info(
    { mode: config.tokenBridgeMode, healthy: bridgeHealthy },
    'Token bridge initialized',
  );

  // ── 5. Summary ──────────────────────────────────────────────────────────
  const result: CantonBootstrapResult = {
    config,
    client,
    partyManager,
    tokenBridge,
    healthy,
    partyResult,
  };

  _bootstrapResult = result;

  log.info(
    {
      env: config.environment,
      ledger: healthy ? 'connected' : 'disconnected',
      parties: partyResult.allFound ? 'verified' : 'incomplete',
      bridge: config.tokenBridgeMode,
      dar: config.darVersion,
    },
    'Canton bootstrap complete',
  );

  return result;
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getCantonBootstrap(): CantonBootstrapResult | null {
  return _bootstrapResult;
}

export function getTokenBridge(): ITokenBridge | null {
  return _bootstrapResult?.tokenBridge ?? null;
}

export function getPartyManager(): PartyManager | null {
  return _bootstrapResult?.partyManager ?? null;
}

export function getEnvClient(): CantonEnvClient | null {
  return _bootstrapResult?.client ?? null;
}

/** Reset bootstrap state (for testing) */
export function resetCantonBootstrap(): void {
  _bootstrapResult = null;
  CantonEnvClient.resetInstance();
}
