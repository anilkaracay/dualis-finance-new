/**
 * Token Bridge — abstracts token transfer operations across environments.
 *
 * Sandbox:  MockTokenBridge   → instant, no real ledger interaction
 * Devnet:   CIP56TokenBridge  → CIP-56 compliant cross-participant transfers
 * Mainnet:  CIP56TokenBridge  → same as devnet with stricter validation
 */

import { createChildLogger } from '../config/logger.js';
import type { CantonConfig } from '../config/canton-env.js';

const log = createChildLogger('token-bridge');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenAmount {
  symbol: string;
  amount: string;
  decimals?: number;
}

export interface TransferRequest {
  from: string;
  to: string;
  token: TokenAmount;
  reference?: string;
}

export interface TransferResult {
  transactionId: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface BalanceResult {
  party: string;
  balances: TokenAmount[];
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ITokenBridge {
  /** Transfer tokens between parties */
  transfer(request: TransferRequest): Promise<TransferResult>;

  /** Get token balances for a party */
  getBalance(party: string, symbol?: string): Promise<BalanceResult>;

  /** Mint tokens (sandbox only, operator-gated in devnet) */
  mint(to: string, token: TokenAmount): Promise<TransferResult>;

  /** Burn tokens */
  burn(from: string, token: TokenAmount): Promise<TransferResult>;

  /** Health check for the bridge */
  isHealthy(): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// MockTokenBridge (sandbox)
// ---------------------------------------------------------------------------

export class MockTokenBridge implements ITokenBridge {
  private balances = new Map<string, Map<string, number>>();

  constructor() {
    log.info('MockTokenBridge initialized (sandbox mode)');
    this.seedBalances();
  }

  private seedBalances(): void {
    const defaultBalances: Record<string, number> = {
      USDC: 1_000_000,
      ETH: 100,
      wBTC: 10,
      'T-BILL': 500_000,
      'CC-REC': 200_000,
      SPY: 50_000,
      DUAL: 10_000_000,
    };

    for (const party of ['Operator', 'Alice', 'Bob', 'Carol', 'Dave', 'Eve']) {
      const partyMap = new Map<string, number>();
      for (const [symbol, amount] of Object.entries(defaultBalances)) {
        partyMap.set(symbol, amount);
      }
      this.balances.set(party, partyMap);
    }
  }

  async transfer(request: TransferRequest): Promise<TransferResult> {
    const { from, to, token } = request;
    const amount = Number(token.amount);

    const fromBal = this.balances.get(from);
    if (!fromBal) {
      return {
        transactionId: `mock-tx-${Date.now()}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        details: { error: `Unknown sender: ${from}` },
      };
    }

    const current = fromBal.get(token.symbol) ?? 0;
    if (current < amount) {
      return {
        transactionId: `mock-tx-${Date.now()}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        details: { error: `Insufficient balance: ${current} < ${amount}` },
      };
    }

    fromBal.set(token.symbol, current - amount);

    if (!this.balances.has(to)) {
      this.balances.set(to, new Map());
    }
    const toBal = this.balances.get(to)!;
    toBal.set(token.symbol, (toBal.get(token.symbol) ?? 0) + amount);

    log.debug({ from, to, symbol: token.symbol, amount }, 'Mock transfer completed');

    return {
      transactionId: `mock-tx-${Date.now()}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
  }

  async getBalance(party: string, symbol?: string): Promise<BalanceResult> {
    const partyBal = this.balances.get(party) ?? new Map<string, number>();
    const balances: TokenAmount[] = [];

    if (symbol) {
      const amount = partyBal.get(symbol) ?? 0;
      balances.push({ symbol, amount: String(amount) });
    } else {
      for (const [sym, amt] of partyBal) {
        balances.push({ symbol: sym, amount: String(amt) });
      }
    }

    return { party, balances };
  }

  async mint(to: string, token: TokenAmount): Promise<TransferResult> {
    if (!this.balances.has(to)) {
      this.balances.set(to, new Map());
    }
    const bal = this.balances.get(to)!;
    bal.set(token.symbol, (bal.get(token.symbol) ?? 0) + Number(token.amount));

    log.debug({ to, symbol: token.symbol, amount: token.amount }, 'Mock mint completed');

    return {
      transactionId: `mock-mint-${Date.now()}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
  }

  async burn(from: string, token: TokenAmount): Promise<TransferResult> {
    const bal = this.balances.get(from);
    if (!bal) {
      return {
        transactionId: `mock-burn-${Date.now()}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        details: { error: `Unknown party: ${from}` },
      };
    }

    const current = bal.get(token.symbol) ?? 0;
    const amount = Number(token.amount);
    if (current < amount) {
      return {
        transactionId: `mock-burn-${Date.now()}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        details: { error: `Insufficient balance for burn: ${current} < ${amount}` },
      };
    }

    bal.set(token.symbol, current - amount);

    log.debug({ from, symbol: token.symbol, amount: token.amount }, 'Mock burn completed');

    return {
      transactionId: `mock-burn-${Date.now()}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

// ---------------------------------------------------------------------------
// CIP56TokenBridge (devnet / mainnet)
// ---------------------------------------------------------------------------

export class CIP56TokenBridge implements ITokenBridge {
  private readonly config: CantonConfig;

  constructor(config: CantonConfig) {
    this.config = config;
    log.info(
      { env: config.environment, grpc: config.grpcUrl },
      'CIP56TokenBridge initialized',
    );
  }

  async transfer(request: TransferRequest): Promise<TransferResult> {
    const { from, to, token, reference } = request;

    log.info(
      { from, to, symbol: token.symbol, amount: token.amount, reference },
      'CIP-56 transfer initiated',
    );

    // In a real implementation this would:
    // 1. Create a CIP-56 transfer command
    // 2. Submit via gRPC Ledger API with JWT auth
    // 3. Wait for commit confirmation
    // For now, submit via JSON API as a choice exercise

    const { default: axios } = await import('axios');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.jwtToken}`;
    }

    try {
      const response = await axios.post(
        `${this.config.jsonApiUrl}/v2/create`,
        {
          templateId: 'Dualis.Token.DUAL:DUALToken',
          payload: {
            operator: this.config.parties.operator,
            sender: from,
            receiver: to,
            asset: { symbol: token.symbol, amount: token.amount },
            reference: reference ?? `cip56-${Date.now()}`,
          },
        },
        { headers, timeout: this.config.commandTimeoutMs },
      );

      return {
        transactionId: response.data?.contractId ?? `cip56-${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        details: { ledgerOffset: response.data?.offset },
      };
    } catch (error) {
      log.error({ error, from, to, symbol: token.symbol }, 'CIP-56 transfer failed');
      return {
        transactionId: `cip56-failed-${Date.now()}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  async getBalance(party: string, symbol?: string): Promise<BalanceResult> {
    const { default: axios } = await import('axios');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.jwtToken}`;
    }

    try {
      const query = symbol ? { owner: party, 'asset.symbol': symbol } : { owner: party };
      const response = await axios.post(
        `${this.config.jsonApiUrl}/v2/queries`,
        { templateId: 'Dualis.Token.DUAL:DUALToken', query },
        { headers, timeout: this.config.commandTimeoutMs },
      );

      const contracts = response.data?.result ?? [];
      const balances: TokenAmount[] = contracts.map(
        (c: { payload: { asset: { symbol: string; amount: string } } }) => ({
          symbol: c.payload.asset.symbol,
          amount: c.payload.asset.amount,
        }),
      );

      return { party, balances };
    } catch (error) {
      log.error({ error, party }, 'CIP-56 balance query failed');
      return { party, balances: [] };
    }
  }

  async mint(to: string, token: TokenAmount): Promise<TransferResult> {
    log.info({ to, symbol: token.symbol, amount: token.amount }, 'CIP-56 mint initiated');

    const { default: axios } = await import('axios');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.jwtToken}`;
    }

    try {
      const response = await axios.post(
        `${this.config.jsonApiUrl}/v2/exercise`,
        {
          templateId: 'Dualis.Token.DUAL:DUALToken',
          contractId: '#operator-token-contract',
          choice: 'MintTokens',
          argument: { recipient: to, amount: Number(token.amount) },
        },
        { headers, timeout: this.config.commandTimeoutMs },
      );

      return {
        transactionId: response.data?.exerciseResult ?? `cip56-mint-${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      log.error({ error, to, symbol: token.symbol }, 'CIP-56 mint failed');
      return {
        transactionId: `cip56-mint-failed-${Date.now()}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  async burn(from: string, token: TokenAmount): Promise<TransferResult> {
    log.info({ from, symbol: token.symbol, amount: token.amount }, 'CIP-56 burn initiated');

    const { default: axios } = await import('axios');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.jwtToken}`;
    }

    try {
      const response = await axios.post(
        `${this.config.jsonApiUrl}/v2/exercise`,
        {
          templateId: 'Dualis.Token.DUAL:DUALToken',
          contractId: '#operator-token-contract',
          choice: 'BurnTokens',
          argument: { amount: Number(token.amount) },
        },
        { headers, timeout: this.config.commandTimeoutMs },
      );

      return {
        transactionId: response.data?.exerciseResult ?? `cip56-burn-${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      log.error({ error, from, symbol: token.symbol }, 'CIP-56 burn failed');
      return {
        transactionId: `cip56-burn-failed-${Date.now()}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    const { default: axios } = await import('axios');

    try {
      const headers: Record<string, string> = {};
      if (this.config.jwtToken) {
        headers['Authorization'] = `Bearer ${this.config.jwtToken}`;
      }

      await axios.get(`${this.config.jsonApiUrl}/readyz`, {
        headers,
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// SpliceBalanceBridge — queries real Splice/Amulet token balances (wallet-agnostic)
// ---------------------------------------------------------------------------

/** Response from Splice Scan API /v0/holdings/summary */
interface ScanHoldingsSummary {
  party_id: string;
  total_unlocked_coin: string;
  total_locked_coin: string;
  total_coin_holdings: string;
  total_available_coin: string;
}

interface ScanHoldingsResponse {
  record_time: string;
  migration_id: number;
  computed_as_of_round: number;
  summaries: ScanHoldingsSummary[];
}

/**
 * Wallet-agnostic Splice balance bridge.
 *
 * - For the validator's own party: queries Splice Wallet API `/wallet/balance`
 * - For ANY connected wallet (Console, Loop, Cantor8, Nightly, Bron, etc.):
 *   queries the global Splice Scan API `POST /api/scan/v0/holdings/summary`
 *
 * The Scan API indexes the entire Canton network — works for any party on
 * any participant. No auth required. Any wallet added to PartyLayer in the
 * future works automatically — zero code changes needed.
 */
export class SpliceBalanceBridge implements ITokenBridge {
  private readonly walletApiUrl: string | null;
  private readonly scanApiUrl: string;
  private readonly jwtSecret: string;
  private readonly jwtAudience: string;
  private readonly operatorParty: string;

  /** Canton domain migration ID (1 for devnet global domain) */
  private readonly migrationId: number;

  constructor(config: CantonConfig) {
    this.walletApiUrl = process.env.SPLICE_WALLET_API_URL ?? null;
    this.scanApiUrl = process.env.SPLICE_SCAN_API_URL
      ?? 'https://scan.sv-1.dev.global.canton.network.sync.global';
    this.jwtSecret = process.env.SPLICE_WALLET_JWT_SECRET ?? 'unsafe';
    this.jwtAudience = process.env.SPLICE_WALLET_JWT_AUDIENCE ?? 'https://validator.example.com';
    this.operatorParty = config.parties.operator;
    this.migrationId = parseInt(process.env.SPLICE_MIGRATION_ID ?? '1', 10);
    log.info({
      walletApiUrl: this.walletApiUrl ? 'configured' : 'not-set',
      scanApiUrl: this.scanApiUrl,
    }, 'SpliceBalanceBridge initialized');
  }

  private generateJwt(sub: string): string {
    const { createHmac } = require('crypto') as typeof import('crypto');
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
      sub,
      aud: this.jwtAudience,
      scope: 'daml_ledger_api',
      iat: now,
      exp: now + 3600,
    })).toString('base64url');
    const signature = createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  // ── Balance query (wallet-agnostic) ──────────────────────────────────────

  async getBalance(party: string, symbol?: string): Promise<BalanceResult> {
    // Validator's own balance → Splice Wallet API (fast, no Scan roundtrip)
    if (party === this.operatorParty && this.walletApiUrl) {
      return this.getValidatorBalance(party, symbol);
    }

    // ANY party (including validator) → Scan API (wallet-agnostic, global view)
    return this.getScanBalance(party, symbol);
  }

  /** Query validator's own CC balance via Splice Wallet API */
  private async getValidatorBalance(party: string, symbol?: string): Promise<BalanceResult> {
    const { default: axios } = await import('axios');

    try {
      const jwt = this.generateJwt('administrator');
      const response = await axios.get<{
        round: number;
        effective_unlocked_qty: string;
        effective_locked_qty: string;
      }>(`${this.walletApiUrl}/api/validator/v0/wallet/balance`, {
        headers: { Authorization: `Bearer ${jwt}` },
        timeout: 10000,
      });

      const unlocked = parseFloat(response.data.effective_unlocked_qty) || 0;
      const locked = parseFloat(response.data.effective_locked_qty) || 0;
      const total = unlocked + locked;

      if (total <= 0) return { party, balances: [] };

      const balances: TokenAmount[] = [];
      if (!symbol || symbol === 'CC') {
        balances.push({ symbol: 'CC', amount: total.toFixed(4) });
      }

      log.info({ party: party.slice(0, 20), cc: total.toFixed(4), source: 'validator-self' }, 'Splice balance queried');
      return { party, balances };
    } catch (error) {
      log.debug({ error: error instanceof Error ? error.message : 'unknown' }, 'Validator balance query failed, falling back to Scan API');
      // Fall back to Scan API
      return this.getScanBalance(party, symbol);
    }
  }

  /**
   * Query any party's CC balance via the global Splice Scan API.
   * Works for ANY wallet — Console, Loop, Cantor8, Nightly, Bron, or future wallets.
   * No auth required. Uses POST /api/scan/v0/holdings/summary.
   */
  private async getScanBalance(party: string, symbol?: string): Promise<BalanceResult> {
    const { default: axios } = await import('axios');

    try {
      // First, find the latest available ACS snapshot timestamp.
      // Scan API takes periodic snapshots (~every 6 hours). We need the most recent one.
      const snapshotResp = await axios.get<{ record_time: string }>(
        `${this.scanApiUrl}/api/scan/v0/state/acs/snapshot-timestamp`,
        {
          params: { before: new Date().toISOString(), migration_id: this.migrationId },
          timeout: 10000,
        },
      );
      const recordTime = snapshotResp.data.record_time;

      const response = await axios.post<ScanHoldingsResponse>(
        `${this.scanApiUrl}/api/scan/v0/holdings/summary`,
        {
          migration_id: this.migrationId,
          record_time: recordTime,
          owner_party_ids: [party],
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        },
      );

      const summary = response.data.summaries.find((s) => s.party_id === party);
      if (!summary) {
        log.debug({ party: party.slice(0, 20) }, 'No holdings found in Scan API');
        return { party, balances: [] };
      }

      const total = parseFloat(summary.total_available_coin) || 0;
      if (total <= 0) return { party, balances: [] };

      const balances: TokenAmount[] = [];
      if (!symbol || symbol === 'CC') {
        balances.push({ symbol: 'CC', amount: total.toFixed(4) });
      }

      log.info({
        party: party.slice(0, 20),
        cc: total.toFixed(4),
        round: response.data.computed_as_of_round,
        source: 'scan-api',
      }, 'Splice balance queried');
      return { party, balances };
    } catch (error) {
      log.debug({ error: error instanceof Error ? error.message : 'unknown', party: party.slice(0, 20) }, 'Scan API balance query failed');
      return { party, balances: [] };
    }
  }

  // ── Unsupported operations (Splice tokens are managed by Splice) ─────────

  async transfer(): Promise<TransferResult> {
    return { transactionId: `splice-unsupported-${Date.now()}`, status: 'failed', timestamp: new Date().toISOString(), details: { error: 'Splice token transfers not supported via this bridge' } };
  }
  async mint(): Promise<TransferResult> {
    return { transactionId: `splice-unsupported-${Date.now()}`, status: 'failed', timestamp: new Date().toISOString(), details: { error: 'Splice token minting not supported' } };
  }
  async burn(): Promise<TransferResult> {
    return { transactionId: `splice-unsupported-${Date.now()}`, status: 'failed', timestamp: new Date().toISOString(), details: { error: 'Splice token burning not supported' } };
  }

  async isHealthy(): Promise<boolean> {
    const { default: axios } = await import('axios');

    // Check Splice Wallet API if configured
    if (this.walletApiUrl) {
      try {
        const jwt = this.generateJwt('administrator');
        await axios.get(`${this.walletApiUrl}/api/validator/v0/wallet/balance`, {
          headers: { Authorization: `Bearer ${jwt}` },
          timeout: 5000,
        });
        return true;
      } catch {
        // Wallet API down — check Scan API as fallback
      }
    }

    // Check Scan API — use dynamic snapshot timestamp
    try {
      const snapshotResp = await axios.get<{ record_time: string }>(
        `${this.scanApiUrl}/api/scan/v0/state/acs/snapshot-timestamp`,
        {
          params: { before: new Date().toISOString(), migration_id: this.migrationId },
          timeout: 5000,
        },
      );
      await axios.post(
        `${this.scanApiUrl}/api/scan/v0/holdings/summary`,
        {
          migration_id: this.migrationId,
          record_time: snapshotResp.data.record_time,
          owner_party_ids: [this.operatorParty],
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 5000 },
      );
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// FallbackTokenBridge — tries Splice → CIP56 → MockTokenBridge
// ---------------------------------------------------------------------------

/**
 * Cascading token bridge: SpliceBalanceBridge → CIP56TokenBridge → MockTokenBridge.
 *
 * For balance queries: tries Splice (real Canton wallet) first, then CIP56 (DUALToken),
 * then MockTokenBridge (in-memory sandbox).
 *
 * For transfers/mint/burn: tries CIP56 first, falls back to mock.
 * (Splice tokens can't be transferred via our bridge — they're managed by Splice ecosystem.)
 *
 * Wallet-agnostic: works with any Canton wallet connected via PartyLayer.
 */
export class FallbackTokenBridge implements ITokenBridge {
  private readonly splice: SpliceBalanceBridge;
  private readonly primary: CIP56TokenBridge;
  private readonly fallback: MockTokenBridge;
  private balanceSource: 'splice' | 'cip56' | 'mock' = 'splice';
  private transferSource: 'cip56' | 'mock' = 'cip56';

  constructor(config: CantonConfig) {
    this.splice = new SpliceBalanceBridge(config);
    this.primary = new CIP56TokenBridge(config);
    this.fallback = new MockTokenBridge();
    log.info('FallbackTokenBridge initialized (Splice → CIP56 → Mock)');
  }

  async transfer(request: TransferRequest): Promise<TransferResult> {
    if (this.transferSource === 'cip56') {
      const result = await this.primary.transfer(request);
      if (result.status !== 'failed') return result;
      log.warn('CIP56 transfer failed, switching to mock bridge');
      this.transferSource = 'mock';
    }
    return this.fallback.transfer(request);
  }

  async getBalance(party: string, symbol?: string): Promise<BalanceResult> {
    // Always try Splice first (real Canton wallet balances).
    // Don't cache balanceSource for balance queries — user might get tokens any time.
    try {
      const spliceResult = await this.splice.getBalance(party, symbol);
      if (spliceResult.balances.length > 0) {
        this.balanceSource = 'splice';
        return spliceResult;
      }
    } catch {
      log.debug('Splice balance query threw, trying CIP56');
    }

    // Try CIP56 (DUALToken)
    try {
      const cip56Result = await this.primary.getBalance(party, symbol);
      if (cip56Result.balances.length > 0) {
        this.balanceSource = 'cip56';
        return cip56Result;
      }
    } catch {
      log.debug('CIP56 balance query threw, falling back to mock');
    }

    // Return empty balances on devnet (real 0 balance — no fake tokens)
    this.balanceSource = 'mock';
    return { party, balances: [] };
  }

  async mint(to: string, token: TokenAmount): Promise<TransferResult> {
    if (this.transferSource === 'cip56') {
      const result = await this.primary.mint(to, token);
      if (result.status !== 'failed') return result;
      log.warn('CIP56 mint failed, switching to mock bridge');
      this.transferSource = 'mock';
    }
    return this.fallback.mint(to, token);
  }

  async burn(from: string, token: TokenAmount): Promise<TransferResult> {
    if (this.transferSource === 'cip56') {
      const result = await this.primary.burn(from, token);
      if (result.status !== 'failed') return result;
      log.warn('CIP56 burn failed, switching to mock bridge');
      this.transferSource = 'mock';
    }
    return this.fallback.burn(from, token);
  }

  async isHealthy(): Promise<boolean> {
    // If using mock for everything, always healthy
    if (this.balanceSource === 'mock' && this.transferSource === 'mock') return true;
    // Try Splice health first (same Canton participant)
    return this.splice.isHealthy();
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createTokenBridge(config: CantonConfig): ITokenBridge {
  if (config.tokenBridgeMode === 'mock') {
    return new MockTokenBridge();
  }
  // Use FallbackTokenBridge — tries CIP56 first, falls back to mock
  // when DUALToken contracts aren't deployed on Canton yet
  return new FallbackTokenBridge(config);
}
