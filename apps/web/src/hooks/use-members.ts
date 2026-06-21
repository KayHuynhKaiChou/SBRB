import { useQuery } from '@apollo/client';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import type { TBusinessRole } from '@sbrb/shared-constants';
import type { IBusinessMemberRow, IBusinessMembersResult } from '@sbrb/shared-types';
import {
  BUSINESS_MEMBERS_LIST_QUERY,
  CREATE_STAFF_ACCOUNT_MUTATION,
  DELETE_PENDING_ACCOUNT_MUTATION,
  MY_MEMBERSHIP_QUERY,
  RESEND_ACCOUNT_INVITE_MUTATION,
  SET_MEMBER_ACCOUNT_STATUS_MUTATION,
} from '../graphql/members.operations';
import { UPDATE_MEMBER_INFO_MUTATION } from '../graphql/department.operations';

export type { IBusinessMemberRow };

export interface IMembersFilter {
  search?: string;
  role?: string;
  status?: string;
  offset?: number;
  limit?: number;
}

export interface ICreateStaffInput {
  email: string;
  fullName: string;
  role: TBusinessRole;
}

export interface IUpdateMemberInfoInput {
  fullName: string;
  phone?: string | null;
}

/** Current user's role in the active business — used to gate the page + actions. */
export function useMyBusinessRole(businessId: string | null) {
  const { data, loading } = useQuery<{ myMembership: { id: string; role: TBusinessRole } | null }>(
    MY_MEMBERSHIP_QUERY,
    { variables: { businessId: businessId ?? '' }, skip: !businessId, fetchPolicy: 'cache-first' },
  );
  return { role: data?.myMembership?.role ?? null, loading };
}

interface IUseMembersOptions {
  businessId: string | null;
  filter?: IMembersFilter;
  /** Skip the list query when the caller isn't owner/manager (server rejects it anyway). */
  enabled?: boolean;
}

export function useMembers({ businessId, filter, enabled = true }: IUseMembersOptions) {
  const { data, loading, refetch } = useQuery<{ businessMembers: IBusinessMembersResult }>(
    BUSINESS_MEMBERS_LIST_QUERY,
    {
      variables: { businessId: businessId ?? '', filter },
      skip: !businessId || !enabled,
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
  );

  const refresh = () => void refetch();

  const [createMutation, { loading: createLoading }] = useAppMutation(CREATE_STAFF_ACCOUNT_MUTATION, {
    fallbackSuccess: { vi: 'Đã gửi email mời tài khoản', en: 'Account invite email sent' },
    onSuccess: refresh,
  });
  const [resendMutation, { loading: resendLoading }] = useAppMutation(RESEND_ACCOUNT_INVITE_MUTATION, {
    fallbackSuccess: { vi: 'Đã gửi lại email mời', en: 'Invite email resent' },
    onSuccess: refresh,
  });
  const [removeMutation, { loading: removeLoading }] = useAppMutation(DELETE_PENDING_ACCOUNT_MUTATION, {
    fallbackSuccess: { vi: 'Đã xoá tài khoản chờ kích hoạt', en: 'Pending account deleted' },
    onSuccess: refresh,
  });
  const [setStatusMutation, { loading: setStatusLoading }] = useAppMutation(SET_MEMBER_ACCOUNT_STATUS_MUTATION, {
    fallbackSuccess: { vi: 'Đã cập nhật trạng thái tài khoản', en: 'Account status updated' },
    onSuccess: refresh,
  });
  const [updateInfoMutation, { loading: updateInfoLoading }] = useAppMutation(UPDATE_MEMBER_INFO_MUTATION, {
    fallbackSuccess: { vi: 'Đã cập nhật thông tin', en: 'Member info updated' },
    onSuccess: refresh,
  });

  const create = (input: ICreateStaffInput) =>
    createMutation({ variables: { businessId, input } });
  const resend = (userId: string) =>
    resendMutation({ variables: { businessId, userId } });
  const remove = (userId: string) =>
    removeMutation({ variables: { businessId, userId } });
  const setStatus = (userId: string, active: boolean) =>
    setStatusMutation({ variables: { businessId, userId, active } });
  const updateInfo = (userId: string, input: IUpdateMemberInfoInput) =>
    updateInfoMutation({ variables: { businessId, userId, input } });

  return {
    rows: data?.businessMembers?.rows ?? [],
    total: data?.businessMembers?.total ?? 0,
    loading,
    refetch: refresh,
    create,
    resend,
    remove,
    setStatus,
    updateInfo,
    createLoading,
    resendLoading,
    removeLoading,
    setStatusLoading,
    updateInfoLoading,
  };
}
