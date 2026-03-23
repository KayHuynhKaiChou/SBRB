import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { message } from 'antd';
import { detectCollision } from '@sbrb/shared-utils';
import { useCanvasStore } from '../store/canvas.store';
import { useAuthStore } from '../store/auth.store';
import { WIDGETS_QUERY, UPDATE_WIDGET_MUTATION } from '../graphql/canvas.operations';
import type { IWidgetPosition } from '@sbrb/shared-types';

interface IDebouncedPosition extends IWidgetPosition {
  widgetId: string;
}

export function useCanvas(tabId: string) {
  const { widgets, setWidgets, updateWidgetPosition, snapEnabled } = useCanvasStore();
  const lastValidPositions = useRef<Map<string, IWidgetPosition>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data } = useQuery(WIDGETS_QUERY, {
    variables: { tabId },
    skip: !tabId,
    fetchPolicy: 'cache-and-network',
  });

  const [updateWidgetMutation] = useMutation(UPDATE_WIDGET_MUTATION);

  useEffect(() => {
    if (data?.widgets) {
      setWidgets(data.widgets);
      data.widgets.forEach((w: { id: string; position: IWidgetPosition }) => {
        lastValidPositions.current.set(w.id, w.position);
      });
    }
  }, [data, setWidgets]);

  const patchPosition = useCallback(
    async (payload: IDebouncedPosition) => {
      const { widgetId, ...pos } = payload;
      const accessToken = useAuthStore.getState().accessToken;
      try {
        const res = await fetch(`/api/v1/widgets/${widgetId}/position`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(pos),
        });
        if (res.status === 409) {
          // Server-side collision — revert to last valid
          const last = lastValidPositions.current.get(widgetId);
          if (last) {
            updateWidgetPosition(widgetId, last);
          }
          message.error('Vị trí đã có widget khác (server)');
        } else if (res.ok) {
          lastValidPositions.current.set(widgetId, pos);
        }
      } catch {
        message.error('Không thể lưu vị trí widget');
      }
    },
    [updateWidgetPosition],
  );

  const debouncedPatch = useCallback(
    (widgetId: string, pos: IWidgetPosition) => {
      const existing = debounceTimers.current.get(widgetId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        patchPosition({ widgetId, ...pos });
        debounceTimers.current.delete(widgetId);
      }, 300);
      debounceTimers.current.set(widgetId, timer);
    },
    [patchPosition],
  );

  const handleDragStop = useCallback(
    (widgetId: string, x: number, y: number) => {
      const widget = widgets.find((w) => w.id === widgetId);
      if (!widget) return;

      const newPos: IWidgetPosition = { x, y, w: widget.position.w, h: widget.position.h };
      const siblings = widgets
        .filter((w) => w.id !== widgetId)
        .map((w) => ({ id: w.id, position: w.position }));

      const conflicts = detectCollision(newPos, siblings);
      if (conflicts.length > 0) {
        const last = lastValidPositions.current.get(widgetId) || widget.position;
        updateWidgetPosition(widgetId, last);
        message.error('Vị trí đã có widget khác');
        return;
      }

      lastValidPositions.current.set(widgetId, newPos);
      updateWidgetPosition(widgetId, newPos);
      debouncedPatch(widgetId, newPos);
    },
    [widgets, updateWidgetPosition, debouncedPatch],
  );

  const handleResizeStop = useCallback(
    (
      widgetId: string,
      pos: { x: number; y: number },
      size: { w: number; h: number },
    ) => {
      const widget = widgets.find((w) => w.id === widgetId);
      if (!widget) return;

      const newPos: IWidgetPosition = { x: pos.x, y: pos.y, w: size.w, h: size.h };
      const siblings = widgets
        .filter((w) => w.id !== widgetId)
        .map((w) => ({ id: w.id, position: w.position }));

      const conflicts = detectCollision(newPos, siblings);
      if (conflicts.length > 0) {
        const last = lastValidPositions.current.get(widgetId) || widget.position;
        updateWidgetPosition(widgetId, last);
        message.error('Vị trí đã có widget khác');
        return;
      }

      lastValidPositions.current.set(widgetId, newPos);
      updateWidgetPosition(widgetId, newPos);
      debouncedPatch(widgetId, newPos);
    },
    [widgets, updateWidgetPosition, debouncedPatch],
  );

  return { widgets, snapEnabled, handleDragStop, handleResizeStop };
}
