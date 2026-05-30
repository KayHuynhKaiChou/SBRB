import { useAppMutation } from '@sbrb/shared-apollo-client';
import {
  ADD_DEPARTMENT_MEMBER_MUTATION,
  ADD_DEPARTMENT_MEMBERS_MUTATION,
  CREATE_DEPARTMENT_MUTATION,
  DELETE_DEPARTMENT_MUTATION,
  REMOVE_DEPARTMENT_MEMBER_MUTATION,
  SET_DEPARTMENT_MANAGER_MUTATION,
  UPDATE_DEPARTMENT_MUTATION,
  UPDATE_MEMBER_INFO_MUTATION,
} from '../graphql/department.operations';

// DepartmentTree is a single deep-nested query — refetching is the simplest way
// to re-render after structural changes (parent/child re-link, member moves).
// Once P3 normalizes Tree into a flat list query we can swap to cache.modify.
const TREE_REFETCH = ['DepartmentTree'];
// Member mutations affect: the tree (memberCount/roll-up), the direct-members list
// (add-member / change-manager candidate modals), and the subtree-members list (detail modal).
const TREE_AND_MEMBERS_REFETCH = [
  'DepartmentTree',
  'DepartmentMembers',
  'DepartmentSubtreeMembers',
];

export function useCreateDepartment() {
  const [mutate, state] = useAppMutation(CREATE_DEPARTMENT_MUTATION, {
    refetchQueries: TREE_REFETCH,
  });
  return { mutate, ...state };
}

export function useUpdateDepartment() {
  const [mutate, state] = useAppMutation(UPDATE_DEPARTMENT_MUTATION, {
    refetchQueries: TREE_REFETCH,
  });
  return { mutate, ...state };
}

export function useDeleteDepartment() {
  const [mutate, state] = useAppMutation(DELETE_DEPARTMENT_MUTATION, {
    refetchQueries: TREE_REFETCH,
  });
  return { mutate, ...state };
}

export function useAddDepartmentMember() {
  const [mutate, state] = useAppMutation(ADD_DEPARTMENT_MEMBER_MUTATION, {
    refetchQueries: TREE_AND_MEMBERS_REFETCH,
  });
  return { mutate, ...state };
}

/** Batch add/transfer multiple users into a department. */
export function useAddDepartmentMembers() {
  const [mutate, state] = useAppMutation(ADD_DEPARTMENT_MEMBERS_MUTATION, {
    refetchQueries: TREE_AND_MEMBERS_REFETCH,
  });
  return { mutate, ...state };
}

export function useRemoveDepartmentMember() {
  const [mutate, state] = useAppMutation(REMOVE_DEPARTMENT_MEMBER_MUTATION, {
    refetchQueries: TREE_AND_MEMBERS_REFETCH,
  });
  return { mutate, ...state };
}

export function useSetDepartmentManager() {
  const [mutate, state] = useAppMutation(SET_DEPARTMENT_MANAGER_MUTATION, {
    refetchQueries: TREE_AND_MEMBERS_REFETCH,
  });
  return { mutate, ...state };
}

export function useUpdateMemberInfo() {
  const [mutate, state] = useAppMutation(UPDATE_MEMBER_INFO_MUTATION, {
    // Refresh tree (memberCount), member list, and subtree list so the modal table shows updated names.
    refetchQueries: ['DepartmentTree', 'DepartmentMembers', 'DepartmentSubtreeMembers'],
  });
  return { mutate, ...state };
}
