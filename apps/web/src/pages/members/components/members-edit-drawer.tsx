import { Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProfileForm } from '@sbrb/ui';
import type { IProfileFormValues } from '@sbrb/shared-types';
import type { IBusinessMemberRow, IUpdateMemberInfoInput } from '../../../hooks/use-members';

interface IMembersEditDrawerProps {
  open: boolean;
  member: IBusinessMemberRow | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (userId: string, input: IUpdateMemberInfoInput) => Promise<unknown>;
}

/**
 * Owner-only edit of a personnel member's name/phone — reuses the shared ProfileForm
 * (fullName + phone editable; email/role/etc. read-only; avatar managed on the profile page).
 */
export function MembersEditDrawer({ open, member, loading, onClose, onSubmit }: IMembersEditDrawerProps) {
  const { t } = useTranslation(['member', 'profile']);

  if (!member) return null;

  const userDto = {
    id: member.userId,
    email: member.email,
    fullName: member.fullName,
    phone: member.phone ?? undefined,
    language: 'vi' as const, // not part of the member row — shown read-only
    bio: undefined,
    avatarUrl: member.avatarUrl ?? undefined,
    isEmailVerified: false,
    createdAt: member.joinedAt,
  };

  const handleSubmit = async (values: IProfileFormValues) => {
    await onSubmit(member.userId, { fullName: values.fullName, phone: values.phone });
    onClose();
  };

  // Avatar upload not supported here — owner edits avatar via the profile page.
  const noopUpload = async (): Promise<string> => {
    throw new Error('Avatar upload not supported here');
  };

  return (
    <Drawer open={open} onClose={onClose} width={560} title={t('member:edit_member_title')} destroyOnHidden>
      <ProfileForm
        user={userDto}
        loading={loading}
        role={member.role}
        editableFields={['fullName', 'phone']}
        onSubmit={handleSubmit}
        onUploadAvatar={noopUpload}
      />
    </Drawer>
  );
}
