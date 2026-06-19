import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the create-business (onboarding) page. `t` resolves `guide`. */
export function onboardingTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('tour_onboarding_s1_title'),
      description: t('tour_onboarding_s1_desc'),
      target: target('[data-testid="tour-onboarding-form"]'),
    },
  ];
}
