import React from 'react';
import { Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { UserSwitchOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import type { IAdminBusinessRow } from '../../../hooks/use-admin-businesses';
import { BusinessStatusTag } from '../../../components/business/business-status-tag';

const { Text } = Typography;

interface IAdminBusinessesTableProps {
  rows: IAdminBusinessRow[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onChangeOwner: (row: IAdminBusinessRow) => void;
  /** Open the detail drawer — all status changes happen there. */
  onReview: (row: IAdminBusinessRow) => void;
}

/**
 * Admin business list table.
 * Columns: Name | Owner | Members | Status | Created | Actions (view + change owner).
 * Status transitions (approve/reject/inactivate/reactivate) live in the review drawer.
 */
export function AdminBusinessesTable({
  rows,
  total,
  loading,
  page,
  pageSize,
  onPageChange,
  onChangeOwner,
  onReview,
}: IAdminBusinessesTableProps) {
  const { t } = useTranslation('admin');

  const columns: TableColumnsType<IAdminBusinessRow> = [
    {
      title: t('col_name'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: { showTitle: false },
      render: (name: string) => (
        <Text ellipsis={{ tooltip: name }} className="font-semibold block">
          {name}
        </Text>
      ),
    },
    {
      title: t('col_owner'),
      dataIndex: 'ownerEmail',
      key: 'ownerEmail',
      width: 180,
      ellipsis: { showTitle: false },
      render: (email: string | null) => (
        <Text ellipsis={{ tooltip: email ?? undefined }} className="block">
          {email}
        </Text>
      ),
    },
    {
      title: t('col_members'),
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: 90,
      align: 'right',
    },
    {
      title: t('col_status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <BusinessStatusTag status={status} />,
    },
    {
      title: t('col_created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      title: t('col_actions'),
      key: 'actions',
      width: 120,
      align: 'center',
      fixed: 'right' as const,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <IconButton
            icon={<EyeOutlined />}
            tooltip={t('review_title')}
            size="small"
            onClick={() => onReview(row)}
          />
          <IconButton
            icon={<UserSwitchOutlined />}
            tooltip={t('change_owner')}
            size="small"
            onClick={() => onChangeOwner(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <Table<IAdminBusinessRow>
      dataSource={rows}
      columns={columns}
      rowKey="id"
      loading={loading}
      scroll={{ x: 820 }}
      className="[&_.ant-table-thead>tr>th]:bg-gray-100 [&_.ant-table-tbody>tr:hover>td]:bg-blue-50"
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (n) => `${n} businesses`,
        onChange: onPageChange,
      }}
    />
  );
}
