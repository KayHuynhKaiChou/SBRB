import { useAppMutation } from '@sbrb/shared-apollo-client';
import {
  ADD_DEPARTMENT_MEMBER_MUTATION,
  CREATE_DEPARTMENT_MUTATION,
  DELETE_DEPARTMENT_MUTATION,
  REMOVE_DEPARTMENT_MEMBER_MUTATION,
  SET_DEPARTMENT_MANAGER_MUTATION,
  UPDATE_DEPARTMENT_MUTATION,
} from '../graphql/department.operations';

// DepartmentTree is a single deep-nested query — refetching is the simplest way
// to re-render after structural changes (parent/child re-link, member moves).
// Once P3 normalizes Tree into a flat list query we can swap to cache.modify.
const TREE_REFETCH = ['DepartmentTree'];
const TREE_AND_MEMBERS_REFETCH = ['DepartmentTree', 'DepartmentMembers'];

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
