import { useQuery } from '@apollo/client';
import { useAppMutation, useListCache } from '@sbrb/shared-apollo-client';
import type {
  IApiResponse,
  ICreateDepartmentInput,
  IDepartmentDto,
  IUpdateDepartmentInput,
} from '@sbrb/shared-types';
import {
  DEPARTMENTS_QUERY,
  CREATE_DEPARTMENT_MUTATION,
  UPDATE_DEPARTMENT_MUTATION,
  DELETE_DEPARTMENT_MUTATION,
} from '../graphql/department.operations';

// Re-export for back-compat with existing consumers in this app.
export type { ICreateDepartmentInput, IDepartmentDto, IUpdateDepartmentInput };

interface IDepartmentsQueryResult {
  departments: IDepartmentDto[];
}

interface IDepartmentMutationResult {
  createDepartment?: IApiResponse<IDepartmentDto>;
  updateDepartment?: IApiResponse<IDepartmentDto>;
  deleteDepartment?: IApiResponse<{ id: string; businessId: string; parentId: string | null }>;
}

export function useDepartments(businessId: string) {
  const { data, loading, refetch } = useQuery<IDepartmentsQueryResult>(DEPARTMENTS_QUERY, {
    variables: { businessId },
    skip: !businessId,
    fetchPolicy: 'cache-and-network',
  });

  const departments: IDepartmentDto[] = data?.departments ?? [];

  const deptCache = useListCache<IDepartmentsQueryResult, { businessId: string }, IDepartmentDto>({
    query: DEPARTMENTS_QUERY,
    variables: { businessId },
    read: (d) => d.departments,
    write: (d, items) => ({ ...d, departments: items }),
  });

  const [createMutation] = useAppMutation<IDepartmentMutationResult>(CREATE_DEPARTMENT_MUTATION);
  const [updateMutation] = useAppMutation<IDepartmentMutationResult>(UPDATE_DEPARTMENT_MUTATION);
  const [deleteMutation] = useAppMutation<IDepartmentMutationResult>(DELETE_DEPARTMENT_MUTATION, {
    onSuccess: (data) => {
      const deleted = data?.deleteDepartment?.data;
      if (!deleted) return;
      deptCache.removeById(deleted.id);
      deptCache.evict('DepartmentType', deleted.id);
    },
  });

  const create = async (input: Omit<ICreateDepartmentInput, 'businessId'>) => {
    const result = await createMutation({ variables: { input: { ...input, businessId } } });
    const newDept = result.data?.createDepartment?.data;
    if (newDept) deptCache.append(newDept);
    if (result.errors) throw new Error('create_failed');
  };

  const update = async (id: string, input: IUpdateDepartmentInput) => {
    // Apollo normalizes the returned Department by id; the list view auto-refreshes.
    const result = await updateMutation({ variables: { id, input } });
    if (result.errors) throw new Error('update_failed');
  };

  const remove = async (id: string) => {
    const result = await deleteMutation({ variables: { id } });
    if (result.errors) throw new Error('delete_failed');
  };

  return { departments, loading, refetch, create, update, remove };
}
