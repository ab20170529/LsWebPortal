import type { AuthSession } from '@lserp/auth';

import type {
  ProjectWorkspaceGroup,
  ProjectWorkspaceItem,
  WorkspaceMode,
} from './project-workspace-config';

const ALL_PROJECT_WORKSPACES: WorkspaceMode[] = [
  'project-management',
  'project-gantt-workspace',
  'task-submission',
  'plan-log',
  'delay-application',
  'milestone-template-management',
  'project-analysis-dashboard',
  'project-user-permission-management',
  'project-role-permission-management',
];

const ADMIN_ONLY_WORKSPACES: WorkspaceMode[] = [
  'project-user-permission-management',
  'project-role-permission-management',
];
const PMO_WORKSPACES: WorkspaceMode[] = ALL_PROJECT_WORKSPACES.filter(
  (workspaceId) => !ADMIN_ONLY_WORKSPACES.includes(workspaceId),
);
const MANAGER_WORKSPACES: WorkspaceMode[] = [
  'project-management',
  'project-gantt-workspace',
  'task-submission',
  'plan-log',
  'delay-application',
  'project-analysis-dashboard',
];
const MEMBER_WORKSPACES: WorkspaceMode[] = [
  'task-submission',
  'plan-log',
  'delay-application',
];
const VIEWER_WORKSPACES: WorkspaceMode[] = [
  'project-management',
  'project-analysis-dashboard',
];
const TEMPLATE_WORKSPACES: WorkspaceMode[] = ['milestone-template-management'];
const FALLBACK_WORKSPACES: WorkspaceMode[] = [
  'task-submission',
  'plan-log',
  'delay-application',
];

type ProjectRoleFlags = {
  employeeUserId: string;
  hasManagerRole: boolean;
  hasMemberRole: boolean;
  hasPmoRole: boolean;
  hasTemplateRole: boolean;
  hasViewerRole: boolean;
  isSuperAdmin: boolean;
};

export type ProjectPermissionContext = ProjectRoleFlags & {
  canViewAllProjects: boolean;
  visibleWorkspaceIds: WorkspaceMode[];
};

type ProjectItemLike = {
  id: number;
  managerId?: string | null;
};

type ProjectMemberLike = {
  isManager?: boolean | null;
  userId: string;
};

type ProjectTaskLike = {
  id: number;
  responsibleUserId?: string | null;
};

type ProjectPlanLike = {
  managerId?: string | null;
};

type ProjectReportLike = {
  userId?: string | null;
};

function normalizeRoleText(value: string) {
  return value.trim().toLowerCase();
}

function matchRoleKeyword(values: string[], keywords: string[]) {
  return keywords.some((keyword) =>
    values.some((value) => value.includes(keyword)),
  );
}

function getRoleFlags(session: AuthSession | null): ProjectRoleFlags {
  const employeeUserId = session ? String(session.employeeId) : '';
  const normalizedRoleTexts = (session?.roleAssignments ?? []).map((role) =>
    normalizeRoleText(`${role.id} ${role.label}`),
  );

  const hasPmoRole = matchRoleKeyword(normalizedRoleTexts, [
    'role-project-pmo',
    ' project pmo',
    'pmo',
    '项目管理办公室',
    '项目管理管理员',
    '项目管理',
  ]);
  const hasTemplateRole = matchRoleKeyword(normalizedRoleTexts, [
    'role-project-template-admin',
    'milestone-template',
    'template-admin',
    '模板管理员',
    '里程碑模板',
    '模板维护',
  ]);
  const hasManagerRole = matchRoleKeyword(normalizedRoleTexts, [
    'role-project-manager',
    'project-manager',
    '项目经理',
    '项目负责人',
  ]);
  const hasMemberRole = matchRoleKeyword(normalizedRoleTexts, [
    'role-project-member',
    'project-member',
    '项目成员',
    '执行成员',
    '普通成员',
  ]);
  const hasViewerRole = matchRoleKeyword(normalizedRoleTexts, [
    'role-project-viewer',
    'project-viewer',
    'viewer',
    '观察者',
    '只读',
    '查看',
  ]);

  return {
    employeeUserId,
    hasManagerRole,
    hasMemberRole,
    hasPmoRole,
    hasTemplateRole,
    hasViewerRole,
    isSuperAdmin: Boolean(session?.admin),
  };
}

