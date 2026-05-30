import React, { useEffect, useRef, useState } from 'react';
import { Input, Select, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EBusinessStatus, type TBusinessStatus } from '@sbrb/shared-constants';
import { AdminLayout } from '../../components/layout/admin-layout';
import { useAdminBusinesses } from '../../hooks/use-admin-businesses';
import type { IAdminBusinessRow } from '../../hooks/use-admin-businesses';
import { AdminBusinessesTable } from './components/admin-businesses-table';
import { ChangeOwnerModal } from './components/change-owner-modal';
import { InactivateBusinessModal } from './components/inactivate-business-modal';

const { Title } = Typography;
const PAGE_SIZE_DEFAULT = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Admin page for managing all platform businesses. SRS §5.12, §5.14 */
export default function AdminBusinessesPage() {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TBusinessStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Inactivate modal state
  const [selectedBiz, setSelectedBiz] = useState<IAdminBusinessRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Change owner modal state
  const [changeOwnerBiz, setChangeOwnerBiz] = useState<IAdminBusinessRow | null>(null);
  const [changeOwnerOpen, setChangeOwnerOpen] = useState(false);

  // Debounce search input — avoids query on every keystroke
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
    inactivateBusiness,
    reactivateBusiness,
    changeOwner,
    inactivateLoading,
    reactivateLoading,
    changeOwnerLoading,
  } = useAdminBusinesses({
    filter: {
      search: debouncedSearch || undefined,
      status: statusFilter,
    },
    page: {
      offset: (page - 1) * pageSize,
      limit: pageSize,
    },
  });

  const handleInactivateClick = (row: IAdminBusinessRow) => {
    setSelectedBiz(row);
    setModalOpen(true);
  };

  const handleInactivateSubmit = async (reason: string) => {
    if (!selectedBiz) return;
    try {
      await inactivateBusiness(selectedBiz.id, reason);
      setModalOpen(false);
      setSelectedBiz(null);
    } catch {
      // onError in useMutation already shows error toast; keep modal open so user can retry
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBiz(null);
  };

  const handleChangeOwnerClick = (row: IAdminBusinessRow) => {
    setChangeOwnerBiz(row);
    setChangeOwnerOpen(true);
  };

  const handleChangeOwnerSubmit = async (businessId: string, newOwnerUserId: string) => {
    const result = await changeOwner(businessId, newOwnerUserId);
    // Close modal only on success (no GraphQL errors)
    if (result && !result.errors) {
      setChangeOwnerOpen(false);
      setChangeOwnerBiz(null);
    }
  };

  const handleChangeOwnerClose = () => {
    setChangeOwnerOpen(false);
    setChangeOwnerBiz(null);
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <Title level={4} className="!mb-0">
          {t('businesses_title')}
        </Title>

        <div className="flex gap-3">
          <Input
            placeholder={t('ph_search_business')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder={t('filter_status_all')}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            style={{ width: 150 }}
            allowClear
            options={[
              { label: t('filter_status_active'), value: EBusinessStatus.ACTIVE },
              { label: t('filter_status_inactive'), value: EBusinessStatus.INACTIVE },
            ]}
          />
        </div>
      </div>

      {/* Data table */}
      <AdminBusinessesTable
        rows={rows}
        total={total}
        loading={loading}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onInactivate={handleInactivateClick}
        onReactivate={(id) => void reactivateBusiness(id)}
        onChangeOwner={handleChangeOwnerClick}
        reactivateLoading={reactivateLoading}
      />

      {/* Inactivate confirmation modal */}
      {selectedBiz && (
        <InactivateBusinessModal
          open={modalOpen}
          businessName={selectedBiz.name}
          loading={inactivateLoading}
          onClose={handleModalClose}
          onSubmit={handleInactivateSubmit}
        />
      )}

      {/* Change owner modal */}
      {changeOwnerBiz && (
        <ChangeOwnerModal
          open={changeOwnerOpen}
          businessId={changeOwnerBiz.id}
          businessName={changeOwnerBiz.name}
          changeOwnerLoading={changeOwnerLoading}
          onClose={handleChangeOwnerClose}
          onSubmit={handleChangeOwnerSubmit}
        />
      )}
    </AdminLayout>
  );
}
