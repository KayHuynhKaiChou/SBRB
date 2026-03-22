/**
 * Canvas constants — SRS 4.4
 */

/** Default canvas dimensions */
export const CANVAS_DEFAULT_WIDTH = 3200;   // px
export const CANVAS_DEFAULT_HEIGHT = 4800;  // px

/** Snap grid size — SRS 4.4.1 */
export const SNAP_GRID = 20; // px

/** Default widget position when created — SRS 4.4.1 */
export const WIDGET_DEFAULT_X = 20;
export const WIDGET_DEFAULT_Y = 20;

/** Canvas zoom levels — SRS 4.4.1 */
export const ZOOM_LEVELS = [50, 75, 100, 125] as const;
export const DEFAULT_ZOOM = 100;

/** Position debounce delay (ms) — SRS 4.1.5 data flow */
export const POSITION_UPDATE_DEBOUNCE_MS = 300;
