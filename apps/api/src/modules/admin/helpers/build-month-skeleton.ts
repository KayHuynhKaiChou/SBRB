/**
 * Builds an ordered list of YYYY-MM month keys starting at `start`, for `count`
 * months. Used to guarantee the growth chart shows every month (incl. zero-signup
 * gaps) rather than only months that have rows.
 */
export function buildMonthSkeleton(start: Date, count: number): string[] {
  const months: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  return months;
}
