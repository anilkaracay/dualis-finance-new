/**
 * Token Balance Service — wraps ITokenBridge to provide wallet-level token balances.
 *
 * Separate from userBalance.service.ts which tracks protocol positions
 * (supply/borrow). This service tracks raw wallet token holdings
 * (what the user holds before/after depositing into pools).
 */

import { createChildLogger } from '../config/logger.js';
import { getTokenBridge } from '../canton/startup.js';
import { env } from '../config/env.js';
import { mapCantonToPool } from '@dualis/shared';
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
      // Map Canton/Splice symbols to pool symbols (e.g. USDCx → USDC)
      const poolSymbol = mapCantonToPool(b.symbol);
      const amount = Number(b.amount);
      const price = priceMap[poolSymbol] ?? priceMap[b.symbol] ?? 0;
      return {
        symbol: poolSymbol,
        amount,
        valueUSD: amount * price,
      };
    });

    const totalAmount = balances.reduce((sum, b) => sum + b.amount, 0);

    // Only auto-seed in sandbox mode (CANTON_MOCK=true).
    // On devnet/mainnet, return real (possibly 0) balances — tokens come from the wallet.
    if (totalAmount === 0 && env.CANTON_MOCK) {
      log.info({ partyId }, 'Sandbox user — seeding initial balances');
      await ensureInitialBalances(partyId);
      // Re-fetch after seeding
      const seeded = await bridge.getBalance(partyId);
      return seeded.balances.map((b) => {
        const poolSymbol = mapCantonToPool(b.symbol);
        const amount = Number(b.amount);
        const price = priceMap[poolSymbol] ?? priceMap[b.symbol] ?? 0;
        return { symbol: poolSymbol, amount, valueUSD: amount * price };
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
