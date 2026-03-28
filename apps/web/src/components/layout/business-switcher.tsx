import React from 'react';
import { Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

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
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          padding: '3px 8px',
          borderRadius: 6,
          maxWidth: 180,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#333',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 140,
          }}
        >
          {businessName}
        </span>
        <DownOutlined style={{ fontSize: 9, color: '#aaa', flexShrink: 0 }} />
      </div>
    </Dropdown>
  );
}
