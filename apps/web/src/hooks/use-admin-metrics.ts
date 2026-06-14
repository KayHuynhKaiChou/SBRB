import { useQuery } from '@apollo/client';
import type { IAdminMetrics } from '@sbrb/shared-types';
import { ADMIN_METRICS_QUERY } from '../graphql/admin.operations';

interface IAdminMetricsQueryResult {
  adminMetrics: IAdminMetrics;
}

/** Query hook for admin dashboard metrics. SRS §5.17 */
export function useAdminMetrics() {
  const { data, loading, error, refetch } = useQuery<IAdminMetricsQueryResult>(
    ADMIN_METRICS_QUERY,
    {
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
  );

  return {
    metrics: data?.adminMetrics ?? null,
    loading,
    error,
    refetch,
  };
}
