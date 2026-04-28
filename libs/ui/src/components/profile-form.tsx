import { useEffect, useMemo } from 'react';
import { Form, Input, Select, Tag } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PHONE_REGEX, ROLE_TAG_COLOR, type TBusinessRole } from '@sbrb/shared-constants';
import type { IProfileFormValues, IUserDto } from '@sbrb/shared-types';
import { IconButton } from './icon-button';
import { AvatarField } from './avatar-field';

const { TextArea } = Input;

interface IProfileFormProps {
  user: IUserDto;
  loading?: boolean;
  role?: TBusinessRole;
  onSubmit: (values: IProfileFormValues) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
}

type TInternalValues = IProfileFormValues & { role?: TBusinessRole };

export function ProfileForm({ user, loading, role, onSubmit, onUploadAvatar }: IProfileFormProps) {
  const { t } = useTranslation(['profile', 'common', 'member']);
  const [form] = Form.useForm<TInternalValues>();

  const initialValues: TInternalValues = useMemo(
    () => ({
      fullName: user.fullName,
      phone: user.phone,
      language: user.language,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role,
    }),
    [user, role],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleFinish = (values: TInternalValues) => {
    const { role: _r, ...payload } = values;
    void _r;
    return onSubmit(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      size="large"
      initialValues={initialValues}
      onFinish={handleFinish}
    >
      <div className="flex justify-center mb-6">
        <Form.Item name="avatarUrl" className="!mb-0">
          <AvatarField
            fullName={user.fullName}
            onUpload={onUploadAvatar}
            errorTypeMsg={t('profile:upload_avatar_type_error')}
            errorSizeMsg={t('profile:upload_avatar_size_error')}
            failedMsg={t('profile:upload_avatar_failed')}
            successMsg={t('profile:upload_avatar_success')}
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item
          label={t('profile:field_full_name')}
          name="fullName"
          rules={[
            { required: true, message: t('profile:validation_full_name_required') },
            { max: 100 },
          ]}
        >
          <Input placeholder={t('profile:ph_full_name')} />
        </Form.Item>

        <Form.Item label={t('profile:field_email')}>
          <Input value={user.email} disabled />
        </Form.Item>

        <Form.Item
          label={t('profile:field_phone')}
          name="phone"
          rules={[{ pattern: PHONE_REGEX, message: t('profile:validation_phone_format') }]}
        >
          <Input placeholder={t('profile:ph_phone')} />
        </Form.Item>

        <Form.Item
          label={t('profile:field_language')}
          name="language"
          rules={[{ required: true }]}
        >
          <Select
            placeholder={t('profile:ph_language')}
            options={[
              { value: 'vi', label: t('profile:field_language_vi') },
              { value: 'en', label: t('profile:field_language_en') },
            ]}
          />
        </Form.Item>

        <Form.Item label={t('profile:field_role')} shouldUpdate>
          {({ getFieldValue }) => {
            const r = getFieldValue('role') as TBusinessRole | undefined;
            return (
              <div className="h-[40px] flex items-center">
                {r ? <Tag color={ROLE_TAG_COLOR[r] ?? 'default'}>{t(`member:role_${r}`)}</Tag> : '—'}
              </div>
            );
          }}
        </Form.Item>

        <Form.Item
          className="md:col-span-2"
          label={t('profile:field_bio')}
          name="bio"
          rules={[{ max: 500, message: t('profile:validation_bio_max') }]}
        >
          <TextArea rows={4} maxLength={500} showCount placeholder={t('profile:ph_bio')} />
        </Form.Item>
      </div>

      <div className="flex justify-end">
        <IconButton
          icon={<SaveOutlined />}
          tooltip={t('profile:save_personal')}
          variant="primary"
          size="large"
          loading={loading}
          htmlType="submit"
        />
      </div>
    </Form>
  );
}
