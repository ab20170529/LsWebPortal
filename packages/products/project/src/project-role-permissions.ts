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

const fallbackPermissionRoles: ProjectPermissionRole[] = [
  {
    employeeCount: 3,
    menuCount: 8,
    roleCode: 'PROJECT_ADMIN',
    roleDescription: '负责项目全流程管理，可维护台账、排期、计划与权限。',
    roleId: 1,
    roleName: '项目管理员',
    updatedBy: '系统预置',
  },
  {
    employeeCount: 5,
    menuCount: 5,
    roleCode: 'PROJECT_MANAGER',
    roleDescription: '负责项目执行协同，可管理排期、任务填报和计划日志。',
    roleId: 2,
    roleName: '项目经理',
    updatedBy: '系统预置',
  },
  {
    employeeCount: 9,
    menuCount: 3,
    roleCode: 'PROJECT_MEMBER',
    roleDescription: '参与项目任务执行，可查看项目并提交任务进度。',
    roleId: 3,
    roleName: '项目成员',
    updatedBy: '系统预置',
  },
  {
    employeeCount: 2,
    menuCount: 4,
    roleCode: 'PROJECT_AUDITOR',
    roleDescription: '负责项目进度、延期申请和交付材料的审核。',
    roleId: 4,
    roleName: '项目审核员',
    updatedBy: '系统预置',
  },
];

const fallbackEmployeeRoleIdsByEmployeeId: Record<number, number[]> = {
  1001: [1, 2],
  1002: [2, 3],
  1003: [3],
  1004: [4],
  1005: [3, 4],
};

const fallbackMenuTree: ProjectPermissionMenuNode[] = [
  {
    children: [
      {
        code: 'task-submission',
        id: 'menu-task-submission',
        menuId: 101,
        nodeType: 'menu',
        parentId: 'subsystem-work',
        subsysId: 1,
        title: '任务填报',
      },
      {
        code: 'plan-log',
        id: 'menu-plan-log',
        menuId: 102,
        nodeType: 'menu',
        parentId: 'subsystem-work',
        subsysId: 1,
        title: '计划与日志',
      },
      {
        code: 'delay-application',
        id: 'menu-delay-application',
        menuId: 103,
        nodeType: 'menu',
        parentId: 'subsystem-work',
        subsysId: 1,
        title: '延期申请',
      },
    ],
    code: 'work',
    id: 'subsystem-work',
    nodeType: 'subsystem',
    subsysId: 1,
    title: '我的工作',
  },
  {
    children: [
      {
        code: 'project-management',
        id: 'menu-project-management',
        menuId: 201,
        nodeType: 'menu',
        parentId: 'subsystem-control',
        subsysId: 2,
        title: '项目台账',
      },
      {
        code: 'project-gantt-workspace',
        id: 'menu-project-gantt',
        menuId: 202,
        nodeType: 'menu',
        parentId: 'subsystem-control',
        subsysId: 2,
        title: '排期协同',
      },
    ],
    code: 'control',
    id: 'subsystem-control',
    nodeType: 'subsystem',
    subsysId: 2,
    title: '项目控制',
  },
  {
    children: [
      {
        code: 'project-analysis-dashboard',
        id: 'menu-project-analysis',
        menuId: 301,
        nodeType: 'menu',
        parentId: 'subsystem-analysis',
        subsysId: 3,
        title: '项目分析看板',
      },
    ],
    code: 'analysis',
    id: 'subsystem-analysis',
    nodeType: 'subsystem',
    subsysId: 3,
    title: '洞察分析',
  },
  {
    children: [
      {
        code: 'project-type-management',
        id: 'menu-project-type',
        menuId: 401,
        nodeType: 'menu',
        parentId: 'subsystem-config',
        subsysId: 4,
        title: '里程碑模板管理',
      },
      {
        code: 'project-user-permission-management',
        id: 'menu-user-permission',
        menuId: 402,
        nodeType: 'menu',
        parentId: 'subsystem-config',
        subsysId: 4,
        title: '用户权限',
      },
      {
        code: 'project-role-permission-management',
        id: 'menu-role-permission',
        menuId: 403,
        nodeType: 'menu',
        parentId: 'subsystem-config',
        subsysId: 4,
        title: '角色权限',
      },
    ],
    code: 'config',
    id: 'subsystem-config',
    nodeType: 'subsystem',
    subsysId: 4,
    title: '标准配置',
  },
];

