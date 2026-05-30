import { gql } from '@apollo/client';

/**
 * Fetch a single business by ID — used by BusinessGuard to check active/inactive status.
 * fetchPolicy 'cache-and-network' in consumers ensures stale cache doesn't hide inactivation.
 */
export const BUSINESS_QUERY = gql`
  query Business($id: ID!) {
    business(id: $id) {
      id
      name
      status
      inactivatedAt
      inactiveReason
    }
  }
`;
