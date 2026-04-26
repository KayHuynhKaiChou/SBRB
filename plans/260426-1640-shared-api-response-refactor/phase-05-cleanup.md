# Phase 5: Remaining Modules & Refinement

## Overview

Extend `ApiResponse` contract to remaining mutation modules and refine based on pilot learnings.

## Candidates for Refactor

### P2 (High Priority)
- **Datasheet mutations** (createDatasheet, updateDatasheet, deleteDatasheet)
- **WidgetData mutations** (createWidgetData, updateWidgetData, deleteWidgetData)
- **User mutations** (updateProfile, changePassword)

### P3 (Medium Priority)
- **Configuration mutations** (if any)
- **Report mutations** (if any)

### P4 (Future)
- **Integration with other services**
- **Batch operations** (if needed)

## Refinements from Pilot

- [ ] Review error message coverage; add missing i18n keys
- [ ] Add integration tests for useListCache with real Apollo cache
- [ ] Document migration guide for new modules
- [ ] Measure performance impact of predictive cache
- [ ] Consider cursor pagination for very large lists

## Architecture Updates

- Consider adding `middleware` for automatic response wrapping
- Evaluate `graphql-shield` for unified error handling
- Plan for subscription support (if applicable)

## Todo List

- [ ] Refactor datasheet mutations
- [ ] Refactor widget-data mutations
- [ ] Refactor user mutations
- [ ] Add integration tests
- [ ] Document migration guide
- [ ] Update developer handbook

## Success Criteria

- All mutation-heavy modules use `IApiResponse` contract
- Frontend error handling is consistent across all mutations
- No breaking changes to query resolvers
- Developer guide updated with migration steps
- 80%+ code coverage for cache helpers

## Next Steps

- Schedule P2 refactors
- Plan testing & documentation
