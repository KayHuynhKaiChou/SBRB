import { useQuery } from '@apollo/client';
import type { TBusinessRole } from '@sbrb/shared-constants';
import { DEPARTMENT_TREE_QUERY } from '../graphql/department.operations';

export interface IDepartmentMemberRef {
  id: string;
  departmentId: string;
  userId: string;
  isManager: boolean;
  businessRole: TBusinessRole | null;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
  };
}

export interface IDepartmentNode {
  id: string;
  name: string;
  parentId: string | null;
  businessId: string;
  isRoot: boolean;
  positionX: number | null;
  positionY: number | null;
  memberCount: number;
  manager: IDepartmentMemberRef | null;
  children?: IDepartmentNode[];
  createdAt: string;
  updatedAt: string;
}

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
