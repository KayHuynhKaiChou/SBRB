import { gql } from '@apollo/client';

export const ADMIN_BUSINESSES_QUERY = gql`
  query AdminBusinesses($filter: AdminBusinessFilterInput, $page: PageInput) {
    adminBusinesses(filter: $filter, page: $page) {
      rows {
        id
        name
        industry
        ownerEmail
        memberCount
        status
        inactivatedAt
        inactiveReason
        createdAt
      }
      total
    }
  }
`;

export const INACTIVATE_BUSINESS_MUTATION = gql`
  mutation InactivateBusiness($id: ID!, $reason: String!) {
    inactivateBusiness(id: $id, reason: $reason) {
      id
      name
      status
      inactivatedAt
      inactiveReason
    }
  }
`;

export const REACTIVATE_BUSINESS_MUTATION = gql`
  mutation ReactivateBusiness($id: ID!) {
    reactivateBusiness(id: $id) {
      id
      name
      status
      inactivatedAt
      inactiveReason
    }
  }
`;

export const ADMIN_USERS_QUERY = gql`
  query AdminUsers($filter: AdminUserFilterInput, $page: PageInput) {
    adminUsers(filter: $filter, page: $page) {
      rows {
        id
        email
        fullName
        platformRole
        isDisabled
        businessCount
        lastLoginAt
        createdAt
      }
      total
    }
  }
`;

export const ADMIN_USER_DETAIL_QUERY = gql`
  query AdminUserDetail($id: ID!) {
    adminUserDetail(id: $id) {
      id
      email
      fullName
      phone
      avatarUrl
      language
      bio
      emailVerified
      isDisabled
      platformRole
      createdAt
      lastLoginAt
      memberships {
        businessId
        businessName
        role
        joinedAt
      }
    }
  }
`;

export const DISABLE_USER_MUTATION = gql`
  mutation DisableUser($id: ID!) {
    disableUser(id: $id) {
      id
      email
      isDisabled
    }
  }
`;

export const ENABLE_USER_MUTATION = gql`
  mutation EnableUser($id: ID!) {
    enableUser(id: $id) {
      id
      email
      isDisabled
    }
  }
`;

export const ADMIN_METRICS_QUERY = gql`
  query AdminMetrics {
    adminMetrics {
      totalBusinesses
      activeBusinesses
      inactiveBusinesses
      totalUsers
      newBusinessesLast30d
      newUsersLast30d
    }
  }
`;

export const ADMIN_AUDIT_LOG_QUERY = gql`
  query AdminAuditLog($filter: AdminAuditFilterInput, $page: PageInput) {
    adminAuditLog(filter: $filter, page: $page) {
      rows {
        id
        action
        actorId
        actorEmail
        targetId
        targetType
        targetName
        businessId
        meta
        createdAt
      }
      total
    }
  }
`;

export const ADMIN_BUSINESS_MEMBERS_QUERY = gql`
  query AdminBusinessMembers($businessId: ID!) {
    adminBusinessMembers(businessId: $businessId) {
      userId
      fullName
      email
      role
    }
  }
`;

export const ADMIN_CHANGE_BUSINESS_OWNER_MUTATION = gql`
  mutation AdminChangeBusinessOwner($businessId: ID!, $newOwnerUserId: ID!) {
    adminChangeBusinessOwner(businessId: $businessId, newOwnerUserId: $newOwnerUserId) {
      id
      name
      ownerEmail
      status
    }
  }
`;
