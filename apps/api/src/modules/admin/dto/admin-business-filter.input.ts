import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  EAdminBusinessSortBy,
  EBusinessStatus,
  type TBusinessStatus,
} from '@sbrb/shared-constants';

@InputType()
export class AdminBusinessFilterInput {
  /** Full-text search — matches business name or owner email (ILIKE). */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** Filter by unified status (pending/approved/rejected/inactive). Omit for all. */
  @Field({ nullable: true })
  @IsOptional()
  @IsIn(Object.values(EBusinessStatus))
  status?: TBusinessStatus;

  /** Sort column. Default: 'createdAt'. */
  @Field({ nullable: true })
  @IsOptional()
  @IsIn(Object.values(EAdminBusinessSortBy))
  sortBy?: string;

  /** Sort direction: 'asc' | 'desc'. Default: 'desc'. */
  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
