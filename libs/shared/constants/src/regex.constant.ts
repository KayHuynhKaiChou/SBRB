/** Shared regex constants — use across FE & BE for consistent validation. */

/** Matches international + local phone numbers. Allows digits, spaces, +, -, (). Length 8–20. */
export const PHONE_REGEX = /^[+0-9 \-()]{8,20}$/;

/** Hex color #RRGGBB or #RGB */
export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
