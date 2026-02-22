import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreditTierBadge } from '../CreditTierBadge';

describe('CreditTierBadge', () => {
  it('renders the tier name', () => {
    render(<CreditTierBadge tier="Gold" />);
    expect(screen.getByText('Gold')).toBeInTheDocument();
  });

  it('renders Diamond tier with correct styling', () => {
    const { container } = render(<CreditTierBadge tier="Diamond" />);
    expect(container.firstChild).toHaveClass('text-tier-diamond');
  });

  it('renders Gold tier with correct styling', () => {
    const { container } = render(<CreditTierBadge tier="Gold" />);
    expect(container.firstChild).toHaveClass('text-tier-gold');
  });

  it('renders Silver tier with correct styling', () => {
    const { container } = render(<CreditTierBadge tier="Silver" />);
    expect(container.firstChild).toHaveClass('text-tier-silver');
  });

  it('renders Bronze tier with correct styling', () => {
    const { container } = render(<CreditTierBadge tier="Bronze" />);
    expect(container.firstChild).toHaveClass('text-tier-bronze');
  });

  it('renders Unrated tier as plain text', () => {
    const { container } = render(<CreditTierBadge tier="Unrated" />);
    expect(container.firstChild).toHaveClass('text-text-tertiary');
  });

  it('hides tier name at sm size', () => {
    render(<CreditTierBadge tier="Diamond" size="sm" />);
    expect(screen.queryByText('Diamond')).not.toBeInTheDocument();
  });

  it('shows score at lg size when showScore is true', () => {
    render(<CreditTierBadge tier="Gold" size="lg" showScore score={742} />);
    expect(screen.getByText('742')).toBeInTheDocument();
  });
});
