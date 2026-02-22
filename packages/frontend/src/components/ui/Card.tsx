import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

const cardVariants = {
  default: 'bg-surface-card border border-border-default',
  elevated: 'bg-surface-card border border-border-default shadow-md',
  outlined: 'bg-transparent border border-border-default',
  glass: 'glass',
} as const;

const cardPaddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
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
          'rounded-md transition-all duration-200',
          cardVariants[variant],
          cardPaddings[padding],
          hoverable && 'hover:border-border-focus/30 hover:shadow-lg',
          clickable && 'cursor-pointer hover:border-border-focus/30 hover:shadow-lg active:scale-[0.99]',
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
    <h3 ref={ref} className={cn('text-xl font-semibold text-text-primary', className)} {...props} />
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
