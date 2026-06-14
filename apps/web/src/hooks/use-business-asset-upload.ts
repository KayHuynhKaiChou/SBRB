import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  BUSINESS_IMAGE_MAX_MB,
  BUSINESS_DOC_MAX_MB,
  EBusinessAssetKind,
} from '@sbrb/shared-constants';
import { GET_BUSINESS_ASSET_UPLOAD_URL_MUTATION } from '../graphql/business.operations';
import { uploadToSignedUrl } from '../lib/supabase-upload';

interface IUploadResult {
  /** Public URL (logo/banner) or storage path (private licence). */
  url: string;
}

/**
 * Shared business-asset upload flow: request signed URL → PUT file → return stored URL/path.
 * `businessId` optional — omit during signup (path keyed by owner server-side).
 */
export function useBusinessAssetUpload(businessId?: string) {
  const { t } = useTranslation('business');
  const [getUrl] = useMutation(GET_BUSINESS_ASSET_UPLOAD_URL_MUTATION);
  const [uploadingKind, setUploadingKind] = useState<EBusinessAssetKind | null>(null);

  /** Validate size by kind; returns true if OK. */
  const validate = (kind: EBusinessAssetKind, file: File): boolean => {
    const isDoc = kind === EBusinessAssetKind.LICENSE;
    const maxMb = isDoc ? BUSINESS_DOC_MAX_MB : BUSINESS_IMAGE_MAX_MB;
    if (file.size > maxMb * 1024 * 1024) {
      void message.error(t('asset_too_large', { mb: maxMb }));
      return false;
    }
    return true;
  };

  const upload = async (
    kind: EBusinessAssetKind,
    file: File,
  ): Promise<IUploadResult | null> => {
    if (!validate(kind, file)) return null;
    setUploadingKind(kind);
    try {
      const { data } = await getUrl({
        variables: { input: { kind, filename: file.name }, businessId },
      });
      const signed = data.getBusinessAssetUploadUrl;
      await uploadToSignedUrl(signed.uploadUrl, signed.token, file);
      return { url: signed.publicUrl };
    } catch (err) {
      void message.error(
        err instanceof Error ? err.message : t('asset_upload_failed'),
      );
      return null;
    } finally {
      setUploadingKind(null);
    }
  };

  return { upload, uploadingKind };
}
