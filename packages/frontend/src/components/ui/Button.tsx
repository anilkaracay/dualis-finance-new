import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  primary: 'bg-accent-teal text-white hover:bg-accent-teal-hover hover:shadow-glow-teal-sm shadow-sm',
  secondary: 'bg-transparent text-text-primary border border-border-default hover:bg-bg-hover hover:border-border-hover',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
  danger: 'bg-negative text-white hover:brightness-110 shadow-sm',
  success: 'bg-positive text-white hover:brightness-110 shadow-sm',
} as const;

const buttonSizes = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-9 px-4 text-[13px] rounded-md gap-2',
  lg: 'h-11 px-5 text-sm rounded-md gap-2',
  xl: 'h-12 px-6 text-base rounded-lg gap-2.5',
} as const;

type ButtonVariant = keyof typeof buttonVariants;
type ButtonSize = keyof typeof buttonSizes;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon to show before text */
  icon?: React.ReactNode;
  /** Icon to show after text */
  iconRight?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, icon, iconRight, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-150 focus-ring btn-press',
          'disabled:opacity-50 disabled:pointer-events-none',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {iconRight && !loading ? <span className="shrink-0">{iconRight}</span> : null}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };
