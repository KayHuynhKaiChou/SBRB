import { Form } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import type { IChangePasswordValues, IChangePasswordVars } from '@sbrb/shared-types';
import { CHANGE_PASSWORD_MUTATION } from '../../graphql/profile.operations';
import { PasswordForm } from '../auth/password-form';

interface IChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: IChangePasswordModalProps) {
  const { t } = useTranslation('profile');
  const [form] = Form.useForm<IChangePasswordValues>();

  const [changePassword] = useAppMutation<boolean, IChangePasswordVars>(CHANGE_PASSWORD_MUTATION);

  const handleSubmit = async (values: IChangePasswordValues) => {
    await changePassword({
      variables: {
        input: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      },
    });
    form.resetFields();
    onClose();
  };

  return (
    <FormModal<IChangePasswordValues>
      title={t('change_password_title')}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      form={form as FormInstance<unknown>}
      width={440}
      destroyOnClose
    >
      <PasswordForm requireCurrent />
    </FormModal>
  );
}
