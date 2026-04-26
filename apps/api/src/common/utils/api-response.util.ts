import {
  API_CODE,
  type IApiResponse,
  type ILocalizedMessage,
  type IPaginatedData,
  type IPagination,
} from '@sbrb/shared-types';

/** Build a 200 OK ApiResponse with payload. */
export function ok<T>(data: T, message: ILocalizedMessage): IApiResponse<T> {
  return { code: API_CODE.OK, message, data, error: null };
}

/** Build a 201 Created ApiResponse with payload. */
export function created<T>(data: T, message: ILocalizedMessage): IApiResponse<T> {
  return { code: API_CODE.CREATED, message, data, error: null };
}

/** Build a generic error ApiResponse (no data). */
export function fail(
  code: number,
  message: ILocalizedMessage,
  options?: { details?: unknown; stack?: string },
): IApiResponse<null> {
  return {
    code,
    message,
    data: null,
    error: {
      details: options?.details === undefined ? null : JSON.stringify(options.details),
      stack: options?.stack ?? null,
    },
  };
}

/** Build pagination metadata from total + input. */
export function buildPagination(total: number, page: number, pageSize: number): IPagination {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return { page, pageSize, total, totalPages, hasMore: page < totalPages };
}

/** Wrap items + pagination into IPaginatedData. */
export function paginate<T>(items: T[], total: number, page: number, pageSize: number): IPaginatedData<T> {
  return { items, pagination: buildPagination(total, page, pageSize) };
}
