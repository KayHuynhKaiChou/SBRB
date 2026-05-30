import type { ApolloClient } from '@apollo/client';
import { API_ROUTES, APP_ROUTES, EBusinessStatus, REFRESH_REJECTED_CODE } from '@sbrb/shared-constants';
import type { IUserDto, IBusinessDto } from '@sbrb/shared-types';
import { useAuthStore } from '../store/auth.store';
import { ME_QUERY, MY_BUSINESSES_QUERY } from '../graphql/auth.operations';
import { apolloClient as defaultApolloClient } from '../apollo/apollo-client';

export const REFRESH_REJECTED = REFRESH_REJECTED_CODE;

/** Minimal business shape returned by MY_BUSINESSES_QUERY (id + name + status). */
type IBusinessRef = Pick<IBusinessDto, 'id' | 'name'> & { status?: string };

interface IAuthSessionDeps {
  apolloClient: ApolloClient<unknown>;
}

export interface IAuthSession {
  refresh(): Promise<string>;
  bootstrap(): Promise<void>;
  logout(): Promise<void>;
  fetchUserContext(): Promise<{ user: IUserDto; businesses: IBusinessRef[] }>;
  resolveCurrentBusiness(
    businesses: IBusinessRef[],
    currentId: string | null,
  ): IBusinessRef | null;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/** Clear local auth state + redirect to login. */
function clearSessionAndRedirect(): void {
  useAuthStore.getState().clearAuth();
  if (!window.location.pathname.startsWith('/auth/')) {
    window.location.href = APP_ROUTES.LOGIN;
  }
}

export function createAuthSession({ apolloClient }: IAuthSessionDeps): IAuthSession {
  let refreshPromise: Promise<string> | null = null;
  let bootstrapPromise: Promise<void> | null = null;

  /** Explicit logout — user clicked "Đăng xuất". Calls BE to revoke + clears state. */
  async function logout(): Promise<void> {
    try {
      await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // best-effort — ignore network failures
    }
    clearSessionAndRedirect();
  }

  async function doRefresh(): Promise<string> {
    const res = await fetch(API_ROUTES.AUTH.REFRESH, {
      method: 'POST',
      credentials: 'include',
    });

    if (res.status === 401) {
      // Refresh cookie invalid/expired — BE has already cleared the cookie + DB row.
      // No need to call /logout (would 401 anyway since access is also gone).
      clearSessionAndRedirect();
      throw new Error(REFRESH_REJECTED);
    }

    if (!res.ok) throw new Error('Refresh failed');

    const body = (await res.json()) as { code?: number; data?: { accessToken: string }; accessToken?: string };
    // Support both IApiResponse-wrapped {code, data: {accessToken}} and legacy raw {accessToken}.
    const accessToken = body.data?.accessToken ?? body.accessToken;
    if (!accessToken) throw new Error('Refresh response missing accessToken');

    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setAuth(currentUser, accessToken);
    }

    return accessToken;
  }

  function refresh(): Promise<string> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  }

  async function fetchUserContext(): Promise<{
    user: IUserDto;
    businesses: IBusinessRef[];
  }> {
    const [meRes, bizRes] = await Promise.all([
      apolloClient.query({ query: ME_QUERY, fetchPolicy: 'network-only' }),
      apolloClient.query({ query: MY_BUSINESSES_QUERY, fetchPolicy: 'network-only' }),
    ]);

    const m = meRes.data?.me;
    const user: IUserDto = {
      id: m?.id ?? '',
      email: m?.email ?? '',
      fullName: m?.fullName ?? '',
      avatarUrl: m?.avatarUrl,
      phone: m?.phone ?? undefined,
      language: (m?.language ?? 'vi') as 'vi' | 'en',
      bio: m?.bio ?? undefined,
      department: m?.department ?? null,
      isEmailVerified: !!m?.emailVerified,
      createdAt: m?.createdAt ?? '',
      platformRole: m?.platformRole ?? null,
    };

    const businesses: IBusinessRef[] = bizRes.data?.myBusinesses ?? [];
    return { user, businesses };
  }

  function resolveCurrentBusiness(
    businesses: IBusinessRef[],
    currentId: string | null,
  ): IBusinessRef | null {
    if (currentId) {
      const match = businesses.find((b) => b.id === currentId);
      if (match) return match;
    }
    // Prefer first active business; fall back to any business (guard handles inactive state)
    return businesses.find((b) => b.status === EBusinessStatus.ACTIVE) ?? businesses[0] ?? null;
  }

  async function doBootstrap(): Promise<void> {
    const tok = useAuthStore.getState().accessToken;
    const existingUser = useAuthStore.getState().user;

    if (tok && !isTokenExpired(tok) && existingUser) return;

    let newToken: string;
    try {
      newToken = await refresh();
    } catch {
      return; // refresh handled redirect on 401, or network error → guest
    }

    if (!useAuthStore.getState().accessToken) return;

    const { user, businesses } = await fetchUserContext();

    if (!useAuthStore.getState().accessToken) return;

    useAuthStore.getState().setAuth(user, newToken);

    const targetBiz = resolveCurrentBusiness(
      businesses,
      useAuthStore.getState().currentBusinessId,
    );
    useAuthStore.getState().setCurrentBusiness(targetBiz?.id ?? null);
  }

  function bootstrap(): Promise<void> {
    if (bootstrapPromise) return bootstrapPromise;
    bootstrapPromise = doBootstrap().finally(() => {
      bootstrapPromise = null;
    });
    return bootstrapPromise;
  }

  return { refresh, bootstrap, logout, fetchUserContext, resolveCurrentBusiness };
}

export const authSession: IAuthSession = createAuthSession({
  apolloClient: defaultApolloClient,
});
