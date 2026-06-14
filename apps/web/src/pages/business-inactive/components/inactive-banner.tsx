import React from 'react';
import { Typography } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface IInactiveBannerProps {
  businessName: string;
  inactiveReason?: string | null;
  inactivatedAt?: string | null;
}

/** Visual presenter for business-inactive state — name, reason, timestamp. */
export function InactiveBanner({ businessName, inactiveReason, inactivatedAt }: IInactiveBannerProps) {
  const { t } = useTranslation('admin');

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-red-50">
          <StopOutlined className="text-4xl text-red-500" />
        </div>
      </div>

      {/* Heading */}
      <Title level={3} className="!mb-1 !text-gray-900">
        {t('business_inactive_title')}
      </Title>

      {/* Business name */}
      <Text className="!text-lg !font-semibold !text-gray-700 block mb-4">
        {businessName}
      </Text>

      {/* Reason */}
      {inactiveReason && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4 text-left">
          <Text className="!text-sm !text-gray-500 block mb-1">{t('business_inactive_reason')}:</Text>
          <Paragraph className="!mb-0 !text-gray-700 !text-sm whitespace-pre-line">{inactiveReason}</Paragraph>
        </div>
      )}

      {/* Inactivated date */}
      {inactivatedAt && (
        <Text className="!text-sm !text-gray-400 block mb-2">
          {t('business_inactive_inactivated_at')}: {dayjs(inactivatedAt).format('DD/MM/YYYY HH:mm')}
        </Text>
      )}

      {/* Contact admin banner */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <Text className="!text-sm !text-blue-700">
          {t('business_inactive_contact_admin')}
        </Text>
      </div>
    </div>
  );
}
