import { Avatar, Input, Modal, Popconfirm, Table, Tag, Typography } from 'antd';

const { Text } = Typography;
import {
  ApartmentOutlined,
  CheckOutlined,
  CloseOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  SwapOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import { isManagerRole } from '@sbrb/shared-constants';
import { useDepartmentMembers, type IDepartmentMember } from '../../hooks/use-department-members';
import {
  useDeleteDepartment,
  useRemoveDepartmentMember,
  useSetDepartmentManager,
  useUpdateDepartment,
} from '../../hooks/use-department-mutations';
import type { IDepartmentNode } from '../../hooks/use-department-tree';

interface IProps {
  open: boolean;
  department: IDepartmentNode | null;
  hasChildren: boolean;
  onClose: () => void;
  onRequestAddMember: (deptId: string) => void;
  onRequestAddSubDept: (parentId: string) => void;
  onRequestChangeManager: (deptId: string) => void;
}

export function DepartmentModal({
  open,
  department,
  hasChildren,
  onClose,
  onRequestAddMember,
  onRequestAddSubDept,
  onRequestChangeManager,
}: IProps) {
  const { t, i18n } = useTranslation(['department', 'common']);
  const { fetch, members, loading } = useDepartmentMembers();

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const { mutate: updateDept, loading: renameLoading } = useUpdateDepartment();
  const { mutate: deleteDept, loading: deleteLoading } = useDeleteDepartment();
  const { mutate: removeMember } = useRemoveDepartmentMember();
  const { mutate: setManager } = useSetDepartmentManager();

  useEffect(() => {
    if (open && department?.id) {
      fetch(department.id);
      setRenaming(false);
      setNameDraft(department.name);
    }
  }, [open, department?.id, department?.name, fetch]);

  const manager = useMemo(() => members.find((m) => m.isManager), [members]);
  const regularMembers = useMemo(() => members.filter((m) => !m.isManager), [members]);

  if (!department) return null;

  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const handleRename = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === department.name) {
      setRenaming(false);
      return;
    }
    const result = await updateDept({
      variables: { id: department.id, input: { name: trimmed } },
    });
    if (!result.errors) setRenaming(false);
  };

  const handleDelete = async () => {
    const result = await deleteDept({ variables: { id: department.id } });
    if (!result.errors) onClose();
  };

  const columns = [
    {
      title: t('department:col_name'),
      key: 'name',
      render: (_: unknown, r: IDepartmentMember) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" src={r.user.avatarUrl ?? undefined}>
            {r.user.fullName?.[0] ?? '?'}
          </Avatar>
          <span>{r.user.fullName}</span>
        </div>
      ),
    },
    { title: t('department:col_email'), dataIndex: ['user', 'email'], key: 'email' },
    {
      title: t('department:col_phone'),
      dataIndex: ['user', 'phone'],
      key: 'phone',
      render: (phone: string | null) => phone || <span className="text-gray-400">—</span>,
    },
    {
      title: t('department:col_joined'),
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date: string) => new Date(date).toLocaleDateString(dateLocale),
    },
    {
      title: t('department:col_role'),
      key: 'role',
      render: (_: unknown, r: IDepartmentMember) => (
        <Tag color={r.businessRole === 'owner' ? 'red' : r.businessRole === 'manager' ? 'blue' : 'default'}>
          {t(`department:business_role_${r.businessRole ?? 'unknown'}`, {
            defaultValue: r.businessRole ?? '—',
          })}
        </Tag>
      ),
    },
    {
      title: t('department:col_actions'),
      key: 'actions',
      render: (_: unknown, r: IDepartmentMember) => {
        const canBeManager = isManagerRole(r.businessRole);
        return (
          <div className="flex gap-1">
            <Popconfirm
              title={t('department:confirm_change_manager', {
                name: r.user.fullName,
              })}
              okText={t('common:yes', { defaultValue: 'OK' })}
              cancelText={t('common:cancel', { defaultValue: 'Cancel' })}
              disabled={!canBeManager}
              onConfirm={() =>
                setManager({
                  variables: { departmentId: department.id, userId: r.userId },
                })
              }
            >
              <IconButton
                icon={<CrownOutlined />}
                tooltip={
                  canBeManager
                    ? t('department:promote_manager')
                    : t('department:manager_role_required')
                }
                variant="ghost"
                size="small"
                disabled={!canBeManager}
              />
            </Popconfirm>
            <Popconfirm
              title={t('department:confirm_remove_member')}
              okText={t('common:yes', { defaultValue: 'OK' })}
              cancelText={t('common:cancel', { defaultValue: 'Cancel' })}
              onConfirm={() =>
                removeMember({
                  variables: { departmentId: department.id, userId: r.userId },
                })
              }
            >
              <IconButton
                icon={<UserDeleteOutlined />}
                tooltip={t('department:remove_member')}
                variant="ghost"
                size="small"
              />
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={860}
      closable={false}
      footer={null}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        {renaming ? (
          <>
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onPressEnter={handleRename}
              autoFocus
              maxLength={100}
              style={{ flex: 1 }}
            />
            <div className="flex gap-2">
              <IconButton
                icon={<CheckOutlined />}
                tooltip={t('department:submit')}
                variant="primary"
                size="small"
                loading={renameLoading}
                onClick={handleRename}
              />
              <IconButton
                icon={<CloseOutlined />}
                tooltip={t('department:cancel')}
                variant="ghost"
                size="small"
                onClick={() => setRenaming(false)}
              />
            </div>
          </>
        ) : (
          <>
            <Text strong className="!text-[15px] !flex-1 flex items-center gap-2">
              {department.name}
              {department.isRoot && (
                <Tag color="red" className="!m-0">
                  {t('department:root_badge')}
                </Tag>
              )}
            </Text>
            <IconButton
              icon={<CloseOutlined />}
              tooltip={t('department:close')}
              size="small"
              onClick={onClose}
            />
          </>
        )}
      </div>
      <div className="px-5 py-4">
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
          {t('department:manager_label')}
        </div>
        {manager ? (
          <div className="flex items-center justify-between p-3 rounded" style={{ background: '#FCEEF0' }}>
            <div className="flex items-center gap-3">
              <Avatar src={manager.user.avatarUrl ?? undefined}>
                {manager.user.fullName?.[0] ?? '?'}
              </Avatar>
              <div>
                <div className="font-medium">{manager.user.fullName}</div>
                <div className="text-xs text-gray-500">{manager.user.email}</div>
              </div>
            </div>
            <IconButton
              icon={<SwapOutlined />}
              tooltip={t('department:change_manager')}
              variant="ghost"
              onClick={() => onRequestChangeManager(department.id)}
            />
          </div>
        ) : (
          <div className="p-3 rounded bg-gray-50 text-sm text-gray-500 italic">
            {t('department:no_manager')}
          </div>
        )}
      </section>

      <section className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-semibold text-gray-600 uppercase">
            {t('department:members_label', { count: regularMembers.length })}
          </div>
          <IconButton
            icon={<UserAddOutlined />}
            tooltip={t('department:add_member')}
            variant="ghost"
            size="small"
            onClick={() => onRequestAddMember(department.id)}
          />
        </div>
        <Table
          dataSource={regularMembers}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
          locale={{ emptyText: <div className="py-6 text-gray-400">{t('department:no_members')}</div> }}
        />
      </section>

      <section className="pt-4 border-t flex gap-2 justify-end">
        <IconButton
          icon={<EditOutlined />}
          tooltip={t('department:rename_dept')}
          variant="ghost"
          onClick={() => setRenaming(true)}
        />
        <IconButton
          icon={<ApartmentOutlined />}
          tooltip={t('department:add_sub_dept')}
          variant="ghost"
          onClick={() => onRequestAddSubDept(department.id)}
        />
        <Popconfirm
          title={
            department.isRoot
              ? t('department:delete_root_blocked')
              : hasChildren
              ? t('department:delete_error_has_children')
              : t('department:confirm_delete_dept')
          }
          okText={t('common:yes', { defaultValue: 'OK' })}
          cancelText={t('common:cancel', { defaultValue: 'Cancel' })}
          disabled={department.isRoot || hasChildren}
          onConfirm={handleDelete}
        >
          <IconButton
            icon={<DeleteOutlined />}
            tooltip={
              department.isRoot
                ? t('department:delete_root_blocked')
                : hasChildren
                ? t('department:delete_error_has_children')
                : t('department:delete_dept')
            }
            variant="ghost"
            disabled={department.isRoot || hasChildren}
            loading={deleteLoading}
          />
        </Popconfirm>
      </section>
      </div>
    </Modal>
  );
}
