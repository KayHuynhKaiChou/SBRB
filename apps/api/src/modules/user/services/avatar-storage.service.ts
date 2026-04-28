import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AvatarUploadUrlType } from '../dto/avatar-upload.type';

type TUploadKind = 'avatar' | 'logo';

interface IBucketSpec {
  bucket: string;
  /** Folder root + filename prefix per kind */
  pathBuilder: (ownerId: string, ext: string) => string;
}

/**
 * Supabase Storage signed-upload-URL generator for user avatars + business logos.
 * Lazy-initializes the client on first call so the API can boot without
 * SUPABASE_* env vars set (e.g., dev environments without Supabase configured).
 */
@Injectable()
export class AvatarStorageService {
  private client: SupabaseClient | null = null;
  private supabaseUrl = '';
  private specs: Record<TUploadKind, IBucketSpec> = {
    avatar: {
      bucket: 'avatar',
      pathBuilder: (userId, ext) => `users/${userId}/avatar-${Date.now()}.${ext}`,
    },
    logo: {
      bucket: 'logo',
      pathBuilder: (businessId, ext) => `businesses/${businessId}/logo-${Date.now()}.${ext}`,
    },
  };

  constructor(private readonly config: ConfigService) {}

  private ensureClient(): SupabaseClient {
    if (this.client) return this.client;
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new InternalServerErrorException(
        'Image upload unavailable: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured',
      );
    }
    this.supabaseUrl = url;
    this.specs.avatar.bucket = this.config.get<string>('SUPABASE_AVATAR_BUCKET') ?? 'avatar';
    this.specs.logo.bucket = this.config.get<string>('SUPABASE_LOGO_BUCKET') ?? 'logo';
    this.client = createClient(url, key, { auth: { persistSession: false } });
    return this.client;
  }

  async createUploadUrl(
    kind: TUploadKind,
    ownerId: string,
    filename: string,
  ): Promise<AvatarUploadUrlType> {
    const client = this.ensureClient();
    const spec = this.specs[kind];
    const ext = (filename.split('.').pop() ?? 'jpg').toLowerCase();
    const path = spec.pathBuilder(ownerId, ext);

    const { data, error } = await client.storage
      .from(spec.bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new InternalServerErrorException(
        `Supabase signed upload URL failed: ${error?.message ?? 'unknown error'}`,
      );
    }

    return {
      uploadUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: `${this.supabaseUrl}/storage/v1/object/public/${spec.bucket}/${path}`,
    };
  }
}
