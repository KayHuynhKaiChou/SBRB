import { describe, it, expect, beforeEach } from 'vitest';
import * as ExcelJS from 'exceljs';
import { DatasheetTemplateService } from '../datasheet-template.service';

/** Load buffer into workbook, handling Buffer<ArrayBufferLike> type mismatch */
async function loadWorkbook(buf: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
  );
  return wb;
}

describe('DatasheetTemplateService', () => {
  let service: DatasheetTemplateService;

  beforeEach(() => {
    service = new DatasheetTemplateService();
  });

  describe('generateSampleFile', () => {
    it('generates valid simple template with data worksheet', async () => {
      const buf = await service.generateSampleFile('simple');
      const wb = await loadWorkbook(buf);

      expect(wb.worksheets.length).toBeGreaterThanOrEqual(1);
      const ws = wb.getWorksheet('Data');
      expect(ws).toBeDefined();

      // Row 1 = headers (12 months)
      const headerRow = ws!.getRow(1);
      expect(headerRow.getCell(2).value).toBe('T1');

      // Should have data rows
      expect(ws!.rowCount).toBeGreaterThan(1);
    });

    it('generates valid department template with group headers', async () => {
      const buf = await service.generateSampleFile('department');
      const wb = await loadWorkbook(buf);

      const ws = wb.getWorksheet('Data');
      expect(ws).toBeDefined();

      // Row 1 = period headers
      expect(ws!.getRow(1).getCell(2).value).toBe('T1');

      // Row 2 should be a group header (Sales) — bold, cols B+ empty
      const salesRow = ws!.getRow(2);
      expect(salesRow.getCell(1).value).toBe('Sales');

      // Data rows follow
      const revenueRow = ws!.getRow(3);
      expect(revenueRow.getCell(1).value).toBe('Revenue');
      expect(revenueRow.getCell(2).value).toBe(100);

      // Instructions worksheet exists
      expect(wb.getWorksheet('Hướng dẫn')).toBeDefined();
    });

    it('generates valid P&L template with indented categories', async () => {
      const buf = await service.generateSampleFile('pnl');
      const wb = await loadWorkbook(buf);

      const ws = wb.getWorksheet('Data');
      expect(ws).toBeDefined();

      // Row 1 = period headers
      expect(ws!.getRow(1).getCell(2).value).toBe('T1');

      // Row 2 = top-level category (Revenue, bold, no values)
      const revRow = ws!.getRow(2);
      expect(revRow.getCell(1).value).toBe('Revenue');

      // Row 3 = indented item with values
      const productRow = ws!.getRow(3);
      expect(String(productRow.getCell(1).value)).toContain('Product Sales');
      expect(productRow.getCell(2).value).toBe(500);

      expect(wb.getWorksheet('Hướng dẫn')).toBeDefined();
    });

    it('returns buffers that are valid xlsx (non-zero length)', async () => {
      const types: Array<'simple' | 'department' | 'pnl'> = ['simple', 'department', 'pnl'];
      for (const type of types) {
        const buf = await service.generateSampleFile(type);
        expect(buf.length).toBeGreaterThan(0);
        // Verify xlsx magic bytes (PK zip header)
        expect(buf[0]).toBe(0x50); // P
        expect(buf[1]).toBe(0x4b); // K
      }
    });
  });

  describe('generateTemplate', () => {
    it('generates monthly template with 12 period headers', async () => {
      const buf = await service.generateTemplate('month', 5);
      const wb = await loadWorkbook(buf);

      const ws = wb.getWorksheet('Data');
      expect(ws).toBeDefined();

      // 12 month headers T1-T12
      const headerRow = ws!.getRow(1);
      expect(headerRow.getCell(2).value).toBe('T1');
      expect(headerRow.getCell(13).value).toBe('T12');

      // 5 data rows + 1 header = 6 total
      expect(ws!.rowCount).toBe(6);
    });

    it('generates quarterly template with 4 period headers', async () => {
      const buf = await service.generateTemplate('quarter', 2);
      const wb = await loadWorkbook(buf);

      const ws = wb.getWorksheet('Data');
      const headerRow = ws!.getRow(1);
      expect(headerRow.getCell(2).value).toBe('Q1');
      expect(headerRow.getCell(5).value).toBe('Q4');
    });
  });
});
