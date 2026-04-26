import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { IPagination } from '@sbrb/shared-types';

@ObjectType('Pagination')
export class Pagination implements IPagination {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field()
  hasMore: boolean;
}
