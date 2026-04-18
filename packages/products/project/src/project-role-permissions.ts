import { createApiClient } from '@lserp/http';

export type ProjectPermissionRole = {
  employeeCount: number;
  menuCount: number;
  roleCode: string;
  roleDescription?: string | null;
  roleId: number;
  roleName: string;
  updatedBy?: string | null;
};

export type ProjectEmployeeRoleWorkspace = {
  employeeId: number;
  employeeName: string;
  loginAccount: string;
  roleIds: number[];
};

export type ProjectPermissionMenuNode = {
  children?: ProjectPermissionMenuNode[];
  code?: string;
  id: string;
  menuId?: number;
  nodeType: string;
  parentId?: string;
  parentMenuId?: number;
  subsysCode?: string;
  subsysId: number;
  title: string;
};

export type ProjectRoleMenuWorkspace = {
  menuIds: number[];
  menuTree: ProjectPermissionMenuNode[];
  roleCode: string;
  roleId: number;
  roleName: string;
};

export type SaveProjectPermissionRoleInput = {
  roleCode: string;
  roleDescription?: string;
  roleName: string;
};

type CommonResult<T> = {
  code: number;
  data: T;
  message: string;
};

const projectPermissionApiClient = createApiClient({
  baseUrl:
    (import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8080',
});

async function requestData<T>(path: string) {
  const response = await projectPermissionApiClient.request<CommonResult<T>>(path, {
    method: 'GET',
  });
  return response.data;
}

async function mutateData<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: object,
) {
  const response = await projectPermissionApiClient.request<CommonResult<T>>(path, {
    body,
    method,
  });
  return response.data;
}

export async function fetchProjectPermissionRoles() {
  return requestData<ProjectPermissionRole[]>('/api/system/permission-roles');
}

export async function createProjectPermissionRole(
  input: SaveProjectPermissionRoleInput,
) {
  return mutateData<ProjectPermissionRole>(
    '/api/system/permission-roles',
    'POST',
    input,
  );
}

export async function updateProjectPermissionRole(
  roleId: number,
  input: SaveProjectPermissionRoleInput,
) {
  return mutateData<ProjectPermissionRole>(
    `/api/system/permission-roles/${roleId}`,
    'PUT',
    input,
  );
}

export async function deleteProjectPermissionRole(roleId: number) {
  return mutateData<boolean>(`/api/system/permission-roles/${roleId}`, 'DELETE');
}

export async function fetchProjectEmployeeRoleWorkspace(employeeId: number) {
  return requestData<ProjectEmployeeRoleWorkspace>(
    `/api/system/permission-employees/${employeeId}/roles`,
  );
}

export async function saveProjectEmployeeRoles(
  employeeId: number,
  roleIds: number[],
) {
  return mutateData<ProjectEmployeeRoleWorkspace>(
    `/api/system/permission-employees/${employeeId}/roles`,
    'PUT',
    { roleIds },
  );
}

export async function fetchProjectRoleMenuWorkspace(roleId: number) {
  return requestData<ProjectRoleMenuWorkspace>(
    `/api/system/permission-roles/${roleId}/menus`,
  );
}

export async function saveProjectRoleMenus(roleId: number, menuIds: number[]) {
  return mutateData<ProjectRoleMenuWorkspace>(
    `/api/system/permission-roles/${roleId}/menus`,
    'PUT',
    { menuIds },
  );
}
