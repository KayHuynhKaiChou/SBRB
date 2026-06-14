import React from 'react';
import { Layout, Tooltip, Avatar } from 'antd';
import { useHover } from '@uidotdev/usehooks';
import {
  AppstoreOutlined,
  ShopOutlined,
  TeamOutlined,
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  APP_ROUTES,
  SIDEBAR_BG,
  SIDEBAR_ICON_ACTIVE_BG,
  SIDEBAR_ICON_ACTIVE_COLOR,
  SIDEBAR_ICON_COLOR,
  SIDEBAR_ICON_HOVER_BG,
} from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/use-auth';
import { NotificationBell } from '../notification/notification-bell';

const { Sider } = Layout;

interface INavIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function NavIcon({ icon, label, active, onClick, disabled }: INavIconProps) {
  const [hoverRef, hovered] = useHover<HTMLDivElement>();

  const bg = active ? SIDEBAR_ICON_ACTIVE_BG : hovered && !disabled ? SIDEBAR_ICON_HOVER_BG : 'transparent';
  const color = active ? SIDEBAR_ICON_ACTIVE_COLOR : SIDEBAR_ICON_COLOR;

  return (
    <Tooltip title={disabled ? `${label} (coming soon)` : label} placement="right">
      <div
        ref={hoverRef}
        onClick={disabled ? undefined : onClick}
        style={{
          background: bg,
          color,
          borderLeft: active ? '3px solid var(--sbrb-accent-coral)' : '3px solid transparent',
          opacity: disabled ? 0.4 : 1,
        }}
        className={`w-11 h-11 rounded-[10px] flex items-center justify-center text-lg mx-2 my-0.5 transition-[background,color] duration-150 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {icon}
      </div>
    </Tooltip>
  );
}

/** Sidebar for platform admin users — dispatched by the Sidebar orchestrator. */
export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('admin');
  // Granular selector — re-render only when user object changes, not on token rotation
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const isDashboard = location.pathname === APP_ROUTES.ADMIN;
  const isBusinesses = location.pathname.startsWith(APP_ROUTES.ADMIN_BUSINESSES);
  const isUsers = location.pathname.startsWith(APP_ROUTES.ADMIN_USERS);
  const isAudit = location.pathname.startsWith(APP_ROUTES.ADMIN_AUDIT);

  return (
    <Sider
      width={60}
      collapsedWidth={60}
      collapsed
      trigger={null}
      style={{ background: SIDEBAR_BG }}
      className="!flex !flex-col !h-screen !overflow-hidden !fixed !left-0 !top-0 !z-[200]"
    >
      {/* Logo */}
      <div className="h-[52px] flex items-center justify-center border-b border-white/[0.08]">
        <span className="text-[11px] font-bold text-white tracking-[1px] lowercase">
          SBRB
        </span>
      </div>

      {/* Top nav icons */}
      <div className="flex-1 pt-2 flex flex-col gap-0">
        <NavIcon
          icon={<AppstoreOutlined />}
          label={t('nav_dashboard')}
          active={isDashboard}
          onClick={() => navigate(APP_ROUTES.ADMIN)}
        />
        <NavIcon
          icon={<ShopOutlined />}
          label={t('nav_businesses')}
          active={isBusinesses}
          onClick={() => navigate(APP_ROUTES.ADMIN_BUSINESSES)}
        />
        <NavIcon
          icon={<TeamOutlined />}
          label={t('nav_users')}
          active={isUsers}
          onClick={() => navigate(APP_ROUTES.ADMIN_USERS)}
        />
        <NavIcon
          icon={<AuditOutlined />}
          label={t('nav_audit')}
          active={isAudit}
          onClick={() => navigate(APP_ROUTES.ADMIN_AUDIT)}
        />
      </div>

      {/* Bottom: bell + avatar + logout */}
      <div className="border-t border-white/[0.08] py-2 flex flex-col items-center gap-1">
        <NotificationBell />
        <Tooltip title={user?.email ?? 'Admin'} placement="right">
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center mx-2 my-0.5">
            <Avatar
              size={28}
              src={user?.avatarUrl}
              icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
              style={{ background: 'var(--sbrb-accent-coral)' }}
            />
          </div>
        </Tooltip>
        <Tooltip title={t('nav_logout')} placement="right">
          <div
            onClick={logout}
            style={{ color: SIDEBAR_ICON_COLOR }}
            className="w-11 h-11 rounded-[10px] flex items-center justify-center text-lg mx-2 my-0.5 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <LogoutOutlined />
          </div>
        </Tooltip>
      </div>
    </Sider>
  );
}
