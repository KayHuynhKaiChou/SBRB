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
    graphQLErrors?.some((e) => {
      // Legacy: NestJS @nestjs/graphql throws UNAUTHENTICATED for missing/invalid token.
      // New: GqlGlobalExceptionFilter sets numeric code (401) per IApiResponse contract.
      const code = e.extensions?.code as string | number | undefined;
      return code === 'UNAUTHENTICATED' || code === 401;
    }) ||
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
