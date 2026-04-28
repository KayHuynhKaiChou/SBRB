import { useEffect, useMemo } from 'react';
import { Card, Form, Input, Select } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { AvatarField, IconButton } from '@sbrb/ui';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import { INDUSTRIES, CURRENCIES } from '@sbrb/shared-constants';
import type {
  IBusinessDetail,
  IBusinessFormValues,
  IGetAvatarUploadUrlData,
  IGetAvatarUploadUrlVars,
  IUpdateBusinessData,
  IUpdateBusinessVars,
} from '@sbrb/shared-types';
import {
  GET_LOGO_UPLOAD_URL_MUTATION,
  UPDATE_BUSINESS_MUTATION,
} from '../../graphql/profile.operations';
import { uploadToSignedUrl } from '../../lib/supabase-upload';

interface IBusinessInfoCardProps {
  business: IBusinessDetail;
  joinedAt?: string;
}

export function BusinessInfoCard({ business, joinedAt }: IBusinessInfoCardProps) {
  const { t, i18n } = useTranslation('profile');
  const [form] = Form.useForm<IBusinessFormValues>();

  // Apollo auto-merges by `id` into normalized cache — no refetch needed.
  const [updateBusiness, { loading }] = useAppMutation<IUpdateBusinessData, IUpdateBusinessVars>(
    UPDATE_BUSINESS_MUTATION,
  );

  const initialValues: IBusinessFormValues = useMemo(
    () => ({
      name: business.name,
      industry: business.industry,
      currency: business.currency,
      logoUrl: business.logoUrl ?? null,
    }),
    [business],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleFinish = async (values: IBusinessFormValues) => {
    await updateBusiness({ variables: { id: business.id, input: values } });
  };

  const [getLogoUploadUrl] = useMutation<
    { getLogoUploadUrl: IGetAvatarUploadUrlData['getAvatarUploadUrl'] },
    IGetAvatarUploadUrlVars & { businessId: string }
  >(GET_LOGO_UPLOAD_URL_MUTATION);

  const handleUploadLogo = async (file: File): Promise<string> => {
    const { data } = await getLogoUploadUrl({
      variables: {
        businessId: business.id,
        input: { filename: file.name, contentType: file.type },
      },
    });
    if (!data) throw new Error('No upload URL returned');
    const { uploadUrl, publicUrl, token } = data.getLogoUploadUrl;
    await uploadToSignedUrl(uploadUrl, token, file);
    return publicUrl;
  };

  return (
    <Card
      title={t('business_section')}
      extra={
        joinedAt ? (
          <span className="text-gray-500 text-sm">
            {t('membership_joined_at')}: {new Date(joinedAt).toLocaleDateString(i18n.language)}
          </span>
        ) : null
      }
    >
      <Form
        form={form}
        layout="vertical"
        size="large"
        initialValues={initialValues}
        onFinish={handleFinish}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label={t('field_business_name')}
            name="name"
            rules={[{ required: true, max: 100 }]}
          >
            <Input placeholder={t('ph_business_name')} />
          </Form.Item>

          <Form.Item
            label={t('field_industry')}
            name="industry"
            rules={[{ required: true }]}
          >
            <Select
              placeholder={t('ph_industry')}
              options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
            />
          </Form.Item>

          <Form.Item
            label={t('field_currency')}
            name="currency"
            rules={[{ required: true }]}
          >
            <Select placeholder={t('ph_currency')} options={CURRENCIES} />
          </Form.Item>

          <Form.Item
            label={t('field_business_logo')}
            name="logoUrl"
            className="md:col-span-2"
          >
            <AvatarField
              shape="square"
              size={96}
              fullName={business.name}
              onUpload={handleUploadLogo}
              errorTypeMsg={t('upload_avatar_type_error')}
              errorSizeMsg={t('upload_avatar_size_error')}
              failedMsg={t('upload_avatar_failed')}
              successMsg={t('upload_avatar_success')}
            />
          </Form.Item>
        </div>

        <div className="flex justify-end">
          <IconButton
            icon={<SaveOutlined />}
            tooltip={t('save_business')}
            variant="primary"
            size="large"
            loading={loading}
            htmlType="submit"
          />
        </div>
      </Form>
    </Card>
  );
}
