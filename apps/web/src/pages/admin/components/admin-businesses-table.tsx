import React from 'react';
import { Table, Popconfirm, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { LockOutlined, UnlockOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EBusinessStatus } from '@sbrb/shared-constants';
import { IconButton } from '@sbrb/ui';
import type { IAdminBusinessRow } from '../../../hooks/use-admin-businesses';
import { BusinessStatusTag } from './business-status-tag';

const { Text } = Typography;

interface IAdminBusinessesTableProps {
  rows: IAdminBusinessRow[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onInactivate: (row: IAdminBusinessRow) => void;
  onReactivate: (id: string) => void;
  onChangeOwner: (row: IAdminBusinessRow) => void;
  reactivateLoading: boolean;
}

/**
 * Ant Design Table for admin business list.
 * Columns: Name | Owner | Members | Status | Created | Actions
 */
export function AdminBusinessesTable({
  rows,
  total,
  loading,
  page,
  pageSize,
  onPageChange,
  onInactivate,
  onReactivate,
  onChangeOwner,
  reactivateLoading,
}: IAdminBusinessesTableProps) {
  const { t } = useTranslation('admin');

  const columns: TableColumnsType<IAdminBusinessRow> = [
    {
      title: t('col_name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: { showTitle: false },
      sorter: false,
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
      width: 200,
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
      width: 100,
      align: 'right',
    },
    {
      title: t('col_status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => <BusinessStatusTag status={status} />,
    },
    {
      title: t('col_created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
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
            icon={<UserSwitchOutlined />}
            tooltip={t('change_owner')}
            size="small"
            onClick={() => onChangeOwner(row)}
          />
          {row.status === EBusinessStatus.ACTIVE ? (
            <IconButton
              icon={<LockOutlined />}
              tooltip={t('action_inactivate')}
              size="small"
              onClick={() => onInactivate(row)}
            />
          ) : (
            <Popconfirm
              title={t('reactivate_confirm_title')}
              description={t('reactivate_confirm_desc')}
              onConfirm={() => onReactivate(row.id)}
              okText={t('action_reactivate')}
              cancelText={t('common:cancel', 'Cancel')}
            >
              <IconButton
                icon={<UnlockOutlined />}
                tooltip={t('action_reactivate')}
                size="small"
                loading={reactivateLoading}
              />
            </Popconfirm>
          )}
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
      scroll={{ x: 860 }}
      className="[&_.ant-table-thead>tr>th]:bg-gray-100 [&_.ant-table-tbody>tr:hover>td]:bg-blue-50"
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (total) => `${total} businesses`,
        onChange: onPageChange,
      }}
    />
  );
}
