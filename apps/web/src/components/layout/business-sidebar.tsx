import React from 'react';
import { Layout, Tooltip, Avatar } from 'antd';
import { useHover } from '@uidotdev/usehooks';
import {
  AppstoreOutlined,
  TableOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  MessageOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { NotificationBell } from '../notification/notification-bell';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client';
import { useAuth } from '../../hooks/use-auth';
import {
  SIDEBAR_BG,
  SIDEBAR_ICON_ACTIVE_BG,
  SIDEBAR_ICON_ACTIVE_COLOR,
  SIDEBAR_ICON_COLOR,
  SIDEBAR_ICON_HOVER_BG,
  EBusinessStatus,
  isManagerRole,
} from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { BUSINESS_QUERY } from '../../graphql/business.operations';
import { useMyBusinessRole } from '../../hooks/use-members';

const { Sider } = Layout;

/** Nav key that stays usable while the business is awaiting/has failed approval. */
const APPROVAL_UNLOCKED_KEY = 'my-business';

interface INavIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  /** Text shown in parentheses when disabled. Default: "sắp ra mắt". */
  disabledHint?: string;
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

function NavIcon({ icon, label, active, onClick, disabled, disabledHint }: INavIconProps) {
  const [hoverRef, hovered] = useHover<HTMLDivElement>();

  const bg = active ? SIDEBAR_ICON_ACTIVE_BG : hovered && !disabled ? SIDEBAR_ICON_HOVER_BG : 'transparent';
  const color = active ? SIDEBAR_ICON_ACTIVE_COLOR : SIDEBAR_ICON_COLOR;

  return (
    <Tooltip title={disabled ? `${label} (${disabledHint ?? 'sắp ra mắt'})` : label} placement="right">
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
  const { t } = useTranslation('guide');
  const { user, currentBusinessId } = useAuthStore();
  const { logout } = useAuth();

  // Reuse the BusinessGuard's cached fetch — when the business isn't approved yet,
  // every feature menu is locked except "My Business" (the only place to fix/resubmit).
  const { data: bizData } = useQuery(BUSINESS_QUERY, {
    variables: { id: currentBusinessId ?? '' },
    skip: !currentBusinessId,
    fetchPolicy: 'cache-first',
  });
  const notApproved =
    !!bizData?.business &&
    bizData.business.status !== EBusinessStatus.APPROVED;

  // Personnel menu is owner/manager only — staff never sees it.
  const { role } = useMyBusinessRole(currentBusinessId ?? null);
  const canManageMembers = isManagerRole(role);

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
    ...(canManageMembers
      ? [{ key: 'members', icon: <TeamOutlined />, label: t('nav_members'), path: '/members' }]
      : []),
    { key: 'my-business', icon: <ShopOutlined />, label: 'Doanh nghiệp', path: '/my-business' },
    { key: 'benchmark', icon: <BarChartOutlined />, label: 'Benchmark', disabled: true },
    { key: 'talk-room', icon: <MessageOutlined />, label: 'Talk Room', disabled: true },
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
        {navItems.map((item) => {
          // Pending/rejected business → lock everything except My Business.
          const lockedByApproval = notApproved && item.key !== APPROVAL_UNLOCKED_KEY;
          const disabled = item.disabled || lockedByApproval;
          return (
            <NavIcon
              key={item.key}
              icon={item.icon}
              label={item.label}
              disabled={disabled}
              disabledHint={lockedByApproval ? 'chờ duyệt doanh nghiệp' : undefined}
              active={!disabled && !!item.path && location.pathname.startsWith(item.path)}
              onClick={() => item.path && navigate(item.to ?? item.path)}
            />
          );
        })}
      </div>

      {/* Bottom icons: guide, settings, bell, avatar */}
      <div className="border-t border-white/[0.08] py-2 flex flex-col items-center gap-1">
        <NavIcon
          icon={<QuestionCircleOutlined />}
          label={t('nav_guide')}
          active={location.pathname.startsWith('/guide')}
          onClick={() => navigate('/guide')}
        />
        <NavIcon icon={<SettingOutlined />} label="Cài đặt" active={false} disabled onClick={() => undefined} />
        <NotificationBell />
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
        <Tooltip title="Đăng xuất" placement="right">
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
