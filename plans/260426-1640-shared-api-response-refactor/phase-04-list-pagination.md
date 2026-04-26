# Phase 4: Department Mutations — High-Impact Module with Member Service

## Overview

Refactor department and member mutations to `ApiResponse` contract with full pagination support.

## Key Insights

- Department module includes member service; requires coordination
- Large member lists benefit from pagination + cache
- Department is high-impact for user experience

## Requirements

**Backend:**
- Wrap `createDepartment`, `updateDepartment`, `deleteDepartment` mutations
- Wrap `addMember`, `removeMember`, `updateMemberRole` mutations
- Support paginated member lists with `IPaginatedData<Member>`

**Frontend:**
- Update department operations to handle paginated responses
- Wire `useListCache` in department mutation hooks
- Support infinite scroll or pagination UI for members

## Related Code Files

**Backend files to create:**
- `apps/api/src/modules/department/dto/department-response.type.ts`

**Backend files to modify:**
- `apps/api/src/modules/department/department.resolver.ts`
- `apps/api/src/modules/department/department.service.ts`
- `apps/api/src/modules/department/department-member.service.ts`

**Frontend files to modify:**
- `apps/web/src/graphql/department.operations.ts`
- `apps/web/src/hooks/use-department-mutations.ts`
- `apps/web/src/hooks/use-departments.ts`

## Implementation Steps

1. Create `DepartmentResponse` and `MemberResponse` types
2. Wrap department mutations
3. Wrap member mutations with pagination
4. Update department.service and department-member.service
5. Update GraphQL operations
6. Wire `useListCache` in hooks

## Todo List

- [x] Create response types
- [x] Wrap mutations
- [x] Update services
- [x] Update GraphQL operations
- [x] Wire cache hooks

## Success Criteria

- [x] All mutations return `IApiResponse<T>`
- [x] Member lists support pagination
- [x] Cache helpers integrated

## Next Steps

→ Phase 5: Remaining modules and refinement
