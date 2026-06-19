import React from 'react';
import { Steps, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';

const { Paragraph } = Typography;

const STAGES = [
  { key: 'pending', icon: <ClockCircleOutlined /> },
  { key: 'approved', icon: <CheckCircleOutlined /> },
  { key: 'rejected', icon: <CloseCircleOutlined /> },
  { key: 'resubmitted', icon: <ReloadOutlined /> },
  { key: 'inactive', icon: <StopOutlined /> },
];

/** Visualizes the business approval state machine for the guide. */
export function BusinessLifecycle() {
  const { t } = useTranslation('guide');

  return (
    <div>
      <Steps
        direction="horizontal"
        responsive
        current={-1}
        items={STAGES.map((s) => ({
          title: t(`lifecycle_${s.key}_title`),
          description: t(`lifecycle_${s.key}_desc`),
          icon: s.icon,
          status: 'process',
        }))}
      />
      <Paragraph type="secondary" className="!mt-3 !mb-0 !text-[13px]">
        {t('lifecycle_note')}
      </Paragraph>
    </div>
  );
}
