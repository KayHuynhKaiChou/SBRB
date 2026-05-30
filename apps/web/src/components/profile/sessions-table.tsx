import { Table, Tag, Popconfirm, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
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

const { Text } = Typography;

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

  const columns: TableColumnsType<ISessionRow> = [
    {
      title: t('profile:sessions_col_device'),
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 220,
      ellipsis: { showTitle: false },
      render: (v: string | null, row: ISessionRow) => {
        const label = v ?? t('profile:sessions_device_unknown');
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Text ellipsis={{ tooltip: label }} className="flex-1 min-w-0">
              {label}
            </Text>
            {row.isCurrent && (
              <Tag color="blue" className="shrink-0">
                {t('profile:sessions_current')}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: t('profile:sessions_col_ip'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      ellipsis: { showTitle: false },
      render: (v: string | null) => (
        <Text ellipsis={{ tooltip: v ?? undefined }} className="block">
          {v ?? '—'}
        </Text>
      ),
    },
    {
      title: t('profile:sessions_col_last_active'),
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString(i18n.language),
    },
    {
      title: t('profile:sessions_col_action'),
      key: 'action',
      width: 80,
      align: 'right' as const,
      fixed: 'right' as const,
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
      pagination={{ pageSize: 5, size: 'small' }}
      size="small"
      scroll={{ x: 600 }}
      locale={{ emptyText: t('profile:sessions_empty') }}
    />
  );
}
