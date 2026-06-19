import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { EBusinessRole, type TBusinessRole } from '@sbrb/shared-constants';

const COLOR_MAP: Record<TBusinessRole, string> = {
  [EBusinessRole.OWNER]: 'red',
  [EBusinessRole.MANAGER]: 'blue',
  [EBusinessRole.STAFF]: 'default',
};

interface IRoleTagProps {
  role: TBusinessRole;
}

export function RoleTag({ role }: IRoleTagProps) {
  const { t } = useTranslation('member');
  return <Tag color={COLOR_MAP[role] ?? 'default'}>{t(`role_${role}`)}</Tag>;
}
