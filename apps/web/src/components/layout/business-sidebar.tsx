import React from 'react';
import { Layout, Tooltip, Avatar, Badge } from 'antd';
import { useHover } from '@uidotdev/usehooks';
import {
  AppstoreOutlined,
  TableOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  MessageOutlined,
  DatabaseOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  SIDEBAR_BG,
  SIDEBAR_ICON_ACTIVE_BG,
  SIDEBAR_ICON_ACTIVE_COLOR,
  SIDEBAR_ICON_COLOR,
  SIDEBAR_ICON_HOVER_BG,
} from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';

const { Sider } = Layout;

interface INavIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

interface INavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  /** Route prefix for active-state matching + default navigation target. Omit for disabled items. */
  path?: string;
  /** Navigation target when it differs from `path` (e.g. dashboard → onboarding fallback). */
  to?: string;
  disabled?: boolean;
}

function NavIcon({ icon, label, active, onClick, disabled }: INavIconProps) {
  const [hoverRef, hovered] = useHover<HTMLDivElement>();

  const bg = active ? SIDEBAR_ICON_ACTIVE_BG : hovered && !disabled ? SIDEBAR_ICON_HOVER_BG : 'transparent';
  const color = active ? SIDEBAR_ICON_ACTIVE_COLOR : SIDEBAR_ICON_COLOR;

  return (
    <Tooltip title={disabled ? `${label} (sắp ra mắt)` : label} placement="right">
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

/** Sidebar for regular business users — extracted from Sidebar dispatcher. */
export function BusinessSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentBusinessId } = useAuthStore();

  // Data-driven nav config — thêm menu mới chỉ cần thêm 1 entry vào mảng này.
  const navItems: INavItem[] = [
    {
      key: 'dashboard',
      icon: <AppstoreOutlined />,
      label: 'Dashboard',
      path: '/dashboard',
      to: currentBusinessId ? '/dashboard' : '/onboarding',
    },
    { key: 'data-sheets', icon: <TableOutlined />, label: 'Dữ liệu', path: '/data-sheets' },
    { key: 'departments', icon: <ApartmentOutlined />, label: 'Phòng ban', path: '/departments' },
    { key: 'benchmark', icon: <BarChartOutlined />, label: 'Benchmark', disabled: true },
    { key: 'talk-room', icon: <MessageOutlined />, label: 'Talk Room', disabled: true },
    { key: 'data-box', icon: <DatabaseOutlined />, label: 'Data Box', disabled: true },
  ];

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
        {navItems.map((item) => (
          <NavIcon
            key={item.key}
            icon={item.icon}
            label={item.label}
            disabled={item.disabled}
            active={!item.disabled && !!item.path && location.pathname.startsWith(item.path)}
            onClick={() => item.path && navigate(item.to ?? item.path)}
          />
        ))}
      </div>

      {/* Bottom icons: settings, bell, avatar */}
      <div className="border-t border-white/[0.08] py-2 flex flex-col items-center gap-1">
        <NavIcon icon={<SettingOutlined />} label="Cài đặt" active={false} disabled onClick={() => undefined} />
        <Tooltip title="Thông báo" placement="right">
          <div
            style={{ color: SIDEBAR_ICON_COLOR }}
            className="w-11 h-11 rounded-[10px] flex items-center justify-center cursor-pointer mx-2 my-0.5 text-lg"
          >
            <Badge dot offset={[2, -2]}>
              <BellOutlined style={{ color: SIDEBAR_ICON_COLOR, fontSize: 18 }} />
            </Badge>
          </div>
        </Tooltip>
        <Tooltip title={user?.fullName ?? user?.email ?? 'Profile'} placement="right">
          <div
            onClick={() => navigate('/profile')}
            style={{
              borderLeft: location.pathname.startsWith('/profile')
                ? '3px solid var(--sbrb-accent-coral)'
                : '3px solid transparent',
            }}
            className="w-11 h-11 rounded-[10px] flex items-center justify-center cursor-pointer mx-2 my-0.5 transition-[border-color] duration-150"
          >
            <Avatar
              size={28}
              src={user?.avatarUrl}
              icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
              style={{ background: 'var(--sbrb-accent-coral)' }}
            />
          </div>
        </Tooltip>
      </div>
    </Sider>
  );
}
