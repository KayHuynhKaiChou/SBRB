import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock Apollo client
vi.mock('@apollo/client', () => ({
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  useSubscription: vi.fn(),
  gql: (strings: TemplateStringsArray) => strings[0],
}));

// Mock datasheet operations
vi.mock('../../graphql/datasheet.operations', () => ({
  DATA_SHEETS_QUERY: 'DATA_SHEETS_QUERY',
  DATA_SERIES_QUERY: 'DATA_SERIES_QUERY',
  IMPORT_PROGRESS_SUBSCRIPTION: 'IMPORT_PROGRESS_SUBSCRIPTION',
  RENAME_DATASHEET_MUTATION: 'RENAME_DATASHEET_MUTATION',
  DELETE_DATASHEET_MUTATION: 'DELETE_DATASHEET_MUTATION',
}));

// Mock antd to avoid matchMedia issues
vi.mock('antd', () => ({
  Modal: ({ open, children, footer, title, onCancel }: {
    open: boolean;
    children?: React.ReactNode;
    footer?: React.ReactNode[];
    title?: string;
    onCancel?: () => void;
  }) => open ? (
    <div data-testid="modal">
      <div>{title}</div>
      <div>{children}</div>
      <div>{footer}</div>
    </div>
  ) : null,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Alert: ({ message: msg }: { message: string }) => <div role="alert">{msg}</div>,
  Row: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Col: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Divider: () => <hr />,
  Input: ({ placeholder, value, onChange }: { placeholder?: string; value?: string; onChange?: (e: { target: { value: string } }) => void }) => (
    <input placeholder={placeholder} value={value} onChange={onChange} />
  ),
  Radio: Object.assign(
    ({ children, value }: { children: React.ReactNode; value: string }) => (
      <label><input type="radio" value={value} />{children}</label>
    ),
    { Group: ({ children, onChange }: { children: React.ReactNode; onChange?: (e: { target: { value: string } }) => void }) => <div onChange={onChange}>{children}</div> }
  ),
  Empty: Object.assign(
    ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
    { PRESENTED_IMAGE_SIMPLE: null }
  ),
  Table: ({ dataSource }: { dataSource: unknown[] }) => (
    <div>{(dataSource as Array<{ id: string; seriesName: string }>).map((r) => <div key={r.id}>{r.seriesName}</div>)}</div>
  ),
  Checkbox: ({ children, checked, onChange }: { children?: React.ReactNode; checked?: boolean; onChange?: (e: { target: { checked: boolean } }) => void }) => (
    <label><input type="checkbox" checked={checked} onChange={(e) => onChange?.({ target: { checked: e.target.checked } })} />{children}</label>
  ),
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockDataSheets = [
  {
    id: 'ds-1',
    name: 'Doanh thu Q1',
    status: 'ready',
    periodHeaders: ['Jan', 'Feb', 'Mar'],
    seriesCount: 3,
    periodCount: 3,
    originalFilename: 'q1.xlsx',
    importedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

vi.mock('../../hooks/use-datasheet', () => ({
  useDataSheets: vi.fn(() => ({
    dataSheets: mockDataSheets,
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

// Mock child components
vi.mock('../../components/data-selector/sheet-list', () => ({
  SheetList: ({ sheets, onSelect }: { sheets: Array<{ id: string; name: string }>; onSelect: (id: string) => void }) => (
    <div data-testid="sheet-list">
      {sheets.map((s) => (
        <button key={s.id} onClick={() => onSelect(s.id)}>{s.name}</button>
      ))}
    </div>
  ),
}));

vi.mock('../../components/data-selector/series-table', () => ({
  SeriesTable: () => <div data-testid="series-table" />,
}));

import { DataSelectorModal } from '../../components/data-selector/data-selector-modal';

describe('DataSelectorModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    businessId: 'biz-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open=true', () => {
    render(<DataSelectorModal {...defaultProps} />);
    expect(screen.getByText('Chọn dữ liệu')).toBeTruthy();
  });

  it('SheetList shows datasheets', () => {
    render(<DataSelectorModal {...defaultProps} />);
    expect(screen.getByText('Doanh thu Q1')).toBeTruthy();
  });

  it('Confirm button shows validation error when no sheet selected', () => {
    render(<DataSelectorModal {...defaultProps} />);
    const confirmBtn = screen.getByText('Xác nhận');
    fireEvent.click(confirmBtn);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('Cancel closes modal', () => {
    render(<DataSelectorModal {...defaultProps} />);
    const cancelBtn = screen.getByText('Huỷ');
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
