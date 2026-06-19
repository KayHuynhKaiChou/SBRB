import React from 'react';
import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const ROLES = ['admin', 'owner', 'manager', 'staff'] as const;
type TRole = (typeof ROLES)[number];

const ROLE_COLOR: Record<TRole, string> = {
  admin: 'red',
  owner: 'volcano',
  manager: 'blue',
  staff: 'default',
};

/** action key → which roles are allowed (✓). */
const MATRIX: Array<{ key: string; allow: TRole[] }> = [
  { key: 'access_admin', allow: ['admin'] },
  { key: 'approve_business', allow: ['admin'] },
  { key: 'disable_user', allow: ['admin'] },
  { key: 'create_business', allow: ['owner'] },
  { key: 'edit_business', allow: ['owner'] },
  { key: 'invite_members', allow: ['owner', 'manager'] },
  { key: 'manage_roles', allow: ['owner'] },
  { key: 'manage_departments', allow: ['owner'] },
  { key: 'import_data', allow: ['owner', 'manager'] },
  { key: 'edit_widgets', allow: ['owner', 'manager'] },
  { key: 'view_dashboards', allow: ['owner', 'manager', 'staff'] },
  { key: 'profile_notifications', allow: ['admin', 'owner', 'manager', 'staff'] },
];

/** Permissions matrix: who can do what across platform + business roles. */
export function RolesMatrix() {
  const { t } = useTranslation('guide');

  const columns: ColumnsType<(typeof MATRIX)[number]> = [
    {
      title: t('roles_col_action'),
      dataIndex: 'key',
      key: 'action',
      fixed: 'left',
      width: 220,
      render: (key: string) => <Text className="!text-[13px]">{t(`role_action_${key}`)}</Text>,
    },
    ...ROLES.map((role) => ({
      title: <Tag color={ROLE_COLOR[role]} className="!mr-0">{t(`role_${role}`)}</Tag>,
      key: role,
      align: 'center' as const,
      width: 90,
      render: (_: unknown, row: (typeof MATRIX)[number]) =>
        row.allow.includes(role) ? <span className="text-green-600">✓</span> : <span className="text-gray-300">–</span>,
    })),
  ];

  return (
    <Table
      size="small"
      rowKey="key"
      columns={columns}
      dataSource={MATRIX}
      pagination={false}
      scroll={{ x: 660 }}
    />
  );
}
