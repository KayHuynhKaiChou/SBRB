import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import debounce from 'lodash/debounce';
import { detectCollision } from '@sbrb/shared-utils';
import { API_ROUTES } from '@sbrb/shared-constants';
import { useCanvasStore } from '../store/canvas.store';
import { apiClient } from '../lib/api-client';
import { useNotify } from '@sbrb/shared-apollo-client';
import { WIDGETS_QUERY } from '../graphql/canvas.operations';
import type { IWidgetPosition } from '@sbrb/shared-types';

interface IDebouncedPosition extends IWidgetPosition {
  widgetId: string;
}

type DebouncedFn = ReturnType<typeof debounce<(pos: IDebouncedPosition) => void>>;

export function useCanvas(tabId: string) {
  const { widgets, setWidgets, updateWidgetPosition, snapEnabled } = useCanvasStore();
  const lastValidPositions = useRef<Map<string, IWidgetPosition>>(new Map());
  // Per-widget lodash.debounce instance — keyed by widgetId so concurrent drags
  // of different widgets don't share a single throttle window.
  const debouncers = useRef<Map<string, DebouncedFn>>(new Map());
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
        const { conflict } = await apiClient.patch(API_ROUTES.WIDGET.POSITION(widgetId), pos);
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

  // Cancel + flush all pending debounced patches when the hook unmounts so
  // we never leak a network call after navigation.
  useEffect(() => {
    const map = debouncers.current;
    return () => {
      map.forEach((fn) => fn.cancel());
      map.clear();
    };
  }, []);

  const debouncedPatch = useCallback(
    (widgetId: string, pos: IWidgetPosition) => {
      let fn = debouncers.current.get(widgetId);
      if (!fn) {
        fn = debounce(patchPosition, 300);
        debouncers.current.set(widgetId, fn);
      }
      fn({ widgetId, ...pos });
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
