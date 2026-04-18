import React, { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Typography, Skeleton, Alert, Space, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '../../components/layout/sidebar';
import { DataTable } from '../../components/datasheet/data-table';
import { DepartmentDataTable } from '../../components/datasheet/department-data-table';
import { TableToolbar } from '../../components/datasheet/table-toolbar';
import {
  useDataSheetDetail,
  useUpdateSeriesValue,
} from '../../hooks/use-datasheet-detail';
import {
  useAddSeries,
  useDeleteSeries,
  useAddPeriod,
  useDeletePeriod,
  useInsertPeriod,
  useInsertSeries,
  useDeleteSeriesByName,
  useRenameSeries,
  useExportDataSheet,
} from '../../hooks/use-datasheet-mutations';

const { Title } = Typography;

export default function DataSheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('datasheet');

  const { sheet, series, loading, error } = useDataSheetDetail(id);
  const { updateValue } = useUpdateSeriesValue();
  const { addSeries, loading: addSeriesLoading } = useAddSeries();
  const { deleteSeries } = useDeleteSeries();
  const { addPeriod, loading: addPeriodLoading } = useAddPeriod();
  const { deletePeriod } = useDeletePeriod();
  const { insertPeriod, loading: insertPeriodLoading } = useInsertPeriod();
  const { insertSeries, loading: insertSeriesLoading } = useInsertSeries();
  const { deleteSeriesByName } = useDeleteSeriesByName();
  const { renameSeries } = useRenameSeries();
  const { exportSheet } = useExportDataSheet();

  // Index for O(1) lookups during cell edits
  const seriesMap = useMemo(
    () => new Map(series.map((s) => [s.id, s])),
    [series],
  );

  const handleCellEdit = useCallback(
    (seriesId: string, period: string, value: number | null) => {
      const row = seriesMap.get(seriesId);
      if (!row) return;
      updateValue(seriesId, period, value, row.values);
    },
    [seriesMap, updateValue],
  );

  const handleAddSeries = useCallback(() => {
    if (!id) return;
    addSeries(id, t('new_series_name'));
  }, [id, addSeries, t]);

  const handleAddPeriod = useCallback(
    (periodName: string) => {
      if (!id) return;
      addPeriod(id, periodName);
    },
    [id, addPeriod],
  );

  const handleExport = useCallback(() => {
    if (!id) return;
    exportSheet(id);
  }, [id, exportSheet]);

  const handleDeleteSeries = useCallback(
    (seriesId: string) => deleteSeries(seriesId),
    [deleteSeries],
  );

  const handleDeletePeriod = useCallback(
    (periodName: string) => {
      if (!id) return;
      deletePeriod(id, periodName);
    },
    [id, deletePeriod],
  );

  const handleInsertPeriod = useCallback(
    (periodName: string, index: number) => {
      if (!id) return;
      insertPeriod(id, periodName, index);
    },
    [id, insertPeriod],
  );

  const handleInsertSeries = useCallback(
    (name: string, index: number) => {
      if (!id) return;
      insertSeries(id, name, index);
    },
    [id, insertSeries],
  );

  const handleDeleteSeriesByName = useCallback(
    (name: string) => {
      if (!id) return;
      deleteSeriesByName(id, name);
    },
    [id, deleteSeriesByName],
  );

  const handleRenameSeries = useCallback(
    (seriesId: string, newName: string) => renameSeries(seriesId, newName),
    [renameSeries],
  );

  const isReady = sheet?.status === 'ready';
  const mutationLoading =
    addSeriesLoading || addPeriodLoading || insertPeriodLoading || insertSeriesLoading;

  return (
    <Layout className="!min-h-screen">
      <Sidebar />
      <Layout className="!ml-[60px]">
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => navigate('/data-sheets')}
            >
              {t('back_to_list')}
            </Button>
          </div>

          <Space direction="vertical" className="w-full" size="middle">
            <Title level={4} className="!m-0">
              {sheet?.name ?? t('detail_title')}
            </Title>

            {loading && <Skeleton active paragraph={{ rows: 8 }} />}

            {error && !loading && (
              <Alert type="error" message={t('load_error')} showIcon />
            )}

            {!loading && !error && sheet && !isReady && (
              <Result status="info" title={t('sheet_not_ready')} />
            )}

            {!loading && !error && isReady && (
              <>
                <TableToolbar
                  datasheetId={id!}
                  onAddSeries={handleAddSeries}
                  onAddPeriod={handleAddPeriod}
                  onExport={handleExport}
                  existingPeriods={sheet!.periodHeaders ?? []}
                  loading={mutationLoading}
                />
                {sheet!.templateType === 'department' ? (
                  <DepartmentDataTable
                    series={series}
                    periodHeaders={sheet!.periodHeaders ?? []}
                    onCellEdit={handleCellEdit}
                    onDeletePeriod={handleDeletePeriod}
                    onInsertPeriod={handleInsertPeriod}
                    onInsertSeries={handleInsertSeries}
                    onDeleteSeriesByName={handleDeleteSeriesByName}
                  />
                ) : (
                  <DataTable
                    series={series}
                    periodHeaders={sheet!.periodHeaders ?? []}
                    onCellEdit={handleCellEdit}
                    onDeleteSeries={handleDeleteSeries}
                    onInsertSeries={handleInsertSeries}
                    onDeletePeriod={handleDeletePeriod}
                    onInsertPeriod={handleInsertPeriod}
                    onRenameSeries={handleRenameSeries}
                  />
                )}
              </>
            )}
          </Space>
        </div>
      </Layout>
    </Layout>
  );
}
