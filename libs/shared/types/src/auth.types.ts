/** Auth API contract types — shared input shapes for login/register/etc. */

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IRegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface IForgotPasswordInput {
  email: string;
}

export interface IResetPasswordInput {
  token: string;
  password: string;
}

/** Auth session view-state (frontend). */
export type TAuthStatus = 'loading' | 'authenticated' | 'guest';
/** @deprecated Use `TAuthStatus`. */
export type AuthStatus = TAuthStatus;
