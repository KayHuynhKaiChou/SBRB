# Phase 1: Foundation — Shared API Response Types & Backend Infrastructure

## Overview

Establish baseline types, DTOs, and error handling filters for unified API response contract.

## Key Insights

- Response contract must be GraphQL-compatible (no reserved keywords)
- Status codes need i18n friendly format (numeric + localized message)
- Exception filter must integrate with NestJS GraphQL exception handling
- Pagination model should support both offset/limit and cursor patterns (future-ready)

## Requirements

**Functional:**
- Define `IApiResponse<T>` contract for all mutations
- Define `IPaginatedData<T>` for list responses
- Create factory classes for type-safe response building
- Wire global exception filter to translate errors → localized messages

**Non-functional:**
- Zero runtime overhead for queries (no change to existing query behavior)
- Type-safe factories prevent response shape errors
- Support nested error details for debugging

## Architecture

### Type Hierarchy

```
IApiResponse<T>
├── data: T | null
├── error: ApiError | null
└── statusCode: ApiStatusCode (numeric)

IPaginatedData<T>
├── items: T[]
├── pagination: { offset, limit, total, hasMore }

ApiError
├── message: LocalizedMessage
├── code: string
└── details?: Record<string, any>

LocalizedMessage
├── key: string (i18n key)
├── params?: Record<string, string | number>
└── fallback: string
```

### DTO Factories

- `ApiResponseFactory.success(data, statusCode)` → `IApiResponse<T>`
- `ApiResponseFactory.error(error, statusCode)` → `IApiResponse<null>`
- `ApiResponseListFactory.paginated(items, pagination)` → `IApiResponse<IPaginatedData<T>>`
- `PaginatedDataFactory.create(items, offset, limit, total)` → `IPaginatedData<T>`

## Related Code Files

**Files to create:**
- `libs/shared/types/src/api-code.ts`
- `libs/shared/types/src/api-response.types.ts`
- `apps/api/src/common/dto/localized-message.type.ts`
- `apps/api/src/common/dto/api-error.type.ts`
- `apps/api/src/common/dto/pagination.type.ts`
- `apps/api/src/common/dto/pagination-input.dto.ts`
- `apps/api/src/common/dto/api-response.factory.ts`
- `apps/api/src/common/dto/api-response-list.factory.ts`
- `apps/api/src/common/dto/paginated-data.factory.ts`
- `apps/api/src/common/dto/index.ts` (re-exports)
- `apps/api/src/common/utils/api-response.util.ts`
- `apps/api/src/common/filters/graphql-exception.filter.ts`

**Files to modify:**
- `libs/shared/types/src/index.ts` (re-exports new types)
- `apps/api/src/app/app.module.ts` (wire APP_FILTER)

## Implementation Steps

1. Create type definitions: `api-code.ts`, `api-response.types.ts`
2. Create DTO classes: localized-message, api-error, pagination models
3. Create factory classes with validation
4. Create exception filter with i18n integration
5. Wire APP_FILTER in app.module
6. Export from shared/types index

## Todo List

- [x] Define `IApiResponse<T>` contract
- [x] Define `IPaginatedData<T>` and pagination model
- [x] Implement factory classes
- [x] Create `GqlGlobalExceptionFilter`
- [x] Wire global filter to app.module
- [x] Re-export from shared/types

## Success Criteria

- [x] All type definitions compile without errors
- [x] Factories enforce non-null returns
- [x] Exception filter intercepts GraphQL exceptions
- [x] App module initializes without errors
- [x] Status codes are numeric and extensible

## Next Steps

→ Phase 2: Frontend cache helpers for predictive updates
