import { Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import { ProfileForm } from '@sbrb/ui';
import type { TBusinessRole } from '@sbrb/shared-constants';
import type {
  IGetAvatarUploadUrlData,
  IGetAvatarUploadUrlVars,
  IProfileFormValues,
  IUpdateProfileData,
  IUpdateProfileVars,
  IUserDto,
} from '@sbrb/shared-types';
import {
  UPDATE_PROFILE_MUTATION,
  GET_AVATAR_UPLOAD_URL_MUTATION,
} from '../../graphql/profile.operations';
import { uploadToSignedUrl } from '../../lib/supabase-upload';
import { useAuthStore } from '../../store/auth.store';

interface IPersonalInfoCardProps {
  user: IUserDto;
  role?: TBusinessRole;
}

export function PersonalInfoCard({ user, role }: IPersonalInfoCardProps) {
  const { t } = useTranslation('profile');
  const setUser = useAuthStore((s) => s.setUser);

  // Apollo auto-merges by `id` into normalized cache — no refetch needed.
  const [updateProfile, { loading }] = useAppMutation<IUpdateProfileData, IUpdateProfileVars>(
    UPDATE_PROFILE_MUTATION,
  );

  const [getUploadUrl] = useMutation<IGetAvatarUploadUrlData, IGetAvatarUploadUrlVars>(
    GET_AVATAR_UPLOAD_URL_MUTATION,
  );

  const handleSubmit = async (values: IProfileFormValues) => {
    const { data } = await updateProfile({ variables: { input: values } });
    if (data?.updateMe) setUser({ ...user, ...data.updateMe });
  };

  const handleUploadAvatar = async (file: File): Promise<string> => {
    const { data } = await getUploadUrl({
      variables: { input: { filename: file.name, contentType: file.type } },
    });
    if (!data) throw new Error('No upload URL returned');
    const { uploadUrl, publicUrl, token } = data.getAvatarUploadUrl;
    await uploadToSignedUrl(uploadUrl, token, file);
    return publicUrl;
  };

  return (
    <Card title={t('personal_section')}>
      <ProfileForm
        user={user}
        loading={loading}
        role={role}
        onSubmit={handleSubmit}
        onUploadAvatar={handleUploadAvatar}
      />
    </Card>
  );
}
