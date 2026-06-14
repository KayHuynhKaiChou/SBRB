import { useQuery, useMutation } from '@apollo/client';
import { message } from 'antd';
import {
  ADMIN_BUSINESS_DETAIL_QUERY,
  ADMIN_CHANGE_REQUESTS_QUERY,
  APPROVE_CHANGE_REQUEST_MUTATION,
  REJECT_CHANGE_REQUEST_MUTATION,
} from '../graphql/admin.operations';

export interface IAdminBusinessDetail {
  id: string;
  name: string;
  industry: string;
  currency: string;
  status: string;
  rejectionReason?: string | null;
  memberCount: number;
  legalName?: string | null;
  taxCode?: string | null;
  businessType?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  licenseSignedUrl?: string | null;
  foundedYear?: number | null;
  companySize?: string | null;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

export interface IAdminChangeRequest {
  id: string;
  businessId: string;
  businessName: string;
  requestedByEmail: string;
  status: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  createdAt: string;
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
    approveChange: (id: string) => approveMutation({ variables: { id } }),
    rejectChange: (id: string, reason: string) => rejectMutation({ variables: { id, reason } }),
    approveLoading,
    rejectLoading,
  };
}
