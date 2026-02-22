import { cn } from '@/lib/utils/cn';
import { UsdcIcon, WbtcIcon, EthIcon, CantonIcon, DualIcon, TBillIcon, SpyIcon } from '@/components/ui/icons/assets';

interface AssetIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizePx: Record<string, number> = { sm: 20, md: 28, lg: 36 };

const iconMap: Record<string, React.ComponentType<{ size?: number | undefined; className?: string | undefined }>> = {
  USDC: UsdcIcon,
  wBTC: WbtcIcon,
  BTC: WbtcIcon,
  ETH: EthIcon,
  CC: CantonIcon,
  DUAL: DualIcon,
  'T-BILL-2026': TBillIcon,
  'T-BILL': TBillIcon,
  'SPY-2026': SpyIcon,
  SPY: SpyIcon,
};

function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 45%)`;
}

function AssetIcon({ symbol, size = 'md', className }: AssetIconProps) {
  const px = sizePx[size] ?? 28;
  const IconComponent = iconMap[symbol];

  if (IconComponent) {
    return <IconComponent size={px} className={className} />;
  }

  // Fallback: generated colored circle
  const bg = hashStringToColor(symbol);
  const letter = symbol.charAt(0).toUpperCase();
  const fontSize = px * 0.4;

  return (
    <div
      className={cn('inline-flex items-center justify-center rounded-full shrink-0 font-semibold select-none', className)}
      style={{ width: px, height: px, backgroundColor: bg, color: 'var(--color-text-primary)', fontSize }}
      role="img"
      aria-label={symbol}
    >
      {letter}
    </div>
  );
}

export { AssetIcon, type AssetIconProps };
