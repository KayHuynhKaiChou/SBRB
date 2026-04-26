# Shared API Response Refactor Plan

**Timeline:** 2026-04-26 | **Status:** Implementation Checkpoint

## Overview

Establish standardized API response handling across NestJS backend and Apollo client frontend. Move from ad-hoc error handling and cache management to a unified `IApiResponse` contract with integrated pagination, error localization, and predictive cache updates.

## Phases

| Phase | Title | Status | Files |
|-------|-------|--------|-------|
| [P0](#phase-0) | Foundation: Types, DTOs, Filters | ✅ Done | 14 files |
| [P1](#phase-1) | Apollo Cache Helpers | ✅ Done | 3 files |
| [P2](#phase-2) | Widget Refactor (Pilot) | ✅ Done | 14 files |
| [P3](#phase-3) | Tab Refactor | ✅ Done | 4 files |
| [P4](#phase-4) | Department Refactor | ✅ Done | 7 files |
| [P5](#phase-5) | Documentation & Planning | 🟡 In Progress | Plan files |

## Phase 0: Foundation

**Commit:** `133e70f`

Core types and utilities:
- `libs/shared/types`: `IApiResponse`, `IPaginatedData`, `ApiStatusCode`
- `apps/api/common/dto`: Factory classes, pagination models
- `apps/api/common/filters`: `GqlGlobalExceptionFilter` for unified error handling
- `apps/api/app.module`: Wired APP_FILTER

See: [phase-01-foundation.md](./phase-01-foundation.md)

## Phase 1: Apollo Cache Helpers

**Commit:** `9186ce9`

Frontend utilities for predictive cache updates:
- `cache-list-ops.ts`: Read/write/update list cache operations
- `use-list-cache.ts`: Hook for optimistic UI updates

See: [phase-02-pilot-widget.md](./phase-02-pilot-widget.md) (Apollo section)

## Phase 2: Widget Refactor (Pilot)

**Commit:** `7edad86`

Pilot refactor establishing mutation pattern:
- Backend: Wrap `create/update/deleteWidget` with `ApiResponse`
- Frontend: Update GraphQL operations, hooks, components
- Integration: Predictive cache, numeric 401 auth detection

See: [phase-02-pilot-widget.md](./phase-02-pilot-widget.md)

## Phase 3: Tab Refactor

**Commit:** `3284509`

Apply pattern from widget:
- Backend: Wrap tab mutations with `ApiResponse`
- Frontend: Update hooks with `useListCache`

See: [phase-03-mutations-migration.md](./phase-03-mutations-migration.md)

## Phase 4: Department Refactor

**Commit:** `44499da`

High-impact module with member service:
- Backend: Wrap department + member mutations
- Frontend: Bind cache helpers to department hooks

See: [phase-04-list-pagination.md](./phase-04-list-pagination.md)

## Phase 5: Planning & Cleanup

**Status:** Current

Remaining mutations (datasheet, widget-data, etc.) and refinement.

See: [phase-05-cleanup.md](./phase-05-cleanup.md)

## Key Decisions

1. **Response Contract:** All mutations return `{ data, error, statusCode }`
2. **Pagination:** Unified `IPaginatedData<T>` type with offset/limit/total
3. **Error Handling:** Localized messages via `LocalizedMessage`, numeric status codes
4. **Cache Updates:** Predictive via `useListCache` hook; optional refetch on error
5. **Backwards Compatibility:** Query resolvers unchanged; mutations only

## Commits Summary

```
133e70f feat(api): add shared IApiResponse + IPaginatedData contract foundation
9186ce9 feat(shared): add Apollo cache list helpers + useListCache hook
7edad86 refactor(widget): wrap mutations with ApiResponse + cache update on FE
3284509 refactor(tab): wrap mutations with ApiResponse + useListCache
44499da refactor(department): wrap mutations with ApiResponse + cache helpers
```

## Next Steps

- Refactor remaining mutation modules (datasheet, widget-data, user, etc.)
- Add integration tests for cache helpers
- Document migration guide for new modules
- Review error message localization coverage
