import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { BUSINESS_MEMBERS_QUERY } from '../graphql/member.operations';

export interface IBusinessMember {
  id: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
  };
}

const EMPTY: IBusinessMember[] = [];

export function useBusinessMembers(businessId: string) {
  const { data, loading, error, refetch } = useQuery<{ members: IBusinessMember[] }>(
    BUSINESS_MEMBERS_QUERY,
    {
      variables: { businessId },
      skip: !businessId,
      fetchPolicy: 'cache-and-network',
    },
  );
  const members = useMemo(() => data?.members ?? EMPTY, [data?.members]);
  return { members, loading, error, refetch };
}
