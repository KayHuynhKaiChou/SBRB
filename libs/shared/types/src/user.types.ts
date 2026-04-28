/** User & auth types */

export interface IUserDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  language: 'vi' | 'en';
  bio?: string;
  /** Department object resolved server-side. Read-only from profile — change via department page. */
  department?: { id: string; name: string } | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface IJwtPayload {
  sub: string; // userId
  email: string;
  /** Active business context (set on business switch). Optional — absent on initial login. */
  businessId?: string;
  /** Session record id — used to mark current session in mySessions list. Optional for back-compat. */
  sessionId?: string;
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
