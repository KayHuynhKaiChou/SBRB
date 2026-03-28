import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IChartConfig } from '@sbrb/shared-types';
import type { IChartDataResult } from '../../hooks/use-chart-data';

// Mock chart.js registration to avoid canvas issues in test env
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
  Title: class {},
}));

vi.mock('react-chartjs-2', () => ({
  Bar: ({ 'data-testid': testId }: { 'data-testid'?: string }) => <canvas data-testid={testId ?? 'bar-chart'} />,
  Line: ({ 'data-testid': testId }: { 'data-testid'?: string }) => <canvas data-testid={testId ?? 'line-chart'} />,
  Doughnut: ({ 'data-testid': testId }: { 'data-testid'?: string }) => <canvas data-testid={testId ?? 'doughnut-chart'} />,
}));

vi.mock('antd', () => ({
  Skeleton: {
    Node: ({ active }: { active?: boolean }) => <div data-testid="skeleton" aria-busy={active} />,
  },
  Typography: {
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  },
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@ant-design/icons', () => ({
  ReloadOutlined: () => <span>reload</span>,
  ArrowUpOutlined: () => <span>↑</span>,
  ArrowDownOutlined: () => <span>↓</span>,
  MinusOutlined: () => <span>-</span>,
}));

import { ChartPreview } from '../../components/widget/chart-panel/chart-preview';

const baseConfig: IChartConfig = {
  type: 'bar',
  colorIndex: 0,
  showLabels: false,
  yAxisFromZero: true,
  showLegend: false,
};

const mockChartData: IChartDataResult = {
  labels: ['T1', 'T2', 'T3'],
  datasets: [
    { label: 'Series A', data: [100, 200, 150], backgroundColor: '#1677ff', borderColor: '#1677ff' },
  ],
  trend: { value: 12.5, direction: 'up', vsLabel: 'T3' },
};

describe('ChartPreview', () => {
  it('renders skeleton when loading=true', () => {
    render(
      <ChartPreview
        chartData={null}
        loading={true}
        chartType="bar"
        config={baseConfig}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByTestId('skeleton')).toBeDefined();
  });

  it('renders empty state when no data', () => {
    render(
      <ChartPreview
        chartData={null}
        loading={false}
        chartType="bar"
        config={baseConfig}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('Chưa có dữ liệu')).toBeDefined();
  });

  it('renders empty state when datasets empty', () => {
    const emptyData: IChartDataResult = { labels: [], datasets: [], trend: null };
    render(
      <ChartPreview
        chartData={emptyData}
        loading={false}
        chartType="bar"
        config={baseConfig}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('Chưa có dữ liệu')).toBeDefined();
  });

  it('renders bar chart when chartType=bar and data present', () => {
    render(
      <ChartPreview
        chartData={mockChartData}
        loading={false}
        chartType="bar"
        config={baseConfig}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByTestId('bar-chart')).toBeDefined();
  });

  it('renders TrendBadge when trend exists', () => {
    render(
      <ChartPreview
        chartData={mockChartData}
        loading={false}
        chartType="bar"
        config={baseConfig}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('12.5%')).toBeDefined();
    expect(screen.getByText('vs T3')).toBeDefined();
  });

  it('does not render TrendBadge when trend is null', () => {
    const noTrend: IChartDataResult = { ...mockChartData, trend: null };
    render(
      <ChartPreview
        chartData={noTrend}
        loading={false}
        chartType="bar"
        config={baseConfig}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.queryByText('vs T3')).toBeNull();
  });
});
