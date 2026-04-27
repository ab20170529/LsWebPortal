import { apiConfig } from '../../../config';

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

interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: BodyInit | object | null | undefined;
  headers?: HeadersInit;
  query?: Record<string, string | number | boolean | null | undefined>;
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>) {
  // 使用配置的API基础URL构建完整URL
  const fullUrl = apiConfig.buildUrl(path);
  const baseUrl = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const url = new URL(fullUrl, baseUrl);

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

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? text : null;
}

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, query, ...requestInit } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }

  let resolvedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (
      typeof body === 'string' ||
      body instanceof Blob ||
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof ArrayBuffer
    ) {
      resolvedBody = body;
    } else {
      resolvedBody = JSON.stringify(body);
      if (!requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json;charset=UTF-8');
      }
    }
  }

  const url = buildUrl(path, query);
  
  // 添加调试日志（生产环境可以关闭）
  if (import.meta.env.DEV) {
    console.log('API请求:', {
      url,
      method: requestInit.method || 'GET',
      query,
    });
  }

  try {
    const response = await fetch(url, {
      ...requestInit,
      body: resolvedBody,
      headers: requestHeaders,
    });

    // 添加响应日志（生产环境可以关闭）
    if (import.meta.env.DEV) {
      console.log('API响应:', {
        url,
        status: response.status,
        ok: response.ok,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const responseData = await parseResponse(response);
    
    // 添加响应数据日志
    console.log('API响应数据:', {
      url,
      data: responseData,
    });

    if (!response.ok) {
      const errorMessage = extractErrorMessage(responseData) ?? `请求失败，状态码 ${response.status}`;
      console.error('API请求失败:', {
        url,
        status: response.status,
        error: errorMessage,
        data: responseData,
      });
      
      throw new ApiError(
        errorMessage,
        response.status,
        responseData,
      );
    }

    // 处理标准API响应格式 {code, message, data}
    if (responseData && typeof responseData === 'object' && 'code' in responseData && 'data' in responseData) {
      const apiResponse = responseData as ApiResponse<T>;
      
      if (apiResponse.code !== 0) {
        console.error('API业务错误:', {
          url,
          code: apiResponse.code,
          message: apiResponse.message,
          data: apiResponse.data,
        });
        
        throw new ApiError(
          apiResponse.message || `业务错误，代码 ${apiResponse.code}`,
          response.status,
          apiResponse,
        );
      }
      
      return apiResponse.data;
    }

    // 如果不是标准格式，直接返回
    return responseData as T;
  } catch (error) {
    console.error('API请求异常:', {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : '网络请求失败',
      0,
      error,
    );
  }
}
