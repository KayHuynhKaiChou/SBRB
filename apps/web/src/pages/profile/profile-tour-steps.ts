import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the profile page (+ notification bell). `t` resolves `guide`. */
export function profileTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('tour_profile_s1_title'),
      description: t('tour_profile_s1_desc'),
      target: target('[data-testid="tour-profile-personal"]'),
    },
    {
      title: t('tour_profile_s2_title'),
      description: t('tour_profile_s2_desc'),
      target: target('[data-testid="tour-profile-security"]'),
    },
    {
      title: t('tour_profile_s3_title'),
      description: t('tour_profile_s3_desc'),
      target: target('[data-testid="tour-notification-bell"]'),
    },
  ];
}
