import { Field, ObjectType } from '@nestjs/graphql';
import type { IApiError } from '@sbrb/shared-types';

@ObjectType('ApiError')
export class ApiError implements IApiError {
  // Explicit `() => String` is required because the TS reflect-metadata for
  // optional/nullable union types resolves to `Object`, which crashes the
  // GraphQL schema builder with UndefinedTypeError.
  @Field(() => String, { nullable: true })
  details?: string | null;

  @Field(() => String, { nullable: true })
  stack?: string | null;
}
