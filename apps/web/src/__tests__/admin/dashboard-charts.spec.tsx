import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IAdminDashboardCharts } from '@sbrb/shared-types';

// antd Grid (Row/Col) reads window.matchMedia for breakpoints — absent in jsdom.
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Avoid real canvas — render each chart kind as a tagged stub.
vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: class {},
  LinearScale: class {},
  BarElement: class {},
  LineElement: class {},
  PointElement: class {},
  ArcElement: class {},
  Filler: class {},
  Tooltip: class {},
  Legend: class {},
}));

vi.mock('react-chartjs-2', () => ({
  Line: () => <canvas data-testid="line-chart" />,
  Bar: () => <canvas data-testid="bar-chart" />,
  Doughnut: () => <canvas data-testid="doughnut-chart" />,
}));

vi.mock('chartjs-plugin-datalabels', () => ({ default: {} }));

import { DashboardCharts } from '../../components/admin/dashboard/dashboard-charts';

const fullCharts: IAdminDashboardCharts = {
  monthlyGrowth: [
    { month: '2026-05', newBusinesses: 1, newUsers: 2 },
    { month: '2026-06', newBusinesses: 3, newUsers: 4 },
  ],
  statusBreakdown: [
    { status: 'approved', count: 5 },
    { status: 'pending', count: 2 },
  ],
  topIndustries: [{ industry: 'Retail', count: 4 }],
  companySizes: [{ size: '1-9', count: 3 }],
  userActivity: { active: 40, disabled: 1, activeLast30d: 6 },
};

const emptyCharts: IAdminDashboardCharts = {
  monthlyGrowth: [{ month: '2026-06', newBusinesses: 0, newUsers: 0 }],
  statusBreakdown: [{ status: 'approved', count: 0 }],
  topIndustries: [],
  companySizes: [],
  userActivity: { active: 0, disabled: 0, activeLast30d: 0 },
};

describe('DashboardCharts', () => {
  it('renders all five charts when data is present', () => {
    render(<DashboardCharts charts={fullCharts} loading={false} />);
    expect(screen.getByTestId('line-chart')).toBeDefined();
    expect(screen.getByTestId('doughnut-chart')).toBeDefined();
    // 3 bar charts: industries, company size, user activity
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(3);
  });

  it('shows empty state (no canvas) when datasets are empty', () => {
    render(<DashboardCharts charts={emptyCharts} loading={false} />);
    expect(screen.queryByTestId('line-chart')).toBeNull();
    expect(screen.queryByTestId('doughnut-chart')).toBeNull();
    expect(screen.queryByTestId('bar-chart')).toBeNull();
    expect(screen.getAllByText('chart_no_data').length).toBeGreaterThan(0);
  });

  it('renders chart card titles', () => {
    render(<DashboardCharts charts={fullCharts} loading={false} />);
    expect(screen.getByText('chart_growth_title')).toBeDefined();
    expect(screen.getByText('chart_status_title')).toBeDefined();
    expect(screen.getByText('chart_user_activity_title')).toBeDefined();
  });
});
