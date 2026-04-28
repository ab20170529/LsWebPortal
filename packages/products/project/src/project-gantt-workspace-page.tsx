import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Hand,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { createApiClient } from '@lserp/http';
import { Badge, Button, Card } from '@lserp/ui';

import type {
  ProjectManagementProjectDetail,
  ProjectManagementProjectType,
  ProjectSavePayload,
} from './project-management-page';
import { useProjectToast } from './project-toast';
import type {
  AffectedTaskPreview,
  AttachmentItem,
  BudgetItem,
  CascadeUpdateResult,
  CreateDraft,
  DependencyEndpoint,
  DependencyLine,
  DetailEditState,
  DetailPanelState,
  DragState,
  EditorState,
  FeedbackState,
  MemberItem,
  NodeItem,
  OptimisticScheduleMap,
  StatisticSummary,
  TaskDependency,
  TaskItem,
  TimelineCategory,
  TimelineRow,
  TimelineSubCategory,
} from './gantt-types';
import {
  CATEGORY_ROW_HEIGHT,
  DAY_COLUMN_WIDTH,
  DAY_IN_MS,
  DEPENDENCY_TYPE_CONFIG,
  SIDEBAR_SEARCH_BAND_HEIGHT,
  SIDEBAR_WIDTH,
  SUB_CATEGORY_ROW_HEIGHT,
  TASK_ROW_HEIGHT,
} from './gantt-types';
import {
  addDays,
  areDatesEqual,
  buildFeedbackMessage,
  buildMonthGroups,
  buildTimelineCategories,
  buildTimelineDays,
  buildTimelineRange,
  buildTimelineRows,
  calculateDependencyLines,
  daysBetween,
  formatDateInput,
  formatDateTimeForApi,
  formatMonthDay,
  formatShortMonthDay,
  generateDependencyPath,
  getBarPalette,
  getDayOfWeek,
  getRowHeight,
  normalizeProgress,
  parseDateValue,
  parseInputDate,
} from './gantt-utils';
import { GanttDetailPanel } from './gantt-detail-panel';
import { ProjectTeamManager } from './project-team-manager';

type CommonResult<T> = {
  code: number;
  data: T;
  message?: string;
};

const projectGanttApiClient = createApiClient({
  baseUrl:
    (import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8080',
});

type ProjectGanttWorkspacePageProps = {
  attachments: AttachmentItem[];
  budgets: BudgetItem[];
  canManageProjectSchedule: boolean;
  currentUserId: string;
  currentUserName: string;
  members: MemberItem[];
  nodes: NodeItem[];
  taskDependencies?: TaskDependency[];
  onCreateDependency?: (projectId: number, payload: {
    predecessorTaskId: number;
    successorTaskId: number;
    dependencyType: 'FS' | 'FF' | 'SS' | 'SF';
    lagDays?: number;
    remark?: string | null;
  }) => Promise<{ id: number }>;
  onDeleteDependency?: (projectId: number, dependencyId: number) => Promise<void>;
  onCreateBudget: (
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
  ) => Promise<void>;
  onDeleteBudget: (projectId: number, budgetId: number) => Promise<void>;
  onDeleteMember: (projectId: number, memberId: number) => Promise<void>;
  onDeleteAttachment: (projectId: number, attachmentId: number) => Promise<void>;
  onExitSystem?: () => void;
  onUploadAttachment: (
    projectId: number,
    payload: {
      file: File;
      fileCategory?: string | null;
      projectNodeId?: number | null;
      projectTaskId?: number | null;
      remark?: string | null;
      uploaderId: string;
      uploaderName: string;
    },
  ) => Promise<void>;
  onCreateMember: (
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
  ) => Promise<void>;
  onCreateNode: (
    projectId: number,
    payload: {
      nodeCode: string | null;
      nodeName: string;
      parentNodeId: number | null;
      remark: string | null;
    },
  ) => Promise<{ id: number }>;
  onCreateTask: (
    projectId: number,
    payload: {
      projectNodeId: number;
      remark: string | null;
      taskCode: string | null;
      taskContent: string | null;
      taskTitle: string;
    },
  ) => Promise<{ id: number }>;
  onDeleteNode: (projectId: number, nodeId: number) => Promise<void>;
  onDeleteTask: (projectId: number, taskId: number) => Promise<void>;
  onOpenProgressConfig: () => void;
  onOpenProjectManagement: () => void;
  onLoadTaskDetail: (
    projectId: number,
    taskId: number,
  ) => Promise<{
    participantMembers: Array<{
      userId: string;
      userName: string;
    }>;
    task: {
      id: number;
    };
  }>;
  onSaveProjectBase: (projectId: number, payload: ProjectSavePayload) => Promise<void>;
  onUpdateNodeBasic: (
    projectId: number,
    nodeId: number,
    payload: {
      nodeName: string | null;
      remark: string | null;
    },
  ) => Promise<void>;
  onUpdateNodeStatus: (
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
  ) => Promise<void>;
  onUpdateTaskAssignment: (
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
  ) => Promise<void>;
  onUpdateTaskBasic: (
    projectId: number,
    taskId: number,
    payload: {
      remark: string | null;
      taskContent: string | null;
      taskTitle: string | null;
    },
  ) => Promise<void>;
  onUpdateTaskStatus: (
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
  ) => Promise<void>;
  onUpdateBudget: (
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
  ) => Promise<void>;
  onUpdateMember: (
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
  ) => Promise<void>;
  projectCount: number;
  projectTypeCount: number;
  projectTypes: ProjectManagementProjectType[];
  selectedProject: ProjectManagementProjectDetail['project'] | null;
  selectedProjectId: number | null;
  statistics: StatisticSummary | null;
  tasks: TaskItem[];
};

function CategoryMark() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-400">
      <span className="grid grid-cols-2 gap-[1px]">
        <span className="h-1 w-1 rounded-[1px] bg-current" />
        <span className="h-1 w-1 rounded-[1px] bg-current" />
        <span className="h-1 w-1 rounded-[1px] bg-current" />
        <span className="h-1 w-1 rounded-[1px] bg-current" />
      </span>
    </span>
  );
}

function SubCategoryMark() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-500">
      <svg fill="none" viewBox="0 0 16 16" className="h-2.5 w-2.5">
        <path d="M3 4.5h4m-4 3h6m-6 3h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

