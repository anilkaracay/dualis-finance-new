'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { DualIcon, TBillIcon, SpyIcon } from '@/components/ui/icons/assets';

interface AssetIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizePx: Record<string, number> = { sm: 20, md: 28, lg: 36 };

/** CDN logo URLs for known crypto assets (high-quality official logos) */
const cdnLogoMap: Record<string, string> = {
  USDC: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
  wBTC: 'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png',
  BTC: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
  WETH: 'https://assets.coingecko.com/coins/images/2518/standard/weth.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
  CC: 'https://coin-images.coingecko.com/coins/images/70468/small/Canton-Ticker_%281%29.png?1762826299',
};

/** SVG fallback icons for assets without CDN logos */
const svgFallbackMap: Record<string, React.ComponentType<{ size?: number | undefined; className?: string | undefined }>> = {
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
  const [imgError, setImgError] = useState(false);

  // 1. Try CDN logo first
  const cdnUrl = cdnLogoMap[symbol];
  if (cdnUrl && !imgError) {
    return (
      <img
        src={cdnUrl}
        alt={symbol}
        width={px}
        height={px}
        className={cn('rounded-full shrink-0 object-cover', className)}
        onError={() => setImgError(true)}
      />
    );
  }

  // 2. SVG fallback for non-CDN assets (CC, DUAL, T-BILL, SPY)
  const SvgIcon = svgFallbackMap[symbol];
  if (SvgIcon) {
    return <SvgIcon size={px} className={className} />;
  }

  // 3. Generated colored circle for unknown assets
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
