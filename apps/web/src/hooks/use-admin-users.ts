import { useMutation, useQuery } from '@apollo/client';
import { message } from 'antd';
import {
  ADMIN_USERS_QUERY,
  DISABLE_USER_MUTATION,
  ENABLE_USER_MUTATION,
} from '../graphql/admin.operations';

export interface IAdminUserRow {
  id: string;
  email: string;
  fullName: string;
  platformRole?: string | null;
  isDisabled: boolean;
  businessCount: number;
  lastLoginAt?: string | null;
  createdAt: string;
}

interface IAdminUsersQueryResult {
  adminUsers: {
    rows: IAdminUserRow[];
    total: number;
  };
}

interface IAdminUsersFilter {
  search?: string;
  isDisabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface IPageInput {
  offset?: number;
  limit?: number;
}

interface IUseAdminUsersOptions {
  filter?: IAdminUsersFilter;
  page?: IPageInput;
}

export function useAdminUsers({ filter, page }: IUseAdminUsersOptions = {}) {
  const { data, loading, error, refetch } = useQuery<IAdminUsersQueryResult>(
    ADMIN_USERS_QUERY,
    {
      variables: { filter, page },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
  );

  const [disableMutation, { loading: disableLoading }] = useMutation(
    DISABLE_USER_MUTATION,
    {
      onCompleted: () => {
        void message.success('User disabled successfully');
        void refetch();
      },
      onError: (err) => {
        void message.error(err.message || 'Failed to disable user');
      },
    },
  );

  const [enableMutation, { loading: enableLoading }] = useMutation(
    ENABLE_USER_MUTATION,
    {
      onCompleted: () => {
        void message.success('User enabled successfully');
        void refetch();
      },
      onError: (err) => {
        void message.error(err.message || 'Failed to enable user');
      },
    },
  );

  const disableUser = (id: string) => disableMutation({ variables: { id } });
  const enableUser = (id: string) => enableMutation({ variables: { id } });

  return {
    rows: data?.adminUsers?.rows ?? [],
    total: data?.adminUsers?.total ?? 0,
    loading,
    error,
    refetch,
    disableUser,
    enableUser,
    disableLoading,
    enableLoading,
  };
}
