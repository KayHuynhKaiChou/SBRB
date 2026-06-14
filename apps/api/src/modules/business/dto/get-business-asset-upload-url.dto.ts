import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsString, Matches, MaxLength } from 'class-validator';
import { EBusinessAssetKind, type TBusinessAssetKind } from '@sbrb/shared-constants';

/**
 * Input for getBusinessAssetUploadUrl — owner uploads logo/banner (image) or
 * licence (pdf/image). Filename extension is validated against the kind.
 *
 * `kind` is wired as a plain String (not a GraphQL enum) so the client sends the
 * lowercase enum VALUE ('logo'/'license') — `@IsEnum` validates it server-side.
 * (A GraphQL enum would expose the KEYs 'LOGO'/'LICENSE' and reject the values.)
 */
@InputType()
export class GetBusinessAssetUploadUrlDto {
  @Field(() => String)
  @IsEnum(EBusinessAssetKind)
  kind: TBusinessAssetKind;

  @Field(() => String)
  @IsString()
  @MaxLength(255)
  @Matches(/\.(jpe?g|png|webp|pdf)$/i, {
    message: 'Filename must end with .jpg, .jpeg, .png, .webp or .pdf',
  })
  filename: string;
}
