import { AuthResolver } from '../auth.resolver';
import { AuthService } from '../auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
  verifyEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
} as unknown as AuthService;

const mockCtx = () => ({
  req: {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'jest' },
    cookies: { refresh_token: 'raw-refresh' },
  },
  res: { cookie: jest.fn(), clearCookie: jest.fn() },
}) as unknown as { req: import('express').Request; res: import('express').Response };

const mockUser = { sub: 'uid', email: 'a@a.com' };

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  beforeEach(() => {
    resolver = new AuthResolver(mockAuthService);
    jest.clearAllMocks();
  });

  it('should call authService.register and return message', async () => {
    (mockAuthService.register as jest.Mock).mockResolvedValue({ message: 'Verification email sent' });
    const result = await resolver.register({ email: 'a@a.com', password: 'Pass1word', fullName: 'A' });
    expect(result.message).toBe('Verification email sent');
  });

  it('should call authService.login and return AuthResult', async () => {
    (mockAuthService.login as jest.Mock).mockResolvedValue({ accessToken: 'tok' });
    const result = await resolver.login({ email: 'a@a.com', password: 'Pass1word' }, mockCtx());
    expect(result.accessToken).toBe('tok');
  });

  it('should call authService.logout and return true', async () => {
    (mockAuthService.logout as jest.Mock).mockResolvedValue(undefined);
    const result = await resolver.logout(mockUser, mockCtx());
    expect(result).toBe(true);
  });

  it('should call authService.verifyEmail and return true', async () => {
    (mockAuthService.verifyEmail as jest.Mock).mockResolvedValue(undefined);
    const result = await resolver.verifyEmail('some-uuid');
    expect(result).toBe(true);
  });

  it('should call authService.forgotPassword and return true', async () => {
    (mockAuthService.forgotPassword as jest.Mock).mockResolvedValue(undefined);
    const result = await resolver.forgotPassword('a@a.com');
    expect(result).toBe(true);
  });

  it('should call authService.resetPassword and return true', async () => {
    (mockAuthService.resetPassword as jest.Mock).mockResolvedValue(undefined);
    const result = await resolver.resetPassword({ token: 'tok', newPassword: 'NewPass1' });
    expect(result).toBe(true);
  });
});
