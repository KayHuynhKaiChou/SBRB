# Phase 2: Pilot Refactor — Widget Mutations + Apollo Cache Integration

## Overview

Establish mutation refactor pattern using widget module as pilot. Combine backend `ApiResponse` contract with frontend predictive cache updates via `useListCache` hook.

## Key Insights

- Widget is ideal pilot: create/update/delete mutations + complex list state
- Predictive cache reduces perceived latency and improves UX
- Apollo `cache.readQuery`/`writeQuery` integrate seamlessly with `useListCache`
- Error recovery requires clear messaging to revert optimistic updates

## Requirements

**Backend (Pilot):**
- Wrap `createWidget`, `updateWidget`, `deleteWidget` mutations with `ApiResponse<WidgetResponse>`
- Return localized success/error messages
- Preserve existing resolver contract for queries

**Frontend (Pilot):**
- Update GraphQL operations to map `ApiResponse.data` to component data
- Implement `useListCache` integration in `use-widget-config`, `use-canvas`
- Add numeric 401 detection in apollo-error-link for auth failures
- Update widget-modal, widget-card components to handle mutation status

## Architecture

### Backend Flow

```
Widget Mutation Request
  ↓
Resolver (e.g., createWidget)
  ↓
Service (e.g., widgetService.create)
  ↓
WidgetResponseFactory.success()
  ├─→ data: WidgetResponse
  ├─→ error: null
  └─→ statusCode: 200

GraphQL Response
{
  createWidget: {
    data: { id, name, config, ... },
    error: null,
    statusCode: 200
  }
}
```

### Frontend Flow

```
Widget Modal Submit
  ↓
useWidgetConfig().createWidget() mutation
  ↓
useListCache( 'listWidgets' )
  ├─→ Optimistic update: add/update in local cache
  ├─→ Send mutation
  └─→ On response:
      ├─→ If success: cache already updated, render data
      └─→ If error: revert cache, show error message

Widget Card Display
  ↓
useCanvas().widgets (reads from cache)
  ↓
Re-render with fresh data
```

## Related Code Files

**Backend files to create:**
- `apps/api/src/modules/widget/dto/widget-response.type.ts`

**Backend files to modify:**
- `apps/api/src/modules/widget/widget.resolver.ts`
- `apps/api/src/modules/widget/widget-data.resolver.ts`
- `apps/api/src/modules/widget/widget.service.ts`
- `apps/api/src/schema.gql` (regenerated)

**Frontend files to create:**
- (None; uses foundation from Phase 1)

**Frontend files to modify:**
- `apps/web/src/graphql/canvas.operations.ts`
- `apps/web/src/graphql/widget-config.operations.ts`
- `apps/web/src/pages/dashboard/dashboard-page.tsx`
- `apps/web/src/components/widget/widget-modal.tsx`
- `apps/web/src/components/canvas/widget-card.tsx`
- `apps/web/src/hooks/use-widget-config.ts`
- `apps/web/src/hooks/use-canvas.ts`
- `apps/web/src/apollo/apollo-error-link.ts`
- `apps/web/public/locales/en/widget.json`
- `apps/web/public/locales/vi/widget.json`

## Implementation Steps

### Backend (1-4)

1. Create `WidgetResponse` type with `IApiResponse<{ id, name, config, ... }>`
2. Update `widget.resolver.ts` mutations to return `WidgetResponse`
3. Update `widget.service.ts` to not throw; return success/error tuples
4. Update `widget-data.resolver.ts` mutations similarly

### Frontend (5-10)

5. Update `canvas.operations.ts` widget mutations: map response data
6. Update `widget-config.operations.ts` to match response shape
7. Wire `useListCache` in `use-widget-config` for create/update/delete
8. Wire `useListCache` in `use-canvas` for list reads
9. Add numeric 401 detection in `apollo-error-link`
10. Update widget-modal, widget-card to handle optimistic state and errors
11. Add i18n keys to en/vi widget.json

## Todo List

- [x] Create WidgetResponse type
- [x] Wrap createWidget, updateWidget, deleteWidget mutations
- [x] Update widget.service to handle errors gracefully
- [x] Update GraphQL operations to map ApiResponse
- [x] Wire useListCache in hooks
- [x] Add numeric 401 detection
- [x] Update components to show mutation status
- [x] Add i18n keys (locales gitignored; verify separately)

## Success Criteria

- [x] All widget mutations return `IApiResponse<T>`
- [x] Components render optimistic updates
- [x] Errors revert cache and show message
- [x] Numeric 401 detected and handled
- [x] No refetch queries needed (cache-driven)

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Cache desync if error recovery incomplete | Implement rollback in useListCache hook error handler |
| Numeric 401 not recognized | Test with mock auth failure and verify apollo-error-link detection |
| i18n keys missing | Add keys to en/vi widget.json; verify with browser |

## Next Steps

→ Phase 3: Apply same pattern to tab mutations
→ Phase 4: Apply pattern to department mutations
