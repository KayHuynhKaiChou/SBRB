import { create } from 'zustand';

/**
 * Cross-page tour coordination. The guide's Usage button navigates to a feature
 * page and sets `activeTour`; the target page's `useFeatureTour` opens its Tour
 * when ids match, then calls `endTour` on close. Session-only (no persist).
 */
interface ITourStore {
  activeTour: string | null;
  startTour: (tourId: string) => void;
  endTour: () => void;
}

export const useTourStore = create<ITourStore>((set) => ({
  activeTour: null,
  startTour: (tourId) => set({ activeTour: tourId }),
  endTour: () => set({ activeTour: null }),
}));
