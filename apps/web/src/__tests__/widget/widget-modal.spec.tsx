import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { IWidgetDto } from '@sbrb/shared-types';

// Mock Apollo hooks
vi.mock('@apollo/client', () => ({
  useQuery: () => ({ data: null, loading: false, refetch: vi.fn() }),
  useMutation: () => [vi.fn(), { loading: false }],
  gql: (s: TemplateStringsArray) => s,
}));

// Mock antd — minimal stubs
vi.mock('antd', () => ({
  Modal: ({ children, open, footer }: { children: React.ReactNode; open: boolean; footer: null }) =>
    open ? <div data-testid="modal">{children}</div> : null,
  Input: ({ value, onChange, placeholder }: { value: string; onChange: (e: { target: { value: string } }) => void; placeholder?: string }) => (
    <input data-testid="widget-name-input" value={value} onChange={onChange} placeholder={placeholder} />
  ),
  Button: ({ children, onClick, loading }: { children?: React.ReactNode; onClick?: () => void; loading?: boolean }) => (
    <button onClick={onClick} disabled={loading}>{children}</button>
  ),
  Divider: () => <hr />,
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Typography: {
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  },
  message: { error: vi.fn() },
}));

// Mock sub-components
vi.mock('../../components/widget/settings-panel/chart-type-selector', () => ({
  ChartTypeSelector: () => <div data-testid="chart-type-selector" />,
}));
vi.mock('../../components/widget/settings-panel/display-settings', () => ({
  DisplaySettings: () => <div data-testid="display-settings" />,
}));
vi.mock('../../components/widget/settings-panel/data-selector-button', () => ({
  DataSelectorButton: () => <div data-testid="data-selector-button" />,
}));
vi.mock('../../components/widget/settings-panel/alert-threshold-panel', () => ({
  AlertThresholdPanel: () => <div data-testid="alert-threshold-panel" />,
}));
vi.mock('../../components/widget/chart-panel/chart-preview', () => ({
  ChartPreview: () => <div data-testid="chart-preview" />,
}));

import { WidgetModal } from '../../components/widget/widget-modal';

const makeWidget = (): IWidgetDto => ({
  id: 'w1',
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

describe('WidgetModal', () => {
  const onClose = vi.fn();
  const onOpenDataSelector = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open=true', () => {
    render(
      <WidgetModal
        widget={makeWidget()}
        open={true}
        onClose={onClose}
        onOpenDataSelector={onOpenDataSelector}
      />,
    );
    expect(screen.getByTestId('modal')).toBeDefined();
  });

  it('does not render when open=false', () => {
    render(
      <WidgetModal
        widget={makeWidget()}
        open={false}
        onClose={onClose}
        onOpenDataSelector={onOpenDataSelector}
      />,
    );
    expect(screen.queryByTestId('modal')).toBeNull();
  });

  it('shows widget name in input', () => {
    render(
      <WidgetModal
        widget={makeWidget()}
        open={true}
        onClose={onClose}
        onOpenDataSelector={onOpenDataSelector}
      />,
    );
    const input = screen.getByTestId('widget-name-input') as HTMLInputElement;
    expect(input.value).toBe('Revenue Widget');
  });

  it('calls onClose when Close button clicked', () => {
    render(
      <WidgetModal
        widget={makeWidget()}
        open={true}
        onClose={onClose}
        onOpenDataSelector={onOpenDataSelector}
      />,
    );
    fireEvent.click(screen.getByText('Đóng'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders chart-preview and settings sub-components', () => {
    render(
      <WidgetModal
        widget={makeWidget()}
        open={true}
        onClose={onClose}
        onOpenDataSelector={onOpenDataSelector}
      />,
    );
    expect(screen.getByTestId('chart-preview')).toBeDefined();
    expect(screen.getByTestId('chart-type-selector')).toBeDefined();
    expect(screen.getByTestId('display-settings')).toBeDefined();
  });
});
