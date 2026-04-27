/** User & auth types */

export interface IUserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface IJwtPayload {
  sub: string; // userId
  email: string;
  /** Active business context (set on business switch). Optional — absent on initial login. */
  businessId?: string;
  iat?: number;
  exp?: number;
}

export interface IAuthTokens {
  accessToken: string;
  // Refresh token stored in HttpOnly cookie — NOT in response body
}

export interface ISessionDto {
  id: string;
  userAgent: string;
  ip: string;
  loginAt: string;
  isCurrentSession: boolean;
  status: 'active' | 'expired';
}
