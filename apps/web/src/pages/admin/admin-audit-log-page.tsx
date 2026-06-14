import React, { useEffect, useRef, useState } from 'react';
import {
  DatePicker,
  Input,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAdminAudit, type IAdminAuditRow } from '../../hooks/use-admin-audit';
import { EAdminAuditAction } from '@sbrb/shared-constants';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Tag color map for known audit actions — inline for v1 (<5 unique actions). */
const ACTION_TAG_COLOR: Record<string, string> = {
  [EAdminAuditAction.BUSINESS_INACTIVATE]: 'red',
  [EAdminAuditAction.BUSINESS_REACTIVATE]: 'green',
  [EAdminAuditAction.USER_DISABLE]: 'orange',
  [EAdminAuditAction.USER_ENABLE]: 'blue',
};

const ACTION_OPTIONS = [
  { label: 'Business Inactivate', value: EAdminAuditAction.BUSINESS_INACTIVATE },
  { label: 'Business Reactivate', value: EAdminAuditAction.BUSINESS_REACTIVATE },
  { label: 'User Disable', value: EAdminAuditAction.USER_DISABLE },
  { label: 'User Enable', value: EAdminAuditAction.USER_ENABLE },
];

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

/** Admin audit log page with filter bar + paginated table. SRS §5.16 */
export default function AdminAuditLogPage() {
  const { t } = useTranslation('admin');
  const [actorEmailInput, setActorEmailInput] = useState('');
  const [actorEmailDebounced, setActorEmailDebounced] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setActorEmailDebounced(actorEmailInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [actorEmailInput]);

  const dateFrom = dateRange?.[0]?.toISOString();
  const dateTo = dateRange?.[1]?.toISOString();

  const { rows, total, loading } = useAdminAudit({
    filter: {
      actorEmail: actorEmailDebounced || undefined,
      action: actionFilter,
      dateFrom,
      dateTo,
    },
    page: {
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    },
  });

  const columns: ColumnsType<IAdminAuditRow> = [
    {
      title: t('col_time'),
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string) => formatDate(v),
    },
    {
      title: t('col_actor'),
      dataIndex: 'actorEmail',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('col_action'),
      dataIndex: 'action',
      width: 180,
      render: (action: string) => (
        <Tag color={ACTION_TAG_COLOR[action] ?? 'default'}>{action}</Tag>
      ),
    },
    {
      title: t('col_target'),
      width: 220,
      render: (_, row) => {
        if (!row.targetType && !row.targetId) return '—';
        const label = `${row.targetType ?? ''}${row.targetName ? ` · ${row.targetName}` : ''}`;
        const id = row.targetId ? row.targetId.slice(0, 8) + '…' : '';
        return (
          <Tooltip title={row.targetId ?? ''}>
            <span>
              {label}
              {id ? ` (${id})` : ''}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t('col_details'),
      dataIndex: 'meta',
      ellipsis: true,
      render: (meta: string) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(meta);
        } catch {
          parsed = meta;
        }
        const preview = JSON.stringify(parsed);
        if (preview === '{}') return '—';
        return (
          <Tooltip title={<pre className="text-xs whitespace-pre-wrap max-w-xs">{preview}</pre>}>
            <span className="cursor-help text-blue-500 underline decoration-dotted">
              {preview.slice(0, 40)}{preview.length > 40 ? '…' : ''}
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <Title level={4} className="!mb-0">
          {t('audit_title')}
        </Title>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Input
          placeholder={t('ph_search_actor')}
          prefix={<SearchOutlined />}
          value={actorEmailInput}
          onChange={(e) => setActorEmailInput(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          placeholder={t('filter_action_all')}
          value={actionFilter}
          onChange={(v) => {
            setActionFilter(v);
            setPage(1);
          }}
          style={{ width: 200 }}
          allowClear
          options={ACTION_OPTIONS}
        />
        <RangePicker
          showTime={{ format: 'HH:mm' }}
          format="YYYY-MM-DD HH:mm"
          onChange={(range) => {
            setDateRange(range as [Dayjs | null, Dayjs | null] | null);
            setPage(1);
          }}
        />
      </div>

      <Table<IAdminAuditRow>
        rowKey="id"
        dataSource={rows}
        columns={columns}
        loading={loading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: (newPage) => setPage(newPage),
          showTotal: (n) => `${n} entries`,
          showSizeChanger: false,
        }}
        size="middle"
        scroll={{ x: 900 }}
      />
    </>
  );
}
