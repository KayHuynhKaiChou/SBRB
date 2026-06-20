import React from 'react';
import { Form, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { BusinessKybFields } from '../../../../components/business/business-kyb-fields';

export interface IBusinessValues {
  name: string;
  legalName: string;
  taxCode: string;
  businessType?: string;
  industry: string;
  currency: string;
  address: string;
  contactPhone: string;
  contactEmail?: string;
  website?: string;
  description?: string;
  foundedYear?: number;
  companySize?: number;
  logoUrl?: string;
  bannerUrl?: string;
  licenseFileUrl: string;
}

interface IStepBusinessProps {
  loading: boolean;
  onSubmit: (values: IBusinessValues) => void;
}

/** Wizard step 3 — full KYB business profile + asset uploads. */
export function StepBusiness({ loading, onSubmit }: IStepBusinessProps) {
  const { t } = useTranslation('business');
  const [form] = Form.useForm<IBusinessValues>();

  return (
    <Form
      form={form}
      layout="vertical"
      size="large"
      onFinish={onSubmit}
      initialValues={{ currency: 'VND' }}
    >
      <BusinessKybFields />

      <Button
        type="primary"
        htmlType="submit"
        block
        loading={loading}
        className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold !text-[15px] !mt-2"
      >
        {t('wizard_create_business')}
      </Button>
    </Form>
  );
}
