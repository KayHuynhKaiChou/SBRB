import React from 'react';
import { Tour } from 'antd';
import type { TourProps } from 'antd';
import { useFeatureTour } from '../../hooks/use-feature-tour';

interface IFeatureTourProps {
  /** Must match the catalog feature `tourId`. */
  tourId: string;
  steps: TourProps['steps'];
}

/**
 * Mounts an antd <Tour> that auto-opens when the page is reached via a guide
 * "Usage" button (`?tour=<tourId>` or tour store). Drop one per feature page.
 */
export function FeatureTour({ tourId, steps }: IFeatureTourProps) {
  const tour = useFeatureTour(tourId);
  return <Tour open={tour.open} onClose={tour.close} steps={steps} />;
}
