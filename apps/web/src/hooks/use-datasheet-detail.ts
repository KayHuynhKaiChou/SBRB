import { useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import {
  DATASHEET_DETAIL_QUERY,
  UPDATE_SERIES_VALUE_MUTATION,
  UPSERT_CELL_VALUE_MUTATION,
} from '../graphql/datasheet.operations';
import type { IDataSeriesRow, IDataSheetDetail } from '@sbrb/shared-types';

export type { IDataSeriesRow, IDataSheetDetail };

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
  const [mutate, { loading }] = useAppMutation(UPDATE_SERIES_VALUE_MUTATION, {
    notifyOnSuccess: false,
    fallbackError: t('edit_error'),
  });

  const updateValue = async (
    seriesId: string,
    period: string,
    value: number | null,
    currentValues: Record<string, number | null>,
  ) => {
    await mutate({
      variables: { input: { seriesId, period, value } },
      optimisticResponse: {
        updateSeriesValue: {
          __typename: 'DataSeriesType',
          id: seriesId,
          values: { ...currentValues, [period]: value },
        },
      },
    }).catch(() => undefined);
  };

  return { updateValue, loading };
}

/**
 * Upsert a cell value in department-template datasheets — handles both:
 *   - Existing (dept, seriesName) row → JSONB update of values[period]
 *   - Missing row → creates new DataSeries with rowIndex inherited from siblings
 * Refetches DataSheetDetail because a newly-created row must appear in the list.
 */
export function useUpsertCellValue() {
  const { t } = useTranslation('datasheet');
  const [mutate] = useAppMutation(UPSERT_CELL_VALUE_MUTATION, {
    refetchQueries: ['DataSheetDetail'],
    notifyOnSuccess: false,
    fallbackError: t('edit_error'),
  });

  const upsertValue = useCallback(
    async (
      datasheetId: string,
      departmentId: string,
      seriesName: string,
      period: string,
      value: number | null,
    ) => {
      await mutate({
        variables: { input: { datasheetId, departmentId, seriesName, period, value } },
      }).catch(() => undefined);
    },
    [mutate],
  );

  return { upsertValue };
}
