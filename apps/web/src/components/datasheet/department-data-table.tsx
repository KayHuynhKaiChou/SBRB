import React, { useCallback, useMemo } from 'react';
import { Table, Empty, Popconfirm, Tooltip, Button, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EditableCell } from './editable-cell';
import { ColumnHeaderMenu } from './column-header-menu';
import { RowHeaderMenu } from './row-header-menu';
import { DeptNameCell } from './dept-name-cell';
import type { IDataSeriesRow } from '../../hooks/use-datasheet-detail';

const { Text } = Typography;

interface IDeptGroup {
  name: string;
  deptId: string;
}

interface IDepartmentDataTableProps {
  series: IDataSeriesRow[];
  periodHeaders: string[];
  onCellEdit: (seriesId: string, period: string, value: number | null) => void;
  onCellUpsert?: (
    departmentId: string,
    seriesName: string,
    period: string,
    value: number | null,
  ) => void;
  onDeletePeriod?: (periodName: string) => void;
  onInsertPeriod?: (periodName: string, index: number) => void;
  onInsertSeries?: (name: string, index: number) => void;
  onDeleteSeriesByName?: (name: string) => void;
  onDeleteDepartment?: (departmentId: string) => void;
  onRenameDepartment?: (departmentId: string, name: string) => void;
}

/**
 * Matrix data table for departmental datasheets.
 * Columns: Series Name | Dept A (Jan, Feb...) | Dept B (Jan, Feb...) | ...
 * Rows: One per unique series name (e.g., "Doanh thu", "Chi phí")
 */
