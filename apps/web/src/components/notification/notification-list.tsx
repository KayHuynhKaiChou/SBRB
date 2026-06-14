import React from 'react';
import { Empty, Button, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { INotification } from '../../hooks/use-notifications';

interface INotificationListProps {
  items: INotification[];
  onItemClick: (n: INotification) => void;
  onMarkAll: () => void;
}

/** Relative time without an extra dep — uses Intl.RelativeTimeFormat. */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return rtf.format(-mins, 'minute');
  const hours = Math.round(mins / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.round(hours / 24), 'day');
}

/** Dropdown body listing notifications with unread highlight + mark-all action. */
export function NotificationList({ items, onItemClick, onMarkAll }: INotificationListProps) {
  const { t } = useTranslation('notification');

  return (
    <div className="w-[340px] max-h-[420px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <Typography.Text strong>{t('title')}</Typography.Text>
        {items.some((n) => !n.isRead) && (
          <Button type="link" size="small" onClick={onMarkAll} className="!text-[#D72A44] !px-0">
            {t('mark_all_read')}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} className="!py-8" />
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              onClick={() => onItemClick(n)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                n.isRead ? '' : 'bg-[#FFF7F8]'
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#D72A44] shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-800">{n.title}</div>
                  <div className="text-[12px] text-gray-500 line-clamp-2">{n.message}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{relativeTime(n.createdAt)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
