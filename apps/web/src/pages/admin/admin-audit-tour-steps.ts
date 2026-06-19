import type { TourProps } from 'antd';
import type { TFunction } from 'i18next';

const target = (sel: string) => () => document.querySelector(sel) as HTMLElement;

/** antd Tour steps for the admin audit log page. `t` resolves the `guide` namespace. */
export function adminAuditTourSteps(t: TFunction): TourProps['steps'] {
  return [
    {
      title: t('guide:tour_admin_audit_s1_title'),
      description: t('guide:tour_admin_audit_s1_desc'),
      target: target('[data-testid="tour-admin-audit-filters"]'),
    },
    {
      title: t('guide:tour_admin_audit_s2_title'),
      description: t('guide:tour_admin_audit_s2_desc'),
      target: target('[data-testid="tour-admin-audit-table"]'),
    },
  ];
}
