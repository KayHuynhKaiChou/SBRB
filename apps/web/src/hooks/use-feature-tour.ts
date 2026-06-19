import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTourStore } from '../store/tour.store';

/**
 * Drives an antd <Tour> on a feature page. Opens when EITHER `?tour=<tourId>` is
 * present (deep-link / Usage navigation) OR the tour store's `activeTour` matches.
 * Consumes the search param + clears the store on close so the tour won't re-open.
 *
 * Usage on a page:
 *   const tour = useFeatureTour('dashboard');
 *   <Tour open={tour.open} onClose={tour.close} steps={steps} />
 */
export function useFeatureTour(tourId: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTour = useTourStore((s) => s.activeTour);
  const endTour = useTourStore((s) => s.endTour);

  const paramTour = searchParams.get('tour');
  const shouldOpen = paramTour === tourId || activeTour === tourId;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shouldOpen) setOpen(true);
  }, [shouldOpen]);

  const close = useCallback(() => {
    setOpen(false);
    endTour();
    if (searchParams.get('tour')) {
      const next = new URLSearchParams(searchParams);
      next.delete('tour');
      setSearchParams(next, { replace: true });
    }
  }, [endTour, searchParams, setSearchParams]);

  return useMemo(() => ({ open, close, setOpen }), [open, close]);
}
