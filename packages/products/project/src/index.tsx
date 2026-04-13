import {
  startTransition,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { createApiClient } from '@lserp/http';
import { Badge, Button, Card, cx } from '@lserp/ui';
import { ActionConsole } from './action-console';
import {
  getCheckinResultLabel,
  getFileCategoryLabel,
  getProjectStatusLabel,
  getProjectStatusTone,
  getRowKindLabel,
} from './project-display';
import { ProjectGanttWorkspacePage } from './project-gantt-workspace-page';
import {
  ProjectManagementPage,
  type ProjectManagementProjectDetail,
  type ProjectManagementProjectItem,
  type ProjectManagementProjectType,
  type ProjectSavePayload,
} from './project-management-page';
import { ProjectTypeManagementPage } from './project-type-management-page';
import { ProjectWorkspacePlaceholderPage } from './project-workspace-placeholder-page';
import {
  projectWorkspaceGroups,
  projectWorkspaceItems,
  type WorkspaceMode,
} from './project-workspace-config';
import { ProjectWorkspaceShell } from './project-workspace-shell';
import { ProjectToastProvider } from './project-toast';
import { ProjectDelayApplicationPage } from './workspaces/delay-application/delay-application-page';
import { ProjectPlanLogPage } from './workspaces/plan-log/plan-log-page';
import { ProjectTaskSubmissionPage } from './workspaces/task-submission/task-submission-page';

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

type ProjectCheckIn = {
  id: number;
  address?: string | null;
  checkInTime?: string | null;
  result?: string | null;
  userName: string;
};

type ProjectAttachment = {
  id: number;
  fileCategory?: string | null;
  fileName: string;
  fileSize?: number | null;
  uploadTime?: string | null;
  uploaderName?: string | null;
};

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

const projectApiClient = createApiClient({
  baseUrl:
    (import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8080',
});

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

export function ProjectHomePage({ onExitSystem }: ProjectHomePageProps = {}) {
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
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [checkIns, setCheckIns] = useState<ProjectCheckIn[]>([]);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

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
            setProjectTypes([]);
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
      .then((data) => {
        const items = getPagedItems(data);

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
      .catch((error: unknown) => {
        if (!cancelled) {
          startTransition(() => {
            setProjects([]);
            setSelectedProjectId(null);
            setProjectDetail(null);
            setListError(normalizeErrorMessage(error));
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
  }, [reloadNonce, searchKeyword]);

  useEffect(() => {
    if (selectedProjectId === null) {
      setProjectDetail(null);
      setDetailError(null);
      setPlans([]);
      setReports([]);
      setCheckIns([]);
      setAttachments([]);
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
          startTransition(() => {
            setProjectDetail(null);
            setDetailError(normalizeErrorMessage(error));
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
      requestData<ProjectCheckIn[]>(`/api/project/projects/${selectedProjectId}/checkins`),
      requestData<ProjectAttachment[]>(`/api/project/projects/${selectedProjectId}/attachments`),
    ])
      .then(([nextPlans, nextReports, nextCheckIns, nextAttachments]) => {
        if (!cancelled) {
          startTransition(() => {
            setPlans(nextPlans);
            setReports(nextReports);
            setCheckIns(nextCheckIns);
            setAttachments(nextAttachments);
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          startTransition(() => {
            setPlans([]);
            setReports([]);
            setCheckIns([]);
            setAttachments([]);
            setWorkspaceError(normalizeErrorMessage(error));
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
  }, [needsWorkspaceResourceData, reloadNonce, selectedProjectId]);

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
    await mutateData(`/api/project/projects/${projectId}/attachments/${attachmentId}`, 'DELETE');
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
    <div className="space-y-6">
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

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
                项目清单
              </div>
              <div className="theme-text-strong mt-2 text-2xl font-black tracking-tight">
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
                      <div className="theme-text-strong text-sm font-black tracking-tight">{project.projectName}</div>
                      <Badge tone={isActive ? 'brand' : getProjectStatusTone(project.status)}>
                        {getProjectStatusLabel(project.status ?? 'DRAFT')}
                      </Badge>
                    </div>
                    <div className="theme-text-muted mt-2 text-xs font-bold uppercase tracking-[0.16em]">
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

        <div className="space-y-6">
          <Card className="rounded-[32px] p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
                  项目摘要
                </div>
                <div className="theme-text-strong mt-2 text-3xl font-black tracking-tight">
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
              <div className="theme-surface-subtle mt-6 rounded-[22px] p-4 text-sm">
                正在加载项目详情...
              </div>
            ) : detailError ? (
              <div className="mt-6 rounded-[22px] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-800">
                {detailError}
              </div>
            ) : selectedProject && statistics ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.16em]">团队</div>
                  <div className="theme-text-strong mt-3 text-3xl font-black tracking-tight">{statistics.memberCount}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.16em]">节点</div>
                  <div className="theme-text-strong mt-3 text-3xl font-black tracking-tight">{statistics.nodeCount}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.16em]">任务</div>
                  <div className="theme-text-strong mt-3 text-3xl font-black tracking-tight">{statistics.taskCount}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.16em]">预算</div>
                  <div className="theme-text-strong mt-3 text-3xl font-black tracking-tight">
                    {formatAmount(statistics.totalPlanAmount)}
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[32px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">团队与预算</div>
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

            <Card className="rounded-[32px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">项目上下文</div>
                <Badge tone="brand">当前项目</Badge>
              </div>
              <div className="mt-5 space-y-4">
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.16em]">业务单元</div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">{selectedProject?.businessUnit ?? '--'}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.16em]">考勤地址</div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">{selectedProject?.attendanceAddress ?? '--'}</div>
                </div>
                <div className="theme-surface-subtle rounded-[22px] p-4">
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.16em]">来源说明</div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">{selectedProject?.sourceContent ?? '--'}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[32px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">里程碑</div>
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

            <Card className="rounded-[32px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">任务执行</div>
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

          <Card className="rounded-[32px] p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">只读甘特</div>
              <Badge tone="neutral">{ganttRows.length}</Badge>
            </div>

            {!ganttRange || ganttRows.length === 0 ? (
              <div className="theme-surface-subtle mt-5 rounded-[22px] p-4 text-sm">暂无可展示的节点或任务时间。</div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.16em]">时间轴</div>
                  <div
                    className="grid gap-2 text-[11px] font-bold uppercase tracking-[0.14em]"
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

          <Card className="rounded-[32px] p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
                计划、汇报、打卡与附件
              </div>
              <Badge tone="neutral">协同区</Badge>
            </div>

            {workspaceLoading ? (
              <div className="theme-surface-subtle mt-5 rounded-[22px] p-4 text-sm">
                正在加载计划、汇报、打卡和附件...
              </div>
            ) : workspaceError ? (
              <div className="mt-5 rounded-[22px] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-800">
                {workspaceError}
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="theme-text-strong text-sm font-black tracking-tight">打卡记录</div>
                  {checkIns.length ? (
                    checkIns.slice(0, 6).map((checkIn) => (
                      <div key={checkIn.id} className="theme-surface-subtle rounded-[22px] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="theme-text-strong text-sm font-semibold">{checkIn.userName}</div>
                          <Badge tone="neutral">{getCheckinResultLabel(checkIn.result)}</Badge>
                        </div>
                        <div className="theme-text-muted mt-2 text-sm">{formatDateTime(checkIn.checkInTime)}</div>
                        <div className="theme-text-muted mt-2 text-sm leading-6">{checkIn.address ?? '--'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="theme-surface-subtle rounded-[22px] p-4 text-sm">暂无打卡记录</div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="theme-text-strong text-sm font-black tracking-tight">附件资料</div>
                  {attachments.length ? (
                    attachments.slice(0, 6).map((attachment) => (
                      <div key={attachment.id} className="theme-surface-subtle rounded-[22px] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="theme-text-strong text-sm font-semibold">{attachment.fileName}</div>
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
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );

  const selectedProjectNotice = selectedProject
    ? `当前选中项目：${selectedProject.projectName}。此页将围绕该项目继续建设。`
    : '请先在项目台账中选择一个项目，再进入当前工作区。';

  const analysisDashboardContent = (
    <ProjectWorkspacePlaceholderPage
      description="项目分析看板将建设为独立分析中心，上半部分展示型甘特图，下半部分承载进度、任务、成员和费用分析图表。"
      kicker="分析中心"
      metrics={[
        { label: '甘特条目', value: String(ganttRows.length) },
        { label: '项目总任务', value: String(statistics?.taskCount ?? 0) },
        { label: '项目成员', value: String(statistics?.memberCount ?? 0) },
        { label: '预算项', value: String(projectDetail?.budgets.length ?? 0) },
      ]}
      notice={selectedProjectNotice}
      sections={[
        {
          title: '页面结构',
          items: [
            '上半部分：展示型甘特图',
            '下半部分：进度分析、任务分析、成员分析、费用分析图表',
          ],
        },
        {
          title: '数据基础',
          items: [
            `当前已具备 ${ganttRows.length} 条节点/任务时间数据，可用于分析型甘特展示。`,
            `当前已具备 ${plans.length} 条计划、${reports.length} 条汇报、${attachments.length} 条附件，可继续作为分析输入。`,
          ],
        },
      ]}
      title="项目分析看板"
    />
  );

  let workspaceContent: ReactNode = analysisDashboardContent;
  if (workspaceMode === 'project-management') {
    workspaceContent = (
      <ProjectManagementPage
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
          members={projectDetail?.members ?? []}
          nodes={projectDetail?.nodes ?? []}
        onCreateBudget={handleCreateBudget}
        onCreateMember={handleCreateMember}
        onCreateNode={handleCreateNode}
        onDeleteBudget={handleDeleteBudget}
        onDeleteMember={handleDeleteMember}
        onDeleteAttachment={handleDeleteAttachment}
        onCreateTask={handleCreateTask}
        onDeleteNode={handleDeleteNode}
        onDeleteTask={handleDeleteTask}
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
        tasks={projectDetail?.tasks ?? []}
      />
    );
  } else if (workspaceMode === 'task-submission') {
    workspaceContent = (
      <ProjectTaskSubmissionPage
        detailLoading={detailLoading}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        selectedProject={selectedProject}
        tasks={projectDetail?.tasks ?? []}
      />
    );
  } else if (workspaceMode === 'plan-log') {
    workspaceContent = (
      <ProjectPlanLogPage
        attachments={attachments}
        checkIns={checkIns}
        loading={workspaceLoading}
        onCreatePlan={handleCreatePlan}
        onCreateReport={handleCreateReport}
        onUpdatePlan={handleUpdatePlan}
        onUpdateReport={handleUpdateReport}
        plans={plans}
        reports={reports}
        selectedProject={selectedProject}
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
        reports={reports}
        selectedProject={selectedProject}
        tasks={projectDetail?.tasks ?? []}
        workspaceError={workspaceError}
      />
    );
  } else if (workspaceMode === 'project-analysis-dashboard') {
    workspaceContent = analysisDashboardContent;
  }

  return (
    <ProjectToastProvider>
      <ProjectWorkspaceShell
        keyword={keyword}
        onExitSystem={onExitSystem ?? (() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        })}
        onKeywordChange={(value) => {
          startTransition(() => {
            setKeyword(value);
          });
        }}
        onSelectWorkspace={(workspaceId) => {
          setWorkspaceMode(workspaceId as WorkspaceMode);
        }}
        selectedProjectName={selectedProject?.projectName ?? '未选择项目'}
        workspaceContent={workspaceContent}
        workspaceGroups={projectWorkspaceGroups}
        workspaceItems={projectWorkspaceItems}
        workspaceMode={workspaceMode}
      />
    </ProjectToastProvider>
  );
}
