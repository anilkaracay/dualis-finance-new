import { cn } from '@/lib/utils/cn';
import { AssetIcon } from './AssetIcon';

interface TokenAmountProps {
  amount: string | number;
  symbol: string;
  priceUSD?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function formatNum(v: number | string): string {
  const num = typeof v === 'string' ? parseFloat(v) : v;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TokenAmount({ amount, symbol, priceUSD, size = 'md', className }: TokenAmountProps) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const usdValue = priceUSD !== undefined ? numAmount * priceUSD : undefined;
  const iconSize = size === 'sm' ? 'sm' as const : size === 'lg' ? 'lg' as const : 'md' as const;
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <AssetIcon symbol={symbol} size={iconSize} />
      <span className={cn('font-mono font-medium text-text-primary tabular-nums', textSize)}>
        {formatNum(amount)} {symbol}
      </span>
      {usdValue !== undefined && (
        <span className={cn('font-mono text-text-tertiary tabular-nums hidden sm:inline', size === 'sm' ? 'text-xs' : 'text-xs')}>
          ${formatNum(usdValue)}
        </span>
      )}
    </span>
  );
}

export { TokenAmount, type TokenAmountProps };
