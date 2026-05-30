import React from 'react';
import { Drawer, Descriptions, Spin, Tag, Avatar, Typography, Space, Popconfirm } from 'antd';
import { useQuery } from '@apollo/client';
import { UserOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EPlatformRole, ROLE_TAG_COLOR } from '@sbrb/shared-constants';
import { IconButton } from '@sbrb/ui';
import { ADMIN_USER_DETAIL_QUERY } from '../../../graphql/admin.operations';

const { Text } = Typography;

interface IUserDetailDrawerProps {
  userId: string | null;
  currentAdminId: string | null;
  open: boolean;
  onClose: () => void;
  onDisable: (id: string) => void;
  onEnable: (id: string) => void;
  disableLoading: boolean;
  enableLoading: boolean;
}

interface IAdminUserDetailQueryResult {
  adminUserDetail: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
    language: string;
    bio?: string | null;
    emailVerified: boolean;
    isDisabled: boolean;
    platformRole?: string | null;
    createdAt: string;
    lastLoginAt?: string | null;
    memberships: Array<{
      businessId: string;
      businessName: string;
      role: string;
      joinedAt: string;
    }>;
  };
}

function formatDate(val?: string | null): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Read-only user profile drawer. Opens when admin clicks a user row. SRS §5.15 */
export function UserDetailDrawer({
  userId,
  currentAdminId,
  open,
  onClose,
  onDisable,
  onEnable,
  disableLoading,
  enableLoading,
}: IUserDetailDrawerProps) {
  const { t } = useTranslation('admin');
  const { data, loading } = useQuery<IAdminUserDetailQueryResult>(ADMIN_USER_DETAIL_QUERY, {
    variables: { id: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const user = data?.adminUserDetail;
  const isSelf = !!userId && userId === currentAdminId;

  const drawerExtra = user && (
    <Space>
      {user.isDisabled ? (
        <Popconfirm
          title={t('enable_confirm_title')}
          description={t('enable_confirm_desc')}
          onConfirm={() => onEnable(user.id)}
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
      ) : (
        <Popconfirm
          title={t('disable_confirm_title')}
          description={t('disable_confirm_desc')}
          onConfirm={() => onDisable(user.id)}
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
      )}
    </Space>
  );

  return (
    <Drawer
      title={t('user_drawer_title')}
      width={480}
      placement="right"
      open={open}
      onClose={onClose}
      extra={drawerExtra}
    >
      {loading && (
        <div className="flex items-center justify-center h-32">
          <Spin size="large" />
        </div>
      )}

      {!loading && user && (
        <>
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              size={56}
              src={user.avatarUrl}
              icon={!user.avatarUrl ? <UserOutlined /> : undefined}
              style={{ background: 'var(--sbrb-accent-coral)', flexShrink: 0 }}
            />
            <div>
              <Text strong className="text-base block">
                {user.fullName}
              </Text>
              <Text type="secondary" className="text-sm block">
                {user.email}
              </Text>
              <div className="flex gap-2 mt-1">
                {user.isDisabled && <Tag color="red">{t('user_status_disabled')}</Tag>}
                {user.platformRole === EPlatformRole.ADMIN && (
                  <Tag color="volcano">{t('platform_role_admin')}</Tag>
                )}
              </div>
            </div>
          </div>

          {/* Personal info */}
          <Descriptions
            title={t('user_drawer_section_personal')}
            bordered
            size="small"
            column={1}
            className="mb-6"
          >
            <Descriptions.Item label={t('user_drawer_field_phone')}>{user.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('user_drawer_field_language')}>{user.language}</Descriptions.Item>
            <Descriptions.Item label={t('user_drawer_field_bio')}>{user.bio || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('user_drawer_field_email_verified')}>
              {user.emailVerified ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label={t('user_drawer_field_joined')}>{formatDate(user.createdAt)}</Descriptions.Item>
            <Descriptions.Item label={t('user_drawer_field_last_login')}>{formatDate(user.lastLoginAt)}</Descriptions.Item>
          </Descriptions>

          {/* Memberships */}
          <Descriptions title={t('user_drawer_section_memberships')} bordered size="small" column={1}>
            {user.memberships.length === 0 ? (
              <Descriptions.Item label="">
                <Text type="secondary">{t('user_drawer_no_memberships')}</Text>
              </Descriptions.Item>
            ) : (
              user.memberships.map((m) => (
                <Descriptions.Item key={m.businessId} label={m.businessName}>
                  <Space>
                    <Tag color={ROLE_TAG_COLOR[m.role as keyof typeof ROLE_TAG_COLOR] ?? 'default'}>
                      {m.role}
                    </Tag>
                    <Text type="secondary" className="text-xs">
                      {formatDate(m.joinedAt)}
                    </Text>
                  </Space>
                </Descriptions.Item>
              ))
            )}
          </Descriptions>
        </>
      )}
    </Drawer>
  );
}
