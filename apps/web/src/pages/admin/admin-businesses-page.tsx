import React, { useEffect, useRef, useState } from 'react';
import { Input, Select, Typography, Segmented } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EBusinessStatus, type TBusinessStatus } from '@sbrb/shared-constants';
import { AdminLayout } from '../../components/layout/admin-layout';
import { useAdminBusinesses } from '../../hooks/use-admin-businesses';
import type { IAdminBusinessRow } from '../../hooks/use-admin-businesses';
import { AdminBusinessesTable } from './components/admin-businesses-table';
import { ChangeOwnerModal } from './components/change-owner-modal';
import { BusinessReviewDrawer } from './components/business-review-drawer';
import { AdminChangeRequestsPanel } from './components/admin-change-requests-panel';

const { Title } = Typography;
const PAGE_SIZE_DEFAULT = 20;
const SEARCH_DEBOUNCE_MS = 300;

type TTab = 'businesses' | 'changes';

/** Admin page for managing all platform businesses. SRS §5.12, §5.14 + approval review. */
export default function AdminBusinessesPage() {
  const { t } = useTranslation('admin');
  const [tab, setTab] = useState<TTab>('businesses');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TBusinessStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Change owner modal state
  const [changeOwnerBiz, setChangeOwnerBiz] = useState<IAdminBusinessRow | null>(null);
  const [changeOwnerOpen, setChangeOwnerOpen] = useState(false);

  // Review drawer state
  const [reviewBizId, setReviewBizId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

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
    approveBusiness,
    rejectBusiness,
    inactivateLoading,
    reactivateLoading,
    changeOwnerLoading,
    approveLoading,
    rejectLoading,
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

  const handleReviewClick = (row: IAdminBusinessRow) => {
    setReviewBizId(row.id);
    setReviewOpen(true);
  };

  const handleChangeOwnerClick = (row: IAdminBusinessRow) => {
    setChangeOwnerBiz(row);
    setChangeOwnerOpen(true);
  };

  const handleChangeOwnerSubmit = async (businessId: string, newOwnerUserId: string) => {
    const result = await changeOwner(businessId, newOwnerUserId);
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
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <Title level={4} className="!mb-0">
          {t('businesses_title')}
        </Title>
        <Segmented<TTab>
          value={tab}
          onChange={(v) => setTab(v)}
          options={[
            { label: t('tab_businesses'), value: 'businesses' },
            { label: t('tab_change_requests'), value: 'changes' },
          ]}
        />
      </div>

      {tab === 'changes' ? (
        <AdminChangeRequestsPanel />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-end flex-wrap gap-3">
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
              style={{ width: 170 }}
              allowClear
              options={[
                { label: t('status_pending'), value: EBusinessStatus.PENDING },
                { label: t('status_approved'), value: EBusinessStatus.APPROVED },
                { label: t('status_rejected'), value: EBusinessStatus.REJECTED },
                { label: t('status_inactive'), value: EBusinessStatus.INACTIVE },
              ]}
            />
          </div>

          <AdminBusinessesTable
            rows={rows}
            total={total}
            loading={loading}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onChangeOwner={handleChangeOwnerClick}
            onReview={handleReviewClick}
          />
        </>
      )}

      {/* Review drawer — all status transitions happen here */}
      <BusinessReviewDrawer
        businessId={reviewBizId}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onApprove={(id) => {
          void approveBusiness(id);
          setReviewOpen(false);
        }}
        onReject={(id, reason) => {
          void rejectBusiness(id, reason);
          setReviewOpen(false);
        }}
        onInactivate={(id, reason) => {
          void inactivateBusiness(id, reason);
          setReviewOpen(false);
        }}
        onReactivate={(id) => {
          void reactivateBusiness(id);
          setReviewOpen(false);
        }}
        approveLoading={approveLoading}
        rejectLoading={rejectLoading}
        inactivateLoading={inactivateLoading}
        reactivateLoading={reactivateLoading}
      />

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
