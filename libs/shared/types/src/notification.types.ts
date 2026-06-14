/** Notification types — SRS §5.x bell notifications */

/** A bell notification entry. */
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
