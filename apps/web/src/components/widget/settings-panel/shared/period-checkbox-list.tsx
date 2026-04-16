import React from 'react';
import { Checkbox, Divider, Typography } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_WIDGET_DATA_LINK_MUTATION, WIDGET_CHART_DATA_QUERY } from '../../../../graphql/widget-config.operations';

const { Text } = Typography;

interface IPeriodCheckboxListProps {
  widgetId: string;
  selectedPeriods: string[] | null;
  selectedSeries: string[];
  dataSheetId: string;
}

export function PeriodCheckboxList({ widgetId, selectedPeriods, selectedSeries, dataSheetId }: IPeriodCheckboxListProps) {
  const { data } = useQuery(WIDGET_CHART_DATA_QUERY, {
    variables: { widgetId },
    fetchPolicy: 'cache-first',
  });
  const [updateLink] = useMutation(UPDATE_WIDGET_DATA_LINK_MUTATION, {
    refetchQueries: [{ query: WIDGET_CHART_DATA_QUERY, variables: { widgetId } }],
    awaitRefetchQueries: true,
  });

  const chartData = data?.widgetChartData;
  const allPeriods = chartData?.allPeriods || [];

  if (!allPeriods || allPeriods.length === 0) return null;

  const handleChange = (checkedValues: any[]) => {
    updateLink({
      variables: {
        id: widgetId,
        input: {
          dataSheetId: dataSheetId,
          selectedSeries: selectedSeries,
          selectedPeriods: checkedValues.length === allPeriods.length ? null : checkedValues,
        },
      },
    });
  };

  const currentValues = selectedPeriods || allPeriods;

  return (
    <div className="mt-4">
      <Text type="secondary" className="!text-[11px] !block !mb-2">Bộ lọc Thời gian</Text>
      <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
        <Checkbox.Group 
          className="flex flex-col gap-1"
          options={allPeriods} 
          value={currentValues} 
          onChange={handleChange} 
        />
      </div>
    </div>
  );
}
