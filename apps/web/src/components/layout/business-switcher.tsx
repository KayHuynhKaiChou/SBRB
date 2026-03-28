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
        className="inline-flex items-center gap-1 cursor-pointer px-2 py-[3px] rounded-[6px] max-w-[180px] transition-[background] duration-150"
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span className="text-[13px] font-medium text-[#333] overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]">
          {businessName}
        </span>
        <DownOutlined className="!text-[9px] !text-[#aaa] shrink-0" />
      </div>
    </Dropdown>
  );
}
