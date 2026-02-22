import { cn } from '@/lib/utils/cn';
import { Diamond, Crown, Shield, Circle, Minus } from 'lucide-react';

type TierValue = 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Unrated';
type TierSize = 'sm' | 'md' | 'lg';

interface CreditTierBadgeProps {
  tier: TierValue;
  showScore?: boolean | undefined;
  score?: number | undefined;
  size?: TierSize | undefined;
  className?: string | undefined;
}

const tierConfig: Record<TierValue, { icon: React.ElementType; textClass: string; glowClass: string }> = {
  Diamond: { icon: Diamond, textClass: 'text-tier-diamond', glowClass: 'border-glow-teal' },
  Gold: { icon: Crown, textClass: 'text-tier-gold', glowClass: '' },
  Silver: { icon: Shield, textClass: 'text-tier-silver', glowClass: '' },
  Bronze: { icon: Circle, textClass: 'text-tier-bronze', glowClass: '' },
  Unrated: { icon: Minus, textClass: 'text-tier-unrated', glowClass: '' },
};

function CreditTierBadge({ tier, showScore, score, size = 'md', className }: CreditTierBadgeProps) {
  const tc = tierConfig[tier];
  const Icon = tc.icon;

  if (tier === 'Unrated') {
    return <span className={cn('text-xs text-text-tertiary', className)}>Unrated</span>;
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium',
      tc.textClass,
      size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-sm',
      className
    )}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {size !== 'sm' && <span>{tier}</span>}
      {size === 'lg' && showScore && score !== undefined && (
        <span className="font-mono text-xs ml-0.5 opacity-70">{score}</span>
      )}
    </span>
  );
}

export { CreditTierBadge, type CreditTierBadgeProps, type TierValue };
