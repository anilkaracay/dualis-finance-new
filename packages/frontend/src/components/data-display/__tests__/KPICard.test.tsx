import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../KPICard';

// Mock the useCountUp hook to avoid animation complexities in tests
vi.mock('@/hooks/useCountUp', () => ({
  useCountUp: ({ end, decimals }: { end: number; decimals: number }) => ({
    value: end,
    formattedValue: end.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  }),
}));

// Mock the SparklineChart to avoid SVG rendering issues
vi.mock('../SparklineChart', () => ({
  SparklineChart: () => <div data-testid="sparkline-chart" />,
}));

describe('KPICard', () => {
  it('renders the value text', () => {
    render(<KPICard label="Total Value" value={1234.56} />);
    expect(screen.getByText('1,234.56')).toBeInTheDocument();
  });

  it('shows a label', () => {
    render(<KPICard label="Total Supply" value={100} />);
    expect(screen.getByText('Total Supply')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading=true', () => {
    const { container } = render(<KPICard label="TVL" value={0} loading />);
    // When loading, value should not be rendered, but skeletons should be present
    expect(screen.queryByText('TVL')).not.toBeInTheDocument();
    // Skeleton elements are divs with animate-shimmer class
    const skeletons = container.querySelectorAll('.animate-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows trend indicator if trend data is provided', () => {
    render(
      <KPICard
        label="APY"
        value={5.25}
        trend="up"
        trendValue="+2.1%"
      />
    );
    expect(screen.getByText('+2.1%')).toBeInTheDocument();
  });

  it('applies prefix and suffix', () => {
    const { container } = render(<KPICard label="Rate" value={5.5} prefix="$" suffix="%" />);
    // Prefix and suffix are rendered as text nodes within the value div
    const valueDiv = container.querySelector('.font-mono');
    expect(valueDiv).not.toBeNull();
    expect(valueDiv!.textContent).toContain('$');
    expect(valueDiv!.textContent).toContain('%');
    expect(valueDiv!.textContent).toContain('5.50');
  });
});
