import { APP_ROUTES } from '@sbrb/shared-constants';
import type { IGuideArea } from '@sbrb/shared-types';

/**
 * Single source of truth for the User Guide content structure.
 * Text lives in i18n `guide.json` (keys derived: `area_<key>`, `feat_<key>_title|_desc`).
 * Status reconciled against CODE (not stale docs). See plans/.../feature-catalog.md.
 *
 * When a coming-soon feature ships: flip `status` to 'done' and add `route` + `tourId`.
 */
export const GUIDE_AREAS: IGuideArea[] = [
  {
    key: 'getting_started',
    features: [
      { key: 'signup', status: 'done' }, // no usage (auth page, per decision)
      { key: 'login', status: 'done' },
      { key: 'onboarding', status: 'done', route: APP_ROUTES.ONBOARDING, tourId: 'onboarding', audience: ['owner'] },
    ],
  },
  {
    key: 'dashboard',
    features: [
      { key: 'tabs', status: 'done', route: APP_ROUTES.DASHBOARD, tourId: 'dashboard', audience: ['owner', 'manager'] },
      { key: 'canvas', status: 'done', route: APP_ROUTES.DASHBOARD, tourId: 'dashboard', audience: ['all'] },
      { key: 'widgets', status: 'done', route: APP_ROUTES.DASHBOARD, tourId: 'dashboard', audience: ['owner', 'manager'] },
      { key: 'widget_settings', status: 'partial', route: APP_ROUTES.DASHBOARD, tourId: 'dashboard', audience: ['owner', 'manager'] },
    ],
  },
  {
    key: 'data',
    features: [
      { key: 'datasheet_import', status: 'done', route: APP_ROUTES.DATA_SHEETS, tourId: 'datasheets', audience: ['owner', 'manager'] },
      { key: 'datasheet_list', status: 'done', route: APP_ROUTES.DATA_SHEETS, tourId: 'datasheets', audience: ['all'] },
      { key: 'datasheet_editor', status: 'done', route: APP_ROUTES.DATA_SHEETS, tourId: 'datasheets', audience: ['owner', 'manager'] },
    ],
  },
  {
    key: 'team',
    features: [
      { key: 'org_chart', status: 'done', route: APP_ROUTES.DEPARTMENTS, tourId: 'departments', audience: ['all'] },
      { key: 'department_manage', status: 'done', route: APP_ROUTES.DEPARTMENTS, tourId: 'departments', audience: ['owner'] },
      { key: 'members', status: 'done', route: APP_ROUTES.DEPARTMENTS, tourId: 'departments', audience: ['owner', 'manager'] },
    ],
  },
  {
    key: 'account',
    features: [
      { key: 'profile', status: 'done', route: APP_ROUTES.PROFILE, tourId: 'profile', audience: ['all'] },
      { key: 'security', status: 'done', route: APP_ROUTES.PROFILE, tourId: 'profile', audience: ['all'] },
      { key: 'notifications', status: 'done', route: APP_ROUTES.PROFILE, tourId: 'profile', audience: ['all'] },
      { key: 'switch_business', status: 'done' }, // info card — switch + register businesses via the hub
    ],
  },
  {
    key: 'business',
    features: [
      { key: 'my_business', status: 'done', route: APP_ROUTES.MY_BUSINESS, tourId: 'my-business', audience: ['owner'] },
      { key: 'approval_lifecycle', status: 'done' }, // explainer (lifecycle visual), no tour
    ],
  },
  {
    key: 'admin',
    features: [
      { key: 'admin_dashboard', status: 'done', route: APP_ROUTES.ADMIN, tourId: 'admin-dashboard', audience: ['admin'] },
      { key: 'admin_businesses', status: 'done', route: APP_ROUTES.ADMIN_BUSINESSES, tourId: 'admin-businesses', audience: ['admin'] },
      { key: 'admin_users', status: 'done', route: APP_ROUTES.ADMIN_USERS, tourId: 'admin-users', audience: ['admin'] },
      { key: 'admin_audit', status: 'done', route: APP_ROUTES.ADMIN_AUDIT, tourId: 'admin-audit', audience: ['admin'] },
    ],
  },
  {
    key: 'coming_soon',
    features: [
      { key: 'benchmark', status: 'coming-soon' },
      { key: 'talk_room', status: 'coming-soon' },
      { key: 'data_box', status: 'coming-soon' },
      { key: 'settings', status: 'coming-soon' },
      { key: 'export_pdf', status: 'coming-soon' },
      { key: 'email_notifications', status: 'coming-soon' },
      { key: 'desktop_app', status: 'coming-soon' },
      { key: 'realtime_collab', status: 'coming-soon' },
    ],
  },
];

/** All tourIds referenced by the catalog — used by integrity test (no orphan tours). */
export const GUIDE_TOUR_IDS = Array.from(
  new Set(GUIDE_AREAS.flatMap((a) => a.features.map((f) => f.tourId).filter(Boolean))),
) as string[];
