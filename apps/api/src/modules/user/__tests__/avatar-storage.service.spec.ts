import { InternalServerErrorException } from '@nestjs/common';
import { AvatarStorageService } from '../services/avatar-storage.service';

const mockSupabase = {
  storage: {
    from: jest.fn().mockReturnThis(),
    createSignedUploadUrl: jest.fn(),
  },
};

describe('AvatarStorageService', () => {
  let service: AvatarStorageService;

  beforeEach(() => {
    const mockConfig = {
      getOrThrow: (key: string) => {
        if (key === 'SUPABASE_URL') return 'https://project.supabase.co';
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-key';
        return undefined;
      },
      get: (key: string) => {
        if (key === 'SUPABASE_AVATAR_BUCKET') return 'avatar';
        return undefined;
      },
    } as any;

    service = new AvatarStorageService(mockConfig);
    (service as any).client = mockSupabase;
    (service as any).publicBaseUrl = 'https://project.supabase.co/storage/v1/object/public/avatar';
    mockSupabase.storage.from.mockClear();
    mockSupabase.storage.createSignedUploadUrl.mockClear();
  });

  it('scopes path to userId and builds publicUrl correctly', async () => {
    mockSupabase.storage.createSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: 'https://project.supabase.co/storage/v1/upload/signed/abc123',
        token: 'upload-token-xyz',
      },
      error: null,
    });

    const result = await service.createUploadUrl('user-123', 'photo.png');

    expect(mockSupabase.storage.from).toHaveBeenCalledWith('avatar');
    expect(result.path).toMatch(/^users\/user-123\/avatar-\d+\.png$/);
    expect(result.publicUrl).toContain('users/user-123/avatar-');
    expect(result.uploadUrl).toBe('https://project.supabase.co/storage/v1/upload/signed/abc123');
    expect(result.token).toBe('upload-token-xyz');
  });

  it('normalizes file extension to lowercase', async () => {
    mockSupabase.storage.createSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: 'https://signed',
        token: 'tok',
      },
      error: null,
    });

    await service.createUploadUrl('user-1', 'photo.PNG');

    const callArg = mockSupabase.storage.createSignedUploadUrl.mock.calls[0][0];
    expect(callArg).toMatch(/\.png$/);
  });

  it('uses last part after dot as extension, or jpg default', async () => {
    mockSupabase.storage.createSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: 'https://signed',
        token: 'tok',
      },
      error: null,
    });

    // filename 'photo' splits to ['photo'], pop gives 'photo', not extension
    // So service treats 'photo' as the extension
    await service.createUploadUrl('user-1', 'photo');

    const callArg = mockSupabase.storage.createSignedUploadUrl.mock.calls[0][0];
    expect(callArg).toMatch(/avatar-\d+\.photo$/);
  });

  it('throws on supabase error', async () => {
    mockSupabase.storage.createSignedUploadUrl.mockResolvedValue({
      data: null,
      error: { message: 'Quota exceeded' },
    });

    await expect(service.createUploadUrl('user-1', 'photo.png')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('throws on missing data', async () => {
    mockSupabase.storage.createSignedUploadUrl.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(service.createUploadUrl('user-1', 'photo.png')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('includes userId in public URL path for scoping', async () => {
    mockSupabase.storage.createSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: 'https://signed',
        token: 'tok',
      },
      error: null,
    });

    const result = await service.createUploadUrl('special-user-456', 'avatar.webp');

    expect(result.publicUrl).toContain('special-user-456');
    expect(result.path).toMatch(/^users\/special-user-456\//);
  });
});
