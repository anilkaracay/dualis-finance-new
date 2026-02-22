import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingWizard } from '../OnboardingWizard';

// Mock the Zustand store
vi.mock('@/stores/useInstitutionalStore', () => ({
  useInstitutionalStore: () => ({
    institution: null,
    apiKeys: [],
    isKYBVerified: false,
    onboardingStep: 0,
    bulkOperations: [],
    isLoading: false,
    startOnboarding: vi.fn().mockResolvedValue(undefined),
    submitKYB: vi.fn().mockResolvedValue(undefined),
    setOnboardingStep: vi.fn(),
    fetchInstitutionStatus: vi.fn().mockResolvedValue(undefined),
    createAPIKey: vi.fn().mockResolvedValue(undefined),
    revokeAPIKey: vi.fn().mockResolvedValue(undefined),
    executeBulkOperation: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('OnboardingWizard', () => {
  it('shows step 1 initially (Company Information)', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText('Company Information')).toBeInTheDocument();
    expect(
      screen.getByText("Provide your institution's legal details for KYB verification.")
    ).toBeInTheDocument();
  });

  it('renders the wizard title', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText('Institutional Onboarding')).toBeInTheDocument();
  });

  it('renders step indicator with all step labels', () => {
    render(<OnboardingWizard />);
    // Step labels are rendered in the StepIndicator (visible on lg screens)
    expect(screen.getByText('Company Info')).toBeInTheDocument();
    expect(screen.getByText('Representatives')).toBeInTheDocument();
    expect(screen.getByText('KYB Documents')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('contains required form fields in step 1', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText('Legal Entity Name')).toBeInTheDocument();
    expect(screen.getByText('Registration Number')).toBeInTheDocument();
    expect(screen.getByText('Jurisdiction')).toBeInTheDocument();
  });

  it('has Continue button', () => {
    render(<OnboardingWizard />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('has a Back button that is disabled on step 1', () => {
    render(<OnboardingWizard />);
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toBeDisabled();
  });

  it('shows input placeholders for step 1 fields', () => {
    render(<OnboardingWizard />);
    expect(screen.getByPlaceholderText('e.g. Acme Capital Ltd.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. TR-MKK-2024-001')).toBeInTheDocument();
  });

  it('renders jurisdiction dropdown with options', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText('Select jurisdiction...')).toBeInTheDocument();
    expect(screen.getByText('Turkey')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('European Union')).toBeInTheDocument();
  });
});
