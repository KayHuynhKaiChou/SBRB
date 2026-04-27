import { useAuthStore } from '../store/auth.store';
import { authSession } from './auth-session';

/**
 * Centralized HTTP client with automatic 401 refresh.
 * Token injection + retry on 401 via authSession.
 */
class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(url: string, init: RequestInit, responseType: 'json' | 'blob' = 'json'): Promise<T> {
    const res = await fetch(url, { ...init, headers: { ...init.headers, ...this.getAuthHeaders() } });

    // 401 → refresh token and retry once
    if (res.status === 401) {
      const newToken = await authSession.refresh();
      const retryRes = await fetch(url, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${newToken}` },
      });
      if (!retryRes.ok) throw new Error(await this.getErrorMessage(retryRes));
      return responseType === 'blob' ? retryRes.blob() as Promise<T> : retryRes.json() as Promise<T>;
    }

    if (!res.ok) throw new Error(await this.getErrorMessage(res));
    return responseType === 'blob' ? res.blob() as Promise<T> : res.json() as Promise<T>;
  }

  private async getErrorMessage(res: Response): Promise<string> {
    try {
      const err = await res.json();
      return err.message ?? 'Request failed';
    } catch {
      return 'Request failed';
    }
  }

  /** Upload multipart/form-data */
  async upload<T = unknown>(url: string, formData: FormData): Promise<T> {
    return this.request<T>(url, { method: 'POST', body: formData });
  }

  /** POST with JSON body */
  async post<T = unknown>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /** PATCH with JSON body — treats 409 as a handled conflict (no throw) */
  async patch<T = unknown>(url: string, body: unknown): Promise<{ data: T | null; conflict: boolean }> {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      const newToken = await authSession.refresh();
      const retryRes = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` },
        body: JSON.stringify(body),
      });
      if (retryRes.status === 409) return { data: null, conflict: true };
      if (!retryRes.ok) throw new Error(await this.getErrorMessage(retryRes));
      return { data: (await retryRes.json()) as T, conflict: false };
    }

    if (res.status === 409) return { data: null, conflict: true };
    if (!res.ok) throw new Error(await this.getErrorMessage(res));
    return { data: (await res.json()) as T, conflict: false };
  }

  /** GET with blob response (for file downloads) */
  async getBlob(url: string): Promise<Blob> {
    return this.request<Blob>(url, { method: 'GET' }, 'blob');
  }
}

export const apiClient = new ApiClient();
