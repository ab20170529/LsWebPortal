import { describe, expect, it, vi } from 'vitest';

import { ApiClientError, createApiClient, createFetchTransport } from './index';

describe('createApiClient', () => {
  it('preserves base path prefixes and forwards the built url to the transport', async () => {
    const transport = {
      id: 'mock',
      request: vi.fn(async ({ url }: { url: string }) => ({ url })),
    };
    const client = createApiClient({
      baseUrl: 'https://example.com/api/runtime',
      transport,
    });

    const payload = await client.request<{ url: string }>('/pages', {
      method: 'GET',
      query: {
        enabled: true,
        keyword: 'bill',
        page: 2,
      },
    });

    expect(client.transportId).toBe('mock');
    expect(payload.url).toBe(
      'https://example.com/api/runtime/pages?enabled=true&keyword=bill&page=2',
    );
  });

  it('builds same-origin urls when baseUrl is empty', async () => {
    const transport = {
      id: 'mock',
      request: vi.fn(async ({ url }: { url: string }) => ({ url })),
    };
    const client = createApiClient({
      baseUrl: '',
      transport,
    });

    const payload = await client.request<{ url: string }>('/api/project/projects', {
      method: 'GET',
      query: {
        pageNumber: 1,
        pageSize: 12,
      },
    });

    expect(payload.url).toBe('/api/project/projects?pageNumber=1&pageSize=12');
  });

  it('normalizes localhost api base urls to same-origin paths', async () => {
    const transport = {
      id: 'mock',
      request: vi.fn(async ({ url }: { url: string }) => ({ url })),
    };
    const client = createApiClient({
      baseUrl: 'http://127.0.0.1:8080',
      transport,
    });

    const payload = await client.request<{ url: string }>('/api/bi/screens', {
      method: 'GET',
    });

    expect(payload.url).toBe('/api/bi/screens');
  });
});

describe('createFetchTransport', () => {
  it('normalizes json requests and parses json responses', async () => {
    const fetchMock: typeof fetch = vi.fn(async (_url, init) => {
      return new Response(JSON.stringify({ ok: true, method: init?.method }), {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      });
    }) as typeof fetch;

    const transport = createFetchTransport(fetchMock);
    const payload = await transport.request<{ method: string }>({
      options: {
        body: {
          amount: 1200,
        },
        method: 'POST',
      },
      url: 'https://example.com/runtime/bills',
    });

    expect(payload.method).toBe('POST');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws ApiClientError when the response is not ok', async () => {
    const fetchMock: typeof fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ message: 'Forbidden' }), {
        headers: {
          'content-type': 'application/json',
        },
        status: 403,
      });
    }) as typeof fetch;

    const transport = createFetchTransport(fetchMock);

    await expect(
      transport.request({
        options: {
          method: 'GET',
        },
        url: 'https://example.com/runtime/bills',
      }),
    ).rejects.toBeInstanceOf(ApiClientError);
  });
});