const fallbackAllMenuIds = fallbackMenuTree.flatMap((node) =>
  (node.children ?? []).map((child) => child.menuId).filter((menuId): menuId is number => typeof menuId === 'number'),
);

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
  try {
    const roles = await requestData<ProjectPermissionRole[]>('/api/system/permission-roles');
    return roles.length ? roles : fallbackPermissionRoles;
  } catch {
    return fallbackPermissionRoles;
  }
}

export async function createProjectPermissionRole(
  input: SaveProjectPermissionRoleInput,
) {
  try {
    return await mutateData<ProjectPermissionRole>(
      '/api/system/permission-roles',
      'POST',
      input,
    );
  } catch {
    return {
      employeeCount: 0,
      menuCount: 0,
      roleCode: input.roleCode,
      roleDescription: input.roleDescription ?? '',
      roleId: Date.now(),
      roleName: input.roleName,
      updatedBy: '本地预览',
    };
  }
}

export async function updateProjectPermissionRole(
  roleId: number,
  input: SaveProjectPermissionRoleInput,
) {
  try {
    return await mutateData<ProjectPermissionRole>(
      `/api/system/permission-roles/${roleId}`,
      'PUT',
      input,
    );
  } catch {
    const current = fallbackPermissionRoles.find((role) => role.roleId === roleId);
    return {
      employeeCount: current?.employeeCount ?? 0,
      menuCount: current?.menuCount ?? 0,
      roleCode: input.roleCode,
      roleDescription: input.roleDescription ?? '',
      roleId,
      roleName: input.roleName,
      updatedBy: '本地预览',
    };
  }
}

export async function deleteProjectPermissionRole(roleId: number) {
  try {
    return await mutateData<boolean>(`/api/system/permission-roles/${roleId}`, 'DELETE');
  } catch {
    return true;
  }
}

export async function fetchProjectEmployeeRoleWorkspace(employeeId: number) {
  try {
    return await requestData<ProjectEmployeeRoleWorkspace>(
      `/api/system/permission-employees/${employeeId}/roles`,
    );
  } catch {
    return {
      employeeId,
      employeeName: `演示员工 ${employeeId}`,
      loginAccount: `demo${employeeId}`,
      roleIds: fallbackEmployeeRoleIdsByEmployeeId[employeeId] ?? [3],
    };
  }
}

export async function saveProjectEmployeeRoles(
  employeeId: number,
  roleIds: number[],
) {
  try {
    return await mutateData<ProjectEmployeeRoleWorkspace>(
      `/api/system/permission-employees/${employeeId}/roles`,
      'PUT',
      { roleIds },
    );
  } catch {
    return {
      employeeId,
      employeeName: `演示员工 ${employeeId}`,
      loginAccount: `demo${employeeId}`,
      roleIds,
    };
  }
}

export async function fetchProjectRoleMenuWorkspace(roleId: number) {
  try {
    return await requestData<ProjectRoleMenuWorkspace>(
      `/api/system/permission-roles/${roleId}/menus`,
    );
  } catch {
    const role = fallbackPermissionRoles.find((item) => item.roleId === roleId);
    return {
      menuIds: roleId === 1 ? fallbackAllMenuIds : fallbackAllMenuIds.slice(0, Math.max(1, role?.menuCount ?? 3)),
      menuTree: fallbackMenuTree,
      roleCode: role?.roleCode ?? 'DEMO_ROLE',
      roleId,
      roleName: role?.roleName ?? '演示角色',
    };
  }
}

export async function saveProjectRoleMenus(roleId: number, menuIds: number[]) {
  try {
    return await mutateData<ProjectRoleMenuWorkspace>(
      `/api/system/permission-roles/${roleId}/menus`,
      'PUT',
      { menuIds },
    );
  } catch {
    const role = fallbackPermissionRoles.find((item) => item.roleId === roleId);
    return {
      menuIds,
      menuTree: fallbackMenuTree,
      roleCode: role?.roleCode ?? 'DEMO_ROLE',
      roleId,
      roleName: role?.roleName ?? '演示角色',
    };
  }
}
