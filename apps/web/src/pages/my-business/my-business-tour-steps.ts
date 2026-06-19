import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the My Business page. `t` resolves the `guide` namespace. */
export function myBusinessTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('tour_my_business_s1_title'),
      description: t('tour_my_business_s1_desc'),
      target: target('[data-testid="tour-my-business-status"]'),
    },
    {
      title: t('tour_my_business_s2_title'),
      description: t('tour_my_business_s2_desc'),
      target: target('[data-testid="tour-my-business-form"]'),
    },
  ];
}
