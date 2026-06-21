import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the personnel (/members) page. `t` resolves the `guide` namespace. */
export function membersTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('guide:tour_members_s1_title'),
      description: t('guide:tour_members_s1_desc'),
      target: target('[data-tour="members-create"]'),
    },
    {
      title: t('guide:tour_members_s2_title'),
      description: t('guide:tour_members_s2_desc'),
      target: target('[data-tour="members-filters"]'),
    },
    {
      title: t('guide:tour_members_s3_title'),
      description: t('guide:tour_members_s3_desc'),
      target: target('[data-tour="members-table"]'),
    },
  ];
}
