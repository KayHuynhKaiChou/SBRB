import * as ExcelJS from 'exceljs';

/**
 * Load an Excel workbook from buffer. Handles both .xlsx and .csv.
 */
export async function loadWorkbook(buffer: Buffer, fileName: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  if (fileName.toLowerCase().endsWith('.csv')) {
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer.toString('utf-8'));
    await workbook.csv.read(stream);
  } else {
    await workbook.xlsx.load(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
    );
  }
  return workbook;
}

/**
 * Parse a raw cell value into a number. Returns null + warning if non-numeric.
 */
export function parseNumericCell(
  raw: ExcelJS.CellValue,
  rowNumber: number,
  header: string,
  warnings: string[],
): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (isNaN(num)) {
    warnings.push(`Row ${rowNumber} col "${header}": non-numeric value "${raw}" set to null`);
    return null;
  }
  return num;
}

/**
 * Extract period headers from a row starting at the given column.
 */
export function extractHeaders(row: ExcelJS.Row, startCol: number): string[] {
  const headers: string[] = [];
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (colNumber >= startCol) {
      const val = cell.value != null ? String(cell.value).trim() : '';
      if (val) headers.push(val);
    }
  });
  return headers;
}
