import { useLazyQuery } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import type { IDepartmentSubtreeMember } from '@sbrb/shared-types';
import { DEPARTMENT_SUBTREE_MEMBERS_QUERY } from '../graphql/department.operations';

export type { IDepartmentSubtreeMember };

const EMPTY: IDepartmentSubtreeMember[] = [];

/** Members of a department + all its sub-departments (roll-up). Used by the department detail modal. */
export function useDepartmentSubtreeMembers() {
  // network-only: `isDirect`/`departmentName` are relative to the VIEWED department, but the rows
  // normalize onto the shared DepartmentMember cache entity by id. Reading cache-first when reopening
  // the modal for a different department would briefly render a stale isDirect. Always read fresh.
  const [load, { data, loading, error, called, refetch }] = useLazyQuery<{
    departmentSubtreeMembers: IDepartmentSubtreeMember[];
  }>(DEPARTMENT_SUBTREE_MEMBERS_QUERY, {
    fetchPolicy: 'network-only',
  });

  const fetch = useCallback(
    (departmentId: string) => load({ variables: { departmentId } }),
    [load],
  );

  const members = useMemo(
    () => data?.departmentSubtreeMembers ?? EMPTY,
    [data?.departmentSubtreeMembers],
  );

  return { fetch, members, loading, error, called, refetch };
}
