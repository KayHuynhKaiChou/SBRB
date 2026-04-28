import { gql } from '@apollo/client';

/** Single combined query — fetches user + business + membership in one HTTP request. */
export const PROFILE_QUERY = gql`
  query Profile($businessId: ID!) {
    me {
      id
      email
      fullName
      avatarUrl
      phone
      language
      bio
      department {
        id
        name
      }
      emailVerified
      createdAt
      lastLoginAt
    }
    business(id: $businessId) {
      id
      name
      industry
      currency
      logoUrl
      weekStart
    }
    myMembership(businessId: $businessId) {
      id
      role
      joinedAt
    }
  }
`;

/** Returns updated User — Apollo auto-merges by `id` into normalized cache. */
export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileDto!) {
    updateMe(input: $input) {
      id
      fullName
      phone
      language
      avatarUrl
      bio
      department {
        id
        name
      }
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordDto!) {
    changePassword(input: $input)
  }
`;

export const MY_SESSIONS_QUERY = gql`
  query MySessions {
    mySessions {
      id
      deviceName
      ipAddress
      lastActiveAt
      createdAt
      isCurrent
    }
  }
`;

export const DELETE_SESSION_MUTATION = gql`
  mutation DeleteSession($id: ID!) {
    deleteSession(id: $id)
  }
`;

export const GET_AVATAR_UPLOAD_URL_MUTATION = gql`
  mutation GetAvatarUploadUrl($input: GetAvatarUploadUrlDto!) {
    getAvatarUploadUrl(input: $input) {
      uploadUrl
      publicUrl
      path
      token
    }
  }
`;

export const GET_LOGO_UPLOAD_URL_MUTATION = gql`
  mutation GetLogoUploadUrl($businessId: ID!, $input: GetAvatarUploadUrlDto!) {
    getLogoUploadUrl(businessId: $businessId, input: $input) {
      uploadUrl
      publicUrl
      path
      token
    }
  }
`;

/** Returns updated Business — Apollo auto-merges by `id` into normalized cache. */
export const UPDATE_BUSINESS_MUTATION = gql`
  mutation UpdateBusiness($id: ID!, $input: UpdateBusinessDto!) {
    updateBusiness(id: $id, input: $input) {
      id
      name
      industry
      currency
      logoUrl
    }
  }
`;
