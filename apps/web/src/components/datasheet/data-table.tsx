import React, { useMemo } from 'react';
import { Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { EditableCell } from './editable-cell';
import { SeriesNameCell } from './series-name-cell';
import { ColumnHeaderMenu } from './column-header-menu';
import { RowHeaderMenu } from './row-header-menu';
import type { IDataSeriesRow } from '../../hooks/use-datasheet-detail';

interface IDataTableProps {
  series: IDataSeriesRow[];
  periodHeaders: string[];
  onCellEdit: (seriesId: string, period: string, value: number | null) => void;
  onDeleteSeries?: (seriesId: string) => void;
  onInsertSeries?: (name: string, index: number) => void;
  onDeletePeriod?: (periodName: string) => void;
  onInsertPeriod?: (periodName: string, index: number) => void;
  onRenameSeries?: (seriesId: string, newName: string) => void;
}

/** Table with dynamic period columns, inline cell editing, delete row/col, and series rename */
export function DataTable({
  series,
  periodHeaders,
  onCellEdit,
  onDeleteSeries,
  onInsertSeries,
  onDeletePeriod,
  onInsertPeriod,
  onRenameSeries,
}: IDataTableProps) {
  const { t, i18n } = useTranslation('datasheet');

  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const seriesNames = useMemo(() => series.map((s) => s.seriesName), [series]);
  const canDeleteRow = series.length > 1;

  const columns = useMemo<ColumnsType<IDataSeriesRow>>(() => {
    const periodCols: ColumnsType<IDataSeriesRow> = periodHeaders.map((period, idx) => ({
      title: onInsertPeriod && onDeletePeriod ? (
        <div className="group/header flex items-center justify-end gap-1">
          <span className="font-medium">{period}</span>
          <ColumnHeaderMenu
            period={period}
            index={idx}
            existingPeriods={periodHeaders}
            onInsertAt={onInsertPeriod}
            onDelete={onDeletePeriod}
          />
        </div>
      ) : (
        <span className="font-medium">{period}</span>
      ),
      key: period,
      align: 'right' as const,
      width: 120,
      onHeaderCell: () => ({ className: 'text-right' }),
      render: (_: unknown, record: IDataSeriesRow) => (
        <EditableCell
          value={record.values?.[period] ?? null}
          onSave={(v) => onCellEdit(record.id, period, v)}
        />
      ),
    }));

    return [
      {
        title: <span className="font-semibold">{t('series_name_col')}</span>,
        dataIndex: 'seriesName',
        key: 'seriesName',
        fixed: 'left' as const,
        width: 200,
        ellipsis: true,
        render: (_: unknown, record: IDataSeriesRow, rowIdx: number) => (
          <div className="flex items-center justify-between gap-1">
            <SeriesNameCell
              seriesId={record.id}
              name={record.seriesName}
              onRename={onRenameSeries}
            />
            {onInsertSeries && onDeleteSeries && (
              <RowHeaderMenu
                seriesName={record.seriesName}
                seriesKey={record.id}
                index={rowIdx}
                existingSeries={seriesNames}
                canDelete={canDeleteRow}
                onInsertAt={onInsertSeries}
                onDelete={onDeleteSeries}
              />
            )}
          </div>
        ),
      },
      ...periodCols,
    ];
  }, [
    periodHeaders,
    t,
    onCellEdit,
    onDeleteSeries,
    onInsertSeries,
    onDeletePeriod,
    onInsertPeriod,
    onRenameSeries,
    seriesNames,
    canDeleteRow,
  ]);

  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    for (const period of periodHeaders) {
      result[period] = series.reduce((acc, row) => {
        const v = row.values?.[period];
        return acc + (typeof v === 'number' ? v : 0);
      }, 0);
    }
    return result;
  }, [series, periodHeaders]);

  return (
    <Table<IDataSeriesRow>
      dataSource={series}
      columns={columns}
      rowKey="id"
      bordered
      size="middle"
      tableLayout="fixed"
      scroll={periodHeaders.length > 6 ? { x: 180 + periodHeaders.length * 120 + 40 } : undefined}
      rowHoverable
      className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-summary>tr>td]:!border-t-2"
      rowClassName="group/row hover:!bg-blue-50/40 transition-colors"
      pagination={{ pageSize: 50, showSizeChanger: true, hideOnSinglePage: true }}
      locale={{
        emptyText: (
          <Empty
            description={t('no_series')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
      summary={() => (
        <Table.Summary fixed="bottom">
          <Table.Summary.Row className="bg-blue-50/30 font-semibold border-t-2 border-gray-200">
            <Table.Summary.Cell index={0} className="font-bold text-gray-700 !bg-blue-50/50">
              {t('total_row')}
            </Table.Summary.Cell>
            {periodHeaders.map((period, i) => (
              <Table.Summary.Cell
                key={period}
                index={i + 1}
                className="text-right font-mono text-gray-700 !bg-blue-50/50"
              >
                {totals[period] !== 0 ? formatter.format(totals[period]) : '–'}
              </Table.Summary.Cell>
            ))}
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
