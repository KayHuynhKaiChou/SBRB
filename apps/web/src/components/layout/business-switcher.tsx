import React from 'react';
import { Dropdown, Space, Typography } from 'antd';
import { ShopOutlined, PlusOutlined, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const { Text } = Typography;

export function BusinessSwitcher() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const businessName = (user as { businessName?: string } | null)?.businessName ?? 'Doanh nghiệp';

  const menuItems: MenuProps['items'] = [
    {
      key: 'create',
      icon: <PlusOutlined />,
      label: 'Tạo doanh nghiệp mới',
      onClick: () => navigate('/onboarding'),
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomLeft" trigger={['click']}>
      <Space style={{ cursor: 'pointer' }}>
        <ShopOutlined style={{ color: '#1677ff' }} />
        <Text style={{ maxWidth: 160 }} ellipsis>
          {businessName}
        </Text>
        <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
      </Space>
    </Dropdown>
  );
}
