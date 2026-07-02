export class ClientApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ClientApiError(res.status, body?.error?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, data: unknown) => apiFetch<T>(url, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) => apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(data) }),
};
