import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyToggle } from '../PrivacyToggle';

describe('PrivacyToggle', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders 3 privacy level options', () => {
    render(<PrivacyToggle currentLevel="Public" onChange={mockOnChange} />);
    expect(screen.getByText('Standart Gizlilik')).toBeInTheDocument();
    expect(screen.getByText('Gelişmiş Gizlilik')).toBeInTheDocument();
    expect(screen.getByText('Tam Gizlilik')).toBeInTheDocument();
  });

  it('shows description for each level', () => {
    render(<PrivacyToggle currentLevel="Public" onChange={mockOnChange} />);
    expect(screen.getByText('Tüm veriler görünür')).toBeInTheDocument();
    expect(screen.getByText('Seçici veri paylaşımı')).toBeInTheDocument();
    expect(screen.getByText('Minimum veri ifşası')).toBeInTheDocument();
  });

  it('shows tags for Selective and Maximum levels', () => {
    render(<PrivacyToggle currentLevel="Public" onChange={mockOnChange} />);
    expect(screen.getByText('(Kurumsal için önerilir)')).toBeInTheDocument();
    expect(screen.getByText('(Premium)')).toBeInTheDocument();
  });

  it('calls onChange when a different level is selected and confirmed', async () => {
    const user = userEvent.setup();
    // Mock window.confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<PrivacyToggle currentLevel="Public" onChange={mockOnChange} />);

    // Click on "Gelişmiş Gizlilik" (Selective)
    await user.click(screen.getByText('Gelişmiş Gizlilik'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnChange).toHaveBeenCalledWith('Selective');

    vi.restoreAllMocks();
  });

  it('does not call onChange when confirm is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<PrivacyToggle currentLevel="Public" onChange={mockOnChange} />);

    await user.click(screen.getByText('Tam Gizlilik'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnChange).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('does not call onChange when clicking the already selected level', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<PrivacyToggle currentLevel="Public" onChange={mockOnChange} />);

    await user.click(screen.getByText('Standart Gizlilik'));

    expect(window.confirm).not.toHaveBeenCalled();
    expect(mockOnChange).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('renders loading skeletons when loading is true', () => {
    const { container } = render(
      <PrivacyToggle currentLevel="Public" onChange={mockOnChange} loading />
    );
    // Should not render the option titles when loading
    expect(screen.queryByText('Standart Gizlilik')).not.toBeInTheDocument();
    // Should render skeleton placeholders (3 cards with skeleton elements)
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });
});
