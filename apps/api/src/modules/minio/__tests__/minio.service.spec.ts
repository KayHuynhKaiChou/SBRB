import { MinioService } from '../minio.service';

describe('MinioService', () => {
  let service: MinioService;

  beforeEach(() => {
    service = new MinioService();
  });

  describe('getPublicUrl', () => {
    it('returns url with default endpoint and port', () => {
      delete process.env.MINIO_ENDPOINT;
      delete process.env.MINIO_PORT;
      const url = service.getPublicUrl('my-bucket', 'my-object');
      expect(url).toBe('http://localhost:9000/my-bucket/my-object');
    });

    it('uses env vars when set', () => {
      process.env.MINIO_ENDPOINT = 'minio.example.com';
      process.env.MINIO_PORT = '9001';
      const url = service.getPublicUrl('bucket', 'file.png');
      expect(url).toContain('minio.example.com:9001');
      delete process.env.MINIO_ENDPOINT;
      delete process.env.MINIO_PORT;
    });

    it('defaults objectName to "file" when omitted', () => {
      delete process.env.MINIO_ENDPOINT;
      delete process.env.MINIO_PORT;
      const url = service.getPublicUrl('bucket');
      expect(url).toBe('http://localhost:9000/bucket/file');
    });
  });

  describe('uploadFile', () => {
    it('returns a string URL (3-arg form: bucket, buffer, mimeType)', async () => {
      const url = await service.uploadFile(
        'businesses/123/logo',
        Buffer.from('fake'),
        'image/png',
      );
      expect(typeof url).toBe('string');
      expect(url).toContain('businesses/123/logo');
    });

    it('returns a string URL (4-arg form: bucket, objectName, buffer, mimeType)', async () => {
      const url = await service.uploadFile(
        'my-bucket',
        'photos/avatar.jpg',
        Buffer.from('fake'),
        'image/jpeg',
      );
      expect(typeof url).toBe('string');
      expect(url).toContain('my-bucket');
      expect(url).toContain('photos/avatar.jpg');
    });
  });

  describe('deleteFile', () => {
    it('resolves without error (stub no-op)', async () => {
      await expect(service.deleteFile('bucket', 'object')).resolves.toBeUndefined();
    });
  });
});
