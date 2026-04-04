import { useQuery, useMutation } from '@apollo/client';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DATASHEET_DETAIL_QUERY,
  UPDATE_SERIES_VALUE_MUTATION,
} from '../graphql/datasheet.operations';

export interface IDataSeriesRow {
  id: string;
  seriesName: string;
  rowIndex: number;
  values: Record<string, number | null>;
}

export interface IDataSheetDetail {
  id: string;
  name: string;
  periodHeaders: string[];
  status: string;
  periodType: string;
  seriesCount: number;
  periodCount: number;
}

/** Fetch datasheet detail with all series and their values */
export function useDataSheetDetail(id: string | undefined) {
  const { data, loading, error } = useQuery(DATASHEET_DETAIL_QUERY, {
    variables: { id },
    skip: !id,
  });

  return {
    sheet: data?.dataSheet as IDataSheetDetail | undefined,
    series: (data?.dataSeries ?? []) as IDataSeriesRow[],
    loading,
    error,
  };
}

/** Mutation to update a single cell value in a data series */
export function useUpdateSeriesValue() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useMutation(UPDATE_SERIES_VALUE_MUTATION);

  const updateValue = async (
    seriesId: string,
    period: string,
    value: number | null,
    currentValues: Record<string, number | null>,
  ) => {
    try {
      await mutate({
        variables: { input: { seriesId, period, value } },
        optimisticResponse: {
          updateSeriesValue: {
            __typename: 'DataSeriesType',
            id: seriesId,
            values: { ...currentValues, [period]: value },
          },
        },
      });
      message.success(t('edit_success'));
    } catch {
      message.error(t('edit_error'));
    }
  };

  return { updateValue, loading };
}
