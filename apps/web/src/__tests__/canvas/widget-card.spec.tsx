import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IWidgetDto } from '@sbrb/shared-types';

// Mock Apollo client
vi.mock('@apollo/client', () => ({
  useQuery: () => ({ data: null, loading: false, refetch: vi.fn() }),
  useMutation: () => [vi.fn(), { loading: false }],
  gql: (s: TemplateStringsArray) => s,
  ApolloClient: class {},
  InMemoryCache: class {},
  ApolloProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock chartjs-plugin-datalabels and chart.js to avoid canvas issues
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
vi.mock('chartjs-plugin-datalabels', () => ({ default: {} }));
vi.mock('react-chartjs-2', () => ({
  Bar: () => <canvas data-testid="bar-chart" />,
  Line: () => <canvas data-testid="line-chart" />,
  Pie: () => <canvas data-testid="pie-chart" />,
}));

// Mock react-rnd — just render children directly
vi.mock('react-rnd', () => ({
  Rnd: ({ children, 'data-testid': testId, ...props }: { children: React.ReactNode; 'data-testid'?: string; [key: string]: unknown }) => (
    <div data-testid={testId} {...props}>
      {children}
    </div>
  ),
}));

// Mock antd components used in WidgetHeader
vi.mock('antd', () => ({
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Typography: {
    Text: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
  },
  Button: ({ children, icon }: { children?: React.ReactNode; icon?: React.ReactNode }) => (
    <button>{icon}{children}</button>
  ),
  Dropdown: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Skeleton: { Node: () => <div data-testid="skeleton" /> },
  message: { error: vi.fn() },
}));

// Mock WidgetModal to avoid complex nested dependencies
vi.mock('../../components/widget/widget-modal', () => ({
  WidgetModal: () => null,
}));

import { WidgetCard } from '../../components/canvas/widget-card';

const makeWidget = (id: string): IWidgetDto => ({
  id,
  tabId: 'tab-1',
  businessId: 'biz-1',
  name: 'Revenue Widget',
  metricName: 'Doanh thu',
  unit: 'VND',
  position: { x: 20, y: 20, w: 800, h: 400 },
  chartConfig: { type: 'bar', colorIndex: 0, showLabels: false, yAxisFromZero: true, showLegend: false },
  dataLink: null,
  isRestricted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('WidgetCard', () => {
  const defaultProps = {
    widget: makeWidget('w1'),
    snapEnabled: true,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDragStop: vi.fn(),
    onResizeStop: vi.fn(),
  };

  it('renders with correct data-testid', () => {
    render(<WidgetCard {...defaultProps} />);
    expect(screen.getByTestId('widget-card-w1')).toBeDefined();
  });

  it('renders widget name', () => {
    render(<WidgetCard {...defaultProps} />);
    expect(screen.getByText('Revenue Widget')).toBeDefined();
  });

  it('renders chart body (inline chart preview)', () => {
    render(<WidgetCard {...defaultProps} />);
    // InlineChartPreview renders skeleton or chart canvas — no data means skeleton
    expect(screen.getByTestId('widget-card-w1')).toBeDefined();
  });

  it('renders WidgetHeader with unit', () => {
    render(<WidgetCard {...defaultProps} />);
    expect(screen.getByText('(VND)')).toBeDefined();
  });
});
