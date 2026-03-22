import type { IIWidgetPosition } from '@sbrb/shared-types';
import {
  CANVAS_DEFAULT_WIDTH,
  CANVAS_DEFAULT_HEIGHT,
  MIN_WIDGET_WIDTH,
  MAX_WIDGET_WIDTH,
  MIN_WIDGET_HEIGHT,
  MAX_WIDGET_HEIGHT,
} from '@sbrb/shared-constants';
import { detectCollision } from './collision.util';
import { snapPosition } from './snap.util';

/**
 * Validate widget position is within canvas bounds and size constraints
 * SRS 4.4.5, 5.2
 */
export function validatePosition(
  position: IWidgetPosition,
  canvasWidth: number = CANVAS_DEFAULT_WIDTH,
  canvasHeight: number = CANVAS_DEFAULT_HEIGHT,
): string[] {
  const errors: string[] = [];
  if (position.x < 0) errors.push('x must be >= 0');
  if (position.y < 0) errors.push('y must be >= 0');
  if (position.w < MIN_WIDGET_WIDTH) errors.push(`w must be >= ${MIN_WIDGET_WIDTH}`);
  if (position.w > MAX_WIDGET_WIDTH) errors.push(`w must be <= ${MAX_WIDGET_WIDTH}`);
  if (position.h < MIN_WIDGET_HEIGHT) errors.push(`h must be >= ${MIN_WIDGET_HEIGHT}`);
  if (position.h > MAX_WIDGET_HEIGHT) errors.push(`h must be <= ${MAX_WIDGET_HEIGHT}`);
  if (position.x + position.w > canvasWidth) errors.push('widget exceeds canvas right boundary');
  if (position.y + position.h > canvasHeight) errors.push('widget exceeds canvas bottom boundary');
  return errors;
}

/**
 * Find first empty slot for new widget (avoid collision from creation)
 * SRS 4.5: Widget created at first empty position
 */
export function findFirstEmptyPosition(
  existingWidgets: Array<{ id: string; position: IWidgetPosition }>,
  widgetSize: { w: number; h: number },
  canvasWidth: number = CANVAS_DEFAULT_WIDTH,
  gridSize: number = 20,
): IWidgetPosition {
  let x = 20;
  let y = 20;

  // Scan rows, then columns
  for (let row = 0; row < 50; row++) {
    for (let col = 0; col < 10; col++) {
      const candidate: IWidgetPosition = {
        x: snapPosition({ x, y: 20 + row * gridSize, w: widgetSize.w, h: widgetSize.h }, gridSize).x,
        y: snapPosition({ x: 20, y, w: widgetSize.w, h: widgetSize.h }, gridSize).y,
        w: widgetSize.w,
        h: widgetSize.h,
      };
      const conflicts = detectCollision(candidate, existingWidgets);
      if (conflicts.length === 0) return candidate;
      x += widgetSize.w + gridSize;
    }
    x = 20;
    y += widgetSize.h + gridSize;
  }

  // Fallback: stack vertically
  return { x: 20, y: 20 + existingWidgets.length * (widgetSize.h + 20), ...widgetSize };
}
