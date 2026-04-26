import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { detectCollision } from '@sbrb/shared-utils';
import { useCanvasStore } from '../store/canvas.store';
import { apiClient } from '../services/api-client';
import { useNotify } from '@sbrb/shared-apollo-client';
import { WIDGETS_QUERY } from '../graphql/canvas.operations';
import type { IWidgetPosition } from '@sbrb/shared-types';

interface IDebouncedPosition extends IWidgetPosition {
  widgetId: string;
}

export function useCanvas(tabId: string) {
  const { widgets, setWidgets, updateWidgetPosition, snapEnabled } = useCanvasStore();
  const lastValidPositions = useRef<Map<string, IWidgetPosition>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const notify = useNotify();

  const { data } = useQuery(WIDGETS_QUERY, {
    variables: { tabId },
    skip: !tabId,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (data?.widgets) {
      // Map flat GraphQL fields to nested IWidgetDto structure
      const mapped = data.widgets.map((w: Record<string, unknown>) => {
        // Merge raw config JSONB into typed chartConfig (raw has all fields including new ones)
        const rawConfig = (w.config as Record<string, unknown>) ?? {};
        const typedConfig = (w.chartConfig as Record<string, unknown>) ?? {};
        return {
          ...w,
          chartConfig: { ...typedConfig, ...rawConfig },
          dataLink: w.dataSheetId
            ? {
                datasheetId: w.dataSheetId as string,
                selectedSeriesIds: (w.selectedSeries as string[]) ?? [],
                selectedPeriods: (w.selectedPeriods as string[] | null) ?? null,
              }
            : null,
        };
      });
      setWidgets(mapped);
      mapped.forEach((w: { id: string; position: IWidgetPosition }) => {
        lastValidPositions.current.set(w.id, w.position);
      });
    }
  }, [data, setWidgets]);

  const patchPosition = useCallback(
    async (payload: IDebouncedPosition) => {
      const { widgetId, ...pos } = payload;
      try {
        const { conflict } = await apiClient.patch(`/api/v1/widgets/${widgetId}/position`, pos);
        if (conflict) {
          // Server-side collision — revert to last valid
          const last = lastValidPositions.current.get(widgetId);
          if (last) {
            updateWidgetPosition(widgetId, last);
          }
          notify.error({
            vi: 'Vị trí đã có widget khác (server)',
            en: 'Another widget occupies this position (server)',
          });
        } else {
          lastValidPositions.current.set(widgetId, pos);
        }
      } catch {
        notify.error({
          vi: 'Không thể lưu vị trí widget',
          en: 'Failed to save widget position',
        });
      }
    },
    [updateWidgetPosition, notify],
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
        notify.error({ vi: 'Vị trí đã có widget khác', en: 'Another widget occupies this position' });
        return;
      }

      lastValidPositions.current.set(widgetId, newPos);
      updateWidgetPosition(widgetId, newPos);
      debouncedPatch(widgetId, newPos);
    },
    [widgets, updateWidgetPosition, debouncedPatch, notify],
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
        notify.error({ vi: 'Vị trí đã có widget khác', en: 'Another widget occupies this position' });
        return;
      }

      lastValidPositions.current.set(widgetId, newPos);
      updateWidgetPosition(widgetId, newPos);
      debouncedPatch(widgetId, newPos);
    },
    [widgets, updateWidgetPosition, debouncedPatch, notify],
  );

  return { widgets, snapEnabled, handleDragStop, handleResizeStop };
}
