/**
 * HTTP-style numeric codes used by IApiResponse. Shared between BE and FE.
 * Resolvers/services pick the appropriate code per outcome; the GraphQL
 * exception filter maps NestJS HttpExceptions to these codes.
 */
export const API_CODE = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
} as const;

export type TApiCode = (typeof API_CODE)[keyof typeof API_CODE];

export const isSuccessCode = (code: number): boolean => code >= 200 && code < 300;
