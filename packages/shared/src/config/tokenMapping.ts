/**
 * Token Mapping — maps between Canton/Splice ledger symbols and Dualis pool symbols.
 *
 * Wallet-agnostic: these mappings apply regardless of which Canton wallet
 * (Console, Loop, Cantor8, Nightly, Bron) the user connects through.
 *
 * Canton/Splice ecosystem tokens:
 *   CC     = Canton Coin (Splice Amulet)
 *   CBTC   = Canton wrapped BTC
 *   USDCx  = Canton wrapped USDC
 *
 * Dualis pool assets:
 *   CC, ETH, wBTC, USDC, T-BILL-2026, etc.
 */

// Canton symbol → Pool symbol
const CANTON_TO_POOL: Record<string, string> = {
  CC: 'CC',
  CBTC: 'wBTC',
  USDCx: 'USDC',
};

// Pool symbol → Canton symbol
const POOL_TO_CANTON: Record<string, string> = {
  CC: 'CC',
  wBTC: 'CBTC',
  USDC: 'USDCx',
};

// Splice template ID hints → token symbol (for contract discovery)
export const SPLICE_TEMPLATE_HINTS: Record<string, string> = {
  Amulet: 'CC',
  LockedAmulet: 'CC',
  TransferCommand: 'CC',
};

/** Map a Canton/Splice ledger symbol to the corresponding Dualis pool symbol. */
export function mapCantonToPool(cantonSymbol: string): string {
  return CANTON_TO_POOL[cantonSymbol] ?? cantonSymbol;
}

/** Map a Dualis pool symbol to the corresponding Canton/Splice ledger symbol. */
export function mapPoolToCanton(poolSymbol: string): string {
  return POOL_TO_CANTON[poolSymbol] ?? poolSymbol;
}

/** Get all known Canton symbols. */
export function getKnownCantonSymbols(): string[] {
  return Object.keys(CANTON_TO_POOL);
}
