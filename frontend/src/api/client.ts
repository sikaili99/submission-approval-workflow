import type { ApiErrorBody } from './types.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'approvals.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: { path: string; message: string }[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.error?.message ?? 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error?.code ?? 'UNKNOWN';
    if (body.error?.details) this.details = body.error.details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    ...(body !== undefined ? { body } : {}),
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new ApiError(res.status, json as ApiErrorBody);
    // A stale/invalid token should drop the session.
    if (res.status === 401) clearToken();
    throw err;
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', formData }),
};
