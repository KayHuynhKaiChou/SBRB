import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  BUSINESS_ROLES,
  USER_ACCOUNT_STATUSES,
} from '@sbrb/shared-constants';

/** Filter + pagination for the personnel (/members) table. */
@InputType()
export class BusinessMembersFilterInput {
  /** Search by name or email (ILIKE). */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** Filter by business role. Omit for all. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(BUSINESS_ROLES as unknown as string[])
  role?: string;

  /** Filter by account status. Omit for all. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(USER_ACCOUNT_STATUSES as unknown as string[])
  status?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
