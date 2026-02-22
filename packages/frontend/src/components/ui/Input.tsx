import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Icon on the left side */
  iconLeft?: React.ReactNode;
  /** Icon on the right side */
  iconRight?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, iconLeft, iconRight, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
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
              'h-10 w-full rounded-sm bg-surface-input border text-sm text-text-primary placeholder:text-text-disabled',
              'transition-colors duration-100 focus-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-border-error focus:border-border-error'
                : 'border-border-default focus:border-border-focus',
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
