import { useLazyQuery } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import { DEPARTMENT_MEMBERS_QUERY } from '../graphql/department.operations';
import type { IDepartmentMemberRef } from './use-department-tree';

export type IDepartmentMember = IDepartmentMemberRef;

const EMPTY: IDepartmentMember[] = [];

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
