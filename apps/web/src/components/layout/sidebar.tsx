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

/** kpiee sidebar: 60px icon-only, dark wine red */
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
}

function NavIcon({ icon, label, active, onClick }: INavIconProps) {
  const [hovered, setHovered] = React.useState(false);

  const bg = active ? ICON_ACTIVE_BG : hovered ? ICON_HOVER_BG : 'transparent';
  const color = active ? ICON_ACTIVE_COLOR : ICON_COLOR;

  return (
    <Tooltip title={label} placement="right">
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: bg,
          color,
          fontSize: 18,
          margin: '2px 8px',
          transition: 'background 0.15s, color 0.15s',
          borderLeft: active ? '3px solid var(--kpiee-accent-coral)' : '3px solid transparent',
        }}
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
      style={{
        background: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 200,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: 1,
            textTransform: 'lowercase',
          }}
        >
          kpiee
        </span>
      </div>

      {/* Top nav icons */}
      <div style={{ flex: 1, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <NavIcon
          icon={<AppstoreOutlined />}
          label="Dashboard"
          active={isDashboard}
          onClick={() => navigate(currentBusinessId ? `/dashboard/${currentBusinessId}` : '/onboarding')}
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
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onClick={() => {}}
        />
        <NavIcon
          icon={<MessageOutlined />}
          label="Talk Room"
          active={false}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onClick={() => {}}
        />
        <NavIcon
          icon={<DatabaseOutlined />}
          label="Data Box"
          active={false}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onClick={() => {}}
        />
      </div>

      {/* Bottom icons: settings, bell, avatar */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 8,
          paddingBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-empty-function */}
        <NavIcon icon={<SettingOutlined />} label="Cài đặt" active={false} onClick={() => {}} />
        <Tooltip title="Thông báo" placement="right">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              margin: '2px 8px',
              color: ICON_COLOR,
              fontSize: 18,
            }}
          >
            <Badge dot offset={[2, -2]}>
              <BellOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />
            </Badge>
          </div>
        </Tooltip>
        <Tooltip title={user?.name ?? user?.email ?? 'Profile'} placement="right">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              margin: '2px 8px',
            }}
          >
            <Avatar
              size={28}
              src={user?.avatarUrl}
              icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
              style={{ background: 'var(--kpiee-accent-coral)' }}
            />
          </div>
        </Tooltip>
      </div>
    </Sider>
  );
}
