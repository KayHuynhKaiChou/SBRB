import { useMemo } from 'react';
import { Table, Alert, Empty, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';

const MAX_PREVIEW_ROWS = 10;

interface IPreviewRow {
  name: string;
  values: Record<string, number | null>;
}

interface IImportPreviewTableProps {
  headers: string[];
  rows: IPreviewRow[];
  warnings: string[];
}

/** Read-only preview table shown before confirming import. Shows up to 10 rows. */
export function ImportPreviewTable({ headers, rows, warnings }: IImportPreviewTableProps) {
  const { t, i18n } = useTranslation('datasheet');
  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  const displayRows = rows.slice(0, MAX_PREVIEW_ROWS);
  const totalRows = rows.length;

  const columns: ColumnsType<IPreviewRow> = useMemo(() => {
    const nameCol: ColumnsType<IPreviewRow>[number] = {
      title: t('series_name_col'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 160,
      ellipsis: true,
    };
    const periodCols: ColumnsType<IPreviewRow> = headers.map((header) => ({
      title: header,
      key: header,
      width: 100,
      align: 'right' as const,
      render: (_: unknown, record: IPreviewRow) => {
        const val = record.values[header];
        return val == null ? '—' : formatter.format(val);
      },
    }));
    return [nameCol, ...periodCols];
  }, [headers, formatter, t]);

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
      <Table<IPreviewRow>
        dataSource={displayRows}
        columns={columns}
        rowKey="name"
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
