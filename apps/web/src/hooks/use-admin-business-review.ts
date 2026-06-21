import { useQuery, useMutation } from '@apollo/client';
import { message } from 'antd';
import {
  ADMIN_BUSINESS_DETAIL_QUERY,
  ADMIN_CHANGE_REQUESTS_QUERY,
  APPROVE_CHANGE_REQUEST_MUTATION,
  REJECT_CHANGE_REQUEST_MUTATION,
} from '../graphql/admin.operations';
import type { IAdminBusinessDetail, IAdminChangeRequest } from '@sbrb/shared-types';

export type { IAdminBusinessDetail, IAdminChangeRequest };

/**
 * Re-throw GraphQL errors that Apollo resolves into `result.errors` (because an onError
 * handler is set) so awaiting callers (FormModals) stay open on failure. Toast already shown.
 */
async function throwOnGqlError<T extends { errors?: readonly { message?: string }[] }>(
  p: Promise<T>,
): Promise<T> {
  const res = await p;
  if (res?.errors && res.errors.length > 0) {
    throw new Error(res.errors[0]?.message ?? 'Mutation failed');
  }
  return res;
}

/** Fetch full business detail for the review drawer (skipped until an id is set). */
export function useAdminBusinessDetail(id: string | null) {
  const { data, loading } = useQuery<{ adminBusinessDetail: IAdminBusinessDetail }>(
    ADMIN_BUSINESS_DETAIL_QUERY,
    { variables: { id: id ?? '' }, skip: !id, fetchPolicy: 'cache-and-network' },
  );
  return { detail: data?.adminBusinessDetail ?? null, loading };
}

/** List + approve/reject pending change-requests. */
export function useAdminChangeRequests() {
  const { data, loading, refetch } = useQuery<{ adminChangeRequests: IAdminChangeRequest[] }>(
    ADMIN_CHANGE_REQUESTS_QUERY,
    { fetchPolicy: 'cache-and-network', notifyOnNetworkStatusChange: true },
  );

  const [approveMutation, { loading: approveLoading }] = useMutation(
    APPROVE_CHANGE_REQUEST_MUTATION,
    {
      onCompleted: () => {
        void message.success('Change approved');
        void refetch();
      },
      onError: (err) => void message.error(err.message),
    },
  );

  const [rejectMutation, { loading: rejectLoading }] = useMutation(
    REJECT_CHANGE_REQUEST_MUTATION,
    {
      onCompleted: () => {
        void message.success('Change rejected');
        void refetch();
      },
      onError: (err) => void message.error(err.message),
    },
  );

  return {
    rows: data?.adminChangeRequests ?? [],
    loading,
    refetch,
    approveChange: (id: string) => throwOnGqlError(approveMutation({ variables: { id } })),
    rejectChange: (id: string, reason: string) =>
      throwOnGqlError(rejectMutation({ variables: { id, reason } })),
    approveLoading,
    rejectLoading,
  };
}
