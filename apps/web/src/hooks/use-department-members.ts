import { useLazyQuery } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import type { IDepartmentMember } from '@sbrb/shared-types';
import { DEPARTMENT_MEMBERS_QUERY } from '../graphql/department.operations';

export type { IDepartmentMember };

const EMPTY: IDepartmentMember[] = [];

/** Direct members of a single department (no roll-up). Used by add-member / change-manager flows. */
export function useDepartmentMembers() {
  const [load, { data, loading, error, called, refetch }] = useLazyQuery<{
    departmentMembers: IDepartmentMember[];
  }>(DEPARTMENT_MEMBERS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const fetch = useCallback(
    (departmentId: string) => load({ variables: { departmentId } }),
    [load],
  );

  const members = useMemo(
    () => data?.departmentMembers ?? EMPTY,
    [data?.departmentMembers],
  );

  return { fetch, members, loading, error, called, refetch };
}
