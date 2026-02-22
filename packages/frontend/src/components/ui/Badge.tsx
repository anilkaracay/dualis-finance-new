import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

const badgeVariants = {
  default: 'text-text-secondary border border-border-default',
  success: 'text-positive border border-positive/20',
  warning: 'text-warning border border-warning/20',
  danger: 'text-negative border border-negative/20',
  info: 'text-info border border-info/20',
  outline: 'text-text-tertiary border border-border-default',
} as const;

const badgeSizes = {
  sm: 'text-[10px] px-1.5 py-0.5 rounded-md',
  md: 'text-xs px-2 py-0.5 rounded-md',
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
          'inline-flex items-center font-semibold whitespace-nowrap',
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
