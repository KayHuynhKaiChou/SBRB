import { useMutation, useQuery } from '@apollo/client';
import { message } from 'antd';
import {
  ADMIN_BUSINESSES_QUERY,
  ADMIN_CHANGE_BUSINESS_OWNER_MUTATION,
  INACTIVATE_BUSINESS_MUTATION,
  REACTIVATE_BUSINESS_MUTATION,
  APPROVE_BUSINESS_MUTATION,
  REJECT_BUSINESS_MUTATION,
} from '../graphql/admin.operations';

export interface IAdminBusinessRow {
  id: string;
  name: string;
  industry: string;
  ownerEmail: string;
  memberCount: number;
  status: string;
  rejectionReason?: string | null;
  inactivatedAt?: string | null;
  inactiveReason?: string | null;
  createdAt: string;
}

interface IAdminBusinessesQueryResult {
  adminBusinesses: {
    rows: IAdminBusinessRow[];
    total: number;
  };
}

interface IAdminBusinessesFilter {
  search?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'resubmitted' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface IPageInput {
  offset?: number;
  limit?: number;
}

interface IUseAdminBusinessesOptions {
  filter?: IAdminBusinessesFilter;
  page?: IPageInput;
}

export function useAdminBusinesses({ filter, page }: IUseAdminBusinessesOptions = {}) {
  const { data, loading, error, refetch } = useQuery<IAdminBusinessesQueryResult>(
    ADMIN_BUSINESSES_QUERY,
    {
      variables: { filter, page },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
  );

  const [inactivateMutation, { loading: inactivateLoading }] = useMutation(
    INACTIVATE_BUSINESS_MUTATION,
    {
      onCompleted: () => {
        void message.success('Business inactivated successfully');
        void refetch();
      },
      onError: (err) => {
        void message.error(err.message || 'Failed to inactivate business');
      },
    },
  );

  const [reactivateMutation, { loading: reactivateLoading }] = useMutation(
    REACTIVATE_BUSINESS_MUTATION,
    {
      onCompleted: () => {
        void message.success('Business reactivated successfully');
        void refetch();
      },
      onError: (err) => {
        void message.error(err.message || 'Failed to reactivate business');
      },
    },
  );

  const [changeOwnerMutation, { loading: changeOwnerLoading }] = useMutation(
    ADMIN_CHANGE_BUSINESS_OWNER_MUTATION,
    {
      refetchQueries: ['AdminBusinesses'],
      onError: (err) => {
        void message.error(err.message || 'Failed to change business owner');
      },
    },
  );

  const inactivateBusiness = (id: string, reason: string) =>
    inactivateMutation({ variables: { id, reason } });

  const reactivateBusiness = (id: string) =>
    reactivateMutation({ variables: { id } });

  const changeOwner = (businessId: string, newOwnerUserId: string) =>
    changeOwnerMutation({ variables: { businessId, newOwnerUserId } });

  const [approveMutation, { loading: approveLoading }] = useMutation(
    APPROVE_BUSINESS_MUTATION,
    {
      onCompleted: () => {
        void message.success('Business approved');
        void refetch();
      },
      onError: (err) => void message.error(err.message || 'Failed to approve'),
    },
  );

  const [rejectMutation, { loading: rejectLoading }] = useMutation(
    REJECT_BUSINESS_MUTATION,
    {
      onCompleted: () => {
        void message.success('Business rejected');
        void refetch();
      },
      onError: (err) => void message.error(err.message || 'Failed to reject'),
    },
  );

  const approveBusiness = (id: string) => approveMutation({ variables: { id } });
  const rejectBusiness = (id: string, reason: string) =>
    rejectMutation({ variables: { id, reason } });

  return {
    rows: data?.adminBusinesses?.rows ?? [],
    total: data?.adminBusinesses?.total ?? 0,
    loading,
    error,
    refetch,
    inactivateBusiness,
    reactivateBusiness,
    changeOwner,
    approveBusiness,
    rejectBusiness,
    inactivateLoading,
    reactivateLoading,
    changeOwnerLoading,
    approveLoading,
    rejectLoading,
  };
}
