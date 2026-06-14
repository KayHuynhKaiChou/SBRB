import { gql } from '@apollo/client';

export const MY_NOTIFICATIONS_QUERY = gql`
  query MyNotifications($unreadOnly: Boolean, $limit: Int) {
    myNotifications(unreadOnly: $unreadOnly, limit: $limit) {
      id
      businessId
      type
      title
      message
      isRead
      metadata
      createdAt
    }
  }
`;

export const MY_UNREAD_COUNT_QUERY = gql`
  query MyUnreadCount {
    myUnreadCount
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;
