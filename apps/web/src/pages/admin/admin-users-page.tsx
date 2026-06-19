import React, { useEffect, useRef, useState } from 'react';
import { Input, Select, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAdminUsers } from '../../hooks/use-admin-users';
import type { IAdminUserRow } from '../../hooks/use-admin-users';
import { useAuthStore } from '../../store/auth.store';
import { AdminUsersTable } from './components/admin-users-table';
import { UserDetailDrawer } from './components/user-detail-drawer';
import { FeatureTour } from '../../components/guide/feature-tour';
import { adminUsersTourSteps } from './admin-users-tour-steps';

const { Title } = Typography;
const PAGE_SIZE_DEFAULT = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Admin page for managing all platform users. SRS §5.12, §5.15 */
export default function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const { t: tg } = useTranslation('guide');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDisabledFilter, setIsDisabledFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Detail drawer state
  const [selectedUser, setSelectedUser] = useState<IAdminUserRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Granular selector — avoid re-render on token rotation
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  // Debounce search input
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const {
    rows,
    total,
    loading,
    disableUser,
    enableUser,
    disableLoading,
    enableLoading,
  } = useAdminUsers({
    filter: {
      search: debouncedSearch || undefined,
      isDisabled: isDisabledFilter,
    },
    page: {
      offset: (page - 1) * pageSize,
      limit: pageSize,
    },
  });

  const handleRowClick = (row: IAdminUserRow) => {
    setSelectedUser(row);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4" data-testid="tour-admin-users-header">
        <Title level={4} className="!mb-0">
          {t('users_title')}
        </Title>

        <div className="flex gap-3" data-testid="tour-admin-users-filters">
          <Input
            placeholder={t('ph_search_user')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder={t('filter_disabled_all')}
            value={isDisabledFilter}
            onChange={(v) => {
              setIsDisabledFilter(v);
              setPage(1);
            }}
            style={{ width: 150 }}
            allowClear
            options={[
              { label: t('filter_disabled_active'), value: false },
              { label: t('filter_disabled_disabled'), value: true },
            ]}
          />
        </div>
      </div>

      {/* Data table */}
      <div data-testid="tour-admin-users-table">
        <AdminUsersTable
          rows={rows}
          total={total}
          loading={loading}
          page={page}
          pageSize={pageSize}
          currentUserId={currentUserId}
          onPageChange={handlePageChange}
          onDisable={(id) => void disableUser(id)}
          onEnable={(id) => void enableUser(id)}
          onRowClick={handleRowClick}
          disableLoading={disableLoading}
          enableLoading={enableLoading}
        />
      </div>

      {/* User detail drawer */}
      <UserDetailDrawer
        userId={selectedUser?.id ?? null}
        currentAdminId={currentUserId}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onDisable={(id) => void disableUser(id)}
        onEnable={(id) => void enableUser(id)}
        disableLoading={disableLoading}
        enableLoading={enableLoading}
      />

      <FeatureTour tourId="admin-users" steps={adminUsersTourSteps(tg)} />
    </>
  );
}
