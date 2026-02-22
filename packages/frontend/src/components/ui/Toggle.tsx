'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils/cn';

interface ToggleProps extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  /** Toggle size */
  size?: 'sm' | 'md' | 'lg';
}

const toggleSizes = {
  sm: 'h-8 px-2',
  md: 'h-10 px-3',
  lg: 'h-12 px-4',
} as const;

const Toggle = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, size = 'md', ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-sm text-sm font-medium transition-colors',
      'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
      'data-[state=on]:bg-accent-teal-muted data-[state=on]:text-accent-teal',
      'focus-ring disabled:pointer-events-none disabled:opacity-50',
      toggleSizes[size],
      className
    )}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, type ToggleProps };
