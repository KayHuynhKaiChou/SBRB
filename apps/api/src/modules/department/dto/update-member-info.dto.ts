import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { PHONE_REGEX } from '@sbrb/shared-constants';

/** Input for owner-gated member identity update (fullName, phone). */
@InputType()
export class UpdateMemberInfoDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  /** Null clears the phone. Empty string is rejected by PHONE_REGEX — client must send null to clear. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(PHONE_REGEX, {
    message: 'Invalid phone format',
    // Allow null/undefined — @IsOptional handles that; only non-null strings must match.
  })
  phone?: string | null;
}
