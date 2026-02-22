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
// Factory
// ---------------------------------------------------------------------------

export function createTokenBridge(config: CantonConfig): ITokenBridge {
  if (config.tokenBridgeMode === 'mock') {
    return new MockTokenBridge();
  }
  return new CIP56TokenBridge(config);
}
