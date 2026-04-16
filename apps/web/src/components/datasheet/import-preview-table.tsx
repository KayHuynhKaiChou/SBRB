import { useMemo } from 'react';
import { Table, Alert, Empty, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';

const MAX_PREVIEW_ROWS = 50;

interface IPreviewRow {
  name: string;
  values: Record<string, number | null>;
}

interface IGroupInfo {
  departmentName: string;
  seriesCount: number;
}

interface ICategoryInfo {
  name: string;
  level: number;
  hasValues: boolean;
}

interface IDisplayRow {
  key: string;
  name: string;
  values: Record<string, number | null>;
  __isGroupHeader?: boolean;
  __level?: number;
  __isCategoryHeader?: boolean;
}

interface IDeptColumnGroup {
  name: string;
  startCol: number;
  endCol: number;
  periods: string[];
}

interface IImportPreviewTableProps {
  headers: string[];
  rows: IPreviewRow[];
  warnings: string[];
  templateType?: 'simple' | 'department' | 'pnl';
  groups?: IGroupInfo[];
  categories?: ICategoryInfo[];
  departmentColumns?: IDeptColumnGroup[];
}

/** Read-only preview table shown before confirming import. Shows up to 10 rows. */
export function ImportPreviewTable({
  headers,
  rows,
  warnings,
  templateType = 'simple',
  groups,
  categories,
  departmentColumns,
}: IImportPreviewTableProps) {
  const { t, i18n } = useTranslation('datasheet');
  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  // For department template with column groups, use matrix display
  const isDeptColumnMode = templateType === 'department' && departmentColumns && departmentColumns.length > 0;

  const displayRows = useMemo(() => {
    if (isDeptColumnMode) {
      return buildDeptMatrixRows(rows, departmentColumns!, groups);
    }
    if (templateType === 'pnl' && categories?.length) {
      return buildPnlRows(rows, categories);
    }
    return rows.slice(0, MAX_PREVIEW_ROWS).map((r, i) => ({
      ...r,
      key: `row-${i}`,
      values: r.values,
    }));
  }, [rows, groups, categories, templateType, departmentColumns, isDeptColumnMode]);

  const totalRows = rows.length;

  const columns: ColumnsType<IDisplayRow> = useMemo(() => {
    const nameCol: ColumnsType<IDisplayRow>[number] = {
      title: t('series_name_col'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 180,
      ellipsis: true,
      render: (name: string, record: IDisplayRow) => {
        if (record.__isGroupHeader || record.__isCategoryHeader) {
          return <strong>{name}</strong>;
        }
        const indent = record.__level ? record.__level * 16 : 0;
        return <span style={{ paddingLeft: indent }}>{name}</span>;
      },
    };

    // Department column-group mode: grouped headers (Dept > Period)
    if (isDeptColumnMode && departmentColumns) {
      const deptGroupCols = departmentColumns.map((dept) => ({
        title: dept.name,
        key: `dept-${dept.name}`,
        children: dept.periods.map((period) => ({
          title: period,
          key: `${dept.name}__${period}`,
          width: 100,
          align: 'right' as const,
          render: (_: unknown, record: IDisplayRow) => {
            const val = record.values[`${dept.name}__${period}`];
            return val == null ? '—' : formatter.format(val);
          },
        })),
      }));
      return [nameCol, ...deptGroupCols] as any;
    }

    // Simple / PnL mode: flat period columns
    const periodCols: ColumnsType<IDisplayRow> = headers.map((header) => ({
      title: header,
      key: header,
      width: 100,
      align: 'right' as const,
      render: (_: unknown, record: IDisplayRow) => {
        if (record.__isGroupHeader || record.__isCategoryHeader) return null;
        const val = record.values[header];
        return val == null ? '—' : formatter.format(val);
      },
    }));
    return [nameCol, ...periodCols];
  }, [headers, formatter, t, isDeptColumnMode, departmentColumns]);

  if (rows.length === 0) {
    return <Empty description={t('preview_no_data')} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={t('preview_warnings')}
          description={
            <ul className="pl-4 m-0">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          }
        />
      )}
      {totalRows > MAX_PREVIEW_ROWS && (
        <Typography.Text type="secondary">
          {t('preview_rows_hint', { shown: MAX_PREVIEW_ROWS, total: totalRows })}
        </Typography.Text>
      )}
      <Table<IDisplayRow>
        dataSource={displayRows}
        columns={columns}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowClassName={(record) =>
          record.__isGroupHeader ? 'bg-gray-100 font-bold' : ''
        }
      />
    </div>
  );
}

/**
 * Build matrix rows for department column-group preview.
 * Input rows: N series × M depts (flat). Output: N unique series with dept-prefixed value keys.
 */
function buildDeptMatrixRows(
  rows: IPreviewRow[],
  deptColumns: IDeptColumnGroup[],
  groups?: IGroupInfo[],
): IDisplayRow[] {
  // Group rows by series name, then merge values across depts
  const seriesMap = new Map<string, Record<string, number | null>>();
  const seriesOrder: string[] = [];

  for (const row of rows) {
    const deptName = (row as any).departmentName as string | null;
    if (!seriesMap.has(row.name)) {
      seriesMap.set(row.name, {});
      seriesOrder.push(row.name);
    }
    const merged = seriesMap.get(row.name)!;
    if (deptName) {
      for (const [period, val] of Object.entries(row.values)) {
        merged[`${deptName}__${period}`] = val;
      }
    }
  }

  return seriesOrder.slice(0, MAX_PREVIEW_ROWS).map((name, i) => ({
    key: `row-${i}`,
    name,
    values: seriesMap.get(name) ?? {},
  }));
}

function buildPnlRows(rows: IPreviewRow[], categories: ICategoryInfo[]): IDisplayRow[] {
  // Rebuild full paths from categories (same ancestor-stack as parser)
  const ancestors: string[] = [];
  const pathMap = new Map<string, ICategoryInfo>();
  for (const cat of categories) {
    while (ancestors.length > cat.level) ancestors.pop();
    ancestors.push(cat.name);
    pathMap.set(ancestors.join(' > '), cat);
  }

  const result: IDisplayRow[] = [];
  // Insert category-only headers before their child data rows
  const insertedHeaders = new Set<string>();
  for (let i = 0; i < rows.length && result.length < MAX_PREVIEW_ROWS + categories.length; i++) {
    const row = rows[i];
    const cat = pathMap.get(row.name);
    // Insert parent category headers that haven't been shown yet
    if (cat) {
      const parts = row.name.split(' > ');
      let path = '';
      for (const part of parts.slice(0, -1)) {
        path = path ? `${path} > ${part}` : part;
        const parentCat = pathMap.get(path);
        if (parentCat && !parentCat.hasValues && !insertedHeaders.has(path)) {
          insertedHeaders.add(path);
          result.push({
            key: `cat-${path}`,
            name: parentCat.name,
            values: {},
            __isCategoryHeader: true,
            __level: parentCat.level,
          });
        }
      }
    }
    const level = cat?.level ?? 0;
    result.push({ ...row, key: `row-${i}`, values: row.values, __level: level });
  }
  return result;
}
