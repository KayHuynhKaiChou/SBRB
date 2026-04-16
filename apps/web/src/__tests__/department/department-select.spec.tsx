import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'department:select_department': 'Select department',
      };
      return map[key] ?? key;
    },
  }),
}));

// Mock Apollo client
const mockUseQuery = vi.fn();
vi.mock('@apollo/client', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  gql: (strings: TemplateStringsArray) => strings[0],
}));

// Mock department operations
vi.mock('../../graphql/department.operations', () => ({
  DEPARTMENTS_QUERY: 'DEPARTMENTS_QUERY',
}));

// Mock antd Select
vi.mock('antd', () => ({
  Select: ({
    value,
    onChange,
    onClear,
    placeholder,
    options,
    allowClear,
  }: {
    value?: string;
    onChange?: (val: string | undefined) => void;
    onClear?: () => void;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    allowClear?: boolean;
    disabled?: boolean;
    className?: string;
  }) => (
    <div data-testid="select-wrapper">
      <select
        data-testid="department-select"
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value || undefined)}
      >
        <option value="">{placeholder}</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {allowClear && value && (
        <button data-testid="clear-btn" onClick={() => onClear?.()}>
          Clear
        </button>
      )}
    </div>
  ),
}));

import { DepartmentSelect } from '../../components/department/department-select';

const mockDepartments = [
  { id: 'd-1', name: 'Sales', parentId: null },
  { id: 'd-2', name: 'Sub-Sales', parentId: 'd-1' },
  { id: 'd-3', name: 'Marketing', parentId: null },
];

describe('DepartmentSelect', () => {
  const defaultProps = {
    businessId: 'biz-1',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: { departments: mockDepartments },
      loading: false,
    });
  });

  it('renders select with department options', () => {
    render(<DepartmentSelect {...defaultProps} />);
    const select = screen.getByTestId('department-select');
    expect(select).toBeTruthy();
    // Root departments appear without indent
    expect(screen.getByText('Sales')).toBeTruthy();
    expect(screen.getByText('Marketing')).toBeTruthy();
  });

  it('renders indented label for nested department', () => {
    render(<DepartmentSelect {...defaultProps} />);
    // Sub-Sales has depth 1, should include indent + dash
    const option = screen.getByText((content) => content.includes('— Sub-Sales'));
    expect(option).toBeTruthy();
  });

  it('calls onChange with selected department id', () => {
    render(<DepartmentSelect {...defaultProps} />);
    const select = screen.getByTestId('department-select');
    fireEvent.change(select, { target: { value: 'd-1' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('d-1');
  });

  it('calls onChange with null when cleared', () => {
    render(<DepartmentSelect {...defaultProps} value="d-1" />);
    const clearBtn = screen.getByTestId('clear-btn');
    fireEvent.click(clearBtn);
    expect(defaultProps.onChange).toHaveBeenCalledWith(null);
  });

  it('returns null when no departments exist', () => {
    mockUseQuery.mockReturnValue({
      data: { departments: [] },
      loading: false,
    });
    const { container } = render(<DepartmentSelect {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('skips query when businessId is empty', () => {
    render(<DepartmentSelect {...defaultProps} businessId="" />);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });
});
