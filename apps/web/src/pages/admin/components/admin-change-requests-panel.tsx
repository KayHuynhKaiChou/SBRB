import React, { useState } from 'react';
import { Table, Button, Empty, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useAdminChangeRequests,
  type IAdminChangeRequest,
} from '../../../hooks/use-admin-business-review';
import { ChangeRequestDiff } from './change-request-diff';

/** Admin panel listing pending change-requests; opens a diff modal to approve/reject. */
export function AdminChangeRequestsPanel() {
  const { t } = useTranslation('admin');
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
            title: t('cr_field'),
            key: 'fields',
            render: (_, r) => (
              <Typography.Text type="secondary">
                {Object.keys(r.changes).join(', ')}
              </Typography.Text>
            ),
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
            width: 130,
            render: (_, r) => (
              <Button type="link" onClick={() => view(r)} className="!text-[#D72A44]">
                {t('cr_view')}
              </Button>
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
