import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  loginWithGoogle: jest.fn(),
} as unknown as AuthService;

const mockReq = (overrides = {}) => ({
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
  cookies: { refresh_token: 'raw-token' },
  user: {},
  ...overrides,
}) as unknown as import('express').Request;

const mockRes = () => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
  redirect: jest.fn(),
}) as unknown as import('express').Response;

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController(mockAuthService);
    jest.clearAllMocks();
  });

  it('should call authService.register and wrap in IApiResponse', async () => {
    (mockAuthService.register as jest.Mock).mockResolvedValue({ message: 'Verification email sent' });
    const result = await controller.register({ email: 'a@a.com', password: 'Pass1word', fullName: 'A' });
    expect(result.code).toBe(200);
    expect(result.data?.message).toBe('Verification email sent');
  });

  it('should call authService.login and wrap accessToken', async () => {
    (mockAuthService.login as jest.Mock).mockResolvedValue({ accessToken: 'tok' });
    const result = await controller.login(
      { email: 'a@a.com', password: 'Pass1word' },
      mockReq(),
      mockRes(),
    );
    expect(result.code).toBe(200);
    expect(result.data?.accessToken).toBe('tok');
  });

  it('should call authService.verifyEmail', async () => {
    (mockAuthService.verifyEmail as jest.Mock).mockResolvedValue(undefined);
    await controller.verifyEmail('test-token');
    expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('test-token');
  });

  it('should call authService.forgotPassword', async () => {
    (mockAuthService.forgotPassword as jest.Mock).mockResolvedValue(undefined);
    await controller.forgotPassword('a@a.com');
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('a@a.com');
  });

  it('should call authService.refresh from cookie', async () => {
    (mockAuthService.refresh as jest.Mock).mockResolvedValue({ accessToken: 'new-tok' });
    const req = mockReq();
    const res = mockRes();
    await controller.refresh(req, res);
    expect(mockAuthService.refresh).toHaveBeenCalledWith('raw-token', '127.0.0.1', 'jest', res);
  });
});
