import { useEffect, useRef, useState } from 'react';
import { Spin, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import { APP_ROUTES, isManagerRole } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import {
  useMembers,
  useMyBusinessRole,
  type IBusinessMemberRow,
  type ICreateStaffInput,
} from '../../hooks/use-members';
import { FeatureTour } from '../../components/guide/feature-tour';
import { MembersFilters } from './components/members-filters';
import { MembersTable } from './components/members-table';
import { CreateAccountModal } from './components/create-account-modal';
import { MembersEditDrawer } from './components/members-edit-drawer';
import { membersTourSteps } from './members-tour-steps';

const { Title } = Typography;
const PAGE_SIZE_DEFAULT = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Business-scoped personnel management page (owner/manager only). */
export default function MembersPage() {
  const { t } = useTranslation('member');
  const { t: tg } = useTranslation('guide');

  const businessId = useAuthStore((s) => s.currentBusinessId);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const { role, loading: roleLoading } = useMyBusinessRole(businessId);
  const canManage = isManagerRole(role);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<IBusinessMemberRow | null>(null);

  // Debounce the search box → query variable.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [search]);

  const {
    rows,
    total,
    loading,
    create,
    resend,
    remove,
    setStatus,
    updateInfo,
    resendLoading,
    removeLoading,
    setStatusLoading,
    updateInfoLoading,
  } = useMembers({
    businessId,
    enabled: canManage,
    filter: {
      search: debouncedSearch || undefined,
      role: roleFilter,
      status: statusFilter,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    },
  });

  // Still resolving the caller's role — avoid flashing a redirect.
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }
  // Staff (or unknown role) cannot access personnel management.
  if (!canManage) return <Navigate to={APP_ROUTES.DASHBOARD} replace />;

  const handleCreate = (input: ICreateStaffInput) => create(input);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <Title level={4} className="!m-0">
          {t('page_title')}
        </Title>
        <span data-tour="members-create">
          <IconButton
            icon={<PlusOutlined />}
            tooltip={t('create_account_btn')}
            variant="ghost"
            onClick={() => setCreateOpen(true)}
          />
        </span>
      </div>

      <div className="mb-4">
        <MembersFilters
          search={search}
          onSearchChange={setSearch}
          role={roleFilter}
          onRoleChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
          status={statusFilter}
          onStatusChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </div>

      <MembersTable
        rows={rows}
        total={total}
        loading={loading}
        page={page}
        pageSize={pageSize}
        currentUserId={currentUserId}
        currentRole={role}
        canEdit={canManage}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onEdit={(row) => setEditRow(row)}
        onResend={(id) => void resend(id)}
        onDelete={(id) => void remove(id)}
        onSetStatus={(id, active) => void setStatus(id, active)}
        resendLoading={resendLoading}
        removeLoading={removeLoading}
        setStatusLoading={setStatusLoading}
      />

      <CreateAccountModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentRole={role}
        onSubmit={handleCreate}
      />

      <MembersEditDrawer
        open={!!editRow}
        member={editRow}
        loading={updateInfoLoading}
        onClose={() => setEditRow(null)}
        onSubmit={updateInfo}
      />

      <FeatureTour tourId="members" steps={membersTourSteps(tg)} />
    </div>
  );
}
