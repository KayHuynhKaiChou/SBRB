import { useQuery } from '@apollo/client';
import type { IDepartmentMemberRef, IDepartmentNode } from '@sbrb/shared-types';
import { DEPARTMENT_TREE_QUERY } from '../graphql/department.operations';

export type { IDepartmentMemberRef, IDepartmentNode };

export function useDepartmentTree(businessId: string) {
  const { data, loading, error, refetch } = useQuery<{
    departmentTree: IDepartmentNode[];
  }>(DEPARTMENT_TREE_QUERY, {
    variables: { businessId },
    skip: !businessId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    tree: data?.departmentTree,
    loading,
    error,
    refetch,
  };
}
