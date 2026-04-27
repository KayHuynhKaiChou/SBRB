import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppMutation, useNotify } from '@sbrb/shared-apollo-client';
import { API_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../store/auth.store';
import {
  ADD_SERIES_MUTATION,
  DELETE_SERIES_MUTATION,
  ADD_PERIOD_MUTATION,
  DELETE_PERIOD_MUTATION,
  RENAME_SERIES_MUTATION,
  INSERT_PERIOD_MUTATION,
  INSERT_SERIES_MUTATION,
  DELETE_SERIES_BY_NAME_MUTATION,
  ADD_DEPARTMENT_TO_DATASHEET_MUTATION,
  DELETE_DEPARTMENT_FROM_DATASHEET_MUTATION,
  TOGGLE_DATASHEET_STATUS_MUTATION,
} from '../graphql/datasheet.operations';
import { UPDATE_DEPARTMENT_MUTATION } from '../graphql/department.operations';

const REFETCH = ['DataSheetDetail'];

/** Add a new data series (row) to the datasheet */
export function useAddSeries() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(ADD_SERIES_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('add_success'),
    fallbackError: t('edit_error'),
  });

  const addSeries = async (datasheetId: string, name: string) => {
    await mutate({ variables: { input: { datasheetId, name } } }).catch(() => undefined);
  };

  return { addSeries, loading };
}

/** Delete a data series (row) by id */
export function useDeleteSeries() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(DELETE_SERIES_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('delete_success'),
    fallbackError: t('edit_error'),
  });

  const deleteSeries = async (seriesId: string) => {
    await mutate({ variables: { seriesId } }).catch(() => undefined);
  };

  return { deleteSeries, loading };
}

/** Add a new period column to the datasheet */
export function useAddPeriod() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(ADD_PERIOD_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('add_success'),
    fallbackError: t('edit_error'),
  });

  const addPeriod = async (datasheetId: string, periodName: string) => {
    await mutate({ variables: { input: { datasheetId, periodName } } }).catch(() => undefined);
  };

  return { addPeriod, loading };
}

/** Insert a new period column at a specific index (0-based). */
export function useInsertPeriod() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(INSERT_PERIOD_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('add_success'),
    fallbackError: t('edit_error'),
  });

  const insertPeriod = async (datasheetId: string, periodName: string, index: number) => {
    await mutate({ variables: { input: { datasheetId, periodName, index } } }).catch(
      () => undefined,
    );
  };

  return { insertPeriod, loading };
}

/** Delete a period column from all series in the datasheet */
export function useDeletePeriod() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(DELETE_PERIOD_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('delete_success'),
    fallbackError: t('edit_error'),
  });

  const deletePeriod = async (datasheetId: string, periodName: string) => {
    await mutate({ variables: { datasheetId, periodName } }).catch(() => undefined);
  };

  return { deletePeriod, loading };
}

/** Insert a new data series (row) at a specific index (0-based). */
export function useInsertSeries() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(INSERT_SERIES_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('add_success'),
    fallbackError: t('edit_error'),
  });

  const insertSeries = useCallback(
    async (datasheetId: string, name: string, index: number) => {
      await mutate({ variables: { input: { datasheetId, name, index } } }).catch(() => undefined);
    },
    [mutate],
  );

  return { insertSeries, loading };
}

/** Delete all DataSeries rows matching a seriesName (department template) */
export function useDeleteSeriesByName() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(DELETE_SERIES_BY_NAME_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('delete_success'),
    fallbackError: t('edit_error'),
  });

  const deleteSeriesByName = useCallback(
    async (datasheetId: string, name: string) => {
      await mutate({ variables: { datasheetId, name } }).catch(() => undefined);
    },
    [mutate],
  );

  return { deleteSeriesByName, loading };
}

/** Add a new department to a department-template datasheet (appears last). */
export function useAddDepartmentToDatasheet() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(ADD_DEPARTMENT_TO_DATASHEET_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('add_success'),
    fallbackError: t('edit_error'),
  });

  const addDepartment = useCallback(
    async (datasheetId: string, name: string) => {
      await mutate({ variables: { input: { datasheetId, name } } }).catch(() => undefined);
    },
    [mutate],
  );

  return { addDepartment, loading };
}

/** Delete a department from a department-template datasheet (rejects if ≤2 remain). */
export function useDeleteDepartmentFromDatasheet() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(DELETE_DEPARTMENT_FROM_DATASHEET_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('delete_success'),
    fallbackError: t('edit_error'),
  });

  const deleteDepartment = useCallback(
    async (datasheetId: string, departmentId: string) => {
      await mutate({ variables: { datasheetId, departmentId } }).catch(() => undefined);
    },
    [mutate],
  );

  return { deleteDepartment, loading };
}

/** Toggle a datasheet between 'active' and 'inactive'. Optimistic update so the
 *  Switch flips instantly; Apollo cache normalizes by id, so the list row updates
 *  without a full refetch. */
export function useToggleDataSheetStatus() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(TOGGLE_DATASHEET_STATUS_MUTATION, {
    notifyOnSuccess: false,
    fallbackError: t('edit_error'),
  });

  const toggleStatus = useCallback(
    async (id: string, currentStatus: string) => {
      const next = currentStatus === 'active' ? 'inactive' : 'active';
      await mutate({
        variables: { id },
        optimisticResponse: {
          toggleDataSheetStatus: {
            __typename: 'DataSheetType',
            id,
            status: next,
          },
        },
      }).catch(() => undefined);
    },
    [mutate],
  );

  return { toggleStatus, loading };
}

/** Rename a department (column group) — reuses the general updateDepartment mutation. */
export function useRenameDepartment() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(UPDATE_DEPARTMENT_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('rename_success'),
    fallbackError: t('edit_error'),
  });

  const renameDepartment = useCallback(
    async (departmentId: string, name: string) => {
      await mutate({ variables: { id: departmentId, input: { name } } }).catch(() => undefined);
    },
    [mutate],
  );

  return { renameDepartment, loading };
}

/** Rename a data series */
export function useRenameSeries() {
  const { t } = useTranslation('datasheet');
  const [mutate, { loading }] = useAppMutation(RENAME_SERIES_MUTATION, {
    refetchQueries: REFETCH,
    fallbackSuccess: t('rename_success'),
    fallbackError: t('edit_error'),
  });

  const renameSeries = async (seriesId: string, name: string) => {
    await mutate({ variables: { seriesId, name } }).catch(() => undefined);
  };

  return { renameSeries, loading };
}

/** Trigger browser download of the datasheet as an Excel file */
export function useExportDataSheet() {
  const { t } = useTranslation('datasheet');
  const notify = useNotify();

  const exportSheet = async (datasheetId: string) => {
    try {
      const token = useAuthStore.getState().accessToken ?? '';
      const res = await fetch(API_ROUTES.DATA_SHEET.EXPORT(datasheetId), {
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
      notify.success(t('export_success'));
    } catch {
      notify.error(t('edit_error'));
    }
  };

  return { exportSheet };
}
