import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { usePortalAuth } from '@lserp/auth';
import { Badge, Button, Card, cx } from '@lserp/ui';
import { ActionConsole } from './action-console';
import {
  getFileCategoryLabel,
  getProjectStatusLabel,
  getProjectStatusTone,
  getRowKindLabel,
} from './project-display';
import { ProjectGanttWorkspacePage } from './project-gantt-workspace-page';
import type { TaskDependency } from './gantt-types';
import {
  ProjectManagementPage,
  type ProjectManagementProjectDetail,
  type ProjectManagementProjectItem,
  type ProjectManagementProjectType,
  type ProjectSavePayload,
} from './project-management-page';
import {
  deleteProjectAttachment,
  fetchProjectAttachments,
  uploadProjectAttachment,
  type ProjectAttachmentRecord,
  type UploadProjectAttachmentInput,
} from './project-attachments';
import { ProjectRolePermissionManagementPage } from './project-role-permission-management-page';
import { ProjectTypeManagementPage } from './project-type-management-page';
import { ProjectUserPermissionManagementPage } from './project-user-permission-management-page';
import {
  projectWorkspaceGroups,
  projectWorkspaceItems,
  type WorkspaceMode,
} from './project-workspace-config';
import { createProjectApiClient } from './project-api';
import { ProjectWorkspaceShell } from './project-workspace-shell';
import { ProjectToastProvider } from './project-toast';
import { ProjectAnalysisDashboardPage } from './workspaces/analysis-dashboard/analysis-dashboard-page';
import { ProjectDelayApplicationPage } from './workspaces/delay-application/delay-application-page';
import { ProjectPlanLogPage } from './workspaces/plan-log/plan-log-page';
import { ProjectTaskSubmissionPage } from './workspaces/task-submission/task-submission-page';
import {
  canAccessProjectByMembers,
  canAccessProjectRecord,
  canCreateProject,
  canManageProjectRecord,
  canManageProjectSchedule,
  filterPlansByPermission,
  filterProjectWorkspaceGroupsByPermission,
  filterProjectWorkspaceItemsByPermission,
  filterReportsByPermission,
  filterTasksByPermission,
  resolveProjectDefaultWorkspace,
  resolveProjectPermissionContext,
} from './project-permissions';

type CommonResult<T> = {
  code: number;
  data: T;
  message: string;
};

type PagedResult<T> = {
  list?: T[];
  items: T[];
  pageNo?: number;
  pageNumber: number;
  pageSize: number;
  total?: number;
  totalCount: number;
};

function getPagedItems<T>(data: PagedResult<T> | null | undefined) {
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  if (Array.isArray(data?.list)) {
    return data.list;
  }
  return [];
}

type ProjectItem = ProjectManagementProjectItem;
type ProjectType = ProjectManagementProjectType;

type ProjectMember = {
  dutyContent?: string | null;
  id: number;
  isManager?: boolean | null;
  remark?: string | null;
  roleCode?: string | null;
  roleName?: string | null;
  userId: string;
  userName: string;
};

type ProjectBudget = {
  actualAmount?: number | null;
  feeDesc?: string | null;
  feeItem: string;
  feeType?: string | null;
  id: number;
  operatorName?: string | null;
  planAmount?: number | null;
  remark?: string | null;
};

type ProjectNode = {
  id: number;
  nodeName: string;
  actualEndTime?: string | null;
  actualStartTime?: string | null;
  level?: number | null;
  parentId?: number | null;
  planEndTime?: string | null;
  planStartTime?: string | null;
  progressRate?: number | null;
  remark?: string | null;
  sort?: number | null;
  status?: string | null;
};

type ProjectTask = {
  id: number;
  actualEndTime?: string | null;
  actualStartTime?: string | null;
  auditStatus?: string | null;
  checkStatus?: string | null;
  finishDesc?: string | null;
  planEndTime?: string | null;
  planStartTime?: string | null;
  progressRate?: number | null;
  projectNodeId?: number | null;
  remark?: string | null;
  responsibleName?: string | null;
  responsibleUserId?: string | null;
  status?: string | null;
  taskTitle: string;
  taskContent?: string | null;
};

type ProjectTaskParticipant = {
  userId: string;
  userName: string;
};

type ProjectTaskDetail = {
  participantMembers: ProjectTaskParticipant[];
  task: ProjectTask;
};

type ProjectDetailStatistics = {
  budgetCount: number;
  completedTaskCount: number;
  inProgressTaskCount: number;
  memberCount: number;
  nodeCount: number;
  taskCount: number;
  totalActualAmount?: number | null;
  totalPlanAmount?: number | null;
};

type ProjectDetail = ProjectManagementProjectDetail & {
  statistics: ProjectDetailStatistics;
  members: ProjectMember[];
  budgets: ProjectBudget[];
  nodes: ProjectNode[];
  tasks: ProjectTask[];
};

type ProjectPlan = {
  id: number;
  managerId?: string | null;
  managerName?: string | null;
  planContent?: string | null;
  planEndDate?: string | null;
  planMonth?: string | null;
  planPeriod?: string | null;
  planStartDate?: string | null;
  planType: string;
  planWeek?: string | null;
  status?: string | null;
};

type ProjectPlanItem = {
  assigneeId?: string | null;
  assigneeName?: string | null;
  helpDept?: string | null;
  id: number;
  planContent: string;
  planDate?: string | null;
  planRequirement?: string | null;
  projectId: number;
  projectNodeId?: number | null;
  projectPlanId: number;
  projectTaskId?: number | null;
  status?: string | null;
  weekDay?: string | null;
};

type ProjectReport = {
  coordinationContent?: string | null;
  id: number;
  delayFlag?: boolean | null;
  delayReason?: string | null;
  finishContent?: string | null;
  projectNodeId?: number | null;
  projectTaskId?: number | null;
  remark?: string | null;
  reportContent?: string | null;
  reportDate?: string | null;
  reportMonth?: string | null;
  reportType: string;
  reportWeek?: string | null;
  userId?: string | null;
  userName: string;
};

type ProjectAttachment = ProjectAttachmentRecord;

type GanttRow = {
  end: Date;
  id: string;
  kind: 'node' | 'task';
  owner?: string | null;
  progress: number;
  start: Date;
  status: string;
  title: string;
};

type ProjectHomePageProps = {
  onExitSystem?: () => void;
};

const projectApiClient = createProjectApiClient();

const fallbackProjectTypes: ProjectType[] = [
  { id: 9001, sort: 1, status: 'ACTIVE', typeCode: 'xmgl_demo', typeDesc: '项目管理平台标准实施模板', typeName: '项目管理开发' },
  { id: 9002, sort: 2, status: 'ACTIVE', typeCode: 'sjzl_demo', typeDesc: '数据治理与报表建设模板', typeName: '数据治理项目' },
  { id: 9003, sort: 3, status: 'INACTIVE', typeCode: 'ywxt_demo', typeDesc: '业务系统升级改造模板', typeName: '业务系统优化' },
];

