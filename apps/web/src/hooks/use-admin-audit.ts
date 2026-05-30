import { useQuery } from '@apollo/client';
import { ADMIN_AUDIT_LOG_QUERY } from '../graphql/admin.operations';

export interface IAdminAuditRow {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  targetId: string | null;
  targetType: string | null;
  targetName: string | null;
  businessId: string | null;
  meta: string;
  createdAt: string;
}

interface IAuditFilter {
  actorEmail?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface IPageInput {
  offset?: number;
  limit?: number;
}

interface IAuditQueryResult {
  adminAuditLog: {
    rows: IAdminAuditRow[];
    total: number;
  };
}

interface IUseAdminAuditOptions {
  filter?: IAuditFilter;
  page?: IPageInput;
}

/** Query hook for admin audit log page. SRS §5.16 */
export function useAdminAudit({ filter, page }: IUseAdminAuditOptions = {}) {
  const { data, loading, error, refetch } = useQuery<IAuditQueryResult>(
    ADMIN_AUDIT_LOG_QUERY,
    {
      variables: { filter, page },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
  );

  return {
    rows: data?.adminAuditLog?.rows ?? [],
    total: data?.adminAuditLog?.total ?? 0,
    loading,
    error,
    refetch,
  };
}
