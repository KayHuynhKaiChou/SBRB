import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useQuery } from '@apollo/client';

// antd Avatar/Tag read window.matchMedia for breakpoints — absent in jsdom.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Navigate: ({ to }: { to: string }) => <div data-testid="redirect" data-to={to} />,
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return { ...actual, useQuery: vi.fn() };
});

import SelectBusinessPage from '../select-business-page';
import { useAuthStore } from '../../../store/auth.store';

const biz = (id: string, name: string) => ({ id, name, status: 'approved', logoUrl: null });

const mockQuery = (businesses: unknown[] | undefined, loading = false) =>
  vi.mocked(useQuery).mockReturnValue({
    data: businesses ? { myBusinesses: businesses } : undefined,
    loading,
  } as never);

const registerButton = () => screen.queryByRole('button', { name: /select_register_cta/i });

describe('SelectBusinessPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(useQuery).mockReset();
    useAuthStore.setState({ currentBusinessId: null });
  });

  it('shows a spinner while loading with no cached data', () => {
    mockQuery(undefined, true);
    const { container } = render(<SelectBusinessPage />);
    expect(container.querySelector('.ant-spin')).toBeTruthy();
  });

  it('redirects to onboarding when the user has no businesses', () => {
    mockQuery([]);
    render(<SelectBusinessPage />);
    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/onboarding');
  });

  it('shows the chooser (no redirect) even with a single business', () => {
    mockQuery([biz('b1', 'Solo Co')]);
    render(<SelectBusinessPage />);
    expect(screen.queryByTestId('redirect')).toBeNull();
    expect(screen.getByText('Solo Co')).toBeInTheDocument();
    expect(registerButton()).toBeInTheDocument();
  });

  it('renders a card per business when the user has multiple', () => {
    mockQuery([biz('b1', 'Alpha'), biz('b2', 'Beta')]);
    render(<SelectBusinessPage />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('selects a business and navigates to the dashboard on click', () => {
    mockQuery([biz('b1', 'Alpha'), biz('b2', 'Beta')]);
    render(<SelectBusinessPage />);
    fireEvent.click(screen.getByText('Beta'));
    expect(useAuthStore.getState().currentBusinessId).toBe('b2');
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  it('hides the register button once the owner has 3 businesses', () => {
    mockQuery([biz('b1', 'A'), biz('b2', 'B'), biz('b3', 'C')]);
    render(<SelectBusinessPage />);
    expect(registerButton()).toBeNull();
  });

  it('navigates to onboarding with canGoBack state when registering', () => {
    mockQuery([biz('b1', 'Alpha'), biz('b2', 'Beta')]);
    render(<SelectBusinessPage />);
    fireEvent.click(registerButton()!);
    expect(navigateMock).toHaveBeenCalledWith('/onboarding', { state: { canGoBack: true } });
  });
});
