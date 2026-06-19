import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the admin users page. `t` resolves the `guide` namespace. */
export function adminUsersTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('guide:tour_admin_users_s1_title'),
      description: t('guide:tour_admin_users_s1_desc'),
      target: target('[data-testid="tour-admin-users-filters"]'),
    },
    {
      title: t('guide:tour_admin_users_s2_title'),
      description: t('guide:tour_admin_users_s2_desc'),
      target: target('[data-testid="tour-admin-users-table"]'),
    },
  ];
}
