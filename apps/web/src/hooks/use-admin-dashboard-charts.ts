import { useQuery } from '@apollo/client';
import type { IAdminDashboardCharts } from '@sbrb/shared-types';
import { ADMIN_DASHBOARD_CHARTS_QUERY } from '../graphql/admin.operations';

interface IAdminDashboardChartsQueryResult {
  adminDashboardCharts: IAdminDashboardCharts;
}

/** Query hook for admin dashboard chart datasets. SRS §5.17 */
export function useAdminDashboardCharts() {
  const { data, loading, error, refetch } = useQuery<IAdminDashboardChartsQueryResult>(
    ADMIN_DASHBOARD_CHARTS_QUERY,
    {
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
  );

  return {
    charts: data?.adminDashboardCharts ?? null,
    loading,
    error,
    refetch,
  };
}
