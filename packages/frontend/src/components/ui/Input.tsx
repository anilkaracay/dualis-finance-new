import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string | undefined;
  /** Error message */
  error?: string | undefined;
  /** Icon on the left side */
  iconLeft?: React.ReactNode | undefined;
  /** Icon on the right side */
  iconRight?: React.ReactNode | undefined;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, iconLeft, iconRight, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary text-label"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'h-11 w-full rounded-md bg-bg-tertiary border text-sm text-text-primary placeholder:text-text-disabled',
              'transition-colors duration-150 focus-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-border-error focus:border-border-error'
                : 'border-border-medium focus:border-border-strong focus:shadow-glow-teal-sm',
              iconLeft ? 'pl-10' : 'pl-3',
              iconRight ? 'pr-10' : 'pr-3',
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-negative">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, type InputProps };
