import { describe, it, expect } from 'vitest';
import { getGraphQLErrorMessage } from '../get-error-message';

const apolloErr = (graphQLErrors: unknown[]) => ({ graphQLErrors });

describe('getGraphQLErrorMessage', () => {
  it('joins the class-validator detail array (hidden in extensions.originalError)', () => {
    const err = apolloErr([
      {
        message: 'Bad Request Exception',
        extensions: {
          originalError: {
            message: ['taxCode must be longer than or equal to 8 characters', 'legalName must be longer than or equal to 2 characters'],
          },
        },
      },
    ]);
    expect(getGraphQLErrorMessage(err)).toBe(
      'taxCode must be longer than or equal to 8 characters; legalName must be longer than or equal to 2 characters',
    );
  });

  it('uses a string originalError.message', () => {
    const err = apolloErr([
      { message: 'Bad Request Exception', extensions: { originalError: { message: 'Custom detail' } } },
    ]);
    expect(getGraphQLErrorMessage(err)).toBe('Custom detail');
  });

  it('falls back to the GraphQL message when it is specific (e.g. uniqueness throw)', () => {
    const err = apolloErr([
      { message: 'This contact phone is already used by another business', extensions: {} },
    ]);
    expect(getGraphQLErrorMessage(err)).toBe('This contact phone is already used by another business');
  });

  it('ignores the generic message and returns the fallback when no detail exists', () => {
    const err = apolloErr([{ message: 'Bad Request Exception', extensions: {} }]);
    expect(getGraphQLErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('handles a plain Error', () => {
    expect(getGraphQLErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns the fallback for unknown shapes', () => {
    expect(getGraphQLErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
