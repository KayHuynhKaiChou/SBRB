import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EBusinessRole, EUserAccountStatus } from '@sbrb/shared-constants';
import type { IBusinessMemberRow } from '../../../../hooks/use-members';
import { MembersTable } from '../members-table';

// antd Table reads window.matchMedia — polyfill for jsdom.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// i18n → echo keys (tooltips become their key, e.g. "action_resend").
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const row = (over: Partial<IBusinessMemberRow>): IBusinessMemberRow => ({
  userId: 'u',
  fullName: 'Name',
  email: 'e@x.com',
  phone: null,
  avatarUrl: null,
  role: EBusinessRole.STAFF,
  status: EUserAccountStatus.ACTIVE,
  joinedAt: '2026-01-01',
  // non-null so the last-login column doesn't render its own "—" (keeps the dash check unambiguous).
  lastLoginAt: '2026-02-01',
  ...over,
});

function renderTable(
  rows: IBusinessMemberRow[],
  currentRole = EBusinessRole.OWNER,
  currentUserId = 'me',
  canEdit = false,
) {
  return render(
    <MembersTable
      rows={rows}
      total={rows.length}
      loading={false}
      page={1}
      pageSize={20}
      currentUserId={currentUserId}
      currentRole={currentRole}
      canEdit={canEdit}
      onPageChange={vi.fn()}
      onEdit={vi.fn()}
      onResend={vi.fn()}
      onDelete={vi.fn()}
      onSetStatus={vi.fn()}
      resendLoading={false}
      removeLoading={false}
      setStatusLoading={false}
    />,
  );
}

describe('MembersTable action gating', () => {
  it('pending row → resend + delete icons, no dash', () => {
    const { container } = renderTable([row({ userId: 's1', status: EUserAccountStatus.PENDING })]);
    expect(container.querySelector('[data-icon="redo"]')).toBeTruthy();
    expect(container.querySelector('[data-icon="delete"]')).toBeTruthy();
    expect(screen.queryAllByText('—').length).toBe(0);
  });

  it('active row → deactivate (stop) icon, no dash', () => {
    const { container } = renderTable([row({ userId: 's2', status: EUserAccountStatus.ACTIVE })]);
    expect(container.querySelector('[data-icon="stop"]')).toBeTruthy();
    expect(screen.queryAllByText('—').length).toBe(0);
  });

  it('inactive row → reactivate (check-circle) icon', () => {
    const { container } = renderTable([row({ userId: 's3', status: EUserAccountStatus.INACTIVE })]);
    expect(container.querySelector('[data-icon="check-circle"]')).toBeTruthy();
  });

  it('owner row → dash, no action icons', () => {
    const { container } = renderTable([row({ userId: 'o1', role: EBusinessRole.OWNER })]);
    expect(screen.queryAllByText('—').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('[data-icon="stop"]')).toBeNull();
  });

  it('own row → dash (cannot act on self)', () => {
    renderTable([row({ userId: 'me' })], EBusinessRole.OWNER, 'me');
    expect(screen.queryAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('manager viewing a manager row → dash', () => {
    renderTable([row({ userId: 'm2', role: EBusinessRole.MANAGER })], EBusinessRole.MANAGER, 'me');
    expect(screen.queryAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('owner with canEdit → edit icon alongside the status action', () => {
    const { container } = renderTable(
      [row({ userId: 's4', status: EUserAccountStatus.ACTIVE })],
      EBusinessRole.OWNER,
      'me',
      true,
    );
    expect(container.querySelector('[data-icon="edit"]')).toBeTruthy();
    expect(container.querySelector('[data-icon="stop"]')).toBeTruthy();
  });

  it('no edit icon when canEdit is false', () => {
    const { container } = renderTable([row({ userId: 's5', status: EUserAccountStatus.ACTIVE })]);
    expect(container.querySelector('[data-icon="edit"]')).toBeNull();
  });
});
