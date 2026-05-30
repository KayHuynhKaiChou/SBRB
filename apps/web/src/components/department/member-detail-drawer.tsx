import { Drawer, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProfileForm } from '@sbrb/ui';
import { ROLE_TAG_COLOR } from '@sbrb/shared-constants';
import type { IProfileFormValues } from '@sbrb/shared-types';
import type { IDepartmentSubtreeMember } from '../../hooks/use-department-subtree-members';
import { useUpdateMemberInfo } from '../../hooks/use-department-mutations';

const { Text } = Typography;

interface IProps {
  open: boolean;
  member: IDepartmentSubtreeMember | null;
  businessId: string;
  /** True when the current viewer is the business owner — enables editing. */
  isOwner: boolean;
  onClose: () => void;
}

/**
 * Drawer that shows a read-only (or owner-editable) profile card for a department member.
 * Owners may edit fullName and phone via the ProfileForm; all other fields are read-only.
 * Non-owners see a fully read-only view (readOnly=true → save button hidden).
 */
export function MemberDetailDrawer({ open, member, businessId, isOwner, onClose }: IProps) {
  const { t, i18n } = useTranslation(['department', 'common', 'profile']);
  const { mutate: updateMemberInfo, loading } = useUpdateMemberInfo();

  if (!member) return null;

  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  /** Map IDepartmentSubtreeMember.user to the IUserDto shape ProfileForm expects. */
  const userDto = {
    id: member.userId,
    email: member.user.email,
    fullName: member.user.fullName,
    phone: member.user.phone ?? undefined,
    language: 'vi' as const,       // language not on member.user — display as read-only placeholder
    bio: undefined,
    avatarUrl: member.user.avatarUrl ?? undefined,
    isEmailVerified: false,
    createdAt: member.joinedAt,
  };

  const handleSubmit = async (values: IProfileFormValues) => {
    await updateMemberInfo({
      variables: {
        businessId,
        userId: member.userId,
        input: {
          fullName: values.fullName,
          phone: values.phone,
        },
      },
    });
    onClose();
  };

  /** Avatar upload is not available in this drawer — owner must use the profile page. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const noopUpload = async (_file: File): Promise<string> => {
    throw new Error('Avatar upload not supported here');
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title={t('department:member_detail')}
      destroyOnHidden
    >
      {/* Org context — department, role, join date */}
      <div className="mb-5 p-3 rounded bg-gray-50 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Text type="secondary" className="text-xs">
            {t('department:col_department')}:
          </Text>
          <Text className="text-sm">{member.departmentName ?? '—'}</Text>
        </div>
        <div className="flex items-center gap-2">
          <Text type="secondary" className="text-xs">
            {t('department:col_role')}:
          </Text>
          {member.businessRole ? (
            <Tag color={ROLE_TAG_COLOR[member.businessRole] ?? 'default'}>
              {t(`department:business_role_${member.businessRole}`, {
                defaultValue: member.businessRole,
              })}
            </Tag>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Text type="secondary" className="text-xs">
            {t('department:col_joined')}:
          </Text>
          <Text className="text-sm">
            {new Date(member.joinedAt).toLocaleDateString(dateLocale)}
          </Text>
        </div>
      </div>

      <ProfileForm
        user={userDto}
        loading={loading}
        role={member.businessRole ?? undefined}
        readOnly={!isOwner}
        editableFields={['fullName', 'phone']}
        onSubmit={handleSubmit}
        onUploadAvatar={noopUpload}
      />
    </Drawer>
  );
}
