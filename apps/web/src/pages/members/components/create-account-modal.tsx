import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { EBusinessRole, type TBusinessRole } from '@sbrb/shared-constants';
import type { ICreateStaffInput } from '../../../hooks/use-members';

interface ICreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  /** Role of the current user — owner can add manager|staff, manager can add staff only. */
  currentRole: TBusinessRole | null;
  onSubmit: (input: ICreateStaffInput) => Promise<unknown>;
}

interface ICreateAccountValues {
  email: string;
  fullName: string;
  role: TBusinessRole;
}

export function CreateAccountModal({ open, onClose, currentRole, onSubmit }: ICreateAccountModalProps) {
  const { t } = useTranslation('member');
  const [form] = Form.useForm<ICreateAccountValues>();

  const roleOptions =
    currentRole === EBusinessRole.OWNER
      ? [
          { value: EBusinessRole.MANAGER, label: t('role_manager') },
          { value: EBusinessRole.STAFF, label: t('role_staff') },
        ]
      : [{ value: EBusinessRole.STAFF, label: t('role_staff') }];

  const handleSubmit = async (values: ICreateAccountValues) => {
    await onSubmit(values);
    form.resetFields();
    onClose();
  };

  return (
    <FormModal<ICreateAccountValues>
      title={t('create_account_title')}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      form={form as FormInstance<unknown>}
      width={440}
      destroyOnClose
      initialValues={{ role: EBusinessRole.STAFF }}
    >
      <Form.Item
        label={t('create_full_name_label')}
        name="fullName"
        rules={[{ required: true, message: t('create_full_name_required') }]}
      >
        <Input placeholder={t('create_full_name_ph')} />
      </Form.Item>

      <Form.Item
        label={t('create_email_label')}
        name="email"
        rules={[
          { required: true, message: t('create_email_required') },
          { type: 'email', message: t('create_email_invalid') },
        ]}
      >
        <Input placeholder={t('create_email_ph')} autoComplete="off" />
      </Form.Item>

      <Form.Item
        label={t('create_role_label')}
        name="role"
        rules={[{ required: true }]}
      >
        <Select options={roleOptions} />
      </Form.Item>
    </FormModal>
  );
}
