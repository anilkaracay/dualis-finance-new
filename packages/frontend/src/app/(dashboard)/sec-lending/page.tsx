'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowRight,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AssetIcon } from '@/components/data-display/AssetIcon';
import { CreditTierBadge } from '@/components/data-display/CreditTierBadge';
import { usePositionStore } from '@/stores/usePositionStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketplaceOffer {
  id: string;
  security: string;
  lenderAddress: string;
  lenderTier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Unrated';
  feeBps: number;
  feeType: 'Fixed' | 'Floating';
  durationDays: number;
  acceptedCollateral: string[];
}

interface MyOffer {
  id: string;
  security: string;
  feeBps: number;
  feeType: 'Fixed' | 'Floating';
  status: 'Active' | 'Filled' | 'Cancelled';
  createdAt: string;
}

type FeeType = 'Fixed' | 'Floating';

interface CollateralSelection {
  USDC: boolean;
  wBTC: boolean;
  ETH: boolean;
  CC: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Completed':
      return 'info';
    case 'Filled':
      return 'info';
    case 'Cancelled':
      return 'danger';
    default:
      return 'default';
  }
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_OFFERS: MarketplaceOffer[] = [
  // ── Mega-cap Tech ─────────────────────────────────────────────────────
  { id: 'offer-001', security: 'AAPL', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 35, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC', 'wBTC'] },
  { id: 'offer-002', security: 'TSLA', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 50, feeType: 'Floating', durationDays: 180, acceptedCollateral: ['USDC', 'ETH'] },
  { id: 'offer-003', security: 'MSFT', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 30, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC', 'wBTC'] },
  { id: 'offer-004', security: 'GOOGL', lenderAddress: '0x9abcdef01234567890abcdef01234567890def01', lenderTier: 'Gold', feeBps: 32, feeType: 'Fixed', durationDays: 120, acceptedCollateral: ['USDC'] },
  { id: 'offer-005', security: 'AMZN', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 33, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC', 'wBTC'] },
  { id: 'offer-006', security: 'NVDA', lenderAddress: '0xdef01234567890abcdef01234567890abc9abcde', lenderTier: 'Gold', feeBps: 55, feeType: 'Floating', durationDays: 60, acceptedCollateral: ['USDC', 'ETH', 'wBTC'] },
  { id: 'offer-007', security: 'META', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 38, feeType: 'Fixed', durationDays: 120, acceptedCollateral: ['USDC'] },
  // ── Finance ───────────────────────────────────────────────────────────
  { id: 'offer-008', security: 'JPM', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 25, feeType: 'Fixed', durationDays: 180, acceptedCollateral: ['USDC'] },
  { id: 'offer-009', security: 'GS', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 28, feeType: 'Fixed', durationDays: 120, acceptedCollateral: ['USDC'] },
  { id: 'offer-010', security: 'BLK', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 22, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  // ── ETFs ──────────────────────────────────────────────────────────────
  { id: 'offer-011', security: 'SPY', lenderAddress: '0x9abcdef01234567890abcdef01234567890def01', lenderTier: 'Gold', feeBps: 28, feeType: 'Fixed', durationDays: 30, acceptedCollateral: ['USDC', 'wBTC', 'ETH'] },
  { id: 'offer-012', security: 'QQQ', lenderAddress: '0xdef01234567890abcdef01234567890abc9abcde', lenderTier: 'Gold', feeBps: 30, feeType: 'Fixed', durationDays: 60, acceptedCollateral: ['USDC', 'wBTC'] },
  { id: 'offer-013', security: 'IWM', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 42, feeType: 'Floating', durationDays: 90, acceptedCollateral: ['USDC'] },
  { id: 'offer-014', security: 'DIA', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 24, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC'] },
  { id: 'offer-015', security: 'VTI', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 18, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-016', security: 'EFA', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 20, feeType: 'Fixed', durationDays: 180, acceptedCollateral: ['USDC'] },
  // ── US Treasuries ─────────────────────────────────────────────────────
  { id: 'offer-017', security: 'US-T10Y', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 12, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-018', security: 'T-BILL-3M', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 8, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC'] },
  { id: 'offer-019', security: 'T-BILL-6M', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 10, feeType: 'Fixed', durationDays: 180, acceptedCollateral: ['USDC'] },
  { id: 'offer-020', security: 'T-NOTE-2Y', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 10, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-021', security: 'T-NOTE-5Y', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 11, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-022', security: 'T-BOND-30Y', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 15, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-023', security: 'TIPS-10Y', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 14, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  // ── Corporate Bonds ───────────────────────────────────────────────────
  { id: 'offer-024', security: 'AAPL-BOND-2030', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 16, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-025', security: 'MSFT-BOND-2028', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 14, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-026', security: 'JPM-BOND-2029', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 18, feeType: 'Fixed', durationDays: 180, acceptedCollateral: ['USDC'] },
  { id: 'offer-027', security: 'MBS-FNMA', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 10, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  // ── Crypto ────────────────────────────────────────────────────────────
  { id: 'offer-028', security: 'SOL', lenderAddress: '0x9abcdef01234567890abcdef01234567890def01', lenderTier: 'Gold', feeBps: 65, feeType: 'Floating', durationDays: 30, acceptedCollateral: ['USDC', 'ETH'] },
  { id: 'offer-029', security: 'AVAX', lenderAddress: '0xdef01234567890abcdef01234567890abc9abcde', lenderTier: 'Silver', feeBps: 70, feeType: 'Floating', durationDays: 30, acceptedCollateral: ['USDC'] },
  { id: 'offer-030', security: 'LINK', lenderAddress: '0x9abcdef01234567890abcdef01234567890def01', lenderTier: 'Gold', feeBps: 60, feeType: 'Floating', durationDays: 60, acceptedCollateral: ['USDC'] },
  { id: 'offer-031', security: 'UNI', lenderAddress: '0xdef01234567890abcdef01234567890abc9abcde', lenderTier: 'Silver', feeBps: 72, feeType: 'Floating', durationDays: 30, acceptedCollateral: ['USDC'] },
  { id: 'offer-032', security: 'AAVE', lenderAddress: '0x9abcdef01234567890abcdef01234567890def01', lenderTier: 'Gold', feeBps: 58, feeType: 'Floating', durationDays: 60, acceptedCollateral: ['USDC', 'ETH'] },
  { id: 'offer-033', security: 'stETH', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 45, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC', 'ETH'] },
  // ── RWA ───────────────────────────────────────────────────────────────
  { id: 'offer-034', security: 'PAXG', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 20, feeType: 'Fixed', durationDays: 180, acceptedCollateral: ['USDC'] },
  { id: 'offer-035', security: 'RE-NYC-01', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 35, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-036', security: 'RE-LDN-01', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 38, feeType: 'Fixed', durationDays: 365, acceptedCollateral: ['USDC'] },
  { id: 'offer-037', security: 'CARBON-EU', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 30, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC'] },
  // ── TIFA (Receivables) ────────────────────────────────────────────────
  { id: 'offer-038', security: 'INV-SAP-Q1', lenderAddress: '0x1234567890abcdef1234567890abcdef12345678', lenderTier: 'Diamond', feeBps: 22, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC'] },
  { id: 'offer-039', security: 'INV-SIEMENS-Q1', lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234', lenderTier: 'Gold', feeBps: 24, feeType: 'Fixed', durationDays: 90, acceptedCollateral: ['USDC'] },
  { id: 'offer-040', security: 'SCF-TRADE-01', lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678', lenderTier: 'Diamond', feeBps: 20, feeType: 'Fixed', durationDays: 60, acceptedCollateral: ['USDC'] },
];

const MOCK_MY_OFFERS: MyOffer[] = [
  { id: 'my-offer-001', security: 'ETH', feeBps: 42, feeType: 'Fixed', status: 'Active', createdAt: '2026-02-18T10:00:00Z' },
  { id: 'my-offer-002', security: 'T-BILL-3M', feeBps: 8, feeType: 'Fixed', status: 'Filled', createdAt: '2026-02-12T14:00:00Z' },
  { id: 'my-offer-003', security: 'AAPL', feeBps: 35, feeType: 'Fixed', status: 'Active', createdAt: '2026-02-20T09:00:00Z' },
  { id: 'my-offer-004', security: 'PAXG', feeBps: 20, feeType: 'Fixed', status: 'Active', createdAt: '2026-02-21T11:00:00Z' },
  { id: 'my-offer-005', security: 'SOL', feeBps: 65, feeType: 'Floating', status: 'Cancelled', createdAt: '2026-02-15T16:00:00Z' },
];

// Categorized security options for the New Offer form
const SECURITY_GROUPS = [
  { label: 'Equities — Tech', options: ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META'] },
  { label: 'Equities — Finance', options: ['JPM', 'GS', 'BLK'] },
  { label: 'ETFs', options: ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'EFA'] },
  { label: 'US Treasuries', options: ['T-BILL-3M', 'T-BILL-6M', 'T-NOTE-2Y', 'T-NOTE-5Y', 'US-T10Y', 'T-BOND-30Y', 'TIPS-10Y'] },
  { label: 'Corporate Bonds', options: ['AAPL-BOND-2030', 'MSFT-BOND-2028', 'JPM-BOND-2029', 'MBS-FNMA'] },
  { label: 'Crypto', options: ['ETH', 'wBTC', 'SOL', 'AVAX', 'LINK', 'UNI', 'AAVE', 'stETH'] },
  { label: 'Real World Assets', options: ['PAXG', 'RE-NYC-01', 'RE-LDN-01', 'CARBON-EU'] },
  { label: 'Receivables (TIFA)', options: ['INV-SAP-Q1', 'INV-SIEMENS-Q1', 'SCF-TRADE-01'] },
] as const;

const SECURITY_OPTIONS = SECURITY_GROUPS.flatMap((g) => g.options);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AvailableOffersTable({ offers }: { offers: MarketplaceOffer[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-default bg-bg-tertiary shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-secondary/40">
            <th className="text-label px-4 h-9 text-left">Security</th>
            <th className="text-label px-4 h-9 text-left">Lender</th>
            <th className="text-label px-4 h-9 text-left">Fee</th>
            <th className="text-label px-4 h-9 text-left">Duration</th>
            <th className="text-label px-4 h-9 text-left">Collateral</th>
            <th className="text-label px-4 h-9 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr
              key={offer.id}
              className="border-b border-border-default last:border-b-0 h-12 hover:bg-surface-selected table-row-interactive transition-colors"
            >
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={offer.security} size="sm" />
                  <span className="font-medium text-text-primary">{offer.security}</span>
                </div>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-text-secondary">
                    {truncateAddress(offer.lenderAddress)}
                  </span>
                  <CreditTierBadge tier={offer.lenderTier} size="sm" />
                </div>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-text-primary">{offer.feeBps} bps</span>
                  <Badge variant="default" size="sm">{offer.feeType}</Badge>
                </div>
              </td>
              <td className="px-4">
                <span className="text-text-primary">{offer.durationDays} days</span>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-1 flex-wrap">
                  {offer.acceptedCollateral.map((col) => (
                    <Badge key={col} variant="default" size="sm">{col}</Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 text-right">
                <Button variant="primary" size="sm">
                  Accept
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MyDealsTable() {
  const { secLendingDeals } = usePositionStore();

  if (secLendingDeals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-default bg-bg-tertiary py-16">
        <p className="text-text-disabled text-sm">No active deals</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default bg-bg-tertiary shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-secondary/40">
            <th className="text-label px-4 h-9 text-left">Deal ID</th>
            <th className="text-label px-4 h-9 text-left">Role</th>
            <th className="text-label px-4 h-9 text-left">Security</th>
            <th className="text-label px-4 h-9 text-center">Status</th>
            <th className="text-label px-4 h-9 text-right">Fee Accrued</th>
            <th className="text-label px-4 h-9 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {secLendingDeals.map((deal) => (
            <tr
              key={deal.dealId}
              className="border-b border-border-default last:border-b-0 h-12 hover:bg-surface-selected table-row-interactive transition-colors"
            >
              <td className="px-4">
                <span className="font-mono text-xs text-text-secondary">
                  {deal.dealId.length > 12
                    ? `${deal.dealId.slice(0, 8)}...${deal.dealId.slice(-4)}`
                    : deal.dealId}
                </span>
              </td>
              <td className="px-4">
                <Badge
                  variant={deal.role === 'lender' ? 'info' : 'warning'}
                  size="sm"
                >
                  {deal.role === 'lender' ? 'Lender' : 'Borrower'}
                </Badge>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={deal.security.symbol} size="sm" />
                  <span className="font-medium text-text-primary">{deal.security.symbol}</span>
                </div>
              </td>
              <td className="px-4">
                <div className="flex justify-center">
                  <Badge variant={getStatusBadgeVariant(deal.status)} size="sm">
                    {deal.status}
                  </Badge>
                </div>
              </td>
              <td className="px-4 text-right">
                <span className="font-mono text-text-primary">{formatUSD(deal.feeAccrued)}</span>
              </td>
              <td className="px-4 text-right">
                <Button variant="secondary" size="sm" icon={<ArrowRight className="h-3 w-3" />}>
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MyOffersTable({ offers }: { offers: MyOffer[] }) {
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-default bg-bg-tertiary py-16">
        <p className="text-text-disabled text-sm">No offers posted</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default bg-bg-tertiary shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-secondary/40">
            <th className="text-label px-4 h-9 text-left">Security</th>
            <th className="text-label px-4 h-9 text-left">Fee</th>
            <th className="text-label px-4 h-9 text-center">Status</th>
            <th className="text-label px-4 h-9 text-left">Created</th>
            <th className="text-label px-4 h-9 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr
              key={offer.id}
              className="border-b border-border-default last:border-b-0 h-12 hover:bg-surface-selected table-row-interactive transition-colors"
            >
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={offer.security} size="sm" />
                  <span className="font-medium text-text-primary">{offer.security}</span>
                </div>
              </td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-text-primary">{offer.feeBps} bps</span>
                  <Badge variant="default" size="sm">{offer.feeType}</Badge>
                </div>
              </td>
              <td className="px-4">
                <div className="flex justify-center">
                  <Badge variant={getStatusBadgeVariant(offer.status)} size="sm">
                    {offer.status}
                  </Badge>
                </div>
              </td>
              <td className="px-4">
                <span className="text-xs text-text-secondary">
                  {new Date(offer.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </td>
              <td className="px-4 text-right">
                {offer.status === 'Active' ? (
                  <Button variant="danger" size="sm" icon={<X className="h-3 w-3" />}>
                    Cancel
                  </Button>
                ) : (
                  <span className="text-xs text-text-tertiary">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Offer Dialog Content
// ---------------------------------------------------------------------------

function NewOfferForm({ onClose }: { onClose: () => void }) {
  const [selectedSecurity, setSelectedSecurity] = useState<string>(SECURITY_OPTIONS[0] ?? 'AAPL');
  const [amount, setAmount] = useState('');
  const [feeType, setFeeType] = useState<FeeType>('Fixed');
  const [feeBps, setFeeBps] = useState('');
  const [collateral, setCollateral] = useState<CollateralSelection>({
    USDC: true,
    wBTC: false,
    ETH: false,
    CC: false,
  });
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');

  const handleCollateralToggle = useCallback((key: keyof CollateralSelection) => {
    setCollateral((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSubmit = useCallback(() => {
    // In production, this would call a contract / API
    onClose();
  }, [onClose]);

  return (
    <div className="space-y-5">
      {/* Security Select — grouped by category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Security Asset</label>
        <select
          value={selectedSecurity}
          onChange={(e) => setSelectedSecurity(e.target.value)}
          className="h-9 w-full rounded-md bg-bg-tertiary border border-border-default text-sm text-text-primary px-3 transition-colors duration-100 focus-ring focus:border-border-focus"
        >
          {SECURITY_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Amount */}
      <Input
        label="Amount"
        type="number"
        placeholder="e.g. 100,000"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* Fee Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Fee Type</label>
        <div className="flex gap-2">
          <Button
            variant={feeType === 'Fixed' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFeeType('Fixed')}
          >
            Fixed
          </Button>
          <Button
            variant={feeType === 'Floating' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFeeType('Floating')}
          >
            Floating
          </Button>
        </div>
      </div>

      {/* Fee Value */}
      <Input
        label="Fee (bps)"
        type="number"
        placeholder="e.g. 45"
        value={feeBps}
        onChange={(e) => setFeeBps(e.target.value)}
      />

      {/* Accepted Collateral */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Accepted Collateral</label>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(collateral) as Array<keyof CollateralSelection>).map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={collateral[key]}
                onChange={() => handleCollateralToggle(key)}
                className="h-4 w-4 rounded border-border-default text-accent-teal focus:ring-accent-teal"
              />
              <span className="text-sm text-text-primary">{key}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Duration (days)</label>
        <div className="flex gap-3">
          <Input
            placeholder="Min"
            type="number"
            value={minDuration}
            onChange={(e) => setMinDuration(e.target.value)}
          />
          <Input
            placeholder="Max"
            type="number"
            value={maxDuration}
            onChange={(e) => setMaxDuration(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="sm">Cancel</Button>
        </DialogClose>
        <Button variant="primary" size="sm" onClick={handleSubmit}>
          Create Offer
        </Button>
      </DialogFooter>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const CATEGORY_LABELS = ['All', ...SECURITY_GROUPS.map((g) => g.label)] as const;

export default function SecLendingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const filteredOffers = useMemo(() => {
    if (categoryFilter === 'All') return MOCK_OFFERS;
    const group = SECURITY_GROUPS.find((g) => g.label === categoryFilter);
    if (!group) return MOCK_OFFERS;
    const symbols = new Set<string>(group.options);
    return MOCK_OFFERS.filter((o) => symbols.has(o.security));
  }, [categoryFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Securities Lending</h1>
        <div className="flex items-center gap-3">
          <Link href="/sec-lending/netting">
            <Button variant="secondary" size="sm" icon={<ArrowRightLeft className="h-4 w-4" />}>
              Bilateral Netting
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
              New Offer
            </Button>
          </DialogTrigger>
          <DialogContent size="md">
            <DialogHeader>
              <DialogTitle>Create New Lending Offer</DialogTitle>
              <DialogDescription>
                Specify the details for your securities lending offer.
              </DialogDescription>
            </DialogHeader>
            <NewOfferForm onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">Available Offers</TabsTrigger>
          <TabsTrigger value="my-deals">My Deals</TabsTrigger>
          <TabsTrigger value="my-offers">My Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {CATEGORY_LABELS.map((label) => (
              <button
                key={label}
                onClick={() => setCategoryFilter(label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-100 ${
                  categoryFilter === label
                    ? 'bg-accent-teal text-white'
                    : 'bg-bg-tertiary text-text-secondary border border-border-default hover:bg-surface-selected hover:text-text-primary'
                }`}
              >
                {label}
                {label !== 'All' && (
                  <span className="ml-1.5 opacity-60">
                    {SECURITY_GROUPS.find((g) => g.label === label)?.options.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <AvailableOffersTable offers={filteredOffers} />
        </TabsContent>

        <TabsContent value="my-deals">
          <MyDealsTable />
        </TabsContent>

        <TabsContent value="my-offers">
          <MyOffersTable offers={MOCK_MY_OFFERS} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
