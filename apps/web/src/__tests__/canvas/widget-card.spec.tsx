import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IWidgetDto } from '@sbrb/shared-types';

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
  message: { error: vi.fn() },
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

  it('renders metric name in body', () => {
    render(<WidgetCard {...defaultProps} />);
    expect(screen.getByText('Doanh thu')).toBeDefined();
  });

  it('renders WidgetHeader with unit', () => {
    render(<WidgetCard {...defaultProps} />);
    expect(screen.getByText('(VND)')).toBeDefined();
  });
});
