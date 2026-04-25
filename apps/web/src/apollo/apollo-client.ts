import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { useAuthStore } from '../store/auth.store';
import { apolloErrorLink } from './apollo-error-link';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || '/graphql',
  credentials: 'include', // For HttpOnly cookie auth
});

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().accessToken;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
  }),
);

// Route subscriptions to WS, queries/mutations to HTTP
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  apolloErrorLink.concat(authLink.concat(httpLink)),
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Widget: {
        keyFields: ['id'],
      },
      DataSheet: {
        keyFields: ['id'],
      },
      Tab: {
        keyFields: ['id'],
      },
      DepartmentType: {
        keyFields: ['id'],
      },
      DepartmentMember: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
  },
});
