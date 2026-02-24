'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[360px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-l-[3px] border-l-positive border-border-default bg-bg-elevated',
  error: 'border-l-[3px] border-l-negative border-border-default bg-bg-elevated',
  warning: 'border-l-[3px] border-l-warning border-border-default bg-bg-elevated',
  info: 'border-l-[3px] border-l-info border-border-default bg-bg-elevated',
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-positive shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-negative shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning shrink-0" />,
  info: <Info className="h-5 w-5 text-info shrink-0" />,
};

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  /** Toast variant */
  variant?: ToastVariant;
}

const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant = 'info', children, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 backdrop-blur-md',
      'border border-border-default shadow-lg',
      'data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-in',
      'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
      'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
      variant && variantStyles[variant],
      className
    )}
    {...props}
  >
    {variant && variantIcons[variant]}
    <div className="flex-1">{children}</div>
    <ToastPrimitive.Close className="shrink-0 rounded-sm text-text-tertiary hover:text-text-primary transition-colors">
      <X className="h-4 w-4" />
    </ToastPrimitive.Close>
  </ToastPrimitive.Root>
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-semibold text-text-primary', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-xs text-text-secondary mt-1', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'mt-2 inline-flex h-7 items-center rounded-sm px-2 text-xs font-medium',
      'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-hover transition-colors',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  type ToastVariant,
};
