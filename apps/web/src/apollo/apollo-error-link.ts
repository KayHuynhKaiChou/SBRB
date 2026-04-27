import { onError } from '@apollo/client/link/error';
import { fromPromise } from '@apollo/client';
import { REFRESH_REJECTED_CODE } from '@sbrb/shared-constants';
import { authSession } from '../lib/auth-session';

export const apolloErrorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const isAuthError =
    graphQLErrors?.some((e) => {
      const code = e.extensions?.code as string | number | undefined;
      return code === 'UNAUTHENTICATED' || code === 401;
    }) ||
    (networkError && 'statusCode' in networkError && networkError.statusCode === 401);

  if (!isAuthError) return;

  // Retry-once guard: if this op already retried once after refresh, let the 401
  // propagate to the UI instead of looping refresh→retry→refresh.
  if (operation.getContext()._isRetry) return;

  return fromPromise(
    authSession.refresh().catch((err: unknown) => {
      // REFRESH_REJECTED: refresh endpoint itself returned 401 — logout already triggered
      if (err instanceof Error && err.message === REFRESH_REJECTED_CODE) return null;
      return null;
    }),
  )
    .filter((token): token is string => token !== null)
    .flatMap((newToken) => {
      const oldHeaders = operation.getContext().headers ?? {};
      operation.setContext({
        _isRetry: true,
        headers: {
          ...oldHeaders,
          Authorization: `Bearer ${newToken}`,
        },
      });
      return forward(operation);
    });
});
