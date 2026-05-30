import React, { useState, useCallback, useMemo } from 'react';
import { Table, Input, Checkbox, Button, Space, Empty, Typography } from 'antd';
import { SearchOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { DATA_SERIES_QUERY } from '../../graphql/datasheet.operations';
import type { IDataSeriesDto } from '../../hooks/use-datasheet';
import { useDebounce } from '@uidotdev/usehooks';

const { Text } = Typography;

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
      <div className="flex items-center justify-center h-full">
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
      ellipsis: { showTitle: false },
      render: (name: string) => (
        <Text ellipsis={{ tooltip: name }} className="block">
          {name}
        </Text>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full gap-2">
      <Space>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm chuỗi dữ liệu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          className="!w-[200px]"
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
        <div className="max-h-[60px] overflow-x-auto flex gap-2 flex-wrap">
          {periodHeaders.map((period) => {
            const checked = selectedPeriods === null || selectedPeriods.includes(period);
            return (
              <Checkbox
                key={period}
                checked={checked}
                onChange={(e) => handleTogglePeriod(period, e.target.checked)}
                className="!text-[11px]"
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
        className="!flex-1"
      />
    </div>
  );
}
