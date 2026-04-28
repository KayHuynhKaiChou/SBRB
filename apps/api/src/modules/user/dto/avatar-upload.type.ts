import { Field, ObjectType } from '@nestjs/graphql';

/** Result of getAvatarUploadUrl mutation — used by client to PUT directly to Supabase Storage */
@ObjectType('AvatarUploadUrl')
export class AvatarUploadUrlType {
  @Field(() => String)
  uploadUrl: string;

  @Field(() => String)
  publicUrl: string;

  @Field(() => String)
  path: string;

  @Field(() => String)
  token: string;
}
