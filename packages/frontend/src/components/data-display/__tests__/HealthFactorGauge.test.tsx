import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthFactorGauge } from '../HealthFactorGauge';

describe('HealthFactorGauge', () => {
  it('renders "Safe" for HF >= 2.0', () => {
    render(<HealthFactorGauge value={2.5} animated={false} />);
    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  it('renders "Caution" for HF between 1.5 and 2.0', () => {
    render(<HealthFactorGauge value={1.7} animated={false} />);
    expect(screen.getByText('Caution')).toBeInTheDocument();
  });

  it('renders "At Risk" for HF between 1.0 and 1.5', () => {
    render(<HealthFactorGauge value={1.2} animated={false} />);
    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });

  it('renders "Liquidatable" for HF < 1.0', () => {
    render(<HealthFactorGauge value={0.8} animated={false} />);
    expect(screen.getByText('Liquidatable')).toBeInTheDocument();
  });

  it('displays the numeric value', () => {
    render(<HealthFactorGauge value={1.85} animated={false} />);
    expect(screen.getByText('1.85')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<HealthFactorGauge value={2.0} showLabel={false} animated={false} />);
    expect(screen.queryByText('Safe')).not.toBeInTheDocument();
  });
});
