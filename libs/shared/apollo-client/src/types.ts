export type LocalizedMessage = { vi: string; en: string };

export type MaybeLocalizedMessage = string | LocalizedMessage;

export type NotifyType = 'success' | 'error' | 'info' | 'warning';

export interface INotifyPayload {
  type: NotifyType;
  message: MaybeLocalizedMessage;
  description?: MaybeLocalizedMessage;
  duration?: number;
}
