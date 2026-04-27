/** Auth-related constants shared between BE and FE — keep BE/FE in sync. */

export const REFRESH_COOKIE_NAME = 'refresh_token';

/** Sentinel error message thrown by FE auth-session when refresh endpoint returns 401. */
export const REFRESH_REJECTED_CODE = 'REFRESH_REJECTED';
