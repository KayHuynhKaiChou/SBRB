import { describe, it, expect } from 'vitest';
import { parsePnlBuffer } from '../import-pnl-parser';
import { createPnlExcel } from './create-test-excel';

describe('parsePnlBuffer', () => {
  const headers = ['Q1', 'Q2', 'Q3', 'Q4'];

  it('parses 3 categories with nested items into hierarchical names', async () => {
    const buf = await createPnlExcel(headers, [
      { name: 'Revenue', indent: 0 },
      { name: 'Product Sales', indent: 1, values: [500, 520, 540, 560] },
      { name: 'Service Income', indent: 1, values: [300, 310, 320, 330] },
      { name: 'COGS', indent: 0 },
      { name: 'Raw Materials', indent: 1, values: [200, 210, 220, 230] },
      { name: 'OpEx', indent: 0 },
      { name: 'Salaries', indent: 1, values: [100, 105, 110, 115] },
    ]);

    const result = await parsePnlBuffer(buf, 'test.xlsx');

    expect(result.headers).toEqual(headers);
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0].name).toBe('Revenue > Product Sales');
    expect(result.rows[0].values['Q1']).toBe(500);
    expect(result.rows[1].name).toBe('Revenue > Service Income');
    expect(result.rows[2].name).toBe('COGS > Raw Materials');
    expect(result.rows[3].name).toBe('OpEx > Salaries');
    expect(result.warnings).toHaveLength(0);
    expect(result.categories).toBeDefined();
    expect(result.categories!.length).toBe(7);
  });

  it('includes category with subtotal values as series', async () => {
    const buf = await createPnlExcel(headers, [
      { name: 'Revenue', indent: 0, values: [1000, 1100, 1200, 1300] },
      { name: 'Product Sales', indent: 1, values: [500, 520, 540, 560] },
    ]);

    const result = await parsePnlBuffer(buf, 'test.xlsx');

    // Revenue has values, so it's a data row
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('Revenue');
    expect(result.rows[0].values['Q1']).toBe(1000);
    expect(result.rows[1].name).toBe('Revenue > Product Sales');
  });

  it('excludes category-only rows (no values) from data rows but keeps in categories', async () => {
    const buf = await createPnlExcel(headers, [
      { name: 'Revenue', indent: 0 }, // label only
      { name: 'Product Sales', indent: 1, values: [500, 520, 540, 560] },
    ]);

    const result = await parsePnlBuffer(buf, 'test.xlsx');

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Revenue > Product Sales');
    // Category metadata still includes Revenue
    expect(result.categories!.find((c) => c.name === 'Revenue')).toEqual({
      name: 'Revenue',
      level: 0,
      hasValues: false,
    });
  });

  it('warns and caps depth at 3 levels for deep nesting', async () => {
    const buf = await createPnlExcel(headers, [
      { name: 'L0', indent: 0 },
      { name: 'L1', indent: 1 },
      { name: 'L2', indent: 2, values: [10, 20, 30, 40] },
      { name: 'L3TooDeep', indent: 3, values: [1, 2, 3, 4] },
    ]);

    const result = await parsePnlBuffer(buf, 'test.xlsx');

    expect(result.warnings.some((w) => w.includes('exceeds max'))).toBe(true);
    // L3 gets flattened to level 2, so its path includes ancestors up to that depth
    expect(result.rows).toHaveLength(2);
  });

  it('handles mixed indentation detecting correct L1 and L2', async () => {
    // 2-space indent for L1, 4-space for L2 — ExcelJS alignment.indent is authoritative
    const buf = await createPnlExcel(headers, [
      { name: 'Revenue', indent: 0 },
      { name: 'Domestic', indent: 1, values: [100, 110, 120, 130] },
      { name: 'Online', indent: 2, values: [40, 45, 50, 55] },
    ]);

    const result = await parsePnlBuffer(buf, 'test.xlsx');

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('Revenue > Domestic');
    expect(result.rows[1].name).toBe('Revenue > Domestic > Online');
    expect(result.categories![1].level).toBe(1);
    expect(result.categories![2].level).toBe(2);
  });
});
