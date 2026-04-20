import { API_BASE_URL } from '../config/api';
import { getAccessToken } from '../auth/session';
import { getStoredAuthSession } from '../auth/session';

type QueryValue = string | number | boolean | null | undefined;
type ApiBody = BodyInit | object | null | undefined;
type ApiResponseEnvelope<T> = {
  code?: boolean | number | string | null;
  data?: T;
  detail?: unknown;
  error?: unknown;
  message?: unknown;
  msg?: unknown;
  timestamp?: unknown;
  traceId?: unknown;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  auth?: boolean;
  body?: ApiBody;
  headers?: HeadersInit;
  query?: Record<string, QueryValue>;
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const rawUrl = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${normalizedPath}`;
  const url = /^https?:\/\//i.test(rawUrl)
    ? new URL(rawUrl)
    : new URL(rawUrl, typeof window === 'undefined' ? 'http://127.0.0.1' : window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

function extractErrorMessage(data: unknown) {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidates = [record.message, record.error, record.msg, record.detail];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }
  }

  return null;
}

function isApiResponseEnvelope(value: unknown): value is ApiResponseEnvelope<unknown> {
  return Boolean(value) && typeof value === 'object' && (
    'code' in (value as Record<string, unknown>)
    || 'data' in (value as Record<string, unknown>)
    || 'message' in (value as Record<string, unknown>)
  );
}

function isSuccessfulEnvelopeCode(code: unknown) {
  if (code === undefined || code === null || code === '') {
    return true;
  }

  if (typeof code === 'boolean') {
    return code;
  }

  if (typeof code === 'number') {
    return code === 0 || code === 200;
  }

  if (typeof code === 'string') {
    const normalizedCode = code.trim().toLowerCase();
    if (!normalizedCode) {
      return true;
    }

    if (
      normalizedCode === '0'
      || normalizedCode === '200'
      || normalizedCode === 'ok'
      || normalizedCode === 'success'
      || normalizedCode === 'true'
    ) {
      return true;
    }

    const parsed = Number(normalizedCode);
    return !Number.isNaN(parsed) && (parsed === 0 || parsed === 200);
  }

  return false;
}

function unwrapApiResponse<T>(responseData: unknown, status: number): T {
  if (!isApiResponseEnvelope(responseData)) {
    return responseData as T;
  }

  if (!isSuccessfulEnvelopeCode(responseData.code)) {
    throw new ApiError(
      extractErrorMessage(responseData) ?? `请求失败，状态码 ${status}`,
      status,
      responseData,
    );
  }

  if ('data' in responseData) {
    return responseData.data as T;
  }

  return responseData as T;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? text : null;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = false, body, headers, query, ...requestInit } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }

  let resolvedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (
      typeof body === 'string'
      || body instanceof Blob
      || body instanceof FormData
      || body instanceof URLSearchParams
      || body instanceof ArrayBuffer
    ) {
      resolvedBody = body;
    } else {
      resolvedBody = JSON.stringify(body);
      if (!requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json;charset=UTF-8');
      }
    }
  }

  if (auth) {
    const accessToken = getAccessToken();
    const authSession = getStoredAuthSession();
    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
      requestHeaders.set('accessToken', accessToken);
    }

    if (authSession?.employeeId) {
      requestHeaders.set('x-ls-employee-id', String(authSession.employeeId));
    }
    if (authSession?.username) {
      requestHeaders.set('x-ls-username', authSession.username);
    }
    if (authSession?.datasourceCode) {
      requestHeaders.set('x-ls-datasource-code', authSession.datasourceCode);
    }
  }

  const response = await fetch(buildUrl(path, query), {
    ...requestInit,
    body: resolvedBody,
    headers: requestHeaders,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const responseData = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(responseData) ?? `请求失败，状态码 ${response.status}`,
      response.status,
      responseData,
    );
  }

  return unwrapApiResponse<T>(responseData, response.status);
}
