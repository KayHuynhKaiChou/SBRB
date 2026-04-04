import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { IWidgetDto } from '@sbrb/shared-types';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'common:save': 'Lưu',
        'common:close': 'Đóng',
        'widget:widget_name_placeholder': 'Tên widget',
        'widget:data_source_section': 'Nguồn dữ liệu',
      };
      return map[key] ?? key;
    },
  }),
}));

// Mock Apollo hooks
vi.mock('@apollo/client', () => ({
  useQuery: () => ({ data: null, loading: false, refetch: vi.fn() }),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ refetchQueries: vi.fn() }),
  gql: (s: TemplateStringsArray) => s,
}));

// Mock antd — minimal stubs
vi.mock('antd', () => {
  const formValues: Record<string, unknown> = {};
  const Form: React.FC<{ children: React.ReactNode; component?: false }> & {
    useForm: () => [{ setFieldsValue: (v: Record<string, unknown>) => void; getFieldsValue: () => Record<string, unknown>; getFieldValue: (k: string) => unknown }];
    Item: React.FC<{ children: React.ReactNode; name?: string; noStyle?: boolean; dependencies?: string[] }>;
  } = ({ children }) => <div>{children}</div>;
  Form.useForm = () => [
    {
      setFieldsValue: (v: Record<string, unknown>) => Object.assign(formValues, v),
      getFieldsValue: () => formValues,
      getFieldValue: (k: string) => formValues[k],
    },
  ];
  Form.useWatch = () => [];
  Form.Item = ({ children, name }: { children: React.ReactNode | ((form: { getFieldValue: (k: string) => unknown }) => React.ReactNode); name?: string; noStyle?: boolean; dependencies?: string[]; shouldUpdate?: boolean | ((prev: unknown, curr: unknown) => boolean) }) => {
    if (typeof children === 'function') {
      return <>{children({ getFieldValue: (k: string) => formValues[k] })}</>;
    }
    if (name && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ value?: unknown; onChange?: (e: { target: { value: unknown } }) => void }>, {
        value: formValues[name] ?? '',
        onChange: (e: { target: { value: unknown } }) => { formValues[name] = e.target.value; },
      });
    }
    return <div data-form-item={name}>{children}</div>;
  };

  return {
    Modal: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div data-testid="modal">{children}</div> : null,
    Input: ({ value, onChange, placeholder }: { value?: string; onChange?: (e: { target: { value: string } }) => void; placeholder?: string }) => (
      <input data-testid="widget-name-input" value={value ?? ''} onChange={onChange} placeholder={placeholder} />
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
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Form,
  };
});

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
vi.mock('../../components/widget/settings-panel/series-color-picker', () => ({
  SeriesColorPicker: () => <div data-testid="series-color-picker" />,
}));
vi.mock('../../hooks/use-chart-data', () => ({
  useChartData: () => ({ chartData: null, loading: false, refetch: vi.fn() }),
  useAvailableSeries: () => ({ series: [], loading: false }),
}));
vi.mock('../../hooks/use-widget-config', () => ({
  useWidgetConfig: () => ({
    updateConfig: vi.fn(),
    updateDataLink: vi.fn(),
    removeDataLink: vi.fn(),
    loading: false,
  }),
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
    // Close is the second icon button in the header (save=first, close=second)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
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
