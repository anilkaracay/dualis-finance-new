'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils/cn';

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Show value label */
  showValue?: boolean;
  /** Format function for value display */
  formatValue?: (value: number) => string;
}

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showValue, formatValue, ...props }, ref) => {
  const value = props.value ?? props.defaultValue ?? [0];

  return (
    <div className="flex flex-col gap-2">
      {showValue && (
        <div className="flex justify-between text-xs text-text-secondary">
          <span>{props.min ?? 0}</span>
          <span className="font-mono text-accent-teal font-medium">
            {formatValue ? formatValue(value[0] ?? 0) : value[0]}
          </span>
          <span>{props.max ?? 100}</span>
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-bg-tertiary">
          <SliderPrimitive.Range className="absolute h-full bg-accent-teal rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-accent-teal shadow-md ring-offset-bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 hover:bg-accent-teal-hover cursor-pointer disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider, type SliderProps };
