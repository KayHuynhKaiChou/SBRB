export type NumberFormatMode = 'auto' | 'full' | 'short';

export interface IFormatChartNumberOptions {
  unit?: string;
  mode?: NumberFormatMode;
}

const VND_KEYWORDS = ['VND', 'VNĐ', 'Đ', 'DONG'];

function isVND(unit?: string): boolean {
  if (!unit) return false;
  const upper = unit.toUpperCase();
  // Also detect single 'đ' character
  if (unit === 'đ') return true;
  return VND_KEYWORDS.some(kw => upper.includes(kw));
}

function isPercent(unit?: string): boolean {
  return unit === '%';
}

/**
 * Abbreviate a number using given threshold/suffix pairs.
 * Removes trailing ".0" from result (e.g. 1.0T → 1T).
 */
function abbreviate(value: number, thresholds: [number, string][]): string {
  const abs = Math.abs(value);
  for (const [threshold, suffix] of thresholds) {
    if (abs >= threshold) {
      const scaled = value / threshold;
      const formatted =
        scaled % 1 === 0
          ? scaled.toFixed(0)
          : parseFloat(scaled.toFixed(1)).toString();
      return `${formatted}${suffix}`;
    }
  }
  // Below all thresholds — show as-is (integer or small float)
  return Number.isInteger(value) ? String(value) : value.toLocaleString();
}

/**
 * Format a chart number for display in data labels, Y-axis ticks, and tooltips.
 *
 * - VND (VND/VNĐ/đ/dong): uses Tỷ (T), Triệu (Tr), Nghìn (K)
 * - USD/other: uses B, M, K
 * - %: always shows 2 decimal places
 * - 'full' mode: uses toLocaleString (unabbreviated)
 * - 'short' mode: forces abbreviation (same as 'auto' for now)
 * - Handles negatives, zero, small values (<1000 shown as-is)
 */
export function formatChartNumber(
  value: number,
  options?: IFormatChartNumberOptions,
): string {
  const { unit, mode = 'auto' } = options ?? {};

  if (mode === 'full') return value.toLocaleString();

  if (isPercent(unit)) return `${value.toFixed(2)}%`;

  if (isVND(unit)) {
    return abbreviate(value, [
      [1_000_000_000, 'T'],  // Tỷ
      [1_000_000, 'Tr'],     // Triệu
      [1_000, 'K'],
    ]);
  }

  // Default: international K / M / B
  return abbreviate(value, [
    [1_000_000_000, 'B'],
    [1_000_000, 'M'],
    [1_000, 'K'],
  ]);
}
