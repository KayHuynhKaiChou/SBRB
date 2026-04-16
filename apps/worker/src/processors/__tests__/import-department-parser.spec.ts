import { describe, it, expect } from 'vitest';
import { parseDepartmentBuffer } from '../import-department-parser';
import { createDepartmentExcel } from './create-test-excel';

describe('parseDepartmentBuffer', () => {
  const headers = ['Jan', 'Feb', 'Mar'];

  it('parses 2 departments with 2 series each', async () => {
    const buf = await createDepartmentExcel(headers, [
      {
        dept: 'Sales',
        series: [
          { name: 'Revenue', values: [100, 200, 300] },
          { name: 'Units', values: [10, 20, 30] },
        ],
      },
      {
        dept: 'Marketing',
        series: [
          { name: 'Ad Spend', values: [50, 60, 70] },
          { name: 'Leads', values: [500, 600, 700] },
        ],
      },
    ]);

    const result = await parseDepartmentBuffer(buf, 'test.xlsx');

    expect(result.headers).toEqual(headers);
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0].name).toBe('[Sales] Revenue');
    expect(result.rows[0].values['Jan']).toBe(100);
    expect(result.rows[2].name).toBe('[Marketing] Ad Spend');
    expect(result.groups).toHaveLength(2);
    expect(result.groups![0]).toEqual({ departmentName: 'Sales', seriesCount: 2 });
    expect(result.groups![1]).toEqual({ departmentName: 'Marketing', seriesCount: 2 });
    expect(result.warnings).toHaveLength(0);
  });

  it('parses single department with 3 series', async () => {
    const buf = await createDepartmentExcel(headers, [
      {
        dept: 'Finance',
        series: [
          { name: 'Income', values: [1, 2, 3] },
          { name: 'Expenses', values: [4, 5, 6] },
          { name: 'Net', values: [7, 8, 9] },
        ],
      },
    ]);

    const result = await parseDepartmentBuffer(buf, 'test.xlsx');

    expect(result.rows).toHaveLength(3);
    expect(result.groups).toHaveLength(1);
    expect(result.groups![0]).toEqual({ departmentName: 'Finance', seriesCount: 3 });
  });

  it('warns on empty group (department header with no data rows)', async () => {
    const buf = await createDepartmentExcel(headers, [
      { dept: 'EmptyDept', series: [] },
      {
        dept: 'FullDept',
        series: [{ name: 'Metric', values: [1, 2, 3] }],
      },
    ]);

    const result = await parseDepartmentBuffer(buf, 'test.xlsx');

    expect(result.rows).toHaveLength(1);
    expect(result.groups).toHaveLength(2);
    expect(result.groups![0]).toEqual({ departmentName: 'EmptyDept', seriesCount: 0 });
  });

  it('warns on ungrouped rows before first department header', async () => {
    const buf = await createDepartmentExcel(
      headers,
      [{ dept: 'Sales', series: [{ name: 'Revenue', values: [1, 2, 3] }] }],
      { ungroupedBefore: [{ name: 'Orphan', values: [9, 8, 7] }] },
    );

    const result = await parseDepartmentBuffer(buf, 'test.xlsx');

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('Orphan'); // no prefix
    expect(result.warnings.some((w) => w.includes('before any department header'))).toBe(true);
  });

  it('returns error on duplicate series names after prefix', async () => {
    const buf = await createDepartmentExcel(headers, [
      {
        dept: 'Sales',
        series: [
          { name: 'Revenue', values: [1, 2, 3] },
          { name: 'Revenue', values: [4, 5, 6] },
        ],
      },
    ]);

    const result = await parseDepartmentBuffer(buf, 'test.xlsx');

    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('Duplicate series name'))).toBe(true);
  });

  it('returns error suggesting Simple template when no group headers found', async () => {
    // All rows have numeric data — no group headers detected
    const wb = await import('exceljs');
    const workbook = new wb.Workbook();
    const ws = workbook.addWorksheet('Data');
    ws.addRow(['', 'Jan', 'Feb']);
    ws.addRow(['Revenue', 100, 200]);
    ws.addRow(['Cost', 50, 60]);
    const buf = Buffer.from(await workbook.xlsx.writeBuffer());

    const result = await parseDepartmentBuffer(buf, 'test.xlsx');

    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('Simple template'))).toBe(true);
  });
});
