import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useQuery } from '@apollo/client';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return { ...actual, useQuery: vi.fn() };
});

import { SwitchBusinessButton } from '../switch-business-button';

const mockBusinesses = (count: number) =>
  vi.mocked(useQuery).mockReturnValue({
    data: { myBusinesses: Array.from({ length: count }, (_, i) => ({ id: `b${i}` })) },
  } as never);

describe('SwitchBusinessButton', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(useQuery).mockReset();
  });

  it('renders nothing when myBusinesses is missing', () => {
    vi.mocked(useQuery).mockReturnValue({ data: undefined } as never);
    const { container } = render(<SwitchBusinessButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the button for a single-business user (can register more)', () => {
    mockBusinesses(1);
    render(<SwitchBusinessButton />);
    expect(screen.getByRole('button', { name: /manage_businesses/i })).toBeInTheDocument();
  });

  it('renders the button when the user has multiple businesses', () => {
    mockBusinesses(3);
    render(<SwitchBusinessButton />);
    expect(screen.getByRole('button', { name: /manage_businesses/i })).toBeInTheDocument();
  });

  it('navigates to the business hub on click', () => {
    mockBusinesses(2);
    render(<SwitchBusinessButton />);
    fireEvent.click(screen.getByRole('button', { name: /manage_businesses/i }));
    expect(navigateMock).toHaveBeenCalledWith('/select-business');
  });
});
