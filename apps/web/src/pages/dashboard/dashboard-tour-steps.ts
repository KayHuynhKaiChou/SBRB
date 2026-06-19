import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the dashboard/canvas. `t` must resolve the `guide` namespace. */
export function dashboardTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('guide:tour_dashboard_s1_title'),
      description: t('guide:tour_dashboard_s1_desc'),
      target: target('[data-testid="tour-dashboard-tabs"]'),
    },
    {
      title: t('guide:tour_dashboard_s2_title'),
      description: t('guide:tour_dashboard_s2_desc'),
      target: target('[data-testid="tour-dashboard-controls"]'),
    },
    {
      title: t('guide:tour_dashboard_s3_title'),
      description: t('guide:tour_dashboard_s3_desc'),
      target: target('[data-canvas-scroll]'),
    },
  ];
}
