import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompositeScoreRing } from '../CompositeScoreRing';
import type { CompositeScore } from '@dualis/shared';

const mockDiamondScore: CompositeScore = {
  partyId: 'party::test::1',
  compositeScore: 920,
  tier: 'Diamond',
  layers: {
    onChain: { score: 380, max: 400 },
    offChain: { score: 320, max: 350 },
    ecosystem: { score: 220, max: 250 },
  },
  onChainDetail: {
    loanCompletion: 145,
    repaymentSpeed: 95,
    collateralHealth: 75,
    protocolHistory: 38,
    secLendingRecord: 27,
    total: 380,
  },
  offChainDetail: {
    creditBureauScore: 140,
    incomeVerification: 90,
    businessVerification: 45,
    kycCompletion: 45,
    total: 320,
  },
  ecosystemDetail: {
    tifaPerformance: 90,
    crossProtocolRefs: 70,
    governanceStaking: 60,
    total: 220,
  },
  nextTier: { name: 'Diamond', threshold: 850, pointsNeeded: 0, progressPercent: 100 },
  benefits: { maxLTV: 0.85, rateDiscount: 0.25, minCollateralRatio: 1.15, liquidationBuffer: 0.05 },
  lastCalculated: '2026-02-20T10:00:00.000Z',
};

const mockUnratedScore: CompositeScore = {
  partyId: 'party::test::2',
  compositeScore: 0,
  tier: 'Unrated',
  layers: {
    onChain: { score: 0, max: 400 },
    offChain: { score: 0, max: 350 },
    ecosystem: { score: 0, max: 250 },
  },
  onChainDetail: {
    loanCompletion: 0,
    repaymentSpeed: 0,
    collateralHealth: 0,
    protocolHistory: 0,
    secLendingRecord: 0,
    total: 0,
  },
  offChainDetail: {
    creditBureauScore: 0,
    incomeVerification: 0,
    businessVerification: 0,
    kycCompletion: 0,
    total: 0,
  },
  ecosystemDetail: {
    tifaPerformance: 0,
    crossProtocolRefs: 0,
    governanceStaking: 0,
    total: 0,
  },
  nextTier: { name: 'Bronze', threshold: 300, pointsNeeded: 300, progressPercent: 0 },
  benefits: { maxLTV: 0.50, rateDiscount: 0.00, minCollateralRatio: 1.75, liquidationBuffer: 0.15 },
  lastCalculated: '2026-02-20T10:00:00.000Z',
};

const mockGoldScore: CompositeScore = {
  partyId: 'party::test::3',
  compositeScore: 720,
  tier: 'Gold',
  layers: {
    onChain: { score: 300, max: 400 },
    offChain: { score: 250, max: 350 },
    ecosystem: { score: 170, max: 250 },
  },
  onChainDetail: {
    loanCompletion: 120,
    repaymentSpeed: 80,
    collateralHealth: 55,
    protocolHistory: 25,
    secLendingRecord: 20,
    total: 300,
  },
  offChainDetail: {
    creditBureauScore: 110,
    incomeVerification: 70,
    businessVerification: 35,
    kycCompletion: 35,
    total: 250,
  },
  ecosystemDetail: {
    tifaPerformance: 70,
    crossProtocolRefs: 55,
    governanceStaking: 45,
    total: 170,
  },
  nextTier: { name: 'Diamond', threshold: 850, pointsNeeded: 130, progressPercent: 84.7 },
  benefits: { maxLTV: 0.78, rateDiscount: 0.15, minCollateralRatio: 1.25, liquidationBuffer: 0.08 },
  lastCalculated: '2026-02-20T10:00:00.000Z',
};

const mockMaxScore: CompositeScore = {
  partyId: 'party::test::4',
  compositeScore: 1000,
  tier: 'Diamond',
  layers: {
    onChain: { score: 400, max: 400 },
    offChain: { score: 350, max: 350 },
    ecosystem: { score: 250, max: 250 },
  },
  onChainDetail: {
    loanCompletion: 150,
    repaymentSpeed: 100,
    collateralHealth: 80,
    protocolHistory: 40,
    secLendingRecord: 30,
    total: 400,
  },
  offChainDetail: {
    creditBureauScore: 150,
    incomeVerification: 100,
    businessVerification: 50,
    kycCompletion: 50,
    total: 350,
  },
  ecosystemDetail: {
    tifaPerformance: 100,
    crossProtocolRefs: 80,
    governanceStaking: 70,
    total: 250,
  },
  nextTier: { name: 'Diamond', threshold: 850, pointsNeeded: 0, progressPercent: 100 },
  benefits: { maxLTV: 0.85, rateDiscount: 0.25, minCollateralRatio: 1.15, liquidationBuffer: 0.05 },
  lastCalculated: '2026-02-20T10:00:00.000Z',
};

describe('CompositeScoreRing', () => {
  it('renders without crashing with valid score', () => {
    const { container } = render(
      <CompositeScoreRing compositeScore={mockDiamondScore} animated={false} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows correct composite score number', () => {
    render(
      <CompositeScoreRing compositeScore={mockDiamondScore} animated={false} />
    );
    expect(screen.getByText('920')).toBeInTheDocument();
  });

  it('shows correct tier name for medium size (default)', () => {
    render(
      <CompositeScoreRing compositeScore={mockGoldScore} animated={false} />
    );
    expect(screen.getByText('Gold')).toBeInTheDocument();
  });

  it('renders skeleton when compositeScore is null', () => {
    const { container } = render(
      <CompositeScoreRing compositeScore={null} animated={false} />
    );
    // Should not render an SVG when score is null
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('handles 0 score (Unrated tier)', () => {
    render(
      <CompositeScoreRing compositeScore={mockUnratedScore} animated={false} />
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Unrated')).toBeInTheDocument();
  });

  it('handles max 1000 score (Diamond tier)', () => {
    render(
      <CompositeScoreRing compositeScore={mockMaxScore} animated={false} />
    );
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('Diamond')).toBeInTheDocument();
  });

  it('shows breakdown legend in large size', () => {
    render(
      <CompositeScoreRing compositeScore={mockDiamondScore} size="lg" animated={false} />
    );
    expect(screen.getByText('On-chain')).toBeInTheDocument();
    expect(screen.getByText('Off-chain')).toBeInTheDocument();
    expect(screen.getByText('Ecosystem')).toBeInTheDocument();
  });

  it('does not show tier badge in small size', () => {
    render(
      <CompositeScoreRing compositeScore={mockDiamondScore} size="sm" animated={false} />
    );
    expect(screen.queryByText('Diamond')).not.toBeInTheDocument();
    // sm size shows "/ 1000"
    expect(screen.getByText('/ 1000')).toBeInTheDocument();
  });
});
