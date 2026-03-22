/**
 * Apollo Client for desktop renderer.
 *
 * Online:  renderer → HTTP/WS → cloud API (same as apps/web)
 * Offline: renderer → window.electronAPI.queryOffline() → IPC → embedded NestJS
 *
 * The online/offline split is handled at the component level using
 * window.electronAPI.isOnline() — not in this file.
 */
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// Desktop talks directly to cloud API (no Vite proxy)
const CLOUD_API = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';
const CLOUD_WS  = import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql';

const httpLink = createHttpLink({
  uri: CLOUD_API,
  credentials: 'include',
});

const wsLink = new GraphQLWsLink(
  createClient({ url: CLOUD_WS }),
);

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  httpLink,
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Widget:    { keyFields: ['id'] },
      DataSheet: { keyFields: ['id'] },
      Tab:       { keyFields: ['id'] },
    },
  }),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
  },
});
