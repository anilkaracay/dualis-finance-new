import { cn } from '@/lib/utils/cn';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  formatter?: ((value: number, name: string) => string) | undefined;
  labelFormatter?: ((label: string) => string) | undefined;
  className?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-xl border border-border-default bg-bg-elevated/95 p-3 shadow-elevated backdrop-blur-lg',
        className
      )}
    >
      {label && (
        <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2.5 font-medium">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-secondary">{entry.name}:</span>
            <span className="font-mono font-medium text-text-primary tabular-nums">
              {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ChartTooltip, type ChartTooltipProps };
