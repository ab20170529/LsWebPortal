import { createApiClient } from '@lserp/http';
import { apiConfig } from '../../config';

export interface PortalSystem {
  id: number;
  systemId: string;
  title: string;
  description: string | null;
  shortLabel: string | null;
  route: string;
  tone: string | null;
  enabled: number;
  sortOrder: number;
  remark: string | null;
  createBy: string | null;
  createTime: string | null;
  updateBy: string | null;
  updateTime: string | null;
}

export interface PortalSystemSaveRequest {
  systemId: string;
  title: string;
  description?: string;
  shortLabel?: string;
  route: string;
  tone?: string;
  enabled: number;
  sortOrder?: number;
  remark?: string;
}

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

const client = createApiClient(apiConfig.baseUrl);

export const portalSystemApi = {
  /** 获取所有系统（含禁用，管理台用） */
  async listAll(): Promise<PortalSystem[]> {
    const resp = await client.request<ApiResponse<PortalSystem[]>>('/api/portal/systems/all');
    return resp.data ?? [];
  },

  /** 获取单个系统 */
  async get(id: number): Promise<PortalSystem> {
    const resp = await client.request<ApiResponse<PortalSystem>>(`/api/portal/systems/${id}`);
    return resp.data;
  },

  /** 新建系统 */
  async create(data: PortalSystemSaveRequest): Promise<PortalSystem> {
    const resp = await client.request<ApiResponse<PortalSystem>>('/api/portal/systems', {
      method: 'POST',
      body: data,
    });
    return resp.data;
  },

  /** 更新系统 */
  async update(id: number, data: PortalSystemSaveRequest): Promise<PortalSystem> {
    const resp = await client.request<ApiResponse<PortalSystem>>(`/api/portal/systems/${id}`, {
      method: 'PUT',
      body: data,
    });
    return resp.data;
  },

  /** 删除系统 */
  async remove(id: number): Promise<void> {
    await client.request<ApiResponse<boolean>>(`/api/portal/systems/${id}`, {
      method: 'DELETE',
    });
  },
};
