import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { BUSINESS_ROLES, USER_ACCOUNT_STATUSES } from '@sbrb/shared-constants';

interface IMembersFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  role?: string;
  onRoleChange: (v?: string) => void;
  status?: string;
  onStatusChange: (v?: string) => void;
}

/** Filter bar for the personnel table: search (name/email) + role + status. */
export function MembersFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
}: IMembersFiltersProps) {
  const { t } = useTranslation('member');

  return (
    <div className="flex gap-3 flex-wrap" data-tour="members-filters">
      <Input
        placeholder={t('search_ph')}
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ width: 260 }}
        allowClear
      />
      <Select
        placeholder={t('filter_role_all')}
        value={role}
        onChange={onRoleChange}
        style={{ width: 150 }}
        allowClear
        options={BUSINESS_ROLES.map((r) => ({ value: r, label: t(`role_${r}`) }))}
      />
      <Select
        placeholder={t('filter_status_all')}
        value={status}
        onChange={onStatusChange}
        style={{ width: 150 }}
        allowClear
        options={USER_ACCOUNT_STATUSES.map((s) => ({ value: s, label: t(`status_${s}`) }))}
      />
    </div>
  );
}
