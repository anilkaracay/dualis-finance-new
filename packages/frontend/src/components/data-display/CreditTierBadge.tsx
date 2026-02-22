import { cn } from '@/lib/utils/cn';
import { Diamond, Crown, Shield, Circle, HelpCircle } from 'lucide-react';

type TierValue = 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Unrated';
type TierSize = 'sm' | 'md' | 'lg';

interface CreditTierBadgeProps {
  tier: TierValue;
  showScore?: boolean;
  score?: number;
  size?: TierSize;
  className?: string;
}

const tierConfig: Record<TierValue, { icon: React.ElementType; color: string; bgClass: string; textClass: string }> = {
  Diamond: { icon: Diamond, color: '#B9F2FF', bgClass: 'bg-tier-diamond/15', textClass: 'text-tier-diamond' },
  Gold: { icon: Crown, color: '#FFD700', bgClass: 'bg-tier-gold/15', textClass: 'text-tier-gold' },
  Silver: { icon: Shield, color: '#C0C0C0', bgClass: 'bg-tier-silver/15', textClass: 'text-tier-silver' },
  Bronze: { icon: Circle, color: '#CD7F32', bgClass: 'bg-tier-bronze/15', textClass: 'text-tier-bronze' },
  Unrated: { icon: HelpCircle, color: '#6B7280', bgClass: 'bg-tier-unrated/15', textClass: 'text-tier-unrated' },
};

const sizeConfig: Record<TierSize, { iconSize: string; paddingClass: string; textClass: string }> = {
  sm: { iconSize: 'h-3.5 w-3.5', paddingClass: 'px-1.5 py-0.5', textClass: 'text-xs' },
  md: { iconSize: 'h-4 w-4', paddingClass: 'px-2.5 py-1', textClass: 'text-sm' },
  lg: { iconSize: 'h-4 w-4', paddingClass: 'px-3 py-1.5', textClass: 'text-sm' },
};

function CreditTierBadge({ tier, showScore, score, size = 'md', className }: CreditTierBadgeProps) {
  const tc = tierConfig[tier];
  const sc = sizeConfig[size];
  const Icon = tc.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        tc.bgClass,
        tc.textClass,
        sc.paddingClass,
        sc.textClass,
        'border-current/20',
        className
      )}
    >
      <Icon className={sc.iconSize} />
      {size !== 'sm' && <span>{tier}</span>}
      {size === 'lg' && showScore && score !== undefined && (
        <span className="font-mono ml-0.5">{score}</span>
      )}
    </span>
  );
}

export { CreditTierBadge, type CreditTierBadgeProps, type TierValue };
