/**
 * Validation limits — from SRS
 */

// Auth
export const PASSWORD_MIN_LENGTH = 8;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;
export const EMAIL_VERIFY_LINK_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_EXPIRY_HOURS = 1;

// Business / Tab / Widget names
export const WIDGET_NAME_MAX_LENGTH = 40;     // SRS 4.5
export const TAB_NAME_MAX_LENGTH = 30;        // SRS 4.3

// Import limits (SRS 4.8.2)
export const IMPORT_MAX_FILE_SIZE_MB = 10;
export const IMPORT_MAX_SERIES = 200;
export const IMPORT_MAX_PERIODS = 120;

// Notifications (SRS 4.9)
export const NOTIFICATION_MAX_DISPLAY = 20;

// Audit log retention (SRS 4.11)
export const AUDIT_LOG_RETENTION_DAYS = 90;
