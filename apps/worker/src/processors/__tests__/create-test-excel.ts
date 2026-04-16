import * as ExcelJS from 'exceljs';

/** Create department-grouped Excel buffer for testing */
export async function createDepartmentExcel(
  headers: string[],
  groups: { dept: string; series: { name: string; values: (number | null)[] }[] }[],
  opts?: { ungroupedBefore?: { name: string; values: (number | null)[] }[] },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  ws.addRow(['', ...headers]);

  // Ungrouped rows before any department header
  if (opts?.ungroupedBefore) {
    for (const s of opts.ungroupedBefore) {
      ws.addRow([s.name, ...s.values]);
    }
  }

  for (const group of groups) {
    // Group header: name in col A, cols B+ empty
    ws.addRow([group.dept, ...headers.map(() => '')]);
    for (const s of group.series) {
      ws.addRow([s.name, ...s.values]);
    }
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Create P&L-style Excel buffer with indentation-based hierarchy */
export async function createPnlExcel(
  headers: string[],
  items: { name: string; indent: number; values?: (number | null)[] }[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  ws.addRow(['', ...headers]);

  for (const item of items) {
    const prefix = '  '.repeat(item.indent);
    const row = ws.addRow([prefix + item.name, ...(item.values ?? [])]);
    row.getCell(1).alignment = { indent: item.indent };
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
