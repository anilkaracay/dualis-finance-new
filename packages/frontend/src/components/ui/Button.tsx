import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  primary: 'bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-button-primary)] hover:shadow-[var(--shadow-button-primary-hover)] hover:brightness-110 active:scale-[0.97] active:shadow-sm',
  secondary: 'bg-bg-tertiary/50 text-text-primary border border-border-default shadow-[var(--shadow-card-inset)] hover:bg-bg-hover hover:border-border-hover hover:shadow-sm active:scale-[0.97] active:bg-bg-active',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/60 active:scale-[0.97] active:bg-bg-active/40',
  danger: 'bg-negative text-white hover:brightness-110 shadow-sm active:scale-[0.97]',
  success: 'bg-positive text-white hover:brightness-110 shadow-sm active:scale-[0.97]',
} as const;

const buttonSizes = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-9 px-4 text-[13px] rounded-lg gap-2',
  lg: 'h-11 px-5 text-sm rounded-lg gap-2',
  xl: 'h-12 px-6 text-base rounded-lg gap-2.5',
  icon: 'h-9 w-9 p-0 rounded-lg',
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
          'inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-200 ease-out focus-ring-enhanced btn-press',
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
