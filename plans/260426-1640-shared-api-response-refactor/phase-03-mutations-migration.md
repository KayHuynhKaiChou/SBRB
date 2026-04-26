# Phase 3: Tab Mutations — Standardized ApiResponse Pattern

## Overview

Apply `ApiResponse` contract to tab mutations following widget pilot pattern.

## Key Insights

- Tab mutations simpler than widget (no nested data); faster refactor
- Canvas operations file shared with widget; coordinate commit scope
- Tab list operations benefit equally from predictive cache

## Requirements

**Backend:**
- Wrap `createTab`, `updateTab`, `deleteTab` mutations with `IApiResponse<TabResponse>`
- Return localized messages consistent with widget

**Frontend:**
- Update `use-tabs` hook to wire `useListCache`
- Tab operations in canvas.operations already covered by widget commit

## Related Code Files

**Backend files to create:**
- `apps/api/src/modules/tab/dto/tab-response.type.ts`

**Backend files to modify:**
- `apps/api/src/modules/tab/tab.resolver.ts`
- `apps/api/src/modules/tab/tab.service.ts`

**Frontend files to modify:**
- `apps/web/src/hooks/use-tabs.ts`

## Implementation Steps

1. Create `TabResponse` type
2. Wrap tab mutations in resolver
3. Update tab service error handling
4. Wire `useListCache` in `use-tabs`

## Todo List

- [x] Create TabResponse type
- [x] Wrap mutations in resolver
- [x] Update service
- [x] Wire cache hook

## Success Criteria

- [x] All tab mutations return `IApiResponse<T>`
- [x] use-tabs integrates useListCache

## Next Steps

→ Phase 4: Department mutations
