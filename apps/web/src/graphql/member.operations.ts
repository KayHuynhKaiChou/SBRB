import { gql } from '@apollo/client';

export const BUSINESS_MEMBERS_QUERY = gql`
  query Members($businessId: ID!) {
    members(businessId: $businessId) {
      id
      userId
      role
      status
      joinedAt
      user {
        id
        fullName
        email
        avatarUrl
        phone
      }
    }
  }
`;
