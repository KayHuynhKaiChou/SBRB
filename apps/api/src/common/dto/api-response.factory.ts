import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import type { IApiResponse } from '@sbrb/shared-types';
import { ApiError } from './api-error.type';
import { LocalizedMessage } from './localized-message.type';

/**
 * NestJS Code-First generic factory: build a concrete @ObjectType class
 * representing IApiResponse<T> for a given entity type.
 *
 * Per NestJS docs, generic ObjectTypes must extend a concrete subclass per usage.
 * Example:
 *   @ObjectType()
 *   class WidgetResponse extends ApiResponse(WidgetType) {}
 *
 *   @Mutation(() => WidgetResponse)
 *   async deleteWidget(...): Promise<IApiResponse<WidgetType>> { ... }
 */
export function ApiResponse<T>(classRef: Type<T>): Type<IApiResponse<T>> {
  @ObjectType({ isAbstract: true })
  abstract class ApiResponseClass implements IApiResponse<T> {
    @Field(() => Int)
    code: number;

    @Field(() => LocalizedMessage)
    message: LocalizedMessage;

    @Field(() => classRef, { nullable: true })
    data: T | null;

    @Field(() => ApiError, { nullable: true })
    error?: ApiError | null;
  }

  return ApiResponseClass as unknown as Type<IApiResponse<T>>;
}
