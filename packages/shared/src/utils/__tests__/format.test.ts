import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatAddress, formatDate, formatNumber } from '../format';

describe('formatCurrency', () => {
  it('formats basic USD value', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });
  it('formats compact millions', () => {
    expect(formatCurrency(245_600_000, { compact: true })).toBe('$245.60M');
  });
  it('formats compact billions', () => {
    expect(formatCurrency(1_234_000_000, { compact: true })).toBe('$1.23B');
  });
  it('formats compact thousands', () => {
    expect(formatCurrency(12_345, { compact: true })).toBe('$12.35K');
  });
  it('handles string input', () => {
    expect(formatCurrency('1000')).toBe('$1,000.00');
  });
  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatPercent', () => {
  it('formats decimal as percent', () => {
    expect(formatPercent(0.0824)).toBe('8.24%');
  });
  it('formats with signed option', () => {
    expect(formatPercent(0.05, { signed: true })).toBe('+5.00%');
  });
  it('formats negative percent', () => {
    expect(formatPercent(-0.05)).toBe('-5.00%');
  });
  it('handles string input', () => {
    expect(formatPercent('0.1234')).toBe('12.34%');
  });
});

describe('formatAddress', () => {
  it('truncates long address', () => {
    const addr = 'party::operator::123456789abcdef';
    const formatted = formatAddress(addr);
    expect(formatted).toContain('...');
    expect(formatted.length).toBeLessThan(addr.length);
  });
  it('returns short address as-is', () => {
    expect(formatAddress('short')).toBe('short');
  });
  it('respects custom prefix/suffix lengths', () => {
    const addr = 'abcdefghijklmnopqrstuvwxyz';
    const formatted = formatAddress(addr, { prefixLength: 4, suffixLength: 3 });
    expect(formatted).toBe('abcd...xyz');
  });
});

describe('formatDate', () => {
  it('formats short date', () => {
    const result = formatDate('2026-02-15T10:00:00Z', { format: 'short' });
    expect(result).toContain('2026');
  });
  it('formats long date', () => {
    const result = formatDate('2026-02-15T10:00:00Z', { format: 'long' });
    expect(result).toContain('February');
  });
  // Note: relative time tests are hard to make deterministic, so just test it doesn't throw
  it('handles relative format', () => {
    const result = formatDate(new Date().toISOString(), { relative: true });
    expect(typeof result).toBe('string');
  });
});

describe('formatNumber', () => {
  it('formats number with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
  it('formats with fraction digits', () => {
    expect(formatNumber(1234.5678, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe('1,234.57');
  });
});
