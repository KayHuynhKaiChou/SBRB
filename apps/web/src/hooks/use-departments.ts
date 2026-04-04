import { useQuery, useMutation } from '@apollo/client';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
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

  const [createMutation] = useMutation(CREATE_DEPARTMENT_MUTATION);
  const [updateMutation] = useMutation(UPDATE_DEPARTMENT_MUTATION);
  const [deleteMutation] = useMutation(DELETE_DEPARTMENT_MUTATION);

  const create = async (input: Omit<ICreateDepartmentInput, 'businessId'>) => {
    try {
      await createMutation({
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
      message.success(t('department:create_success'));
    } catch (err) {
      message.error(t('department:create_error'));
      throw err;
    }
  };

  const update = async (id: string, input: IUpdateDepartmentInput) => {
    try {
      await updateMutation({
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
      message.success(t('department:update_success'));
    } catch (err) {
      message.error(t('department:update_error'));
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteMutation({
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
      message.success(t('department:delete_success'));
    } catch (err) {
      message.error(t('department:delete_error'));
      throw err;
    }
  };

  return { departments, loading, refetch, create, update, remove };
}
