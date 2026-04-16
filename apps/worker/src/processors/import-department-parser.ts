import * as ExcelJS from 'exceljs';
import type { IParseResult, ISeriesRow } from './import-excel-parser';
import { loadWorkbook, parseNumericCell } from './parse-common';

export interface IDepartmentSeriesRow extends ISeriesRow {
  departmentName: string | null;
}

/** Column-group info for a single department */
export interface IDeptColumnGroup {
  name: string;
  startCol: number; // 1-based
  endCol: number; // 1-based, inclusive
  periods: string[];
}

export interface IDepartmentParseResult extends IParseResult {
  rows: IDepartmentSeriesRow[];
  groups: { departmentName: string; seriesCount: number }[];
  /** Column layout for preview/table rendering */
  departmentColumns: IDeptColumnGroup[];
}

/**
 * Parse a column-grouped department Excel buffer.
 *
 * Row 1: |          | Dept A   |          | Dept B   |          |  (merged or repeated)
 * Row 2: |          | Jan      | Feb      | Jan      | Feb      |  (period sub-headers)
 * Row 3+:| Series   | 100      | 120      | 50       | 60       |  (data)
 *
 * All departments MUST have identical period lists (same count + same names).
 */
export async function parseDepartmentBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<IDepartmentParseResult> {
  const workbook = await loadWorkbook(buffer, fileName);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { headers: [], rows: [], warnings: ['Worksheet is empty'], groups: [], departmentColumns: [] };
  }

  const warnings: string[] = [];

  // --- Step 1: Parse Row 1 for department names (col B onward) ---
  const deptGroups = parseDeptHeaderRow(worksheet);
  if (deptGroups.length === 0) {
    return {
      headers: [], rows: [],
      warnings: ['No department headers found in row 1. Columns B+ should contain department names.'],
      groups: [], departmentColumns: [],
    };
  }

  // --- Step 2: Parse Row 2 for period sub-headers per department ---
  const periodRow = worksheet.getRow(2);
  for (const group of deptGroups) {
    const periods: string[] = [];
    for (let col = group.startCol; col <= group.endCol; col++) {
      const cell = periodRow.getCell(col);
      const val = cell.value != null ? String(cell.value).trim() : '';
      periods.push(val);
    }
    group.periods = periods.filter(Boolean);
  }

  // --- Step 3: Validate all depts have identical period lists ---
  const referencePeriods = deptGroups[0].periods;
  for (let i = 1; i < deptGroups.length; i++) {
    const dp = deptGroups[i].periods;
    if (dp.length !== referencePeriods.length || dp.some((p, idx) => p !== referencePeriods[idx])) {
      return {
        headers: referencePeriods, rows: [],
        warnings: [`Period mismatch: "${deptGroups[i].name}" has [${dp.join(', ')}] but "${deptGroups[0].name}" has [${referencePeriods.join(', ')}]. All departments must have identical period columns.`],
        groups: [], departmentColumns: deptGroups,
      };
    }
  }

  const headers = referencePeriods;

  // --- Step 4: Parse data rows (row 3+) ---
  const seriesNames: string[] = [];
  const rawData: { seriesName: string; rowNumber: number; cellsByCol: Map<number, number | null> }[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= 2) return;
    const nameCell = row.getCell(1);
    const seriesName = nameCell.value != null ? String(nameCell.value).trim() : '';
    if (!seriesName) return;

    seriesNames.push(seriesName);
    const cellsByCol = new Map<number, number | null>();
    // Read ALL value columns
    for (const group of deptGroups) {
      for (let col = group.startCol; col <= group.endCol; col++) {
        const cell = row.getCell(col);
        const val = parseNumericCell(cell.value, rowNumber, `col ${col}`, warnings);
        cellsByCol.set(col, val);
      }
    }
    rawData.push({ seriesName, rowNumber, cellsByCol });
  });

  // --- Step 5: Expand to N rows per series (1 per department) ---
  const rows: IDepartmentSeriesRow[] = [];
  const groupCounts = new Map<string, number>();

  for (const data of rawData) {
    for (const group of deptGroups) {
      const values: Record<string, number | null> = {};
      group.periods.forEach((period, idx) => {
        values[period] = data.cellsByCol.get(group.startCol + idx) ?? null;
      });
      rows.push({
        name: data.seriesName,
        departmentName: group.name,
        values,
      });
      groupCounts.set(group.name, (groupCounts.get(group.name) ?? 0) + 1);
    }
  }

  const groups = deptGroups.map((g) => ({
    departmentName: g.name,
    seriesCount: groupCounts.get(g.name) ?? 0,
  }));

  return { headers, rows, warnings, groups, departmentColumns: deptGroups };
}

/**
 * Parse department names from Row 1, col B onward.
 * Handles merged cells: a merged range means one dept spans multiple columns.
 * Handles non-merged: consecutive cells with same value = same dept group.
 */
function parseDeptHeaderRow(worksheet: ExcelJS.Worksheet): IDeptColumnGroup[] {
  const row1 = worksheet.getRow(1);
  const groups: IDeptColumnGroup[] = [];
  const mergedRanges = getMergedRangesForRow(worksheet, 1);

  // Build a map: colNumber → dept name (resolve merged cells)
  const colToDept = new Map<number, string>();
  // Use worksheet.columnCount for accurate max; fallback to merged range max
  const mergedMax = mergedRanges.reduce((max, r) => Math.max(max, r.right), 0);
  const maxCol = Math.max(worksheet.columnCount, mergedMax, 20);

  for (let col = 2; col <= maxCol; col++) {
    // Check if this col is part of a merged range
    const merged = mergedRanges.find((r) => col >= r.left && col <= r.right);
    if (merged) {
      const masterCell = row1.getCell(merged.left);
      const val = masterCell.value != null ? String(masterCell.value).trim() : '';
      if (val) colToDept.set(col, val);
    } else {
      const cell = row1.getCell(col);
      const val = cell.value != null ? String(cell.value).trim() : '';
      if (val) colToDept.set(col, val);
    }
  }

  // Group consecutive columns with same dept name, track actual last col per group
  let currentName = '';
  let startCol = 0;
  let lastCol = 0;

  const sortedCols = [...colToDept.entries()].sort((a, b) => a[0] - b[0]);
  for (const [col, name] of sortedCols) {
    if (name !== currentName) {
      if (currentName && startCol) {
        groups.push({ name: currentName, startCol, endCol: lastCol, periods: [] });
      }
      currentName = name;
      startCol = col;
    }
    lastCol = col;
  }
  // Finalize last group
  if (currentName && startCol) {
    groups.push({ name: currentName, startCol, endCol: lastCol, periods: [] });
  }

  return groups;
}

/** Parse a cell reference like "B1" into { row, col } (1-based). */
function decodeCellRef(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { row: 1, col: 1 };
  const letters = match[1];
  const row = parseInt(match[2], 10);
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { row, col };
}

/** Get all merged cell ranges that intersect a given row. */
function getMergedRangesForRow(
  worksheet: ExcelJS.Worksheet,
  targetRow: number,
): { left: number; right: number }[] {
  const result: { left: number; right: number }[] = [];
  const merges: string[] = (worksheet.model as any).merges ?? [];
  for (const mergeStr of merges) {
    // mergeStr format: "B1:D1"
    const [startRef, endRef] = mergeStr.split(':');
    const start = decodeCellRef(startRef);
    const end = decodeCellRef(endRef);
    if (start.row <= targetRow && end.row >= targetRow) {
      result.push({ left: start.col, right: end.col });
    }
  }
  return result;
}
