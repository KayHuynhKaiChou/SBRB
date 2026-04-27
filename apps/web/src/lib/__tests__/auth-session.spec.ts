import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const { mockApolloClient } = vi.hoisted(() => ({
  mockApolloClient: { query: vi.fn() },
}));

vi.mock('../../store/auth.store', () => {
  const state = {
    user: null as { id: string; email: string; name: string } | null,
    accessToken: null as string | null,
    currentBusinessId: null as string | null,
  };
  const setAuth = vi.fn((u, t) => {
    state.user = u;
    state.accessToken = t;
  });
  const clearAuth = vi.fn(() => {
    state.user = null;
    state.accessToken = null;
    state.currentBusinessId = null;
  });
  const setCurrentBusiness = vi.fn((id) => {
    state.currentBusinessId = id;
  });
  return {
    useAuthStore: {
      getState: () => ({ ...state, setAuth, clearAuth, setCurrentBusiness }),
      _testReset: () => {
        state.user = null;
        state.accessToken = null;
        state.currentBusinessId = null;
      },
    },
  };
});

vi.mock('../../apollo/apollo-client', () => ({
  apolloClient: mockApolloClient,
}));

import { createAuthSession, REFRESH_REJECTED } from '../auth-session';
import { useAuthStore } from '../../store/auth.store';
const _testReset = (useAuthStore as unknown as { _testReset: () => void })._testReset;

const ORIGINAL_LOCATION = window.location;

beforeEach(() => {
  _testReset();
  mockApolloClient.query.mockReset();
  // @ts-expect-error — override location for redirect testing
  delete window.location;
  // @ts-expect-error
  window.location = { href: '', pathname: '/dashboard' };
  global.fetch = vi.fn();
});

afterEach(() => {
  // @ts-expect-error
  window.location = ORIGINAL_LOCATION;
  vi.restoreAllMocks();
});

const makeSession = () =>
  createAuthSession({ apolloClient: mockApolloClient as never });

const futureTokenPayload = (secondsFromNow: number) => {
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow;
  const payload = btoa(JSON.stringify({ exp }));
  return `header.${payload}.sig`;
};

describe('authSession.refresh', () => {
  it('mutex: 5 concurrent calls trigger 1 fetch', async () => {
    const svc = makeSession();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'new-token' }),
    });

    const results = await Promise.all([
      svc.refresh(),
      svc.refresh(),
      svc.refresh(),
      svc.refresh(),
      svc.refresh(),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(results.every((t) => t === 'new-token')).toBe(true);
  });

  it('401 from refresh → clear state + redirect, NO redundant /logout call', async () => {
    const svc = makeSession();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(svc.refresh()).rejects.toThrow(REFRESH_REJECTED);
    // Only ONE fetch — to /refresh. No follow-up /logout (would 401 anyway).
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/refresh', expect.any(Object));
    expect(window.location.href).toBe('/auth/login');
  });

  it('skips redirect when already on /auth/* page', async () => {
    // @ts-expect-error
    window.location.pathname = '/auth/login';
    const svc = makeSession();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(svc.refresh()).rejects.toThrow(REFRESH_REJECTED);
    expect(window.location.href).toBe(''); // unchanged
  });

  it('mutex nullified after failure → next call retries', async () => {
    const svc = makeSession();
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'recovered-token' }),
      });

    await expect(svc.refresh()).rejects.toThrow('network down');
    const result = await svc.refresh();
    expect(result).toBe('recovered-token');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('parses IApiResponse-wrapped {data: {accessToken}}', async () => {
    const svc = makeSession();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 200, data: { accessToken: 'wrapped-token' }, message: { en: 'ok', vi: 'ok' } }),
    });

    const result = await svc.refresh();
    expect(result).toBe('wrapped-token');
  });
});

describe('authSession.bootstrap', () => {
  it('mutex: 3 concurrent calls trigger 1 refresh fetch', async () => {
    const svc = makeSession();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'boot-token' }),
    });
    mockApolloClient.query.mockResolvedValue({
      data: {
        me: { id: '1', email: 'a@b', fullName: 'A', emailVerified: true, createdAt: '' },
        myBusinesses: [],
      },
    });

    await Promise.all([svc.bootstrap(), svc.bootstrap(), svc.bootstrap()]);

    const refreshCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => c[0] === '/api/v1/auth/refresh',
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('early-skip when token valid AND user in store', async () => {
    const svc = makeSession();
    const validToken = futureTokenPayload(60); // expires in 60s
    useAuthStore.getState().setAuth(
      { id: '1', email: 'a@b', name: 'A', isEmailVerified: true, createdAt: '' } as never,
      validToken,
    );

    await svc.bootstrap();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockApolloClient.query).not.toHaveBeenCalled();
  });

  it('mutex nullified after settle', async () => {
    const svc = makeSession();
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('network'),
    );
    await svc.bootstrap();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'boot2' }),
    });
    mockApolloClient.query.mockResolvedValue({
      data: {
        me: { id: '1', email: 'a@b', fullName: 'A', emailVerified: true, createdAt: '' },
        myBusinesses: [],
      },
    });
    await svc.bootstrap();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('mid-flight logout: aborts before setAuth', async () => {
    const svc = makeSession();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'boot-token' }),
    });
    mockApolloClient.query.mockImplementation(() => {
      useAuthStore.getState().clearAuth();
      return Promise.resolve({
        data: {
          me: { id: '1', email: 'a@b', fullName: 'A', emailVerified: true, createdAt: '' },
          myBusinesses: [],
        },
      });
    });

    await svc.bootstrap();

    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('authSession.resolveCurrentBusiness', () => {
  const svc = makeSession();

  it('returns matching biz when currentId valid', () => {
    const result = svc.resolveCurrentBusiness([{ id: 'a' }, { id: 'b' }], 'b');
    expect(result?.id).toBe('b');
  });

  it('falls back to first when currentId invalid', () => {
    const result = svc.resolveCurrentBusiness([{ id: 'a' }, { id: 'b' }], 'zzz');
    expect(result?.id).toBe('a');
  });

  it('returns null when list empty', () => {
    expect(svc.resolveCurrentBusiness([], null)).toBeNull();
  });

  it('uses first when currentId is null', () => {
    expect(svc.resolveCurrentBusiness([{ id: 'a' }], null)?.id).toBe('a');
  });
});

describe('authSession.fetchUserContext', () => {
  it('runs ME and MY_BUSINESSES in parallel', async () => {
    const svc = makeSession();
    mockApolloClient.query.mockResolvedValue({
      data: {
        me: {
          id: '1',
          email: 'a@b',
          fullName: 'Alice',
          avatarUrl: 'x.png',
          emailVerified: true,
          createdAt: '2025-01-01',
        },
        myBusinesses: [{ id: 'biz1', name: 'B1' }],
      },
    });

    const result = await svc.fetchUserContext();

    expect(mockApolloClient.query).toHaveBeenCalledTimes(2);
    expect(result.user.email).toBe('a@b');
    expect(result.user.name).toBe('Alice');
    expect(result.businesses).toHaveLength(1);
  });
});
