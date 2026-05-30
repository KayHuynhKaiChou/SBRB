import React from 'react';
import { Table, Tag, Popconfirm } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { EPlatformRole } from '@sbrb/shared-constants';
import { IconButton } from '@sbrb/ui';
import type { IAdminUserRow } from '../../../hooks/use-admin-users';

interface IAdminUsersTableProps {
  rows: IAdminUserRow[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  currentUserId: string | null;
  onPageChange: (page: number, pageSize: number) => void;
  onDisable: (id: string) => void;
  onEnable: (id: string) => void;
  onRowClick: (row: IAdminUserRow) => void;
  disableLoading: boolean;
  enableLoading: boolean;
}

/**
 * Ant Design Table for admin user list.
 * Columns: Email | Full Name | Platform Role | Status | Businesses | Last Login | Actions
 */
export function AdminUsersTable({
  rows,
  total,
  loading,
  page,
  pageSize,
  currentUserId,
  onPageChange,
  onDisable,
  onEnable,
  onRowClick,
  disableLoading,
  enableLoading,
}: IAdminUsersTableProps) {
  const { t } = useTranslation('admin');

  const columns: ColumnsType<IAdminUserRow> = [
    {
      title: t('col_email'),
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: t('col_full_name'),
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: t('col_platform_role'),
      dataIndex: 'platformRole',
      key: 'platformRole',
      width: 130,
      render: (role?: string | null) =>
        role === EPlatformRole.ADMIN ? (
          <Tag color="volcano">{t('platform_role_admin')}</Tag>
        ) : (
          <span>{t('platform_role_user')}</span>
        ),
    },
    {
      title: t('col_status'),
      dataIndex: 'isDisabled',
      key: 'isDisabled',
      width: 100,
      render: (isDisabled: boolean) =>
        isDisabled ? (
          <Tag color="red">{t('user_status_disabled')}</Tag>
        ) : (
          <Tag color="green">{t('user_status_active')}</Tag>
        ),
    },
    {
      title: t('col_businesses'),
      dataIndex: 'businessCount',
      key: 'businessCount',
      width: 110,
      align: 'right',
    },
    {
      title: t('col_last_login'),
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 130,
      render: (date?: string | null) =>
        date
          ? new Date(date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—',
    },
    {
      title: t('col_actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      // Stop row click propagation so drawer doesn't open when clicking action buttons
      onCell: () => ({ onClick: (e: React.MouseEvent) => e.stopPropagation() }),
      render: (_, row) => {
        const isSelf = row.id === currentUserId;

        if (row.isDisabled) {
          return (
            <Popconfirm
              title={t('enable_confirm_title')}
              description={t('enable_confirm_desc')}
              onConfirm={() => onEnable(row.id)}
              okText={t('action_enable')}
              cancelText={t('common:cancel', 'Cancel')}
            >
              <IconButton
                icon={<UnlockOutlined />}
                tooltip={t('action_enable')}
                size="small"
                loading={enableLoading}
              />
            </Popconfirm>
          );
        }

        return (
          <Popconfirm
            title={t('disable_confirm_title')}
            description={t('disable_confirm_desc')}
            onConfirm={() => onDisable(row.id)}
            okText={t('action_disable')}
            cancelText={t('common:cancel', 'Cancel')}
            disabled={isSelf}
          >
            <IconButton
              icon={<LockOutlined />}
              tooltip={isSelf ? t('disable_self_blocked') : t('action_disable')}
              size="small"
              loading={disableLoading}
              disabled={isSelf}
            />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Table<IAdminUserRow>
      dataSource={rows}
      columns={columns}
      rowKey="id"
      loading={loading}
      onRow={(row) => ({ onClick: () => onRowClick(row), style: { cursor: 'pointer' } })}
      className="[&_.ant-table-thead>tr>th]:bg-gray-100 [&_.ant-table-tbody>tr:hover>td]:bg-blue-50"
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (n) => `${n} users`,
        onChange: onPageChange,
      }}
    />
  );
}
