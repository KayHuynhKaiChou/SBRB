/** User & auth types */

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  // Refresh token stored in HttpOnly cookie — NOT in response body
}

export interface SessionDto {
  id: string;
  userAgent: string;
  ip: string;
  loginAt: string;
  isCurrentSession: boolean;
  status: 'active' | 'expired';
}
