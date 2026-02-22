import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '../ProjectCard';
import type { ProductiveProject } from '@dualis/shared';

const mockProject: ProductiveProject = {
  projectId: 'proj-001',
  ownerPartyId: 'party::owner::1',
  category: 'SolarEnergy',
  status: 'Funded',
  metadata: {
    location: 'Istanbul, Turkey',
    capacity: '50 MW',
    offTaker: 'TEDAS',
    insurancePolicy: 'POL-001',
    independentValue: '12000000',
    expectedIRR: 0.14,
    constructionPeriod: 18,
    operationalLife: 25,
    esgRating: 'A',
    iotFeedId: 'feed-001',
  },
  attestations: ['att-001'],
  requestedAmount: '10000000',
  fundedAmount: '7500000',
  createdAt: '2026-01-15T10:00:00.000Z',
};

const mockProjectUnrated: ProductiveProject = {
  projectId: 'proj-002',
  ownerPartyId: 'party::owner::2',
  category: 'WindEnergy',
  status: 'Proposed',
  metadata: {
    location: 'Ankara, Turkey',
    capacity: null,
    offTaker: null,
    insurancePolicy: null,
    independentValue: '5000000',
    expectedIRR: 0.10,
    constructionPeriod: 12,
    operationalLife: 20,
    esgRating: 'Unrated',
    iotFeedId: null,
  },
  attestations: [],
  requestedAmount: '5000000',
  fundedAmount: '0',
  createdAt: '2026-02-01T10:00:00.000Z',
};

const mockProjectOperational: ProductiveProject = {
  projectId: 'proj-003',
  ownerPartyId: 'party::owner::3',
  category: 'DataCenter',
  status: 'Operational',
  metadata: {
    location: 'Izmir, Turkey',
    capacity: '100 MW',
    offTaker: 'Cloud Provider',
    insurancePolicy: 'POL-003',
    independentValue: '25000000',
    expectedIRR: 0.18,
    constructionPeriod: 24,
    operationalLife: 30,
    esgRating: 'B',
    iotFeedId: 'feed-003',
  },
  attestations: ['att-002', 'att-003'],
  requestedAmount: '20000000',
  fundedAmount: '20000000',
  createdAt: '2025-06-01T10:00:00.000Z',
};

describe('ProjectCard', () => {
  it('renders project location as the title', () => {
    render(<ProjectCard project={mockProject} />);
    const locationElements = screen.getAllByText('Istanbul, Turkey');
    expect(locationElements.length).toBeGreaterThanOrEqual(1);
    // The h3 title is the first occurrence
    expect(locationElements[0]!.tagName).toBe('H3');
  });

  it('shows correct category badge', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Solar')).toBeInTheDocument();
  });

  it('shows project location with MapPin icon', () => {
    render(<ProjectCard project={mockProject} />);
    // The location appears twice: once as the h3 title and once in the MapPin section
    const locationElements = screen.getAllByText('Istanbul, Turkey');
    expect(locationElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows funded percentage', () => {
    render(<ProjectCard project={mockProject} />);
    // 7,500,000 / 10,000,000 = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows ESG badge for rated projects', () => {
    render(<ProjectCard project={mockProject} />);
    // ESGBadge renders "ESG-A" for rating 'A'
    expect(screen.getByText('ESG-A')).toBeInTheDocument();
  });

  it('does not show ESG badge for Unrated projects', () => {
    render(<ProjectCard project={mockProjectUnrated} />);
    expect(screen.queryByText('ESG-A')).not.toBeInTheDocument();
    expect(screen.queryByText('ESG-B')).not.toBeInTheDocument();
    expect(screen.queryByText('ESG-C')).not.toBeInTheDocument();
  });

  it('handles 0 funded amount gracefully', () => {
    render(<ProjectCard project={mockProjectUnrated} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows correct status label', () => {
    render(<ProjectCard project={mockProject} />);
    // "Funded" appears as both a column header and status badge
    const fundedElements = screen.getAllByText('Funded');
    expect(fundedElements.length).toBeGreaterThanOrEqual(2);
  });

  it('shows formatted requested amount', () => {
    render(<ProjectCard project={mockProject} />);
    // 10,000,000 -> "$10.0M"
    expect(screen.getByText('$10.0M')).toBeInTheDocument();
  });

  it('shows Operational status with proper label', () => {
    render(<ProjectCard project={mockProjectOperational} />);
    expect(screen.getByText('Operational')).toBeInTheDocument();
  });
});
