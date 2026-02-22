import { cn } from '@/lib/utils/cn';

interface UtilizationBarProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

function getBarColor(v: number): string {
  if (v <= 0.6) return 'bg-accent-teal';
  if (v <= 0.85) return 'bg-warning';
  return 'bg-negative';
}

function UtilizationBar({ value, showLabel = true, size = 'sm', className }: UtilizationBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 1);
  const percent = Math.round(clampedValue * 100);
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2.5';
  const labelInside = percent > 30;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className={cn('relative w-full rounded-full bg-bg-tertiary overflow-hidden', barHeight)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', getBarColor(clampedValue))}
          style={{ width: `${percent}%` }}
        />
        {showLabel && size === 'md' && labelInside && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-medium text-text-inverse">
            {percent}%
          </span>
        )}
      </div>
      {showLabel && (size === 'sm' || !labelInside) && (
        <span className="text-xs font-mono text-text-tertiary tabular-nums">{percent}%</span>
      )}
    </div>
  );
}

export { UtilizationBar, type UtilizationBarProps };
