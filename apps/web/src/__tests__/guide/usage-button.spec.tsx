import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { IGuideFeature } from '@sbrb/shared-types';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

import { UsageButton } from '../../components/guide/usage-button';
import { useAuthStore } from '../../store/auth.store';
import { useTourStore } from '../../store/tour.store';

const setRole = (platformRole: string | null) =>
  useAuthStore.setState({ user: { platformRole } as never });

const feature = (over: Partial<IGuideFeature>): IGuideFeature => ({
  key: 'k',
  status: 'done',
  route: '/dashboard',
  tourId: 'dashboard',
  audience: ['all'],
  ...over,
});

describe('UsageButton', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    setRole(null);
    useTourStore.getState().endTour();
  });

  it('navigates with ?tour= and starts the tour on click', () => {
    render(<UsageButton feature={feature({})} />);
    fireEvent.click(screen.getByRole('button'));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard?tour=dashboard');
    expect(useTourStore.getState().activeTour).toBe('dashboard');
  });

  it('renders nothing for coming-soon features', () => {
    const { container } = render(<UsageButton feature={feature({ status: 'coming-soon', route: undefined, tourId: undefined })} />);
    expect(container.firstChild).toBeNull();
  });

  it('hides admin-only tour for non-admin users', () => {
    const { container } = render(<UsageButton feature={feature({ audience: ['admin'] })} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows admin-only tour for admin users', () => {
    setRole('admin');
    render(<UsageButton feature={feature({ audience: ['admin'], route: '/admin', tourId: 'admin-dashboard' })} />);
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('hides business-only tour for admin users', () => {
    setRole('admin');
    const { container } = render(<UsageButton feature={feature({ audience: ['owner', 'manager'] })} />);
    expect(container.firstChild).toBeNull();
  });
});
