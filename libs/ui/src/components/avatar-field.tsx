import React from 'react';
import { Upload, Avatar, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface IAvatarFieldProps {
  /** Current image URL — injected by Antd Form.Item when wrapped. */
  value?: string | null;
  /** Updates form field — injected by Antd Form.Item. */
  onChange?: (url: string) => void;
  /** Fallback initial when no image URL (avatar shape only). */
  fullName?: string;
  /** Caller-provided uploader (returns public URL when done). */
  onUpload: (file: File) => Promise<string>;
  /** i18n strings */
  errorTypeMsg: string;
  errorSizeMsg: string;
  failedMsg: string;
  successMsg: string;
  /** Visual shape — `circle` for avatars, `square` for logos. Default `circle`. */
  shape?: 'circle' | 'square';
  /** Pixel size (width = height since aspect=1). Default 96. */
  size?: number;
}

/**
 * Common image upload field with square cropping (ImgCrop) — designed to live
 * inside `<Form.Item name="...">`. Antd auto-injects `value` + `onChange`.
 * Use `shape="circle"` for user avatars, `shape="square"` for business logos.
 */
export function AvatarField({
  value,
  onChange,
  fullName,
  onUpload,
  errorTypeMsg,
  errorSizeMsg,
  failedMsg,
  successMsg,
  shape = 'circle',
  size = 96,
}: IAvatarFieldProps) {
  const beforeUpload = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error(errorTypeMsg);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_BYTES) {
      message.error(errorSizeMsg);
      return Upload.LIST_IGNORE;
    }
    try {
      const url = await onUpload(file);
      onChange?.(url);
      message.success(successMsg);
    } catch {
      message.error(failedMsg);
    }
    return false;
  };

  const initial = (fullName ?? '?').charAt(0).toUpperCase();
  const isCircle = shape === 'circle';
  const radiusClass = isCircle ? 'rounded-full' : 'rounded-lg';

  return (
    <ImgCrop rotationSlider showReset cropShape={isCircle ? 'round' : 'rect'} aspect={1}>
      <Upload
        accept={ALLOWED_TYPES.join(',')}
        showUploadList={false}
        beforeUpload={beforeUpload}
      >
        <div className="relative cursor-pointer group" style={{ width: size, height: size }}>
          {isCircle ? (
            <Avatar size={size} src={value ?? undefined}>
              {initial}
            </Avatar>
          ) : (
            <div
              className={`${radiusClass} overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400`}
              style={{ width: size, height: size }}
            >
              {value ? (
                <img src={value} alt="" className="w-full h-full object-cover" />
              ) : (
                <CameraOutlined className="text-2xl" />
              )}
            </div>
          )}
          <div
            className={`absolute inset-0 ${radiusClass} bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity`}
          >
            <CameraOutlined className="text-white text-xl" />
          </div>
        </div>
      </Upload>
    </ImgCrop>
  );
}
