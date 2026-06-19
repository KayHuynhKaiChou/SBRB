import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the admin businesses page. `t` resolves the `guide` namespace. */
export function adminBusinessesTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('guide:tour_admin_businesses_s1_title'),
      description: t('guide:tour_admin_businesses_s1_desc'),
      target: target('[data-testid="tour-admin-businesses-header"]'),
    },
    {
      title: t('guide:tour_admin_businesses_s2_title'),
      description: t('guide:tour_admin_businesses_s2_desc'),
      target: target('[data-testid="tour-admin-businesses-filters"]'),
    },
    {
      title: t('guide:tour_admin_businesses_s3_title'),
      description: t('guide:tour_admin_businesses_s3_desc'),
      target: target('[data-testid="tour-admin-businesses-table"]'),
    },
  ];
}
