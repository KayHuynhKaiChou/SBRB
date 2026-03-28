import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { refreshAccessToken } from '../services/token-refresh-manager';

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
 * Otherwise silently call refreshAccessToken() via the centralized refresh manager.
 * Returns { loading } — true while the refresh attempt is in flight.
 */
export function useAuthInit() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const tokenValid = !!accessToken && !isTokenExpired(accessToken);
  const [loading, setLoading] = useState(!tokenValid);

  useEffect(() => {
    if (tokenValid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function silentRefresh() {
      try {
        const newToken = await refreshAccessToken();

        if (cancelled) return;

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
      } catch {
        // refreshAccessToken already handles clearAuth + redirect on failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    silentRefresh();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { loading };
}
