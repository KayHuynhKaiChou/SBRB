// TODO: install minio package — `npm install minio` in apps/api
// Stub implementation: compiles and returns mock values until minio is installed

import { Injectable } from '@nestjs/common';

/** MinIO file storage service — SRS 4.3 (logo uploads) */
@Injectable()
export class MinioService {
  getPublicUrl(bucketName: string, objectName = 'file'): string {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `http://${endpoint}:${port}/${bucketName}/${objectName}`;
  }

  /**
   * Upload a file to MinIO.
   * @param bucketName - bucket (or full path prefix)
   * @param bufferOrObjectName - Buffer to upload, OR objectName string if 4-arg form
   * @param mimeTypeOrBuffer - mimeType string (3-arg form) OR Buffer (4-arg form)
   * @param mimeType - mimeType (4-arg form only)
   */
  async uploadFile(
    bucketName: string,
    bufferOrObjectName: Buffer | string,
    mimeTypeOrBuffer: string | Buffer,
    mimeType?: string,
  ): Promise<string> {
    // Stub: resolve objectName for URL and return it
    if (typeof bufferOrObjectName === 'string') {
      // 4-arg form: (bucket, objectName, buffer, mimeType)
      return this.getPublicUrl(bucketName, bufferOrObjectName);
    }
    // 3-arg form: (bucket, buffer, mimeType) — used by BusinessController
    return this.getPublicUrl(bucketName, 'logo');
  }

  async deleteFile(_bucketName: string, _objectName: string): Promise<void> {
    // Stub: no-op until minio package is installed
  }
}
