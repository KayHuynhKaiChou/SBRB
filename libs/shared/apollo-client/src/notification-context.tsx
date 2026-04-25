import { App } from 'antd';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveMessage } from './resolve-message';
import type { INotifyPayload, MaybeLocalizedMessage } from './types';

export interface INotifyApi {
  notify: (payload: INotifyPayload) => void;
  success: (message: MaybeLocalizedMessage, description?: MaybeLocalizedMessage) => void;
  error: (message: MaybeLocalizedMessage, description?: MaybeLocalizedMessage) => void;
  info: (message: MaybeLocalizedMessage, description?: MaybeLocalizedMessage) => void;
  warning: (message: MaybeLocalizedMessage, description?: MaybeLocalizedMessage) => void;
  /** Current i18n language, useful for resolving messages outside React tree. */
  locale: string;
}

const NotifyContext = createContext<INotifyApi | null>(null);

function NotifyBridge({ children }: { children: ReactNode }) {
  const { notification } = App.useApp();
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const api = useMemo<INotifyApi>(() => {
    const notify = ({ type, message, description, duration }: INotifyPayload) => {
      notification[type]({
        message: resolveMessage(message, locale),
        description: description ? resolveMessage(description, locale) : undefined,
        duration: duration ?? (type === 'error' ? 6 : 4),
        placement: 'topRight',
      });
    };
    return {
      notify,
      success: (m, d) => notify({ type: 'success', message: m, description: d }),
      error: (m, d) => notify({ type: 'error', message: m, description: d }),
      info: (m, d) => notify({ type: 'info', message: m, description: d }),
      warning: (m, d) => notify({ type: 'warning', message: m, description: d }),
      locale,
    };
  }, [notification, locale]);

  return <NotifyContext.Provider value={api}>{children}</NotifyContext.Provider>;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <App>
      <NotifyBridge>{children}</NotifyBridge>
    </App>
  );
}

export function useNotify(): INotifyApi {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('useNotify must be used within <NotificationProvider>');
  }
  return ctx;
}
