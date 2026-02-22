import { cn } from '@/lib/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Skeleton variant */
  variant?: 'text' | 'circle' | 'rect';
  /** Width (for rect/text variants) */
  width?: string | number;
  /** Height (for rect variant) */
  height?: string | number;
  /** Number of text lines */
  lines?: number;
}

function Skeleton({
  className,
  variant = 'rect',
  width,
  height,
  lines = 3,
  ...props
}: SkeletonProps) {
  const baseClass = 'bg-bg-tertiary rounded-sm animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-bg-tertiary via-bg-hover to-bg-tertiary';

  if (variant === 'circle') {
    return (
      <div
        className={cn(baseClass, 'rounded-full', className)}
        style={{ width: width ?? 40, height: height ?? width ?? 40 }}
        {...props}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClass, 'h-4')}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClass, className)}
      style={{ width, height }}
      {...props}
    />
  );
}

export { Skeleton, type SkeletonProps };