const fallbackProjects: ProjectItem[] = [
  {
    attendanceAddress: '上海市浦东新区项目办公室',
    budgetAmount: 260000,
    businessUnit: '数字化中心',
    id: 7001,
    managerId: '1001',
    managerName: '王秀娟',
    planEndTime: '2026-04-30T23:59:00',
    planStartTime: '2026-04-09T00:00:00',
    projectCode: 'xmgl_0001',
    projectDesc: '用于项目台账、排期协同、任务填报和计划日志的演示项目。',
    projectName: '项目管理开发',
    projectTypeId: 9001,
    sourceCode: 'DEMO-202604',
    sourceContent: '演示数据',
    sourceSystem: '本地预览',
    status: 'IN_PROGRESS',
  },
  {
    attendanceAddress: '杭州市数据治理办公室',
    budgetAmount: 180000,
    businessUnit: '数据平台部',
    id: 7002,
    managerId: '1002',
    managerName: '张伟',
    planEndTime: '2026-05-15T23:59:00',
    planStartTime: '2026-04-20T00:00:00',
    projectCode: 'sjzl_0002',
    projectDesc: '用于数据源盘点、指标模型建设与报表验收的演示项目。',
    projectName: '数据治理项目',
    projectTypeId: 9002,
    sourceCode: 'DEMO-202605',
    sourceContent: '演示数据',
    sourceSystem: '本地预览',
    status: 'NOT_STARTED',
  },
];

const fallbackProjectDetailsById: Record<number, ProjectDetail> = {
  7001: {
    project: fallbackProjects[0]!,
    statistics: {
      budgetCount: 2,
      completedTaskCount: 2,
      inProgressTaskCount: 1,
      memberCount: 4,
      nodeCount: 4,
      taskCount: 5,
      totalActualAmount: 126000,
      totalPlanAmount: 260000,
    },
    members: [
      { dutyContent: '统筹排期与资源协调', id: 1, isManager: true, roleCode: 'PROJECT_MANAGER', roleName: '项目经理', userId: '1001', userName: '王秀娟' },
      { dutyContent: '负责界面设计与前端实现', id: 2, roleCode: 'PROJECT_MEMBER', roleName: '项目成员', userId: '1002', userName: '张伟' },
      { dutyContent: '负责验收测试', id: 3, roleCode: 'PROJECT_AUDITOR', roleName: '项目审核员', userId: '1003', userName: '刘明' },
      { dutyContent: '负责费用结算', id: 4, roleCode: 'PROJECT_MEMBER', roleName: '项目成员', userId: '1004', userName: '陈丽' },
    ],
    budgets: [
      { actualAmount: 86000, feeDesc: '设计与前端开发', feeItem: '开发费用', feeType: '研发', id: 1, operatorName: '陈丽', planAmount: 180000 },
      { actualAmount: 40000, feeDesc: '测试与验收支持', feeItem: '测试费用', feeType: '交付', id: 2, operatorName: '陈丽', planAmount: 80000 },
    ],
    nodes: [
      { id: 8001, level: 0, nodeName: '项目立项', planEndTime: '2026-04-12T23:59:00', planStartTime: '2026-04-09T00:00:00', progressRate: 100, sort: 1, status: 'DONE' },
      { id: 8002, level: 0, nodeName: '项目开发', planEndTime: '2026-04-24T23:59:00', planStartTime: '2026-04-15T00:00:00', progressRate: 40, sort: 2, status: 'IN_PROGRESS' },
      { id: 8003, level: 1, nodeName: '设计界面', parentId: 8002, planEndTime: '2026-04-17T23:59:00', planStartTime: '2026-04-15T00:00:00', progressRate: 100, sort: 3, status: 'DONE' },
      { id: 8004, level: 1, nodeName: '开发代码', parentId: 8002, planEndTime: '2026-04-24T23:59:00', planStartTime: '2026-04-18T00:00:00', progressRate: 20, sort: 4, status: 'IN_PROGRESS' },
    ],
    tasks: [
      { finishDesc: '已完成准备材料', id: 8101, planEndTime: '2026-04-12T23:59:00', planStartTime: '2026-04-09T00:00:00', progressRate: 100, projectNodeId: 8001, responsibleName: '王秀娟', responsibleUserId: '1001', status: 'DONE', taskContent: '完成项目范围确认、干系人同步与资料准备。', taskTitle: '项目准备' },
      { finishDesc: '高保真已确认', id: 8102, planEndTime: '2026-04-17T23:59:00', planStartTime: '2026-04-15T00:00:00', progressRate: 100, projectNodeId: 8003, responsibleName: '张伟', responsibleUserId: '1002', status: 'DONE', taskContent: '输出页面高保真设计与交互说明。', taskTitle: '设计 UI' },
      { id: 8103, planEndTime: '2026-04-24T23:59:00', planStartTime: '2026-04-18T00:00:00', progressRate: 20, projectNodeId: 8004, responsibleName: '张伟', responsibleUserId: '1002', status: 'IN_PROGRESS', taskContent: '完成前端页面与核心交互开发。', taskTitle: '开发代码' },
      { id: 8104, planEndTime: '2026-04-26T23:59:00', planStartTime: '2026-04-25T00:00:00', progressRate: 0, projectNodeId: 8004, responsibleName: '刘明', responsibleUserId: '1003', status: 'NOT_STARTED', taskContent: '完成联调和回归测试。', taskTitle: '测试' },
      { id: 8105, planEndTime: '2026-04-30T23:59:00', planStartTime: '2026-04-29T00:00:00', progressRate: 0, projectNodeId: 8002, responsibleName: '王秀娟', responsibleUserId: '1001', status: 'NOT_STARTED', taskContent: '完成验收材料归档与交付确认。', taskTitle: '验收确认' },
    ],
  },
  7002: {
    project: fallbackProjects[1]!,
    statistics: {
      budgetCount: 1,
      completedTaskCount: 0,
      inProgressTaskCount: 0,
      memberCount: 2,
      nodeCount: 2,
      taskCount: 2,
      totalActualAmount: 0,
      totalPlanAmount: 180000,
    },
    members: [
      { dutyContent: '项目统筹', id: 11, isManager: true, roleCode: 'PROJECT_MANAGER', roleName: '项目经理', userId: '1002', userName: '张伟' },
      { dutyContent: '数据模型建设', id: 12, roleCode: 'PROJECT_MEMBER', roleName: '项目成员', userId: '1005', userName: '孙浩' },
    ],
    budgets: [
      { actualAmount: 0, feeDesc: '数据开发与报表配置', feeItem: '建设费用', feeType: '研发', id: 11, operatorName: '陈丽', planAmount: 180000 },
    ],
    nodes: [
      { id: 8201, level: 0, nodeName: '数据盘点', planEndTime: '2026-04-25T23:59:00', planStartTime: '2026-04-20T00:00:00', progressRate: 0, sort: 1, status: 'NOT_STARTED' },
      { id: 8202, level: 0, nodeName: '模型建设', planEndTime: '2026-05-10T23:59:00', planStartTime: '2026-04-26T00:00:00', progressRate: 0, sort: 2, status: 'NOT_STARTED' },
    ],
    tasks: [
      { id: 8301, planEndTime: '2026-04-25T23:59:00', planStartTime: '2026-04-20T00:00:00', progressRate: 0, projectNodeId: 8201, responsibleName: '张伟', responsibleUserId: '1002', status: 'NOT_STARTED', taskContent: '梳理业务库、字段口径与负责人。', taskTitle: '数据源盘点' },
      { id: 8302, planEndTime: '2026-05-10T23:59:00', planStartTime: '2026-04-26T00:00:00', progressRate: 0, projectNodeId: 8202, responsibleName: '孙浩', responsibleUserId: '1005', status: 'NOT_STARTED', taskContent: '完成主题域、指标层和明细层建设。', taskTitle: '指标模型建设' },
    ],
  },
};

