import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';

/** MinIO object storage service — SRS 4.7 */
@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  /** Upload buffer to MinIO; returns the object key */
  async upload(bucket: string, key: string, buffer: Buffer, mimeType: string): Promise<string> {
    try {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket, 'us-east-1');
      }
      await this.client.putObject(bucket, key, buffer, buffer.length, {
        'Content-Type': mimeType,
      });
      return key;
    } catch (err) {
      this.logger.error(`MinIO upload failed: ${key}`, err);
      throw err;
    }
  }

  /** Get a pre-signed URL for temporary object access */
  async getPresignedUrl(bucket: string, key: string, expiresIn = 3600): Promise<string> {
    return this.client.presignedGetObject(bucket, key, expiresIn);
  }

  /** Delete an object from MinIO */
  async delete(bucket: string, key: string): Promise<void> {
    try {
      await this.client.removeObject(bucket, key);
    } catch (err) {
      this.logger.error(`MinIO delete failed: ${key}`, err);
      throw err;
    }
  }

  /** Download an object as Buffer */
  async download(bucket: string, key: string): Promise<Buffer> {
    const stream = await this.client.getObject(bucket, key);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
