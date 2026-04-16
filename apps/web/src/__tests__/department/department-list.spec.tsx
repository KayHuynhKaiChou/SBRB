import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'department:name_label': 'Department name',
        'department:parent_label': 'Parent department',
        'department:delete_confirm': 'Are you sure?',
        'department:delete_has_children': 'Cannot delete parent',
        'department:no_departments': 'No departments yet',
        'common:actions': 'Actions',
        'common:edit': 'Edit',
        'common:delete': 'Delete',
        'common:cancel': 'Cancel',
      };
      return map[key] ?? key;
    },
  }),
}));

// Mock antd
vi.mock('antd', () => ({
  Table: ({
    dataSource,
    columns,
    locale,
  }: {
    dataSource: Array<{ id: string; name: string; depth: number }>;
    columns: Array<{
      key: string;
      render?: (value: unknown, record: any) => React.ReactNode;
      dataIndex?: string;
    }>;
    locale?: { emptyText?: React.ReactNode };
  }) => (
    <div data-testid="table">
      {dataSource.length === 0
        ? (locale?.emptyText ?? <span>No data</span>)
        : dataSource.map((row) => (
            <div key={row.id} data-testid={`row-${row.id}`}>
              {columns.map((col) =>
                col.render
                  ? <span key={col.key}>{col.render(row[col.dataIndex as keyof typeof row], row)}</span>
                  : null,
              )}
            </div>
          ))}
    </div>
  ),
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popconfirm: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Empty: Object.assign(
    ({ description }: { description?: React.ReactNode }) => (
      <div data-testid="empty">{description}</div>
    ),
    { PRESENTED_IMAGE_SIMPLE: null },
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock @sbrb/ui IconButton
vi.mock('@sbrb/ui', () => ({
  IconButton: ({
    tooltip,
    onClick,
    disabled,
  }: {
    icon: React.ReactNode;
    tooltip: string;
    size?: string;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-testid={`icon-btn-${tooltip}`}>
      {tooltip}
    </button>
  ),
}));

import { DepartmentList } from '../../components/department/department-list';

const mockDepartments = [
  { id: 'd-1', name: 'Sales', parentId: null, businessId: 'biz-1', createdAt: '', updatedAt: '' },
  { id: 'd-2', name: 'Sub-Sales', parentId: 'd-1', businessId: 'biz-1', createdAt: '', updatedAt: '' },
  { id: 'd-3', name: 'Marketing', parentId: null, businessId: 'biz-1', createdAt: '', updatedAt: '' },
];

describe('DepartmentList', () => {
  const defaultProps = {
    departments: mockDepartments,
    loading: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with departments', () => {
    render(<DepartmentList {...defaultProps} />);
    expect(screen.getByTestId('table')).toBeTruthy();
    // "Sales" appears multiple times (as name + as parent of Sub-Sales)
    expect(screen.getAllByText('Sales').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sub-Sales')).toBeTruthy();
    expect(screen.getByText('Marketing')).toBeTruthy();
  });

  it('renders rows for root and nested departments', () => {
    render(<DepartmentList {...defaultProps} />);
    expect(screen.getByTestId('row-d-1')).toBeTruthy();
    expect(screen.getByTestId('row-d-2')).toBeTruthy();
    expect(screen.getByTestId('row-d-3')).toBeTruthy();
  });

  it('renders indent dash for nested department', () => {
    render(<DepartmentList {...defaultProps} />);
    // Sub-Sales should have a dash prefix
    const subSalesRow = screen.getByTestId('row-d-2');
    expect(subSalesRow.textContent).toContain('—');
  });

  it('shows edit button for each department', () => {
    render(<DepartmentList {...defaultProps} />);
    const editButtons = screen.getAllByTestId('icon-btn-Edit');
    expect(editButtons.length).toBe(3);
  });

  it('disables delete button for parent department', () => {
    render(<DepartmentList {...defaultProps} />);
    // d-1 (Sales) has child d-2, so its delete button should be disabled
    const row = screen.getByTestId('row-d-1');
    const disabledDeleteBtn = row.querySelector('button[disabled]');
    expect(disabledDeleteBtn).toBeTruthy();
  });

  it('shows empty state when no departments', () => {
    render(<DepartmentList {...defaultProps} departments={[]} />);
    expect(screen.getByText('No departments yet')).toBeTruthy();
  });
});
