/**
 * Widget size constraints — SRS 4.4.5
 */

export const MIN_WIDGET_WIDTH = 800;   // px
export const MAX_WIDGET_WIDTH = 1600;  // px
export const MIN_WIDGET_HEIGHT = 400;  // px
export const MAX_WIDGET_HEIGHT = 800;  // px

/** Preset widget sizes (quick-select) */
export const WIDGET_SIZE_PRESETS = [
  { label: 'S',  w: 800,  h: 400 },
  { label: 'M',  w: 1000, h: 500 },
  { label: 'L',  w: 1200, h: 600 },
  { label: 'XL', w: 1600, h: 800 },
] as const;

/** Max widgets per tab — SRS 4.5 */
export const MAX_WIDGETS_PER_TAB = 50;

/** Max tabs per business — SRS 4.3 */
export const MAX_TABS_PER_BUSINESS = 20;

/** Max alerts per widget — SRS 4.10 */
export const MAX_ALERTS_PER_WIDGET = 3;

/** Alert cooldown (ms) — SRS 4.10 */
export const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