function TaskMark({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
        active
          ? 'border-violet-200 bg-violet-50 text-violet-500'
          : 'border-[#dbe7f7] bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-500'
      }`}
    >
      <svg fill="none" viewBox="0 0 16 16" className="h-3 w-3">
        <path
          d="M4 3.75h5.25L12 6.5v5.75a1 1 0 0 1-1 1H4.75a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M9 3.75V6.5h2.75" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

/**
 * 生成箭头标记
 */
function generateArrowMarker(id: string, color: string): string {
  return `
    <marker id="${id}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${color}" />
    </marker>
  `;
}

export function ProjectGanttWorkspacePage({
  attachments,
  budgets,
  canManageProjectSchedule,
  currentUserId,
  currentUserName,
  members,
  nodes,
  taskDependencies = [],
  onCreateBudget,
  onCreateDependency,
  onCreateMember,
  onCreateNode,
  onCreateTask,
  onDeleteAttachment,
  onDeleteBudget,
  onDeleteDependency,
  onDeleteMember,
  onDeleteNode,
  onDeleteTask,
  onExitSystem,
  onUploadAttachment,
  onOpenProgressConfig,
  onOpenProjectManagement,
  onLoadTaskDetail,
  onSaveProjectBase,
  onUpdateNodeBasic,
  onUpdateNodeStatus,
  onUpdateMember,
  onUpdateTaskAssignment,
  onUpdateTaskBasic,
  onUpdateTaskStatus,
  projectTypes,
  selectedProject,
  selectedProjectId,
  statistics,
  tasks,
}: ProjectGanttWorkspacePageProps) {
  const { pushToast } = useProjectToast();
  const [bodyRef] = useState<{ current: HTMLDivElement | null }>(() => ({ current: null }));
  const [axisRef] = useState<{ current: HTMLDivElement | null }>(() => ({ current: null }));
  const [rowTrackRefs] = useState<Record<string, HTMLDivElement | null>>(() => ({}));
  const [movedRef] = useState<{ current: boolean }>(() => ({ current: false }));
  const [suppressEditorOpenRef] = useState<{ current: boolean }>(() => ({ current: false }));
  const [detailRowIdRef] = useState<{ current: string | null }>(() => ({ current: null }));

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<CreateDraft | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [optimisticScheduleMap, setOptimisticScheduleMap] = useState<OptimisticScheduleMap>({});
  const [teamPanelVisible, setTeamPanelVisible] = useState(false);
  const [taskParticipantCountMap, setTaskParticipantCountMap] = useState<Record<number, number>>({});
  const [hoveredDependencyId, setHoveredDependencyId] = useState<string | null>(null);
  const [dependencyMode, setDependencyMode] = useState<{ sourceTaskId: number; sourceRowId: string } | null>(null);
  const [dependencyModalState, setDependencyModalState] = useState<{
    visible: boolean;
    taskId: number | null;
    taskTitle: string;
  } | null>(null);
  const [newDependency, setNewDependency] = useState<{
    targetTaskId: number | null;
    dependencyType: 'FS' | 'FF' | 'SS' | 'SF';
    lagDays: number;
  }>({
    targetTaskId: null,
    dependencyType: 'FS',
    lagDays: 0,
  });

  // 连锁日期更新相关状态
  const [cascadeUpdateEnabled, setCascadeUpdateEnabled] = useState(false); // 是否启用连锁更新
  const [cascadePreview, setCascadePreview] = useState<CascadeUpdateResult | null>(null); // 预览结果
  const [showCascadeConfirm, setShowCascadeConfirm] = useState(false); // 显示确认弹窗

  // 任务详情侧边栏状态
  const [detailPanel, setDetailPanel] = useState<{
    visible: boolean;
    rowId: string | null;
    activeTab: 'info' | 'members' | 'budget' | 'attachments';
  }>({ visible: false, rowId: null, activeTab: 'info' });

  // 侧边栏快速编辑状态
  const [detailEditState, setDetailEditState] = useState<{
    participantMembers: Array<{
      userId: string;
      userName: string;
    }>;
    planEndTime: string | null;
    planStartTime: string | null;
    taskTitle: string;
    taskContent: string;
    taskRemark: string;
    responsibleName: string;
    responsibleUserId: string | null;
    status: string;
    progressRate: number;
  } | null>(null);
  const [quickAssignState, setQuickAssignState] = useState<{
    loading: boolean;
    participantMembers: Array<{
      userId: string;
      userName: string;
    }>;
    responsibleName: string | null;
    responsibleUserId: string | null;
    taskId: number | null;
    taskTitle: string;
    visible: boolean;
  }>({
    loading: false,
    participantMembers: [],
    responsibleName: null,
    responsibleUserId: null,
    taskId: null,
    taskTitle: '',
    visible: false,
  });

  const categories = buildTimelineCategories(nodes, tasks);
  function showManageOnlyFeedback() {
    setFeedback({
      message: '当前账号在排期协同中为只读权限，请由项目负责人或项目管理员维护计划。',
      tone: 'danger',
    });
  }

  function ensureCanManageProjectSchedule() {
    if (canManageProjectSchedule) {
      return true;
    }
    showManageOnlyFeedback();
    return false;
  }

  const memberMap = useMemo(
    () =>
      new Map(
        members.map((member) => [
          member.userId,
          member,
        ]),
      ),
    [members],
  );
  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const taskMap = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const childNodeIdsByParent = useMemo(() => {
    const next = new Map<number, number[]>();
    nodes.forEach((node) => {
      const parentId = Number(node.parentId ?? 0);
      if (!parentId || !nodeMap.has(parentId)) {
        return;
      }
      const current = next.get(parentId) ?? [];
      current.push(node.id);
      next.set(parentId, current);
    });
    return next;
  }, [nodeMap, nodes]);
  const taskIdsByNodeId = useMemo(() => {
    const next = new Map<number, number[]>();
    tasks.forEach((task) => {
      const nodeId = Number(task.projectNodeId ?? 0);
      if (!nodeId) {
        return;
      }
      const current = next.get(nodeId) ?? [];
      current.push(task.id);
      next.set(nodeId, current);
    });
    return next;
  }, [tasks]);
  const filterKeyword = searchKeyword.trim().toLowerCase();
  const visibleCategories = categories
    .map((category) => ({
      ...category,
      tasks: category.tasks.filter((task) =>
        filterKeyword
          ? task.taskTitle.toLowerCase().includes(filterKeyword) ||
            category.title.toLowerCase().includes(filterKeyword)
          : true,
      ),
      subCategories: category.subCategories
        .map((subCategory) => ({
          ...subCategory,
          tasks: subCategory.tasks.filter((task) =>
            filterKeyword
              ? task.taskTitle.toLowerCase().includes(filterKeyword) ||
                subCategory.title.toLowerCase().includes(filterKeyword) ||
                category.title.toLowerCase().includes(filterKeyword)
              : true,
          ),
        }))
        .filter((subCategory) => {
          if (!filterKeyword) {
            return true;
          }
          return (
            subCategory.title.toLowerCase().includes(filterKeyword) ||
            subCategory.tasks.length > 0
          );
        }),
    }))
    .filter((category) => {
      if (!filterKeyword) {
        return true;
      }
      return (
        category.title.toLowerCase().includes(filterKeyword) ||
        category.tasks.length > 0 ||
        category.subCategories.length > 0
      );
    });

  const rows = buildTimelineRows(visibleCategories);
  const renderedRows = rows.map((row) => {
    const optimisticSchedule = optimisticScheduleMap[row.id];
    if (!optimisticSchedule) {
      return row;
    }
    return {
      ...row,
      endDate: optimisticSchedule.endDate,
      startDate: optimisticSchedule.startDate,
    };
  });
  const nodeRowIdMap = useMemo(
    () =>
      new Map(
        renderedRows
          .filter((row) => row.entityKind === 'node' && row.entityId)
          .map((row) => [row.entityId as number, row.id]),
      ),
    [renderedRows],
  );
  // 使用 useMemo 缓存 timelineRange 和 timelineDays，避免无限循环
  const timelineRange = useMemo(
    () => buildTimelineRange(selectedProject, renderedRows),
    [selectedProject, renderedRows]
  );
  const timelineDays = useMemo(
    () => buildTimelineDays(timelineRange.start, timelineRange.end),
    [timelineRange]
  );
  const monthGroups = buildMonthGroups(timelineDays);
  const timelineWidth = timelineDays.length * DAY_COLUMN_WIDTH;

  // 直接用 useMemo 计算依赖连线，避免 useEffect + setState 导致的无限循环
  const dependencyLines = useMemo(
    () => calculateDependencyLines(taskDependencies, renderedRows, timelineRange, timelineDays),
    [taskDependencies, renderedRows, timelineRange, timelineDays]
  );

  useEffect(() => {
    setExpandedMap((current) => {
      let changed = false;
      const next = { ...current };
      visibleCategories.forEach((category) => {
        if (!(category.id in next)) {
          next[category.id] = true;
          changed = true;
        }
        category.subCategories.forEach((subCategory) => {
          if (!(subCategory.id in next)) {
            next[subCategory.id] = true;
            changed = true;
          }
        });
      });
      return changed ? next : current;
    });
  }, [visibleCategories]);

  useEffect(() => {
    setOptimisticScheduleMap((current) => {
      const entries = Object.entries(current);
      if (!entries.length) {
        return current;
      }

      let changed = false;
      const next: OptimisticScheduleMap = { ...current };
      entries.forEach(([rowId, optimisticSchedule]) => {
        const baseRow = rows.find((row) => row.id === rowId);
        if (!baseRow) {
          delete next[rowId];
          changed = true;
          return;
        }
        if (
          areDatesEqual(baseRow.startDate, optimisticSchedule.startDate) &&
          areDatesEqual(baseRow.endDate, optimisticSchedule.endDate)
        ) {
          delete next[rowId];
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [rows]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    pushToast({
      message: feedback.message,
      tone: feedback.tone,
    });
    setFeedback(null);
  }, [feedback, pushToast]);

  useEffect(() => {
    if (!bodyRef.current) {
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentIndex = daysBetween(timelineRange.start, today);
    if (currentIndex < 0 || currentIndex >= timelineDays.length) {
      return;
    }
    const targetLeft = Math.max(0, currentIndex * DAY_COLUMN_WIDTH - 320);
    bodyRef.current.scrollLeft = targetLeft;
    if (axisRef.current) {
      axisRef.current.scrollLeft = targetLeft;
    }
  }, [timelineDays.length, timelineRange.start]);

  const visibleRows = renderedRows.filter((row) => {
    if (row.rowType === 'category') {
      return true;
    }
    if (row.rowType === 'subCategory') {
      return row.categoryId ? expandedMap[row.categoryId] ?? true : true;
    }
    if (!row.categoryId) {
      return true;
    }
    if (!(expandedMap[row.categoryId] ?? true)) {
      return false;
    }
    if (!row.subCategoryId) {
      return true;
    }
    return expandedMap[row.subCategoryId] ?? true;
  });

  const getTaskDisplayMeta = (row: TimelineRow) => {
    if (row.entityKind !== 'task' || !row.entityId) {
      return {
        assignmentToneClassName: null as string | null,
        assignmentStatusLabel: null as string | null,
        ownerRoleName: null as string | null,
        participantCount: null as number | null,
        participantLabel: null as string | null,
      };
    }

    const task = tasks.find((item) => item.id === row.entityId);
    const ownerRoleName =
      task?.responsibleUserId && memberMap.has(task.responsibleUserId)
        ? memberMap.get(task.responsibleUserId)?.roleName ?? null
        : null;
    const participantCount = taskParticipantCountMap[row.entityId] ?? null;
    const hasOwner = Boolean(task?.responsibleUserId || row.owner);
    const hasParticipants = (participantCount ?? 0) > 0;

    let assignmentStatusLabel: string;
    let assignmentToneClassName: string;
    let assignmentDotClassName: string;
    if (hasOwner && hasParticipants) {
      assignmentStatusLabel = '多人协作';
      assignmentToneClassName = 'bg-emerald-50 text-emerald-600';
      assignmentDotClassName = 'bg-emerald-500';
    } else if (hasOwner) {
      assignmentStatusLabel = '已分配';
      assignmentToneClassName = 'bg-sky-50 text-sky-600';
      assignmentDotClassName = 'bg-sky-500';
    } else {
      assignmentStatusLabel = '未分配';
      assignmentToneClassName = 'bg-amber-50 text-amber-600';
      assignmentDotClassName = 'bg-amber-500';
    }

    const assignmentTooltip = [
      `任务：${row.title}`,
      row.startDate && row.endDate
        ? `计划时间：${formatShortMonthDay(row.startDate)}-${formatShortMonthDay(row.endDate)}`
        : null,
      `分配状态：${assignmentStatusLabel}`,
      row.owner ? `负责人：${row.owner}` : '负责人：未分配',
      ownerRoleName ? `角色：${ownerRoleName}` : null,
      participantCount !== null ? `参与人数：${participantCount}` : null,
      `进度：${normalizeProgress(row.progress)}%`,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      assignmentDotClassName,
      assignmentStatusLabel,
      assignmentToneClassName,
      assignmentTooltip,
      ownerRoleName,
      participantCount,
      participantLabel:
        participantCount !== null ? `${participantCount} 人参与` : null,
    };
  };

  const currentLineIndex = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const index = daysBetween(timelineRange.start, today);
    if (index < 0 || index >= timelineDays.length) {
      return null;
    }
    return index;
  })();

  const completionRate = statistics?.taskCount
    ? Math.round(
        ((statistics.completedTaskCount ?? 0) / Math.max(1, statistics.taskCount)) * 100,
      )
    : Math.round(
        tasks.reduce((sum, task) => sum + normalizeProgress(task.progressRate), 0) /
          Math.max(1, tasks.length),
      );

  const plannedFinish = parseDateValue(selectedProject?.planEndTime);
  const predictedFinish = rows
    .flatMap((row) => (row.endDate ? [row.endDate] : []))
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
  const deviationDays =
    plannedFinish && predictedFinish ? daysBetween(plannedFinish, predictedFinish) : null;

  function syncAxisScroll() {
    if (!bodyRef.current || !axisRef.current) {
      return;
    }
    axisRef.current.scrollLeft = bodyRef.current.scrollLeft;
  }

  function toggleExpand(id: string) {
    setExpandedMap((current) => ({
      ...current,
      [id]: !(current[id] ?? true),
    }));
  }

  function findRow(rowId: string) {
    return renderedRows.find((row) => row.id === rowId) ?? null;
  }

  /**
   * 根据实体ID查找行
   */
  function findRowByEntityId(entityId: number) {
    return renderedRows.find((row) => row.entityId === entityId) ?? null;
  }

  function getStoredTaskRange(
    taskId: number,
    override?: {
      endDate: Date | null;
      startDate: Date | null;
      taskId: number;
    },
  ) {
    if (override?.taskId === taskId) {
      return {
        endDate: override.endDate,
        startDate: override.startDate,
      };
    }

    const optimistic = optimisticScheduleMap[`task-${taskId}`];
    if (optimistic) {
      return optimistic;
    }

    const task = taskMap.get(taskId);
    return {
      endDate: parseDateValue(task?.planEndTime) ?? parseDateValue(task?.actualEndTime),
      startDate: parseDateValue(task?.planStartTime) ?? parseDateValue(task?.actualStartTime),
    };
  }

  function getStoredNodeRange(nodeId: number) {
    const rowId = nodeRowIdMap.get(nodeId);
    if (rowId) {
      const optimistic = optimisticScheduleMap[rowId];
      if (optimistic) {
        return optimistic;
      }
    }

    const node = nodeMap.get(nodeId);
    return {
      endDate: parseDateValue(node?.planEndTime) ?? parseDateValue(node?.actualEndTime),
      startDate: parseDateValue(node?.planStartTime) ?? parseDateValue(node?.actualStartTime),
    };
  }

  function computeNodeAggregateRange(
    nodeId: number,
    override?: {
      endDate: Date | null;
      startDate: Date | null;
      taskId: number;
    },
    visited = new Set<number>(),
  ): {
    endDate: Date | null;
    startDate: Date | null;
  } {
    if (visited.has(nodeId)) {
      return {
        endDate: null,
        startDate: null,
      };
    }

    visited.add(nodeId);

    const collectedRanges: Array<{
      endDate: Date;
      startDate: Date;
    }> = [];

    (taskIdsByNodeId.get(nodeId) ?? []).forEach((taskId) => {
      const range = getStoredTaskRange(taskId, override);
      if (range.startDate && range.endDate) {
        collectedRanges.push({
          endDate: range.endDate,
          startDate: range.startDate,
        });
      }
    });

    (childNodeIdsByParent.get(nodeId) ?? []).forEach((childNodeId) => {
      const childRange = computeNodeAggregateRange(childNodeId, override, visited);
      if (childRange.startDate && childRange.endDate) {
        collectedRanges.push({
          endDate: childRange.endDate,
          startDate: childRange.startDate,
        });
      }
    });

    if (!collectedRanges.length) {
      return getStoredNodeRange(nodeId);
    }

    return {
      endDate: new Date(Math.max(...collectedRanges.map((item) => item.endDate.getTime()))),
      startDate: new Date(Math.min(...collectedRanges.map((item) => item.startDate.getTime()))),
    };
  }

  function buildAncestorNodeScheduleUpdates(
    taskId: number,
    startDate: Date | null,
    endDate: Date | null,
  ) {
    const task = taskMap.get(taskId);
    const updates: Array<{
      endDate: Date | null;
      nodeId: number;
      rowId: string;
      startDate: Date | null;
    }> = [];

    let currentNodeId = Number(task?.projectNodeId ?? 0);
    const visited = new Set<number>();

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);

      const rowId = nodeRowIdMap.get(currentNodeId);
      const node = nodeMap.get(currentNodeId);
      if (!rowId || !node) {
        currentNodeId = Number(node?.parentId ?? 0);
        continue;
      }

      const nextRange = computeNodeAggregateRange(
        currentNodeId,
        {
          endDate,
          startDate,
          taskId,
        },
      );
      const currentRange = getStoredNodeRange(currentNodeId);

      if (
        !areDatesEqual(currentRange.startDate, nextRange.startDate) ||
        !areDatesEqual(currentRange.endDate, nextRange.endDate)
      ) {
        updates.push({
          endDate: nextRange.endDate,
          nodeId: currentNodeId,
          rowId,
          startDate: nextRange.startDate,
        });
      }

      currentNodeId = Number(node.parentId ?? 0);
    }

    return updates;
  }

  async function persistAncestorNodeScheduleUpdates(
    updates: Array<{
      endDate: Date | null;
      nodeId: number;
      startDate: Date | null;
    }>,
  ) {
    if (!selectedProjectId) {
      return;
    }

    for (const update of updates) {
      const node = nodeMap.get(update.nodeId);
      if (!node) {
        continue;
      }

      await onUpdateNodeStatus(selectedProjectId, update.nodeId, {
        actualEndTime: node.actualEndTime ?? null,
        actualStartTime: node.actualStartTime ?? null,
        planEndTime: formatDateTimeForApi(update.endDate, 'end'),
        planStartTime: formatDateTimeForApi(update.startDate, 'start'),
        progressRate: node.progressRate ?? null,
        remark: node.remark ?? null,
        status: node.status ?? null,
      });
    }
  }

  function getValidNodeId(row: TimelineRow | null) {
    if (!row) {
      return null;
    }
    if (row.entityKind === 'node' && row.entityId && row.entityId > 0) {
      return row.entityId;
    }
    if (row.parentNodeId && row.parentNodeId > 0) {
      return row.parentNodeId;
    }
    return null;
  }

  function openCreateDialog(mode: 'node' | 'task', row: TimelineRow | null, root = false) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!selectedProjectId) {
      setFeedback({
        message: '请先选择项目。',
        tone: 'danger',
      });
      return;
    }

    const parentNodeId = root ? null : getValidNodeId(row);
    if (!root && parentNodeId === null) {
      setFeedback({
        message: mode === 'node' ? '请选择一个节点后再新增子节点。' : '请选择一个节点后再新增任务。',
        tone: 'danger',
      });
      return;
    }

    setCreateDraft({
      categoryId: row?.categoryId ?? row?.id ?? null,
      code: '',
      content: '',
      mode,
      parentNodeId,
      remark: '',
      subCategoryId: row?.rowType === 'subCategory' ? row.id : row?.subCategoryId ?? null,
      title: '',
    });
  }

  async function handleSaveCreateDraft() {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!selectedProjectId || !createDraft) {
      return;
    }

    const title = createDraft.title.trim();
    if (!title) {
      setFeedback({
        message: createDraft.mode === 'node' ? '请输入节点名称。' : '请输入任务名称。',
        tone: 'danger',
      });
      return;
    }

    setActionLoading(true);
    try {
      if (createDraft.mode === 'node') {
        const created = await onCreateNode(selectedProjectId, {
          nodeCode: createDraft.code.trim() || null,
          nodeName: title,
          parentNodeId: createDraft.parentNodeId,
          remark: createDraft.remark.trim() || null,
        });
        setSelectedRowId(createDraft.parentNodeId ? `sub-${created.id}` : `cat-${created.id}`);
        setExpandedMap((current) => ({
          ...current,
          ...(createDraft.categoryId ? { [createDraft.categoryId]: true } : {}),
          ...(createDraft.subCategoryId ? { [createDraft.subCategoryId]: true } : {}),
        }));
        setFeedback({
          message: createDraft.parentNodeId ? '子节点已新增。' : '一级节点已新增。',
          tone: 'success',
        });
      } else {
        if (!createDraft.parentNodeId) {
          throw new Error('未找到任务所属节点。');
        }
        const created = await onCreateTask(selectedProjectId, {
          projectNodeId: createDraft.parentNodeId,
          remark: createDraft.remark.trim() || null,
          taskCode: createDraft.code.trim() || null,
          taskContent: createDraft.content.trim() || null,
          taskTitle: title,
        });
        setSelectedRowId(`task-${created.id}`);
        setExpandedMap((current) => ({
          ...current,
          ...(createDraft.categoryId ? { [createDraft.categoryId]: true } : {}),
          ...(createDraft.subCategoryId ? { [createDraft.subCategoryId]: true } : {}),
        }));
        setFeedback({
          message: '任务已新增。',
          tone: 'success',
        });
      }
      setCreateDraft(null);
    } catch (error) {
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveRowSchedule(row: TimelineRow, startDate: Date | null, endDate: Date | null) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!selectedProjectId || !row.entityId || !row.entityKind) {
      return;
    }

    const optimisticUpdates: OptimisticScheduleMap = {
      [row.id]: {
        endDate,
        startDate,
      },
    };
    const ancestorUpdates =
      row.entityKind === 'task'
        ? buildAncestorNodeScheduleUpdates(row.entityId, startDate, endDate)
        : [];

    ancestorUpdates.forEach((update) => {
      optimisticUpdates[update.rowId] = {
        endDate: update.endDate,
        startDate: update.startDate,
      };
    });

    setActionLoading(true);
    setFeedback(null);
    setOptimisticScheduleMap((current) => ({
      ...current,
      ...optimisticUpdates,
    }));
    try {
      if (row.entityKind === 'node') {
        const node = nodes.find((item) => item.id === row.entityId);
        if (!node) {
          throw new Error('未找到节点数据。');
        }
        await onUpdateNodeStatus(selectedProjectId, row.entityId, {
          actualEndTime: node.actualEndTime ?? null,
          actualStartTime: node.actualStartTime ?? null,
          planEndTime: formatDateTimeForApi(endDate, 'end'),
          planStartTime: formatDateTimeForApi(startDate, 'start'),
          progressRate: node.progressRate ?? null,
          remark: node.remark ?? null,
          status: node.status ?? null,
        });
      } else {
        const task = tasks.find((item) => item.id === row.entityId);
        if (!task) {
          throw new Error('未找到任务数据。');
        }
        await onUpdateTaskStatus(selectedProjectId, row.entityId, {
          actualEndTime: task.actualEndTime ?? null,
          actualStartTime: task.actualStartTime ?? null,
          auditStatus: task.auditStatus ?? null,
          checkStatus: task.checkStatus ?? null,
          finishDesc: task.finishDesc ?? null,
          planEndTime: formatDateTimeForApi(endDate, 'end'),
          planStartTime: formatDateTimeForApi(startDate, 'start'),
          progressRate: task.progressRate ?? null,
          remark: task.remark ?? null,
          status: task.status ?? null,
        });

        await persistAncestorNodeScheduleUpdates(
          ancestorUpdates.map((update) => ({
            endDate: update.endDate,
            nodeId: update.nodeId,
            startDate: update.startDate,
          })),
        );
      }

      setFeedback({
        message: '计划时间已保存。',
        tone: 'success',
      });
    } catch (error) {
      setOptimisticScheduleMap((current) => {
        const rollbackKeys = Object.keys(optimisticUpdates);
        if (!rollbackKeys.some((key) => key in current)) {
          return current;
        }
        const next = { ...current };
        rollbackKeys.forEach((key) => {
          delete next[key];
        });
        return next;
      });
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  }

  function openEditor(row: TimelineRow, preferredStart?: Date | null, preferredEnd?: Date | null) {
    if (!row.entityKind) {
      return;
    }
    const startDate = preferredStart ?? row.startDate;
    const endDate = preferredEnd ?? row.endDate ?? startDate;
    setSelectedRowId(row.id);
    setEditorState({
      endDate: formatDateInput(endDate),
      rowId: row.id,
      startDate: formatDateInput(startDate),
    });
  }

  /**
   * 打开任务详情侧边栏
   */
  function openDetailPanel(row: TimelineRow) {
    setTeamPanelVisible(false);
    setSelectedRowId(row.id);
    detailRowIdRef.current = row.id;
    // 初始化编辑状态
    const task = row.entityKind === 'task' ? tasks.find(t => t.id === row.entityId) : null;
    const node = row.entityKind === 'node' ? nodes.find(n => n.id === row.entityId) : null;
    setDetailEditState({
      participantMembers: [],
      taskTitle: row.title,
      taskContent: task?.taskContent ?? '',
      taskRemark: task?.remark ?? node?.remark ?? '',
      responsibleName: task?.responsibleName ?? '',
      responsibleUserId: task?.responsibleUserId ?? null,
      status: task?.status ?? node?.status ?? 'PENDING',
      progressRate: task?.progressRate ?? node?.progressRate ?? 0,
      planStartTime: row.startDate ? formatDateInput(row.startDate) : null,
      planEndTime: row.endDate ? formatDateInput(row.endDate) : null,
    });
    setDetailPanel({
      visible: true,
      rowId: row.id,
      activeTab: 'info',
    });

    if (row.entityKind === 'task' && row.entityId && selectedProjectId) {
      const taskRowId = row.id;
      const taskId = row.entityId;
      void onLoadTaskDetail(selectedProjectId, row.entityId)
        .then((detail) => {
          if (detailRowIdRef.current !== taskRowId) {
            return;
          }
          setTaskParticipantCountMap((current) => ({
            ...current,
            [taskId]: detail.participantMembers.length,
          }));
          setDetailEditState((current) => current ? {
            ...current,
            participantMembers: detail.participantMembers.map((member) => ({
              userId: member.userId,
              userName: member.userName,
            })),
          } : current);
        })
        .catch((error) => {
          if (detailRowIdRef.current !== taskRowId) {
            return;
          }
          setFeedback({
            message: buildFeedbackMessage(error),
            tone: 'danger',
          });
        });
    }
  }

  /**
   * 关闭任务详情侧边栏
   */
  function closeDetailPanel() {
    detailRowIdRef.current = null;
    setDetailPanel({ visible: false, rowId: null, activeTab: 'info' });
    setDetailEditState(null);
  }

  function openTeamPanel() {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    closeDetailPanel();
    setTeamPanelVisible(true);
  }

  function closeTeamPanel() {
    setTeamPanelVisible(false);
  }

  function closeQuickAssign() {
    setQuickAssignState({
      loading: false,
      participantMembers: [],
      responsibleName: null,
      responsibleUserId: null,
      taskId: null,
      taskTitle: '',
      visible: false,
    });
  }

  async function openQuickAssign(row: TimelineRow) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (row.entityKind !== 'task' || !row.entityId || !selectedProjectId) {
      return;
    }
    setTeamPanelVisible(false);
    const task = tasks.find((item) => item.id === row.entityId);
    const taskId = row.entityId;
    setSelectedRowId(row.id);
    setQuickAssignState({
      loading: true,
      participantMembers: [],
      responsibleName: task?.responsibleName ?? null,
      responsibleUserId: task?.responsibleUserId ?? null,
      taskId: row.entityId,
      taskTitle: row.title,
      visible: true,
    });
    try {
      const detail = await onLoadTaskDetail(selectedProjectId, row.entityId);
      setTaskParticipantCountMap((current) => ({
        ...current,
        [taskId]: detail.participantMembers.length,
      }));
      setQuickAssignState((current) => {
        if (!current.visible || current.taskId !== row.entityId) {
          return current;
        }
        return {
          ...current,
          loading: false,
          participantMembers: detail.participantMembers.map((member) => ({
            userId: member.userId,
            userName: member.userName,
          })),
        };
      });
    } catch (error) {
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
      setQuickAssignState((current) => ({
        ...current,
        loading: false,
      }));
    }
  }

  async function handleSaveQuickAssign() {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!selectedProjectId || !quickAssignState.taskId) {
      return;
    }
    setQuickAssignState((current) => ({ ...current, loading: true }));
    try {
      const taskId = quickAssignState.taskId;
      await onUpdateTaskAssignment(selectedProjectId, quickAssignState.taskId, {
        participantMembers: quickAssignState.participantMembers,
        responsibleName: quickAssignState.responsibleName,
        responsibleUserId: quickAssignState.responsibleUserId,
      });
      setTaskParticipantCountMap((current) => ({
        ...current,
        [taskId]: quickAssignState.participantMembers.length,
      }));
      setDetailEditState((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          participantMembers: quickAssignState.participantMembers,
          responsibleName: quickAssignState.responsibleName ?? '',
          responsibleUserId: quickAssignState.responsibleUserId,
        };
      });
      setFeedback({
        message: '任务人员分配已保存。',
        tone: 'success',
      });
      closeQuickAssign();
    } catch (error) {
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
      setQuickAssignState((current) => ({ ...current, loading: false }));
    }
  }

  /**
   * 保存任务详情
   */
  async function handleSaveDetailPanel() {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!selectedProjectId || !detailPanel.rowId || !detailEditState) {
      return;
    }
    const row = findRow(detailPanel.rowId);
    if (!row || !row.entityKind || !row.entityId) {
      return;
    }

    setActionLoading(true);
    let taskOptimisticKeys: string[] = [];
    try {
        if (row.entityKind === 'task') {
          const taskId = row.entityId;
          const nextTaskStartDate = parseInputDate(detailEditState.planStartTime ?? '');
          const nextTaskEndDate = parseInputDate(detailEditState.planEndTime ?? '');
          const ancestorUpdates = buildAncestorNodeScheduleUpdates(
            taskId,
            nextTaskStartDate,
            nextTaskEndDate,
          );
          const optimisticUpdates: OptimisticScheduleMap = {
            [row.id]: {
              endDate: nextTaskEndDate,
              startDate: nextTaskStartDate,
            },
          };

          ancestorUpdates.forEach((update) => {
            optimisticUpdates[update.rowId] = {
              endDate: update.endDate,
              startDate: update.startDate,
            };
          });
          taskOptimisticKeys = Object.keys(optimisticUpdates);

          setOptimisticScheduleMap((current) => ({
            ...current,
            ...optimisticUpdates,
          }));

          // 保存责任人分配
          await onUpdateTaskAssignment(selectedProjectId, row.entityId, {
            participantMembers: detailEditState.participantMembers,
            responsibleUserId: detailEditState.responsibleUserId,
            responsibleName: detailEditState.responsibleName,
          });
          setTaskParticipantCountMap((current) => ({
            ...current,
            [taskId]: detailEditState.participantMembers.length,
          }));
        // 保存基本信息
        await onUpdateTaskBasic(selectedProjectId, row.entityId, {
          taskTitle: detailEditState.taskTitle || null,
          taskContent: detailEditState.taskContent || null,
          remark: detailEditState.taskRemark || null,
        });
        // 保存状态和进度
          await onUpdateTaskStatus(selectedProjectId, row.entityId, {
          planStartTime: detailEditState.planStartTime,
          planEndTime: detailEditState.planEndTime,
          progressRate: detailEditState.progressRate,
          status: detailEditState.status,
          actualStartTime: null,
          actualEndTime: null,
          auditStatus: null,
          checkStatus: null,
          finishDesc: null,
          remark: null,
        });
        await persistAncestorNodeScheduleUpdates(
          ancestorUpdates.map((update) => ({
            endDate: update.endDate,
            nodeId: update.nodeId,
            startDate: update.startDate,
          })),
        );
      } else if (row.entityKind === 'node') {
        await onUpdateNodeBasic(selectedProjectId, row.entityId, {
          nodeName: detailEditState.taskTitle || null,
          remark: detailEditState.taskRemark || null,
        });
        await onUpdateNodeStatus(selectedProjectId, row.entityId, {
          planStartTime: detailEditState.planStartTime,
          planEndTime: detailEditState.planEndTime,
          progressRate: detailEditState.progressRate,
          status: detailEditState.status,
          actualStartTime: null,
          actualEndTime: null,
          remark: null,
        });
      }
      setFeedback({ message: '保存成功', tone: 'success' });
      closeDetailPanel();
    } catch (error) {
      if (row.entityKind === 'task') {
        setOptimisticScheduleMap((current) => {
          const next = { ...current };
          taskOptimisticKeys.forEach((key) => {
            delete next[key];
          });
          return next;
        });
      }
      setFeedback({ message: buildFeedbackMessage(error), tone: 'danger' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteRow(row: TimelineRow) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!selectedProjectId || !row.entityKind || !row.entityId) {
      return;
    }
    const entityLabel = row.entityKind === 'task' ? '任务' : '节点';
    const confirmed = window.confirm(`确认删除${entityLabel}“${row.title}”吗？`);
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    try {
      if (row.entityKind === 'task') {
        await onDeleteTask(selectedProjectId, row.entityId);
      } else {
        await onDeleteNode(selectedProjectId, row.entityId);
      }
      if (selectedRowId === row.id) {
        setSelectedRowId(null);
      }
      if (detailPanel.rowId === row.id) {
        closeDetailPanel();
      }
      setEditorState((current) => (current?.rowId === row.id ? null : current));
      setFeedback({
        message: `${entityLabel}已删除。`,
        tone: 'success',
      });
    } catch (error) {
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  }

  function getRowPreview(row: TimelineRow) {
    if (!dragState || dragState.rowId !== row.id) {
      return {
        endDate: row.endDate,
        startDate: row.startDate,
      };
    }

    if (dragState.mode === 'create') {
      const startIndex = Math.min(dragState.anchorIndex, dragState.currentIndex);
      const endIndex = Math.max(dragState.anchorIndex, dragState.currentIndex);
      return {
        endDate: addDays(timelineRange.start, endIndex),
        startDate: addDays(timelineRange.start, startIndex),
      };
    }

    const deltaDays = dragState.currentIndex - dragState.anchorIndex;
    if (dragState.mode === 'move') {
      return {
        endDate: addDays(timelineRange.start, dragState.originalEndIndex + deltaDays),
        startDate: addDays(timelineRange.start, dragState.originalStartIndex + deltaDays),
      };
    }

    if (dragState.mode === 'resize-start') {
      const startIndex = Math.min(dragState.currentIndex, dragState.originalEndIndex);
      return {
        endDate: addDays(timelineRange.start, dragState.originalEndIndex),
        startDate: addDays(timelineRange.start, startIndex),
      };
    }

    const endIndex = Math.max(dragState.currentIndex, dragState.originalStartIndex);
    return {
      endDate: addDays(timelineRange.start, endIndex),
      startDate: addDays(timelineRange.start, dragState.originalStartIndex),
    };
  }

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const activeDrag = dragState;

    function handleWindowMouseMove(event: MouseEvent) {
      const track = rowTrackRefs[activeDrag.rowId];
      if (!track) {
        return;
      }
      const rect = track.getBoundingClientRect();
      const rawIndex = Math.floor((event.clientX - rect.left) / DAY_COLUMN_WIDTH);
      const nextIndex = Math.max(0, Math.min(timelineDays.length - 1, rawIndex));
      if (nextIndex !== activeDrag.currentIndex) {
        movedRef.current = true;
        setDragState((current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            currentIndex: nextIndex,
          };
        });
      }
    }

    function handleWindowMouseUp() {
      const currentDrag = activeDrag;
      setDragState(null);
      if (!currentDrag) {
        return;
      }
      if (!movedRef.current) {
        return;
      }
      const row = findRow(currentDrag.rowId);
      if (!row) {
        return;
      }
      const preview = getRowPreview(row);
      movedRef.current = false;
      suppressEditorOpenRef.current = true;
      // 启用连锁更新处理
      void handleCascadeAfterDrag(row, preview.startDate, preview.endDate);
    }

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, timelineDays.length, timelineRange.start]);

  function startDrag(
    event: React.MouseEvent<HTMLElement>,
    row: TimelineRow,
    mode: DragState['mode'],
  ) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!row.entityKind) {
      return;
    }
    const track = rowTrackRefs[row.id];
    if (!track) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const pointerIndex = Math.max(
      0,
      Math.min(timelineDays.length - 1, Math.floor((event.clientX - rect.left) / DAY_COLUMN_WIDTH)),
    );
    const startIndex = row.startDate ? daysBetween(timelineRange.start, row.startDate) : pointerIndex;
    const endIndex = row.endDate ? daysBetween(timelineRange.start, row.endDate) : pointerIndex;

    movedRef.current = false;
    suppressEditorOpenRef.current = false;
    setSelectedRowId(row.id);
    setDragState({
      anchorIndex: pointerIndex,
      currentIndex: pointerIndex,
      mode,
      originalEndIndex: endIndex,
      originalStartIndex: startIndex,
      rowId: row.id,
    });
    event.preventDefault();
    event.stopPropagation();
  }

  function handleTimelineMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left - SIDEBAR_WIDTH + event.currentTarget.scrollLeft;
    if (relativeX < 0 || relativeX > timelineWidth) {
      setHoverIndex(null);
      return;
    }
    setHoverIndex(
      Math.max(0, Math.min(timelineDays.length - 1, Math.floor(relativeX / DAY_COLUMN_WIDTH))),
    );
  }

  /**
   * 打开依赖管理模态框
   */
  function openDependencyModal(row: TimelineRow) {
    if (!row.entityId || row.entityKind !== 'task') return;
    setDependencyModalState({
      visible: true,
      taskId: row.entityId,
      taskTitle: row.title,
    });
    setNewDependency({
      targetTaskId: null,
      dependencyType: 'FS',
      lagDays: 0,
    });
  }

  /**
   * 创建依赖关系
   */
  async function handleCreateDependency() {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!selectedProjectId || !dependencyModalState?.taskId || !newDependency.targetTaskId) {
      setFeedback({
        message: '请选择后继任务',
        tone: 'danger',
      });
      return;
    }

    if (!onCreateDependency) {
      setFeedback({
        message: '依赖创建功能暂不可用',
        tone: 'danger',
      });
      return;
    }

    setActionLoading(true);
    try {
      await onCreateDependency(selectedProjectId, {
        predecessorTaskId: dependencyModalState.taskId,
        successorTaskId: newDependency.targetTaskId,
        dependencyType: newDependency.dependencyType,
        lagDays: newDependency.lagDays,
      });
      setFeedback({
        message: '依赖关系已创建',
        tone: 'success',
      });
      setDependencyModalState(null);
    } catch (error) {
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * 删除依赖关系
   */
  async function handleDeleteDependency(dependencyId: number) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!selectedProjectId || !onDeleteDependency) return;

    setActionLoading(true);
    try {
      await onDeleteDependency(selectedProjectId, dependencyId);
      setFeedback({
        message: '依赖关系已删除',
        tone: 'success',
      });
    } catch (error) {
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * 获取当前任务的前驱和后继依赖
   */
  function getTaskDependencies(taskId: number) {
    const predecessors = taskDependencies.filter(d => d.successorTaskId === taskId);
    const successors = taskDependencies.filter(d => d.predecessorTaskId === taskId);
    return { predecessors, successors };
  }

  /**
   * 预览连锁日期更新
   */
  async function previewCascadeUpdate(
    taskId: number,
    newPlanStartTime: string | null,
    newPlanEndTime: string | null
  ): Promise<CascadeUpdateResult | null> {
    if (!selectedProjectId) return null;

    try {
      const result = await projectGanttApiClient.request<CommonResult<CascadeUpdateResult>>(
        `/api/project/projects/${selectedProjectId}/dependencies/cascade/preview`,
        {
          method: 'POST',
          body: {
            taskId,
            newPlanStartTime,
            newPlanEndTime,
            apply: false,
          },
        }
      );
      if (result.code === 0) {
        return result.data;
      }
      throw new Error(result.message || '预览失败');
    } catch (error) {
      console.error('预览连锁更新失败:', error);
      return null;
    }
  }

  /**
   * 执行连锁日期更新
   */
  async function applyCascadeUpdate(
    taskId: number,
    newPlanStartTime: string | null,
    newPlanEndTime: string | null
  ): Promise<CascadeUpdateResult | null> {
    if (!selectedProjectId) return null;

    try {
      const result = await projectGanttApiClient.request<CommonResult<CascadeUpdateResult>>(
        `/api/project/projects/${selectedProjectId}/dependencies/cascade/apply`,
        {
          method: 'POST',
          body: {
            taskId,
            newPlanStartTime,
            newPlanEndTime,
            apply: true,
          },
        }
      );
      if (result.code === 0) {
        return result.data;
      }
      throw new Error(result.message || '执行失败');
    } catch (error) {
      console.error('执行连锁更新失败:', error);
      return null;
    }
  }

  /**
   * 处理拖拽完成后的连锁更新
   */
  async function handleCascadeAfterDrag(
    row: TimelineRow,
    startDate: Date | null,
    endDate: Date | null
  ) {
    if (!row.entityId || row.entityKind !== 'task') {
      // 非任务直接保存
      await saveRowSchedule(row, startDate, endDate);
      return;
    }

    // 检查是否有后续依赖任务
    const successors = taskDependencies.filter(
      d => d.predecessorTaskId === row.entityId
    );

    if (successors.length === 0 || !cascadeUpdateEnabled) {
      // 没有后续依赖或未启用连锁更新，直接保存
      await saveRowSchedule(row, startDate, endDate);
      return;
    }

    // 启用连锁更新，先预览
    const newStartTime = formatDateTimeForApi(startDate, 'start');
    const newEndTime = formatDateTimeForApi(endDate, 'end');

    const previewResult = await previewCascadeUpdate(
      row.entityId,
      newStartTime,
      newEndTime
    );

    if (previewResult && previewResult.totalAffectedCount > 0) {
      // 有受影响的任务，显示确认弹窗
      setCascadePreview(previewResult);
      setShowCascadeConfirm(true);
    } else {
      // 没有受影响的任务，直接保存
      await saveRowSchedule(row, startDate, endDate);
    }
  }

  /**
   * 确认并执行连锁更新
   */
  async function confirmCascadeUpdate(
    row: TimelineRow,
    startDate: Date | null,
    endDate: Date | null
  ) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!row.entityId || row.entityKind !== 'task') {
      setShowCascadeConfirm(false);
      setCascadePreview(null);
      return;
    }

    const newStartTime = formatDateTimeForApi(startDate, 'start');
    const newEndTime = formatDateTimeForApi(endDate, 'end');

    setActionLoading(true);
    try {
      // 先保存主任务的日期
      await saveRowSchedule(row, startDate, endDate);

      // 执行连锁更新
      const result = await applyCascadeUpdate(row.entityId, newStartTime, newEndTime);

      if (result) {
        setFeedback({
          message: `计划时间已保存，同时调整了 ${result.totalAffectedCount} 个后续任务的日期`,
          tone: 'success',
        });
      }
    } catch (error) {
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
      setShowCascadeConfirm(false);
      setCascadePreview(null);
    }
  }

  /**
   * 取消连锁更新，仅保存主任务
   */
  async function cancelCascadeUpdate(
    row: TimelineRow,
    startDate: Date | null,
    endDate: Date | null
  ) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    setShowCascadeConfirm(false);
    setCascadePreview(null);
    await saveRowSchedule(row, startDate, endDate);
  }

  async function handleEditorSave() {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!editorState) {
      return;
    }
    const row = findRow(editorState.rowId);
    if (!row) {
      return;
    }
    const startDate = parseInputDate(editorState.startDate);
    const endDate = parseInputDate(editorState.endDate);

    if (!startDate || !endDate) {
      setFeedback({
        message: '请填写开始日期和结束日期。',
        tone: 'danger',
      });
      return;
    }
    if (endDate.getTime() < startDate.getTime()) {
      setFeedback({
        message: '结束日期不能早于开始日期。',
        tone: 'danger',
      });
      return;
    }

    await saveRowSchedule(row, startDate, endDate);
    setEditorState(null);
  }

  async function handleEditorDelete() {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!editorState) {
      return;
    }
    const row = findRow(editorState.rowId);
    if (!row) {
      return;
    }
    await saveRowSchedule(row, null, null);
    setEditorState(null);
  }

  async function handleQuickDelete(row: TimelineRow) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    await saveRowSchedule(row, null, null);
    if (selectedRowId === row.id) {
      setSelectedRowId(null);
    }
  }

  function handleQuickCreate(row: TimelineRow) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    const defaultStart = parseDateValue(selectedProject?.planStartTime) ?? timelineRange.start;
    const defaultEnd = row.startDate ?? addDays(defaultStart, 2);
    openEditor(row, row.startDate ?? defaultStart, row.endDate ?? defaultEnd);
  }

  const hoverDate =
    hoverIndex === null ? null : addDays(timelineRange.start, hoverIndex);
  const currentDate =
    currentLineIndex === null ? null : addDays(timelineRange.start, currentLineIndex);
  const currentDayId = currentDate
    ? `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
    : null;
  const currentMonth = currentDate ? currentDate.getMonth() + 1 : null;

  if (!selectedProjectId || !selectedProject) {
    return (
      <Card className="rounded-[14px] border border-slate-200/80 p-5 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.24)]">
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-400">
            排期协同
          </div>
          <div className="theme-text-strong text-[22px] font-bold">
            先选择一个项目，再进入排期协同工作区。
          </div>
          <div className="theme-text-muted max-w-2xl text-sm leading-6">
            这里会展示项目节点、任务树、时间轴和依赖关系。当前还没有选中项目，所以暂时无法进入图形化排期界面。
          </div>
          <div className="flex gap-3">
            <Button onClick={onOpenProjectManagement}>去项目管理页选择项目</Button>
            <Button onClick={onOpenProgressConfig} tone="ghost">
              查看里程碑模板
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* 主内容区域 */}
      <div className={`relative flex min-h-0 flex-1 transition-all duration-300 ${(detailPanel.visible || teamPanelVisible) ? 'mr-[420px]' : ''}`}>
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[#d9e7f7] bg-white shadow-[0_16px_36px_-30px_rgba(15,23,42,0.35)]">
          <div className="flex min-h-[132px] items-start justify-between gap-4 border-b border-[#d9e7f7] px-5 py-5">
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">
                项目 <span className="mx-2 text-slate-300">/</span> 项目控制
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-[26px] font-bold leading-none text-slate-900">排期协同</h1>
                <span className="rounded-[6px] border border-sky-100 bg-sky-50 px-2 py-1 text-xs font-semibold text-[var(--portal-color-brand-600)]">
                  项目控制
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                承接管理员排期、节点任务搭建、分配与甘特调整。
              </p>
            </div>
            <button
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-[8px] border border-[#d9e7f7] bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.38)] transition hover:border-slate-300 hover:text-slate-900"
              onClick={onExitSystem}
              type="button"
            >
              返回系统选择
            </button>
          </div>

          <div className="flex min-h-[160px] bg-white">
            <div className="flex w-[230px] shrink-0 items-center border-r border-[#edf2f8] px-5">
              <div>
                <div className="flex items-end gap-1.5">
                  <div className="text-[30px] font-bold leading-none text-slate-900">
                    {completionRate}
                  </div>
                  <div className="pb-0.5 text-[18px] font-semibold text-slate-400">%</div>
                </div>
                <div className="mt-2 text-sm text-slate-500">整体完成率</div>
              </div>
            </div>

            <div className="flex min-w-[260px] flex-[1.05] items-center border-r border-[#edf2f8] px-5">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-400">当前项目</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="truncate text-[18px] font-bold text-slate-900">
                    {selectedProject.projectName}
                  </div>
                  <span className="rounded-[6px] bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                    {selectedProject.projectCode}
                  </span>
                  <span
                    className={`rounded-[6px] border px-2 py-1 text-[11px] font-semibold ${
                      canManageProjectSchedule
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {canManageProjectSchedule ? '可编辑' : '只读'}
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  先确认项目范围和排期状态，再进入节点、任务和依赖维护。
                </div>
              </div>
            </div>

            <div className="flex min-w-[280px] flex-1 items-center border-r border-[#edf2f8] px-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  任务统计
                </div>
                <div className="mt-4 flex gap-4">
                  <div>
                    <div className="flex items-end gap-1">
                      <div className="text-[28px] font-bold leading-none text-slate-900">
                        {statistics?.completedTaskCount ?? 0}
                      </div>
                      <div className="pb-0.5 text-xs text-slate-500">项</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">已完成任务</div>
                  </div>
                  <div>
                    <div className="flex items-end gap-1">
                      <div className="text-[28px] font-bold leading-none text-slate-900">
                        {Math.max(0, (statistics?.taskCount ?? tasks.length) - (statistics?.completedTaskCount ?? 0))}
                      </div>
                      <div className="pb-0.5 text-xs text-slate-500">项</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">未完成任务</div>
                  </div>
                  <div>
                    <div className="flex items-end gap-1">
                      <div className="text-[28px] font-bold leading-none text-rose-500">
                        {statistics?.inProgressTaskCount ?? 0}
                      </div>
                      <div className="pb-0.5 text-xs text-slate-500">项</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">进行中任务</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-w-[260px] flex-1 items-center px-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  时间对比
                </div>
                <div className="mt-4 flex gap-4">
                  <div>
                    <div className="text-[26px] font-bold leading-none text-slate-900">
                      {formatMonthDay(plannedFinish)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">计划完成时间</div>
                  </div>
                  <div>
                    <div className="text-[26px] font-bold leading-none text-amber-500">
                      {formatMonthDay(predictedFinish)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">预计完成时间</div>
                  </div>
                  <div>
                    <div className="flex items-end gap-1">
                      <div className="text-[26px] font-bold leading-none text-amber-500">
                        {deviationDays === null ? '--' : `${deviationDays > 0 ? '+' : ''}${deviationDays}`}
                      </div>
                      <div className="pb-0.5 text-xs text-slate-500">天</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">时间偏差</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-[124px] shrink-0 flex-col justify-center gap-2 px-4">
              <button
                className="flex h-10 items-center justify-between gap-2 rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!canManageProjectSchedule}
                onClick={openTeamPanel}
                type="button"
              >
                项目团队
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">
                  {members.length}
                </span>
              </button>
              <button
                className="flex h-10 items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                onClick={onOpenProgressConfig}
                type="button"
              >
                里程碑模板
              </button>
              {taskDependencies && taskDependencies.length > 0 ? (
                <button
                  className={`flex h-9 items-center justify-center rounded-[8px] border text-xs font-semibold transition ${
                    cascadeUpdateEnabled
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                  onClick={() => {
                    setCascadeUpdateEnabled(!cascadeUpdateEnabled);
                  }}
                  type="button"
                >
                  {cascadeUpdateEnabled ? '连锁已开启' : '连锁'}
                </button>
              ) : null}
            </div>
          </div>
        <div className="flex h-14 border-y border-[#d9e7f7] bg-[linear-gradient(180deg,#f8fbff_0%,#f1f6fd_100%)]">
          <div
            className="flex items-center gap-2 border-r border-[#d9e7f7] bg-[linear-gradient(180deg,#f5f9ff_0%,#eef4fc_100%)] px-4"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <div className="flex h-9 min-w-0 flex-[1.5] items-center gap-1 rounded-xl border border-[#d6e4f4] bg-white/95 px-2.5 text-xs font-medium text-slate-600 shadow-[0_6px_16px_-12px_rgba(15,23,42,0.45)]">
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">{selectedProject.projectName}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            <div className="flex h-9 min-w-[88px] flex-[0.9] items-center justify-between gap-1 rounded-xl border border-[#d6e4f4] bg-white/95 px-2.5 text-xs font-medium text-slate-600 shadow-[0_6px_16px_-12px_rgba(15,23,42,0.45)]">
              <span className="whitespace-nowrap">{projectTypes.length} 个类型</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            <button
              className="ml-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#d6e4f4] bg-white/95 text-slate-500 shadow-[0_6px_16px_-12px_rgba(15,23,42,0.45)] transition-colors hover:text-slate-700"
              type="button"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <div
              className="no-scrollbar relative h-full overflow-x-auto overflow-y-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eff5fd_100%)]"
              ref={(element: HTMLDivElement | null) => {
                axisRef.current = element;
              }}
            >
              <div className="pointer-events-none absolute left-0 top-0 z-0" style={{ width: timelineWidth, height: 56 }}>
                {timelineDays.map((day, index) => {
                  const dayOfWeek = getDayOfWeek(new Date(day.date));
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  return isWeekend ? (
                    <div
                      key={`header-weekend-${day.id}`}
                      className="absolute top-0 h-full border-r border-amber-100 bg-[linear-gradient(180deg,rgba(255,244,214,0.85)_0%,rgba(255,248,234,0.72)_100%)]"
                      style={{ left: index * DAY_COLUMN_WIDTH, width: DAY_COLUMN_WIDTH }}
                    />
                  ) : null;
                })}
              </div>
              {hoverIndex !== null ? (
                <div
                  className="pointer-events-none absolute left-0 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-sky-700 shadow-sm"
                  style={{ left: hoverIndex * DAY_COLUMN_WIDTH + DAY_COLUMN_WIDTH / 2 }}
                >
                  {formatMonthDay(hoverDate)}
                </div>
              ) : currentLineIndex !== null ? (
                <div
                  className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-100 bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-sky-600 shadow-sm"
                  style={{ left: currentLineIndex * DAY_COLUMN_WIDTH + DAY_COLUMN_WIDTH / 2 }}
                >
                  {formatMonthDay(currentDate)}
                </div>
              ) : null}

              <div className="relative z-10 flex h-full flex-col" style={{ width: timelineWidth }}>
                <div
                  className="grid h-7 border-b border-[#d9e7f7]"
                  style={{ gridTemplateColumns: `repeat(${timelineDays.length}, ${DAY_COLUMN_WIDTH}px)` }}
                >
                  {monthGroups.map((group, index) => (
                    <div
                      key={`month-${group.month}-${index}`}
                      className={`theme-text-soft border-r border-[#d9e7f7] px-2 text-xs font-bold leading-7 ${
                        currentMonth === group.month ? 'bg-[#e7f1ff] text-sky-700' : ''
                      }`}
                      style={{ gridColumn: `span ${group.count}` }}
                    >
                      {group.month}月
                    </div>
                  ))}
                </div>
                <div
                  className="grid h-7"
                  style={{ gridTemplateColumns: `repeat(${timelineDays.length}, ${DAY_COLUMN_WIDTH}px)` }}
                >
                  {timelineDays.map((day) => {
                    const dayOfWeek = getDayOfWeek(new Date(day.date));
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <div
                        key={day.id}
                        className={`relative border-r border-[#d9e7f7] text-center text-xs leading-7 ${
                          currentDayId === day.id
                            ? 'bg-[#cfe3ff] font-bold text-sky-700 shadow-[inset_0_-1px_0_0_#93c5fd]'
                            : isWeekend
                              ? 'bg-amber-50/75 font-semibold text-amber-600'
                              : 'theme-text-soft'
                        }`}
                      >
                        {isWeekend ? (
                          <span className="absolute left-1 top-1 rounded-full bg-amber-100 px-1 py-0 text-[9px] leading-none text-amber-600">
                            休
                          </span>
                        ) : null}
                        {day.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="no-scrollbar relative min-h-0 flex-1 overflow-auto"
          onMouseLeave={() => {
            setHoverIndex(null);
          }}
          onMouseMove={handleTimelineMouseMove}
          onScroll={syncAxisScroll}
          ref={(element: HTMLDivElement | null) => {
            bodyRef.current = element;
          }}
        >
          <div
            className="relative flex min-h-full"
            style={{ minWidth: SIDEBAR_WIDTH + timelineWidth }}
          >
            <div
              className="sticky left-0 top-0 z-20 min-h-full flex-shrink-0 border-r border-black/5 bg-white"
              style={{ width: SIDEBAR_WIDTH }}
            >
              <div
                className="flex items-center gap-2 border-b border-[#d9e4f5] bg-white/95 px-4 py-3"
                style={{ height: SIDEBAR_SEARCH_BAND_HEIGHT }}
              >
                <input
                  className="theme-input h-10 min-w-0 flex-1 rounded-2xl px-4 text-sm shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchKeyword(event.target.value);
                  }}
                  placeholder="搜索节点或任务"
                  value={searchKeyword}
                />
                <button
                  className="flex h-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#d6e4f4] bg-white px-3.5 text-xs font-semibold text-sky-600 shadow-[0_6px_16px_-12px_rgba(15,23,42,0.45)] transition-colors hover:border-sky-200 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!selectedProjectId || actionLoading || !canManageProjectSchedule}
                  onClick={() => {
                    openCreateDialog('node', null, true);
                  }}
                  title={canManageProjectSchedule ? '新增一级节点' : '当前账号在排期协同中为只读'}
                  type="button"
                >
                  新增一级节点
                </button>
              </div>

              {visibleRows.map((row) => {
                const isSelected = selectedRowId === row.id;
                if (row.rowType === 'category') {
                  return (
                    <button
                      key={row.id}
                      className="flex w-full items-center gap-2 border-b border-[#d9e4f5] bg-[#f3f7fe] px-4 text-left transition-colors hover:bg-[#eaf1fc]"
                      onClick={() => {
                        setSelectedRowId(row.id);
                        toggleExpand(row.id);
                      }}
                      style={{ height: CATEGORY_ROW_HEIGHT }}
                      type="button"
                    >
                      {(expandedMap[row.id] ?? true) ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <CategoryMark />
                      <span className="theme-text-strong min-w-0 flex-1 truncate pr-2 text-xs font-semibold">{row.title}</span>
                      <span className="ml-auto flex items-center gap-1">
                        {row.entityId ? (
                          <>
                            <span
                              className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:border-sky-200 hover:text-sky-600"
                              onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                                openCreateDialog('node', row);
                              }}
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              子项
                            </span>
                            <span
                              className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:border-violet-200 hover:text-violet-600"
                              onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                                openCreateDialog('task', row);
                              }}
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              任务
                            </span>
                            <span
                              className="rounded-full border border-rose-100 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-rose-500 transition-colors hover:border-rose-200 hover:text-rose-600"
                              onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                                void handleDeleteRow(row);
                              }}
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              删除
                            </span>
                          </>
                        ) : null}
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500">
                          {row.count ?? 0}
                        </span>
                      </span>
                    </button>
                  );
                }

                if (row.rowType === 'subCategory') {
                  return (
                    <button
                      key={row.id}
                      className={`group relative flex w-full items-center gap-2 border-b border-[#e5edf8] px-4 pl-6 text-left transition-colors ${
                        isSelected
                          ? 'bg-[#eef6ff] shadow-[inset_3px_0_0_0_#60a5fa]'
                          : 'bg-[#fbfdff] hover:bg-[#f4f8fe]'
                      }`}
                      onClick={() => {
                        setSelectedRowId(row.id);
                        toggleExpand(row.id);
                      }}
                      style={{ height: SUB_CATEGORY_ROW_HEIGHT }}
                      type="button"
                    >
                      <span className="absolute left-4 top-0 h-full w-px bg-[#d9e6f7]" />
                      {(expandedMap[row.id] ?? true) ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <SubCategoryMark />
                      <span className="theme-text-muted min-w-0 flex-1 truncate pr-2 text-xs">{row.title}</span>
                      <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <span
                          className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:border-sky-200 hover:text-sky-600"
                          onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                            openCreateDialog('node', row);
                          }}
                          onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          子项
                        </span>
                        <span
                          className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:border-violet-200 hover:text-violet-600"
                          onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                            openCreateDialog('task', row);
                          }}
                          onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          任务
                        </span>
                        <span
                          className="rounded-full border border-rose-100 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-rose-500 transition-colors hover:border-rose-200 hover:text-rose-600"
                          onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                            void handleDeleteRow(row);
                          }}
                          onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          删除
                        </span>
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 transition-colors group-hover:bg-slate-200">
                        {row.count ?? 0}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={row.id}
                    className={`group relative flex w-full items-center gap-3 border-b border-[#e9eff8] px-4 pl-10 pr-14 text-left transition-colors ${
                      isSelected
                        ? 'bg-[#f6f1ff] shadow-[inset_3px_0_0_0_#8b5cf6]'
                        : 'bg-[#fbfdff] hover:bg-[#f7faff]'
                    }`}
                    onClick={() => {
                      setSelectedRowId(row.id);
                    }}
                    style={{ height: TASK_ROW_HEIGHT }}
                    type="button"
                  >
                    {(() => {
                      const taskDisplayMeta = getTaskDisplayMeta(row);
                      const compactMeta = [
                        taskDisplayMeta.assignmentStatusLabel,
                        row.owner ? `负责人:${row.owner}` : null,
                      ].filter(Boolean).join(' · ');
                      return (
                        <>
                          <span className="absolute left-4 top-0 h-full w-px bg-[#e4ecf8]" />
                          <span className="absolute left-4 top-1/2 h-px w-4 -translate-y-1/2 bg-[#e4ecf8]" />
                          <TaskMark active={isSelected} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-slate-600">{row.title}</span>
                            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-slate-400">
                              <span className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${taskDisplayMeta.assignmentToneClassName}`}>
                                {taskDisplayMeta.assignmentStatusLabel}
                              </span>
                              <span className="min-w-0 truncate">{compactMeta}</span>
                            </span>
                          </span>
                          <span className={`absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-white/92 px-1.5 py-1 shadow-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <Hand
                              className="h-3.5 w-3.5 text-sky-400"
                              onClick={(event: React.MouseEvent<SVGSVGElement>) => {
                                event.stopPropagation();
                                void openQuickAssign(row);
                              }}
                            />
                            <Plus
                              className="h-3.5 w-3.5 text-slate-400"
                              onClick={(event: React.MouseEvent<SVGSVGElement>) => {
                                event.stopPropagation();
                                handleQuickCreate(row);
                              }}
                            />
                            <Trash2
                              className="h-3.5 w-3.5 text-rose-400"
                              onClick={(event: React.MouseEvent<SVGSVGElement>) => {
                                event.stopPropagation();
                                void handleDeleteRow(row);
                              }}
                            />
                          </span>
                        </>
                      );
                    })()}
                  </button>
                );
              })}
            </div>

            <div className="relative flex-1 bg-[#fbfdff]">
              <div className="pointer-events-none absolute inset-0 z-0">
                {timelineDays.map((day, index) => (
                  <div
                    key={`grid-${day.id}`}
                    className="absolute inset-y-0 border-r border-[#dfeafb]"
                    style={{ left: index * DAY_COLUMN_WIDTH, width: DAY_COLUMN_WIDTH }}
                  />
                ))}
              </div>
              {currentLineIndex !== null ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-0 bg-sky-500/[0.06]"
                  style={{
                    left: currentLineIndex * DAY_COLUMN_WIDTH,
                    width: DAY_COLUMN_WIDTH,
                  }}
                />
              ) : null}
              {hoverIndex !== null ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-30 border-l border-sky-400"
                  style={{ left: hoverIndex * DAY_COLUMN_WIDTH }}
                />
              ) : currentLineIndex !== null ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-20 border-l border-sky-500"
                  style={{ left: currentLineIndex * DAY_COLUMN_WIDTH }}
                />
              ) : null}

              <div style={{ width: timelineWidth }}>
                <div
                  className="border-b border-[#d9e4f5] bg-white/55"
                  style={{ height: SIDEBAR_SEARCH_BAND_HEIGHT }}
                />
                {visibleRows.map((row) => {
                  const rowHeight = getRowHeight(row);
                  const preview = getRowPreview(row);
                  const hasBar = Boolean(preview.startDate && preview.endDate && row.entityKind);
                  const isSelected = selectedRowId === row.id;
                  const palette = getBarPalette(row);
                  const left =
                    preview.startDate && hasBar
                      ? daysBetween(timelineRange.start, preview.startDate) * DAY_COLUMN_WIDTH
                      : 0;
                  const width =
                    preview.startDate && preview.endDate && hasBar
                      ? (daysBetween(preview.startDate, preview.endDate) + 1) * DAY_COLUMN_WIDTH
                      : 0;
                  const taskDisplayMeta = getTaskDisplayMeta(row);
                  const isMicroBar = width < 44;
                  const showInlineTitle = width >= 64;
                  const showStatusInline = row.entityKind === 'task' && width >= 118;
                  const showProgressBadge = width >= 96;
                  const showOwnerInline = Boolean(row.owner) && width >= 158;
                  const showDateRange = width >= 202;
                  const showRoleInline = Boolean(taskDisplayMeta.ownerRoleName) && width >= 246;
                  const showParticipantInline = Boolean(taskDisplayMeta.participantLabel) && width >= 292;
                  const showAssignAction = row.entityKind === 'task' && width >= 136;
                  const overflowSegments = [
                    !showInlineTitle ? row.title : null,
                    row.entityKind === 'task' && !showStatusInline ? taskDisplayMeta.assignmentStatusLabel : null,
                    !showOwnerInline && row.owner ? `负责人:${row.owner}` : null,
                    !showRoleInline && taskDisplayMeta.ownerRoleName ? taskDisplayMeta.ownerRoleName : null,
                    !showParticipantInline && taskDisplayMeta.participantLabel ? taskDisplayMeta.participantLabel : null,
                    !showDateRange && preview.startDate && preview.endDate
                      ? `${formatShortMonthDay(preview.startDate)}-${formatShortMonthDay(preview.endDate)}`
                      : null,
                  ].filter(Boolean) as string[];
                  const showExternalLabel = overflowSegments.length > 0;
                  const externalLabelWidth = Math.min(220, Math.max(96, overflowSegments.join(' · ').length * 7));
                  const externalLabelLeft =
                    left + width + externalLabelWidth + 8 <= timelineWidth
                      ? left + width + 6
                      : Math.max(4, left - externalLabelWidth - 6);

                  return (
                    <div
                      key={`${row.id}-timeline`}
                      className={`group/row relative border-b border-black/5 ${
                        row.rowType === 'category'
                          ? 'bg-[#f7faff]'
                          : row.rowType === 'subCategory'
                            ? 'bg-[#fcfdff]'
                            : 'bg-white hover:bg-[#f8fbff]'
                      }`}
                      style={{ height: rowHeight }}
                    >
                      {/* 周末背景层 */}
                      {timelineDays.map((day, index) => {
                        const dow = getDayOfWeek(new Date(day.date));
                        const isWeekend = dow === 0 || dow === 6;
                        return isWeekend ? (
                          <div
                            key={`${row.id}-weekend-${day.id}`}
                            className="pointer-events-none absolute inset-y-0 bg-[#fef9f0] opacity-60"
                            style={{ left: index * DAY_COLUMN_WIDTH, width: DAY_COLUMN_WIDTH }}
                          />
                        ) : null;
                      })}
                      {/* 网格线 */}
                      {timelineDays.map((day, index) => (
                        <div
                          key={`${row.id}-${day.id}`}
                          className="pointer-events-none absolute inset-y-0 border-r border-[#dfeafb]"
                          style={{ left: index * DAY_COLUMN_WIDTH, width: DAY_COLUMN_WIDTH }}
                        />
                      ))}

                      {row.entityKind && row.entityId ? (
                        <div
                          className="absolute inset-0"
                          onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
                            if (event.target !== event.currentTarget) {
                              return;
                            }
                            startDrag(event, row, 'create');
                          }}
                          ref={(element: HTMLDivElement | null) => {
                            rowTrackRefs[row.id] = element;
                          }}
                        />
                      ) : null}

                      {hasBar ? (
                        <>
                        <button
                          className={`group/task absolute top-1/2 z-10 h-6 -translate-y-1/2 overflow-hidden rounded-[6px] border border-l-[3px] text-left shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-[filter,box-shadow] hover:brightness-[1.03] ${
                            isMicroBar ? 'px-1' : 'px-2'
                          }`}
                          onDoubleClick={() => {
                            openDetailPanel(row);
                          }}
                          onClick={() => {
                            setSelectedRowId(row.id);
                          }}
                          onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
                            if (event.detail === 1) {
                              startDrag(event, row, 'move');
                            }
                          }}
                          style={{
                            backgroundColor: palette.fill,
                            borderColor: palette.border,
                            borderLeftColor: palette.border,
                            boxShadow: isSelected ? `0 0 0 2px ${palette.border}40` : undefined,
                            left,
                            width,
                          }}
                          title={row.entityKind === 'task' ? taskDisplayMeta.assignmentTooltip : row.title}
                          type="button"
                        >
                          <span
                            className="pointer-events-none absolute inset-y-0 left-0"
                            style={{
                              backgroundColor: palette.progress,
                              width: `${normalizeProgress(row.progress)}%`,
                            }}
                          />

                          <span
                            className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize opacity-0 transition-opacity group-hover/task:opacity-100 hover:bg-white/20"
                            onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                              startDrag(event, row, 'resize-start');
                            }}
                          />
                          <span
                            className="absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize opacity-0 transition-opacity group-hover/task:opacity-100 hover:bg-white/20"
                            onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                              startDrag(event, row, 'resize-end');
                            }}
                          />

                          <div
                            className={`relative z-10 flex h-full min-w-0 flex-nowrap items-center overflow-hidden ${
                              isMicroBar
                                ? 'justify-center gap-1'
                                : 'gap-1.5'
                            }`}
                          >
                            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-white/80" />
                            {row.entityKind === 'task' ? (
                              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${taskDisplayMeta.assignmentDotClassName}`} />
                            ) : null}
                            {showInlineTitle ? (
                              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[11px] font-medium text-slate-700">
                                {row.title}
                              </span>
                            ) : null}
                            {showStatusInline ? (
                              <span className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${taskDisplayMeta.assignmentToneClassName}`}>
                                {taskDisplayMeta.assignmentStatusLabel}
                              </span>
                            ) : null}
                            {showOwnerInline ? (
                              <span className="hidden shrink-0 whitespace-nowrap rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-slate-500 lg:inline">
                                {row.owner}
                              </span>
                            ) : null}
                            {showRoleInline ? (
                              <span className="hidden shrink-0 whitespace-nowrap rounded bg-indigo-50/90 px-1.5 py-0.5 text-[10px] text-indigo-600 xl:inline">
                                {taskDisplayMeta.ownerRoleName}
                              </span>
                            ) : null}
                            {showParticipantInline ? (
                              <span className="hidden shrink-0 whitespace-nowrap rounded bg-slate-100/90 px-1.5 py-0.5 text-[10px] text-slate-500 2xl:inline">
                                {taskDisplayMeta.participantLabel}
                              </span>
                            ) : null}
                            {showAssignAction ? (
                              <span
                                className="shrink-0 cursor-pointer whitespace-nowrap rounded bg-white/75 px-1.5 py-0.5 text-[10px] text-sky-600 opacity-0 transition-opacity group-hover/task:opacity-100"
                                onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                  event.stopPropagation();
                                }}
                                onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                                  event.stopPropagation();
                                  void openQuickAssign(row);
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                分配
                              </span>
                            ) : null}
                            {showProgressBadge ? (
                              <span className={`shrink-0 whitespace-nowrap rounded bg-white/70 px-1.5 py-0.5 text-[10px] ${palette.badge}`}>
                                {normalizeProgress(row.progress)}%
                              </span>
                            ) : null}
                            {showDateRange ? (
                              <span className="hidden shrink-0 whitespace-nowrap text-[10px] text-slate-500 md:inline">
                                {formatShortMonthDay(preview.startDate)}-{formatShortMonthDay(preview.endDate)}
                              </span>
                            ) : null}
                          </div>
                        </button>
                        {showExternalLabel ? (
                          <div
                            className={`pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 transition-opacity ${
                              isSelected ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
                            }`}
                            style={{
                              left: externalLabelLeft,
                              maxWidth: externalLabelWidth,
                            }}
                          >
                            <span className="block truncate rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]">
                              {overflowSegments.join(' · ')}
                            </span>
                          </div>
                        ) : null}
                        </>
                      ) : row.entityKind ? (
                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-xs text-slate-300">
                          拖拽空白区域创建计划时间
                        </div>
                      ) : null}

                      {row.entityKind && row.startDate && row.endDate ? (
                        <button
                          className="absolute right-2 top-1/2 z-20 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-300 opacity-0 shadow-sm transition-all hover:text-rose-500 group-hover/row:opacity-100"
                          onClick={() => {
                            void handleQuickDelete(row);
                          }}
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}

                {/* 依赖连线SVG层 */}
                {dependencyLines.length > 0 && (
                  <svg
                    className="pointer-events-none absolute left-0 top-0"
                    style={{
                      width: timelineWidth,
                      height: visibleRows.reduce((sum, row) => sum + getRowHeight(row), 0),
                      overflow: 'visible',
                    }}
                    viewBox={`0 0 ${timelineWidth} ${visibleRows.reduce((sum, row) => sum + getRowHeight(row), 0)}`}
                  >
                    <defs>
                      {Object.entries(DEPENDENCY_TYPE_CONFIG).map(([type, config]) => (
                        <g key={`marker-${type}`}>
                          <marker
                            id={`arrow-${type}-normal`}
                            markerWidth="10"
                            markerHeight="10"
                            refX="9"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                          >
                            <path d="M0,0 L0,6 L9,3 z" fill={config.color} />
                          </marker>
                          <marker
                            id={`arrow-${type}-hover`}
                            markerWidth="12"
                            markerHeight="12"
                            refX="11"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                          >
                            <path d="M0,0 L0,7 L11,3.5 z" fill={config.color} />
                          </marker>
                        </g>
                      ))}
                    </defs>
                    {dependencyLines.map((line) => {
                      const config = DEPENDENCY_TYPE_CONFIG[line.dependencyType];
                      const isHovered = hoveredDependencyId === line.id;
                      return (
                        <g
                          key={line.id}
                          className="pointer-events-auto cursor-pointer"
                          onMouseEnter={() => setHoveredDependencyId(line.id)}
                          onMouseLeave={() => setHoveredDependencyId(null)}
                        >
                          {/* 可点击区域（更宽的透明线） */}
                          <path
                            d={generateDependencyPath(line.from, line.to)}
                            stroke="transparent"
                            strokeWidth={12}
                            fill="none"
                          />
                          {/* 实际连线 */}
                          <path
                            d={generateDependencyPath(line.from, line.to)}
                            stroke={config.color}
                            strokeWidth={isHovered ? 2.5 : 1.5}
                            strokeDasharray={isHovered ? 'none' : '5,3'}
                            fill="none"
                            markerEnd={`url(#arrow-${line.dependencyType}-${isHovered ? 'hover' : 'normal'})`}
                            opacity={isHovered ? 1 : 0.7}
                          />
                          {/* 悬停时显示信息 */}
                          {isHovered && (
                            <g transform={`translate(${(line.from.x + line.to.x) / 2 - 60}, ${(line.from.y + line.to.y) / 2 - 30})`}>
                              <rect
                                x="0"
                                y="0"
                                width="120"
                                height="26"
                                rx="4"
                                fill="white"
                                stroke={config.color}
                                strokeWidth="1"
                                opacity="0.95"
                              />
                              <text
                                x="60"
                                y="16"
                                textAnchor="middle"
                                fontSize="11"
                                fill="#475569"
                              >
                                {config.label}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

      {createDraft ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm"
          onClick={() => {
            if (!actionLoading) {
              setCreateDraft(null);
            }
          }}
        >
          <Card
            className="w-full max-w-[420px] rounded-[28px] p-5"
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="theme-text-soft text-xs font-semibold">
                  {createDraft.mode === 'node' ? '节点新增' : '任务新增'}
                </div>
                <div className="theme-text-strong mt-2 text-[22px] font-bold">
                  {createDraft.mode === 'node'
                    ? createDraft.parentNodeId
                      ? '新增子节点'
                      : '新增一级节点'
                    : '新增任务'}
                </div>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/8 text-slate-400 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={actionLoading}
                onClick={() => {
                  setCreateDraft(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="theme-text-soft text-xs font-semibold">
                  {createDraft.mode === 'node' ? '名称' : '标题'}
                </div>
                <input
                  className="theme-input mt-2 h-11 w-full rounded-2xl px-4 text-sm"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setCreateDraft((current) => (current ? { ...current, title: event.target.value } : current));
                  }}
                  placeholder={createDraft.mode === 'node' ? '请输入节点名称' : '请输入任务标题'}
                  value={createDraft.title}
                />
              </div>

              <div>
                <div className="theme-text-soft text-xs font-semibold">编码</div>
                <input
                  className="theme-input mt-2 h-11 w-full rounded-2xl px-4 text-sm"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setCreateDraft((current) => (current ? { ...current, code: event.target.value } : current));
                  }}
                  placeholder="可不填，系统自动生成"
                  value={createDraft.code}
                />
              </div>

              {createDraft.mode === 'task' ? (
                <div>
                  <div className="theme-text-soft text-xs font-semibold">任务内容</div>
                  <textarea
                    className="theme-input mt-2 min-h-[110px] w-full rounded-2xl px-4 py-3 text-sm"
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setCreateDraft((current) => (current ? { ...current, content: event.target.value } : current));
                    }}
                    placeholder="请输入任务内容"
                    value={createDraft.content}
                  />
                </div>
              ) : null}

              <div>
                <div className="theme-text-soft text-xs font-semibold">备注</div>
                <textarea
                  className="theme-input mt-2 min-h-[96px] w-full rounded-2xl px-4 py-3 text-sm"
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setCreateDraft((current) => (current ? { ...current, remark: event.target.value } : current));
                  }}
                  placeholder="可选备注"
                  value={createDraft.remark}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setCreateDraft(null);
                }}
                tone="ghost"
              >
                取消
              </Button>
              <Button
                disabled={actionLoading}
                onClick={() => {
                  void handleSaveCreateDraft();
                }}
              >
                {actionLoading ? '保存中...' : '保存'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {editorState ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[4px]"
          onClick={() => {
            setEditorState(null);
          }}
        >
          <div
            className="mx-4 w-full max-w-[480px] animate-[fadeIn_0.2s_ease-out,slideUp_0.3s_ease-out]"
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              {/* 标题栏 */}
              <div className="relative bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-5 py-5">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                      <CalendarDays className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-white">计划时间编辑</h2>
                      <p className="text-sm text-white/80 truncate max-w-[280px]">{findRow(editorState.rowId)?.title ?? '设置任务计划时间'}</p>
                    </div>
                  </div>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                    onClick={() => {
                      setEditorState(null);
                    }}
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="px-5 py-5">
                {/* 日期输入卡片 */}
                <div className="mb-5 grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      开始日期
                    </label>
                    <div className="relative">
                      <input
                        className="h-12 w-full cursor-pointer rounded-xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 text-slate-700 transition-all hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          setEditorState((current) =>
                            current
                              ? {
                                  ...current,
                                  startDate: event.target.value,
                                }
                              : current,
                          );
                        }}
                        type="date"
                        value={editorState.startDate}
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      结束日期
                    </label>
                    <div className="relative">
                      <input
                        className="h-12 w-full cursor-pointer rounded-xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 text-slate-700 transition-all hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          setEditorState((current) =>
                            current
                              ? {
                                  ...current,
                                  endDate: event.target.value,
                                }
                              : current,
                          );
                        }}
                        type="date"
                        value={editorState.endDate}
                      />
                    </div>
                  </div>
                </div>

                {/* 快捷操作 */}
                {findRow(editorState.rowId)?.entityKind === 'task' && (
                  <div className="mb-5">
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      依赖管理
                    </label>
                    <button
                      className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3 text-sm font-medium text-violet-600 transition-all hover:border-violet-400 hover:from-violet-100 hover:to-purple-100"
                      onClick={() => {
                        const row = findRow(editorState.rowId);
                        if (row) openDependencyModal(row);
                      }}
                      type="button"
                    >
                      <svg className="h-4 w-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      管理任务依赖关系
                    </button>
                  </div>
                )}

                {/* 提示信息 */}
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200">
                    <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500">
                    设置任务的计划开始和结束时间。如果存在后续依赖任务，可开启「连锁」功能自动调整关联任务日期。
                  </p>
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <button
                    className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      void handleEditorDelete();
                    }}
                    disabled={actionLoading}
                  >
                    <svg className="h-4 w-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    清空时间
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100"
                      onClick={() => {
                        setEditorState(null);
                      }}
                    >
                      取消
                    </button>
                    <button
                      className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        void handleEditorSave();
                      }}
                      disabled={actionLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                      <span className="relative flex items-center gap-2">
                        {actionLoading ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            保存中...
                          </>
                        ) : (
                          <>
                            保存
                            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {quickAssignState.visible ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm"
          onClick={() => {
            if (!quickAssignState.loading) {
              closeQuickAssign();
            }
          }}
        >
          <Card
            className="w-full max-w-[440px] rounded-[28px] p-5"
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="theme-text-soft text-xs font-semibold">任务人员分配</div>
                <div className="theme-text-strong mt-2 text-[22px] font-bold">{quickAssignState.taskTitle}</div>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/8 text-slate-400 transition-colors hover:text-slate-900"
                onClick={() => {
                  closeQuickAssign();
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <div className="theme-text-soft text-xs font-semibold">负责人</div>
                <select
                  className="theme-input mt-2 h-11 w-full rounded-2xl px-4 text-sm"
                  disabled={quickAssignState.loading || members.length === 0}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    const userId = event.target.value || null;
                    const member = members.find((item) => item.userId === userId);
                    setQuickAssignState((current) => ({
                      ...current,
                      participantMembers: current.participantMembers.filter((item) => item.userId !== userId),
                      responsibleName: userId ? (member?.userName ?? userId) : null,
                      responsibleUserId: userId,
                    }));
                  }}
                  value={quickAssignState.responsibleUserId ?? ''}
                >
                  <option value="">未分配</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.userName}{member.roleName ? `（${member.roleName}）` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="theme-text-soft text-xs font-semibold">参与人</div>
                <div className="mt-2 max-h-[220px] space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {members.filter((member) => member.userId !== quickAssignState.responsibleUserId).length ? (
                    members
                      .filter((member) => member.userId !== quickAssignState.responsibleUserId)
                      .map((member) => {
                        const checked = quickAssignState.participantMembers.some((item) => item.userId === member.userId);
                        return (
                          <label
                            key={member.userId}
                            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                              checked
                                ? 'border-sky-200 bg-sky-50 text-sky-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium">{member.userName}</div>
                              <div className="truncate text-xs text-slate-400">{member.roleName ?? member.dutyContent ?? '项目团队成员'}</div>
                            </div>
                            <input
                              checked={checked}
                              className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-300"
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                setQuickAssignState((current) => ({
                                  ...current,
                                  participantMembers: event.target.checked
                                    ? [...current.participantMembers, { userId: member.userId, userName: member.userName }]
                                    : current.participantMembers.filter((item) => item.userId !== member.userId),
                                }));
                              }}
                              type="checkbox"
                            />
                          </label>
                        );
                      })
                  ) : (
                    <div className="py-5 text-center text-sm text-slate-400">暂无可选参与人，请先补充项目团队成员。</div>
                  )}
                </div>
              </div>

              {quickAssignState.participantMembers.length ? (
                <div className="flex flex-wrap gap-2">
                  {quickAssignState.participantMembers.map((member) => (
                    <span key={member.userId} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {member.userName}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400">当前未设置参与人</div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100"
                onClick={() => {
                  closeQuickAssign();
                }}
                type="button"
              >
                取消
              </button>
              <button
                className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition-all hover:shadow-xl hover:shadow-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={quickAssignState.loading}
                onClick={() => {
                  void handleSaveQuickAssign();
                }}
                type="button"
              >
                {quickAssignState.loading ? '保存中...' : '保存分配'}
              </button>
            </div>
          </Card>
        </div>
      ) : null}

      {/* 依赖管理模态框 */}
      {dependencyModalState ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm"
          onClick={() => {
            setDependencyModalState(null);
          }}
        >
          <Card
            className="w-full max-w-[520px] rounded-[28px] p-5"
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="theme-text-soft text-xs font-semibold">
                  任务依赖管理
                </div>
                <div className="theme-text-strong mt-2 text-[22px] font-bold">
                  {dependencyModalState.taskTitle}
                </div>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/8 text-slate-400 transition-colors hover:text-slate-900"
                onClick={() => {
                  setDependencyModalState(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* 现有依赖关系 */}
              <div>
                <div className="theme-text-soft mb-3 text-xs font-semibold">
                  当前依赖关系
                </div>
                {(() => {
                  const deps = getTaskDependencies(dependencyModalState.taskId!);
                  const allDeps = [...deps.predecessors, ...deps.successors];
                  if (allDeps.length === 0) {
                    return (
                      <div className="rounded-xl bg-slate-50 py-5 text-center text-sm text-slate-400">
                        暂无依赖关系
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {/* 前驱任务 */}
                      {deps.predecessors.length > 0 && (
                        <div>
                          <div className="text-xs text-slate-500">前驱任务（该任务依赖于）</div>
                          {deps.predecessors.map(dep => (
                            <div
                              key={`pred-${dep.id}`}
                              className="mt-1 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2"
                            >
                              <div>
                                <span className="text-xs text-blue-600">前驱：</span>
                                <span className="text-sm font-medium text-slate-700">{dep.predecessorTaskTitle}</span>
                                <span className="ml-2 text-xs text-slate-400">({dep.dependencyTypeDesc})</span>
                              </div>
                              <button
                                className="text-xs text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteDependency(dep.id)}
                                type="button"
                              >
                                删除
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 后继任务 */}
                      {deps.successors.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-slate-500">后继任务（依赖该任务）</div>
                          {deps.successors.map(dep => (
                            <div
                              key={`succ-${dep.id}`}
                              className="mt-1 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2"
                            >
                              <div>
                                <span className="text-xs text-green-600">后继：</span>
                                <span className="text-sm font-medium text-slate-700">{dep.successorTaskTitle}</span>
                                <span className="ml-2 text-xs text-slate-400">({dep.dependencyTypeDesc})</span>
                              </div>
                              <button
                                className="text-xs text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteDependency(dep.id)}
                                type="button"
                              >
                                删除
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 添加新依赖 */}
              <div>
                <div className="theme-text-soft mb-3 text-xs font-semibold">
                  添加后继任务依赖
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">选择后继任务</label>
                    <select
                      className="theme-input h-11 w-full rounded-2xl px-4 text-sm"
                      value={newDependency.targetTaskId ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setNewDependency(prev => ({
                          ...prev,
                          targetTaskId: e.target.value ? Number(e.target.value) : null,
                        }));
                      }}
                    >
                      <option value="">请选择后继任务...</option>
                      {tasks
                        .filter(t => t.id !== dependencyModalState.taskId)
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.taskTitle}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">依赖类型</label>
                      <select
                        className="theme-input h-11 w-full rounded-2xl px-4 text-sm"
                        value={newDependency.dependencyType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          setNewDependency(prev => ({
                            ...prev,
                            dependencyType: e.target.value as 'FS' | 'FF' | 'SS' | 'SF',
                          }));
                        }}
                      >
                        <option value="FS">完成-开始 (FS)</option>
                        <option value="FF">完成-完成 (FF)</option>
                        <option value="SS">开始-开始 (SS)</option>
                        <option value="SF">开始-完成 (SF)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">滞后天数</label>
                      <input
                        className="theme-input h-11 w-full rounded-2xl px-4 text-sm"
                        type="number"
                        value={newDependency.lagDays}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setNewDependency(prev => ({
                            ...prev,
                            lagDays: parseInt(e.target.value) || 0,
                          }));
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {DEPENDENCY_TYPE_CONFIG[newDependency.dependencyType].description}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setDependencyModalState(null);
                }}
                tone="ghost"
              >
                关闭
              </Button>
              <Button
                disabled={!newDependency.targetTaskId || actionLoading}
                onClick={() => {
                  void handleCreateDependency();
                }}
              >
                {actionLoading ? '保存中...' : '添加依赖'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {/* 连锁日期更新确认弹窗 */}
      {showCascadeConfirm && cascadePreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[4px]"
          onClick={() => {
            setShowCascadeConfirm(false);
            setCascadePreview(null);
          }}
        >
          <div
            className="mx-4 w-full max-w-[640px] animate-[fadeIn_0.2s_ease-out,slideUp_0.3s_ease-out]"
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              {/* 标题栏 */}
              <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-5 py-5">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-white">连锁日期更新</h2>
                      <p className="text-sm text-white/80">系统将自动调整后续任务的日期</p>
                    </div>
                  </div>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                    onClick={() => {
                      setShowCascadeConfirm(false);
                      setCascadePreview(null);
                    }}
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="px-5 py-5">
                {/* 统计卡片 */}
                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center">
                    <div className="text-[22px] font-bold text-slate-700">{cascadePreview.totalAffectedCount}</div>
                    <div className="text-xs text-slate-500">受影响任务</div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-red-50 to-orange-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-red-600">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {cascadePreview.affectedTasks.filter(t => t.startTimeOffsetDays && t.startTimeOffsetDays > 0).length}
                    </div>
                    <div className="text-xs text-red-600/80">将延后</div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-600">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {cascadePreview.affectedTasks.filter(t => t.startTimeOffsetDays && t.startTimeOffsetDays < 0).length}
                    </div>
                    <div className="text-xs text-emerald-600/80">将提前</div>
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-indigo-50 px-4 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                    <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-sm text-indigo-900">
                    <span className="font-semibold">操作说明：</span>
                    拖拽将影响 <span className="font-bold text-indigo-700">{cascadePreview.totalAffectedCount}</span> 个后续关联任务的日期。
                    选择「确认并更新」将同时调整这些任务的计划时间。
                  </div>
                </div>

                {/* 受影响的任务列表 */}
                <div className="mb-5">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">受影响任务预览</h3>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600">
                      {cascadePreview.affectedTasks.length}
                    </span>
                  </div>
                  <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                    {cascadePreview.affectedTasks.map((affected, index) => (
                      <div
                        key={`affected-${affected.taskId}-${index}`}
                        className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/50 to-indigo-50/0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-500">
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium text-slate-800">
                                  {affected.taskTitle}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${
                                    affected.dependencyType === 'FS' ? 'bg-blue-100 text-blue-700' :
                                    affected.dependencyType === 'FF' ? 'bg-purple-100 text-purple-700' :
                                    affected.dependencyType === 'SS' ? 'bg-green-100 text-green-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}>
                                    {affected.dependencyType}
                                    <span className="text-[10px] opacity-70">
                                      {affected.dependencyType === 'FS' ? '完成-开始' :
                                       affected.dependencyType === 'FF' ? '完成-完成' :
                                       affected.dependencyType === 'SS' ? '开始-开始' : '开始-完成'}
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <svg className="h-3 w-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {affected.predecessorTaskTitle}
                                  </span>
                                  {affected.lagDays !== 0 && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                                      滞后 {affected.lagDays > 0 ? '+' : ''}{affected.lagDays}天
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {affected.originalStartTime && affected.newStartTime && (
                              <div className={`flex items-center gap-1 text-xs font-medium ${
                                affected.startTimeOffsetDays && affected.startTimeOffsetDays !== 0
                                  ? (affected.startTimeOffsetDays > 0 ? 'text-red-500' : 'text-emerald-500')
                                  : 'text-slate-400'
                              }`}>
                                {affected.startTimeOffsetDays && affected.startTimeOffsetDays !== 0 && (
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    {affected.startTimeOffsetDays > 0 ? (
                                      <path d="M12 19V5m0 0l-7 7m7-7l7 7" strokeLinecap="round" strokeLinejoin="round"/>
                                    ) : (
                                      <path d="M12 5v14m0 0l7-7m-7 7l-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                                    )}
                                  </svg>
                                )}
                                开始 {affected.startTimeOffsetDays && affected.startTimeOffsetDays !== 0
                                  ? `${affected.startTimeOffsetDays > 0 ? '+' : ''}${affected.startTimeOffsetDays}天`
                                  : '不变'}
                              </div>
                            )}
                            {affected.originalEndTime && affected.newEndTime && (
                              <div className={`flex items-center gap-1 text-xs font-medium ${
                                affected.endTimeOffsetDays && affected.endTimeOffsetDays !== 0
                                  ? (affected.endTimeOffsetDays > 0 ? 'text-red-500' : 'text-emerald-500')
                                  : 'text-slate-400'
                              }`}>
                                {affected.endTimeOffsetDays && affected.endTimeOffsetDays !== 0 && (
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    {affected.endTimeOffsetDays > 0 ? (
                                      <path d="M12 19V5m0 0l-7 7m7-7l7 7" strokeLinecap="round" strokeLinejoin="round"/>
                                    ) : (
                                      <path d="M12 5v14m0 0l7-7m-7 7l-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                                    )}
                                  </svg>
                                )}
                                结束 {affected.endTimeOffsetDays && affected.endTimeOffsetDays !== 0
                                  ? `${affected.endTimeOffsetDays > 0 ? '+' : ''}${affected.endTimeOffsetDays}天`
                                  : '不变'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    className="group relative flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      const row = findRowByEntityId(cascadePreview.originalTaskId);
                      if (row) {
                        const preview = getRowPreview(row);
                        void cancelCascadeUpdate(row, preview.startDate, preview.endDate);
                      } else {
                        setShowCascadeConfirm(false);
                        setCascadePreview(null);
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <svg className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5m0 0l7 7m-7-7l7-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    仅保存主任务
                  </button>
                  <button
                    className="group relative flex h-11 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      const row = findRowByEntityId(cascadePreview.originalTaskId);
                      if (row) {
                        const preview = getRowPreview(row);
                        void confirmCascadeUpdate(row, preview.startDate, preview.endDate);
                      } else {
                        setShowCascadeConfirm(false);
                        setCascadePreview(null);
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                    <span className="relative flex items-center gap-2">
                      {actionLoading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          更新中...
                        </>
                      ) : (
                        <>
                          确认并更新
                          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14m0 0l-7-7m7 7l-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {teamPanelVisible && selectedProjectId ? (
        <div className="fixed right-0 top-0 z-50 h-full w-[420px] shadow-[-20px_0_60px_rgba(0,0,0,0.15)]">
          <div className="flex h-full flex-col bg-white">
            <div className="relative border-b border-slate-100 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-5">
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-white/80">项目级管理</div>
                  <h2 className="mt-1 text-lg font-bold text-white">项目团队</h2>
                  <div className="mt-1 text-xs text-white/75">
                    先维护项目团队，再在每一步任务上分配负责人和参与人。
                  </div>
                </div>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                  onClick={closeTeamPanel}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <ProjectTeamManager
                members={members}
                projectId={selectedProjectId}
                onAddMember={onCreateMember}
                onDeleteMember={onDeleteMember}
                onUpdateMember={onUpdateMember}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* 任务详情侧边栏 */}
      <GanttDetailPanel
        actionLoading={actionLoading}
        attachments={attachments}
        budgets={budgets}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        detailEditState={detailEditState}
        detailPanel={detailPanel}
        members={members}
        projectId={selectedProjectId ?? 0}
        readOnly={!canManageProjectSchedule}
        row={detailPanel.rowId ? findRow(detailPanel.rowId) : null}
        selectedProjectBudgetAmount={selectedProject?.budgetAmount}
        taskDependencies={taskDependencies}
        onClose={closeDetailPanel}
        onDelete={(row) => {
          void handleDeleteRow(row);
        }}
        onDeleteBudget={(projectId, budgetId) => {
          void onDeleteBudget(projectId, budgetId);
        }}
        onDeleteMember={onDeleteMember}
        onDeleteAttachment={(projectId, attachmentId) => {
          void onDeleteAttachment(projectId, attachmentId);
        }}
        onUploadAttachment={onUploadAttachment}
        onAddMember={onCreateMember}
        onAddBudget={(projectId, budget) => {
          void onCreateBudget(projectId, budget);
        }}
        onSave={handleSaveDetailPanel}
        onTabChange={(tab) => setDetailPanel((prev) => ({ ...prev, activeTab: tab }))}
        onEditStateChange={setDetailEditState}
      />
    </div>
  );
}
