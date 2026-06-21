import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@sbrb/shared-constants';
import { AuthLayout } from '../../components/auth/auth-layout';

interface AuthSuccessProps {
  /** Title shown in the AntD Result (already translated by caller). */
  title: string;
  /** Sub-title / description (already translated by caller). */
  description: string;
  /** CTA button label (already translated by caller). */
  ctaLabel: string;
}

/**
 * Shared post-action success screen (AntD Result) inside AuthLayout.
 * Reused by set-password (account activated) and reset-password (password changed).
 * CTA navigates to /login — no auto-login.
 */
export function AuthSuccess({ title, description, ctaLabel }: AuthSuccessProps) {
  const navigate = useNavigate();
  return (
    <AuthLayout title={title} subtitle={description}>
      <Result
        status="success"
        title={title}
        subTitle={description}
        extra={
          <Button type="primary" size="large" block onClick={() => navigate(APP_ROUTES.LOGIN)}>
            {ctaLabel}
          </Button>
        }
      />
    </AuthLayout>
  );
}
