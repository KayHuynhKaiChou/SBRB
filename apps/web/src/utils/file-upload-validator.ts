import { IMPORT_MAX_FILE_SIZE_MB } from '@sbrb/shared-constants';

/** FE-only — extensions list + error messages (i18n on roadmap). Kept local. */
const ALLOWED_EXTENSIONS = ['.xlsx', '.csv'] as const;
const MAX_SIZE_BYTES = IMPORT_MAX_FILE_SIZE_MB * 1024 * 1024;

export interface IFileValidationResult {
  valid: boolean;
  error?: string;
}

/** Returns valid:true or an error message for the given file */
export function validateUploadFile(file: File): IFileValidationResult {
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: `File vượt quá ${IMPORT_MAX_FILE_SIZE_MB} MB` };
  }
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { valid: false, error: `Chỉ hỗ trợ file ${ALLOWED_EXTENSIONS.join(' hoặc ')}` };
  }
  return { valid: true };
}
