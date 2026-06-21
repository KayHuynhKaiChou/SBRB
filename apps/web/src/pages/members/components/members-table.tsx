import { Table, Tag, Popconfirm, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  RedoOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import {
  ACCOUNT_STATUS_TAG_COLOR,
  EBusinessRole,
  EUserAccountStatus,
  ROLE_TAG_COLOR,
  type TBusinessRole,
} from '@sbrb/shared-constants';
import type { IBusinessMemberRow } from '../../../hooks/use-members';

const { Text } = Typography;

interface IMembersTableProps {
  rows: IBusinessMemberRow[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  currentUserId: string | null;
  currentRole: TBusinessRole | null;
  /** Owner-only: edit member info (name/phone) reusing the profile form. */
  canEdit: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (row: IBusinessMemberRow) => void;
  onResend: (userId: string) => void;
  onDelete: (userId: string) => void;
  onSetStatus: (userId: string, active: boolean) => void;
  resendLoading: boolean;
  removeLoading: boolean;
  setStatusLoading: boolean;
}

const fmtDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export function MembersTable({
  rows,
  total,
  loading,
  page,
  pageSize,
  currentUserId,
  currentRole,
  canEdit,
  onPageChange,
  onEdit,
  onResend,
  onDelete,
  onSetStatus,
  resendLoading,
  removeLoading,
  setStatusLoading,
}: IMembersTableProps) {
  const { t } = useTranslation('member');

  // Mirror backend rule: never act on owner/self; manager only on staff.
  const canManage = (row: IBusinessMemberRow) => {
    if (row.userId === currentUserId) return false;
    if (row.role === EBusinessRole.OWNER) return false;
    if (currentRole === EBusinessRole.OWNER) return true;
    if (currentRole === EBusinessRole.MANAGER) return row.role === EBusinessRole.STAFF;
    return false;
  };

  const renderStatusAction = (row: IBusinessMemberRow) => {
    if (row.status === EUserAccountStatus.PENDING) {
      return (
        <>
          <IconButton
            icon={<RedoOutlined />}
            tooltip={t('action_resend')}
            size="small"
            loading={resendLoading}
            onClick={() => onResend(row.userId)}
          />
          <Popconfirm
            title={t('delete_confirm_title')}
            description={t('delete_confirm_desc')}
            onConfirm={() => onDelete(row.userId)}
            okText={t('action_delete')}
            cancelText={t('common:cancel', 'Cancel')}
          >
            <IconButton icon={<DeleteOutlined />} tooltip={t('action_delete')} size="small" loading={removeLoading} />
          </Popconfirm>
        </>
      );
    }

    if (row.status === EUserAccountStatus.ACTIVE) {
      return (
        <Popconfirm
          title={t('deactivate_confirm_title')}
          description={t('deactivate_confirm_desc')}
          onConfirm={() => onSetStatus(row.userId, false)}
          okText={t('action_deactivate')}
          cancelText={t('common:cancel', 'Cancel')}
        >
          <IconButton icon={<StopOutlined />} tooltip={t('action_deactivate')} size="small" loading={setStatusLoading} />
        </Popconfirm>
      );
    }

    return (
      <IconButton
        icon={<CheckCircleOutlined />}
        tooltip={t('action_reactivate')}
        size="small"
        loading={setStatusLoading}
        onClick={() => onSetStatus(row.userId, true)}
      />
    );
  };

  const renderActions = (row: IBusinessMemberRow) => {
    if (!canManage(row)) return <span className="text-gray-400">—</span>;
    return (
      <div className="flex gap-1 justify-center">
        {canEdit && (
          <IconButton
            icon={<EditOutlined />}
            tooltip={t('action_edit')}
            size="small"
            onClick={() => onEdit(row)}
          />
        )}
        {renderStatusAction(row)}
      </div>
    );
  };

  const columns: TableColumnsType<IBusinessMemberRow> = [
    {
      title: t('col_name'),
      dataIndex: 'fullName',
      key: 'fullName',
      width: 180,
      ellipsis: { showTitle: false },
      render: (name: string) => (
        <Text ellipsis={{ tooltip: name }} className="font-semibold block">
          {name}
        </Text>
      ),
    },
    {
      title: t('col_email'),
      dataIndex: 'email',
      key: 'email',
      width: 220,
      ellipsis: { showTitle: false },
      render: (email: string) => <Text ellipsis={{ tooltip: email }} className="block">{email}</Text>,
    },
    {
      title: t('col_role'),
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: string) => (
        <Tag color={ROLE_TAG_COLOR[role as TBusinessRole]}>{t(`role_${role}`)}</Tag>
      ),
    },
    {
      title: t('col_status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={ACCOUNT_STATUS_TAG_COLOR[status as EUserAccountStatus]}>{t(`status_${status}`)}</Tag>
      ),
    },
    {
      title: t('col_last_login'),
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 130,
      render: fmtDate,
    },
    {
      title: t('col_joined'),
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 130,
      render: fmtDate,
    },
    {
      title: t('col_actions'),
      key: 'actions',
      width: 150,
      align: 'center',
      fixed: 'right' as const,
      render: (_, row) => renderActions(row),
    },
  ];

  return (
    <div data-tour="members-table">
      <Table<IBusinessMemberRow>
        dataSource={rows}
        columns={columns}
        rowKey="userId"
        loading={loading}
        scroll={{ x: 1000 }}
        className="[&_.ant-table-thead>tr>th]:bg-gray-100 [&_.ant-table-tbody>tr:hover>td]:bg-blue-50"
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (n) => t('showing_total', { total: n }),
          onChange: onPageChange,
        }}
      />
    </div>
  );
}
