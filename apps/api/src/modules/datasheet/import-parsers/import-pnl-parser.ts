import * as ExcelJS from 'exceljs';
import type { IParseResult, ISeriesRow } from './import-excel-parser';

const MAX_DEPTH = 3;
const MAX_PATH_LENGTH = 180;

interface ICategory {
  name: string;
  level: number;
  hasValues: boolean;
}

/**
 * Detect indent level from ExcelJS cell.
 * Prefers cell.alignment.indent; falls back to leading-space counting.
 */
function detectIndent(cell: ExcelJS.Cell): number {
  const alignIndent = (cell.alignment as Record<string, unknown>)?.indent;
  if (typeof alignIndent === 'number' && alignIndent > 0) return alignIndent;
  const raw = String(cell.value ?? '');
  const trimmed = raw.trimStart();
  return Math.floor((raw.length - trimmed.length) / 2);
}

/**
 * Check whether any cell in columns B+ contains a numeric value.
 */
function rowHasNumericValues(
  row: ExcelJS.Row,
  headerCount: number,
): boolean {
  for (let col = 2; col <= headerCount + 1; col++) {
    const raw = row.getCell(col).value;
    if (typeof raw === 'number') return true;
    if (raw !== null && raw !== undefined && raw !== '') {
      const num = parseFloat(String(raw));
      if (!isNaN(num)) return true;
    }
  }
  return false;
}

/**
 * Parse a P&L Statement Excel template with hierarchical categories.
 *
 * Row 1: period headers (cols B+).
 * Rows 2+: category/item rows with indent-based hierarchy.
 * Rows with numeric values become data series; category-only rows are metadata.
 */
export async function parsePnlBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<IParseResult & { categories?: ICategory[] }> {
  const workbook = new ExcelJS.Workbook();

  if (fileName.toLowerCase().endsWith('.csv')) {
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer.toString('utf-8'));
    await workbook.csv.read(stream);
  } else {
    await workbook.xlsx.load(
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer,
    );
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
  const categories: ICategory[] = [];
  const ancestors: string[] = [];

  // Rows 2+: parse hierarchy
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const nameCell = row.getCell(1);
    const rawName = nameCell.value != null ? String(nameCell.value).trim() : '';
    if (!rawName) return;

    let indent = detectIndent(nameCell);

    // Cap depth at MAX_DEPTH levels (0-indexed)
    if (indent >= MAX_DEPTH) {
      warnings.push(
        `Row ${rowNumber}: indent level ${indent} exceeds max ${MAX_DEPTH - 1}, flattened to level ${MAX_DEPTH - 1}`,
      );
      indent = MAX_DEPTH - 1;
    }

    // Maintain ancestor stack
    while (ancestors.length > indent) ancestors.pop();
    ancestors.push(rawName);

    const fullPath = ancestors.join(' > ');
    const hasValues = rowHasNumericValues(row, headers.length);

    // Track category metadata
    categories.push({ name: rawName, level: indent, hasValues });

    if (fullPath.length > MAX_PATH_LENGTH) {
      warnings.push(
        `Row ${rowNumber}: series path "${fullPath.slice(0, 40)}..." exceeds ${MAX_PATH_LENGTH} chars`,
      );
    }

    // Only rows with numeric values become data series
    if (!hasValues) return;

    const values: Record<string, number | null> = {};
    headers.forEach((header, idx) => {
      const cell = row.getCell(idx + 2);
      const raw = cell.value;
      if (raw === null || raw === undefined || raw === '') {
        values[header] = null;
      } else {
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
        if (isNaN(num)) {
          warnings.push(
            `Row ${rowNumber} col "${header}": non-numeric "${raw}" set to null`,
          );
          values[header] = null;
        } else {
          values[header] = num;
        }
      }
    });

    rows.push({ name: fullPath, values });
  });

  // Validations
  const topLevelCategories = categories.filter((c) => c.level === 0);
  if (topLevelCategories.length === 0) {
    warnings.push('No top-level categories found');
  }
  if (rows.length === 0) {
    warnings.push('No data rows with numeric values found');
  }

  return { headers, rows, warnings, categories };
}
