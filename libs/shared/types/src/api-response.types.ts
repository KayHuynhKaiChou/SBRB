/**
 * Shared API response contract between BE and FE.
 *
 * Every GraphQL mutation returns IApiResponse<Entity>.
 * Every paginated query returns IApiResponse<IPaginatedData<Entity>>.
 *
 * BE mirrors these as @ObjectType classes via factories in
 * apps/api/src/common/dto/. Both shapes must stay byte-compatible.
 */

export interface ILocalizedMessage {
  vi: string;
  en: string;
}

export interface IApiError {
  /** JSON-serialized debug context (e.g. validation field map). FE may JSON.parse if needed. */
  details?: string | null;
  /** Stack trace; only populated in non-prod environments. */
  stack?: string | null;
}

export interface IApiResponse<T> {
  /** HTTP-style code: 200/201 success, 4xx client error, 5xx server error. */
  code: number;
  message: ILocalizedMessage;
  /** Always present on success (entity for mutations incl. delete snapshot). Null on error. */
  data: T | null;
  /** Populated when code >= 400 to aid debugging. */
  error?: IApiError | null;
}

export interface IPagination {
  /** 1-based page index. */
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface IPaginatedData<T> {
  items: T[];
  pagination: IPagination;
}

export interface IPaginationInput {
  /** 1-based, defaults server-side to 1. */
  page?: number;
  /** Defaults server-side to 20. */
  pageSize?: number;
}

/** Convenience alias: paginated list response. */
export type IPaginatedApiResponse<T> = IApiResponse<IPaginatedData<T>>;
