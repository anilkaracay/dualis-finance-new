import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
  it('applies default variant classes', () => {
    const { container } = render(<Card>Default</Card>);
    expect(container.firstChild).toHaveClass('bg-bg-tertiary');
  });
  it('applies elevated variant', () => {
    const { container } = render(<Card variant="elevated">Elevated</Card>);
    expect(container.firstChild).toHaveClass('shadow-sm');
  });
  it('applies outlined variant', () => {
    const { container } = render(<Card variant="outlined">Outlined</Card>);
    expect(container.firstChild).toHaveClass('bg-transparent');
  });
  it('applies glass variant', () => {
    const { container } = render(<Card variant="glass">Glass</Card>);
    expect(container.firstChild).toHaveClass('glass');
  });
  it('applies padding sizes', () => {
    const { container } = render(<Card padding="lg">Large padding</Card>);
    expect(container.firstChild).toHaveClass('p-6');
  });
  it('applies no padding', () => {
    const { container } = render(<Card padding="none">No padding</Card>);
    expect(container.firstChild).not.toHaveClass('p-4');
    expect(container.firstChild).not.toHaveClass('p-6');
    expect(container.firstChild).not.toHaveClass('p-8');
  });
  it('applies clickable styles', () => {
    const { container } = render(<Card clickable>Clickable</Card>);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });
  it('forwards custom className', () => {
    const { container } = render(<Card className="custom-class">Custom</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders as h3', () => {
    render(<CardTitle>Title text</CardTitle>);
    const title = screen.getByText('Title text');
    expect(title.tagName).toBe('H3');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content area</CardContent>);
    expect(screen.getByText('Content area')).toBeInTheDocument();
  });
});
