import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import { APP_ROUTES, EPlatformRole } from '@sbrb/shared-constants';
import type { ILoginInput, IRegisterInput, TAuthStatus, AuthStatus } from '@sbrb/shared-types';
import { useAuthStore } from '../store/auth.store';
import { authSession } from '../lib/auth-session';
import { apolloClient } from '../apollo/apollo-client';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  FORGOT_PASSWORD_MUTATION,
  RESET_PASSWORD_MUTATION,
} from '../graphql/auth.operations';

export type { TAuthStatus, AuthStatus };

export function useAuth() {
  const navigate = useNavigate();

  // Granular Zustand selectors — re-render only on subscribed slice change
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [bootstrapping, setBootstrapping] = useState(true);

  // Mutations
  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
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
      onSuccess: () => navigate(APP_ROUTES.LOGIN),
    },
  );

  // Bootstrap on mount — mutex'd in service, safe across N mounts + StrictMode
  useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;
    authSession
      .bootstrap()
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  // Status derivation
  const status: TAuthStatus = bootstrapping
    ? 'loading'
    : accessToken && user
      ? 'authenticated'
      : 'guest';
  const isAuthenticated = status === 'authenticated';

  const login = async (input: ILoginInput) => {
    if (loginLoading) return; // IMP-4: double-tap guard

    const { data } = await loginMutation({ variables: { input } });
    const newToken = data.login.accessToken;

    // Set placeholder so authLink injects token for fetchUserContext queries
    useAuthStore.getState().setAuth(
      { id: '', email: '', fullName: '', language: 'vi', isEmailVerified: false, createdAt: '' },
      newToken,
    );

    const { user: u, businesses } = await authSession.fetchUserContext();
    useAuthStore.getState().setAuth(u, newToken);

    // BUG-3: clear cache from any previous user, refetch active queries with new auth
    await apolloClient.resetStore();

    // Platform admins bypass business context — go directly to admin area (SRS §5.14)
    if (u.platformRole === EPlatformRole.ADMIN) {
      navigate(APP_ROUTES.ADMIN);
      return;
    }

    const currentBusinessId = useAuthStore.getState().currentBusinessId;
    const targetBiz = authSession.resolveCurrentBusiness(businesses, currentBusinessId);
    if (targetBiz) {
      useAuthStore.getState().setCurrentBusiness(targetBiz.id);
      navigate(APP_ROUTES.DASHBOARD);
    } else {
      useAuthStore.getState().setCurrentBusiness(null);
      navigate(APP_ROUTES.ONBOARDING);
    }
  };

  const register = async (input: IRegisterInput) => {
    await registerMutation({ variables: { input } });
  };

  const forgotPassword = async (email: string) => {
    await forgotPasswordMutation({ variables: { email } });
  };

  const resetPassword = async (token: string, password: string) => {
    await resetPasswordMutation({ variables: { token, password } });
  };


  const logout = () => authSession.logout();

  return {
    // State
    user,
    accessToken,
    status,
    isAuthenticated,
    bootstrapping,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,

    // Loading flags
    loginLoading,
    registerLoading,
    forgotLoading,
    resetLoading,
  };
}
