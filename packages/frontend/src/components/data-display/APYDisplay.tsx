import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';

interface APYDisplayProps {
  value: number;
  source?: string;
  size?: 'sm' | 'md' | 'lg';
  trend?: 'up' | 'down';
  className?: string;
}

const sizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

function APYDisplay({ value, source, size = 'md', className }: APYDisplayProps) {
  const formatted = (value * 100).toFixed(2);
  const isPositive = value > 0;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('font-mono font-semibold tabular-nums', sizes[size], isPositive && 'text-positive')}>
        {formatted}%
      </span>
      {source && (
        <Badge variant="outline" size="sm">
          {source}
        </Badge>
      )}
    </span>
  );
}

export { APYDisplay, type APYDisplayProps };
