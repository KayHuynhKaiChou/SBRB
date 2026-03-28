import { onError } from '@apollo/client/link/error';
import { fromPromise } from '@apollo/client';
import { useAuthStore } from '../store/auth.store';
import { refreshAccessToken } from '../services/token-refresh-manager';

/**
 * Apollo error link: intercepts 401/UNAUTHENTICATED errors,
 * triggers token refresh, and retries the failed operation.
 */
export const apolloErrorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const isAuthError =
    graphQLErrors?.some((e) => e.extensions?.code === 'UNAUTHENTICATED') ||
    (networkError && 'statusCode' in networkError && networkError.statusCode === 401);

  if (!isAuthError) return;

  return fromPromise(
    refreshAccessToken().catch(() => {
      // Already handled by refreshAccessToken (clearAuth + redirect)
      return null;
    }),
  )
    .filter((token): token is string => token !== null)
    .flatMap((newToken) => {
      // Update operation headers with new token
      const oldHeaders = operation.getContext().headers ?? {};
      operation.setContext({
        headers: {
          ...oldHeaders,
          Authorization: `Bearer ${newToken}`,
        },
      });
      return forward(operation);
    });
});
