import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { EAdminUserSortBy } from '@sbrb/shared-constants';

@InputType()
export class AdminUserFilterInput {
  /** Full-text search — matches email or fullName (ILIKE). */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** Filter by disabled status. Omit for all. */
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDisabled?: boolean;

  /** Sort column. Default: CREATED_AT. */
  @Field({ nullable: true })
  @IsOptional()
  @IsIn(Object.values(EAdminUserSortBy))
  sortBy?: string;

  /** Sort direction: 'asc' | 'desc'. Default: 'desc'. */
  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
