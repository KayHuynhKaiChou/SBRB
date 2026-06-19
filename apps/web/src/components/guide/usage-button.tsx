import React from 'react';
import { Button } from 'antd';
import { CompassOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EPlatformRole } from '@sbrb/shared-constants';
import type { IGuideFeature, TGuideAudience } from '@sbrb/shared-types';
import { useAuthStore } from '../../store/auth.store';
import { useTourStore } from '../../store/tour.store';

const BUSINESS_AUDIENCES: TGuideAudience[] = ['owner', 'manager', 'staff'];

/** Whether the current user can launch this feature's tour (target page is reachable for them). */
function canUse(audience: TGuideAudience[] | undefined, isAdmin: boolean): boolean {
  if (!audience || audience.includes('all')) return true;
  if (audience.includes('admin')) return isAdmin;
  // business-only feature → admins are redirected away from business routes
  if (audience.some((a) => BUSINESS_AUDIENCES.includes(a))) return !isAdmin;
  return false;
}

/** "Usage" button on a guide card: navigates to the feature page and launches its antd Tour. */
export function UsageButton({ feature }: { feature: IGuideFeature }) {
  const { t } = useTranslation('guide');
  const navigate = useNavigate();
  const startTour = useTourStore((s) => s.startTour);
  const isAdmin = useAuthStore((s) => s.user?.platformRole) === EPlatformRole.ADMIN;

  if (feature.status === 'coming-soon' || !feature.route || !feature.tourId) return null;
  if (!canUse(feature.audience, isAdmin)) return null;

  const onClick = () => {
    startTour(feature.tourId as string);
    navigate(`${feature.route}?tour=${feature.tourId}`);
  };

  return (
    <Button type="primary" size="small" icon={<CompassOutlined />} onClick={onClick}>
      {t('usage_button')}
    </Button>
  );
}
