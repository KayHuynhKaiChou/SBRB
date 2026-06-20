import type { ApolloError } from '@apollo/client';

/** NestJS wraps class-validator failures as a generic top-level message — the useful
 *  detail sits in extensions.originalError.message. Don't surface this to users. */
const GENERIC = 'Bad Request Exception';

/**
 * Best human-readable message from an Apollo/GraphQL error. Prefers the class-validator
 * detail (extensions.originalError.message — string or array) over the generic
 * "Bad Request Exception", then the GraphQL error message, then the fallback.
 */
export function getGraphQLErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const gqlErrors = (err as ApolloError | undefined)?.graphQLErrors;
  for (const e of gqlErrors ?? []) {
    const orig = e.extensions?.originalError as { message?: unknown } | undefined;
    const detail = orig?.message;
    if (Array.isArray(detail) && detail.length) return detail.join('; ');
    if (typeof detail === 'string' && detail) return detail;
    if (e.message && e.message !== GENERIC) return e.message;
  }
  if (err instanceof Error && err.message && err.message !== GENERIC) return err.message;
  return fallback;
}
