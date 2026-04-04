import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'datasheet:no_data_empty': 'Chưa có dữ liệu nào. Hãy import file Excel.',
        'datasheet:import_title': 'Import dữ liệu',
        'datasheet:search_placeholder': 'Tìm kiếm bộ dữ liệu...',
        'datasheet:manage_title': 'Quản lý dữ liệu',
        'datasheet:page_title': 'Dữ liệu',
        'datasheet:import_success': 'Import thành công',
        'datasheet:delete_confirm': 'Bạn có chắc muốn xóa?',
        'datasheet:delete_success': 'Đã xóa',
        'datasheet:rename_success': 'Đã đổi tên',
        'common:confirm': 'Xác nhận',
        'common:cancel': 'Huỷ',
        'common:edit': 'Chỉnh sửa',
        'common:delete': 'Xóa',
        'common:save': 'Lưu',
        'common:close': 'Đóng',
      };
      if (opts) {
        return (map[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => String(opts[k] ?? k));
      }
      return map[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/data-sheets' }),
}));

// Mock Apollo client
vi.mock('@apollo/client', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  useSubscription: vi.fn(),
  gql: (strings: TemplateStringsArray) => strings[0],
}));

// Mock antd to avoid matchMedia issues
vi.mock('antd', () => ({
  Table: ({ dataSource, locale }: { dataSource: unknown[]; locale?: { emptyText?: React.ReactNode } }) => (
    <div data-testid="table">
      {dataSource.length === 0
        ? (locale?.emptyText ?? <span>No data</span>)
        : (dataSource as Array<{ id: string; name: string }>).map((row) => (
            <div key={row.id} data-testid={`row-${row.id}`}>{row.name}</div>
          ))}
    </div>
  ),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Input: ({ placeholder, value, onChange }: { placeholder?: string; value?: string; onChange?: (e: { target: { value: string } }) => void }) => (
    <input placeholder={placeholder} value={value} onChange={onChange} />
  ),
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Badge: ({ text }: { text: string }) => <span>{text}</span>,
  Popconfirm: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Typography: {
    Title: ({ children, level }: { children: React.ReactNode; level?: number }) => {
      const Tag = `h${level ?? 1}` as keyof JSX.IntrinsicElements;
      return <Tag>{children}</Tag>;
    },
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  },
  Upload: Object.assign(
    ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    {
      Dragger: ({ children }: { children?: React.ReactNode }) => <div data-testid="upload-dragger">{children}</div>,
    }
  ),
  Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Empty: Object.assign(
    ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
    { PRESENTED_IMAGE_SIMPLE: null }
  ),
  message: { success: vi.fn(), error: vi.fn() },
  Avatar: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Layout: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      Header: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
      Content: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
      Sider: ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>,
    }
  ),
  Dropdown: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Alert: ({ message: msg }: { message?: React.ReactNode }) => <div>{msg}</div>,
  Progress: () => <div />,
  Steps: () => <div />,
  Spin: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Form: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      useForm: () => [{ setFieldsValue: vi.fn(), getFieldsValue: vi.fn(() => ({})), getFieldValue: vi.fn(), validateFields: async () => ({}), resetFields: vi.fn() }],
      Item: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }
  ),
}));

// Mock auth store
vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    currentBusinessId: 'biz-1',
    accessToken: 'test-token',
  })),
}));

// Mock use-datasheet hooks
const mockRefetch = vi.fn();
const mockDataSheets = [
  {
    id: 'ds-1',
    name: 'Doanh thu Q1',
    status: 'ready',
    periodHeaders: ['Jan', 'Feb', 'Mar'],
    seriesCount: 5,
    periodCount: 3,
    originalFilename: 'q1.xlsx',
    importedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'ds-2',
    name: 'Chi phí Q1',
    status: 'processing',
    periodHeaders: ['Jan', 'Feb'],
    seriesCount: 3,
    periodCount: 2,
    originalFilename: 'cost.xlsx',
    importedAt: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

const mockUseDataSheets = vi.fn(() => ({
  dataSheets: mockDataSheets,
  loading: false,
  error: null,
  refetch: mockRefetch,
}));

vi.mock('../../hooks/use-datasheet', () => ({
  useDataSheets: () => mockUseDataSheets(),
  useDeleteDataSheet: vi.fn(() => ({ deleteDataSheet: vi.fn(), loading: false })),
  useRenameDataSheet: vi.fn(() => ({ renameDataSheet: vi.fn(), loading: false })),
  useDownloadTemplate: vi.fn(() => ({ downloadTemplate: vi.fn(), loading: false })),
}));

// Mock child dialogs
vi.mock('../../pages/datasheet/import-dialog', () => ({
  ImportDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="import-dialog" /> : null,
}));

vi.mock('../../pages/datasheet/reimport-dialog', () => ({
  ReimportDialog: () => null,
}));

import DataSheetListPage from '../../pages/datasheet/datasheet-list-page';

describe('DataSheetListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with datasheets', () => {
    render(<DataSheetListPage />);
    expect(screen.getByText('Doanh thu Q1')).toBeTruthy();
    expect(screen.getByText('Chi phí Q1')).toBeTruthy();
  });

  it('shows empty state when no data', () => {
    mockUseDataSheets.mockReturnValueOnce({
      dataSheets: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<DataSheetListPage />);
    expect(screen.getByText(/Chưa có dữ liệu nào/)).toBeTruthy();
  });

  it('import button opens import dialog', () => {
    render(<DataSheetListPage />);
    const importBtn = screen.getByText('Import dữ liệu');
    fireEvent.click(importBtn);
    expect(screen.getByTestId('import-dialog')).toBeTruthy();
  });

  it('search filters list', () => {
    render(<DataSheetListPage />);
    const searchInput = screen.getByPlaceholderText('Tìm kiếm bộ dữ liệu...');
    fireEvent.change(searchInput, { target: { value: 'Doanh thu' } });
    expect(screen.getByText('Doanh thu Q1')).toBeTruthy();
    expect(screen.queryByText('Chi phí Q1')).toBeFalsy();
  });
});
