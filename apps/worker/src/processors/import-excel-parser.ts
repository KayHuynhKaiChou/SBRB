import * as ExcelJS from 'exceljs';

export interface ISeriesRow {
  name: string;
  values: Record<string, number | null>;
}

export interface IParseResult {
  headers: string[];
  rows: ISeriesRow[];
  warnings: string[];
  groups?: { departmentName: string; seriesCount: number }[];
  categories?: { name: string; level: number; hasValues: boolean }[];
}

/**
 * Parse Excel (.xlsx) or CSV buffer into headers + series rows.
 * Row 1 = header row: col A ignored, cols B..N are period labels.
 * Col A rows 2..N = series names; remaining cells = numeric values.
 */
export async function parseFileBuffer(buffer: Buffer, fileName: string): Promise<IParseResult> {
  const workbook = new ExcelJS.Workbook();

  if (fileName.toLowerCase().endsWith('.csv')) {
    // ExcelJS reads CSV via stream; convert buffer to readable stream approach
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer.toString('utf-8'));
    await workbook.csv.read(stream);
  } else {
    await workbook.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { headers: [], rows: [], warnings: ['Worksheet is empty'] };
  }

  const warnings: string[] = [];
  const headers: string[] = [];

  // Row 1: extract period headers from cols B onward
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (colNumber >= 2) {
      const val = cell.value != null ? String(cell.value).trim() : '';
      if (val) headers.push(val);
    }
  });

  const rows: ISeriesRow[] = [];

  // Rows 2+: series name in col A, values in cols B onward
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const nameCell = row.getCell(1);
    const seriesName = nameCell.value != null ? String(nameCell.value).trim() : '';
    if (!seriesName) return; // skip nameless rows

    const values: Record<string, number | null> = {};
    headers.forEach((header, idx) => {
      const cell = row.getCell(idx + 2);
      const raw = cell.value;
      if (raw === null || raw === undefined || raw === '') {
        values[header] = null;
      } else {
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
        if (isNaN(num)) {
          warnings.push(`Row ${rowNumber} col "${header}": non-numeric value "${raw}" set to null`);
          values[header] = null;
        } else {
          values[header] = num;
        }
      }
    });

    rows.push({ name: seriesName, values });
  });

  return { headers, rows, warnings };
}

/**
 * Validate parsed result. Throws Error on critical violations.
 * Returns error rows count (nameless rows already filtered in parseFileBuffer).
 */
export function validateParseResult(
  headers: string[],
  rows: ISeriesRow[],
): { errorRows: number } {
  if (headers.length === 0) {
    throw new Error('No period headers found in row 1');
  }
  if (headers.length > 120) {
    throw new Error('Too many periods (max 120)');
  }
  if (rows.length > 200) {
    throw new Error('Too many series rows (max 200)');
  }

  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const row of rows) {
    const dept = (row as any).departmentName || '';
    const key = `${dept}::${row.name}`.toLowerCase();
    if (seen.has(key)) dupes.push(row.name);
    else seen.add(key);
  }
  if (dupes.length > 0) {
    throw new Error(`Duplicate series names: ${dupes.join(', ')}. Lỗi này thường do bạn import nhầm định dạng Mẫu 2 (Nhiều phòng ban) vào DataSheet được tạo dưới Mẫu 1 (Đơn giản).`);
  }

  return { errorRows: 0 };
}
