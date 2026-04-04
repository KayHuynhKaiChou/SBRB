import React, { useMemo } from 'react';
import { Table, Empty, Popconfirm, Button, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { EditableCell } from './editable-cell';
import { SeriesNameCell } from './series-name-cell';
import type { IDataSeriesRow } from '../../hooks/use-datasheet-detail';

interface IDataTableProps {
  series: IDataSeriesRow[];
  periodHeaders: string[];
  onCellEdit: (seriesId: string, period: string, value: number | null) => void;
  onDeleteSeries?: (seriesId: string) => void;
  onDeletePeriod?: (periodName: string) => void;
  onRenameSeries?: (seriesId: string, newName: string) => void;
}

/** Table with dynamic period columns, inline cell editing, delete row/col, and series rename */
export function DataTable({
  series,
  periodHeaders,
  onCellEdit,
  onDeleteSeries,
  onDeletePeriod,
  onRenameSeries,
}: IDataTableProps) {
  const { t, i18n } = useTranslation('datasheet');

  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  const columns = useMemo<ColumnsType<IDataSeriesRow>>(() => {
    const periodCols = periodHeaders.map((period) => ({
      title: onDeletePeriod ? (
        <Space size={4}>
          <span>{period}</span>
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
              className="!h-4 !w-4 !min-w-0 !p-0 opacity-40 hover:!opacity-100"
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ) : period,
      key: period,
      width: 120,
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
          width: 48,
          fixed: 'right' as const,
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
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          ),
        }
      : null;

    return [
      {
        title: t('series_name_col'),
        dataIndex: 'seriesName',
        key: 'seriesName',
        fixed: 'left' as const,
        width: 200,
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
  }, [periodHeaders, t, onCellEdit, onDeleteSeries, onDeletePeriod, onRenameSeries]);

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
      size="small"
      scroll={{ x: 'max-content' }}
      pagination={{ pageSize: 50, showSizeChanger: true }}
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
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} className="font-semibold">
              {t('total_row')}
            </Table.Summary.Cell>
            {periodHeaders.map((period, i) => (
              <Table.Summary.Cell key={period} index={i + 1} className="text-right">
                {totals[period] !== 0 ? formatter.format(totals[period]) : '–'}
              </Table.Summary.Cell>
            ))}
            {/* Placeholder cell to align with optional actions column */}
            {onDeleteSeries && (
              <Table.Summary.Cell index={summaryColCount} />
            )}
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
