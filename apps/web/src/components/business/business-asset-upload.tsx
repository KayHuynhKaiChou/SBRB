import React from 'react';
import {
  EBusinessAssetKind,
  BUSINESS_IMAGE_MAX_MB,
  BUSINESS_DOC_MAX_MB,
} from '@sbrb/shared-constants';
import { useBusinessAssetUpload } from '../../hooks/use-business-asset-upload';
import { AppUpload, type TAppUploadVariant } from '../common/app-upload';

interface IBusinessAssetUploadProps {
  kind: EBusinessAssetKind;
  /** Current stored value (public URL for images, path/URL for licence). Injected by Form.Item. */
  value?: string | null;
  /** Injected by Form.Item; called with the uploaded URL/path. */
  onChange?: (url: string) => void;
  businessId?: string;
  /** Read-only mode — disables picking/clearing (view-only). */
  disabled?: boolean;
}

/** Map asset kind → AppUpload visual variant. */
const KIND_VARIANT: Record<EBusinessAssetKind, TAppUploadVariant> = {
  [EBusinessAssetKind.AVATAR]: 'avatar',
  [EBusinessAssetKind.LOGO]: 'avatar',
  [EBusinessAssetKind.BANNER]: 'banner',
  [EBusinessAssetKind.LICENSE]: 'doc',
};

/**
 * Thin adapter: wires the business-asset signed-URL upload flow into the shared
 * <AppUpload> control. Used by the KYB form (logo / banner / licence).
 */
export function BusinessAssetUpload({
  kind,
  value,
  onChange,
  businessId,
  disabled,
}: IBusinessAssetUploadProps) {
  const { upload } = useBusinessAssetUpload(businessId);
  const isDoc = kind === EBusinessAssetKind.LICENSE;

  return (
    <AppUpload
      value={value}
      onChange={onChange}
      disabled={disabled}
      variant={KIND_VARIANT[kind]}
      maxMb={isDoc ? BUSINESS_DOC_MAX_MB : BUSINESS_IMAGE_MAX_MB}
      upload={(file) => upload(kind, file).then((r) => r?.url ?? null)}
    />
  );
}
