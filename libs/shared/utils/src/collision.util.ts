import type { WidgetPosition } from '@sbrb/shared-types';

/**
 * Check if two bounding boxes overlap (collision detection)
 * Used by: Zustand store (client-side realtime) + NestJS guard (server-side validation)
 * SRS 4.4.4
 */
export function doBoxesOverlap(a: WidgetPosition, b: WidgetPosition): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Check if a new position collides with any existing widget positions
 * @returns IDs of conflicting widgets (empty = no collision)
 */
export function detectCollision(
  newPosition: WidgetPosition,
  otherWidgets: Array<{ id: string; position: WidgetPosition }>,
  excludeWidgetId?: string,
): string[] {
  return otherWidgets
    .filter((w) => w.id !== excludeWidgetId)
    .filter((w) => doBoxesOverlap(newPosition, w.position))
    .map((w) => w.id);
}
