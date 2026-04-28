import { Form, Input } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import type { IChangePasswordValues, IChangePasswordVars } from '@sbrb/shared-types';
import { CHANGE_PASSWORD_MUTATION } from '../../graphql/profile.operations';

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
      <Form.Item
        label={t('change_password_current')}
        name="currentPassword"
        rules={[{ required: true }]}
      >
        <Input.Password autoComplete="current-password" placeholder={t('ph_password_current')} />
      </Form.Item>

      <Form.Item
        label={t('change_password_new')}
        name="newPassword"
        rules={[
          { required: true },
          { min: 8, message: t('validation_password_min') },
        ]}
      >
        <Input.Password autoComplete="new-password" placeholder={t('ph_password_new')} />
      </Form.Item>

      <Form.Item
        label={t('change_password_confirm')}
        name="confirmPassword"
        dependencies={['newPassword']}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(t('validation_password_match')));
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" placeholder={t('ph_password_confirm')} />
      </Form.Item>
    </FormModal>
  );
}
