import { useAppMutation } from '@sbrb/shared-apollo-client';
import { useTranslation } from 'react-i18next';
import {
  ADD_DEPARTMENT_MEMBER_MUTATION,
  CREATE_DEPARTMENT_MUTATION,
  DELETE_DEPARTMENT_MUTATION,
  REMOVE_DEPARTMENT_MEMBER_MUTATION,
  SET_DEPARTMENT_MANAGER_MUTATION,
  UPDATE_DEPARTMENT_MUTATION,
} from '../graphql/department.operations';

const TREE_REFETCH = ['DepartmentTree'];
const TREE_AND_MEMBERS_REFETCH = ['DepartmentTree', 'DepartmentMembers'];

export function useCreateDepartment() {
  const { t } = useTranslation(['department']);
  const [mutate, state] = useAppMutation(CREATE_DEPARTMENT_MUTATION, {
    refetchQueries: TREE_REFETCH,
    fallbackSuccess: t('department:create_success'),
    fallbackError: t('department:create_error'),
  });
  return { mutate, ...state };
}

export function useUpdateDepartment() {
  const { t } = useTranslation(['department']);
  const [mutate, state] = useAppMutation(UPDATE_DEPARTMENT_MUTATION, {
    refetchQueries: TREE_REFETCH,
    fallbackSuccess: t('department:update_success'),
    fallbackError: t('department:update_error'),
  });
  return { mutate, ...state };
}

export function useDeleteDepartment() {
  const { t } = useTranslation(['department']);
  const [mutate, state] = useAppMutation(DELETE_DEPARTMENT_MUTATION, {
    refetchQueries: TREE_REFETCH,
    fallbackSuccess: t('department:delete_success'),
    fallbackError: t('department:delete_error'),
  });
  return { mutate, ...state };
}

export function useAddDepartmentMember() {
  const { t } = useTranslation(['department']);
  const [mutate, state] = useAppMutation(ADD_DEPARTMENT_MEMBER_MUTATION, {
    refetchQueries: TREE_AND_MEMBERS_REFETCH,
    fallbackSuccess: t('department:add_member_success'),
    fallbackError: t('department:add_member_error'),
  });
  return { mutate, ...state };
}

export function useRemoveDepartmentMember() {
  const { t } = useTranslation(['department']);
  const [mutate, state] = useAppMutation(REMOVE_DEPARTMENT_MEMBER_MUTATION, {
    refetchQueries: TREE_AND_MEMBERS_REFETCH,
    fallbackSuccess: t('department:remove_member_success'),
    fallbackError: t('department:remove_member_error'),
  });
  return { mutate, ...state };
}

export function useSetDepartmentManager() {
  const { t } = useTranslation(['department']);
  const [mutate, state] = useAppMutation(SET_DEPARTMENT_MANAGER_MUTATION, {
    refetchQueries: TREE_AND_MEMBERS_REFETCH,
    fallbackSuccess: t('department:set_manager_success'),
    fallbackError: t('department:set_manager_error'),
  });
  return { mutate, ...state };
}
