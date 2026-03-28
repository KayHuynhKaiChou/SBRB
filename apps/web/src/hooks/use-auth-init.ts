import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * On page load: if a valid access token exists in localStorage, use it directly.
 * Otherwise silently call POST /api/v1/auth/refresh via HttpOnly cookie.
 * Returns { loading } — true while the refresh attempt is in flight.
 */
export function useAuthInit() {
  const { accessToken, setAuth, clearAuth } = useAuthStore();
  const tokenValid = !!accessToken && !isTokenExpired(accessToken);
  const [loading, setLoading] = useState(!tokenValid);

  useEffect(() => {
    if (tokenValid) {
      setLoading(false);
      return;
    }

    // Clear stale/expired token from store before refreshing (preserve businessId across refresh)
    const savedBusinessId = useAuthStore.getState().currentBusinessId;
    if (accessToken) clearAuth();
    if (savedBusinessId) useAuthStore.getState().setCurrentBusiness(savedBusinessId);

    let cancelled = false;

    async function silentRefresh() {
      try {
        const refreshRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshRes.ok || cancelled) return;

        const { accessToken: newToken } = await refreshRes.json();

        const meRes = await fetch('/graphql', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({
            query: `query Me { me { id email fullName avatarUrl emailVerified createdAt } }`,
          }),
        });

        if (!meRes.ok || cancelled) return;

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
            newToken,
          );

          // Validate saved businessId against actual membership
          const bizRes = await fetch('/graphql', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
            },
            body: JSON.stringify({
              query: `query MyBusinesses { myBusinesses { id } }`,
            }),
          });
          if (bizRes.ok && !cancelled) {
            const bizJson = await bizRes.json();
            const businesses = bizJson.data?.myBusinesses ?? [];
            const currentBizId = useAuthStore.getState().currentBusinessId;
            const isValid = businesses.some((b: { id: string }) => b.id === currentBizId);
            if (!isValid && businesses.length > 0) {
              useAuthStore.getState().setCurrentBusiness(businesses[0].id);
            } else if (!isValid) {
              useAuthStore.getState().setCurrentBusiness(null);
            }
          }
        }
      } catch {
        // refresh failed — user will be redirected to login by ProtectedRoute
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    silentRefresh();
    return () => { cancelled = true; };
  }, []); // run once on mount

  return { loading };
}
