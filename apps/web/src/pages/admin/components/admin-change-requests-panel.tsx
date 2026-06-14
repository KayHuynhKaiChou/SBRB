import React, { useState } from 'react';
import { Table, Empty, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import {
  useAdminChangeRequests,
  type IAdminChangeRequest,
} from '../../../hooks/use-admin-business-review';
import { ChangeRequestDiff } from './change-request-diff';
import { BUSINESS_FIELD_LABEL_KEY } from './business-field-label';

/** Admin panel listing pending change-requests; opens a diff modal to approve/reject. */
export function AdminChangeRequestsPanel() {
  const { t } = useTranslation(['admin', 'business']);

  /** "Contact phone, Address" — human field labels joined, with raw-key fallback. */
  const fieldLabels = (changes: IAdminChangeRequest['changes']) =>
    Object.keys(changes)
      .map((k) => (BUSINESS_FIELD_LABEL_KEY[k] ? t(`business:${BUSINESS_FIELD_LABEL_KEY[k]}`) : k))
      .join(', ');
  const { rows, loading, approveChange, rejectChange, approveLoading, rejectLoading } =
    useAdminChangeRequests();
  const [selected, setSelected] = useState<IAdminChangeRequest | null>(null);
  const [open, setOpen] = useState(false);

  const view = (r: IAdminChangeRequest) => {
    setSelected(r);
    setOpen(true);
  };

  const handleApprove = async (id: string) => {
    await approveChange(id);
    setOpen(false);
  };
  const handleReject = async (id: string, reason: string) => {
    await rejectChange(id, reason);
    setOpen(false);
  };

  if (!loading && rows.length === 0) {
    return <Empty description={t('cr_empty')} className="!mt-16" />;
  }

  return (
    <>
      <Table<IAdminChangeRequest>
        dataSource={rows}
        rowKey="id"
        loading={loading}
        className="[&_.ant-table-thead>tr>th]:bg-gray-100"
        pagination={false}
        columns={[
          { title: t('cr_business'), dataIndex: 'businessName', key: 'businessName' },
          { title: t('cr_requested_by'), dataIndex: 'requestedByEmail', key: 'requestedByEmail' },
          {
            title: t('cr_fields'),
            key: 'fields',
            render: (_, r) => {
              const labels = fieldLabels(r.changes);
              return (
                <Typography.Text type="secondary" ellipsis={{ tooltip: labels }} className="!block !max-w-[280px]">
                  {labels}
                </Typography.Text>
              );
            },
          },
          {
            title: t('audit_col_time'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            render: (d: string) => new Date(d).toLocaleString('vi-VN'),
          },
          {
            title: t('col_actions'),
            key: 'actions',
            width: 90,
            align: 'center',
            render: (_, r) => (
              <IconButton icon={<EyeOutlined />} tooltip={t('cr_view')} size="small" onClick={() => view(r)} />
            ),
          },
        ]}
      />

      <ChangeRequestDiff
        request={selected}
        open={open}
        onClose={() => setOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        approveLoading={approveLoading}
        rejectLoading={rejectLoading}
      />
    </>
  );
}
