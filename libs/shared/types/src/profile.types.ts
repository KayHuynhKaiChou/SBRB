/** Profile feature types — form values, query results, mutation payloads */

import type { TBusinessRole } from '@sbrb/shared-constants';
import type { IUserDto } from './user.types';

/** Editable subset of IUserDto used by ProfileForm. Department excluded — managed on department page. */
export type IProfileFormValues = Pick<
  IUserDto,
  'fullName' | 'phone' | 'language' | 'bio' | 'avatarUrl'
>;

/** Full business detail returned by `business(id)` query — used by BusinessInfoCard. */
export interface IBusinessDetail {
  id: string;
  name: string;
  industry: string;
  currency: string;
  logoUrl?: string | null;
  weekStart?: number;
}

/** Editable subset of IBusinessDetail used by BusinessInfoCard form. */
export type IBusinessFormValues = Omit<IBusinessDetail, 'id' | 'weekStart'>;

/** Form values for change-password modal. */
export interface IChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Row shape for sessions table — mirrors backend SessionType GraphQL output. */
export interface ISessionRow {
  id: string;
  deviceName?: string | null;
  ipAddress?: string | null;
  lastActiveAt: string;
  createdAt?: string;
  isCurrent: boolean;
}

/** Membership returned by `myMembership(businessId)` query. */
export interface IMyMembership {
  id: string;
  role: TBusinessRole;
  joinedAt: string;
}

/** Combined PROFILE_QUERY response shape. */
export interface IProfileQueryData {
  me: IUserDto;
  business: IBusinessDetail | null;
  myMembership: IMyMembership | null;
}

export interface IProfileQueryVars {
  businessId: string;
}

/** UPDATE_PROFILE_MUTATION response. */
export interface IUpdateProfileData {
  updateMe: IUserDto;
}

export interface IUpdateProfileVars {
  input: IProfileFormValues;
}

/** UPDATE_BUSINESS_MUTATION response. */
export interface IUpdateBusinessData {
  updateBusiness: IBusinessDetail;
}

export interface IUpdateBusinessVars {
  id: string;
  input: IBusinessFormValues;
}

/** MY_SESSIONS_QUERY response. */
export interface IMySessionsQueryData {
  mySessions: ISessionRow[];
}

/** DELETE_SESSION_MUTATION variables. */
export interface IDeleteSessionVars {
  id: string;
}

/** CHANGE_PASSWORD_MUTATION variables. */
export interface IChangePasswordVars {
  input: { currentPassword: string; newPassword: string };
}

/** GET_AVATAR_UPLOAD_URL_MUTATION response. */
export interface IGetAvatarUploadUrlData {
  getAvatarUploadUrl: {
    uploadUrl: string;
    publicUrl: string;
    path: string;
    token: string;
  };
}

export interface IGetAvatarUploadUrlVars {
  input: { filename: string; contentType: string };
}
