import React, { useState, useCallback, useMemo } from 'react';
import { Table, Input, Checkbox, Button, Space, Empty } from 'antd';
import { SearchOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { DATA_SERIES_QUERY } from '../../graphql/datasheet.operations';
import type { IDataSeriesDto } from '../../hooks/use-datasheet';
import { useDebounce } from '../../hooks/use-debounce';

interface ISeriesTableProps {
  datasheetId: string | null;
  selectedSeries: string[];
  selectedPeriods: string[] | null;
  periodHeaders: string[];
  onSelectionChange: (series: string[], periods: string[] | null) => void;
}

type SortMode = 'name' | 'none';

export function SeriesTable({
  datasheetId,
  selectedSeries,
  selectedPeriods,
  periodHeaders,
  onSelectionChange,
}: ISeriesTableProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sortMode, setSortMode] = useState<SortMode>('none');

  const { data, loading } = useQuery(DATA_SERIES_QUERY, {
    variables: { datasheetId, search: debouncedSearch || undefined },
    skip: !datasheetId,
    fetchPolicy: 'cache-and-network',
  });

  const rawSeries: IDataSeriesDto[] = data?.dataSeries ?? [];

  const sortedSeries = [...rawSeries].sort((a, b) => {
    if (sortMode === 'name') return a.seriesName.localeCompare(b.seriesName);
    return 0;
  });

  const allIds = useMemo(() => sortedSeries.map((s) => s.id), [sortedSeries]);
  const allSelected = useMemo(
    () => allIds.length > 0 && allIds.every((id) => selectedSeries.includes(id)),
    [allIds, selectedSeries],
  );
  const someSelected = useMemo(
    () => allIds.some((id) => selectedSeries.includes(id)) && !allSelected,
    [allIds, selectedSeries, allSelected],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      onSelectionChange(checked ? allIds : [], selectedPeriods);
    },
    [allIds, selectedPeriods, onSelectionChange],
  );

  const handleToggleSeries = useCallback(
    (id: string, checked: boolean) => {
      const next = checked
        ? [...selectedSeries, id]
        : selectedSeries.filter((s) => s !== id);
      onSelectionChange(next, selectedPeriods);
    },
    [selectedSeries, selectedPeriods, onSelectionChange],
  );

  const handleTogglePeriod = useCallback(
    (period: string, checked: boolean) => {
      const current = selectedPeriods ?? periodHeaders;
      const next = checked
        ? [...current, period]
        : current.filter((p) => p !== period);
      onSelectionChange(selectedSeries, next.length === 0 ? null : next);
    },
    [selectedPeriods, periodHeaders, selectedSeries, onSelectionChange],
  );

  if (!datasheetId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Empty description="Chọn bộ dữ liệu ở bên trái" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const columns = [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      width: 40,
      render: (_: unknown, record: IDataSeriesDto) => (
        <Checkbox
          checked={selectedSeries.includes(record.id)}
          onChange={(e) => handleToggleSeries(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: 'Tên chuỗi',
      dataIndex: 'seriesName',
      key: 'seriesName',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <Space>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm chuỗi dữ liệu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          style={{ width: 200 }}
        />
        <Button
          size="small"
          icon={<SortAscendingOutlined />}
          type={sortMode === 'name' ? 'primary' : 'default'}
          onClick={() => setSortMode((m) => (m === 'name' ? 'none' : 'name'))}
        >
          A→Z
        </Button>
      </Space>

      {/* Period filter */}
      {periodHeaders.length > 0 && (
        <div style={{ maxHeight: 60, overflowX: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {periodHeaders.map((period) => {
            const checked = selectedPeriods === null || selectedPeriods.includes(period);
            return (
              <Checkbox
                key={period}
                checked={checked}
                onChange={(e) => handleTogglePeriod(period, e.target.checked)}
                style={{ fontSize: 11 }}
              >
                {period}
              </Checkbox>
            );
          })}
        </div>
      )}

      <Table
        dataSource={sortedSeries}
        columns={columns}
        loading={loading}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 300 }}
        style={{ flex: 1 }}
      />
    </div>
  );
}
