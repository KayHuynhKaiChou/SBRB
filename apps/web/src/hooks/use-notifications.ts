import { useQuery, useMutation } from '@apollo/client';
import {
  MY_NOTIFICATIONS_QUERY,
  MY_UNREAD_COUNT_QUERY,
  MARK_NOTIFICATION_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
} from '../graphql/notification.operations';

export interface INotification {
  id: string;
  businessId?: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: { route?: string; [k: string]: unknown } | null;
  createdAt: string;
}

const POLL_MS = 45000;

/**
 * Bell notifications — polls every 45s (non-realtime per spec). Provides list,
 * unread count, and mark-read mutations (refetch on success keeps badge accurate).
 */
export function useNotifications() {
  const { data, refetch } = useQuery<{ myNotifications: INotification[] }>(
    MY_NOTIFICATIONS_QUERY,
    { variables: { limit: 30 }, fetchPolicy: 'cache-and-network', pollInterval: POLL_MS },
  );

  const { data: countData, refetch: refetchCount } = useQuery<{ myUnreadCount: number }>(
    MY_UNREAD_COUNT_QUERY,
    { fetchPolicy: 'cache-and-network', pollInterval: POLL_MS },
  );

  const [markReadMutation] = useMutation(MARK_NOTIFICATION_READ_MUTATION);
  const [markAllMutation] = useMutation(MARK_ALL_NOTIFICATIONS_READ_MUTATION);

  const refresh = () => {
    void refetch();
    void refetchCount();
  };

  const markRead = async (id: string) => {
    await markReadMutation({ variables: { id } });
    refresh();
  };

  const markAllRead = async () => {
    await markAllMutation();
    refresh();
  };

  return {
    notifications: data?.myNotifications ?? [],
    unreadCount: countData?.myUnreadCount ?? 0,
    markRead,
    markAllRead,
    refresh,
  };
}
