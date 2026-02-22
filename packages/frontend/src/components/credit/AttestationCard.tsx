'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Shield,
  DollarSign,
  Building,
  CheckCircle,
  Globe,
  Link2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { OffChainAttestation, AttestationType } from '@dualis/shared';

interface AttestationCardProps {
  /** Attestation data to display */
  attestation: OffChainAttestation;
  /** Additional CSS classes */
  className?: string | undefined;
}

interface AttestationCardSkeletonProps {
  /** Additional CSS classes */
  className?: string | undefined;
}

type AttestationStatus = 'verified' | 'pending' | 'expired' | 'revoked';

interface TypeConfig {
  icon: React.ElementType;
  label: string;
}

const TYPE_CONFIG: Record<AttestationType, TypeConfig> = {
  credit_bureau: { icon: Shield, label: 'Credit Bureau' },
  income_verification: { icon: DollarSign, label: 'Income Verification' },
  business_verification: { icon: Building, label: 'Business Verification' },
  kyc_completion: { icon: CheckCircle, label: 'KYC Completion' },
  tifa_performance: { icon: Globe, label: 'TIFA Performance' },
  cross_protocol: { icon: Link2, label: 'Cross Protocol' },
};

const STATUS_BADGE_MAP: Record<AttestationStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  verified: { label: 'Verified', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  expired: { label: 'Expired', variant: 'danger' },
  revoked: { label: 'Revoked', variant: 'default' },
};

function getAttestationStatus(attestation: OffChainAttestation): AttestationStatus {
  if (attestation.revoked) return 'revoked';
  const now = Date.now();
  const expiresAt = new Date(attestation.expiresAt).getTime();
  if (expiresAt < now) return 'expired';
  if (!attestation.verified) return 'pending';
  return 'verified';
}

function getExpiryText(expiresAt: string): { text: string; isExpired: boolean } {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diffMs = expiry - now;
  const diffDays = Math.round(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return { text: `Expired ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`, isExpired: true };
  }

  if (diffDays === 0) {
    return { text: 'Expires today', isExpired: false };
  }

  return { text: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, isExpired: false };
}

function formatClaimedRange(range: string): string {
  return range
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function AttestationCard({ attestation, className }: AttestationCardProps) {
  const typeConfig = TYPE_CONFIG[attestation.type] ?? TYPE_CONFIG.credit_bureau;
  const Icon = typeConfig.icon;
  const status = getAttestationStatus(attestation);
  const statusBadge = STATUS_BADGE_MAP[status];

  const expiry = useMemo(() => getExpiryText(attestation.expiresAt), [attestation.expiresAt]);

  const isExpiredOrRevoked = status === 'expired' || status === 'revoked';

  return (
    <Card
      variant="default"
      padding="md"
      className={cn(
        'transition-all duration-200',
        isExpiredOrRevoked && 'border-negative/30',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Left: Type icon */}
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-bg-secondary',
            isExpiredOrRevoked ? 'text-text-tertiary' : 'text-accent-teal',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Center: Provider, type, range */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary truncate">
              {attestation.provider}
            </span>
          </div>
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wider',
              isExpiredOrRevoked ? 'text-text-tertiary' : 'text-text-secondary',
            )}
          >
            {typeConfig.label}
          </span>
          <div className="mt-1">
            <span className="text-xs text-text-secondary">
              Range:{' '}
              <span className="font-medium text-text-primary">
                {formatClaimedRange(attestation.claimedRange)}
              </span>
            </span>
          </div>
        </div>

        {/* Right: Status badge */}
        <div className="flex-shrink-0">
          <Badge variant={statusBadge.variant} size="sm">
            {statusBadge.label}
          </Badge>
        </div>
      </div>

      {/* Bottom: Expiry info */}
      <div
        className={cn(
          'flex items-center gap-1.5 mt-3 pt-3 border-t border-border-subtle',
        )}
      >
        {expiry.isExpired ? (
          <AlertTriangle className="h-3 w-3 text-negative flex-shrink-0" />
        ) : (
          <Clock className="h-3 w-3 text-text-tertiary flex-shrink-0" />
        )}
        <span
          className={cn(
            'text-xs',
            expiry.isExpired ? 'text-negative' : 'text-text-tertiary',
          )}
        >
          {expiry.text}
        </span>
      </div>
    </Card>
  );
}

function AttestationCardSkeleton({ className }: AttestationCardSkeletonProps) {
  return (
    <Card variant="default" padding="md" className={className}>
      <div className="flex items-start gap-3">
        <Skeleton variant="rect" width={40} height={40} className="rounded-lg" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton variant="rect" width={100} height={14} />
          <Skeleton variant="rect" width={80} height={10} />
          <Skeleton variant="rect" width={140} height={12} />
        </div>
        <Skeleton variant="rect" width={60} height={20} className="rounded-md" />
      </div>
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-subtle">
        <Skeleton variant="rect" width={120} height={12} />
      </div>
    </Card>
  );
}

export {
  AttestationCard,
  AttestationCardSkeleton,
  type AttestationCardProps,
  type AttestationCardSkeletonProps,
};
