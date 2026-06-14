import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  EBusinessStatus,
  BUSINESS_STATUS_TAG_COLOR,
  type TBusinessStatus,
} from '@sbrb/shared-constants';

interface IBusinessStatusTagProps {
  status: string;
}

/** i18n key per unified status value. */
const STATUS_LABEL_KEY: Record<TBusinessStatus, string> = {
  [EBusinessStatus.PENDING]: 'status_pending',
  [EBusinessStatus.APPROVED]: 'status_approved',
  [EBusinessStatus.REJECTED]: 'status_rejected',
  [EBusinessStatus.INACTIVE]: 'status_inactive',
};

/** Unified status badge — pending=gold, approved=green, rejected=red, inactive=gray. */
export function BusinessStatusTag({ status }: IBusinessStatusTagProps) {
  const { t } = useTranslation('admin');
  const s = status as TBusinessStatus;
  return (
    <Tag color={BUSINESS_STATUS_TAG_COLOR[s] ?? 'default'}>
      {t(STATUS_LABEL_KEY[s] ?? 'status_pending')}
    </Tag>
  );
}