const fallbackPlansByProjectId: Record<number, ProjectPlan[]> = {
  7001: [
    { id: 8401, managerId: '1001', managerName: '王秀娟', planContent: '完成功能模块开发及接口联调', planEndDate: '2026-05-05', planPeriod: '2026 第18周（4.29 - 5.5）', planStartDate: '2026-04-29', planType: 'WEEK', status: 'IN_PROGRESS' },
    { id: 8402, managerId: '1001', managerName: '王秀娟', planContent: '推进开发代码与单元测试', planEndDate: '2026-04-30', planStartDate: '2026-04-30', planType: 'DAY', status: 'IN_PROGRESS' },
  ],
};

const fallbackPlanItemsByPlanId: Record<number, ProjectPlanItem[]> = {
  8401: [
    { assigneeId: '1001', assigneeName: '王秀娟', id: 8501, planContent: '完成功能模块A开发', planRequirement: '模块A需求评审、开发、单元测试', projectId: 7001, projectPlanId: 8401, status: 'IN_PROGRESS' },
    { assigneeId: '1002', assigneeName: '张伟', id: 8502, planContent: '接口联调与问题修复', planRequirement: '接口联调、问题排查与修复', projectId: 7001, projectPlanId: 8401, status: 'NOT_STARTED' },
  ],
  8402: [
    { assigneeId: '1001', assigneeName: '王秀娟', id: 8503, planContent: '完成功能模块A的接口开发', planDate: '2026-04-30', projectId: 7001, projectPlanId: 8402, status: 'IN_PROGRESS', weekDay: '周四' },
    { assigneeId: '1002', assigneeName: '张伟', id: 8504, planContent: '修复模块B的已知问题', planDate: '2026-04-30', projectId: 7001, projectPlanId: 8402, status: 'NOT_STARTED', weekDay: '周四' },
  ],
};

const fallbackReportsByProjectId: Record<number, ProjectReport[]> = {
  7001: [
    { finishContent: '完成项目准备和设计界面确认。', id: 8601, projectTaskId: 8102, reportContent: '高保真设计已确认，进入开发阶段。', reportDate: '2026-04-17', reportType: 'DAY', userId: '1002', userName: '张伟' },
  ],
};

const fallbackTaskDependenciesByProjectId: Record<number, TaskDependency[]> = {
  7001: [
    { dependencyType: 'FS', dependencyTypeDesc: '完成-开始', id: 8701, lagDays: 0, predecessorTaskId: 8102, predecessorTaskTitle: '设计 UI', successorTaskId: 8103, successorTaskTitle: '开发代码' },
    { dependencyType: 'FS', dependencyTypeDesc: '完成-开始', id: 8702, lagDays: 0, predecessorTaskId: 8103, predecessorTaskTitle: '开发代码', successorTaskId: 8104, successorTaskTitle: '测试' },
  ],
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatAmount(value?: number | null) {
  if (value === null || value === undefined) {
    return '--';
  }

  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function differenceInDays(start: Date, end: Date) {
  const milliseconds = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(milliseconds / (1000 * 60 * 60 * 24)));
}

function normalizeProgress(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function buildGanttRows(detail: ProjectDetail | null) {
  if (!detail) {
    return [] as GanttRow[];
  }

  const nodeRows = detail.nodes.flatMap((node) => {
    const start = parseDateValue(node.planStartTime) ?? parseDateValue(node.actualStartTime);
    const end = parseDateValue(node.planEndTime) ?? parseDateValue(node.actualEndTime);
    if (!start || !end) {
      return [];
    }

    return [{
      id: `node-${node.id}`,
      kind: 'node' as const,
      owner: null,
      progress: normalizeProgress(node.progressRate),
      start,
      end: end < start ? start : end,
      status: node.status ?? 'NOT_STARTED',
      title: node.nodeName,
    }];
  });

  const taskRows = detail.tasks.flatMap((task) => {
    const start = parseDateValue(task.planStartTime) ?? parseDateValue(task.actualStartTime);
    const end = parseDateValue(task.planEndTime) ?? parseDateValue(task.actualEndTime);
    if (!start || !end) {
      return [];
    }

    return [{
      id: `task-${task.id}`,
      kind: 'task' as const,
      owner: task.responsibleName,
      progress: normalizeProgress(task.progressRate),
      start,
      end: end < start ? start : end,
      status: task.status ?? 'NOT_STARTED',
      title: task.taskTitle,
    }];
  });

  return [...nodeRows, ...taskRows]
    .sort((left, right) => left.start.getTime() - right.start.getTime())
    .slice(0, 14);
}

function buildTimelineRange(project: ProjectDetail['project'] | null, rows: GanttRow[]) {
  const dates = rows.flatMap((row) => [row.start, row.end]);
  const projectStart = parseDateValue(project?.planStartTime);
  const projectEnd = parseDateValue(project?.planEndTime);
  if (projectStart) {
    dates.push(projectStart);
  }
  if (projectEnd) {
    dates.push(projectEnd);
  }

  if (dates.length === 0) {
    return null;
  }

  const start = new Date(Math.min(...dates.map((item) => item.getTime())));
  let end = new Date(Math.max(...dates.map((item) => item.getTime())));
  if (end.getTime() === start.getTime()) {
    end = addDays(end, 7);
  }

  return { start, end };
}

function buildTimelineTicks(start: Date, end: Date) {
  const days = differenceInDays(start, end);
  const step = Math.max(1, Math.floor(days / 5));
  const ticks = [] as Date[];

  for (let offset = 0; offset <= days; offset += step) {
    ticks.push(addDays(start, offset));
  }

  const lastTick = ticks[ticks.length - 1];
  if (!lastTick || lastTick.getTime() !== end.getTime()) {
    ticks.push(end);
  }

  return ticks;
}

function formatAxisLabel(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
  }).format(value);
}

function buildGanttBarStyle(row: GanttRow, start: Date, end: Date) {
  const total = end.getTime() - start.getTime();
  const safeTotal = total <= 0 ? 1 : total;
  const rowStart = row.start.getTime();
  const rowEnd = row.end.getTime();
  const left = ((rowStart - start.getTime()) / safeTotal) * 100;
  const width = Math.max(3, ((rowEnd - rowStart) / safeTotal) * 100);
  const backgroundColor =
    row.kind === 'node'
      ? 'color-mix(in srgb, var(--portal-color-brand-500) 18%, white)'
      : row.status === 'COMPLETED'
        ? 'color-mix(in srgb, #16a34a 18%, white)'
        : 'color-mix(in srgb, var(--portal-color-brand-600) 24%, white)';
  const borderColor =
    row.kind === 'node'
      ? 'color-mix(in srgb, var(--portal-color-brand-500) 34%, white)'
      : row.status === 'COMPLETED'
        ? 'color-mix(in srgb, #16a34a 34%, white)'
        : 'color-mix(in srgb, var(--portal-color-brand-600) 38%, white)';

  return {
    backgroundColor,
    border: `1px solid ${borderColor}`,
    left: `${Math.max(0, left)}%`,
    width: `${Math.min(100, width)}%`,
  };
}

function normalizeErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Request failed.');
  }

  return 'Request failed.';
}

