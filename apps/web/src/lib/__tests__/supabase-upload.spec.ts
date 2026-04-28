import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadToSignedUrl } from '../supabase-upload';

describe('uploadToSignedUrl', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends PUT request with correct headers', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const file = new File(['test content'], 'test.png', { type: 'image/png' });
    await uploadToSignedUrl('https://signed.url', 'token-123', file);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://signed.url',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'image/png',
          'Authorization': 'Bearer token-123',
          'x-upsert': 'true',
        }),
        body: file,
      }),
    );
  });

  it('includes file type in Content-Type header', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
    await uploadToSignedUrl('https://signed.url', 'token', file);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'image/jpeg',
        }),
      }),
    );
  });

  it('throws error on non-200 status', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });

    await expect(uploadToSignedUrl('https://signed.url', 'token', file)).rejects.toThrow(
      'Upload failed: 400 Bad Request',
    );
  });

  it('throws on 401 Unauthorized', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });

    await expect(uploadToSignedUrl('https://signed.url', 'invalid-token', file)).rejects.toThrow(
      'Upload failed: 401',
    );
  });

  it('throws on 403 Forbidden', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });

    await expect(uploadToSignedUrl('https://signed.url', 'token', file)).rejects.toThrow(
      'Upload failed: 403',
    );
  });

  it('throws on 500 Server Error', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });

    await expect(uploadToSignedUrl('https://signed.url', 'token', file)).rejects.toThrow(
      'Upload failed: 500',
    );
  });

  it('sends file as body', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const file = new File(['binary data'], 'image.png', { type: 'image/png' });
    await uploadToSignedUrl('https://signed.url', 'token', file);

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBe(file);
  });

  it('uses signed URL as request URL', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });
    const signedUrl = 'https://project.supabase.co/storage/v1/upload/signed/abc123';

    await uploadToSignedUrl(signedUrl, 'token', file);

    expect(mockFetch).toHaveBeenCalledWith(signedUrl, expect.anything());
  });

  it('sets x-upsert header to true', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });
    await uploadToSignedUrl('https://signed.url', 'token', file);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-upsert': 'true',
        }),
      }),
    );
  });

  it('handles response.text() error gracefully', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => {
        throw new Error('Text parsing failed');
      },
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });

    await expect(uploadToSignedUrl('https://signed.url', 'token', file)).rejects.toThrow(
      'Upload failed: 400',
    );
  });

  it('returns void on successful upload', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });
    const result = await uploadToSignedUrl('https://signed.url', 'token', file);

    expect(result).toBeUndefined();
  });

  it('throws with status and error message combined', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 413,
      text: async () => 'Payload too large',
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });

    await expect(uploadToSignedUrl('https://signed.url', 'token', file)).rejects.toThrow(
      'Upload failed: 413 Payload too large',
    );
  });

  it('works with different file types', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const fileTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/json'];

    for (const mimeType of fileTypes) {
      mockFetch.mockClear();
      const file = new File(['content'], 'file', { type: mimeType });

      await uploadToSignedUrl('https://signed.url', 'token', file);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': mimeType,
          }),
        }),
      );
    }
  });
});
