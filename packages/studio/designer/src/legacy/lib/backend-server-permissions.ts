import { apiRequest } from '../shared/api/http';

export interface ServerPermissionRow {
  basename: string;
  companyKey: string;
  permissionConfigured: boolean;
  permissionEnabled: boolean;
  serverip: string;
  serverport: number;
  title: string;
  updatedBy?: string | null;
}

export interface ServerPermissionWorkspace {
  companies: ServerPermissionRow[];
  employeeId: number;
  employeeName: string;
  hasCustomPermissions: boolean;
  loginAccount: string;
}

export interface ServerCompanyDirectoryItem {
  basename: string;
  companyKey: string;
  serverip: string;
  serverport: number;
  title: string;
}

export interface CreateServerCompanyInput {
  baseName: string;
  serverIp: string;
  serverPort: number;
  title: string;
}

export async function fetchServerPermissionWorkspace(employeeId: number) {
  return apiRequest<ServerPermissionWorkspace>('/api/system/server-permissions', {
    auth: true,
    method: 'GET',
    query: {
      employeeId,
    },
  });
}

export async function saveServerPermissionWorkspace(employeeId: number, companyKeys: string[]) {
  return apiRequest<ServerPermissionWorkspace>(`/api/system/server-permissions/${employeeId}`, {
    auth: true,
    body: {
      companyKeys,
    },
    method: 'PUT',
  });
}

export async function createServerCompany(input: CreateServerCompanyInput) {
  return apiRequest<ServerCompanyDirectoryItem>('/api/system/server-companies', {
    auth: true,
    body: input,
    method: 'POST',
  });
}
