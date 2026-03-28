import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

/** Explicit refresh token (fallback when cookie unavailable) */
@InputType()
export class RefreshTokenDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
