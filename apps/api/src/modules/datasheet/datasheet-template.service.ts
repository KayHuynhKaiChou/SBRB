import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

/** Handles Excel template generation for DataSheet — SRS 4.7 */
@Injectable()
export class DatasheetTemplateService {
  /**
   * Generate a downloadable Excel template with period headers and empty rows.
   * @param periodType - month | quarter | year | custom
   * @param count - number of data row stubs to include
   */
  async generateTemplate(
    periodType: 'month' | 'quarter' | 'year' | 'custom',
    count: number,
  ): Promise<Buffer<ArrayBufferLike>> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data');
    const headers = this.buildPeriodHeaders(periodType);

    sheet.addRow(['', ...headers]);
    for (let i = 1; i <= count; i++) {
      sheet.addRow([`Nhập tên chỉ số ${i}`, ...headers.map(() => 0)]);
    }

    const instructions = workbook.addWorksheet('Hướng dẫn');
    instructions.addRow(['Hướng dẫn nhập liệu SBRB']);
    instructions.addRow(['- Cột A: Tên chỉ số (không để trống)']);
    instructions.addRow(['- Hàng 1: Tiêu đề kỳ (không thay đổi)']);
    instructions.addRow(['- Giá trị: Số thực, để 0 nếu không có dữ liệu']);

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  /**
   * Generate a sample Excel file demonstrating the expected format for a given template type.
   * @param templateType - simple | department | pnl
   */
  async generateSampleFile(
    templateType: 'simple' | 'department' | 'pnl',
  ): Promise<Buffer<ArrayBufferLike>> {
    if (templateType === 'department') return this.buildDepartmentSample();
    if (templateType === 'pnl') return this.buildPnlSample();
    return this.generateTemplate('month', 3);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async buildDepartmentSample(): Promise<Buffer<ArrayBufferLike>> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data');
    const periods = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    const depts = ['Phòng Kinh doanh', 'Phòng Marketing'];
    const colsPerDept = periods.length;

    // Row 1: department headers (merged across period columns)
    const row1Vals: (string | null)[] = [''];
    for (const dept of depts) {
      row1Vals.push(dept, ...Array(colsPerDept - 1).fill(null));
    }
    sheet.addRow(row1Vals);
    // Merge dept header cells
    for (let d = 0; d < depts.length; d++) {
      const startCol = 2 + d * colsPerDept;
      const endCol = startCol + colsPerDept - 1;
      sheet.mergeCells(1, startCol, 1, endCol);
    }
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Row 2: period sub-headers (repeated per department)
    const row2Vals: string[] = [''];
    for (let d = 0; d < depts.length; d++) {
      row2Vals.push(...periods);
    }
    sheet.addRow(row2Vals);
    sheet.getRow(2).font = { bold: true };

    // Data rows: same series for each dept
    const seriesData = [
      { name: 'Doanh thu', values: [[100, 120, 130, 140, 150, 160], [50, 60, 50, 55, 65, 70]] },
      { name: 'Chi phí',   values: [[40, 50, 55, 60, 65, 70], [30, 30, 35, 40, 45, 50]] },
      { name: 'Nhân sự',   values: [[10, 12, 14, 15, 16, 18], [5, 5, 6, 7, 7, 8]] },
    ];
    for (const s of seriesData) {
      const rowVals: (string | number)[] = [s.name];
      for (const deptVals of s.values) rowVals.push(...deptVals);
      sheet.addRow(rowVals);
    }

    const instructions = workbook.addWorksheet('Hướng dẫn');
    instructions.addRow(['Mẫu Department (cột nhóm) — Hướng dẫn']);
    instructions.addRow(['- Hàng 1: Tên phòng ban (merge ô theo số kỳ)']);
    instructions.addRow(['- Hàng 2: Kỳ báo cáo lặp lại cho mỗi phòng ban']);
    instructions.addRow(['- Hàng 3+: Tên chỉ số ở cột A, giá trị cho từng phòng ban']);
    instructions.addRow(['- Tất cả phòng ban phải có cùng danh sách kỳ']);

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  private async buildPnlSample(): Promise<Buffer<ArrayBufferLike>> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data');
    const periods = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

    sheet.addRow(['', ...periods]);
    sheet.getRow(1).font = { bold: true };

    // L0: Revenue (bold, no indent)
    const revRow = sheet.addRow(['Revenue', ...periods.map(() => '')]);
    revRow.font = { bold: true };
    sheet.addRow(['  Product Sales', 500, 520, 540, 560, 580, 600]);
    sheet.addRow(['  Service Income', 300, 310, 320, 330, 340, 350]);

    // L0: COGS
    const cogsRow = sheet.addRow(['COGS', ...periods.map(() => '')]);
    cogsRow.font = { bold: true };
    sheet.addRow(['  Raw Materials', 200, 210, 220, 230, 240, 250]);
    sheet.addRow(['  Labor', 100, 105, 110, 115, 120, 125]);

    const instructions = workbook.addWorksheet('Hướng dẫn');
    instructions.addRow(['Mẫu P&L — Hướng dẫn']);
    instructions.addRow(['- Hàng 1: Tiêu đề kỳ']);
    instructions.addRow(['- Danh mục cấp 0 (L0): Tên ở cột A, in đậm, các cột B+ để trống']);
    instructions.addRow(['- Danh mục cấp 1 (L1): Thụt 2 dấu cách, giá trị từ cột B']);

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  private buildPeriodHeaders(periodType: string): string[] {
    if (periodType === 'month') return Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    if (periodType === 'quarter') return ['Q1', 'Q2', 'Q3', 'Q4'];
    if (periodType === 'year') {
      const year = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => String(year + i));
    }
    return Array.from({ length: 12 }, (_, i) => `P${i + 1}`);
  }
}
