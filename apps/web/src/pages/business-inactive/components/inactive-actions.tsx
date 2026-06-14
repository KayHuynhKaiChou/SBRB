import React from 'react';
import { Button, Dropdown } from 'antd';
import { SwapOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EBusinessStatus, APP_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../../../store/auth.store';
import { useAuth } from '../../../hooks/use-auth';
import { MY_BUSINESSES_QUERY } from '../../../graphql/auth.operations';

interface IMyBusinessesData {
  myBusinesses: Array<{ id: string; name: string; status: string }>;
}

interface IInactiveActionsProps {
  currentBusinessId: string;
}

/**
 * Action buttons for BusinessInactivePage.
 * Shows "Switch business" dropdown (only when there's at least 1 active other business) + Logout.
 */
export function InactiveActions({ currentBusinessId }: IInactiveActionsProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation('admin');
  const setCurrentBusiness = useAuthStore((s) => s.setCurrentBusiness);

  const { data } = useQuery<IMyBusinessesData>(MY_BUSINESSES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const activeOthers = (data?.myBusinesses ?? []).filter(
    (b) => b.id !== currentBusinessId && b.status === EBusinessStatus.APPROVED,
  );

  const switchItems: MenuProps['items'] = activeOthers.map((b) => ({
    key: b.id,
    label: b.name,
    onClick: () => {
      setCurrentBusiness(b.id);
      navigate(APP_ROUTES.DASHBOARD);
    },
  }));

  const handleLogout = () => {
    void logout();
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      {activeOthers.length > 0 && (
        <Dropdown menu={{ items: switchItems }} placement="top" trigger={['click']}>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            size="large"
            className="!min-w-[200px]"
          >
            {t('business_inactive_switch')}
          </Button>
        </Dropdown>
      )}

      <Button
        type={activeOthers.length === 0 ? 'primary' : 'default'}
        icon={<LogoutOutlined />}
        size="large"
        className="!min-w-[200px]"
        onClick={handleLogout}
      >
        {t('business_inactive_logout')}
      </Button>
    </div>
  );
}
