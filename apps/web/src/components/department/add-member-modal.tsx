import { Avatar, Empty, Input, List, Modal, Spin, Typography } from 'antd';

const { Text } = Typography;
import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import { useBusinessMembers } from '../../hooks/use-business-members';
import { useDepartmentMembers } from '../../hooks/use-department-members';
import { useAddDepartmentMember } from '../../hooks/use-department-mutations';

interface IProps {
  open: boolean;
  businessId: string;
  departmentId: string | null;
  onClose: () => void;
}

export function AddMemberModal({ open, businessId, departmentId, onClose }: IProps) {
  const { t } = useTranslation(['department']);
  const { members: bizMembers, loading: bizLoading } = useBusinessMembers(businessId);
  const { fetch, members: deptMembers, loading: deptLoading } = useDepartmentMembers();
  const { mutate, loading: addLoading } = useAddDepartmentMember();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && departmentId) {
      fetch(departmentId);
      setSearch('');
      setSelectedId(null);
    }
  }, [open, departmentId, fetch]);

  const inDeptUserIds = useMemo(
    () => new Set(deptMembers.map((m) => m.userId)),
    [deptMembers],
  );

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bizMembers
      .filter((m) => m.status === 'active' && !inDeptUserIds.has(m.userId))
      .filter((m) => {
        if (!q) return true;
        return (
          m.user.fullName.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q)
        );
      });
  }, [bizMembers, inDeptUserIds, search]);

  const handleSubmit = async () => {
    if (!selectedId || !departmentId) return;
    const result = await mutate({
      variables: { departmentId, userId: selectedId },
    });
    if (!result.errors) onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={520}
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
            disabled={!selectedId}
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

        <Spin spinning={bizLoading || deptLoading}>
          {candidates.length === 0 ? (
            <Empty description={t('department:no_eligible_members')} />
          ) : (
            <List
              dataSource={candidates}
              style={{ maxHeight: 360, overflowY: 'auto' }}
              renderItem={(m) => {
                const active = selectedId === m.userId;
                return (
                  <List.Item
                    onClick={() => setSelectedId(m.userId)}
                    className="!cursor-pointer"
                    style={{
                      background: active ? '#FCEEF0' : 'transparent',
                      borderRadius: 4,
                      paddingLeft: 8,
                      paddingRight: 8,
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar src={m.user.avatarUrl ?? undefined}>
                          {m.user.fullName?.[0] ?? '?'}
                        </Avatar>
                      }
                      title={m.user.fullName}
                      description={m.user.email}
                    />
                    <span className="text-xs text-gray-500">
                      {t(`department:business_role_${m.role}`, { defaultValue: m.role })}
                    </span>
                  </List.Item>
                );
              }}
            />
          )}
        </Spin>
      </div>
    </Modal>
  );
}
