import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuthStore } from '../store/auth.store';
import {
  LOGIN_MUTATION,
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

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER_MUTATION);
  const [forgotPasswordMutation, { loading: forgotLoading }] = useMutation(FORGOT_PASSWORD_MUTATION);
  const [resetPasswordMutation, { loading: resetLoading }] = useMutation(RESET_PASSWORD_MUTATION);
  const [verifyEmailMutation, { loading: verifyLoading }] = useMutation(VERIFY_EMAIL_MUTATION);

  const login = async (input: LoginInput) => {
    const { data } = await loginMutation({ variables: { input } });
    const { accessToken, user } = data.login;
    setAuth(user, accessToken);
    if (currentBusinessId) {
      navigate(`/dashboard/${currentBusinessId}`);
    } else {
      navigate('/onboarding');
    }
  };

  const register = async (input: RegisterInput) => {
    await registerMutation({ variables: { input } });
    message.success('Vui lòng kiểm tra email để xác nhận tài khoản');
  };

  const forgotPassword = async (email: string) => {
    await forgotPasswordMutation({ variables: { email } });
    message.success('Email đặt lại mật khẩu đã được gửi');
  };

  const resetPassword = async (token: string, password: string) => {
    await resetPasswordMutation({ variables: { token, password } });
    message.success('Mật khẩu đã được đặt lại thành công');
    navigate('/auth/login');
  };

  const verifyEmail = async (token: string) => {
    await verifyEmailMutation({ variables: { token } });
    message.success('Email đã được xác nhận');
    navigate('/auth/login');
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
