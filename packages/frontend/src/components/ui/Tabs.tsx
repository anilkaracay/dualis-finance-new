'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils/cn';

const TabsRoot = TabsPrimitive.Root;

type TabsVariant = 'underline' | 'pill';

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Tab style variant */
  variant?: TabsVariant;
}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'underline', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1',
      variant === 'underline' && 'border-b border-border-default',
      variant === 'pill' && 'bg-bg-secondary rounded-md p-1',
      className
    )}
    data-variant={variant}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium transition-all',
        'text-text-tertiary hover:text-text-primary focus-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        // Underline variant (default)
        'data-[state=active]:text-accent-teal',
        'group-data-[variant=underline]:border-b-2 group-data-[variant=underline]:border-transparent',
        'group-data-[variant=underline]:data-[state=active]:border-accent-teal',
        // Pill variant
        'group-data-[variant=pill]:rounded-sm',
        'group-data-[variant=pill]:data-[state=active]:bg-bg-tertiary group-data-[variant=pill]:data-[state=active]:text-text-primary',
        // Simplified: just use direct styles for both variants
        'data-[state=active]:text-accent-teal border-b-2 border-transparent data-[state=active]:border-accent-teal -mb-px',
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 animate-fade-in focus-ring', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent, type TabsVariant };
