import React from 'react';
import { Form, Button, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { CREATE_BUSINESS_MUTATION } from '../../graphql/business.operations';
import { BusinessKybFields } from '../../components/business/business-kyb-fields';
import { FeatureTour } from '../../components/guide/feature-tour';
import { onboardingTourSteps } from './onboarding-tour-steps';
import type { IBusinessValues } from '../auth/signup-wizard/steps/step-business';

const { Title, Text } = Typography;

/**
 * Create-business page for an ALREADY-authenticated user — used when a user has no
 * business (fallback) or wants to create another. New-owner signup uses the 3-step
 * wizard at /auth/register instead.
 */
export default function OnboardingPage() {
  const { t } = useTranslation('business');
  const { t: tg } = useTranslation('guide');
  const navigate = useNavigate();
  const [form] = Form.useForm<IBusinessValues>();
  const [createBusiness, { loading }] = useMutation(CREATE_BUSINESS_MUTATION);

  const onFinish = async (values: IBusinessValues) => {
    const { data } = await createBusiness({ variables: { input: values } });
    useAuthStore.getState().setCurrentBusiness(data.createBusiness.id);
    navigate(APP_ROUTES.MY_BUSINESS);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-[720px]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="inline-block w-[5px] h-6 bg-[#D72A44] rounded-sm" />
            <Text strong className="!text-[22px] !text-[#1a1a2e] !tracking-widest">
              SBRB
            </Text>
          </div>
          <Title level={3} className="!mt-0 !mb-1.5 !text-[#1a1a2e]">
            {t('create_page_title')}
          </Title>
          <Text type="secondary" className="!text-sm">
            {t('create_page_subtitle')}
          </Text>
        </div>

        <Card
          className="!rounded-2xl !border !border-[#e8e8e8]"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          data-testid="tour-onboarding-form"
        >
          <Form
            form={form}
            layout="vertical"
            size="large"
            requiredMark={false}
            onFinish={onFinish}
            initialValues={{ currency: 'VND' }}
          >
            <BusinessKybFields />
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="!h-11 !rounded-lg !bg-[#D72A44] !border-[#D72A44] !font-semibold !mt-2"
            >
              {t('wizard_create_business')}
            </Button>
          </Form>
        </Card>
      </div>
      <FeatureTour tourId="onboarding" steps={onboardingTourSteps(tg)} />
    </div>
  );
}
