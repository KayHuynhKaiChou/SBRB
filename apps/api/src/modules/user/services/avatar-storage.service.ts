import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AvatarUploadUrlType } from '../dto/avatar-upload.type';

/** Asset kinds — avatar/logo/banner are public images; license is a PRIVATE document. */
type TUploadKind = 'avatar' | 'logo' | 'banner' | 'license';

interface IBucketSpec {
  bucket: string;
  /** Folder root + filename prefix per kind */
  pathBuilder: (ownerId: string, ext: string) => string;
  /** Private buckets have no public URL — admin/owner read via signed URL. */
  private?: boolean;
}

const SIGNED_READ_TTL_SEC = 60 * 10; // 10 minutes

/**
 * Supabase Storage signed-URL generator for user avatars + business assets
 * (logo/banner public, licence private). Lazy-initializes the client on first
 * call so the API can boot without SUPABASE_* env vars set.
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
    banner: {
      bucket: 'banner',
      pathBuilder: (businessId, ext) => `businesses/${businessId}/banner-${Date.now()}.${ext}`,
    },
    license: {
      bucket: 'business-docs',
      pathBuilder: (businessId, ext) => `businesses/${businessId}/license-${Date.now()}.${ext}`,
      private: true,
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
    this.specs.banner.bucket = this.config.get<string>('SUPABASE_BANNER_BUCKET') ?? 'banner';
    this.specs.license.bucket =
      this.config.get<string>('SUPABASE_BUSINESS_DOCS_BUCKET') ?? 'business-docs';
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

    // Private buckets: no public URL — callers store `path` and fetch via createSignedReadUrl.
    const publicUrl = spec.private
      ? path
      : `${this.supabaseUrl}/storage/v1/object/public/${spec.bucket}/${path}`;

    return { uploadUrl: data.signedUrl, token: data.token, path, publicUrl };
  }

  /**
   * Short-lived signed read URL for a PRIVATE asset (e.g. licence document).
   * `pathOrUrl` may be a stored bucket path (preferred) — bucket inferred from kind.
   * Returns null if storage is unavailable or the path can't be signed.
   */
  async createSignedReadUrl(
    kind: TUploadKind,
    pathOrUrl: string | null | undefined,
  ): Promise<string | null> {
    if (!pathOrUrl) return null;
    const client = this.ensureClient();
    const spec = this.specs[kind];
    // Accept either a raw path or a full URL containing the bucket path.
    const marker = `/object/public/${spec.bucket}/`;
    const path = pathOrUrl.includes(marker)
      ? pathOrUrl.split(marker)[1]
      : pathOrUrl.replace(/^.*\/object\/(?:sign|authenticated)\/[^/]+\//, '');

    const { data, error } = await client.storage
      .from(spec.bucket)
      .createSignedUrl(path, SIGNED_READ_TTL_SEC);

    if (error || !data) return null;
    return data.signedUrl;
  }
}