export function resolveProjectPermissionContext(
  session: AuthSession | null,
): ProjectPermissionContext {
  const flags = getRoleFlags(session);

  if (flags.isSuperAdmin) {
    return {
      ...flags,
      canViewAllProjects: true,
      visibleWorkspaceIds: [...ALL_PROJECT_WORKSPACES],
    };
  }

  const visibleWorkspaceIdSet = new Set<WorkspaceMode>();

  if (flags.hasPmoRole) {
    PMO_WORKSPACES.forEach((item) => visibleWorkspaceIdSet.add(item));
  }
  if (flags.hasTemplateRole) {
    TEMPLATE_WORKSPACES.forEach((item) => visibleWorkspaceIdSet.add(item));
  }
  if (flags.hasManagerRole) {
    MANAGER_WORKSPACES.forEach((item) => visibleWorkspaceIdSet.add(item));
  }
  if (flags.hasMemberRole) {
    MEMBER_WORKSPACES.forEach((item) => visibleWorkspaceIdSet.add(item));
  }
  if (flags.hasViewerRole) {
    VIEWER_WORKSPACES.forEach((item) => visibleWorkspaceIdSet.add(item));
  }

  if (visibleWorkspaceIdSet.size === 0) {
    FALLBACK_WORKSPACES.forEach((item) => visibleWorkspaceIdSet.add(item));
  }

  return {
    ...flags,
    canViewAllProjects: flags.hasPmoRole,
    visibleWorkspaceIds: ALL_PROJECT_WORKSPACES.filter((workspaceId) =>
      visibleWorkspaceIdSet.has(workspaceId),
    ),
  };
}

export function filterProjectWorkspaceItemsByPermission(
  workspaceItems: ProjectWorkspaceItem[],
  permission: ProjectPermissionContext,
) {
  return workspaceItems.filter((item) =>
    permission.visibleWorkspaceIds.includes(item.id),
  );
}

export function filterProjectWorkspaceGroupsByPermission(
  workspaceGroups: ProjectWorkspaceGroup[],
  visibleWorkspaceIds: WorkspaceMode[],
) {
  return workspaceGroups
    .map((group) => ({
      ...group,
      itemIds: group.itemIds.filter((itemId) =>
        visibleWorkspaceIds.includes(itemId),
      ),
    }))
    .filter((group) => group.itemIds.length > 0);
}

export function resolveProjectDefaultWorkspace(
  permission: ProjectPermissionContext,
  currentWorkspaceMode: WorkspaceMode,
) {
  if (permission.visibleWorkspaceIds.includes(currentWorkspaceMode)) {
    return currentWorkspaceMode;
  }

  return permission.visibleWorkspaceIds[0] ?? 'task-submission';
}

export function canAccessProjectRecord(
  project: ProjectItemLike,
  permission: ProjectPermissionContext,
) {
  if (permission.isSuperAdmin || permission.canViewAllProjects) {
    return true;
  }

  if (!permission.employeeUserId) {
    return false;
  }

  return String(project.managerId ?? '') === permission.employeeUserId;
}

export function canAccessProjectByMembers(
  projectMembers: ProjectMemberLike[],
  permission: ProjectPermissionContext,
) {
  if (permission.isSuperAdmin || permission.canViewAllProjects) {
    return true;
  }

  if (!permission.employeeUserId) {
    return false;
  }

  return projectMembers.some(
    (member) => String(member.userId) === permission.employeeUserId,
  );
}

export function canManageProjectSchedule(
  projectMembers: ProjectMemberLike[],
  permission: ProjectPermissionContext,
) {
  if (permission.isSuperAdmin || permission.canViewAllProjects) {
    return true;
  }

  if (!permission.employeeUserId) {
    return false;
  }

  return projectMembers.some(
    (member) =>
      String(member.userId) === permission.employeeUserId &&
      Boolean(member.isManager),
  );
}

export function canCreateProject(permission: ProjectPermissionContext) {
  return (
    permission.isSuperAdmin ||
    permission.canViewAllProjects ||
    permission.hasManagerRole
  );
}

export function canManageProjectRecord(
  project: ProjectItemLike,
  permission: ProjectPermissionContext,
) {
  if (permission.isSuperAdmin || permission.canViewAllProjects) {
    return true;
  }

  if (!permission.employeeUserId) {
    return false;
  }

  return String(project.managerId ?? '') === permission.employeeUserId;
}

export function filterTasksByPermission<T extends ProjectTaskLike>(
  tasks: T[],
  permission: ProjectPermissionContext,
): T[] {
  if (permission.isSuperAdmin || permission.canViewAllProjects || permission.hasManagerRole) {
    return tasks;
  }

  if (!permission.employeeUserId) {
    return [];
  }

  return tasks.filter(
    (task) => String(task.responsibleUserId ?? '') === permission.employeeUserId,
  );
}

export function filterPlansByPermission<T extends ProjectPlanLike>(
  plans: T[],
  permission: ProjectPermissionContext,
): T[] {
  if (permission.isSuperAdmin || permission.canViewAllProjects || permission.hasManagerRole) {
    return plans;
  }

  if (!permission.employeeUserId) {
    return [];
  }

  return plans.filter(
    (plan) => String(plan.managerId ?? '') === permission.employeeUserId,
  );
}

export function filterReportsByPermission<T extends ProjectReportLike>(
  reports: T[],
  permission: ProjectPermissionContext,
): T[] {
  if (permission.isSuperAdmin || permission.canViewAllProjects || permission.hasManagerRole) {
    return reports;
  }

  if (!permission.employeeUserId) {
    return [];
  }

  return reports.filter(
    (report) => String(report.userId ?? '') === permission.employeeUserId,
  );
}
