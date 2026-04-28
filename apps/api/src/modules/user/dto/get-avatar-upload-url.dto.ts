import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

/** Input for getAvatarUploadUrl — server signs URL for given filename + content type */
@InputType()
export class GetAvatarUploadUrlDto {
  @Field(() => String)
  @IsString()
  @MaxLength(255)
  @Matches(/\.(jpe?g|png|webp)$/i, { message: 'Filename must end with .jpg, .jpeg, .png, or .webp' })
  filename: string;

  @Field(() => String)
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string;
}
