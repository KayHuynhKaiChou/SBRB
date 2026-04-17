import React, { useMemo } from 'react';
import { Table, Empty, Popconfirm, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { EditableCell } from './editable-cell';
import { SeriesNameCell } from './series-name-cell';
import { ColumnHeaderMenu } from './column-header-menu';
import type { IDataSeriesRow } from '../../hooks/use-datasheet-detail';

interface IDataTableProps {
  series: IDataSeriesRow[];
  periodHeaders: string[];
  onCellEdit: (seriesId: string, period: string, value: number | null) => void;
  onDeleteSeries?: (seriesId: string) => void;
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
  onDeletePeriod,
  onInsertPeriod,
  onRenameSeries,
}: IDataTableProps) {
  const { t, i18n } = useTranslation('datasheet');

  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

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
      ) : onDeletePeriod ? (
        <div className="group/header flex items-center justify-end gap-1">
          <span className="font-medium">{period}</span>
          <Popconfirm
            title={t('confirm_delete_period')}
            onConfirm={() => onDeletePeriod(period)}
            okText={t('rename_confirm')}
            cancelText={t('rename_cancel')}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="!h-5 !w-5 !min-w-0 !p-0 opacity-0 group-hover/header:!opacity-60 hover:!opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
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

    const actionCol: ColumnsType<IDataSeriesRow>[number] | null = onDeleteSeries
      ? {
          key: 'actions',
          width: 40,
          fixed: 'right' as const,
          onHeaderCell: () => ({ className: 'bg-gray-50/80!' }),
          render: (_: unknown, record: IDataSeriesRow) => (
            <Popconfirm
              title={t('confirm_delete_series')}
              onConfirm={() => onDeleteSeries(record.id)}
              okText={t('rename_confirm')}
              cancelText={t('rename_cancel')}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined className="text-xs" />}
                className="!h-6 !w-6 !min-w-0 !p-0 opacity-30 hover:!opacity-100 transition-opacity"
              />
            </Popconfirm>
          ),
        }
      : null;

    return [
      {
        title: <span className="font-semibold">{t('series_name_col')}</span>,
        dataIndex: 'seriesName',
        key: 'seriesName',
        fixed: 'left' as const,
        width: 180,
        ellipsis: true,
        render: (_: unknown, record: IDataSeriesRow) => (
          <SeriesNameCell
            seriesId={record.id}
            name={record.seriesName}
            onRename={onRenameSeries}
          />
        ),
      },
      ...periodCols,
      ...(actionCol ? [actionCol] : []),
    ];
  }, [periodHeaders, t, onCellEdit, onDeleteSeries, onDeletePeriod, onInsertPeriod, onRenameSeries]);

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

  // Summary row spans series-name column + period columns; skip actions column index
  const summaryColCount = periodHeaders.length + 1;

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
            {/* Placeholder cell to align with optional actions column */}
            {onDeleteSeries && (
              <Table.Summary.Cell index={summaryColCount} className="!bg-blue-50/50" />
            )}
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
