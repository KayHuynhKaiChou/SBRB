/**
 * Canvas coordinate types — SRS 4.4.3
 * All values in pixels at 100% zoom baseline
 */

/** Widget bounding box */
export interface IWidgetPosition {
  x: number; // Pixel from canvas left
  y: number; // Pixel from canvas top
  w: number; // Width: 800–1600px (SRS 4.4.5)
  h: number; // Height: 400–800px (SRS 4.4.5)
}

/** Canvas dimensions */
export interface ICanvasSize {
  width: number;  // Default: 3200px
  height: number; // Default: 4800px
}

/** Zoom levels supported by canvas */
export type ZoomLevel = 50 | 75 | 100 | 125;

/** Snap grid config */
export interface ISnapConfig {
  enabled: boolean;
  gridSize: number; // Default: 20px
}

/** Collision check result */
export interface ICollisionResult {
  hasCollision: boolean;
  conflictingWidgetIds: string[];
}
