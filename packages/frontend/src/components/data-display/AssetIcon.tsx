import { cn } from '@/lib/utils/cn';

interface AssetIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizePx: Record<string, number> = { sm: 20, md: 28, lg: 36 };

const knownAssets: Record<string, { bg: string; text: string; letter: string }> = {
  USDC: { bg: '#2775CA', text: '#FFFFFF', letter: '$' },
  wBTC: { bg: '#F7931A', text: '#FFFFFF', letter: '\u20BF' },
  ETH: { bg: '#627EEA', text: '#FFFFFF', letter: '\u039E' },
  BTC: { bg: '#F7931A', text: '#FFFFFF', letter: '\u20BF' },
  CC: { bg: '#00D4AA', text: '#0A0E17', letter: 'C' },
  DUAL: { bg: '#6366F1', text: '#FFFFFF', letter: 'D' },
  'T-BILL': { bg: '#10B981', text: '#FFFFFF', letter: 'T' },
  'T-BILL-2026': { bg: '#10B981', text: '#FFFFFF', letter: 'T' },
  'SPY-2026': { bg: '#EF4444', text: '#FFFFFF', letter: 'S' },
  SPY: { bg: '#EF4444', text: '#FFFFFF', letter: 'S' },
};

function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

function AssetIcon({ symbol, size = 'md', className }: AssetIconProps) {
  const px = sizePx[size] ?? 28;
  const known = knownAssets[symbol];
  const bg = known?.bg ?? hashStringToColor(symbol);
  const text = known?.text ?? '#FFFFFF';
  const letter = known?.letter ?? symbol.charAt(0).toUpperCase();
  const fontSize = px * 0.45;

  return (
    <div
      className={cn('inline-flex items-center justify-center rounded-full shrink-0 font-bold select-none', className)}
      style={{ width: px, height: px, backgroundColor: bg, color: text, fontSize }}
      role="img"
      aria-label={symbol}
    >
      {letter}
    </div>
  );
}

export { AssetIcon, type AssetIconProps };
