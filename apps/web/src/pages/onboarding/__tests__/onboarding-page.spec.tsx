import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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
let locationState: unknown = null;
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => ({ state: locationState }),
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return { ...actual, useMutation: () => [vi.fn(), { loading: false }] };
});
vi.mock('../../../components/business/business-kyb-fields', () => ({
  BusinessKybFields: () => <div data-testid="kyb-fields" />,
}));
vi.mock('../../../components/guide/feature-tour', () => ({ FeatureTour: () => null }));

import OnboardingPage from '../onboarding-page';

const backButton = () => screen.queryByRole('button', { name: /create_back/i });

describe('OnboardingPage — Back button', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    locationState = null;
  });

  it('hides Back for forced onboarding (no canGoBack state)', () => {
    render(<OnboardingPage />);
    expect(backButton()).toBeNull();
  });

  it('shows Back when arriving from the business hub (canGoBack)', () => {
    locationState = { canGoBack: true };
    render(<OnboardingPage />);
    expect(backButton()).toBeInTheDocument();
  });

  it('navigates back in history on Back click', () => {
    locationState = { canGoBack: true };
    render(<OnboardingPage />);
    fireEvent.click(backButton()!);
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
