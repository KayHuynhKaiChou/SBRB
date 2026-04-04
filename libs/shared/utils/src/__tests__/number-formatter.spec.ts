import { describe, it, expect } from 'vitest';
import { formatChartNumber } from '../number-formatter';

describe('formatChartNumber', () => {
  // --- VND ---
  describe('VND unit', () => {
    it('formats 150_000_000 → 150Tr', () => {
      expect(formatChartNumber(150_000_000, { unit: 'VND' })).toBe('150Tr');
    });

    it('formats 1_500_000_000 → 1.5T', () => {
      expect(formatChartNumber(1_500_000_000, { unit: 'VND' })).toBe('1.5T');
    });

    it('formats 1_000_000_000 → 1T (exact billion)', () => {
      expect(formatChartNumber(1_000_000_000, { unit: 'VND' })).toBe('1T');
    });

    it('formats 800_000 → 800K', () => {
      expect(formatChartNumber(800_000, { unit: 'VND' })).toBe('800K');
    });

    it('formats 1_500_000 → 1.5Tr', () => {
      expect(formatChartNumber(1_500_000, { unit: 'VND' })).toBe('1.5Tr');
    });

    it('accepts VNĐ unit', () => {
      expect(formatChartNumber(150_000_000, { unit: 'VNĐ' })).toBe('150Tr');
    });

    it('accepts đ (lowercase) unit', () => {
      expect(formatChartNumber(150_000_000, { unit: 'đ' })).toBe('150Tr');
    });

    it('accepts dong unit', () => {
      expect(formatChartNumber(150_000_000, { unit: 'dong' })).toBe('150Tr');
    });

    it('formats negative VND → -150Tr', () => {
      expect(formatChartNumber(-150_000_000, { unit: 'VND' })).toBe('-150Tr');
    });

    it('formats 500 (small VND) → 500', () => {
      expect(formatChartNumber(500, { unit: 'VND' })).toBe('500');
    });

    it('formats 0 → 0', () => {
      expect(formatChartNumber(0, { unit: 'VND' })).toBe('0');
    });
  });

  // --- USD / international ---
  describe('USD / international unit', () => {
    it('formats 150_000_000 → 150M', () => {
      expect(formatChartNumber(150_000_000, { unit: 'USD' })).toBe('150M');
    });

    it('formats 1_500_000_000 → 1.5B', () => {
      expect(formatChartNumber(1_500_000_000, { unit: 'USD' })).toBe('1.5B');
    });

    it('formats 1_000_000_000 → 1B (exact billion)', () => {
      expect(formatChartNumber(1_000_000_000, { unit: 'USD' })).toBe('1B');
    });

    it('formats 800_000 → 800K', () => {
      expect(formatChartNumber(800_000, { unit: 'USD' })).toBe('800K');
    });

    it('formats 1_500_000 → 1.5M', () => {
      expect(formatChartNumber(1_500_000, { unit: 'USD' })).toBe('1.5M');
    });

    it('formats negative USD → -150M', () => {
      expect(formatChartNumber(-150_000_000, { unit: 'USD' })).toBe('-150M');
    });

    it('formats 500 (small) → 500', () => {
      expect(formatChartNumber(500, { unit: 'USD' })).toBe('500');
    });

    it('formats 0 → 0', () => {
      expect(formatChartNumber(0, { unit: 'USD' })).toBe('0');
    });

    it('no unit defaults to international K/M/B', () => {
      expect(formatChartNumber(1_500_000)).toBe('1.5M');
    });
  });

  // --- Percent ---
  describe('% unit', () => {
    it('formats 12.567 → 12.57%', () => {
      expect(formatChartNumber(12.567, { unit: '%' })).toBe('12.57%');
    });

    it('formats integer percent → 50.00%', () => {
      expect(formatChartNumber(50, { unit: '%' })).toBe('50.00%');
    });

    it('formats 0% → 0.00%', () => {
      expect(formatChartNumber(0, { unit: '%' })).toBe('0.00%');
    });

    it('formats negative % → -12.57%', () => {
      expect(formatChartNumber(-12.567, { unit: '%' })).toBe('-12.57%');
    });
  });

  // --- Full mode ---
  describe("mode: 'full'", () => {
    it('returns unabbreviated for large VND', () => {
      const result = formatChartNumber(150_000_000, { unit: 'VND', mode: 'full' });
      expect(result).toBe((150_000_000).toLocaleString());
    });

    it('returns unabbreviated for large USD', () => {
      const result = formatChartNumber(150_000_000, { unit: 'USD', mode: 'full' });
      expect(result).toBe((150_000_000).toLocaleString());
    });

    it('returns unabbreviated for 0', () => {
      expect(formatChartNumber(0, { mode: 'full' })).toBe((0).toLocaleString());
    });
  });

  // --- Edge cases ---
  describe('edge cases', () => {
    it('formats zero with no options → 0', () => {
      expect(formatChartNumber(0)).toBe('0');
    });

    it('handles no options (undefined)', () => {
      expect(formatChartNumber(999)).toBe('999');
    });

    it('formats 1000 exactly → 1K', () => {
      expect(formatChartNumber(1000)).toBe('1K');
    });

    it('removes trailing .0 → 2T not 2.0T', () => {
      expect(formatChartNumber(2_000_000_000, { unit: 'VND' })).toBe('2T');
    });
  });
});
