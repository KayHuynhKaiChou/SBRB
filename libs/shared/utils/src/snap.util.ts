import { SNAP_GRID } from '@sbrb/shared-constants';

/**
 * Snap a value to the nearest grid point
 * Formula from SRS 4.4.3: snap(v, g) = Math.round(v / g) * g
 * Used by: web canvas, desktop renderer, server validation
 */
export function snap(value: number, gridSize: number = SNAP_GRID): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap all widget position coordinates to grid
 */
export function snapPosition(
  position: { x: number; y: number; w: number; h: number },
  gridSize: number = SNAP_GRID,
) {
  return {
    x: snap(position.x, gridSize),
    y: snap(position.y, gridSize),
    w: snap(position.w, gridSize),
    h: snap(position.h, gridSize),
  };
}
