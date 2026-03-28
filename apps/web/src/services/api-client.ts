import { useAuthStore } from '../store/auth.store';

/** Centralized HTTP client that automatically injects the auth Bearer token */
class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    const accessToken = useAuthStore.getState().accessToken;
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }

  private async getErrorMessage(res: Response): Promise<string> {
    try {
      const err = await res.json();
      return err.message ?? 'Request failed';
    } catch {
      return 'Request failed';
    }
  }

  /** Upload multipart/form-data (no Content-Type — let browser set boundary) */
  async upload<T = unknown>(url: string, formData: FormData): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...this.getAuthHeaders() },
      body: formData,
    });
    if (!res.ok) throw new Error(await this.getErrorMessage(res));
    return res.json() as Promise<T>;
  }

  /** POST with JSON body */
  async post<T = unknown>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await this.getErrorMessage(res));
    return res.json() as Promise<T>;
  }

  /** PATCH with JSON body — treats 409 as a handled conflict (no throw) */
  async patch<T = unknown>(url: string, body: unknown): Promise<{ data: T | null; conflict: boolean }> {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify(body),
    });
    if (res.status === 409) return { data: null, conflict: true };
    if (!res.ok) throw new Error(await this.getErrorMessage(res));
    return { data: (await res.json()) as T, conflict: false };
  }

  /** GET with optional blob response (for file downloads) */
  async getBlob(url: string): Promise<Blob> {
    const res = await fetch(url, {
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error(await this.getErrorMessage(res));
    return res.blob();
  }
}

export const apiClient = new ApiClient();
