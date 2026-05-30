import { Avatar, Empty, List, Modal, Spin, Tag, Typography } from 'antd';

const { Text } = Typography;
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, MODAL_BODY_SCROLL } from '@sbrb/ui';
import { isManagerRole } from '@sbrb/shared-constants';
import { useDepartmentMembers } from '../../hooks/use-department-members';
import { useSetDepartmentManager } from '../../hooks/use-department-mutations';

interface IProps {
  open: boolean;
  departmentId: string | null;
  onClose: () => void;
}

export function ChangeManagerModal({ open, departmentId, onClose }: IProps) {
  const { t } = useTranslation(['department']);
  const { fetch, members, loading } = useDepartmentMembers();
  const { mutate, loading: setLoading } = useSetDepartmentManager();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && departmentId) {
      fetch(departmentId);
      setSelectedId(null);
    }
  }, [open, departmentId, fetch]);

  const eligible = useMemo(
    () =>
      members.filter(
        (m) => !m.isManager && isManagerRole(m.businessRole),
      ),
    [members],
  );

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
      centered
      closable={false}
      footer={null}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
      classNames={{ body: MODAL_BODY_SCROLL }}
    >
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <Text strong className="!text-[15px] !flex-1">
          {t('department:change_manager_title')}
        </Text>
        <div className="flex gap-2">
          <IconButton
            icon={<CheckOutlined />}
            tooltip={t('department:submit')}
            size="small"
            loading={setLoading}
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
        <Spin spinning={loading}>
          {eligible.length === 0 ? (
            <Empty description={t('department:no_eligible_managers')} />
          ) : (
            <List
              dataSource={eligible}
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
                    <Tag color={m.businessRole === 'owner' ? 'red' : 'blue'}>
                      {t(`department:business_role_${m.businessRole}`, { defaultValue: m.businessRole })}
                    </Tag>
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
