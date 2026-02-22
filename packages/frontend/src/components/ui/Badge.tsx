import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

const badgeVariants = {
  default: 'bg-bg-tertiary text-text-primary border border-border-default',
  success: 'bg-positive-muted text-positive border border-positive/20',
  warning: 'bg-warning-muted text-warning border border-warning/20',
  danger: 'bg-negative-muted text-negative border border-negative/20',
  info: 'bg-info-muted text-info border border-info/20',
  outline: 'bg-transparent text-text-secondary border border-border-default',
} as const;

const badgeSizes = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
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
          'inline-flex items-center rounded-full font-medium whitespace-nowrap',
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
