/** Fallback wallet logos — used when PartyLayer doesn't provide icons */
const WALLET_LOGOS: Record<string, string> = {
  console: '/images/wallets/console-wallet.png',
  loop: '/images/wallets/loop-wallet.svg',
  cantor8: '/images/wallets/cantor8.png',
  nightly: '/images/wallets/nightly.svg',
  bron: '/images/wallets/bron.png',
};

/** Get wallet icon URL — prefers local SVGs (reliable), falls back to PartyLayer */
export function getWalletIcon(walletId: string, partyLayerIcon?: string): string | undefined {
  return WALLET_LOGOS[walletId] ?? partyLayerIcon;
}
