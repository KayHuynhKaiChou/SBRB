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

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'datasheet:select_data_title': 'Chọn dữ liệu',
        'common:confirm': 'Xác nhận',
        'common:cancel': 'Huỷ',
        'datasheet:select_sheet_required': 'Vui lòng chọn bảng dữ liệu',
        'datasheet:select_series_error': 'Vui lòng chọn ít nhất 1 chỉ số',
        'datasheet:select_dataset_error': 'Vui lòng chọn bảng dữ liệu',
      };
      return map[key] ?? key;
    },
  }),
}));

// Mock @sbrb/ui FormModal so we control buttons
vi.mock('@sbrb/ui', () => ({
  FormModal: ({ open, title, onClose, onSubmit, children, okText, cancelText }: {
    open: boolean;
    title: string;
    onClose: () => void;
    onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
    children: React.ReactNode;
    okText?: string;
    cancelText?: string;
  }) => open ? (
    <div data-testid="modal">
      <div data-testid="modal-title">{title}</div>
      <div>{children}</div>
      <button data-testid="confirm-btn" onClick={() => onSubmit({})}>{okText}</button>
      <button data-testid="cancel-btn" onClick={onClose}>{cancelText}</button>
    </div>
  ) : null,
}));

// Mock antd
vi.mock('antd', () => {
  const formValues: Record<string, unknown> = {};
  const formInstance = {
    setFieldsValue: (v: Record<string, unknown>) => Object.assign(formValues, v),
    getFieldsValue: () => formValues,
    getFieldValue: (k: string) => formValues[k],
    validateFields: async () => formValues,
    resetFields: () => { Object.keys(formValues).forEach(k => delete formValues[k]); },
  };
  const Form = Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      useForm: () => [formInstance],
      useFormInstance: () => formInstance,
      Item: ({ children, name }: { children: React.ReactNode; name?: string; noStyle?: boolean; dependencies?: string[]; hidden?: boolean; rules?: unknown[]; className?: string; normalize?: (v: unknown) => unknown }) => {
        if (typeof children === 'function') {
          return <>{(children as (arg: { getFieldValue: (k: string) => unknown }) => React.ReactNode)({ getFieldValue: (k: string) => formValues[k] })}</>;
        }
        return <div data-form-item={name}>{children}</div>;
      },
    }
  );

  return {
    Row: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Col: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Divider: () => <hr />,
    Input: ({ placeholder, value, onChange }: { placeholder?: string; value?: string; onChange?: (e: { target: { value: string } }) => void }) => (
      <input placeholder={placeholder} value={value ?? ''} onChange={onChange} />
    ),
    Typography: {
      Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    },
    Form,
  };
});

const mockDataSheets = [
  {
    id: 'ds-1',
    name: 'Doanh thu Q1',
    status: 'ready',
    periodHeaders: ['Jan', 'Feb', 'Mar'],
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
    expect(screen.getByTestId('modal')).toBeTruthy();
    expect(screen.getByText('Chọn dữ liệu')).toBeTruthy();
  });

  it('SheetList shows datasheets', () => {
    render(<DataSelectorModal {...defaultProps} />);
    expect(screen.getByText('Doanh thu Q1')).toBeTruthy();
  });

  it('Confirm button is present', () => {
    render(<DataSelectorModal {...defaultProps} />);
    expect(screen.getByTestId('confirm-btn')).toBeTruthy();
    expect(screen.getByText('Xác nhận')).toBeTruthy();
  });

  it('Cancel closes modal', () => {
    render(<DataSelectorModal {...defaultProps} />);
    const cancelBtn = screen.getByTestId('cancel-btn');
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
