import React from 'react';
import { Button, Typography, Alert } from 'antd';
import { RiTimeLine, RiCloseCircleLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EBusinessStatus, APP_ROUTES } from '@sbrb/shared-constants';
import { authSession } from '../../lib/auth-session';

interface IBusinessPendingPageProps {
  business: {
    id: string;
    name: string;
    status: string;
    rejectionReason?: string | null;
  };
}

/** Full-screen gate shown while a business is pending or rejected (owner can still edit). */
export function BusinessPendingPage({ business }: IBusinessPendingPageProps) {
  const { t } = useTranslation('business');
  const navigate = useNavigate();
  const rejected = business.status === EBusinessStatus.REJECTED;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-[#e8e8e8] p-8 text-center"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
            rejected ? 'bg-red-50' : 'bg-[#FFF1F3]'
          }`}
        >
          {rejected ? (
            <RiCloseCircleLine size={36} color="#EF4444" />
          ) : (
            <RiTimeLine size={36} color="#D72A44" />
          )}
        </div>

        <Typography.Title level={4} className="!mt-0 !mb-2">
          {rejected ? t('rejected_title') : t('pending_title')}
        </Typography.Title>
        <Typography.Text className="!text-gray-500 !text-sm !block !mb-2">
          <span className="font-semibold text-gray-700">{business.name}</span>
        </Typography.Text>
        <Typography.Text className="!text-gray-500 !text-sm !block !mb-5">
          {rejected ? t('rejected_desc') : t('pending_desc')}
        </Typography.Text>

        {rejected && business.rejectionReason && (
          <Alert
            type="error"
            showIcon
            className="!text-left !mb-5"
            message={t('rejected_reason_label')}
            description={business.rejectionReason}
          />
        )}

        <Button
          type="primary"
          block
          onClick={() => navigate(APP_ROUTES.MY_BUSINESS)}
          className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold !mb-2"
        >
          {t('pending_go_my_business')}
        </Button>
        <Button type="text" block onClick={() => void authSession.logout()} className="!text-gray-500">
          {t('pending_logout')}
        </Button>
      </div>
    </div>
  );
}
