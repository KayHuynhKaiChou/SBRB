import { Field, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import type { IPaginatedData } from '@sbrb/shared-types';
import { Pagination } from './pagination.type';

/**
 * Build a concrete @ObjectType class representing IPaginatedData<T>.
 * Use together with ApiResponse() for paginated query responses:
 *
 *   @ObjectType()
 *   class PaginatedWidgets extends PaginatedData(WidgetType) {}
 *
 *   @ObjectType()
 *   class WidgetsResponse extends ApiResponse(PaginatedWidgets) {}
 *
 *   @Query(() => WidgetsResponse)
 *   async widgets(...): Promise<IApiResponse<IPaginatedData<WidgetType>>> { ... }
 */
export function PaginatedData<T>(classRef: Type<T>): Type<IPaginatedData<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedDataClass implements IPaginatedData<T> {
    @Field(() => [classRef])
    items: T[];

    @Field(() => Pagination)
    pagination: Pagination;
  }

  return PaginatedDataClass as unknown as Type<IPaginatedData<T>>;
}
