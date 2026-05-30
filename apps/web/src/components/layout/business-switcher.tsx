import React from 'react';
import { Dropdown, Tag } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { EBusinessStatus, APP_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { MY_BUSINESSES_QUERY } from '../../graphql/auth.operations';

interface IMyBusinessesData {
  myBusinesses: Array<{ id: string; name: string; status: string }>;
}

/**
 * Header dropdown for switching between businesses.
 * Renders real myBusinesses list with "Đang đóng" badge for inactive entries.
 * Switching to an inactive business is allowed — BusinessGuard handles the gate.
 */
export function BusinessSwitcher() {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const currentBusinessId = useAuthStore((s) => s.currentBusinessId);
  const setCurrentBusiness = useAuthStore((s) => s.setCurrentBusiness);

  const { data } = useQuery<IMyBusinessesData>(MY_BUSINESSES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const businesses = data?.myBusinesses ?? [];
  const current = businesses.find((b) => b.id === currentBusinessId);
  const displayName = current?.name ?? t('nav_businesses');

  const bizItems: MenuProps['items'] = businesses.map((biz) => ({
    key: biz.id,
    label: (
      <span className="flex items-center gap-2">
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[160px]"
          title={biz.name}
        >
          {biz.name}
        </span>
        {biz.status === EBusinessStatus.INACTIVE && (
          <Tag color="red" className="!m-0 !text-[11px] !leading-[18px] !px-1.5">
            {t('switcher_inactive_badge')}
          </Tag>
        )}
      </span>
    ),
    onClick: () => {
      setCurrentBusiness(biz.id);
      navigate(APP_ROUTES.DASHBOARD);
    },
  }));

  const menuItems: MenuProps['items'] = [
    ...bizItems,
    { type: 'divider' },
    {
      key: 'create',
      icon: <PlusOutlined />,
      label: 'Tạo doanh nghiệp mới',
      onClick: () => navigate(APP_ROUTES.ONBOARDING),
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
          {displayName}
        </span>
        <DownOutlined className="!text-[9px] !text-[#aaa] shrink-0" />
      </div>
    </Dropdown>
  );
}
