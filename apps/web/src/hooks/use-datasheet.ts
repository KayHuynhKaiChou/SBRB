import { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { message } from 'antd';
import { apiClient } from '../services/api-client';
import {
  DATA_SHEETS_QUERY,
  IMPORT_PROGRESS_SUBSCRIPTION,
  RENAME_DATASHEET_MUTATION,
  DELETE_DATASHEET_MUTATION,
} from '../graphql/datasheet.operations';

export interface IDataSheetDto {
  id: string;
  name: string;
  status: string;
  periodHeaders: string[];
  seriesCount: number;
  periodCount: number;
  originalFilename: string | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDataSeriesDto {
  id: string;
  seriesName: string;
  dataSheetId: string;
  rowIndex: number;
}

export interface IImportProgress {
  datasheetId: string;
  percent: number;
  status: string;
  errorMessage?: string;
}

/** Fetch all datasheets for a business, optionally filtered by department */
export function useDataSheets(businessId: string, departmentId?: string | null) {
  const { data, loading, error, refetch } = useQuery(DATA_SHEETS_QUERY, {
    variables: { businessId, ...(departmentId ? { departmentId } : {}) },
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

/** Upload a file and track import progress via subscription */
export function useImportDataSheet(businessId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDatasheetId, setUploadedDatasheetId] = useState<string | null>(null);
  const [progress, setProgress] = useState<IImportProgress | null>(null);

  // Subscribe to progress updates after upload
  useSubscription(IMPORT_PROGRESS_SUBSCRIPTION, {
    variables: { datasheetId: uploadedDatasheetId },
    skip: !uploadedDatasheetId,
    onData: ({ data }) => {
      const p = data?.data?.importProgress as IImportProgress | undefined;
      if (p) setProgress(p);
    },
  });

  const upload = async (file: File, name: string, departmentId?: string | null): Promise<string> => {
    setIsUploading(true);
    setProgress(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (departmentId) formData.append('departmentId', departmentId);

    try {
      const result = await apiClient.upload<{ datasheetId: string }>(
        `/api/v1/businesses/${businessId}/data-sheets/upload`,
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
  const [deleteMutation, { loading }] = useMutation(DELETE_DATASHEET_MUTATION);

  const deleteDataSheet = async (id: string) => {
    try {
      await deleteMutation({ variables: { id } });
    } catch {
      message.error('Xóa dữ liệu thất bại');
      throw new Error('Xóa dữ liệu thất bại');
    }
  };

  return { deleteDataSheet, loading };
}

/** Rename datasheet via GQL mutation */
export function useRenameDataSheet() {
  const [renameMutation, { loading }] = useMutation(RENAME_DATASHEET_MUTATION);

  const renameDataSheet = async (id: string, name: string) => {
    try {
      await renameMutation({ variables: { id, input: { name } } });
    } catch {
      message.error('Đổi tên thất bại');
      throw new Error('Đổi tên thất bại');
    }
  };

  return { renameDataSheet, loading };
}

/** Download Excel template */
export function useDownloadTemplate() {
  const [loading, setLoading] = useState(false);

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
      message.error('Tải mẫu Excel thất bại');
    } finally {
      setLoading(false);
    }
  };

  return { downloadTemplate, loading };
}
