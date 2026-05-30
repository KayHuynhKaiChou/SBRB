import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { EBusinessStatus, BUSINESS_STATUS_TAG_COLOR } from '@sbrb/shared-constants';

interface IBusinessStatusTagProps {
  status: string;
}

/** Status badge for business rows in the admin table. */
export function BusinessStatusTag({ status }: IBusinessStatusTagProps) {
  const { t } = useTranslation('admin');
  const color = BUSINESS_STATUS_TAG_COLOR[status as EBusinessStatus] ?? 'default';
  const label = status === EBusinessStatus.INACTIVE ? t('status_inactive') : t('status_active');
  return <Tag color={color}>{label}</Tag>;
}
