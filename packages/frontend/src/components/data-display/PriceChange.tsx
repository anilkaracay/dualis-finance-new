import { cn } from '@/lib/utils/cn';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PriceChangeProps {
  value: number;
  size?: 'sm' | 'md';
  className?: string;
}

function PriceChange({ value, size = 'sm', className }: PriceChangeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const formatted = `${isPositive ? '+' : ''}${value.toFixed(2)}%`;

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-mono font-medium tabular-nums',
        textSize,
        isPositive && 'text-positive',
        isNegative && 'text-negative',
        !isPositive && !isNegative && 'text-text-tertiary',
        className
      )}
    >
      {isPositive && <ArrowUp className={iconSize} />}
      {isNegative && <ArrowDown className={iconSize} />}
      {formatted}
    </span>
  );
}

export { PriceChange, type PriceChangeProps };
