import React from 'react';
import { Avatar } from 'antd';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth.store';
import { MY_BUSINESSES_QUERY } from '../../graphql/auth.operations';

interface IMyBusinessesData {
  myBusinesses: Array<{ id: string; name: string; status: string; logoUrl: string | null }>;
}

/**
 * Header business badge — shows the current business logo + name (read-only).
 * No switching / create here: business creation goes through the signup wizard.
 */
export function BusinessSwitcher() {
  const { t } = useTranslation('admin');
  const currentBusinessId = useAuthStore((s) => s.currentBusinessId);

  const { data } = useQuery<IMyBusinessesData>(MY_BUSINESSES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const current = data?.myBusinesses.find((b) => b.id === currentBusinessId);
  const displayName = current?.name ?? t('nav_businesses');

  return (
    <div className="inline-flex items-center gap-2 px-2 py-[3px] max-w-[200px]">
      <Avatar
        size={22}
        shape="square"
        src={current?.logoUrl ?? undefined}
        style={{ background: 'var(--sbrb-accent-coral)', fontSize: 12 }}
      >
        {displayName?.[0]?.toUpperCase()}
      </Avatar>
      <span
        className="text-[13px] font-semibold text-[#333] overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]"
        title={displayName}
      >
        {displayName}
      </span>
    </div>
  );
}
