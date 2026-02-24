'use client';

import { useState, useCallback } from 'react';
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
import { Select } from '@/components/ui/Select';
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
  {
    id: 'offer-001',
    security: 'SPY-2026',
    lenderAddress: '0x1234567890abcdef1234567890abcdef12345678',
    lenderTier: 'Gold',
    feeBps: 45,
    feeType: 'Fixed',
    durationDays: 30,
    acceptedCollateral: ['USDC', 'wBTC'],
  },
  {
    id: 'offer-002',
    security: 'T-BILL-2026',
    lenderAddress: '0xabcdef1234567890abcdef1234567890abcd1234',
    lenderTier: 'Silver',
    feeBps: 35,
    feeType: 'Fixed',
    durationDays: 60,
    acceptedCollateral: ['USDC'],
  },
  {
    id: 'offer-003',
    security: 'AAPL-2026',
    lenderAddress: '0x567890abcdef1234567890abcdef1234ef015678',
    lenderTier: 'Gold',
    feeBps: 55,
    feeType: 'Fixed',
    durationDays: 90,
    acceptedCollateral: ['USDC', 'ETH'],
  },
  {
    id: 'offer-004',
    security: 'SPY-2026',
    lenderAddress: '0x9abcdef01234567890abcdef01234567890def01',
    lenderTier: 'Diamond',
    feeBps: 40,
    feeType: 'Floating',
    durationDays: 30,
    acceptedCollateral: ['USDC', 'wBTC', 'ETH'],
  },
  {
    id: 'offer-005',
    security: 'T-BILL-2026',
    lenderAddress: '0xdef01234567890abcdef01234567890abc9abcde',
    lenderTier: 'Bronze',
    feeBps: 50,
    feeType: 'Fixed',
    durationDays: 45,
    acceptedCollateral: ['USDC'],
  },
];

const MOCK_MY_OFFERS: MyOffer[] = [
  {
    id: 'my-offer-001',
    security: 'ETH',
    feeBps: 42,
    feeType: 'Fixed',
    status: 'Active',
    createdAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 'my-offer-002',
    security: 'T-BILL-2026',
    feeBps: 38,
    feeType: 'Floating',
    status: 'Filled',
    createdAt: '2026-02-12T14:00:00Z',
  },
];

const SECURITY_OPTIONS = ['SPY-2026', 'T-BILL-2026', 'AAPL-2026', 'ETH', 'wBTC'] as const;

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
  const [selectedSecurity, setSelectedSecurity] = useState<string>(SECURITY_OPTIONS[0]);
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
      {/* Security Select */}
      <Select
        label="Security Asset"
        value={selectedSecurity}
        onChange={(e) => setSelectedSecurity(e.target.value)}
        options={SECURITY_OPTIONS.map((sec) => ({ value: sec, label: sec }))}
      />

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

export default function SecLendingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

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
          <AvailableOffersTable offers={MOCK_OFFERS} />
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
