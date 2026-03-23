import { create } from 'zustand';
import type { ITabDto, IWidgetDto, ZoomLevel } from '@sbrb/shared-types';

interface ICanvasStore {
  tabs: ITabDto[];
  activeTabId: string | null;
  widgets: IWidgetDto[];
  zoom: ZoomLevel;
  snapEnabled: boolean;
  setTabs: (tabs: ITabDto[]) => void;
  setActiveTab: (id: string | null) => void;
  setWidgets: (widgets: IWidgetDto[]) => void;
  updateWidgetPosition: (id: string, pos: { x: number; y: number; w: number; h: number }) => void;
  setZoom: (level: ZoomLevel) => void;
  toggleSnap: () => void;
}

export const useCanvasStore = create<ICanvasStore>((set) => ({
  tabs: [],
  activeTabId: null,
  widgets: [],
  zoom: 100,
  snapEnabled: true,
  setTabs: (tabs) => set({ tabs }),
  setActiveTab: (activeTabId) => set({ activeTabId }),
  setWidgets: (widgets) => set({ widgets }),
  updateWidgetPosition: (id, pos) =>
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === id
          ? { ...w, position: { x: pos.x, y: pos.y, w: pos.w, h: pos.h } }
          : w,
      ),
    })),
  setZoom: (zoom) => set({ zoom }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
}));
