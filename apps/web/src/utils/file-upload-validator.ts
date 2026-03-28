/** Shared validation constants and helper for file uploads (import/reimport dialogs) */
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  ALLOWED_EXTENSIONS: ['.xlsx', '.csv'],
  ERROR_SIZE: 'File vượt quá 10 MB',
  ERROR_TYPE: 'Chỉ hỗ trợ file .xlsx hoặc .csv',
};

export interface IFileValidationResult {
  valid: boolean;
  error?: string;
}

/** Returns valid:true or an error message for the given file */
export function validateUploadFile(file: File): IFileValidationResult {
  if (file.size > FILE_UPLOAD_CONFIG.MAX_SIZE_BYTES) {
    return { valid: false, error: FILE_UPLOAD_CONFIG.ERROR_SIZE };
  }
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: FILE_UPLOAD_CONFIG.ERROR_TYPE };
  }
  return { valid: true };
}
