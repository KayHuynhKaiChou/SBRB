import React, { useState } from 'react';
import { Upload, Button, Image, message } from 'antd';
import type { UploadProps } from 'antd';
import { RiUploadCloud2Line, RiImageLine, RiFileTextLine, RiDeleteBinLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';

export type TAppUploadVariant = 'avatar' | 'banner' | 'doc';

interface IAppUploadProps {
  /** Current stored URL/path. Injected by antd Form.Item. */
  value?: string | null;
  /** Injected by Form.Item; called with the uploaded URL/path (empty string = cleared). */
  onChange?: (url: string) => void;
  /** Performs the actual upload (signed-url + PUT). Returns stored URL/path or null on failure. */
  upload: (file: File) => Promise<string | null>;
  variant?: TAppUploadVariant;
  accept?: string;
  /** Client-side size guard in MB. */
  maxMb?: number;
  disabled?: boolean;
}

const ACCEPT: Record<TAppUploadVariant, string> = {
  avatar: 'image/png,image/jpeg,image/webp',
  banner: 'image/png,image/jpeg,image/webp',
  doc: 'application/pdf,image/png,image/jpeg',
};

/**
 * Shared upload control built on antd `Upload`. Three variants:
 *  - `avatar`  — square drop tile with image preview (logo).
 *  - `banner`  — wide drop tile with image preview (cover).
 *  - `doc`     — button + uploaded-file chip (licence/pdf).
 *
 * Form-friendly: reads `value`, emits `onChange(url)` — drop straight into a Form.Item.
 */
export function AppUpload({
  value,
  onChange,
  upload,
  variant = 'avatar',
  accept,
  maxMb,
  disabled,
}: IAppUploadProps) {
  const { t } = useTranslation('business');
  const [loading, setLoading] = useState(false);

  const guard = (file: File): boolean => {
    if (maxMb && file.size > maxMb * 1024 * 1024) {
      void message.error(t('asset_too_large', { mb: maxMb }));
      return false;
    }
    return true;
  };

  // We bypass antd's default XHR — do the signed-URL upload ourselves.
  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    if (disabled || !guard(file as File)) return Upload.LIST_IGNORE;
    setLoading(true);
    try {
      const url = await upload(file as File);
      if (url) onChange?.(url);
    } finally {
      setLoading(false);
    }
    return Upload.LIST_IGNORE; // we manage the preview ourselves, not antd's list
  };

  const commonProps: UploadProps = {
    accept: accept ?? ACCEPT[variant],
    multiple: false,
    showUploadList: false,
    beforeUpload,
    disabled: disabled || loading,
  };

  // ---- Document variant: button + uploaded chip ----
  if (variant === 'doc') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <Upload {...commonProps}>
          <Button
            icon={<RiUploadCloud2Line />}
            loading={loading}
            disabled={disabled}
            className="!rounded-lg !h-10"
          >
            {t('asset_upload_doc')}
          </Button>
        </Upload>
        {value && (
          <span className="inline-flex items-center gap-2 px-3 h-10 rounded-lg bg-green-50 text-green-700 text-sm">
            <RiFileTextLine />
            <a href={value} target="_blank" rel="noreferrer" className="!text-green-700 hover:!underline">
              {t('asset_uploaded')}
            </a>
            {!disabled && (
              <RiDeleteBinLine
                className="cursor-pointer hover:text-red-500"
                onClick={() => onChange?.('')}
              />
            )}
          </span>
        )}
      </div>
    );
  }

  // ---- Image variants: drop tile with preview ----
  const isBanner = variant === 'banner';
  const box = isBanner ? 'h-32 w-full' : 'h-28 w-28';

  if (value) {
    return (
      <div className={`relative group rounded-xl overflow-hidden border border-gray-200 ${box}`}>
        <Image
          src={value}
          alt={variant}
          wrapperClassName="!w-full !h-full"
          className="!w-full !h-full !object-cover"
          height="100%"
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange?.('')}
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <RiDeleteBinLine size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <Upload {...commonProps} listType="picture-card" className="sbrb-app-upload" openFileDialogOnClick>
      <div className={`flex flex-col items-center justify-center gap-1 text-gray-400 ${box}`}>
        <RiImageLine size={22} />
        <span className="text-[11px]">{loading ? t('asset_uploading') : t('asset_pick_image')}</span>
      </div>
    </Upload>
  );
}
