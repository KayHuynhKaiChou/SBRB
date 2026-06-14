import React, { useState } from 'react';
import { Steps, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '@sbrb/shared-constants';
import { AuthLayout } from '../../../components/auth/auth-layout';
import { useAuthStore } from '../../../store/auth.store';
import { authSession } from '../../../lib/auth-session';
import { apolloClient } from '../../../apollo/apollo-client';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  VERIFY_OTP_MUTATION,
} from '../../../graphql/auth.operations';
import { CREATE_BUSINESS_MUTATION } from '../../../graphql/business.operations';
import { StepAccount, type IAccountValues } from './steps/step-account';
import { StepVerifyEmail } from './steps/step-verify-email';
import { StepBusiness, type IBusinessValues } from './steps/step-business';
import { StepDone } from './steps/step-done';

/**
 * Owner signup wizard — account → verify email → create business → await approval.
 * Replaces the old single-form register page + onboarding (create/join) flow.
 */
export default function SignupWizardPage() {
  const { t } = useTranslation('business');
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [account, setAccount] = useState<IAccountValues | null>(null);

  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER_MUTATION);
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [verifyOtpMutation, { loading: verifyLoading }] = useMutation(VERIFY_OTP_MUTATION);
  const [createBusiness, { loading: createLoading }] = useMutation(CREATE_BUSINESS_MUTATION);

  // Step 1 — create account (or resume an unverified one), then move to verify.
  const handleAccount = async (values: IAccountValues) => {
    try {
      await registerMutation({ variables: { input: values } });
      setAccount(values);
      setCurrent(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // Verified email → real conflict; guide them to log in. Other errors surface as-is.
      if (/already registered|đã được đăng ký|đã đăng ký/i.test(msg)) {
        void message.error(t('wizard_email_taken'));
      } else {
        void message.error(msg || t('wizard_register_failed'));
      }
    }
  };

  /**
   * Step 2 — verify the 6-digit OTP. On success the account is flagged verified,
   * so we log in to get a token + user context, then advance. Returns false on a
   * bad/expired code so the step can show an inline error.
   */
  const handleVerify = async (code: string): Promise<boolean> => {
    if (!account) return false;
    try {
      await verifyOtpMutation({ variables: { email: account.email, code } });
    } catch {
      return false; // invalid / expired code
    }

    // Code accepted → authenticate.
    const { data } = await loginMutation({
      variables: { input: { email: account.email, password: account.password } },
    });
    const token = data?.login?.accessToken;
    if (!token) return false;

    useAuthStore.getState().setAuth(
      { id: '', email: '', fullName: '', language: 'vi', isEmailVerified: false, createdAt: '' },
      token,
    );
    const { user } = await authSession.fetchUserContext();
    useAuthStore.getState().setAuth(user, token);
    await apolloClient.resetStore();
    return true;
  };

  // Step 3 — create the business (pending), set as current, advance to done.
  const handleBusiness = async (values: IBusinessValues) => {
    const { data } = await createBusiness({ variables: { input: values } });
    const businessId: string = data.createBusiness.id;
    useAuthStore.getState().setCurrentBusiness(businessId);
    setCurrent(3);
  };

  const stepItems = [
    { title: t('wizard_step_account') },
    { title: t('wizard_step_verify') },
    { title: t('wizard_step_business') },
    { title: t('wizard_step_done') },
  ];

  return (
    <AuthLayout title={t('wizard_title')} subtitle={t('wizard_subtitle')}>
      <div>
        {/* antd label-vertical gives each item a fixed content width, so 4 steps are wider
            than the card. Let Steps shrink to its real width and center it → evenly spaced,
            icons centered under labels, symmetric, no horizontal scroll. */}
        <div className="flex justify-center mb-8">
          <Steps
            current={current}
            items={stepItems}
            size="small"
            labelPlacement="vertical"
            className="!w-auto"
          />
        </div>

        {current === 0 && (
          <StepAccount initial={account ?? undefined} loading={registerLoading} onSubmit={handleAccount} />
        )}
        {current === 1 && account && (
          <StepVerifyEmail
            email={account.email}
            loading={verifyLoading}
            onVerify={handleVerify}
            onVerified={() => setCurrent(2)}
          />
        )}
        {current === 2 && <StepBusiness loading={createLoading} onSubmit={handleBusiness} />}
        {current === 3 && <StepDone />}

        {current === 0 && (
          <div className="text-center mt-6">
            <Typography.Text className="!text-gray-500 !text-sm">
              {t('wizard_have_account')}{' '}
            </Typography.Text>
            <Link to={APP_ROUTES.LOGIN} className="!text-[#D72A44] !font-semibold !text-sm">
              {t('wizard_login_link')}
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
