import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import {
  DEPARTMENTS_QUERY,
  CREATE_DEPARTMENT_MUTATION,
  UPDATE_DEPARTMENT_MUTATION,
  DELETE_DEPARTMENT_MUTATION,
} from '../graphql/department.operations';

export interface IDepartmentDto {
  id: string;
  name: string;
  parentId: string | null;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateDepartmentInput {
  businessId: string;
  name: string;
  parentId?: string | null;
}

export interface IUpdateDepartmentInput {
  name?: string;
  parentId?: string | null;
}

export function useDepartments(businessId: string) {
  const { t } = useTranslation(['department']);

  const { data, loading, refetch } = useQuery(DEPARTMENTS_QUERY, {
    variables: { businessId },
    skip: !businessId,
    fetchPolicy: 'cache-and-network',
  });

  const departments: IDepartmentDto[] = data?.departments ?? [];

  const [createMutation] = useAppMutation(CREATE_DEPARTMENT_MUTATION, {
    fallbackSuccess: t('department:create_success'),
    fallbackError: t('department:create_error'),
  });
  const [updateMutation] = useAppMutation(UPDATE_DEPARTMENT_MUTATION, {
    fallbackSuccess: t('department:update_success'),
    fallbackError: t('department:update_error'),
  });
  const [deleteMutation] = useAppMutation(DELETE_DEPARTMENT_MUTATION, {
    fallbackSuccess: t('department:delete_success'),
    fallbackError: t('department:delete_error'),
  });

  const create = async (input: Omit<ICreateDepartmentInput, 'businessId'>) => {
    const result = await createMutation({
      variables: { input: { ...input, businessId } },
      update: (cache, { data: mutationData }) => {
        const newDept = mutationData?.createDepartment;
        if (!newDept) return;
        const existing = cache.readQuery<{ departments: IDepartmentDto[] }>({
          query: DEPARTMENTS_QUERY,
          variables: { businessId },
        });
        if (existing) {
          cache.writeQuery({
            query: DEPARTMENTS_QUERY,
            variables: { businessId },
            data: { departments: [...existing.departments, newDept] },
          });
        } else {
          refetch().catch(() => null);
        }
      },
    });
    if (result.errors) throw new Error('create_failed');
  };

  const update = async (id: string, input: IUpdateDepartmentInput) => {
    const result = await updateMutation({
      variables: { id, input },
      update: (cache, { data: mutationData }) => {
        const updated = mutationData?.updateDepartment;
        if (!updated) return;
        const existing = cache.readQuery<{ departments: IDepartmentDto[] }>({
          query: DEPARTMENTS_QUERY,
          variables: { businessId },
        });
        if (existing) {
          cache.writeQuery({
            query: DEPARTMENTS_QUERY,
            variables: { businessId },
            data: {
              departments: existing.departments.map((d) =>
                d.id === id ? { ...d, ...updated } : d,
              ),
            },
          });
        } else {
          refetch().catch(() => null);
        }
      },
    });
    if (result.errors) throw new Error('update_failed');
  };

  const remove = async (id: string) => {
    const result = await deleteMutation({
      variables: { id },
      update: (cache) => {
        const existing = cache.readQuery<{ departments: IDepartmentDto[] }>({
          query: DEPARTMENTS_QUERY,
          variables: { businessId },
        });
        if (existing) {
          cache.writeQuery({
            query: DEPARTMENTS_QUERY,
            variables: { businessId },
            data: { departments: existing.departments.filter((d) => d.id !== id) },
          });
        } else {
          refetch().catch(() => null);
        }
      },
    });
    if (result.errors) throw new Error('delete_failed');
  };

  return { departments, loading, refetch, create, update, remove };
}
