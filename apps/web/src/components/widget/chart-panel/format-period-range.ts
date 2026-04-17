/**
 * Formats a list of selected periods into a human-readable subtitle string.
 *
 * Used by Criteria-mode chart preview to clarify that bars represent SUMS
 * across the selected time periods (not per-period values).
 *
 * Behavior:
 *  - Empty            → empty string
 *  - Single period    → "T1/2025"
 *  - Contiguous range → "T1/2025 → T6/2025"
 *  - Non-contiguous   → "T1/2025, T3/2025, T5/2025"  (truncated past 4)
 */
export interface IPeriodRangeFormat {
  count: number;
  rangeText: string;
  isContiguous: boolean;
}

export function formatPeriodRange(
  selectedPeriods: string[] | null | undefined,
  allPeriods: string[],
): IPeriodRangeFormat {
  const periods = selectedPeriods && selectedPeriods.length > 0 ? selectedPeriods : allPeriods;
  if (!periods || periods.length === 0) return { count: 0, rangeText: '', isContiguous: false };

  // Sort by source order (allPeriods order) so range detection works regardless of selection order
  const indexOf = new Map(allPeriods.map((p, i) => [p, i]));
  const sorted = [...periods].sort(
    (a, b) => (indexOf.get(a) ?? 0) - (indexOf.get(b) ?? 0),
  );

  if (sorted.length === 1) return { count: 1, rangeText: sorted[0], isContiguous: true };

  const firstIdx = indexOf.get(sorted[0]) ?? -1;
  const lastIdx = indexOf.get(sorted[sorted.length - 1]) ?? -1;
  const isContiguous =
    firstIdx >= 0 && lastIdx >= 0 && lastIdx - firstIdx + 1 === sorted.length;

  if (isContiguous) {
    return {
      count: sorted.length,
      rangeText: `${sorted[0]} → ${sorted[sorted.length - 1]}`,
      isContiguous: true,
    };
  }

  const rangeText =
    sorted.length > 4
      ? `${sorted.slice(0, 3).join(', ')}, … (+${sorted.length - 3})`
      : sorted.join(', ');
  return { count: sorted.length, rangeText, isContiguous: false };
}
