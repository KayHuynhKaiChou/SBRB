import { describe, it, expect } from 'vitest';
import { GUIDE_AREAS, GUIDE_TOUR_IDS } from '../../pages/guide/guide-catalog';

describe('guide catalog integrity', () => {
  const all = GUIDE_AREAS.flatMap((a) => a.features);

  it('has unique feature keys', () => {
    const keys = all.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('coming-soon features have NO route or tourId', () => {
    for (const f of all.filter((x) => x.status === 'coming-soon')) {
      expect(f.route, f.key).toBeUndefined();
      expect(f.tourId, f.key).toBeUndefined();
    }
  });

  it('any feature with a tourId also has a route', () => {
    for (const f of all.filter((x) => x.tourId)) {
      expect(f.route, f.key).toBeTruthy();
    }
  });

  it('exposes a deduped non-empty tourId list', () => {
    expect(GUIDE_TOUR_IDS.length).toBeGreaterThan(0);
    expect(GUIDE_TOUR_IDS.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(GUIDE_TOUR_IDS).size).toBe(GUIDE_TOUR_IDS.length);
  });

  it('includes a coming-soon area with labelled items', () => {
    const comingSoon = GUIDE_AREAS.find((a) => a.key === 'coming_soon');
    expect(comingSoon).toBeDefined();
    expect(comingSoon!.features.every((f) => f.status === 'coming-soon')).toBe(true);
  });
});
