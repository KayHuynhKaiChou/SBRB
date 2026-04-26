import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import type { IApiResponse } from '@sbrb/shared-types';
import { ApiError } from './api-error.type';
import { LocalizedMessage } from './localized-message.type';

/**
 * Variant of ApiResponse where `data` is a plain array (not paginated).
 * Use for bulk-update mutations or unpaginated list endpoints.
 *
 * Example:
 *   @ObjectType()
 *   class DepartmentListResponse extends ApiResponseList(DepartmentType) {}
 *
 *   @Mutation(() => DepartmentListResponse)
 *   async updateDepartmentPositions(...): Promise<IApiResponse<DepartmentType[]>> { ... }
 */
export function ApiResponseList<T>(classRef: Type<T>): Type<IApiResponse<T[]>> {
  @ObjectType({ isAbstract: true })
  abstract class ApiResponseListClass implements IApiResponse<T[]> {
    @Field(() => Int)
    code: number;

    @Field(() => LocalizedMessage)
    message: LocalizedMessage;

    @Field(() => [classRef], { nullable: true })
    data: T[] | null;

    @Field(() => ApiError, { nullable: true })
    error?: ApiError | null;
  }

  return ApiResponseListClass as unknown as Type<IApiResponse<T[]>>;
}
