import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the departments / org chart page. `t` resolves `guide`. */
export function departmentsTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('tour_departments_s1_title'),
      description: t('tour_departments_s1_desc'),
      target: target('[data-testid="tour-departments-header"]'),
    },
    {
      title: t('tour_departments_s2_title'),
      description: t('tour_departments_s2_desc'),
      target: target('[data-testid="tour-departments-chart"]'),
    },
  ];
}
