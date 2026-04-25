import { useState } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { apiClient } from '../services/api-client';
import { useAppMutation, useNotify } from '@sbrb/shared-apollo-client';
import {
  DATA_SHEETS_QUERY,
  DATA_SERIES_QUERY,
  IMPORT_PROGRESS_SUBSCRIPTION,
  RENAME_DATASHEET_MUTATION,
  DELETE_DATASHEET_MUTATION,
} from '../graphql/datasheet.operations';

export interface IUploaderInfo {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export type TemplateType = 'simple' | 'department' | 'pnl';
export type DataSheetStatus = 'active' | 'inactive';
export type DataSheetSortField = 'widgetCount' | 'importedAt' | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';

export interface IListDataSheetsFilter {
  status?: DataSheetStatus[];
  templateType?: TemplateType[];
  sortBy?: DataSheetSortField;
  sortOrder?: SortOrder;
}

export interface IDataSheetDto {
  id: string;
  name: string;
  status: string;
  templateType: TemplateType;
  periodHeaders: string[];
  widgetCount: number;
  originalFilename: string | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
  uploader: IUploaderInfo | null;
}

export interface IDataSeriesDto {
  id: string;
  seriesName: string;
  dataSheetId: string;
  rowIndex: number;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
}

export interface IImportProgress {
  datasheetId: string;
  percent: number;
  status: string;
  errorMessage?: string;
}

/** Fetch all datasheets for a business. BE handles filter + sort. */
export function useDataSheets(businessId: string, filter?: IListDataSheetsFilter) {
  const { data, loading, error, refetch } = useQuery(DATA_SHEETS_QUERY, {
    variables: { businessId, filter },
    skip: !businessId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    dataSheets: (data?.dataSheets ?? []) as IDataSheetDto[],
    loading,
    error,
    refetch,
  };
}

export function useDataSeries(datasheetId: string | undefined | null) {
  const { data, loading, error, refetch } = useQuery(DATA_SERIES_QUERY, {
    variables: { datasheetId },
    skip: !datasheetId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    dataSeries: (data?.dataSeries ?? []) as IDataSeriesDto[],
    loading,
    error,
    refetch,
  };
}

/** Upload a file and track import progress via subscription */
export function useImportDataSheet(businessId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDatasheetId, setUploadedDatasheetId] = useState<string | null>(null);
  const [progress, setProgress] = useState<IImportProgress | null>(null);

  useSubscription(IMPORT_PROGRESS_SUBSCRIPTION, {
    variables: { datasheetId: uploadedDatasheetId },
    skip: !uploadedDatasheetId,
    onData: ({ data }) => {
      const p = data?.data?.importProgress as IImportProgress | undefined;
      if (p) setProgress(p);
    },
  });

  const upload = async (
    file: File,
    name: string,
    departmentId?: string | null,
    templateType: string = 'simple',
  ): Promise<string> => {
    setIsUploading(true);
    setProgress(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (departmentId) formData.append('departmentId', departmentId);

    const urlParams = new URLSearchParams();
    if (templateType) urlParams.append('templateType', templateType);
    if (departmentId) urlParams.append('departmentId', departmentId);

    try {
      const result = await apiClient.upload<{ datasheetId: string }>(
        `/api/v1/businesses/${businessId}/data-sheets/upload?${urlParams.toString()}`,
        formData,
      );
      setUploadedDatasheetId(result.datasheetId);
      return result.datasheetId;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, progress, isUploading, uploadedDatasheetId };
}

/** Trigger reimport for an existing datasheet */
export function useReimport() {
  const [loading, setLoading] = useState(false);

  const reimport = async (datasheetId: string) => {
    setLoading(true);
    try {
      await apiClient.post(`/api/v1/data-sheets/${datasheetId}/reimport`);
    } finally {
      setLoading(false);
    }
  };

  return { reimport, loading };
}

/** Delete datasheet via GQL mutation */
export function useDeleteDataSheet() {
  const [deleteMutation, { loading }] = useAppMutation(DELETE_DATASHEET_MUTATION, {
    notifyOnSuccess: false,
    fallbackError: { vi: 'Xóa dữ liệu thất bại', en: 'Failed to delete data' },
  });

  const deleteDataSheet = async (id: string) => {
    const result = await deleteMutation({ variables: { id } });
    if (result.errors) throw new Error('Xóa dữ liệu thất bại');
  };

  return { deleteDataSheet, loading };
}

/** Rename datasheet via GQL mutation */
export function useRenameDataSheet() {
  const [renameMutation, { loading }] = useAppMutation(RENAME_DATASHEET_MUTATION, {
    notifyOnSuccess: false,
    fallbackError: { vi: 'Đổi tên thất bại', en: 'Failed to rename' },
  });

  const renameDataSheet = async (id: string, name: string) => {
    const result = await renameMutation({ variables: { id, input: { name } } });
    if (result.errors) throw new Error('Đổi tên thất bại');
  };

  return { renameDataSheet, loading };
}

/** Download Excel template */
export function useDownloadTemplate() {
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const downloadTemplate = async () => {
    setLoading(true);
    try {
      const blob = await apiClient.getBlob('/api/v1/data-sheets/export-template');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify.error({ vi: 'Tải mẫu Excel thất bại', en: 'Failed to download Excel template' });
    } finally {
      setLoading(false);
    }
  };

  return { downloadTemplate, loading };
}
