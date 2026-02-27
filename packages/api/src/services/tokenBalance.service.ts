/**
 * Token Balance Service — wraps ITokenBridge to provide wallet-level token balances.
 *
 * Separate from userBalance.service.ts which tracks protocol positions
 * (supply/borrow). This service tracks raw wallet token holdings
 * (what the user holds before/after depositing into pools).
 */

import { createChildLogger } from '../config/logger.js';
import { getTokenBridge } from '../canton/startup.js';
import * as registry from './poolRegistry.js';

const log = createChildLogger('token-balance-service');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WalletTokenBalance {
  symbol: string;
  amount: number;
  valueUSD: number;
}

// Default seed balances for devnet first-time users
const DEVNET_SEED_BALANCES: Record<string, number> = {
  CC: 10_000,
  USDC: 100_000,
  ETH: 50,
  wBTC: 2,
};

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Get all wallet token balances for a user party.
 * Returns amounts for every known asset with a price.
 */
export async function getWalletTokenBalances(partyId: string): Promise<WalletTokenBalance[]> {
  const bridge = getTokenBridge();
  if (!bridge) {
    log.warn('Token bridge not available — returning empty balances');
    return [];
  }

  try {
    const result = await bridge.getBalance(partyId);
    const priceMap = registry.getAssetPriceMap();

    const balances: WalletTokenBalance[] = result.balances.map((b) => {
      const amount = Number(b.amount);
      const price = priceMap[b.symbol] ?? 0;
      return {
        symbol: b.symbol,
        amount,
        valueUSD: amount * price,
      };
    });

    // If user has zero balances for all known assets, auto-seed (devnet)
    const totalAmount = balances.reduce((sum, b) => sum + b.amount, 0);
    if (totalAmount === 0) {
      log.info({ partyId }, 'New user detected — seeding initial balances');
      await ensureInitialBalances(partyId);
      // Re-fetch after seeding
      const seeded = await bridge.getBalance(partyId);
      return seeded.balances.map((b) => {
        const amount = Number(b.amount);
        const price = priceMap[b.symbol] ?? 0;
        return { symbol: b.symbol, amount, valueUSD: amount * price };
      });
    }

    return balances;
  } catch (err) {
    log.warn({ err, partyId }, 'Failed to fetch wallet token balances');
    return [];
  }
}

/**
 * Get the wallet balance for a single asset.
 */
export async function getWalletTokenBalance(partyId: string, symbol: string): Promise<number> {
  const bridge = getTokenBridge();
  if (!bridge) return 0;

  try {
    const result = await bridge.getBalance(partyId, symbol);
    const found = result.balances.find((b) => b.symbol === symbol);
    return found ? Number(found.amount) : 0;
  } catch (err) {
    log.warn({ err, partyId, symbol }, 'Failed to fetch token balance');
    return 0;
  }
}

/**
 * Seed initial token balances for a new user (devnet faucet).
 * Only mints if all balances are currently zero.
 */
export async function ensureInitialBalances(partyId: string): Promise<void> {
  const bridge = getTokenBridge();
  if (!bridge) return;

  try {
    for (const [symbol, amount] of Object.entries(DEVNET_SEED_BALANCES)) {
      await bridge.mint(partyId, {
        symbol,
        amount: String(amount),
      });
      log.debug({ partyId, symbol, amount }, 'Minted seed tokens');
    }
    log.info({ partyId }, 'Initial token balances seeded');
  } catch (err) {
    log.warn({ err, partyId }, 'Failed to seed initial balances');
  }
}
