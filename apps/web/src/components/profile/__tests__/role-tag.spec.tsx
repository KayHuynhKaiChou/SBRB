import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleTag } from '../role-tag';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Tag: ({ children, color }: { children: React.ReactNode; color?: string }) => (
      <div data-testid={`tag-${color}`}>{children}</div>
    ),
  };
});

describe('RoleTag', () => {
  it('renders owner role with red color', () => {
    render(<RoleTag role="owner" />);
    expect(screen.getByTestId('tag-red')).toBeInTheDocument();
    expect(screen.getByText('role_owner')).toBeInTheDocument();
  });

  it('renders manager role with blue color', () => {
    render(<RoleTag role="manager" />);
    expect(screen.getByTestId('tag-blue')).toBeInTheDocument();
    expect(screen.getByText('role_manager')).toBeInTheDocument();
  });

  it('renders staff role with default color', () => {
    render(<RoleTag role="staff" />);
    expect(screen.getByTestId('tag-default')).toBeInTheDocument();
    expect(screen.getByText('role_staff')).toBeInTheDocument();
  });

  it('renders viewer role with gold color', () => {
    render(<RoleTag role="viewer" />);
    expect(screen.getByTestId('tag-gold')).toBeInTheDocument();
    expect(screen.getByText('role_viewer')).toBeInTheDocument();
  });

  it('handles uppercase role and converts to lowercase', () => {
    render(<RoleTag role="OWNER" />);
    expect(screen.getByTestId('tag-red')).toBeInTheDocument();
    expect(screen.getByText('role_owner')).toBeInTheDocument();
  });

  it('handles mixed case role', () => {
    render(<RoleTag role="Manager" />);
    expect(screen.getByTestId('tag-blue')).toBeInTheDocument();
    expect(screen.getByText('role_manager')).toBeInTheDocument();
  });

  it('renders unknown role with default color and fallback text', () => {
    render(<RoleTag role="custom" />);
    expect(screen.getByTestId('tag-default')).toBeInTheDocument();
    expect(screen.getByText('role_custom')).toBeInTheDocument();
  });

  it('uses i18n translation key for role name', () => {
    render(<RoleTag role="manager" />);
    // Should call t('role_manager', 'manager') with fallback
    expect(screen.getByText('role_manager')).toBeInTheDocument();
  });

  it('renders with correct color mapping for all roles', () => {
    const roles = [
      { role: 'owner', color: 'red' },
      { role: 'manager', color: 'blue' },
      { role: 'staff', color: 'default' },
      { role: 'viewer', color: 'gold' },
    ];

    roles.forEach(({ role, color }) => {
      const { unmount } = render(<RoleTag role={role} />);
      expect(screen.getByTestId(`tag-${color}`)).toBeInTheDocument();
      unmount();
    });
  });
});