async function requestData<T>(path: string, query?: Record<string, string | number>) {
  const response = await projectApiClient.request<CommonResult<T>>(path, {
    method: 'GET',
    query,
  });
  return response.data;
}

async function mutateData<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: object | FormData) {
  const response = await projectApiClient.request<CommonResult<T>>(path, {
    body,
    method,
  });
  return response.data;
}

async function requestPlanItemsByPlanId(projectId: number, plans: Array<{ id: number }>) {
  if (!plans.length) {
    return {} as Record<number, ProjectPlanItem[]>;
  }

  const entries = await Promise.all(
    plans.map(async (plan) => {
      const items = await requestData<ProjectPlanItem[]>(
        `/api/project/projects/${projectId}/plans/${plan.id}/items`,
      );
      return [plan.id, items] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<number, ProjectPlanItem[]>;
}

export function ProjectHomePage({ onExitSystem }: ProjectHomePageProps = {}) {
  const { session } = usePortalAuth();
  const permission = useMemo(
    () => resolveProjectPermissionContext(session),
    [session],
  );
  const currentUserId = permission.employeeUserId;
  const currentUserName =
    session?.employeeName?.trim() ||
    session?.displayName?.trim() ||
    session?.username?.trim() ||
    '管理员';
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('project-management');
  const needsWorkspaceResourceData =
    workspaceMode === 'project-gantt-workspace' ||
    workspaceMode === 'task-submission' ||
    workspaceMode === 'plan-log' ||
    workspaceMode === 'project-analysis-dashboard';
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [plans, setPlans] = useState<ProjectPlan[]>([]);
  const [planItemsByPlanId, setPlanItemsByPlanId] = useState<Record<number, ProjectPlanItem[]>>({});
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [taskDependencies, setTaskDependencies] = useState<TaskDependency[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const needsTaskDependencyData = workspaceMode === 'project-gantt-workspace';
  const needsPlanItemData = workspaceMode === 'plan-log';
  const visibleWorkspaceItems = useMemo(
    () => filterProjectWorkspaceItemsByPermission(projectWorkspaceItems, permission),
    [permission],
  );
  const visibleWorkspaceGroups = useMemo(
    () =>
      filterProjectWorkspaceGroupsByPermission(
        projectWorkspaceGroups,
        permission.visibleWorkspaceIds,
      ),
    [permission.visibleWorkspaceIds],
  );

  useEffect(() => {
    const nextWorkspace = resolveProjectDefaultWorkspace(permission, workspaceMode);
    if (nextWorkspace !== workspaceMode) {
      startTransition(() => {
        setWorkspaceMode(nextWorkspace);
      });
    }
  }, [permission, workspaceMode]);

  useEffect(() => {
    let cancelled = false;

    void requestData<PagedResult<ProjectType>>('/api/project/types', {
      pageNumber: 1,
      pageSize: 100,
    })
      .then((data) => {
        const items = getPagedItems(data);

        if (!cancelled) {
          startTransition(() => {
            setProjectTypes(items);
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          startTransition(() => {
            setProjectTypes(fallbackProjectTypes);
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      startTransition(() => {
        setSearchKeyword(keyword.trim());
      });
    }, 240);

    return () => {
      window.clearTimeout(timer);
    };
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);

    void requestData<PagedResult<ProjectItem>>('/api/project/projects', {
      keyword: searchKeyword,
      pageNumber: 1,
      pageSize: 12,
    })
      .then(async (data) => {
        const items = getPagedItems(data);

        if (
          permission.isSuperAdmin ||
          permission.canViewAllProjects ||
          !permission.employeeUserId
        ) {
          return items;
        }

        const directItems = items.filter((item) =>
          canAccessProjectRecord(item, permission),
        );
        const remainingItems = items.filter(
          (item) => !directItems.some((directItem) => directItem.id === item.id),
        );

        if (!remainingItems.length) {
          return directItems;
        }

        const scopedItems = await Promise.all(
          remainingItems.map(async (item) => {
            try {
              const detail = await requestData<ProjectDetail>(
                `/api/project/projects/${item.id}/detail`,
              );
              return canAccessProjectByMembers(detail.members, permission)
                ? item
                : null;
            } catch {
              return null;
            }
          }),
        );

        return [
          ...directItems,
          ...scopedItems.filter((item): item is ProjectItem => item !== null),
        ];
      })
      .then((items) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setProjects(items);
          setSelectedProjectId((current) => {
            if (items.length === 0) {
              return null;
            }
            return items.some((item) => item.id === current)
              ? current
              : items[0]?.id ?? null;
          });
        });
      })
      .catch(() => {
        if (!cancelled) {
          const fallbackItems = fallbackProjects.filter((item) => {
            const keyword = searchKeyword.trim().toLowerCase();
            if (!keyword) {
              return true;
            }
            return `${item.projectCode} ${item.projectName} ${item.projectDesc ?? ''} ${item.managerName ?? ''}`
              .toLowerCase()
              .includes(keyword);
          });

          startTransition(() => {
            setProjects(fallbackItems);
            setSelectedProjectId((current) =>
              fallbackItems.some((item) => item.id === current)
                ? current
                : fallbackItems[0]?.id ?? null,
            );
            setProjectDetail((current) =>
              current && fallbackItems.some((item) => item.id === current.project.id)
                ? current
                : fallbackProjectDetailsById[fallbackItems[0]?.id ?? 0] ?? null,
            );
            setListError(null);
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setListLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [permission, reloadNonce, searchKeyword]);

  useEffect(() => {
    if (selectedProjectId === null) {
      setProjectDetail(null);
      setDetailError(null);
      setPlans([]);
      setPlanItemsByPlanId({});
      setReports([]);
      setAttachments([]);
      setTaskDependencies([]);
      setWorkspaceError(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    void requestData<ProjectDetail>(`/api/project/projects/${selectedProjectId}/detail`)
      .then((data) => {
        if (!cancelled) {
          startTransition(() => {
            setProjectDetail(data);
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const fallbackDetail = fallbackProjectDetailsById[selectedProjectId] ?? null;
          startTransition(() => {
            setProjectDetail(fallbackDetail);
            setDetailError(fallbackDetail ? null : normalizeErrorMessage(error));
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadNonce, selectedProjectId]);

  useEffect(() => {
    if (!needsWorkspaceResourceData || selectedProjectId === null) {
      return;
    }

    let cancelled = false;
    setWorkspaceLoading(true);
    setWorkspaceError(null);

    void Promise.all([
      requestData<ProjectPlan[]>(`/api/project/projects/${selectedProjectId}/plans`),
      requestData<ProjectReport[]>(`/api/project/projects/${selectedProjectId}/reports`),
      fetchProjectAttachments(selectedProjectId),
      needsTaskDependencyData
        ? requestData<TaskDependency[]>(`/api/project/projects/${selectedProjectId}/dependencies`)
        : Promise.resolve([] as TaskDependency[]),
    ])
      .then(async ([nextPlans, nextReports, nextAttachments, nextTaskDependencies]) => {
        const nextPlanItemsByPlanId = needsPlanItemData
          ? await requestPlanItemsByPlanId(selectedProjectId, nextPlans)
          : {};

        return {
          nextAttachments,
          nextPlanItemsByPlanId,
          nextPlans,
          nextReports,
          nextTaskDependencies,
        };
      })
      .then(({
        nextAttachments,
        nextPlanItemsByPlanId,
        nextPlans,
        nextReports,
        nextTaskDependencies,
      }) => {
        if (!cancelled) {
          startTransition(() => {
            setPlans(nextPlans);
            setPlanItemsByPlanId(nextPlanItemsByPlanId);
            setReports(nextReports);
            setAttachments(nextAttachments);
            setTaskDependencies(nextTaskDependencies);
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fallbackPlans = fallbackPlansByProjectId[selectedProjectId] ?? [];
          const fallbackReports = fallbackReportsByProjectId[selectedProjectId] ?? [];
          const fallbackTaskDependencies = needsTaskDependencyData
            ? fallbackTaskDependenciesByProjectId[selectedProjectId] ?? []
            : [];
          const fallbackPlanItems = needsPlanItemData
            ? Object.fromEntries(
                fallbackPlans.map((plan) => [plan.id, fallbackPlanItemsByPlanId[plan.id] ?? []]),
              ) as Record<number, ProjectPlanItem[]>
            : {};

          startTransition(() => {
            setPlans(fallbackPlans);
            setPlanItemsByPlanId(fallbackPlanItems);
            setReports(fallbackReports);
            setAttachments([]);
            setTaskDependencies(fallbackTaskDependencies);
            setWorkspaceError(null);
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setWorkspaceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [needsPlanItemData, needsTaskDependencyData, needsWorkspaceResourceData, reloadNonce, selectedProjectId]);

  const scopedTasks = useMemo(
    () => filterTasksByPermission(projectDetail?.tasks ?? [], permission),
    [permission, projectDetail?.tasks],
  );
  const scopedPlans = useMemo(
    () => filterPlansByPermission(plans, permission),
    [permission, plans],
  );
  const scopedReports = useMemo(
    () => filterReportsByPermission(reports, permission),
    [permission, reports],
  );
  const canManageCurrentProjectSchedule = useMemo(
    () => canManageProjectSchedule(projectDetail?.members ?? [], permission),
    [permission, projectDetail?.members],
  );
  const canCreateProjectEntry = useMemo(
    () => canCreateProject(permission),
    [permission],
  );

  async function handleCreateProject(payload: ProjectSavePayload) {
    const created = await mutateData<ProjectItem>('/api/project/projects', 'POST', payload);
    startTransition(() => {
      setSelectedProjectId(created.id);
      setReloadNonce((current) => current + 1);
    });
    return created.id;
  }

  async function handleUpdateProject(projectId: number, payload: ProjectSavePayload) {
    await mutateData<ProjectItem>(`/api/project/projects/${projectId}`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleDeleteProject(projectId: number) {
    await mutateData<boolean>(`/api/project/projects/${projectId}`, 'DELETE');
    startTransition(() => {
      setSelectedProjectId((current) => (current === projectId ? null : current));
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleInitProject(projectId: number) {
    await mutateData(`/api/project/projects/${projectId}/init-by-type`, 'POST');
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleCreateMember(
    projectId: number,
    payload: {
      dutyContent: string | null;
      isManager: boolean;
      remark: string | null;
      roleCode: string | null;
      roleName: string | null;
      userId: string;
      userName: string;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/members`, 'POST', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdateMember(
    projectId: number,
    memberId: number,
    payload: {
      dutyContent: string | null;
      isManager: boolean;
      remark: string | null;
      roleCode: string | null;
      roleName: string | null;
      userId: string;
      userName: string;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/members/${memberId}`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleCreateBudget(
    projectId: number,
    payload: {
      actualAmount: number | null;
      feeDesc: string | null;
      feeItem: string;
      feeType: string | null;
      operatorId: string | null;
      operatorName: string | null;
      overRate: number | null;
      planAmount: number | null;
      remark: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/budgets`, 'POST', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdateBudget(
    projectId: number,
    budgetId: number,
    payload: {
      actualAmount: number | null;
      feeDesc: string | null;
      feeItem: string;
      feeType: string | null;
      operatorId: string | null;
      operatorName: string | null;
      overRate: number | null;
      planAmount: number | null;
      remark: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/budgets/${budgetId}`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleDeleteBudget(projectId: number, budgetId: number) {
    await mutateData(`/api/project/projects/${projectId}/budgets/${budgetId}`, 'DELETE');
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleDeleteMember(projectId: number, memberId: number) {
    await mutateData(`/api/project/projects/${projectId}/members/${memberId}`, 'DELETE');
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleDeleteAttachment(projectId: number, attachmentId: number) {
    await deleteProjectAttachment(projectId, attachmentId);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUploadAttachment(
    projectId: number,
    payload: UploadProjectAttachmentInput,
  ) {
    await uploadProjectAttachment(projectId, payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleCreateDependency(
    projectId: number,
    payload: {
      predecessorTaskId: number;
      successorTaskId: number;
      dependencyType: 'FS' | 'FF' | 'SS' | 'SF';
      lagDays?: number;
      remark?: string | null;
    },
  ) {
    const created = await mutateData<{ id: number }>(
      `/api/project/projects/${projectId}/dependencies`,
      'POST',
      payload,
    );
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
    return created;
  }

  async function handleDeleteDependency(projectId: number, dependencyId: number) {
    await mutateData(
      `/api/project/projects/${projectId}/dependencies/${dependencyId}`,
      'DELETE',
    );
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdateNodeStatus(
    projectId: number,
    nodeId: number,
    payload: {
      actualEndTime: string | null;
      actualStartTime: string | null;
      planEndTime: string | null;
      planStartTime: string | null;
      progressRate: number | null;
      remark: string | null;
      status: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/nodes/${nodeId}/status`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdateNodeBasic(
    projectId: number,
    nodeId: number,
    payload: {
      nodeName: string | null;
      remark: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/nodes/${nodeId}`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleCreateNode(
    projectId: number,
    payload: {
      nodeCode: string | null;
      nodeName: string;
      parentNodeId: number | null;
      remark: string | null;
    },
  ) {
    const created = await mutateData<ProjectNode>(
      `/api/project/projects/${projectId}/nodes`,
      'POST',
      {
        needAudit: false,
        needCheck: false,
        nodeCode: payload.nodeCode,
        nodeName: payload.nodeName,
        parentNodeId: payload.parentNodeId,
        remark: payload.remark,
        sort: null,
      },
    );
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
    return created;
  }

  async function handleDeleteNode(projectId: number, nodeId: number) {
    await mutateData(`/api/project/projects/${projectId}/nodes/${nodeId}`, 'DELETE');
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdateTaskStatus(
    projectId: number,
    taskId: number,
    payload: {
      actualEndTime: string | null;
      actualStartTime: string | null;
      auditStatus: string | null;
      checkStatus: string | null;
      finishDesc: string | null;
      planEndTime: string | null;
      planStartTime: string | null;
      progressRate: number | null;
      remark: string | null;
      status: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/tasks/${taskId}/status`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdateTaskBasic(
    projectId: number,
    taskId: number,
    payload: {
      remark: string | null;
      taskContent: string | null;
      taskTitle: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/tasks/${taskId}`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleCreateTask(
    projectId: number,
    payload: {
      projectNodeId: number;
      remark: string | null;
      taskCode: string | null;
      taskContent: string | null;
      taskTitle: string;
    },
  ) {
    const created = await mutateData<ProjectTask>(
      `/api/project/projects/${projectId}/tasks`,
      'POST',
      {
        needAudit: false,
        needCheck: false,
        needFile: false,
        needSettle: false,
        projectNodeId: payload.projectNodeId,
        remark: payload.remark,
        taskCode: payload.taskCode,
        taskContent: payload.taskContent,
        taskTitle: payload.taskTitle,
      },
    );
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
    return created;
  }

  async function handleDeleteTask(projectId: number, taskId: number) {
    await mutateData(`/api/project/projects/${projectId}/tasks/${taskId}`, 'DELETE');
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleCreatePlan(
    projectId: number,
    payload: {
      managerId: string | null;
      managerName: string | null;
      planContent: string | null;
      planEndDate: string | null;
      planMonth: string | null;
      planPeriod: string | null;
      planStartDate: string | null;
      planType: string;
      planWeek: string | null;
      status: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/plans`, 'POST', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdatePlan(
    projectId: number,
    planId: number,
    payload: {
      managerId: string | null;
      managerName: string | null;
      planContent: string | null;
      planEndDate: string | null;
      planMonth: string | null;
      planPeriod: string | null;
      planStartDate: string | null;
      planType: string;
      planWeek: string | null;
      status: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/plans/${planId}`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleCreatePlanItem(
    projectId: number,
    planId: number,
    payload: {
      assigneeId: string | null;
      assigneeName: string | null;
      helpDept: string | null;
      planContent: string;
      planDate: string | null;
      planRequirement: string | null;
      projectNodeId: number | null;
      projectTaskId: number | null;
      status: string | null;
      weekDay: string | null;
    },
  ) {
    await mutateData(
      `/api/project/projects/${projectId}/plans/${planId}/items`,
      'POST',
      payload,
    );
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdatePlanItem(
    projectId: number,
    planId: number,
    itemId: number,
    payload: {
      assigneeId: string | null;
      assigneeName: string | null;
      helpDept: string | null;
      planContent: string;
      planDate: string | null;
      planRequirement: string | null;
      projectNodeId: number | null;
      projectTaskId: number | null;
      status: string | null;
      weekDay: string | null;
    },
  ) {
    await mutateData(
      `/api/project/projects/${projectId}/plans/${planId}/items/${itemId}`,
      'PUT',
      payload,
    );
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleCreateReport(
    projectId: number,
    payload: {
      delayFlag: boolean | null;
      delayReason: string | null;
      finishContent: string | null;
      projectNodeId?: number | null;
      projectTaskId?: number | null;
      coordinationContent?: string | null;
      remark: string | null;
      reportContent: string | null;
      reportDate: string | null;
      reportMonth: string | null;
      reportType: string;
      reportWeek: string | null;
      userId: string;
      userName: string;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/reports`, 'POST', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdateReport(
    projectId: number,
    reportId: number,
    payload: {
      delayFlag: boolean | null;
      delayReason: string | null;
      finishContent: string | null;
      projectNodeId?: number | null;
      projectTaskId?: number | null;
      coordinationContent?: string | null;
      remark: string | null;
      reportContent: string | null;
      reportDate: string | null;
      reportMonth: string | null;
      reportType: string;
      reportWeek: string | null;
      userId: string;
      userName: string;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/reports/${reportId}`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleUpdateTaskAssignment(
    projectId: number,
    taskId: number,
    payload: {
      participantMembers: Array<{
        userId: string;
        userName: string;
      }>;
      responsibleName: string | null;
      responsibleUserId: string | null;
    },
  ) {
    await mutateData(`/api/project/projects/${projectId}/tasks/${taskId}/assignment`, 'PUT', payload);
    startTransition(() => {
      setSelectedProjectId(projectId);
      setReloadNonce((current) => current + 1);
    });
  }

  async function handleLoadTaskDetail(projectId: number, taskId: number) {
    return requestData<ProjectTaskDetail>(`/api/project/projects/${projectId}/tasks/${taskId}`);
  }

  const selectedProject = projectDetail?.project ?? null;
  const statistics = projectDetail?.statistics ?? null;
  const memberOptions = projectDetail?.members ?? [];
  const nodeOptions = projectDetail?.nodes ?? [];
  const taskOptions = projectDetail?.tasks ?? [];
  const ganttRows = buildGanttRows(projectDetail);
  const ganttRange = buildTimelineRange(selectedProject, ganttRows);
  const ganttTicks = ganttRange ? buildTimelineTicks(ganttRange.start, ganttRange.end) : [];

  const overviewContent = (
    <div className="space-y-4">
      <ActionConsole
        memberOptions={memberOptions}
        nodeOptions={nodeOptions}
        onProjectCreated={(projectId) => {
          startTransition(() => {
            setSelectedProjectId(projectId);
            setReloadNonce((current) => current + 1);
          });
        }}
        onRefresh={() => {
          startTransition(() => {
            setReloadNonce((current) => current + 1);
          });
        }}
        projectTypes={projectTypes}
        selectedProjectId={selectedProjectId}
        taskOptions={taskOptions}
      />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-[32px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="theme-text-soft text-xs font-semibold">
                项目清单
              </div>
              <div className="theme-text-strong mt-2 text-[22px] font-bold">
                当前项目
              </div>
            </div>
            <Badge tone="brand">{projects.length}</Badge>
          </div>

          <div className="mt-5">
            <input
              className="theme-input h-12 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                startTransition(() => {
                  setKeyword(event.target.value);
                });
              }}
              placeholder="搜索项目编码或项目名称"
              value={keyword}
            />
          </div>

          <div className="mt-5 space-y-3">
            {listLoading ? (
              <div className="theme-surface-subtle rounded-[22px] p-4 text-sm">
                正在加载项目列表...
              </div>
            ) : listError ? (
              <div className="rounded-[22px] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-800">
                {listError}
              </div>
            ) : projects.length ? (
              projects.map((project) => {
                const isActive = project.id === selectedProjectId;
                return (
                  <button
                    key={project.id}
                    className={cx('block w-full rounded-[22px] border p-4 text-left transition-transform hover:-translate-y-0.5')}
                    onClick={() => {
                      startTransition(() => {
                        setSelectedProjectId(project.id);
                      });
                    }}
                    style={{
                      borderColor: isActive
                        ? 'color-mix(in srgb, var(--portal-color-brand-500) 30%, white)'
                        : 'color-mix(in srgb, var(--portal-color-border-soft) 74%, white)',
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--portal-color-brand-500) 8%, white)'
                        : 'white',
                    }}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="theme-text-strong text-sm font-bold">{project.projectName}</div>
                      <Badge tone={isActive ? 'brand' : getProjectStatusTone(project.status)}>
                        {getProjectStatusLabel(project.status ?? 'DRAFT')}
                      </Badge>
                    </div>
                    <div className="theme-text-muted mt-2 text-xs font-semibold">
                      {project.projectCode}
                    </div>
                    <div className="theme-text-muted mt-3 text-sm leading-6">
                      项目经理 {project.managerName ?? '--'}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="theme-surface-subtle rounded-[22px] p-4 text-sm">
                当前没有可展示的项目。
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[32px] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="theme-text-soft text-xs font-semibold">
                  项目摘要
                </div>
                <div className="theme-text-strong mt-2 text-3xl font-bold">
                  {selectedProject?.projectName ?? '请选择一个项目'}
                </div>
                <div className="theme-text-muted mt-3 max-w-3xl text-sm leading-7">
                  {selectedProject?.projectDesc ?? '在这里查看当前项目的关键信息、统计摘要与执行概览。'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{selectedProject?.projectCode ?? '未选择项目编码'}</Badge>
                <Badge tone={getProjectStatusTone(selectedProject?.status)}>
                  {getProjectStatusLabel(selectedProject?.status ?? 'WAITING')}
                </Badge>
              </div>
            </div>

            {detailLoading ? (
              <div className="theme-surface-subtle mt-5 rounded-[22px] p-4 text-sm">
                正在加载项目详情...
              </div>
            ) : detailError ? (
              <div className="mt-5 rounded-[22px] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-800">
                {detailError}
              </div>
            ) : selectedProject && statistics ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-semibold">团队</div>
                  <div className="theme-text-strong mt-3 text-3xl font-bold">{statistics.memberCount}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-semibold">节点</div>
                  <div className="theme-text-strong mt-3 text-3xl font-bold">{statistics.nodeCount}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-semibold">任务</div>
                  <div className="theme-text-strong mt-3 text-3xl font-bold">{statistics.taskCount}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-semibold">预算</div>
                  <div className="theme-text-strong mt-3 text-3xl font-bold">
                    {formatAmount(statistics.totalPlanAmount)}
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-[32px] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-soft text-xs font-semibold">团队与预算</div>
                <Badge tone="neutral">{projectDetail?.members.length ?? 0}</Badge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  {projectDetail?.members.length ? (
                    projectDetail.members.slice(0, 6).map((member) => (
                      <div key={member.id} className="theme-surface-subtle rounded-[20px] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="theme-text-strong text-sm font-semibold">{member.userName}</div>
                          {member.isManager ? <Badge tone="brand">负责人</Badge> : null}
                        </div>
                        <div className="theme-text-muted mt-2 text-sm">{member.roleName ?? '--'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="theme-surface-subtle rounded-[20px] p-4 text-sm">暂无项目成员</div>
                  )}
                </div>
                <div className="space-y-3">
                  {projectDetail?.budgets.length ? (
                    projectDetail.budgets.slice(0, 6).map((budget, index) => (
                      <div key={`${budget.feeItem}-${index}`} className="theme-surface-subtle rounded-[20px] p-4">
                        <div className="theme-text-strong text-sm font-semibold">{budget.feeItem}</div>
                        <div className="theme-text-muted mt-2 text-sm">
                          计划 {formatAmount(budget.planAmount)} / 实际 {formatAmount(budget.actualAmount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="theme-surface-subtle rounded-[20px] p-4 text-sm">暂无预算记录</div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="rounded-[32px] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-soft text-xs font-semibold">项目上下文</div>
                <Badge tone="brand">当前项目</Badge>
              </div>
              <div className="mt-5 space-y-4">
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-semibold">业务单元</div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">{selectedProject?.businessUnit ?? '--'}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-semibold">考勤地址</div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">{selectedProject?.attendanceAddress ?? '--'}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-semibold">来源说明</div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">{selectedProject?.sourceContent ?? '--'}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[32px] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-soft text-xs font-semibold">里程碑</div>
                <Badge tone="neutral">{projectDetail?.nodes.length ?? 0}</Badge>
              </div>
              <div className="mt-5 space-y-3">
                {projectDetail?.nodes.length ? (
                  projectDetail.nodes.slice(0, 8).map((node) => (
                    <div key={node.id} className="theme-surface-subtle rounded-[22px] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="theme-text-strong text-sm font-semibold">{node.nodeName}</div>
                        <Badge tone={getProjectStatusTone(node.status)}>
                          {getProjectStatusLabel(node.status ?? 'NOT_STARTED')}
                        </Badge>
                      </div>
                      <div className="theme-text-muted mt-2 text-sm">进度 {formatAmount(node.progressRate)}%</div>
                    </div>
                  ))
                ) : (
                  <div className="theme-surface-subtle rounded-[22px] p-4 text-sm">暂无节点数据</div>
                )}
              </div>
            </Card>

            <Card className="rounded-[32px] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-soft text-xs font-semibold">任务执行</div>
                <Badge tone="neutral">{projectDetail?.tasks.length ?? 0}</Badge>
              </div>
              <div className="mt-5 space-y-3">
                {projectDetail?.tasks.length ? (
                  projectDetail.tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="theme-surface-subtle rounded-[22px] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="theme-text-strong text-sm font-semibold">{task.taskTitle}</div>
                        <Badge tone={getProjectStatusTone(task.status)}>
                          {getProjectStatusLabel(task.status ?? 'NOT_STARTED')}
                        </Badge>
                      </div>
                      <div className="theme-text-muted mt-2 text-sm">
                        负责人 {task.responsibleName ?? '--'} / 进度 {formatAmount(task.progressRate)}%
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="theme-surface-subtle rounded-[22px] p-4 text-sm">暂无任务数据</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="rounded-[32px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="theme-text-soft text-xs font-semibold">只读甘特</div>
              <Badge tone="neutral">{ganttRows.length}</Badge>
            </div>

            {!ganttRange || ganttRows.length === 0 ? (
              <div className="theme-surface-subtle mt-5 rounded-[22px] p-4 text-sm">暂无可展示的节点或任务时间。</div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="theme-text-soft text-xs font-semibold">时间轴</div>
                  <div
                    className="grid gap-2 text-[11px] font-semibold"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(ganttTicks.length, 2)}, minmax(0, 1fr))`,
                    }}
                  >
                    {ganttTicks.map((tick) => (
                      <div key={tick.toISOString()} className="theme-text-soft">
                        {formatAxisLabel(tick)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {ganttRows.map((row) => (
                    <div key={row.id} className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
                      <div className="theme-surface-subtle rounded-[22px] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="theme-text-strong text-sm font-semibold">{row.title}</div>
                          <Badge tone={row.kind === 'node' ? 'brand' : 'neutral'}>
                            {getRowKindLabel(row.kind)}
                          </Badge>
                        </div>
                        <div className="theme-text-muted mt-2 text-sm">{row.owner ?? '未分配'} / {row.status}</div>
                      </div>

                      <div className="theme-surface-subtle relative overflow-hidden rounded-[22px] px-4 py-5">
                        <div
                          className="absolute inset-x-4 top-1/2 h-[2px] -translate-y-1/2"
                          style={{
                            background:
                              'repeating-linear-gradient(90deg, color-mix(in srgb, var(--portal-color-border-soft) 82%, white) 0 1px, transparent 1px calc(100% / 8))',
                          }}
                        />
                        <div
                          className="absolute top-1/2 h-10 -translate-y-1/2 rounded-2xl px-4 py-2"
                          style={buildGanttBarStyle(row, ganttRange.start, ganttRange.end)}
                        >
                          <div className="theme-text-strong text-sm font-semibold">{row.progress}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="rounded-[32px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="theme-text-soft text-xs font-semibold">
                计划、汇报与附件
              </div>
              <Badge tone="neutral">协同区</Badge>
            </div>

            {workspaceLoading ? (
              <div className="theme-surface-subtle mt-5 rounded-[22px] p-4 text-sm">
                正在加载计划、汇报和附件...
              </div>
            ) : workspaceError ? (
              <div className="mt-5 rounded-[22px] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-800">
                {workspaceError}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="theme-text-strong text-sm font-bold">附件资料</div>
                {attachments.length ? (
                  attachments.slice(0, 6).map((attachment) => (
                    <div key={attachment.id} className="theme-surface-subtle rounded-[22px] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="theme-text-strong text-sm font-semibold">
                          {attachment.fileName}
                        </div>
                        <Badge tone="neutral">{getFileCategoryLabel(attachment.fileCategory)}</Badge>
                      </div>
                      <div className="theme-text-muted mt-2 text-sm">
                        {attachment.uploaderName ?? '--'} / {formatDateTime(attachment.uploadTime)}
                      </div>
                      <div className="theme-text-muted mt-2 text-sm leading-6">
                        文件大小 {formatAmount(attachment.fileSize)} bytes
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="theme-surface-subtle rounded-[22px] p-4 text-sm">暂无附件资料</div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );

  const analysisDashboardContent = (
    <ProjectAnalysisDashboardPage
      attachments={attachments}
      budgets={projectDetail?.budgets ?? []}
      detailError={detailError}
      detailLoading={detailLoading}
      ganttRange={ganttRange}
      ganttRows={ganttRows}
      ganttTicks={ganttTicks}
      loading={workspaceLoading}
      members={projectDetail?.members ?? []}
      nodes={projectDetail?.nodes ?? []}
      plans={plans}
      reports={reports}
      selectedProject={selectedProject}
      statistics={statistics}
      tasks={projectDetail?.tasks ?? []}
      workspaceError={workspaceError}
    />
  );

  let workspaceContent: ReactNode = analysisDashboardContent;
  if (workspaceMode === 'project-management') {
    workspaceContent = (
      <ProjectManagementPage
        canCreateProject={canCreateProjectEntry}
        canManageProject={(project) => canManageProjectRecord(project, permission)}
        detailLoading={detailLoading}
        keyword={keyword}
        listError={listError}
        listLoading={listLoading}
        onCreate={handleCreateProject}
        onDelete={handleDeleteProject}
        onInitByType={handleInitProject}
        onKeywordChange={(value) => {
          startTransition(() => {
            setKeyword(value);
          });
        }}
        onRefresh={() => {
          startTransition(() => {
            setReloadNonce((current) => current + 1);
          });
        }}
        onSelectProject={(projectId) => {
          startTransition(() => {
            setSelectedProjectId(projectId);
          });
        }}
        onUpdate={handleUpdateProject}
        projectDetail={projectDetail}
        projectTypes={projectTypes}
        projects={projects}
        selectedProjectId={selectedProjectId}
      />
    );
  } else if (workspaceMode === 'milestone-template-management') {
    workspaceContent = <ProjectTypeManagementPage projectTypes={projectTypes} />;
  } else if (workspaceMode === 'project-gantt-workspace') {
    workspaceContent = (
      <ProjectGanttWorkspacePage
        attachments={attachments}
        budgets={projectDetail?.budgets ?? []}
        canManageProjectSchedule={canManageCurrentProjectSchedule}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        members={projectDetail?.members ?? []}
        nodes={projectDetail?.nodes ?? []}
        onCreateBudget={handleCreateBudget}
        onCreateDependency={handleCreateDependency}
        onCreateMember={handleCreateMember}
        onCreateNode={handleCreateNode}
        onDeleteBudget={handleDeleteBudget}
        onDeleteDependency={handleDeleteDependency}
        onDeleteMember={handleDeleteMember}
        onDeleteAttachment={handleDeleteAttachment}
        onUploadAttachment={handleUploadAttachment}
        onCreateTask={handleCreateTask}
        onDeleteNode={handleDeleteNode}
        onDeleteTask={handleDeleteTask}
        onExitSystem={onExitSystem ?? (() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/systems';
          }
        })}
        onOpenProgressConfig={() => {
          setWorkspaceMode('milestone-template-management');
        }}
        onOpenProjectManagement={() => {
          setWorkspaceMode('project-management');
        }}
        onLoadTaskDetail={handleLoadTaskDetail}
        onSaveProjectBase={handleUpdateProject}
        onUpdateNodeBasic={handleUpdateNodeBasic}
        onUpdateNodeStatus={handleUpdateNodeStatus}
        onUpdateTaskAssignment={handleUpdateTaskAssignment}
        onUpdateTaskBasic={handleUpdateTaskBasic}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onUpdateBudget={handleUpdateBudget}
        onUpdateMember={handleUpdateMember}
        projectCount={projects.length}
        projectTypeCount={projectTypes.length}
        projectTypes={projectTypes}
        selectedProjectId={selectedProjectId}
        selectedProject={selectedProject}
        statistics={statistics}
        taskDependencies={taskDependencies}
        tasks={projectDetail?.tasks ?? []}
      />
    );
  } else if (workspaceMode === 'task-submission') {
    workspaceContent = (
      <ProjectTaskSubmissionPage
        detailLoading={detailLoading}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        selectedProject={selectedProject}
        tasks={scopedTasks}
      />
    );
  } else if (workspaceMode === 'plan-log') {
    workspaceContent = (
      <ProjectPlanLogPage
        attachments={attachments}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        loading={workspaceLoading}
        members={projectDetail?.members ?? []}
        nodes={projectDetail?.nodes ?? []}
        onCreatePlan={handleCreatePlan}
        onCreatePlanItem={handleCreatePlanItem}
        onCreateReport={handleCreateReport}
        onDeleteAttachment={handleDeleteAttachment}
        onUploadAttachment={handleUploadAttachment}
        onUpdatePlan={handleUpdatePlan}
        onUpdatePlanItem={handleUpdatePlanItem}
        onUpdateReport={handleUpdateReport}
        planItemsByPlanId={planItemsByPlanId}
        plans={scopedPlans}
        reports={scopedReports}
        selectedProject={selectedProject}
        tasks={scopedTasks}
        workspaceError={workspaceError}
      />
    );
  } else if (workspaceMode === 'delay-application') {
    workspaceContent = (
      <ProjectDelayApplicationPage
        loading={workspaceLoading}
        nodes={projectDetail?.nodes ?? []}
        onCreateReport={handleCreateReport}
        onUpdateReport={handleUpdateReport}
        reports={scopedReports}
        selectedProject={selectedProject}
        tasks={scopedTasks}
        workspaceError={workspaceError}
      />
    );
  } else if (workspaceMode === 'project-analysis-dashboard') {
    workspaceContent = analysisDashboardContent;
  } else if (workspaceMode === 'project-user-permission-management') {
    workspaceContent = (
      <ProjectUserPermissionManagementPage currentUserName={currentUserName} />
    );
  } else if (workspaceMode === 'project-role-permission-management') {
    workspaceContent = (
      <ProjectRolePermissionManagementPage currentUserName={currentUserName} />
    );
  }

  return (
    <ProjectToastProvider>
      <ProjectWorkspaceShell
        currentUserName={currentUserName}
        onExitSystem={onExitSystem ?? (() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/systems';
          }
        })}
        onSelectWorkspace={(workspaceId) => {
          setWorkspaceMode(workspaceId as WorkspaceMode);
        }}
        workspaceContent={workspaceContent}
        workspaceGroups={visibleWorkspaceGroups}
        workspaceItems={visibleWorkspaceItems}
        workspaceMode={workspaceMode}
      />
    </ProjectToastProvider>
  );
}
