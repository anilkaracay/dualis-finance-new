import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  primary: 'bg-accent-teal text-text-inverse hover:bg-accent-teal-hover active:bg-accent-teal shadow-sm hover:shadow-glow-teal',
  secondary: 'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-hover active:bg-bg-active',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover active:bg-bg-active',
  danger: 'bg-negative text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
  success: 'bg-positive text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm',
} as const;

const buttonSizes = {
  sm: 'h-8 px-3 text-sm rounded-sm gap-1.5',
  md: 'h-10 px-4 text-sm rounded-sm gap-2',
  lg: 'h-12 px-6 text-base rounded-md gap-2',
  xl: 'h-14 px-8 text-lg rounded-md gap-2.5',
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
          'inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-100 focus-ring',
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
