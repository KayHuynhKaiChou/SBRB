import { Button, message } from 'antd';
import { RiArrowLeftLine } from 'react-icons/ri';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { getGraphQLErrorMessage } from '../../apollo/get-error-message';
import { CREATE_BUSINESS_MUTATION } from '../../graphql/business.operations';
import { AuthLayout } from '../../components/auth/auth-layout';
import { StepBusiness, type IBusinessValues } from '../auth/signup-wizard/steps/step-business';
import { FeatureTour } from '../../components/guide/feature-tour';
import { onboardingTourSteps } from './onboarding-tour-steps';

/**
 * Create-business page for an ALREADY-authenticated user (no business yet, or adding
 * another). Reuses the signup wizard's step-3 KYB form inside the shared AuthLayout.
 * New-owner signup uses the full 3-step wizard at /auth/register instead.
 */
export default function OnboardingPage() {
  const { t } = useTranslation('business');
  const { t: tg } = useTranslation('guide');
  const navigate = useNavigate();
  const location = useLocation();
  // Back is only offered when arriving from the business hub (opt-in create),
  // not when a user with zero businesses is forced here right after login.
  const canGoBack = (location.state as { canGoBack?: boolean } | null)?.canGoBack === true;
  const [createBusiness, { loading }] = useMutation(CREATE_BUSINESS_MUTATION);

  const onFinish = async (values: IBusinessValues) => {
    try {
      const { data } = await createBusiness({ variables: { input: values } });
      useAuthStore.getState().setCurrentBusiness(data.createBusiness.id);
      navigate(APP_ROUTES.MY_BUSINESS);
    } catch (err) {
      void message.error(getGraphQLErrorMessage(err, t('create_error')));
    }
  };

  return (
    <AuthLayout title={t('create_page_title')} subtitle={t('create_page_subtitle')}>
      {canGoBack && (
        <Button
          type="text"
          icon={<RiArrowLeftLine size={18} />}
          onClick={() => navigate(-1)}
          className="!mb-4 !px-2 !font-medium !text-gray09"
        >
          {t('create_back')}
        </Button>
      )}

      <div data-testid="tour-onboarding-form">
        <StepBusiness loading={loading} onSubmit={onFinish} />
      </div>

      <FeatureTour tourId="onboarding" steps={onboardingTourSteps(tg)} />
    </AuthLayout>
  );
}
