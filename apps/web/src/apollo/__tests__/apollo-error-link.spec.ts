import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApolloLink, Observable, gql } from '@apollo/client';

const { mockRefresh } = vi.hoisted(() => ({ mockRefresh: vi.fn() }));

vi.mock('../../lib/auth-session', () => ({
  authSession: { refresh: mockRefresh },
  REFRESH_REJECTED: 'REFRESH_REJECTED',
}));

import { apolloErrorLink } from '../apollo-error-link';

const QUERY = gql`
  query Q {
    me {
      id
    }
  }
`;

interface OpHandle {
  ctx: Record<string, unknown>;
  request: { query: ReturnType<typeof gql>; variables: Record<string, unknown>; context: Record<string, unknown> };
}

function buildOp(initialCtx: Record<string, unknown> = {}): OpHandle {
  const ctx: Record<string, unknown> = { ...initialCtx };
  return {
    ctx,
    request: { query: QUERY, variables: {}, context: ctx },
  };
}

function runLink(handle: OpHandle, forward: () => Observable<unknown>): Promise<unknown> {
  const link = apolloErrorLink.concat(new ApolloLink(() => forward()));
  return new Promise((resolve, reject) => {
    const obs = ApolloLink.execute(link, handle.request as never);
    obs.subscribe({
      next: resolve,
      error: reject,
      complete: () => resolve(undefined),
    });
  });
}

beforeEach(() => {
  mockRefresh.mockReset();
});

describe('apolloErrorLink retry-once guard', () => {
  it('triggers refresh once on first 401, retries operation with new token', async () => {
    mockRefresh.mockResolvedValue('new-token');
    const handle = buildOp();

    const forward = vi
      .fn<() => Observable<unknown>>()
      // First call: emit GraphQL error with 401
      .mockImplementationOnce(
        () =>
          new Observable((sub) => {
            sub.next({
              errors: [{ message: 'unauth', extensions: { code: 'UNAUTHENTICATED' } }],
            });
            sub.complete();
          }),
      )
      // Retry: success
      .mockImplementationOnce(
        () =>
          new Observable((sub) => {
            sub.next({ data: { me: { id: '1' } } });
            sub.complete();
          }),
      );

    await runLink(handle, forward);

    // Behavioral assertions — Apollo wraps op internally so we can't read
    // back the mutated context, but call counts prove the guard works.
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(forward).toHaveBeenCalledTimes(2);
  });

  it('does NOT trigger refresh on second 401 when _isRetry already set', async () => {
    mockRefresh.mockResolvedValue('new-token');
    const handle = buildOp({ _isRetry: true }); // simulate retry context already set

    const forward = vi
      .fn<() => Observable<unknown>>()
      .mockImplementationOnce(
        () =>
          new Observable((sub) => {
            sub.next({
              errors: [{ message: 'still unauth', extensions: { code: 'UNAUTHENTICATED' } }],
            });
            sub.complete();
          }),
      );

    await runLink(handle, forward);

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(forward).toHaveBeenCalledTimes(1);
  });

  it('passes through non-401 errors without refresh', async () => {
    mockRefresh.mockResolvedValue('new-token');
    const handle = buildOp();

    const forward = vi.fn<() => Observable<unknown>>().mockImplementationOnce(
      () =>
        new Observable((sub) => {
          sub.next({
            errors: [{ message: 'server boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
          });
          sub.complete();
        }),
    );

    await runLink(handle, forward);

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(forward).toHaveBeenCalledTimes(1);
  });

  it('independent operations each get their own retry budget', async () => {
    mockRefresh.mockResolvedValue('new-token');
    const op1 = buildOp();
    const op2 = buildOp();

    const make401Then200 = () => {
      const f = vi
        .fn<() => Observable<unknown>>()
        .mockImplementationOnce(
          () =>
            new Observable((sub) => {
              sub.next({
                errors: [{ message: 'unauth', extensions: { code: 'UNAUTHENTICATED' } }],
              });
              sub.complete();
            }),
        )
        .mockImplementationOnce(
          () =>
            new Observable((sub) => {
              sub.next({ data: { me: { id: '1' } } });
              sub.complete();
            }),
        );
      return f;
    };

    await runLink(op1, make401Then200());
    await runLink(op2, make401Then200());

    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });
});