export function DepartmentDataTable({
  series,
  periodHeaders,
  onCellEdit,
  onCellUpsert,
  onDeletePeriod,
  onInsertPeriod,
  onInsertSeries,
  onDeleteSeriesByName,
  onDeleteDepartment,
  onRenameDepartment,
}: IDepartmentDataTableProps) {
  const { t, i18n } = useTranslation('datasheet');
  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  // Extract unique departments (ordered by first appearance)
  const departments = useMemo<IDeptGroup[]>(() => {
    const seen = new Map<string, IDeptGroup>();
    for (const s of series) {
      if (s.department?.id && !seen.has(s.department.id)) {
        seen.set(s.department.id, { name: s.department.name, deptId: s.department.id });
      }
    }
    return [...seen.values()];
  }, [series]);

  // Build lookup: `${deptId}::${seriesName}` → IDataSeriesRow
  const seriesLookup = useMemo(() => {
    const map = new Map<string, IDataSeriesRow>();
    for (const s of series) {
      if (s.departmentId) {
        map.set(`${s.departmentId}::${s.seriesName}`, s);
      }
    }
    return map;
  }, [series]);

  // Unique series names (row labels)
  const seriesNames = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const s of series) {
      if (!seen.has(s.seriesName)) {
        seen.add(s.seriesName);
        names.push(s.seriesName);
      }
    }
    return names;
  }, [series]);

  const canDeleteRow = seriesNames.length > 1;
  const canDeleteDept = departments.length > 2;

  const renderDeptHeader = useCallback(
    (dept: IDeptGroup) => {
      const nameCell = (
        <DeptNameCell
          deptId={dept.deptId}
          name={dept.name}
          onRename={onRenameDepartment}
        />
      );

      if (!onDeleteDepartment) {
        return nameCell;
      }

      const button = (
        <Button
          type="text"
          size="small"
          danger={canDeleteDept}
          disabled={!canDeleteDept}
          icon={<DeleteOutlined className="text-xs" />}
          onClick={(e) => e.stopPropagation()}
          className="!h-5 !w-5 !min-w-0 !p-0 opacity-0 group-hover/dept-header:!opacity-60 hover:!opacity-100 transition-opacity"
          aria-label={`${t('delete_department')} — ${dept.name}`}
        />
      );
      return (
        <div className="group/dept-header flex items-center justify-center gap-1">
          {nameCell}
          {canDeleteDept ? (
            <Popconfirm
              title={t('confirm_delete_department')}
              onConfirm={() => onDeleteDepartment(dept.deptId)}
              okText={t('rename_confirm')}
              cancelText={t('rename_cancel')}
              okButtonProps={{ danger: true }}
            >
              {button}
            </Popconfirm>
          ) : (
            // Span wrapper required: disabled Button blocks mouse events → Tooltip
            // won't show on hover. Span catches events on behalf of the button.
            <Tooltip title={t('cannot_delete_min_departments')} placement="top">
              <span className="inline-flex cursor-not-allowed">{button}</span>
            </Tooltip>
          )}
        </div>
      );
    },
    [canDeleteDept, onDeleteDepartment, onRenameDepartment, t],
  );

  // Build columns: Series Name | Dept A > periods | Dept B > periods
  const columns = useMemo(() => {
    const nameCol = {
      title: <span className="font-semibold">{t('series_name_col')}</span>,
      dataIndex: 'seriesName',
      key: 'seriesName',
      fixed: 'left' as const,
      width: 200,
      ellipsis: { showTitle: false },
      render: (name: string, _record: unknown, rowIdx: number) => (
        <div className="flex items-center justify-between gap-1 min-w-0">
          <Text ellipsis={{ tooltip: name }} className="flex-1 min-w-0 font-medium text-gray-800">
            {name}
          </Text>
          {onInsertSeries && onDeleteSeriesByName && (
            <RowHeaderMenu
              seriesName={name}
              seriesKey={name}
              index={rowIdx}
              existingSeries={seriesNames}
              canDelete={canDeleteRow}
              onInsertAt={onInsertSeries}
              onDelete={onDeleteSeriesByName}
            />
          )}
        </div>
      ),
    };

    const deptGroupCols = departments.map((dept) => ({
      title: renderDeptHeader(dept),
      key: `dept-${dept.deptId}`,
      children: periodHeaders.map((period, idx) => ({
        title:
          onInsertPeriod && onDeletePeriod ? (
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
        key: `${dept.deptId}__${period}`,
        width: 110,
        align: 'right' as const,
        render: (_: unknown, record: { seriesName: string }) => {
          const row = seriesLookup.get(`${dept.deptId}::${record.seriesName}`);
          if (row) {
            return (
              <EditableCell
                value={row.values?.[period] ?? null}
                onSave={(v) => onCellEdit(row.id, period, v)}
              />
            );
          }
          // Missing DataSeries: render 0 and route saves through the upsert path
          // so the backend can create the row on first edit.
          if (onCellUpsert) {
            return (
              <EditableCell
                value={0}
                onSave={(v) => onCellUpsert(dept.deptId, record.seriesName, period, v)}
              />
            );
          }
          return '—';
        },
      })),
    }));

    return [nameCol, ...deptGroupCols];
  }, [
    departments,
    periodHeaders,
    seriesLookup,
    onCellEdit,
    onCellUpsert,
    onInsertPeriod,
    onDeletePeriod,
    onInsertSeries,
    onDeleteSeriesByName,
    seriesNames,
    canDeleteRow,
    renderDeptHeader,
    t,
  ]);

  // Data source: one row per unique series name
  const dataSource = useMemo(
    () => seriesNames.map((name) => ({ key: name, seriesName: name })),
    [seriesNames],
  );

  // Totals per dept × period
  const totals = useMemo(() => {
    const result = new Map<string, number>();
    for (const dept of departments) {
      for (const period of periodHeaders) {
        let sum = 0;
        for (const name of seriesNames) {
          const row = seriesLookup.get(`${dept.deptId}::${name}`);
          const v = row?.values?.[period];
          if (typeof v === 'number') sum += v;
        }
        result.set(`${dept.deptId}__${period}`, sum);
      }
    }
    return result;
  }, [departments, periodHeaders, seriesNames, seriesLookup]);

  return (
    <Table
      dataSource={dataSource}
      columns={columns as any}
      rowKey="key"
      bordered
      size="middle"
      tableLayout="fixed"
      scroll={{ x: 180 + departments.length * periodHeaders.length * 110 }}
      rowHoverable
      className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-summary>tr>td]:!border-t-2"
      rowClassName="group/row hover:!bg-blue-50/40 transition-colors"
      pagination={{ pageSize: 50, showSizeChanger: true, hideOnSinglePage: true }}
      locale={{
        emptyText: <Empty description={t('no_series')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      summary={() => (
        <Table.Summary fixed="bottom">
          <Table.Summary.Row className="bg-blue-50/30 font-semibold">
            <Table.Summary.Cell index={0} className="font-bold text-gray-700 !bg-blue-50/50">
              {t('total_row')}
            </Table.Summary.Cell>
            {departments.flatMap((dept, di) =>
              periodHeaders.map((period, pi) => (
                <Table.Summary.Cell
                  key={`${dept.deptId}-${period}`}
                  index={di * periodHeaders.length + pi + 1}
                  className="text-right font-mono text-gray-700 !bg-blue-50/50"
                >
                  {formatter.format(totals.get(`${dept.deptId}__${period}`) ?? 0)}
                </Table.Summary.Cell>
              )),
            )}
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
