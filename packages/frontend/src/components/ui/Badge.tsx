import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

const badgeVariants = {
  default: 'text-text-secondary bg-bg-tertiary border border-border-default',
  success: 'text-positive bg-positive-muted border border-positive/25',
  warning: 'text-warning bg-warning-muted border border-warning/25',
  danger: 'text-negative bg-negative-muted border border-negative/25',
  info: 'text-info bg-info-muted border border-info/25',
  outline: 'text-text-tertiary border border-border-default',
  live: 'text-positive bg-positive-muted border border-positive/25 animate-breathe-glow',
} as const;

const badgeSizes = {
  sm: 'text-[10px] px-2.5 py-0.5 rounded-full gap-1',
  md: 'text-xs px-2.5 py-0.5 rounded-full gap-1.5',
} as const;

type BadgeVariant = keyof typeof badgeVariants;
type BadgeSize = keyof typeof badgeSizes;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-semibold whitespace-nowrap transition-colors duration-150',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize };
