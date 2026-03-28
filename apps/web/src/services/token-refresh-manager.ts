import { useAuthStore } from '../store/auth.store';

/**
 * Centralized token refresh with mutex.
 * Shared by Axios interceptor and Apollo onError link.
 * Uses raw fetch (not Axios) to avoid circular interceptor loop.
 */

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  // Mutex: if refresh already in-flight, return existing promise
  if (refreshPromise) return refreshPromise;

  refreshPromise = executeRefresh();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function executeRefresh(): Promise<string> {
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Refresh failed');

    const { accessToken } = await res.json();

    // Fetch user profile with new token
    const meRes = await fetch('/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: `query Me { me { id email fullName avatarUrl emailVerified createdAt } }`,
      }),
    });

    if (meRes.ok) {
      const { data } = await meRes.json();
      const u = data?.me;
      if (u) {
        useAuthStore.getState().setAuth(
          {
            id: u.id,
            email: u.email,
            name: u.fullName,
            avatarUrl: u.avatarUrl,
            isEmailVerified: u.emailVerified,
            createdAt: u.createdAt,
          },
          accessToken,
        );
      }
    } else {
      // At minimum, store the new token even if Me query fails
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth(currentUser, accessToken);
      }
    }

    return accessToken;
  } catch {
    useAuthStore.getState().clearAuth();
    window.location.href = '/auth/login';
    throw new Error('Token refresh failed');
  }
}
