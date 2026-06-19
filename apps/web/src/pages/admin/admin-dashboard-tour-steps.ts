import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (id: string) => () => document.querySelector(`[data-testid="${id}"]`) as HTMLElement;

/** antd Tour steps for the admin dashboard. `t` must resolve the `guide` namespace. */
export function adminDashboardTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('guide:tour_admin_dashboard_s1_title'),
      description: t('guide:tour_admin_dashboard_s1_desc'),
      target: target('tour-admin-dashboard-stats'),
    },
    {
      title: t('guide:tour_admin_dashboard_s2_title'),
      description: t('guide:tour_admin_dashboard_s2_desc'),
      target: target('tour-admin-dashboard-charts'),
    },
  ];
}
