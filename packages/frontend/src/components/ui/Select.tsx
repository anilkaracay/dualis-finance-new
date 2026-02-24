'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  /** Current value */
  value?: string | undefined;
  /** Default value (uncontrolled) */
  defaultValue?: string | undefined;
  /** Callback when value changes — receives the new value string */
  onValueChange?: ((value: string) => void) | undefined;
  /**
   * Legacy onChange handler (event-based) for easy migration.
   * If both onValueChange and onChange are provided, onValueChange takes priority.
   */
  onChange?: ((e: { target: { value: string } }) => void) | undefined;
  /** Select label */
  label?: string | undefined;
  /** Error message */
  error?: string | undefined;
  /** Options array */
  options?: SelectOption[] | undefined;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Size variant */
  size?: 'sm' | 'md' | undefined;
  /** Additional className for the trigger */
  className?: string | undefined;
  /** Disabled state */
  disabled?: boolean | undefined;
  /** HTML id */
  id?: string | undefined;
}

function Select({
  value,
  defaultValue,
  onValueChange,
  onChange,
  label,
  error,
  options = [],
  placeholder = 'Select...',
  size = 'md',
  className,
  disabled,
  id,
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleValueChange = React.useCallback(
    (val: string) => {
      if (onValueChange) {
        onValueChange(val);
      } else if (onChange) {
        onChange({ target: { value: val } });
      }
    },
    [onValueChange, onChange],
  );

  const sizeClasses = {
    sm: 'h-9 text-xs rounded-md px-3',
    md: 'h-11 text-sm rounded-lg px-3',
  };

  const selectedLabel = options.find((o) => o.value === (value ?? defaultValue))?.label;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        onValueChange={handleValueChange}
        disabled={disabled ?? false}
      >
        <SelectPrimitive.Trigger
          id={selectId}
          className={cn(
            'inline-flex items-center justify-between gap-2 w-full bg-surface-input border text-text-primary',
            'transition-all duration-200 focus-ring cursor-pointer select-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'data-[placeholder]:text-text-disabled',
            error
              ? 'border-border-error focus:border-border-error'
              : 'border-border-default hover:border-border-hover focus:border-accent-teal focus:shadow-glow-teal-sm',
            sizeClasses[size],
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder}>
            {selectedLabel}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              className={cn(
                'shrink-0 text-text-tertiary transition-transform duration-200',
                size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
              )}
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'z-[70] max-h-[280px] min-w-[var(--radix-select-trigger-width)] overflow-hidden',
              'rounded-xl border border-border-default bg-bg-elevated/95 shadow-elevated backdrop-blur-lg',
              'animate-scale-in',
            )}
          >
            <SelectPrimitive.Viewport className="p-1.5">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled ?? false}
                  className={cn(
                    'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary outline-none select-none cursor-pointer',
                    'transition-colors duration-100',
                    'data-[highlighted]:bg-bg-hover data-[highlighted]:text-text-primary',
                    'data-[disabled]:opacity-40 data-[disabled]:pointer-events-none',
                  )}
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="ml-auto">
                    <Check className="h-3.5 w-3.5 text-accent-teal" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && (
        <p className="text-xs text-negative">{error}</p>
      )}
    </div>
  );
}

Select.displayName = 'Select';

export { Select, type SelectProps, type SelectOption };
