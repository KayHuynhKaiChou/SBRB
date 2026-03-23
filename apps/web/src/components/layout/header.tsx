import React from 'react';
import { Layout, Badge, Dropdown, Avatar, Space, Typography } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '../../store/auth.store';
import { BusinessSwitcher } from './business-switcher';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export function Header() {
  const { user, clearAuth } = useAuthStore();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => clearAuth(),
    },
  ];

  return (
    <AntHeader
      style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}
    >
      {/* Left: logo + business switcher */}
      <Space size={16}>
        <Text strong style={{ fontSize: 18, color: '#1677ff', letterSpacing: 1 }}>
          SBRB
        </Text>
        <BusinessSwitcher />
      </Space>

      {/* Right: notifications + user */}
      <Space size={16}>
        <Badge count={0} showZero={false}>
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} />
        </Badge>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              size={32}
              src={user?.avatarUrl}
              icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
            />
            <Text style={{ maxWidth: 120 }} ellipsis>
              {user?.name ?? user?.email}
            </Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
