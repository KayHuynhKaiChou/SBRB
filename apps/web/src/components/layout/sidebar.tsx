import React from 'react';
import { Layout, Tooltip, Avatar, Badge } from 'antd';
import {
  AppstoreOutlined,
  TableOutlined,
  BarChartOutlined,
  MessageOutlined,
  DatabaseOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const { Sider } = Layout;

/** sbrb sidebar: 60px icon-only, dark wine red */
const SIDEBAR_BG = '#7A1528';
const ICON_COLOR = 'rgba(255,255,255,0.55)';
const ICON_ACTIVE_COLOR = '#ffffff';
const ICON_ACTIVE_BG = 'rgba(255,255,255,0.15)';
const ICON_HOVER_BG = 'rgba(255,255,255,0.08)';

interface INavIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  /** When true: shows reduced opacity and disables pointer events */
  disabled?: boolean;
}

function NavIcon({ icon, label, active, onClick, disabled }: INavIconProps) {
  const [hovered, setHovered] = React.useState(false);

  const bg = active ? ICON_ACTIVE_BG : hovered && !disabled ? ICON_HOVER_BG : 'transparent';
  const color = active ? ICON_ACTIVE_COLOR : ICON_COLOR;

  return (
    <Tooltip title={disabled ? `${label} (sắp ra mắt)` : label} placement="right">
      <div
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
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

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentBusinessId } = useAuthStore();

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isDataSheets = location.pathname === '/data-sheets';

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
          label="Dashboard"
          active={isDashboard}
          onClick={() => navigate(currentBusinessId ? '/dashboard' : '/onboarding')}
        />
        <NavIcon
          icon={<TableOutlined />}
          label="Dữ liệu"
          active={isDataSheets}
          onClick={() => navigate('/data-sheets')}
        />
        <NavIcon
          icon={<BarChartOutlined />}
          label="Benchmark"
          active={false}
          disabled
          onClick={() => undefined}
        />
        <NavIcon
          icon={<MessageOutlined />}
          label="Talk Room"
          active={false}
          disabled
          onClick={() => undefined}
        />
        <NavIcon
          icon={<DatabaseOutlined />}
          label="Data Box"
          active={false}
          disabled
          onClick={() => undefined}
        />
      </div>

      {/* Bottom icons: settings, bell, avatar */}
      <div className="border-t border-white/[0.08] py-2 flex flex-col items-center gap-1">
        <NavIcon icon={<SettingOutlined />} label="Cài đặt" active={false} disabled onClick={() => undefined} />
        <Tooltip title="Thông báo" placement="right">
          <div
            style={{ color: ICON_COLOR }}
            className="w-11 h-11 rounded-[10px] flex items-center justify-center cursor-pointer mx-2 my-0.5 text-lg"
          >
            <Badge dot offset={[2, -2]}>
              <BellOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />
            </Badge>
          </div>
        </Tooltip>
        <Tooltip title={user?.name ?? user?.email ?? 'Profile'} placement="right">
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center cursor-pointer mx-2 my-0.5">
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
