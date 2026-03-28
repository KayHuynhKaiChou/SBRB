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

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

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
