import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the data-sheets list. `t` resolves the `guide` namespace. */
export function datasheetsTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('tour_datasheets_s1_title'),
      description: t('tour_datasheets_s1_desc'),
      target: target('[data-testid="tour-datasheets-toolbar"]'),
    },
    {
      title: t('tour_datasheets_s2_title'),
      description: t('tour_datasheets_s2_desc'),
      target: target('[data-testid="tour-datasheets-search"]'),
    },
    {
      title: t('tour_datasheets_s3_title'),
      description: t('tour_datasheets_s3_desc'),
      target: target('[data-testid="tour-datasheets-table"]'),
    },
  ];
}
