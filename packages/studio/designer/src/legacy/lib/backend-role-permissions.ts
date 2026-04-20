import type { BackendSubsystemNode } from './backend-menus';
import { apiRequest } from '../shared/api/http';

export interface PermissionRole {
  employeeCount: number;
  menuCount: number;
  roleCode: string;
  roleDescription?: string | null;
  roleId: number;
  roleName: string;
  updatedBy?: string | null;
}

export interface EmployeeRoleWorkspace {
  employeeId: number;
  employeeName: string;
  loginAccount: string;
  roleIds: number[];
}

export interface RoleMenuWorkspace {
  menuIds: number[];
  menuTree: BackendSubsystemNode[];
  roleCode: string;
  roleId: number;
  roleName: string;
}

export interface SavePermissionRoleInput {
  roleCode: string;
  roleDescription?: string;
  roleName: string;
}

export async function fetchPermissionRoles() {
  return apiRequest<PermissionRole[]>('/api/system/permission-roles', {
    auth: true,
    method: 'GET',
  });
}

export async function createPermissionRole(input: SavePermissionRoleInput) {
  return apiRequest<PermissionRole>('/api/system/permission-roles', {
    auth: true,
    body: input,
    method: 'POST',
  });
}

export async function updatePermissionRole(roleId: number, input: SavePermissionRoleInput) {
  return apiRequest<PermissionRole>(`/api/system/permission-roles/${roleId}`, {
    auth: true,
    body: input,
    method: 'PUT',
  });
}

export async function deletePermissionRole(roleId: number) {
  return apiRequest<boolean>(`/api/system/permission-roles/${roleId}`, {
    auth: true,
    method: 'DELETE',
  });
}

export async function fetchEmployeeRoleWorkspace(employeeId: number) {
  return apiRequest<EmployeeRoleWorkspace>(`/api/system/permission-employees/${employeeId}/roles`, {
    auth: true,
    method: 'GET',
  });
}

export async function saveEmployeeRoles(employeeId: number, roleIds: number[]) {
  return apiRequest<EmployeeRoleWorkspace>(`/api/system/permission-employees/${employeeId}/roles`, {
    auth: true,
    body: {
      roleIds,
    },
    method: 'PUT',
  });
}

export async function fetchRoleMenuWorkspace(roleId: number) {
  return apiRequest<RoleMenuWorkspace>(`/api/system/permission-roles/${roleId}/menus`, {
    auth: true,
    method: 'GET',
  });
}

export async function saveRoleMenus(roleId: number, menuIds: number[]) {
  return apiRequest<RoleMenuWorkspace>(`/api/system/permission-roles/${roleId}/menus`, {
    auth: true,
    body: {
      menuIds,
    },
    method: 'PUT',
  });
}
