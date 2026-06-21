import { gql } from '@apollo/client';

/** Personnel table — flat rows joined from BusinessMember + User (status, lastLogin). */
export const BUSINESS_MEMBERS_LIST_QUERY = gql`
  query BusinessMembers($businessId: ID!, $filter: BusinessMembersFilterInput) {
    businessMembers(businessId: $businessId, filter: $filter) {
      rows {
        userId
        fullName
        email
        phone
        avatarUrl
        role
        status
        joinedAt
        lastLoginAt
      }
      total
    }
  }
`;

/** Current user's role in a business — used to gate the page + actions. */
export const MY_MEMBERSHIP_QUERY = gql`
  query MyMembership($businessId: ID!) {
    myMembership(businessId: $businessId) {
      id
      role
    }
  }
`;

export const CREATE_STAFF_ACCOUNT_MUTATION = gql`
  mutation CreateStaffAccount($businessId: ID!, $input: CreateStaffAccountDto!) {
    createStaffAccount(businessId: $businessId, input: $input) {
      userId
      fullName
      email
      role
      status
      joinedAt
      lastLoginAt
    }
  }
`;

export const RESEND_ACCOUNT_INVITE_MUTATION = gql`
  mutation ResendAccountInvite($businessId: ID!, $userId: ID!) {
    resendAccountInvite(businessId: $businessId, userId: $userId)
  }
`;

export const DELETE_PENDING_ACCOUNT_MUTATION = gql`
  mutation DeletePendingAccount($businessId: ID!, $userId: ID!) {
    deletePendingAccount(businessId: $businessId, userId: $userId)
  }
`;

export const SET_MEMBER_ACCOUNT_STATUS_MUTATION = gql`
  mutation SetMemberAccountStatus($businessId: ID!, $userId: ID!, $active: Boolean!) {
    setMemberAccountStatus(businessId: $businessId, userId: $userId, active: $active) {
      userId
      status
    }
  }
`;
