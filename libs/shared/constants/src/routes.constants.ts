/** REST API routes (BE prefix `/api/v1`) and FE app navigation routes. */

export const API_BASE = '/api/v1';

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    REFRESH: `${API_BASE}/auth/refresh`,
    REGISTER: `${API_BASE}/auth/register`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE}/auth/reset-password`,
    VERIFY_OTP: `${API_BASE}/auth/verify-otp`,
    RESEND_VERIFICATION: `${API_BASE}/auth/resend-verification`,
  },
  WIDGET: {
    POSITION: (id: string) => `${API_BASE}/widgets/${id}/position`,
    CHART_DATA: (id: string) => `${API_BASE}/widgets/${id}/chart-data`,
    CONFIG: (id: string) => `${API_BASE}/widgets/${id}/config`,
    DATA_LINK: (id: string) => `${API_BASE}/widgets/${id}/data-link`,
  },
  DATA_SHEET: {
    UPLOAD: (businessId: string) => `${API_BASE}/businesses/${businessId}/data-sheets/upload`,
    REIMPORT: (id: string) => `${API_BASE}/data-sheets/${id}/reimport`,
    EXPORT: (id: string) => `${API_BASE}/data-sheets/${id}/export`,
    PREVIEW: `${API_BASE}/data-sheets/preview`,
    DETAIL: (id: string) => `${API_BASE}/data-sheets/${id}`,
    SAMPLE_TEMPLATE: `${API_BASE}/data-sheets/sample-template`,
    EXPORT_TEMPLATE: `${API_BASE}/data-sheets/export-template`,
  },
} as const;

export const APP_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  ONBOARDING: '/onboarding',
  SELECT_BUSINESS: '/select-business',
  MY_BUSINESS: '/my-business',
  BUSINESS_PENDING: '/business-pending',
  DATA_SHEETS: '/data-sheets',
  DEPARTMENTS: '/departments',
  PROFILE: '/profile',
  GUIDE: '/guide',
  ADMIN: '/admin',
  ADMIN_BUSINESSES: '/admin/businesses',
  ADMIN_USERS: '/admin/users',
  ADMIN_AUDIT: '/admin/audit',
} as const;
