import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

const cardVariants = {
  default: 'bg-bg-tertiary border border-border-default shadow-card card-highlight-strong',
  elevated: 'bg-bg-elevated border border-border-default shadow-md card-highlight-strong',
  outlined: 'bg-transparent border border-border-default',
  glass: 'glass noise-overlay',
  gradient: 'bg-gradient-card-teal border border-border-default shadow-card card-highlight-strong',
} as const;

const cardPaddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
} as const;

type CardVariant = keyof typeof cardVariants;
type CardPadding = keyof typeof cardPaddings;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Show hover effect */
  hoverable?: boolean;
  /** Show clickable cursor and active state */
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, clickable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-250 ease-out',
          cardVariants[variant],
          cardPaddings[padding],
          hoverable && 'hover:border-border-medium hover:shadow-card-hover hover:-translate-y-1',
          clickable && 'cursor-pointer hover:border-border-medium hover:shadow-card-hover hover:-translate-y-1 active:scale-[0.98] active:translate-y-0',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-between mb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold text-text-primary tracking-snug', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent, type CardProps, type CardVariant, type CardPadding };
