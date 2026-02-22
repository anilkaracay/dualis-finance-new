'use client';

import { cn } from '@/lib/utils/cn';
import { Leaf } from 'lucide-react';
import type { ESGRating } from '@dualis/shared';

interface ESGBadgeProps {
  /** ESG rating level */
  rating: ESGRating;
  /** Badge size */
  size?: 'sm' | 'md';
}

const ratingConfig: Record<
  Exclude<ESGRating, 'Unrated'>,
  { label: string; bgClass: string; textClass: string; borderClass: string; showLeaf: boolean }
> = {
  A: {
    label: 'ESG-A',
    bgClass: 'bg-positive/10',
    textClass: 'text-positive',
    borderClass: 'border-positive/20',
    showLeaf: true,
  },
  B: {
    label: 'ESG-B',
    bgClass: 'bg-info/10',
    textClass: 'text-info',
    borderClass: 'border-info/20',
    showLeaf: false,
  },
  C: {
    label: 'ESG-C',
    bgClass: 'bg-bg-secondary',
    textClass: 'text-text-tertiary',
    borderClass: 'border-border-subtle',
    showLeaf: false,
  },
};

const sizeConfig = {
  sm: {
    wrapper: 'text-[10px] px-1.5 py-0.5 gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    wrapper: 'text-xs px-2 py-0.5 gap-1',
    icon: 'h-3.5 w-3.5',
  },
};

function ESGBadge({ rating, size = 'sm' }: ESGBadgeProps) {
  if (rating === 'Unrated') {
    return null;
  }

  const config = ratingConfig[rating];
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-md border whitespace-nowrap',
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizes.wrapper
      )}
    >
      {config.showLeaf && <Leaf className={sizes.icon} />}
      {config.label}
    </span>
  );
}

export { ESGBadge, type ESGBadgeProps };
