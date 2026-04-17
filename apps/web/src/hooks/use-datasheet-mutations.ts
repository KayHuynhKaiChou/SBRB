import { useMutation } from '@apollo/client';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth.store';
import {
  ADD_SERIES_MUTATION,
  DELETE_SERIES_MUTATION,
  ADD_PERIOD_MUTATION,
  DELETE_PERIOD_MUTATION,
  RENAME_SERIES_MUTATION,
  INSERT_PERIOD_MUTATION,
} from '../graphql/datasheet.operations';

const REFETCH = ['DataSheetDetail'];

/** Add a new data series (row) to the datasheet */
export function useAddSeries() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useMutation(ADD_SERIES_MUTATION, {
    refetchQueries: REFETCH,
  });

  const addSeries = async (datasheetId: string, name: string) => {
    try {
      await mutate({ variables: { input: { datasheetId, name } } });
      message.success(t('add_success'));
    } catch {
      message.error(t('edit_error'));
    }
  };

  return { addSeries, loading };
}

/** Delete a data series (row) by id */
export function useDeleteSeries() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useMutation(DELETE_SERIES_MUTATION, {
    refetchQueries: REFETCH,
  });

  const deleteSeries = async (seriesId: string) => {
    try {
      await mutate({ variables: { seriesId } });
      message.success(t('delete_success'));
    } catch {
      message.error(t('edit_error'));
    }
  };

  return { deleteSeries, loading };
}

/** Add a new period column to the datasheet */
export function useAddPeriod() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useMutation(ADD_PERIOD_MUTATION, {
    refetchQueries: REFETCH,
  });

  const addPeriod = async (datasheetId: string, periodName: string) => {
    try {
      await mutate({ variables: { input: { datasheetId, periodName } } });
      message.success(t('add_success'));
    } catch {
      message.error(t('edit_error'));
    }
  };

  return { addPeriod, loading };
}

/** Insert a new period column at a specific index (0-based). */
export function useInsertPeriod() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useMutation(INSERT_PERIOD_MUTATION, {
    refetchQueries: REFETCH,
  });

  const insertPeriod = async (datasheetId: string, periodName: string, index: number) => {
    try {
      await mutate({ variables: { input: { datasheetId, periodName, index } } });
      message.success(t('add_success'));
    } catch {
      message.error(t('edit_error'));
    }
  };

  return { insertPeriod, loading };
}

/** Delete a period column from all series in the datasheet */
export function useDeletePeriod() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useMutation(DELETE_PERIOD_MUTATION, {
    refetchQueries: REFETCH,
  });

  const deletePeriod = async (datasheetId: string, periodName: string) => {
    try {
      await mutate({ variables: { datasheetId, periodName } });
      message.success(t('delete_success'));
    } catch {
      message.error(t('edit_error'));
    }
  };

  return { deletePeriod, loading };
}

/** Rename a data series */
export function useRenameSeries() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useMutation(RENAME_SERIES_MUTATION, {
    refetchQueries: REFETCH,
  });

  const renameSeries = async (seriesId: string, name: string) => {
    try {
      await mutate({ variables: { seriesId, name } });
      message.success(t('rename_success'));
    } catch {
      message.error(t('edit_error'));
    }
  };

  return { renameSeries, loading };
}

/** Trigger browser download of the datasheet as an Excel file */
export function useExportDataSheet() {
  const { t } = useTranslation('datasheet');

  const exportSheet = async (datasheetId: string) => {
    try {
      // Read freshest token at call time (not stale render-time closure)
      const token = useAuthStore.getState().accessToken ?? '';
      const res = await fetch(`/api/v1/data-sheets/${datasheetId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      a.download = match?.[1] ?? 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(t('export_success'));
    } catch {
      message.error(t('edit_error'));
    }
  };

  return { exportSheet };
}
