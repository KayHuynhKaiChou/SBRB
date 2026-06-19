import React, { useState } from 'react';
import { Badge, Popover, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SIDEBAR_ICON_COLOR } from '@sbrb/shared-constants';
import { useNotifications, type INotification } from '../../hooks/use-notifications';
import { NotificationList } from './notification-list';

/** Bell with unread badge + dropdown list. Click item → mark read + navigate via metadata. */
export function NotificationBell() {
  const { t } = useTranslation('notification');
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleItemClick = async (n: INotification) => {
    if (!n.isRead) await markRead(n.id);
    setOpen(false);
    const route = n.metadata?.route;
    if (route) navigate(route);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="rightTop"
      content={
        <NotificationList
          items={notifications}
          onItemClick={handleItemClick}
          onMarkAll={() => void markAllRead()}
        />
      }
      styles={{ body: { padding: 0 } }}
    >
      <Tooltip title={t('title')} placement="right">
        <div
          data-testid="tour-notification-bell"
          style={{ color: SIDEBAR_ICON_COLOR }}
          className="w-11 h-11 rounded-[10px] flex items-center justify-center cursor-pointer mx-2 my-0.5 text-lg"
        >
          <Badge count={unreadCount} size="small" offset={[2, -2]} overflowCount={9}>
            <BellOutlined style={{ color: SIDEBAR_ICON_COLOR, fontSize: 18 }} />
          </Badge>
        </div>
      </Tooltip>
    </Popover>
  );
}
