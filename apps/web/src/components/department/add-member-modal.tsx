import { Avatar, Input, Modal, Table, Typography } from 'antd';

const { Text } = Typography;
import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import { useBusinessMembers, type IBusinessMember } from '../../hooks/use-business-members';
import { useDepartmentMembers } from '../../hooks/use-department-members';
import { useAddDepartmentMembers } from '../../hooks/use-department-mutations';

interface IProps {
  open: boolean;
  businessId: string;
  departmentId: string | null;
  onClose: () => void;
}

/**
 * Pick employees to add to (or transfer into) a department.
 * Candidates are active business members whose role is NOT owner/manager and who are
 * not already in this department. Multi-select via checkbox; adding someone who already
 * belongs to another department transfers them (handled server-side).
 */
export function AddMemberModal({ open, businessId, departmentId, onClose }: IProps) {
  const { t } = useTranslation(['department']);
  const { members: bizMembers, loading: bizLoading } = useBusinessMembers(businessId);
  const { fetch, members: deptMembers, loading: deptLoading } = useDepartmentMembers();
  const { mutate, loading: addLoading } = useAddDepartmentMembers();
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (open && departmentId) {
      fetch(departmentId);
      setSearch('');
      setSelectedKeys([]);
    }
  }, [open, departmentId, fetch]);

  const inDeptUserIds = useMemo(
    () => new Set(deptMembers.map((m) => m.userId)),
    [deptMembers],
  );

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bizMembers
      // Only regular employees (not owner/manager), active, not already in this department.
      .filter(
        (m) =>
          m.status === 'active' &&
          m.role !== 'owner' &&
          m.role !== 'manager' &&
          !inDeptUserIds.has(m.userId),
      )
      .filter((m) => {
        if (!q) return true;
        return (
          m.user.fullName.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q)
        );
      });
  }, [bizMembers, inDeptUserIds, search]);

  const handleSubmit = async () => {
    if (!selectedKeys.length || !departmentId) return;
    const result = await mutate({
      variables: { departmentId, userIds: selectedKeys },
    });
    if (!result.errors) onClose();
  };

  const columns = [
    {
      title: t('department:col_name'),
      key: 'name',
      ellipsis: { showTitle: false },
      render: (_: unknown, m: IBusinessMember) => (
        <div className="flex items-center gap-2 min-w-0">
          <Avatar size="small" src={m.user.avatarUrl ?? undefined} className="shrink-0">
            {m.user.fullName?.[0] ?? '?'}
          </Avatar>
          <Text ellipsis={{ tooltip: m.user.fullName }} className="flex-1 min-w-0">
            {m.user.fullName}
          </Text>
        </div>
      ),
    },
    {
      title: t('department:col_email'),
      key: 'email',
      ellipsis: { showTitle: false },
      render: (_: unknown, m: IBusinessMember) => (
        <Text ellipsis={{ tooltip: m.user.email }} className="block">
          {m.user.email}
        </Text>
      ),
    },
    {
      title: t('department:col_phone'),
      key: 'phone',
      width: 150,
      ellipsis: { showTitle: false },
      render: (_: unknown, m: IBusinessMember) =>
        m.user.phone ? (
          <Text ellipsis={{ tooltip: m.user.phone }} className="block">
            {m.user.phone}
          </Text>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={680}
      centered
      closable={false}
      footer={null}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <Text strong className="!text-[15px] !flex-1">
          {t('department:add_member_title')}
        </Text>
        <div className="flex gap-2">
          <IconButton
            icon={<CheckOutlined />}
            tooltip={t('department:submit')}
            size="small"
            loading={addLoading}
            disabled={!selectedKeys.length}
            onClick={handleSubmit}
          />
          <IconButton
            icon={<CloseOutlined />}
            tooltip={t('department:cancel')}
            size="small"
            onClick={onClose}
          />
        </div>
      </div>

      <div className="px-5 py-4">
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('department:search_member_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="!mb-3"
        />

        <Table
          dataSource={candidates}
          columns={columns}
          rowKey="userId"
          size="small"
          loading={bizLoading || deptLoading}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys as string[]),
          }}
          scroll={{ y: 360 }}
          pagination={{ pageSize: 8, size: 'small' }}
          locale={{
            emptyText: (
              <div className="py-6 text-gray-400">{t('department:no_eligible_members')}</div>
            ),
          }}
        />
      </div>
    </Modal>
  );
}
