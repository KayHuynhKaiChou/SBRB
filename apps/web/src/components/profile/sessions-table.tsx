import { Table, Tag, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import { IconButton } from '@sbrb/ui';
import type {
  IDeleteSessionVars,
  IMySessionsQueryData,
  ISessionRow,
} from '@sbrb/shared-types';
import {
  MY_SESSIONS_QUERY,
  DELETE_SESSION_MUTATION,
} from '../../graphql/profile.operations';

export function SessionsTable() {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { data, loading } = useQuery<IMySessionsQueryData>(MY_SESSIONS_QUERY);
  const [deleteSession] = useAppMutation<boolean, IDeleteSessionVars>(DELETE_SESSION_MUTATION, {
    update: (cache, _, { variables }) => {
      const removedId = variables?.id;
      if (!removedId) return;
      cache.modify({
        fields: {
          mySessions: (existing: readonly { __ref?: string }[] = [], { readField }) =>
            existing.filter((ref) => readField('id', ref) !== removedId),
        },
      });
    },
  });

  const rows: ISessionRow[] = data?.mySessions ?? [];

  const columns = [
    {
      title: t('profile:sessions_col_device'),
      dataIndex: 'deviceName',
      render: (v: string | null, row: ISessionRow) => (
        <div className="flex items-center gap-2">
          <span>{v ?? t('profile:sessions_device_unknown')}</span>
          {row.isCurrent && <Tag color="blue">{t('profile:sessions_current')}</Tag>}
        </div>
      ),
    },
    {
      title: t('profile:sessions_col_ip'),
      dataIndex: 'ipAddress',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('profile:sessions_col_last_active'),
      dataIndex: 'lastActiveAt',
      render: (v: string) => new Date(v).toLocaleString(i18n.language),
    },
    {
      title: t('profile:sessions_col_action'),
      key: 'action',
      width: 80,
      align: 'right' as const,
      render: (_: unknown, row: ISessionRow) => (
        <Popconfirm
          title={t('common:confirm_delete_title')}
          description={t('common:confirm_delete_msg')}
          onConfirm={() => deleteSession({ variables: { id: row.id } })}
          disabled={row.isCurrent}
        >
          <IconButton
            icon={<DeleteOutlined />}
            tooltip={t('profile:sessions_revoke')}
            variant="danger"
            size="small"
            disabled={row.isCurrent}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table<ISessionRow>
      rowKey="id"
      loading={loading}
      dataSource={rows}
      columns={columns}
      pagination={false}
      size="small"
      locale={{ emptyText: t('profile:sessions_empty') }}
    />
  );
}
