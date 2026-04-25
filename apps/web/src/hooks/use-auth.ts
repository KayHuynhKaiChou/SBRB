import { useMutation, useLazyQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import { useAuthStore } from '../store/auth.store';
import {
  LOGIN_MUTATION,
  ME_QUERY,
  MY_BUSINESSES_QUERY,
  REGISTER_MUTATION,
  FORGOT_PASSWORD_MUTATION,
  RESET_PASSWORD_MUTATION,
  VERIFY_EMAIL_MUTATION,
} from '../graphql/auth.operations';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export function useAuth() {
  const navigate = useNavigate();
  const { setAuth, clearAuth, currentBusinessId } = useAuthStore();

  // Login is silent on success (we navigate) — keep raw useMutation, no auto notify.
  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
  const [fetchMe] = useLazyQuery(ME_QUERY, { fetchPolicy: 'network-only' });
  const [fetchMyBusinesses] = useLazyQuery(MY_BUSINESSES_QUERY, { fetchPolicy: 'network-only' });

  const [registerMutation, { loading: registerLoading }] = useAppMutation(REGISTER_MUTATION, {
    fallbackSuccess: {
      vi: 'Vui lòng kiểm tra email để xác nhận tài khoản',
      en: 'Please check your email to verify your account',
    },
  });
  const [forgotPasswordMutation, { loading: forgotLoading }] = useAppMutation(
    FORGOT_PASSWORD_MUTATION,
    {
      fallbackSuccess: {
        vi: 'Email đặt lại mật khẩu đã được gửi',
        en: 'Password reset email has been sent',
      },
    },
  );
  const [resetPasswordMutation, { loading: resetLoading }] = useAppMutation(
    RESET_PASSWORD_MUTATION,
    {
      fallbackSuccess: {
        vi: 'Mật khẩu đã được đặt lại thành công',
        en: 'Password has been reset successfully',
      },
      onSuccess: () => navigate('/auth/login'),
    },
  );
  const [verifyEmailMutation, { loading: verifyLoading }] = useAppMutation(VERIFY_EMAIL_MUTATION, {
    fallbackSuccess: { vi: 'Email đã được xác nhận', en: 'Email verified' },
    onSuccess: () => navigate('/auth/login'),
  });

  const login = async (input: LoginInput) => {
    const { data } = await loginMutation({ variables: { input } });
    const { accessToken } = data.login;
    useAuthStore.getState().setAuth(
      { id: '', email: '', name: '', isEmailVerified: false, createdAt: '' },
      accessToken,
    );
    const { data: meData } = await fetchMe();
    const u = meData?.me;
    setAuth(
      {
        id: u.id,
        email: u.email,
        name: u.fullName,
        avatarUrl: u.avatarUrl,
        isEmailVerified: u.emailVerified,
        createdAt: u.createdAt,
      },
      accessToken,
    );

    const { data: bizData } = await fetchMyBusinesses();
    const businesses = bizData?.myBusinesses ?? [];
    const validBusiness = businesses.find((b: { id: string }) => b.id === currentBusinessId);

    if (validBusiness) {
      navigate('/dashboard');
    } else if (businesses.length > 0) {
      const firstBizId = businesses[0].id;
      useAuthStore.getState().setCurrentBusiness(firstBizId);
      navigate('/dashboard');
    } else {
      useAuthStore.getState().setCurrentBusiness(null);
      navigate('/onboarding');
    }
  };

  const register = async (input: RegisterInput) => {
    await registerMutation({ variables: { input } });
  };

  const forgotPassword = async (email: string) => {
    await forgotPasswordMutation({ variables: { email } });
  };

  const resetPassword = async (token: string, password: string) => {
    await resetPasswordMutation({ variables: { token, password } });
  };

  const verifyEmail = async (token: string) => {
    await verifyEmailMutation({ variables: { token } });
  };

  const logout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  return {
    login,
    loginLoading,
    register,
    registerLoading,
    forgotPassword,
    forgotLoading,
    resetPassword,
    resetLoading,
    verifyEmail,
    verifyLoading,
    logout,
  };
}
