import { cn } from '@/lib/utils/cn';

interface UtilizationBarProps {
  value: number;
  showLabel?: boolean | undefined;
  size?: 'sm' | 'md' | undefined;
  className?: string | undefined;
}

function getBarGradient(v: number): string {
  if (v <= 0.6) return 'var(--color-positive)';
  if (v <= 0.8) return 'var(--color-warning)';
  if (v <= 0.9) return '#FF8C42';
  return 'var(--color-negative)';
}

function UtilizationBar({ value, showLabel = true, size = 'sm', className }: UtilizationBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 1);
  const percent = Math.round(clampedValue * 100);
  const barHeight = size === 'sm' ? 'h-1' : 'h-1.5';
  const color = getBarGradient(clampedValue);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-xs font-mono text-text-tertiary tabular-nums w-8 text-right shrink-0">{percent}%</span>
      )}
      <div className={cn('relative flex-1 rounded-full overflow-hidden', barHeight)} style={{ backgroundColor: 'var(--skeleton-base)' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export { UtilizationBar, type UtilizationBarProps };
