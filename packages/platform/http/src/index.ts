export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
  query?: Record<string, QueryValue>;
};

export type HttpTransportRequest = {
  options: RequestOptions;
  url: string;
};

export type HttpTransport = {
  id: string;
  request: <T>(request: HttpTransportRequest) => Promise<T>;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

const AUTH_KEYS = [
  'lserp.portal.auth.v2',
  'lserp.portal.auth.session',
];

function readStoredPortalAuthorizationHeader() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageCandidates = [
    window.localStorage,
    window.sessionStorage,
  ];

  for (const storage of storageCandidates) {
    const portalSessionRaw =
      storage.getItem('lserp.portal.auth.v2') ??
      storage.getItem('lserp.portal.auth.session');

    if (!portalSessionRaw) {
      continue;
    }

    try {
      const session = JSON.parse(portalSessionRaw) as {
        accessToken?: string;
        tokenType?: string;
      };

      if (!session.accessToken) {
        continue;
      }

      const tokenType = session.tokenType?.trim() || 'Bearer';
      return `${tokenType} ${session.accessToken}`;
    } catch {
      continue;
    }
  }

  return null;
}

function clearStoredPortalAuth() {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of AUTH_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  clearStoredPortalAuth();

  // 获取当前路径，作为登录后的重定向目标
  const currentPath = window.location.pathname + window.location.search;
  const loginPath = currentPath
    ? `/login?redirect=${encodeURIComponent(currentPath)}`
    : '/login';

  window.location.href = loginPath;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBaseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parsePayload(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export function createFetchTransport(
  fetchImplementation: typeof fetch = fetch,
): HttpTransport {
  return {
    id: 'fetch',
    async request<T>({ options, url }: HttpTransportRequest) {
      const { body, headers, query: _query, ...rest } = options;
      const resolvedHeaders = new Headers(headers);
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
          if (!resolvedHeaders.has('Content-Type')) {
            resolvedHeaders.set('Content-Type', 'application/json;charset=UTF-8');
          }
        }
      }

      if (!resolvedHeaders.has('Accept')) {
        resolvedHeaders.set('Accept', 'application/json');
      }

      if (!resolvedHeaders.has('Authorization')) {
        const authorizationHeader = readStoredPortalAuthorizationHeader();
        if (authorizationHeader) {
          resolvedHeaders.set('Authorization', authorizationHeader);
        }
      }

      const response = await fetchImplementation(url, {
        ...rest,
        body: resolvedBody,
        headers: resolvedHeaders,
      });

      if (response.status === 204) {
        return undefined as T;
      }

      const payload = await parsePayload(response);

      if (!response.ok) {
        // 401 Unauthorized - 登录失效，清除会话并跳转登录页
        if (response.status === 401) {
          redirectToLogin();
          // 等待一小段时间让重定向生效
          await new Promise(() => {});
        }

        const message =
          typeof payload === 'object' && payload && 'message' in payload
            ? String((payload as { message?: unknown }).message ?? 'Request failed')
            : `Request failed with status ${response.status}`;

        throw new ApiClientError(message, response.status, payload);
      }

      return payload as T;
    },
  };
}

export function createApiClient(
  config:
    | string
    | {
        baseUrl: string;
        transport?: HttpTransport;
      },
) {
  const baseUrl = typeof config === 'string' ? config : config.baseUrl;
  const transport = typeof config === 'string'
    ? createFetchTransport()
    : config.transport ?? createFetchTransport();

  return {
    transportId: transport.id,
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      return transport.request<T>({
        options,
        url: buildUrl(baseUrl, path, options.query),
      });
    },
  };
}
