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
import type { TFunction } from 'i18next';
import { useAdminAudit, type IAdminAuditRow } from '../../hooks/use-admin-audit';
import { EAdminAuditAction } from '@sbrb/shared-constants';
import { FeatureTour } from '../../components/guide/feature-tour';
import { adminAuditTourSteps } from './admin-audit-tour-steps';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Single source of truth for audit actions → human label (i18n key) + tag color.
 * Covers both enum actions (dot.case) and the ad-hoc business CRUD strings (snake_case).
 */
const AUDIT_ACTIONS: ReadonlyArray<{ value: string; labelKey: string; color: string }> = [
  { value: 'create_business', labelKey: 'audit_act_create_business', color: 'blue' },
  { value: 'update_business', labelKey: 'audit_act_update_business', color: 'gold' },
  { value: EAdminAuditAction.BUSINESS_APPROVE, labelKey: 'audit_act_approve', color: 'green' },
  { value: EAdminAuditAction.BUSINESS_REJECT, labelKey: 'audit_act_reject', color: 'red' },
  { value: EAdminAuditAction.BUSINESS_INACTIVATE, labelKey: 'audit_act_inactivate', color: 'red' },
  { value: EAdminAuditAction.BUSINESS_REACTIVATE, labelKey: 'audit_act_reactivate', color: 'green' },
  { value: EAdminAuditAction.BUSINESS_CHANGE_OWNER, labelKey: 'audit_act_change_owner', color: 'purple' },
  { value: EAdminAuditAction.BUSINESS_CHANGE_APPROVE, labelKey: 'audit_act_change_approve', color: 'green' },
  { value: EAdminAuditAction.BUSINESS_CHANGE_REJECT, labelKey: 'audit_act_change_reject', color: 'red' },
  { value: EAdminAuditAction.USER_DISABLE, labelKey: 'audit_act_user_disable', color: 'orange' },
  { value: EAdminAuditAction.USER_ENABLE, labelKey: 'audit_act_user_enable', color: 'blue' },
];

const ACTION_COLOR: Record<string, string> = Object.fromEntries(
  AUDIT_ACTIONS.map((a) => [a.value, a.color]),
);
const ACTION_LABEL_KEY: Record<string, string> = Object.fromEntries(
  AUDIT_ACTIONS.map((a) => [a.value, a.labelKey]),
);

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

const truncate = (s: string, n = 48) => (s.length > n ? s.slice(0, n) + '…' : s);

/** Render audit metadata as readable text (not raw JSON). Reason gets first-class treatment. */
function renderDetails(meta: string, t: TFunction): React.ReactNode {
  let parsed: Record<string, unknown> | null = null;
  try {
    const p = JSON.parse(meta);
    if (p && typeof p === 'object') parsed = p as Record<string, unknown>;
  } catch {
    /* non-JSON or empty */
  }
  if (!parsed || Object.keys(parsed).length === 0) return '—';

  // Most meaningful case: a reason (reject / inactivate / change-reject).
  if (typeof parsed.reason === 'string' && parsed.reason) {
    return (
      <Tooltip title={<span className="whitespace-pre-line">{parsed.reason}</span>}>
        <span className="cursor-help text-gray-600">
          {truncate(`${t('audit_detail_reason')}: ${parsed.reason}`)}
        </span>
      </Tooltip>
    );
  }

  // Fallback: compact key: value summary; full JSON in the tooltip.
  const summary = Object.entries(parsed)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');
  return (
    <Tooltip title={<pre className="text-xs whitespace-pre-wrap max-w-xs">{JSON.stringify(parsed, null, 2)}</pre>}>
      <span className="cursor-help text-gray-500">{truncate(summary)}</span>
    </Tooltip>
  );
}

/** Admin audit log page with filter bar + paginated table. SRS §5.16 */
export default function AdminAuditLogPage() {
  const { t } = useTranslation('admin');
  const { t: tg } = useTranslation('guide');
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
        <Tag color={ACTION_COLOR[action] ?? 'default'}>
          {ACTION_LABEL_KEY[action] ? t(ACTION_LABEL_KEY[action]) : action}
        </Tag>
      ),
    },
    {
      title: t('col_target'),
      width: 200,
      render: (_, row) => {
        if (!row.targetName && !row.targetType && !row.targetId) return '—';
        // Show the friendly name (fall back to type); full type + id lives in the tooltip.
        const text = row.targetName || row.targetType || '—';
        const tip = `${row.targetType ?? ''}${row.targetId ? ` · ${row.targetId}` : ''}`.trim();
        return (
          <Tooltip title={tip || undefined}>
            <span className="font-medium">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      title: t('col_details'),
      dataIndex: 'meta',
      ellipsis: true,
      render: (meta: string) => renderDetails(meta, t),
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
      <div className="flex flex-wrap gap-3 mb-5" data-testid="tour-admin-audit-filters">
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
          options={AUDIT_ACTIONS.map((a) => ({ value: a.value, label: t(a.labelKey) }))}
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

      <div data-testid="tour-admin-audit-table">
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
      </div>

      <FeatureTour tourId="admin-audit" steps={adminAuditTourSteps(tg)} />
    </>
  );
}
