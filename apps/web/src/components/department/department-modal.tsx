import { Avatar, Input, Modal, Popconfirm, Table, Tag, Typography } from 'antd';

const { Text } = Typography;
import {
  ApartmentOutlined,
  CheckOutlined,
  CloseOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  SwapOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import { isManagerRole } from '@sbrb/shared-constants';
import {
  useDepartmentSubtreeMembers,
  type IDepartmentSubtreeMember,
} from '../../hooks/use-department-subtree-members';
import {
  useDeleteDepartment,
  useRemoveDepartmentMember,
  useSetDepartmentManager,
  useUpdateDepartment,
} from '../../hooks/use-department-mutations';
import type { IDepartmentNode } from '../../hooks/use-department-tree';
import { MemberDetailDrawer } from './member-detail-drawer';

interface IProps {
  open: boolean;
  department: IDepartmentNode | null;
  hasChildren: boolean;
  /** Business owner — has full rights over every department in the business, incl. sub-departments. */
  isOwner: boolean;
  onClose: () => void;
  onRequestAddMember: (deptId: string) => void;
  onRequestAddSubDept: (parentId: string) => void;
  onRequestChangeManager: (deptId: string) => void;
}

export function DepartmentModal({
  open,
  department,
  hasChildren,
  isOwner,
  onClose,
  onRequestAddMember,
  onRequestAddSubDept,
  onRequestChangeManager,
}: IProps) {
  const { t, i18n } = useTranslation(['department', 'common']);
  const { fetch, members, loading } = useDepartmentSubtreeMembers();

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [detailMember, setDetailMember] = useState<IDepartmentSubtreeMember | null>(null);

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

  // The viewed department's own (direct) manager — sub-department managers are not shown here.
  const manager = useMemo(
    () => members.find((m) => m.isManager && m.isDirect),
    [members],
  );

  // Table excludes the direct manager (already highlighted in the MANAGER card above);
  // sub-department members + their managers still appear.
  const tableMembers = useMemo(
    () => members.filter((m) => !(m.isManager && m.isDirect)),
    [members],
  );

  if (!department) return null;

  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  // The top/root department's head is changed only via platform-admin ownership transfer.
  const isRootDept = department.isRoot || department.parentId == null;

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
      width: 190,
      ellipsis: { showTitle: false },
      render: (_: unknown, r: IDepartmentSubtreeMember) => (
        <div className="flex items-center gap-2 min-w-0">
          <Avatar size="small" src={r.user.avatarUrl ?? undefined} className="shrink-0">
            {r.user.fullName?.[0] ?? '?'}
          </Avatar>
          <Text ellipsis={{ tooltip: r.user.fullName }} className="flex-1 min-w-0">
            {r.user.fullName}
          </Text>
          {r.isManager && <CrownOutlined className="shrink-0" style={{ color: '#D72A44' }} />}
        </div>
      ),
    },
    {
      title: t('department:col_email'),
      key: 'email',
      width: 200,
      ellipsis: { showTitle: false },
      render: (_: unknown, r: IDepartmentSubtreeMember) => (
        <Text ellipsis={{ tooltip: r.user.email }} className="block">
          {r.user.email}
        </Text>
      ),
    },
    {
      title: t('department:col_department'),
      key: 'department',
      width: 160,
      ellipsis: { showTitle: false },
      render: (_: unknown, r: IDepartmentSubtreeMember) => (
        <Text
          ellipsis={{ tooltip: r.departmentName ?? undefined }}
          className={`block ${r.isDirect ? '' : 'text-gray-500'}`}
        >
          {r.departmentName ?? '—'}
        </Text>
      ),
    },
    {
      title: t('department:col_phone'),
      dataIndex: ['user', 'phone'],
      key: 'phone',
      width: 120,
      ellipsis: { showTitle: false },
      render: (phone: string | null) =>
        phone ? (
          <Text ellipsis={{ tooltip: phone }} className="block">
            {phone}
          </Text>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: t('department:col_joined'),
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(dateLocale),
    },
    {
      title: t('department:col_role'),
      key: 'role',
      width: 110,
      render: (_: unknown, r: IDepartmentSubtreeMember) => (
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
      width: 130,
      fixed: 'right' as const,
      render: (_: unknown, r: IDepartmentSubtreeMember) => {
        // Direct members are always manageable here. Inherited members (from sub-departments)
        // are read-only EXCEPT for the business owner, who has full rights over every department.
        const canManage = r.isDirect || isOwner;

        /** Eye button is always rendered for every row. */
        const eyeBtn = (
          <IconButton
            icon={<EyeOutlined />}
            tooltip={t('department:view_detail')}
            variant="ghost"
            size="small"
            onClick={() => setDetailMember(r)}
          />
        );

        if (!canManage) {
          return (
            <div className="flex gap-1">
              {eyeBtn}
              <IconButton
                icon={<CrownOutlined />}
                tooltip={t('department:inherited_member_readonly')}
                variant="ghost"
                size="small"
                disabled
              />
              <IconButton
                icon={<UserDeleteOutlined />}
                tooltip={t('department:inherited_member_readonly')}
                variant="ghost"
                size="small"
                disabled
              />
            </div>
          );
        }
        const canBeManager = isManagerRole(r.businessRole);
        // Always target the member's REAL department (= department.id for direct rows,
        // the sub-department for inherited rows the owner is managing).
        const targetDeptId = r.departmentId;
        // Only the owner may change a manager; the root department's head goes via admin transfer.
        const canChangeManager = isOwner && !(isRootDept && r.isDirect);
        const crownDisabled = !canChangeManager || !canBeManager || r.isManager;
        const crownTooltip = !isOwner
          ? t('department:owner_only_change_manager')
          : isRootDept && r.isDirect
          ? t('department:root_manager_admin_only')
          : canBeManager
          ? t('department:promote_manager')
          : t('department:manager_role_required');
        return (
          <div className="flex gap-1">
            {eyeBtn}
            <Popconfirm
              title={t('department:confirm_change_manager', {
                name: r.user.fullName,
              })}
              okText={t('common:yes', { defaultValue: 'OK' })}
              cancelText={t('common:cancel', { defaultValue: 'Cancel' })}
              disabled={crownDisabled}
              onConfirm={() =>
                setManager({
                  variables: { departmentId: targetDeptId, userId: r.userId },
                })
              }
            >
              <IconButton
                icon={<CrownOutlined />}
                tooltip={crownTooltip}
                variant="ghost"
                size="small"
                disabled={crownDisabled}
              />
            </Popconfirm>
            <Popconfirm
              title={t('department:confirm_remove_member')}
              okText={t('common:yes', { defaultValue: 'OK' })}
              cancelText={t('common:cancel', { defaultValue: 'Cancel' })}
              disabled={r.isManager}
              onConfirm={() =>
                removeMember({
                  variables: { departmentId: targetDeptId, userId: r.userId },
                })
              }
            >
              <IconButton
                icon={<UserDeleteOutlined />}
                tooltip={
                  r.isManager
                    ? t('department:remove_manager_blocked')
                    : t('department:remove_member')
                }
                variant="ghost"
                size="small"
                disabled={r.isManager}
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
      width={1120}
      closable={false}
      centered
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
      <div className="px-5 pt-4 pb-1">
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
            {isOwner && !isRootDept && (
              <IconButton
                icon={<SwapOutlined />}
                tooltip={t('department:change_manager')}
                variant="ghost"
                onClick={() => onRequestChangeManager(department.id)}
              />
            )}
          </div>
        ) : (
          <div className="p-3 rounded bg-gray-50 text-sm text-gray-500 italic">
            {t('department:no_manager')}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-semibold text-gray-600 uppercase">
            {t('department:members_label', { count: tableMembers.length })}
          </div>
          <div className="flex gap-2">
            <IconButton
              icon={<EditOutlined />}
              tooltip={t('department:rename_dept')}
              variant="ghost"
              size="small"
              onClick={() => setRenaming(true)}
            />
            <IconButton
              icon={<ApartmentOutlined />}
              tooltip={t('department:add_sub_dept')}
              variant="ghost"
              size="small"
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
                size="small"
                disabled={department.isRoot || hasChildren}
                loading={deleteLoading}
              />
            </Popconfirm>
            <IconButton
              icon={<UserAddOutlined />}
              tooltip={t('department:add_member')}
              variant="ghost"
              size="small"
              onClick={() => onRequestAddMember(department.id)}
            />
          </div>
        </div>
        <Table
          dataSource={tableMembers}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          // ≤5 rows: size to content (compact). >5 rows: cap the table body and let IT scroll
          // vertically so the modal height stays stable.
          scroll={{ x: 1030, y: tableMembers.length > 5 ? 240 : undefined }}
          locale={{ emptyText: <div className="py-6 text-gray-400">{t('department:no_members')}</div> }}
        />
      </section>
      </div>

      <MemberDetailDrawer
        open={detailMember !== null}
        member={detailMember}
        businessId={department.businessId}
        isOwner={isOwner}
        onClose={() => setDetailMember(null)}
      />
    </Modal>
  );
}
