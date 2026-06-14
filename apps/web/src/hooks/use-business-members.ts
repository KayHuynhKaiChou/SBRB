import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import type { IBusinessMember } from '@sbrb/shared-types';
import { BUSINESS_MEMBERS_QUERY } from '../graphql/member.operations';

export type { IBusinessMember };

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
