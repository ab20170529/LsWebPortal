import { createApiClient } from '@lserp/http';

import { apiConfig } from '../../config';

export interface PlatformTenantDefaultDb {
  id: number | null;
  tenantCode?: string | null;
  title: string | null;
  serverip: string | null;
  serverport: number | null;
  basename: string | null;
  dbType: string | null;
  enableFlag: number | null;
  sortOrder: number | null;
  remark: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt: string | null;
}

export interface PlatformTenant {
  id: number;
  tenantCode: string;
  tenantName: string;
  tenantType: string | null;
  status: string | null;
  enableFlag: number | null;
  ownerLoginAccount: string | null;
  ownerEmployeeName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  remark: string | null;
  createdBy?: string | null;
  createdAt: string | null;
  updatedBy?: string | null;
  updatedAt: string | null;
  defaultDb: PlatformTenantDefaultDb | null;
}

export interface SaveTenantDefaultDbRequest {
  title?: string;
  serverip?: string;
  serverport?: number;
  basename?: string;
  dbType?: string;
  enableFlag?: number;
  sortOrder?: number;
  remark?: string;
}

export interface PlatformTenantCreateRequest {
  tenantCode: string;
  tenantName: string;
  tenantType?: string;
  status?: string;
  ownerLoginAccount?: string;
  ownerEmployeeName?: string;
  contactName?: string;
  contactPhone?: string;
  remark?: string;
  defaultDb?: SaveTenantDefaultDbRequest;
}

export interface PlatformTenantUpdateRequest {
  tenantName: string;
  tenantType?: string;
  status?: string;
  ownerLoginAccount?: string;
  ownerEmployeeName?: string;
  contactName?: string;
  contactPhone?: string;
  enableFlag?: number;
  remark?: string;
}

export interface TenantDefaultDbTestResult {
  success: boolean;
  message: string;
  serverip?: string;
  serverport?: number;
  basename?: string;
  dbType?: string;
}

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

function resolveApiBaseUrl() {
  if (apiConfig.baseUrl) {
    return apiConfig.baseUrl;
  }

  return typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
}

const client = createApiClient(resolveApiBaseUrl());

function unwrap<T>(response: ApiResponse<T>): T {
  return response.data;
}

export const platformTenantApi = {
  async listTenants(keyword?: string): Promise<PlatformTenant[]> {
    return unwrap(await client.request<ApiResponse<PlatformTenant[]>>('/api/platform/tenants', {
      query: { keyword },
    })) ?? [];
  },

  async getTenant(tenantCode: string): Promise<PlatformTenant> {
    return unwrap(await client.request<ApiResponse<PlatformTenant>>(
      `/api/platform/tenants/${encodeURIComponent(tenantCode)}`,
    ));
  },

  async createTenant(data: PlatformTenantCreateRequest): Promise<PlatformTenant> {
    return unwrap(await client.request<ApiResponse<PlatformTenant>>('/api/platform/tenants', {
      body: data,
      method: 'POST',
    }));
  },

  async updateTenant(tenantCode: string, data: PlatformTenantUpdateRequest): Promise<PlatformTenant> {
    return unwrap(await client.request<ApiResponse<PlatformTenant>>(
      `/api/platform/tenants/${encodeURIComponent(tenantCode)}`,
      {
        body: data,
        method: 'PUT',
      },
    ));
  },

  async disableTenant(tenantCode: string): Promise<void> {
    await client.request<ApiResponse<boolean>>(`/api/platform/tenants/${encodeURIComponent(tenantCode)}`, {
      method: 'DELETE',
    });
  },

  async getDefaultDb(tenantCode: string): Promise<PlatformTenantDefaultDb | null> {
    return unwrap(await client.request<ApiResponse<PlatformTenantDefaultDb | null>>(
      `/api/platform/tenants/${encodeURIComponent(tenantCode)}/default-db`,
    ));
  },

  async saveDefaultDb(
    tenantCode: string,
    data: SaveTenantDefaultDbRequest,
  ): Promise<PlatformTenantDefaultDb> {
    return unwrap(await client.request<ApiResponse<PlatformTenantDefaultDb>>(
      `/api/platform/tenants/${encodeURIComponent(tenantCode)}/default-db`,
      {
        body: data,
        method: 'PUT',
      },
    ));
  },

  async testDefaultDb(
    tenantCode: string,
    data?: SaveTenantDefaultDbRequest,
  ): Promise<TenantDefaultDbTestResult> {
    return unwrap(await client.request<ApiResponse<TenantDefaultDbTestResult>>(
      `/api/platform/tenants/${encodeURIComponent(tenantCode)}/default-db/test`,
      {
        body: data ?? null,
        method: 'POST',
      },
    ));
  },
};
