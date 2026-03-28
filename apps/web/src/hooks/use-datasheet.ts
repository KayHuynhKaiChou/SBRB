import { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { message } from 'antd';
import { useAuthStore } from '../store/auth.store';
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

/** Fetch all datasheets for a business */
export function useDataSheets(businessId: string) {
  const { data, loading, error, refetch } = useQuery(DATA_SHEETS_QUERY, {
    variables: { businessId },
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

  const upload = async (file: File, name: string): Promise<string> => {
    setIsUploading(true);
    setProgress(null);
    const accessToken = useAuthStore.getState().accessToken;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    try {
      const res = await fetch(`/api/v1/businesses/${businessId}/data-sheets/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload thất bại' }));
        throw new Error(err.message ?? 'Upload thất bại');
      }

      const result = await res.json();
      setUploadedDatasheetId(result.datasheetId);
      return result.datasheetId as string;
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
    const accessToken = useAuthStore.getState().accessToken;
    try {
      const res = await fetch(`/api/v1/data-sheets/${datasheetId}/reimport`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Reimport thất bại');
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
    const accessToken = useAuthStore.getState().accessToken;
    try {
      const res = await fetch('/api/v1/data-sheets/export-template', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Tải mẫu thất bại');

      const blob = await res.blob();
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
