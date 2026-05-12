import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  FolderKanban,
  Hand,
  Link2,
  LoaderCircle,
  Plus,
  Search,
  Settings2,
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
import { getProjectStatusLabel } from './project-display';
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
  SIDEBAR_WIDTH,
  SUB_CATEGORY_ROW_HEIGHT,
  TASK_ROW_HEIGHT,
} from './gantt-types';
import {
  addDays,
  areDatesEqual,
  buildFeedbackMessage,
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

const GANTT_ICON_STROKE_WIDTH = 1.8;
const GANTT_INPUT_CLASS =
  'h-9 w-full rounded-md border border-[#d9e3f1] bg-white px-3 text-[13px] font-medium text-[#263653] outline-none transition focus:border-[#1f7cff] focus:ring-2 focus:ring-[#dceaff]';
const GANTT_TEXTAREA_CLASS =
  'min-h-[92px] w-full rounded-md border border-[#d9e3f1] bg-white px-3 py-2 text-[13px] font-medium leading-6 text-[#263653] outline-none transition focus:border-[#1f7cff] focus:ring-2 focus:ring-[#dceaff]';
const GANTT_FIELD_LABEL_CLASS = 'mb-1.5 block text-[12px] font-medium text-[#6b7f9e]';
const GANTT_CARD_CLASS = 'rounded-lg border border-[#e4ebf5] bg-white p-5 shadow-[0_16px_40px_rgba(24,39,75,0.16)]';
type TimelineScale = 'day' | 'week' | 'month';
const TIMELINE_SCALE_OPTIONS: Array<{
  columnWidth: number;
  label: string;
  title: string;
  value: TimelineScale;
}> = [
  { columnWidth: DAY_COLUMN_WIDTH, label: '日', title: '按日查看', value: 'day' },
  { columnWidth: 34, label: '周', title: '按周密度查看', value: 'week' },
  { columnWidth: 18, label: '月', title: '按月密度查看', value: 'month' },
];
const TIMELINE_SCALE_CONFIG = TIMELINE_SCALE_OPTIONS.reduce(
  (next, option) => ({
    ...next,
    [option.value]: option,
  }),
  {} as Record<TimelineScale, (typeof TIMELINE_SCALE_OPTIONS)[number]>,
);
const TIMELINE_OVERSCAN_PX = 360;
const TIMELINE_MONTH_PADDING = 6;
const DRAG_EDGE_SIZE = 56;
const DRAG_EDGE_MAX_SPEED = 34;

function extendTimelineRangeByMonths(
  range: { end: Date; start: Date },
  paddingMonths = TIMELINE_MONTH_PADDING,
) {
  return {
    end: new Date(range.end.getFullYear(), range.end.getMonth() + paddingMonths + 1, 0),
    start: new Date(range.start.getFullYear(), range.start.getMonth() - paddingMonths, 1),
  };
}

function normalizeDetailEditStateForCompare(state: DetailEditState | null) {
  if (!state) {
    return '';
  }

  return JSON.stringify({
    ...state,
    participantMembers: [...state.participantMembers]
      .map((member) => ({
        userId: member.userId,
        userName: member.userName,
      }))
      .sort((left, right) => left.userId.localeCompare(right.userId)),
    progressRate: Number.isFinite(state.progressRate) ? state.progressRate : 0,
  });
}

function getDragModeLabel(mode: DragState['mode']) {
  if (mode === 'create') {
    return '新增时间节点';
  }
  if (mode === 'move') {
    return '移动计划时间';
  }
  if (mode === 'resize-start') {
    return '调整开始时间';
  }
  return '调整结束时间';
}

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

function formatDemoDate(dayOffset: number, hour: number) {
  const date = new Date(2026, 3, 1 + dayOffset, hour, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} ${String(hour).padStart(2, '0')}:00:00`;
}

function isVirtualTimelineId(id?: number | null) {
  return typeof id === 'number' && id < 0;
}

function shouldKeepLocalScheduleOnSaveError() {
  return Boolean(import.meta.env.DEV);
}

function getTaskStatusToneClassName(status?: string | null) {
  const normalized = (status ?? '').trim().toUpperCase();
  if (normalized.includes('DONE') || normalized.includes('SUCCESS') || normalized.includes('FINISH') || normalized.includes('COMPLETE')) {
    return 'bg-emerald-50 text-emerald-600';
  }
  if (normalized.includes('RUNNING') || normalized.includes('PROGRESS') || normalized.includes('PROCESS')) {
    return 'bg-sky-50 text-sky-600';
  }
  if (normalized.includes('RISK') || normalized.includes('ERROR') || normalized.includes('STOP') || normalized.includes('REJECTED')) {
    return 'bg-rose-50 text-rose-600';
  }
  return 'bg-slate-100 text-slate-500';
}

function getTaskShortName(title: string) {
  const compactTitle = title.trim().replace(/\s+/g, '');
  const chars = Array.from(compactTitle || title.trim());
  if (chars.length <= 8) {
    return chars.join('');
  }
  return `${chars.slice(0, 8).join('')}...`;
}

const TASK_STATUS_LEGEND_ITEMS = [
  { border: '#94a3b8', fill: 'rgba(100,116,139,0.16)', label: '未开始' },
  { border: '#0ea5e9', fill: 'rgba(14,165,233,0.16)', label: '进行中' },
  { border: '#f59e0b', fill: 'rgba(245,158,11,0.18)', label: '待跟进' },
  { border: '#10b981', fill: 'rgba(16,185,129,0.16)', label: '已完成' },
  { border: '#f43f5e', fill: 'rgba(244,63,94,0.14)', label: '风险' },
] as const;

function mergeTimelineItems<T extends { id: number }>(items: T[]) {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function buildPreviewScheduleData(): { nodes: NodeItem[]; tasks: TaskItem[] } {
  const groups = [
    {
      node: '需求与立项',
      children: ['需求访谈', '范围确认', '立项评审'],
      tasks: ['业务访谈纪要', '需求清单确认', '项目章程评审'],
    },
    {
      node: '方案设计',
      children: ['原型设计', '接口设计', '排期确认'],
      tasks: ['低保真原型', '接口字段梳理', '里程碑计划确认'],
    },
    {
      node: '研发实施',
      children: ['前端开发', '后端开发', '联调自测'],
      tasks: ['页面组件开发', '服务接口开发', '冒烟测试通过'],
    },
    {
      node: '验收上线',
      children: ['验收准备', '上线发布', '复盘沉淀'],
      tasks: ['验收材料整理', '生产发布检查', '项目复盘报告'],
    },
  ];

  const nodes: NodeItem[] = [];
  const tasks: TaskItem[] = [];
  groups.forEach((group, groupIndex) => {
    const rootId = -1000 - groupIndex;
    const groupStart = groupIndex * 12;
    nodes.push({
      id: rootId,
      level: 1,
      nodeName: group.node,
      parentId: null,
      planEndTime: formatDemoDate(groupStart + 12, 18),
      planStartTime: formatDemoDate(groupStart, 9),
      progressRate: Math.max(10, 80 - groupIndex * 18),
      sort: 900 + groupIndex,
      status: groupIndex < 2 ? 'IN_PROGRESS' : 'NOT_STARTED',
    });

    group.children.forEach((child, childIndex) => {
      const childId = -1100 - groupIndex * 10 - childIndex;
      const childStart = groupStart + childIndex * 4;
      nodes.push({
        id: childId,
        level: 2,
        nodeName: child,
        parentId: rootId,
        planEndTime: formatDemoDate(childStart + 4, 18),
        planStartTime: formatDemoDate(childStart, 9),
        progressRate: Math.max(0, 75 - groupIndex * 16 - childIndex * 8),
        sort: childIndex + 1,
        status: groupIndex === 0 && childIndex === 0 ? 'COMPLETED' : groupIndex < 2 ? 'IN_PROGRESS' : 'NOT_STARTED',
      });

      group.tasks.forEach((taskTitle, taskIndex) => {
        const taskStart = childStart + taskIndex;
        tasks.push({
          id: -10000 - groupIndex * 100 - childIndex * 10 - taskIndex,
          planEndTime: formatDemoDate(taskStart + 2, 18),
          planStartTime: formatDemoDate(taskStart, 9),
          progressRate: Math.max(0, 90 - groupIndex * 18 - childIndex * 8 - taskIndex * 6),
          projectNodeId: childId,
          responsibleName: ['王秀娟', '张伟', '李明'][taskIndex % 3],
          responsibleUserId: null,
          status: groupIndex === 0 && taskIndex === 0 ? 'COMPLETED' : groupIndex < 2 ? 'IN_PROGRESS' : 'NOT_STARTED',
          taskContent: `${group.node} / ${child} / ${taskTitle}`,
          taskTitle,
        });
      });
    });
  });

  return { nodes, tasks };
}

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

type LocalTaskTimeNode = {
  endDate: Date;
  id: string;
  startDate: Date;
  taskId: number;
  title: string;
};

type TimeNodeEditorState = {
  endDate: string;
  id: string;
  rowId: string;
  startDate: string;
  title: string;
};

function TaskMark({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center transition-colors ${
        active
          ? 'text-[var(--portal-color-brand-600)]'
          : 'text-[#6f86a5] group-hover:text-[#526681]'
      }`}
    >
      <FileText className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
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
  const [leftBodyRef] = useState<{ current: HTMLDivElement | null }>(() => ({ current: null }));
  const [searchInputRef] = useState<{ current: HTMLInputElement | null }>(() => ({ current: null }));
  const [rowTrackRefs] = useState<Record<string, HTMLDivElement | null>>(() => ({}));
  const [movedRef] = useState<{ current: boolean }>(() => ({ current: false }));
  const [suppressEditorOpenRef] = useState<{ current: boolean }>(() => ({ current: false }));
  const [detailRowIdRef] = useState<{ current: string | null }>(() => ({ current: null }));
  const [localCreateSeqRef] = useState<{ current: number }>(() => ({ current: 0 }));
  const [localTimeNodeSeqRef] = useState<{ current: number }>(() => ({ current: 0 }));
  const [timelinePanRef] = useState<{
    current: {
      cleanup: () => void;
      pointerId: number;
      previousCursor: string;
      previousUserSelect: string;
      startLeft: number;
      startX: number;
    } | null;
  }>(() => ({ current: null }));
  const [dragStateRef] = useState<{ current: DragState | null }>(() => ({ current: null }));
  const [dragCleanupRef] = useState<{ current: (() => void) | null }>(() => ({ current: null }));
  const [dragCompletedRef] = useState<{ current: boolean }>(() => ({ current: false }));

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [leftSearchVisible, setLeftSearchVisible] = useState(false);
  const [timelineScale, setTimelineScale] = useState<TimelineScale>('day');
  const [timelineViewport, setTimelineViewport] = useState({
    scrollLeft: 0,
    viewportWidth: 960,
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<CreateDraft | null>(null);
  const [localCreatedNodes, setLocalCreatedNodes] = useState<NodeItem[]>([]);
  const [localCreatedTasks, setLocalCreatedTasks] = useState<TaskItem[]>([]);
  const [localTaskTimeNodes, setLocalTaskTimeNodes] = useState<LocalTaskTimeNode[]>([]);
  const [timeNodeEditor, setTimeNodeEditor] = useState<TimeNodeEditorState | null>(null);
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
  const [detailPanel, setDetailPanel] = useState<DetailPanelState>({
    visible: false,
    rowId: null,
    activeTab: 'info',
  });

  // 侧边栏快速编辑状态
  const [detailEditState, setDetailEditState] = useState<DetailEditState | null>(null);
  const [detailInitialEditState, setDetailInitialEditState] = useState<DetailEditState | null>(null);
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

  const [hoveredGanttBarId, setHoveredGanttBarId] = useState<string | null>(null);

  const hasDetailPanelUnsavedChanges = useMemo(
    () =>
      detailPanel.visible &&
      normalizeDetailEditStateForCompare(detailEditState) !==
        normalizeDetailEditStateForCompare(detailInitialEditState),
    [detailEditState, detailInitialEditState, detailPanel.visible],
  );

  useEffect(() => {
    localCreateSeqRef.current = 0;
    localTimeNodeSeqRef.current = 0;
    setCreateDraft(null);
    setLocalCreatedNodes([]);
    setLocalCreatedTasks([]);
    setLocalTaskTimeNodes([]);
    setTimeNodeEditor(null);
  }, [localCreateSeqRef, localTimeNodeSeqRef, selectedProjectId]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState, dragStateRef]);

  useEffect(
    () => () => {
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
    },
    [dragCleanupRef],
  );

  const dayColumnWidth = TIMELINE_SCALE_CONFIG[timelineScale].columnWidth;
  const previewScheduleData = useMemo(() => buildPreviewScheduleData(), []);
  const timelineNodes = useMemo(
    () => mergeTimelineItems([...nodes, ...localCreatedNodes, ...previewScheduleData.nodes]),
    [localCreatedNodes, nodes, previewScheduleData.nodes],
  );
  const timelineTasks = useMemo(
    () => mergeTimelineItems([...tasks, ...localCreatedTasks, ...previewScheduleData.tasks]),
    [localCreatedTasks, previewScheduleData.tasks, tasks],
  );
  const categories = buildTimelineCategories(timelineNodes, timelineTasks);
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

  function confirmDiscardDetailChanges() {
    if (!hasDetailPanelUnsavedChanges) {
      return true;
    }

    return window.confirm('当前详情有未保存修改，离开后将丢失这些内容。确认继续吗？');
  }

  useEffect(() => {
    if (!hasDetailPanelUnsavedChanges) {
      return undefined;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasDetailPanelUnsavedChanges]);

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
    () => new Map(timelineNodes.map((node) => [node.id, node])),
    [timelineNodes],
  );
  const taskMap = useMemo(
    () => new Map(timelineTasks.map((task) => [task.id, task])),
    [timelineTasks],
  );
  const childNodeIdsByParent = useMemo(() => {
    const next = new Map<number, number[]>();
    timelineNodes.forEach((node) => {
      const parentId = Number(node.parentId ?? 0);
      if (!parentId || !nodeMap.has(parentId)) {
        return;
      }
      const current = next.get(parentId) ?? [];
      current.push(node.id);
      next.set(parentId, current);
    });
    return next;
  }, [nodeMap, timelineNodes]);
  const taskIdsByNodeId = useMemo(() => {
    const next = new Map<number, number[]>();
    timelineTasks.forEach((task) => {
      const nodeId = Number(task.projectNodeId ?? 0);
      if (!nodeId) {
        return;
      }
      const current = next.get(nodeId) ?? [];
      current.push(task.id);
      next.set(nodeId, current);
    });
    return next;
  }, [timelineTasks]);
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
  const rowsForTimelineRange = useMemo(
    () => [
      ...renderedRows,
      ...localTaskTimeNodes.map(
        (timeNode): TimelineRow => ({
          endDate: timeNode.endDate,
          id: `local-time-node-${timeNode.id}`,
          progress: 0,
          rowType: 'item',
          startDate: timeNode.startDate,
          title: timeNode.title,
        }),
      ),
    ],
    [localTaskTimeNodes, renderedRows],
  );
  const ganttSegmentCountByRowId = useMemo(() => {
    const next = new Map<string, number>();
    const taskRows = renderedRows.filter((row) => row.entityKind === 'task' && row.entityId);
    const timeNodeCountByTaskId = localTaskTimeNodes.reduce((map, timeNode) => {
      map.set(timeNode.taskId, (map.get(timeNode.taskId) ?? 0) + 1);
      return map;
    }, new Map<number, number>());

    renderedRows.forEach((row) => {
      if (row.rowType === 'category') {
        const relatedTaskRows = taskRows.filter((taskRow) => taskRow.categoryId === row.id);
        const count = relatedTaskRows.reduce(
          (sum, taskRow) => sum + 1 + (timeNodeCountByTaskId.get(taskRow.entityId as number) ?? 0),
          0,
        );
        next.set(row.id, count);
        return;
      }

      if (row.rowType === 'subCategory') {
        const relatedTaskRows = taskRows.filter((taskRow) => taskRow.subCategoryId === row.id);
        const count = relatedTaskRows.reduce(
          (sum, taskRow) => sum + 1 + (timeNodeCountByTaskId.get(taskRow.entityId as number) ?? 0),
          0,
        );
        next.set(row.id, count);
      }
    });

    return next;
  }, [localTaskTimeNodes, renderedRows]);
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
    () => extendTimelineRangeByMonths(buildTimelineRange(selectedProject, rowsForTimelineRange)),
    [selectedProject, rowsForTimelineRange]
  );
  const timelineDays = useMemo(
    () => buildTimelineDays(timelineRange.start, timelineRange.end),
    [timelineRange]
  );
  const timelineMonthOptions = useMemo(() => {
    const options: Array<{
      endIndex: number;
      id: string;
      label: string;
      month: number;
      startIndex: number;
      year: number;
    }> = [];

    timelineDays.forEach((day, index) => {
      const year = day.date.getFullYear();
      const month = day.date.getMonth() + 1;
      const id = `${year}-${String(month).padStart(2, '0')}`;
      const last = options[options.length - 1];

      if (last?.id === id) {
        last.endIndex = index;
        return;
      }

      options.push({
        endIndex: index,
        id,
        label: `${year}年${month}月`,
        month,
        startIndex: index,
        year,
      });
    });

    return options;
  }, [timelineDays]);
  const timelineWidth = timelineDays.length * dayColumnWidth;
  const timelineGridTemplateColumns = `repeat(${timelineDays.length}, ${dayColumnWidth}px)`;
  const visibleDayRange = useMemo(() => {
    const overscanDays = Math.max(4, Math.ceil(TIMELINE_OVERSCAN_PX / dayColumnWidth));
    const viewportWidth = Math.max(360, timelineViewport.viewportWidth);
    const startIndex = Math.max(
      0,
      Math.floor(timelineViewport.scrollLeft / dayColumnWidth) - overscanDays,
    );
    const endIndex = Math.min(
      timelineDays.length - 1,
      Math.ceil((timelineViewport.scrollLeft + viewportWidth) / dayColumnWidth) + overscanDays,
    );

    return {
      endIndex: Math.max(startIndex, endIndex),
      startIndex,
    };
  }, [dayColumnWidth, timelineDays.length, timelineViewport.scrollLeft, timelineViewport.viewportWidth]);
  const visibleTimelineDays = useMemo(
    () =>
      timelineDays
        .slice(visibleDayRange.startIndex, visibleDayRange.endIndex + 1)
        .map((day, offset) => ({
          day,
          index: visibleDayRange.startIndex + offset,
        })),
    [timelineDays, visibleDayRange.endIndex, visibleDayRange.startIndex],
  );
  const activeDayIndex = Math.max(
    0,
    Math.min(
      timelineDays.length - 1,
      Math.floor((timelineViewport.scrollLeft + 1) / dayColumnWidth),
    ),
  );
  const activeMonthIndex = Math.max(
    0,
    timelineMonthOptions.findIndex(
      (option) => activeDayIndex >= option.startIndex && activeDayIndex <= option.endIndex,
    ),
  );
  const activeMonthOption = timelineMonthOptions[activeMonthIndex] ?? timelineMonthOptions[0] ?? null;

  // 直接用 useMemo 计算依赖连线，避免 useEffect + setState 导致的无限循环
  const dependencyLines = useMemo(
    () => calculateDependencyLines(taskDependencies, renderedRows, timelineRange, timelineDays, dayColumnWidth),
    [dayColumnWidth, taskDependencies, renderedRows, timelineRange, timelineDays]
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
        const directSubCategoryId = `${category.id}-direct`;
        if (category.tasks.length && !(directSubCategoryId in next)) {
          next[directSubCategoryId] = true;
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
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthStartIndex = daysBetween(timelineRange.start, currentMonthStart);
    if (currentMonthStartIndex < 0 || currentMonthStartIndex >= timelineDays.length) {
      return;
    }
    scrollTimelineToDayIndex(currentMonthStartIndex, dayColumnWidth, 'start');
  }, [dayColumnWidth, timelineDays.length, timelineRange.start]);

  useEffect(() => {
    updateTimelineViewport();

    function handleResize() {
      updateTimelineViewport();
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dayColumnWidth, timelineDays.length]);

  useEffect(() => {
    if (!dependencyMode) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDependencyMode(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dependencyMode]);

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
  const timelineRowsHeight = useMemo(
    () => visibleRows.reduce((sum, row) => sum + getRowHeight(row), 0),
    [visibleRows],
  );
  const unscheduledHintLeft = Math.max(
    12,
    Math.min(Math.max(12, timelineWidth - 236), timelineViewport.scrollLeft + 12),
  );
  const dependencyModeSourceRow = dependencyMode ? findRow(dependencyMode.sourceRowId) : null;

  const getTaskDisplayMeta = (row: TimelineRow) => {
    if (row.entityKind !== 'task' || !row.entityId) {
      return {
        assignmentToneClassName: null as string | null,
        assignmentStatusLabel: null as string | null,
        ownerRoleName: null as string | null,
        participantCount: null as number | null,
        participantLabel: null as string | null,
        responsibleLabel: null as string | null,
        taskShortName: row.title,
        taskStatusLabel: null as string | null,
        taskStatusToneClassName: null as string | null,
      };
    }

    const task = timelineTasks.find((item) => item.id === row.entityId);
    const ownerRoleName =
      task?.responsibleUserId && memberMap.has(task.responsibleUserId)
        ? memberMap.get(task.responsibleUserId)?.roleName ?? null
        : null;
    const participantCount = taskParticipantCountMap[row.entityId] ?? null;
    const hasOwner = Boolean(task?.responsibleUserId || row.owner);
    const hasParticipants = (participantCount ?? 0) > 0;
    const taskStatusLabel = getProjectStatusLabel(row.status);
    const taskStatusToneClassName = getTaskStatusToneClassName(row.status);
    const responsibleLabel = row.owner ?? '未分配';
    const taskShortName = getTaskShortName(row.title);

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
      `任务状态：${taskStatusLabel}`,
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
      responsibleLabel,
      taskShortName,
      taskStatusLabel,
      taskStatusToneClassName,
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

  function updateTimelineViewport(scrollLeftOverride?: number) {
    if (!bodyRef.current) {
      return;
    }

    const nextScrollLeft = scrollLeftOverride ?? bodyRef.current.scrollLeft;
    const nextViewportWidth = Math.max(360, bodyRef.current.clientWidth);
    setTimelineViewport((current) => {
      if (
        Math.abs(current.scrollLeft - nextScrollLeft) < 1 &&
        Math.abs(current.viewportWidth - nextViewportWidth) < 1
      ) {
        return current;
      }

      return {
        scrollLeft: nextScrollLeft,
        viewportWidth: nextViewportWidth,
      };
    });
  }

  function setTimelineScrollLeft(nextLeft: number) {
    if (!bodyRef.current) {
      return;
    }

    const maxLeft = Math.max(0, bodyRef.current.scrollWidth - bodyRef.current.clientWidth);
    const clampedLeft = Math.max(0, Math.min(maxLeft, nextLeft));
    bodyRef.current.scrollLeft = clampedLeft;
    updateTimelineViewport(clampedLeft);
  }

  function scrollTimelineToDayIndex(
    dayIndex: number,
    columnWidth = dayColumnWidth,
    align: 'focus' | 'start' = 'focus',
  ) {
    const timelineViewportWidth = bodyRef.current ? Math.max(360, bodyRef.current.clientWidth) : 720;
    const targetLeft =
      align === 'start'
        ? dayIndex * columnWidth
        : dayIndex * columnWidth - timelineViewportWidth * 0.38;
    setTimelineScrollLeft(Math.max(0, targetLeft));
  }

  function handleTimelineScaleChange(nextScale: TimelineScale) {
    if (nextScale === timelineScale) {
      return;
    }

    const currentStartIndex = activeMonthOption?.startIndex ?? Math.max(0, Math.round(timelineViewport.scrollLeft / dayColumnWidth));
    const nextColumnWidth = TIMELINE_SCALE_CONFIG[nextScale].columnWidth;
    setTimelineScale(nextScale);
    window.requestAnimationFrame(() => {
      scrollTimelineToDayIndex(currentStartIndex, nextColumnWidth, 'start');
    });
  }

  function jumpToTimelineMonth(monthIndex: number) {
    const option = timelineMonthOptions[Math.max(0, Math.min(timelineMonthOptions.length - 1, monthIndex))];
    if (!option) {
      return;
    }

    scrollTimelineToDayIndex(option.startIndex, dayColumnWidth, 'start');
  }

  function jumpTimelineMonth(offset: number) {
    jumpToTimelineMonth(activeMonthIndex + offset);
  }

  function jumpToToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIndex = daysBetween(timelineRange.start, today);
    if (todayIndex < 0 || todayIndex >= timelineDays.length) {
      return;
    }
    scrollTimelineToDayIndex(todayIndex);
  }

  function focusGanttSearch() {
    setLeftSearchVisible(true);
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }

  function syncAxisScroll() {
    if (!bodyRef.current) {
      return;
    }

    if (leftBodyRef.current && leftBodyRef.current.scrollTop !== bodyRef.current.scrollTop) {
      leftBodyRef.current.scrollTop = bodyRef.current.scrollTop;
    }
    updateTimelineViewport();
  }

  function handleTimelineAxisWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!bodyRef.current) {
      return;
    }

    const horizontalDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!horizontalDelta) {
      return;
    }

    event.preventDefault();
    setTimelineScrollLeft(bodyRef.current.scrollLeft + horizontalDelta);
  }

  function startTimelinePan(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !bodyRef.current) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('button,select,input,textarea,a,[role="button"]')) {
      return;
    }

    const startX = event.clientX;
    const startLeft = bodyRef.current?.scrollLeft ?? timelineViewport.scrollLeft;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    event.preventDefault();
    event.stopPropagation();
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const getTargetLeft = (clientX: number) => startLeft + startX - clientX;
    const applyPan = (clientX: number) => {
      setTimelineScrollLeft(getTargetLeft(clientX));
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
    const finishPan = (clientX: number) => {
      const finalLeft = getTargetLeft(clientX);
      setTimelineScrollLeft(finalLeft);
      window.requestAnimationFrame(() => {
        setTimelineScrollLeft(finalLeft);
      });
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      cleanup();
      timelinePanRef.current = null;
    };
    const handleWindowPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== event.pointerId) {
        return;
      }
      moveEvent.preventDefault();
      applyPan(moveEvent.clientX);
    };
    const handleWindowPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== event.pointerId) {
        return;
      }
      upEvent.preventDefault();
      finishPan(upEvent.clientX);
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', handleWindowPointerUp, { passive: false });
    window.addEventListener('pointercancel', handleWindowPointerUp, { passive: false });
    timelinePanRef.current = {
      cleanup,
      pointerId: event.pointerId,
      previousCursor,
      previousUserSelect,
      startLeft,
      startX,
    };
  }

  function moveTimelinePan(event: React.PointerEvent<HTMLDivElement>) {
    const panState = timelinePanRef.current;
    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    setTimelineScrollLeft(panState.startLeft + panState.startX - event.clientX);
  }

  function endTimelinePan(event: React.PointerEvent<HTMLDivElement>) {
    const panState = timelinePanRef.current;
    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const finalLeft = panState.startLeft + panState.startX - event.clientX;
    setTimelineScrollLeft(finalLeft);
    window.requestAnimationFrame(() => {
      setTimelineScrollLeft(finalLeft);
    });
    document.body.style.cursor = panState.previousCursor;
    document.body.style.userSelect = panState.previousUserSelect;
    panState.cleanup();
    timelinePanRef.current = null;
  }

  function handleLeftBodyWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!bodyRef.current) {
      return;
    }

    event.preventDefault();
    bodyRef.current.scrollTop += event.deltaY;
    if (leftBodyRef.current) {
      leftBodyRef.current.scrollTop = bodyRef.current.scrollTop;
    }
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

  function getNextLocalEntityId() {
    localCreateSeqRef.current += 1;
    return -300000 - localCreateSeqRef.current;
  }

  function resolveCreatedEntityId(
    candidateId: number | null | undefined,
    existingIds: Set<number>,
  ) {
    if (
      typeof candidateId === 'number' &&
      Number.isFinite(candidateId) &&
      candidateId !== 0 &&
      !existingIds.has(candidateId)
    ) {
      return candidateId;
    }

    let localId = getNextLocalEntityId();
    while (existingIds.has(localId)) {
      localId = getNextLocalEntityId();
    }
    return localId;
  }

  function buildLocalNodeFromDraft(draft: CreateDraft, id: number): NodeItem {
    const parentNode = draft.parentNodeId ? nodeMap.get(draft.parentNodeId) : null;
    const siblingSorts = timelineNodes
      .filter((node) => Number(node.parentId ?? 0) === Number(draft.parentNodeId ?? 0))
      .map((node) => Number(node.sort ?? 0));

    return {
      id,
      level: parentNode ? Number(parentNode.level ?? 1) + 1 : 1,
      nodeName: draft.title.trim(),
      parentId: draft.parentNodeId,
      planEndTime: null,
      planStartTime: null,
      progressRate: 0,
      remark: draft.remark.trim() || null,
      sort: Math.max(0, ...siblingSorts) + 1,
      status: 'NOT_STARTED',
    };
  }

  function buildLocalTaskFromDraft(draft: CreateDraft, id: number): TaskItem {
    if (!draft.parentNodeId) {
      throw new Error('未找到任务所属节点。');
    }

    return {
      id,
      projectNodeId: draft.parentNodeId,
      progressRate: 0,
      remark: draft.remark.trim() || null,
      status: 'NOT_STARTED',
      taskContent: draft.content.trim() || null,
      taskTitle: draft.title.trim(),
    };
  }

  function keepCreatedNodeVisible(node: NodeItem) {
    setLocalCreatedNodes((current) => mergeTimelineItems([...current, node]));
  }

  function keepCreatedTaskVisible(task: TaskItem) {
    setLocalCreatedTasks((current) => mergeTimelineItems([...current, task]));
  }

  function addLocalTaskTimeNode(row: TimelineRow, startDate: Date | null, endDate: Date | null) {
    if (!row.entityId || row.entityKind !== 'task' || !startDate || !endDate) {
      return;
    }

    localTimeNodeSeqRef.current += 1;
    const nextTimeNode: LocalTaskTimeNode = {
      endDate,
      id: `${row.entityId}-${Date.now()}-${localTimeNodeSeqRef.current}`,
      startDate,
      taskId: row.entityId,
      title: `时间节点 ${localTimeNodeSeqRef.current}`,
    };

    setLocalTaskTimeNodes((current) => [...current, nextTimeNode]);
    setFeedback({
      message: '时间节点已新增，可继续为同一任务添加多个节点。',
      tone: 'success',
    });
  }

  function openTimeNodeEditor(row: TimelineRow, timeNode: LocalTaskTimeNode) {
    setSelectedRowId(row.id);
    setTimeNodeEditor({
      endDate: formatDateInput(timeNode.endDate),
      id: timeNode.id,
      rowId: row.id,
      startDate: formatDateInput(timeNode.startDate),
      title: timeNode.title,
    });
  }

  function handleSaveTimeNodeEditor() {
    if (!timeNodeEditor) {
      return;
    }
    const startDate = parseInputDate(timeNodeEditor.startDate);
    const endDate = parseInputDate(timeNodeEditor.endDate);
    if (!timeNodeEditor.title.trim() || !startDate || !endDate) {
      setFeedback({
        message: '请填写时间节点名称和完整日期。',
        tone: 'danger',
      });
      return;
    }
    if (daysBetween(startDate, endDate) < 0) {
      setFeedback({
        message: '结束日期不能早于开始日期。',
        tone: 'danger',
      });
      return;
    }

    setLocalTaskTimeNodes((current) =>
      current.map((timeNode) =>
        timeNode.id === timeNodeEditor.id
          ? {
              ...timeNode,
              endDate,
              startDate,
              title: timeNodeEditor.title.trim(),
            }
          : timeNode,
      ),
    );
    setTimeNodeEditor(null);
    setFeedback({
      message: '时间节点已更新。',
      tone: 'success',
    });
  }

  function handleDeleteTimeNodeEditor() {
    if (!timeNodeEditor) {
      return;
    }
    setLocalTaskTimeNodes((current) => current.filter((timeNode) => timeNode.id !== timeNodeEditor.id));
    setTimeNodeEditor(null);
    setFeedback({
      message: '时间节点已删除。',
      tone: 'success',
    });
  }

  function getTimelineIndexFromClientX(rowId: string, clientX: number) {
    const track = rowTrackRefs[rowId];
    if (!track) {
      return null;
    }
    const rect = track.getBoundingClientRect();
    const rawIndex = Math.floor((clientX - rect.left) / dayColumnWidth);
    return Math.max(0, Math.min(timelineDays.length - 1, rawIndex));
  }

  function startTimeNodeResize(
    event: React.MouseEvent<HTMLElement>,
    row: TimelineRow,
    timeNode: LocalTaskTimeNode,
    mode: 'move' | 'resize-start' | 'resize-end',
  ) {
    if (!canManageProjectSchedule || dependencyMode) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const originalStartIndex = daysBetween(timelineRange.start, timeNode.startDate);
    const originalEndIndex = daysBetween(timelineRange.start, timeNode.endDate);
    const originalDuration = Math.max(0, originalEndIndex - originalStartIndex);
    const pointerStartIndex = getTimelineIndexFromClientX(row.id, event.clientX) ?? originalStartIndex;
    let moved = false;

    const applyTimeNodeDrag = (clientX: number) => {
      const nextIndex = getTimelineIndexFromClientX(row.id, clientX);
      if (nextIndex === null) {
        return;
      }
      let startIndex = originalStartIndex;
      let endIndex = originalEndIndex;

      if (mode === 'move') {
        const nextStartIndex = originalStartIndex + nextIndex - pointerStartIndex;
        startIndex = Math.max(0, Math.min(timelineDays.length - 1 - originalDuration, nextStartIndex));
        endIndex = startIndex + originalDuration;
      } else {
        startIndex = mode === 'resize-start' ? Math.min(nextIndex, originalEndIndex) : originalStartIndex;
        endIndex = mode === 'resize-end' ? Math.max(nextIndex, originalStartIndex) : originalEndIndex;
      }

      if (startIndex === originalStartIndex && endIndex === originalEndIndex) {
        return;
      }

      moved = true;
      setLocalTaskTimeNodes((current) =>
        current.map((item) =>
          item.id === timeNode.id
            ? {
                ...item,
                endDate: addDays(timelineRange.start, endIndex),
                startDate: addDays(timelineRange.start, startIndex),
              }
            : item,
        ),
      );
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      applyDragAutoScroll(moveEvent);
      applyTimeNodeDrag(moveEvent.clientX);
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (moved) {
        suppressEditorOpenRef.current = true;
        setFeedback({
          message: mode === 'move' ? '时间节点已移动。' : '时间节点已调整。',
          tone: 'success',
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function getValidNodeId(row: TimelineRow | null) {
    if (!row) {
      return null;
    }
    if (row.entityKind === 'node' && row.entityId && row.entityId !== 0) {
      return row.entityId;
    }
    if (row.parentNodeId && row.parentNodeId !== 0) {
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
        if (createDraft.parentNodeId && isVirtualTimelineId(createDraft.parentNodeId)) {
          const createdNode = buildLocalNodeFromDraft(createDraft, getNextLocalEntityId());
          keepCreatedNodeVisible(createdNode);
          setSelectedRowId(createDraft.parentNodeId ? `sub-${createdNode.id}` : `cat-${createdNode.id}`);
          setExpandedMap((current) => ({
            ...current,
            ...(createDraft.categoryId ? { [createDraft.categoryId]: true } : {}),
            ...(createDraft.subCategoryId ? { [createDraft.subCategoryId]: true } : {}),
          }));
          setFeedback({
            message: '节点已在本地新增，可继续预览。',
            tone: 'success',
          });
          setCreateDraft(null);
          return;
        }
        const created = await onCreateNode(selectedProjectId, {
          nodeCode: createDraft.code.trim() || null,
          nodeName: title,
          parentNodeId: createDraft.parentNodeId,
          remark: createDraft.remark.trim() || null,
        });
        const createdNodeId = resolveCreatedEntityId(
          created?.id,
          new Set(timelineNodes.map((node) => node.id)),
        );
        const createdNode = buildLocalNodeFromDraft(createDraft, createdNodeId);
        keepCreatedNodeVisible(createdNode);
        setSelectedRowId(createDraft.parentNodeId ? `sub-${createdNode.id}` : `cat-${createdNode.id}`);
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
        if (isVirtualTimelineId(createDraft.parentNodeId)) {
          const createdTask = buildLocalTaskFromDraft(createDraft, getNextLocalEntityId());
          keepCreatedTaskVisible(createdTask);
          setSelectedRowId(`task-${createdTask.id}`);
          setExpandedMap((current) => ({
            ...current,
            ...(createDraft.categoryId ? { [createDraft.categoryId]: true } : {}),
            ...(createDraft.subCategoryId ? { [createDraft.subCategoryId]: true } : {}),
          }));
          setFeedback({
            message: '任务已在本地新增，可继续预览。',
            tone: 'success',
          });
          setCreateDraft(null);
          return;
        }
        const created = await onCreateTask(selectedProjectId, {
          projectNodeId: createDraft.parentNodeId,
          remark: createDraft.remark.trim() || null,
          taskCode: createDraft.code.trim() || null,
          taskContent: createDraft.content.trim() || null,
          taskTitle: title,
        });
        const createdTaskId = resolveCreatedEntityId(
          created?.id,
          new Set(timelineTasks.map((task) => task.id)),
        );
        const createdTask = buildLocalTaskFromDraft(createDraft, createdTaskId);
        keepCreatedTaskVisible(createdTask);
        setSelectedRowId(`task-${createdTask.id}`);
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
      if (createDraft.mode === 'node') {
        const createdNode = buildLocalNodeFromDraft(createDraft, getNextLocalEntityId());
        keepCreatedNodeVisible(createdNode);
        setSelectedRowId(createDraft.parentNodeId ? `sub-${createdNode.id}` : `cat-${createdNode.id}`);
        setExpandedMap((current) => ({
          ...current,
          ...(createDraft.categoryId ? { [createDraft.categoryId]: true } : {}),
          ...(createDraft.subCategoryId ? { [createDraft.subCategoryId]: true } : {}),
        }));
        setFeedback({
          message: '节点已在本地新增，可继续预览。',
          tone: 'success',
        });
        setCreateDraft(null);
        return;
      }
      if (createDraft.parentNodeId) {
        const createdTask = buildLocalTaskFromDraft(createDraft, getNextLocalEntityId());
        keepCreatedTaskVisible(createdTask);
        setSelectedRowId(`task-${createdTask.id}`);
        setExpandedMap((current) => ({
          ...current,
          ...(createDraft.categoryId ? { [createDraft.categoryId]: true } : {}),
          ...(createDraft.subCategoryId ? { [createDraft.subCategoryId]: true } : {}),
        }));
        setFeedback({
          message: '任务已在本地新增，可继续预览。',
          tone: 'success',
        });
        setCreateDraft(null);
        return;
      }
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

    if (isVirtualTimelineId(row.entityId)) {
      setOptimisticScheduleMap((current) => ({
        ...current,
        ...optimisticUpdates,
      }));
      setFeedback({
        message: '虚拟计划已在本地更新，仅用于预览。',
        tone: 'success',
      });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    setOptimisticScheduleMap((current) => ({
      ...current,
      ...optimisticUpdates,
    }));
    try {
      if (row.entityKind === 'node') {
        const node = timelineNodes.find((item) => item.id === row.entityId);
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
        const task = timelineTasks.find((item) => item.id === row.entityId);
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
      if (shouldKeepLocalScheduleOnSaveError()) {
        setFeedback({
          message: '计划时间已在本地更新，可继续预览。',
          tone: 'success',
        });
        return;
      }
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
    if (!row.entityKind) {
      return false;
    }

    if (detailPanel.visible && detailPanel.rowId === row.id) {
      setSelectedRowId(row.id);
      return true;
    }

    if (!confirmDiscardDetailChanges()) {
      return false;
    }

    setTeamPanelVisible(false);
    setSelectedRowId(row.id);
    detailRowIdRef.current = row.id;
    // 初始化编辑状态
    const task = row.entityKind === 'task' ? timelineTasks.find(t => t.id === row.entityId) : null;
    const node = row.entityKind === 'node' ? timelineNodes.find(n => n.id === row.entityId) : null;
    const nextDetailEditState: DetailEditState = {
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
    };
    setDetailEditState(nextDetailEditState);
    setDetailInitialEditState(nextDetailEditState);
    setDetailPanel({
      visible: true,
      rowId: row.id,
      activeTab: 'info',
    });

    if (row.entityKind === 'task' && row.entityId && selectedProjectId && !isVirtualTimelineId(row.entityId)) {
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
          const participantMembers = detail.participantMembers.map((member) => ({
            userId: member.userId,
            userName: member.userName,
          }));
          setDetailEditState((current) => current ? {
            ...current,
            participantMembers,
          } : current);
          setDetailInitialEditState((current) => current ? {
            ...current,
            participantMembers,
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

    return true;
  }

  /**
   * 关闭任务详情侧边栏
   */
  function closeDetailPanel(options: { force?: boolean } = {}) {
    if (!options.force && !confirmDiscardDetailChanges()) {
      return false;
    }

    detailRowIdRef.current = null;
    setDetailPanel({ visible: false, rowId: null, activeTab: 'info' });
    setDetailEditState(null);
    setDetailInitialEditState(null);
    return true;
  }

  function openTeamPanel() {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!closeDetailPanel()) {
      return;
    }
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
    if (isVirtualTimelineId(row.entityId)) {
      setFeedback({
        message: '虚拟任务仅用于排期预览，不支持人员分配。',
        tone: 'danger',
      });
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
      const targetDetailRowId = `task-${taskId}`;
      setDetailEditState((current) => {
        if (!current || detailPanel.rowId !== targetDetailRowId) {
          return current;
        }
        return {
          ...current,
          participantMembers: quickAssignState.participantMembers,
          responsibleName: quickAssignState.responsibleName ?? '',
          responsibleUserId: quickAssignState.responsibleUserId,
        };
      });
      setDetailInitialEditState((current) => {
        if (!current || detailPanel.rowId !== targetDetailRowId) {
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
    if (isVirtualTimelineId(row.entityId)) {
      const nextStartDate = parseInputDate(detailEditState.planStartTime ?? '');
      const nextEndDate = parseInputDate(detailEditState.planEndTime ?? '');
      const optimisticUpdates: OptimisticScheduleMap = {
        [row.id]: {
          endDate: nextEndDate,
          startDate: nextStartDate,
        },
      };
      if (row.entityKind === 'task') {
        buildAncestorNodeScheduleUpdates(row.entityId, nextStartDate, nextEndDate).forEach((update) => {
          optimisticUpdates[update.rowId] = {
            endDate: update.endDate,
            startDate: update.startDate,
          };
        });
      }
      setOptimisticScheduleMap((current) => ({
        ...current,
        ...optimisticUpdates,
      }));
      setDetailInitialEditState(detailEditState);
      setFeedback({
        message: '虚拟数据已在本地更新，仅用于预览。',
        tone: 'success',
      });
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
      closeDetailPanel({ force: true });
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
    if (isVirtualTimelineId(row.entityId)) {
      setFeedback({
        message: '虚拟数据仅用于排期预览，不会删除后端记录。',
        tone: 'danger',
      });
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
        closeDetailPanel({ force: true });
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

  function getDragPreviewRange(state: DragState) {
    if (state.mode === 'create') {
      const startIndex = Math.min(state.anchorIndex, state.currentIndex);
      const endIndex = Math.max(state.anchorIndex, state.currentIndex);
      return {
        endDate: addDays(timelineRange.start, endIndex),
        startDate: addDays(timelineRange.start, startIndex),
      };
    }

    const deltaDays = state.currentIndex - state.anchorIndex;
    if (state.mode === 'move') {
      return {
        endDate: addDays(timelineRange.start, state.originalEndIndex + deltaDays),
        startDate: addDays(timelineRange.start, state.originalStartIndex + deltaDays),
      };
    }

    if (state.mode === 'resize-start') {
      const startIndex = Math.min(state.currentIndex, state.originalEndIndex);
      return {
        endDate: addDays(timelineRange.start, state.originalEndIndex),
        startDate: addDays(timelineRange.start, startIndex),
      };
    }

    const endIndex = Math.max(state.currentIndex, state.originalStartIndex);
    return {
      endDate: addDays(timelineRange.start, endIndex),
      startDate: addDays(timelineRange.start, state.originalStartIndex),
    };
  }

  function getRowPreview(row: TimelineRow) {
    if (!dragState || dragState.rowId !== row.id) {
      return {
        endDate: row.endDate,
        startDate: row.startDate,
      };
    }

    return getDragPreviewRange(dragState);
  }

  function applyDragAutoScroll(event: MouseEvent) {
    if (!bodyRef.current) {
      return;
    }

    const bodyRect = bodyRef.current.getBoundingClientRect();
    const timelineLeft = bodyRect.left;
    let scrollDelta = 0;

    if (event.clientX > bodyRect.right - DRAG_EDGE_SIZE) {
      const distance = Math.min(DRAG_EDGE_SIZE, event.clientX - (bodyRect.right - DRAG_EDGE_SIZE));
      scrollDelta = Math.ceil((distance / DRAG_EDGE_SIZE) * DRAG_EDGE_MAX_SPEED);
    } else if (event.clientX < timelineLeft + DRAG_EDGE_SIZE) {
      const distance = Math.min(DRAG_EDGE_SIZE, timelineLeft + DRAG_EDGE_SIZE - event.clientX);
      scrollDelta = -Math.ceil((distance / DRAG_EDGE_SIZE) * DRAG_EDGE_MAX_SPEED);
    }

    if (!scrollDelta) {
      return;
    }

    const previousLeft = bodyRef.current.scrollLeft;
    setTimelineScrollLeft(previousLeft + scrollDelta);
    if (bodyRef.current.scrollLeft !== previousLeft) {
      movedRef.current = true;
    }
  }

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const activeDrag = dragState;

    function handleWindowMouseMove(event: MouseEvent) {
      applyDragAutoScroll(event);
      const track = rowTrackRefs[activeDrag.rowId];
      if (!track) {
        return;
      }
      const rect = track.getBoundingClientRect();
      const rawIndex = Math.floor((event.clientX - rect.left) / dayColumnWidth);
      const nextIndex = Math.max(0, Math.min(timelineDays.length - 1, rawIndex));
      if (nextIndex !== activeDrag.currentIndex) {
        movedRef.current = true;
        setDragState((current) => {
          if (!current) {
            return current;
          }
          const next = {
            ...current,
            currentIndex: nextIndex,
          };
          dragStateRef.current = next;
          return next;
        });
      }
    }

    function handleWindowMouseUp() {
      if (dragCompletedRef.current) {
        return;
      }
      dragCompletedRef.current = true;
      const currentDrag = dragStateRef.current ?? activeDrag;
      dragStateRef.current = null;
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
      const preview = getDragPreviewRange(currentDrag);
      movedRef.current = false;
      suppressEditorOpenRef.current = true;
      if (currentDrag.mode === 'create' && row.entityKind === 'task') {
        addLocalTaskTimeNode(row, preview.startDate, preview.endDate);
        return;
      }
      // 启用连锁更新处理
      void handleCascadeAfterDrag(row, preview.startDate, preview.endDate);
    }

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dayColumnWidth, dragState, dragStateRef, timelineDays.length, timelineRange.start]);

  function startDrag(
    event: React.MouseEvent<HTMLElement>,
    row: TimelineRow,
    mode: DragState['mode'],
  ) {
    if (dependencyMode) {
      return;
    }
    if (!canManageProjectSchedule) {
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
      Math.min(timelineDays.length - 1, Math.floor((event.clientX - rect.left) / dayColumnWidth)),
    );
    const startIndex = row.startDate ? daysBetween(timelineRange.start, row.startDate) : pointerIndex;
    const endIndex = row.endDate ? daysBetween(timelineRange.start, row.endDate) : pointerIndex;

    movedRef.current = false;
    suppressEditorOpenRef.current = false;
    setSelectedRowId(row.id);
    const nextDragState: DragState = {
      anchorIndex: pointerIndex,
      currentIndex: pointerIndex,
      mode,
      originalEndIndex: endIndex,
      originalStartIndex: startIndex,
      rowId: row.id,
    };
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
    dragCompletedRef.current = false;
    dragCleanupRef.current?.();

    const handleImmediateMouseMove = (moveEvent: MouseEvent) => {
      applyDragAutoScroll(moveEvent);
      const currentTrack = rowTrackRefs[row.id];
      const currentDrag = dragStateRef.current;
      if (!currentTrack || !currentDrag || currentDrag.rowId !== row.id) {
        return;
      }

      const nextRect = currentTrack.getBoundingClientRect();
      const rawIndex = Math.floor((moveEvent.clientX - nextRect.left) / dayColumnWidth);
      const nextIndex = Math.max(0, Math.min(timelineDays.length - 1, rawIndex));
      if (nextIndex === currentDrag.currentIndex) {
        return;
      }

      movedRef.current = true;
      const next = {
        ...currentDrag,
        currentIndex: nextIndex,
      };
      dragStateRef.current = next;
      setDragState(next);
    };

    const handleImmediateMouseUp = () => {
      if (dragCompletedRef.current) {
        return;
      }
      dragCompletedRef.current = true;
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
      const currentDrag = dragStateRef.current;
      dragStateRef.current = null;
      setDragState(null);
      if (!currentDrag || !movedRef.current) {
        return;
      }

      const targetRow = findRow(currentDrag.rowId);
      if (!targetRow) {
        return;
      }

      const preview = getDragPreviewRange(currentDrag);
      movedRef.current = false;
      suppressEditorOpenRef.current = true;
      if (currentDrag.mode === 'create' && targetRow.entityKind === 'task') {
        addLocalTaskTimeNode(targetRow, preview.startDate, preview.endDate);
        return;
      }

      void handleCascadeAfterDrag(targetRow, preview.startDate, preview.endDate);
    };

    const cleanupImmediateDrag = () => {
      window.removeEventListener('mousemove', handleImmediateMouseMove);
      window.removeEventListener('mouseup', handleImmediateMouseUp);
    };
    dragCleanupRef.current = cleanupImmediateDrag;
    window.addEventListener('mousemove', handleImmediateMouseMove);
    window.addEventListener('mouseup', handleImmediateMouseUp);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleTimelineMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left + event.currentTarget.scrollLeft;
    if (relativeX < 0 || relativeX > timelineWidth) {
      setHoverIndex(null);
      return;
    }
    setHoverIndex(
      Math.max(0, Math.min(timelineDays.length - 1, Math.floor(relativeX / dayColumnWidth))),
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

  function beginDependencyConnectFromRow(row: TimelineRow) {
    if (!ensureCanManageProjectSchedule()) {
      return;
    }
    if (!row.entityId || row.entityKind !== 'task') {
      setFeedback({
        message: '请先选择一个任务，再建立依赖关系。',
        tone: 'danger',
      });
      return;
    }
    if (isVirtualTimelineId(row.entityId)) {
      setFeedback({
        message: '虚拟任务仅用于排期预览，不支持建立依赖关系。',
        tone: 'danger',
      });
      return;
    }

    setDependencyMode({
      sourceRowId: row.id,
      sourceTaskId: row.entityId,
    });
    setSelectedRowId(row.id);
    setFeedback({
      message: `已选择「${row.title}」作为前驱任务，请点击后继任务条建立依赖。`,
      tone: 'success',
    });
  }

  function startDependencyConnect(event: React.MouseEvent<HTMLElement>, row: TimelineRow) {
    event.preventDefault();
    event.stopPropagation();
    beginDependencyConnectFromRow(row);
  }

  function startDependencyFromSelected() {
    const row = selectedRowId ? findRow(selectedRowId) : null;
    if (!row) {
      setFeedback({
        message: '请先选择一个任务，再建立依赖关系。',
        tone: 'danger',
      });
      return;
    }

    beginDependencyConnectFromRow(row);
  }

  async function handleDependencyTargetClick(row: TimelineRow) {
    if (!dependencyMode) {
      return false;
    }
    if (!ensureCanManageProjectSchedule()) {
      return true;
    }
    if (!selectedProjectId || !row.entityId || row.entityKind !== 'task') {
      return true;
    }
    if (isVirtualTimelineId(dependencyMode.sourceTaskId) || isVirtualTimelineId(row.entityId)) {
      setFeedback({
        message: '虚拟任务仅用于排期预览，不支持建立依赖关系。',
        tone: 'danger',
      });
      setDependencyMode(null);
      return true;
    }
    if (dependencyMode.sourceTaskId === row.entityId) {
      setFeedback({
        message: '前驱任务和后继任务不能是同一个任务。',
        tone: 'danger',
      });
      return true;
    }
    if (!onCreateDependency) {
      setFeedback({
        message: '依赖创建功能暂不可用。',
        tone: 'danger',
      });
      return true;
    }
    const exists = taskDependencies.some(
      (dependency) =>
        dependency.predecessorTaskId === dependencyMode.sourceTaskId &&
        dependency.successorTaskId === row.entityId,
    );
    if (exists) {
      setFeedback({
        message: '这两个任务已经存在依赖关系。',
        tone: 'danger',
      });
      setDependencyMode(null);
      return true;
    }

    setActionLoading(true);
    try {
      await onCreateDependency(selectedProjectId, {
        dependencyType: 'FS',
        lagDays: 0,
        predecessorTaskId: dependencyMode.sourceTaskId,
        successorTaskId: row.entityId,
      });
      setFeedback({
        message: `已建立到「${row.title}」的完成-开始依赖。`,
        tone: 'success',
      });
      setDependencyMode(null);
      setSelectedRowId(row.id);
    } catch (error) {
      setFeedback({
        message: buildFeedbackMessage(error),
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
    return true;
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
    if (isVirtualTimelineId(row.entityId)) {
      await saveRowSchedule(row, startDate, endDate);
      return;
    }
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

  if (!selectedProjectId || !selectedProject) {
    return (
      <Card className="rounded-lg border border-[#e4ebf5] bg-white p-4 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
        <div className="space-y-4">
          <div className="text-[13px] font-medium text-[#6b7f9e]">
            排期协同
          </div>
          <div className="text-[20px] font-bold text-[#111c33]">
            先选择一个项目，再进入排期协同工作区。
          </div>
          <div className="max-w-2xl text-[14px] font-medium leading-6 text-[#5e7291]">
            这里会展示项目节点、任务树、时间轴和依赖关系。当前还没有选中项目，所以暂时无法进入图形化排期界面。
          </div>
          <div className="flex gap-3">
            <Button className="portal-project-shell__primary-button" onClick={onOpenProjectManagement}>去项目管理页选择项目</Button>
            <Button className="portal-project-shell__secondary-button" onClick={onOpenProgressConfig} tone="ghost">
              查看里程碑模板
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col text-[13px] font-medium leading-[1.5] text-[#526681]">
      {/* 主内容区域 */}
      <div className={`relative flex min-h-0 flex-1 transition-all duration-300 ${teamPanelVisible ? 'mr-[480px]' : ''}`}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-transparent p-0">
          <div className="flex min-h-[112px] items-start justify-between gap-4 rounded-t-lg border-b border-[#edf2f8] bg-white px-4 py-4">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[#6b7f9e]">
                项目 <span className="mx-2 text-[#b7c4d8]">/</span> 项目控制
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-semibold leading-7 text-[#111c33]">排期协同</h1>
                <span className="rounded-[6px] border border-sky-100 bg-sky-50 px-2 py-1 text-[12px] font-medium text-[var(--portal-color-brand-600)]">
                  项目控制
                </span>
              </div>
              <p className="mt-2 text-[14px] font-medium leading-6 text-[#5e7291]">
                承接管理员排期、节点任务搭建、分配与甘特调整。
              </p>
            </div>
            <button
              className="portal-project-shell__secondary-button shrink-0"
              onClick={onExitSystem}
              type="button"
            >
              返回系统选择
            </button>
          </div>

          <div className="grid w-full grid-cols-[minmax(240px,1.1fr)_minmax(320px,1.35fr)_minmax(220px,0.85fr)_minmax(280px,1fr)] gap-4 rounded-b-lg bg-white px-5 py-4">
            {/* 卡片1：整体完成率 */}
            <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
              {/* 左侧环形进度图 */}
              <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                <svg height="80" viewBox="0 0 36 36" width="80">
                  <circle
                    cx="18"
                    cy="18"
                    fill="none"
                    r="14.5"
                    stroke="#f3f4f6"
                    strokeDasharray="91.1"
                    strokeWidth="3"
                  />
                  <circle
                    className="transition-all duration-500"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="14.5"
                    stroke="#3b82f6"
                    strokeDasharray={`${(completionRate / 100 * 91.1).toFixed(1)} 91.1`}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-arial text-[18px] font-bold leading-none text-[#1e40af]">{completionRate}%</span>
                </div>
              </div>
              {/* 右侧文字 */}
              <div className="min-w-0 flex-1 font-arial">
                <div className="text-[13px] font-medium text-[#374151]">整体完成率</div>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-emerald-600">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span>较上次更新 ↑ 5.2%</span>
                </div>
                <div className="mt-1 text-[12px] text-[#9ca3af]">更新时间：5分钟前</div>
              </div>
            </div>

            {/* 卡片2：当前项目 */}
            <div className="flex min-w-0 rounded-xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
              <div className="flex w-full items-start gap-4">
                {/* 左侧图标 */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#ede9fe]">
                  <svg className="h-6 w-6 text-[#7c3aed]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {/* 右侧内容 */}
                <div className="min-w-0 flex-1 font-arial">
                  <div className="text-[12px] font-medium text-[#9ca3af]">当前项目</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-[13px] font-semibold text-[#111827]">
                      {selectedProject.projectName}
                    </div>
                    <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[12px] font-medium text-[#6b7280]">
                      {selectedProject.projectCode}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[12px] font-semibold ${
                        canManageProjectSchedule
                          ? 'bg-[#10b981] text-white'
                          : 'bg-[#f59e0b] text-white'
                      }`}
                    >
                      {canManageProjectSchedule ? '可编辑' : '只读'}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[12px] leading-5 text-[#6b7280]">
                    先确认项目范围和排期状态，再进入节点、任务和依赖维护。
                  </div>
                </div>
              </div>
            </div>

            {/* 卡片3：任务统计 */}
            <div className="flex min-w-0 flex-col rounded-xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#9ca3af]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[12px] font-medium text-[#9ca3af]">任务统计</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div className="flex flex-col items-center">
                  <div className="text-[22px] font-bold leading-none text-[#10b981]">{statistics?.completedTaskCount ?? 0}</div>
                  <div className="mt-1 text-[12px] font-medium text-[#6b7280]">已完成</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[22px] font-bold leading-none text-[#6b7280]">
                    {Math.max(0, (statistics?.taskCount ?? tasks.length) - (statistics?.completedTaskCount ?? 0))}
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-[#6b7280]">未完成</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[22px] font-bold leading-none text-[#ef4444]">{statistics?.inProgressTaskCount ?? 0}</div>
                  <div className="mt-1 text-[12px] font-medium text-[#6b7280]">进行中</div>
                </div>
              </div>
            </div>

            {/* 卡片4：时间对比 */}
            <div className="flex min-w-0 flex-col rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#6b7280]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[12px] font-medium text-[#6b7280]">时间对比</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-center font-arial">
                  <div className="text-[13px] font-semibold text-[#111827]">{formatMonthDay(plannedFinish)}</div>
                  <div className="mt-1 text-[12px] font-medium text-[#6b7280]">计划完成</div>
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-[#d1d5db]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="text-center font-arial">
                  <div className="text-[13px] font-semibold text-[#f59e0b]">{formatMonthDay(predictedFinish)}</div>
                  <div className="mt-1 text-[12px] font-medium text-[#6b7280]">预计完成</div>
                </div>
                <div className="text-center font-arial">
                  <div className="text-[13px] font-semibold text-[#f59e0b]">
                    {deviationDays === null ? '--' : `${deviationDays > 0 ? '+' : ''}${deviationDays}`}天
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-[#6b7280]">时间偏差</div>
                </div>
              </div>
            </div>
          </div>
        <div className="h-4 flex-shrink-0 bg-[#f5f8ff]" />
        <div className="sticky top-0 z-30 flex flex-shrink-0 flex-col overflow-hidden rounded-t-lg border-b border-[#d9e4f5] bg-white">
          {/* 筛选栏第一行 */}
          <div className="flex h-12 items-center gap-2 border-b border-[#e4edf8] bg-white px-3">
            {/* 所有项目 */}
            <button
              className="flex h-8 w-[104px] min-w-0 items-center justify-between gap-1 rounded-[4px] border border-[#d8e3f0] bg-white px-2.5 text-[12px] font-medium text-[#526681] transition-colors hover:border-[#b9cbe1]"
              type="button"
            >
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">所有项目</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            </button>
            {/* 所有负责人 */}
            <button
              className="flex h-8 w-[112px] min-w-0 items-center justify-between gap-1 rounded-[4px] border border-[#d8e3f0] bg-white px-2.5 text-[12px] font-medium text-[#526681] transition-colors hover:border-[#b9cbe1]"
              type="button"
            >
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">所有负责人</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            </button>
            {/* 搜索任务名称 */}
            <div className="relative flex h-8 items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#9ca3af]" strokeWidth={1.8} />
              <input
                className="h-8 w-[164px] rounded-[4px] border border-[#d8e3f0] bg-white pl-7 pr-2.5 text-[12px] font-medium text-[#526681] placeholder:text-[#9ca3af] outline-none transition focus:border-[#1f7cff] focus:ring-1 focus:ring-[#dceaff]"
                placeholder="搜索任务名称"
                type="text"
              />
            </div>
            {/* 日/周/月切换 */}
            <div className="ml-auto flex h-8 items-center overflow-hidden rounded-[4px] border border-[#d8e3f0] bg-white">
              {TIMELINE_SCALE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`h-full w-9 border-r border-[#e4edf8] text-[12px] font-medium transition last:border-r-0 ${
                    timelineScale === option.value
                      ? 'bg-[#1f7cff] text-white shadow-[inset_0_0_0_1px_#1f7cff]'
                      : 'text-[#526681] hover:bg-[#f0f7ff]'
                  }`}
                  onClick={() => {
                    handleTimelineScaleChange(option.value);
                  }}
                  title={option.title}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {/* 今天按钮 */}
            <button
              className="flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d8e3f0] bg-white px-3 text-[12px] font-medium text-[#526681] transition-colors hover:border-[#b9cbe1]"
              onClick={() => {
                if (currentLineIndex !== null) {
                  scrollTimelineToDayIndex(currentLineIndex, dayColumnWidth, 'focus');
                }
              }}
              type="button"
            >
              <CalendarDays className="h-3.5 w-3.5 text-[#6b7f9e]" strokeWidth={1.8} />
              今天
            </button>
            {/* 状态图例 */}
            <div className="flex items-center gap-3 border-l border-[#e4edf8] pl-3 text-[12px] font-medium text-[#526681]">
              {TASK_STATUS_LEGEND_ITEMS.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span
                    className="h-2 w-2 rounded-full border"
                    style={{ backgroundColor: item.fill, borderColor: item.border }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          {/* 表头第二行 */}
          <div className="flex h-[56px] flex-shrink-0">
            {/* 左侧：任务名称 */}
            <div
              className="flex items-center gap-2 border-r border-[#d9e4f5] bg-white px-3 font-arial"
              style={{ width: SIDEBAR_WIDTH }}
            >
              <span className="text-[13px] font-semibold text-[#263653]">任务名称</span>
              <Settings2 className="ml-auto h-3.5 w-3.5 text-[#8da0bd]" strokeWidth={1.8} />
              <span className="text-[12px] font-medium text-[#6b7f9e]">总数</span>
            </div>
            {/* 右侧：日期表头 */}
            <div className="flex-1 overflow-hidden">
              <div
                className="relative h-full overflow-hidden bg-white"
                ref={(element: HTMLDivElement | null) => {
                  axisRef.current = element;
                }}
              >
                {/* 月份切换行 */}
                <div className="absolute bottom-7 left-0 right-0 h-7 border-b border-[#e4edf8] bg-white" />
                <div
                  className="absolute bottom-7 left-0 z-40 flex h-7 w-[132px] cursor-grab select-none items-center overflow-hidden border-r border-[#d9e7f7] bg-white text-[#1f65e8] active:cursor-grabbing"
                  onPointerCancel={endTimelinePan}
                  onPointerDown={startTimelinePan}
                  onPointerMove={moveTimelinePan}
                  onPointerUp={endTimelinePan}
                  onWheel={handleTimelineAxisWheel}
                >
                  <button
                    aria-label="查看上个月"
                    className="flex h-full w-7 items-center justify-center text-[#8da0bd] transition hover:bg-[#edf6ff] hover:text-[#1f65e8] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={activeMonthIndex <= 0}
                    onClick={() => {
                      jumpTimelineMonth(-1);
                    }}
                    onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
                      event.stopPropagation();
                    }}
                    type="button"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  <div className="flex h-full flex-1 items-center justify-center text-[13px] font-semibold">
                    {activeMonthOption?.label ?? '月份'}
                  </div>
                  <button
                    aria-label="查看下个月"
                    className="flex h-full w-7 items-center justify-center text-[#8da0bd] transition hover:bg-[#edf6ff] hover:text-[#1f65e8] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={activeMonthIndex >= timelineMonthOptions.length - 1}
                    onClick={() => {
                      jumpTimelineMonth(1);
                    }}
                    onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
                      event.stopPropagation();
                    }}
                    type="button"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
                {/* 日期刻度行 */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 h-[56px] will-change-transform"
                  style={{
                    transform: `translateX(${-timelineViewport.scrollLeft}px)`,
                    width: timelineWidth,
                  }}
                >
                  <div className="relative z-10 flex h-full flex-col" style={{ width: timelineWidth }}>
                    <div className="h-7"></div>
                    <div className="relative flex-1">
                      {visibleTimelineDays.map(({ day, index }) => {
                        const dayOfWeek = getDayOfWeek(new Date(day.date));
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const isCurrentDay = currentDayId === day.id;
                        return (
                          <div
                            key={day.id}
                            className={`absolute top-0 flex h-full items-center justify-center border-r border-[#d9e7f7] text-[12px] font-medium ${
                              isCurrentDay
                                ? 'bg-[#1f7cff] text-white'
                                : isWeekend
                                  ? 'bg-[#fff7ed] text-[#ff8a00]'
                                  : 'text-[#526681]'
                            }`}
                            style={{ left: index * dayColumnWidth, width: dayColumnWidth }}
                          >
                            {isWeekend ? '休' : day.date.getDate()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div
                  aria-label="拖动时间轴"
                  className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 h-7 cursor-grab select-none active:cursor-grabbing touch-pan-x"
                  onPointerCancel={endTimelinePan}
                  onPointerDown={startTimelinePan}
                  onPointerMove={moveTimelinePan}
                  onPointerUp={endTimelinePan}
                  onWheel={handleTimelineAxisWheel}
                  role="presentation"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <div
            className="flex min-h-0 flex-shrink-0 flex-col border-r border-[#d9e4f5] bg-white"
            style={{ width: SIDEBAR_WIDTH }}
          >
              <div
                className="no-scrollbar min-h-0 flex-1 overflow-hidden"
                onWheel={handleLeftBodyWheel}
                ref={(element: HTMLDivElement | null) => {
                  leftBodyRef.current = element;
                }}
              >
                {visibleRows.map((row) => {
                  const isSelected = selectedRowId === row.id;
                  if (row.rowType === 'category') {
                    const taskCount = row.count ?? 0;
                    return (
                      <button
                      key={row.id}
                      className="group flex w-full items-center gap-2 border-b border-[#e4edf8] bg-white px-4 text-left text-[13px] font-semibold leading-5 text-[#263653] transition-colors hover:bg-[#f6faff]"
                      onClick={() => {
                        setSelectedRowId(row.id);
                        toggleExpand(row.id);
                      }}
                      style={{ height: CATEGORY_ROW_HEIGHT }}
                      type="button"
                    >
                      {(expandedMap[row.id] ?? true) ? (
                        <ChevronDown className="h-4 w-4 text-[#526681]" strokeWidth={1.7} />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#526681]" strokeWidth={1.7} />
                      )}
                      <span className="min-w-0 flex-1 truncate pr-2">{row.title}</span>
                      <span className="ml-auto flex shrink-0 items-center gap-1">
                        {row.entityId ? (
                          <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <span
                              aria-label={`新增${row.title}子项`}
                              className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#d9e3f1] bg-white text-[#6b7f9e] transition-colors hover:border-sky-200 hover:text-[var(--portal-color-brand-600)]"
                              onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                                openCreateDialog('node', row);
                              }}
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                              }}
                              role="button"
                              tabIndex={0}
                              title="新增子项"
                            >
                              <FolderKanban className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                            </span>
                            <span
                              aria-label={`新增${row.title}任务`}
                              className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#d9e3f1] bg-white text-[#6b7f9e] transition-colors hover:border-sky-200 hover:text-[var(--portal-color-brand-600)]"
                              onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                                openCreateDialog('task', row);
                              }}
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                              }}
                              role="button"
                              tabIndex={0}
                              title="新增任务"
                            >
                              <ClipboardList className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                            </span>
                            <span
                              aria-label={`删除${row.title}`}
                              className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-rose-100 bg-white text-rose-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                                void handleDeleteRow(row);
                              }}
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.stopPropagation();
                              }}
                              role="button"
                              tabIndex={0}
                              title="删除"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                            </span>
                          </span>
                        ) : null}
                      <span className="rounded-[4px] bg-[#edf4ff] px-2 py-0.5 text-[12px] font-medium leading-5 text-[#526681]">
                          {ganttSegmentCountByRowId.get(row.id) ?? 0}
                        </span>
                      </span>
                    </button>
                  );
                  }

                  if (row.rowType === 'subCategory') {
                  return (
                    <button
                      key={row.id}
                      className={`group relative flex w-full items-center gap-2 border-b border-[#e4edf8] px-4 pl-7 text-left text-[13px] font-medium leading-5 transition-colors ${
                        isSelected
                          ? 'bg-[#eaf4ff] text-[var(--portal-color-brand-600)] shadow-[inset_3px_0_0_0_#1f7cff]'
                          : 'bg-white text-[#526681] hover:bg-[#f8fbff]'
                      }`}
                      onClick={() => {
                        setSelectedRowId(row.id);
                        toggleExpand(row.id);
                      }}
                      style={{ height: SUB_CATEGORY_ROW_HEIGHT }}
                      type="button"
                    >
                      {(expandedMap[row.id] ?? true) ? (
                        <ChevronDown className="h-3.5 w-3.5 text-[#8da0bd]" strokeWidth={1.7} />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-[#8da0bd]" strokeWidth={1.7} />
                      )}
                      <span className="min-w-0 flex-1 truncate pr-2">{row.title}</span>
                      <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {row.entityId ? (
                        <span
                          aria-label={`新增${row.title}子项`}
                          className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#d9e3f1] bg-white text-[#6b7f9e] transition-colors hover:border-sky-200 hover:text-[var(--portal-color-brand-600)]"
                          onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                            openCreateDialog('node', row);
                          }}
                          onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                          }}
                          role="button"
                          tabIndex={0}
                          title="新增子项"
                        >
                          <FolderKanban className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                        </span>
                        ) : null}
                        {row.entityId ? (
                        <span
                          aria-label={`新增${row.title}任务`}
                          className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#d9e3f1] bg-white text-[#6b7f9e] transition-colors hover:border-sky-200 hover:text-[var(--portal-color-brand-600)]"
                          onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                            openCreateDialog('task', row);
                          }}
                          onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                          }}
                          role="button"
                          tabIndex={0}
                          title="新增任务"
                        >
                          <ClipboardList className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                        </span>
                        ) : null}
                        {row.entityId ? (
                        <span
                          aria-label={`删除${row.title}`}
                          className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-rose-100 bg-white text-rose-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                            void handleDeleteRow(row);
                          }}
                          onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                            event.stopPropagation();
                          }}
                          role="button"
                          tabIndex={0}
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                        </span>
                        ) : null}
                      </span>
                      <span className="ml-auto rounded-[4px] bg-[#edf4ff] px-2 py-0.5 text-[12px] font-medium leading-5 text-[#526681] transition-colors group-hover:bg-[#eaf2ff]">
                        {ganttSegmentCountByRowId.get(row.id) ?? 0}
                      </span>
                    </button>
                  );
                }

                return (
                  <div
                    key={row.id}
                    className={`group relative flex w-full items-center gap-2 border-b border-[#e4edf8] px-4 pl-12 pr-3 text-left text-[13px] font-medium leading-5 transition-colors ${
                      isSelected
                        ? 'bg-[#edf6ff] text-[var(--portal-color-brand-600)] shadow-[inset_3px_0_0_0_var(--portal-color-brand-500)]'
                        : 'bg-white text-[#526681] hover:bg-[#f8fbff]'
                    }`}
                    onClick={() => {
                      openDetailPanel(row);
                    }}
                    onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDetailPanel(row);
                      }
                    }}
                    role="button"
                    style={{ height: TASK_ROW_HEIGHT }}
                    tabIndex={0}
                  >
                    {(() => {
                      const taskDisplayMeta = getTaskDisplayMeta(row);
                      const compactMeta = [
                        taskDisplayMeta.assignmentStatusLabel,
                        row.owner ? `负责人:${row.owner}` : null,
                      ].filter(Boolean).join(' · ');
                      return (
                        <>
                          <TaskMark active={isSelected} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{row.title}</span>
                            <span className="hidden min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#8da0bd]">
                              <span className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${taskDisplayMeta.assignmentToneClassName}`}>
                                {taskDisplayMeta.assignmentStatusLabel}
                              </span>
                              <span className="min-w-0 truncate">{compactMeta}</span>
                            </span>
                          </span>
                          <span className="hidden">
                            <button
                              aria-label={`分配${row.title}人员`}
                              className="portal-project-shell__icon-button h-6 w-6"
                              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                event.stopPropagation();
                                void openQuickAssign(row);
                              }}
                              type="button"
                            >
                              <Hand className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                            </button>
                            <button
                              aria-label={`新增${row.title}子任务`}
                              className="portal-project-shell__icon-button h-6 w-6"
                              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                event.stopPropagation();
                                handleQuickCreate(row);
                              }}
                              type="button"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                            </button>
                            <button
                              aria-label={`删除${row.title}`}
                              className="portal-project-shell__icon-button h-6 w-6 text-rose-500 hover:text-rose-600"
                              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                event.stopPropagation();
                                void handleDeleteRow(row);
                              }}
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                            </button>
                          </span>
                        </>
                      );
                    })()}
                  </div>
                );
              })}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fbfdff]">
              <div
                className="no-scrollbar relative min-h-0 flex-1 overflow-auto bg-[#fbfdff]"
                onMouseLeave={() => {
                  setHoverIndex(null);
                }}
                onMouseMove={handleTimelineMouseMove}
                onScroll={syncAxisScroll}
                ref={(element: HTMLDivElement | null) => {
                  bodyRef.current = element;
                }}
              >
                <div className="relative min-h-full bg-white" style={{ width: timelineWidth }}>
              <div className="pointer-events-none absolute inset-0 z-0">
                {visibleTimelineDays.map(({ day, index }) => {
                  const dayOfWeek = getDayOfWeek(new Date(day.date));
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  return (
                    <div
                      key={`grid-${day.id}`}
                      className={`absolute inset-y-0 border-r border-[#dfeafb] ${
                        isWeekend ? 'bg-amber-50/50' : ''
                      }`}
                      style={{ left: index * dayColumnWidth, width: dayColumnWidth }}
                    />
                  );
                })}
              </div>
              {currentLineIndex !== null ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-0 bg-sky-500/[0.06]"
                  style={{
                    left: currentLineIndex * dayColumnWidth,
                    width: dayColumnWidth,
                  }}
                />
              ) : null}
              {hoverIndex !== null ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-30 border-l border-sky-400"
                  style={{ left: hoverIndex * dayColumnWidth }}
                />
              ) : currentLineIndex !== null ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-20 border-l border-sky-500"
                  style={{ left: currentLineIndex * dayColumnWidth }}
                />
              ) : null}

              <div style={{ width: timelineWidth }}>
                {visibleRows.map((row) => {
                  const rowHeight = getRowHeight(row);
                  const preview = getRowPreview(row);
                  const hasBar = Boolean(preview.startDate && preview.endDate && row.entityKind);
                  const taskTimeNodes =
                    row.entityKind === 'task' && row.entityId
                      ? localTaskTimeNodes.filter((timeNode) => timeNode.taskId === row.entityId)
                      : [];
                  const hasAnyTimelineSegment = hasBar || taskTimeNodes.length > 0;
                  const isSelected = selectedRowId === row.id;
                  const palette = getBarPalette(row);
                  const left =
                    preview.startDate && hasBar
                      ? daysBetween(timelineRange.start, preview.startDate) * dayColumnWidth
                      : 0;
                  const width =
                    preview.startDate && preview.endDate && hasBar
                      ? (daysBetween(preview.startDate, preview.endDate) + 1) * dayColumnWidth
                      : 0;
                  const taskDisplayMeta = getTaskDisplayMeta(row);
                  const isMicroBar = width < 44;
                  const showInlineTitle = width >= 54;
                  const showTaskStatusInline = row.entityKind === 'task' && width >= 108;
                  const showProgressBadge = width >= 96;
                  const showOwnerInline = row.entityKind === 'task' && Boolean(taskDisplayMeta.responsibleLabel) && width >= 154;
                  const showDateRange = width >= 202;
                  const showRoleInline = Boolean(taskDisplayMeta.ownerRoleName) && width >= 246;
                  const showParticipantInline = Boolean(taskDisplayMeta.participantLabel) && width >= 292;
                  const showAssignAction = row.entityKind === 'task' && width >= 136;
                  const overflowSegments = [
                    !showInlineTitle ? (row.entityKind === 'task' ? taskDisplayMeta.taskShortName : row.title) : null,
                    row.entityKind === 'task' && !showTaskStatusInline ? taskDisplayMeta.taskStatusLabel : null,
                    row.entityKind === 'task' && !showOwnerInline ? `负责人:${taskDisplayMeta.responsibleLabel}` : null,
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
                  const isDraggingRow = dragState?.rowId === row.id;
                  const isDependencySource = dependencyMode?.sourceRowId === row.id;
                  const isDependencyTarget =
                    Boolean(dependencyMode) &&
                    row.entityKind === 'task' &&
                    row.id !== dependencyMode?.sourceRowId;
                  const dependencyShadow = isDependencySource
                    ? `0 0 0 2px rgba(31,124,255,0.55), 0 10px 24px rgba(31,124,255,0.18)`
                    : isDependencyTarget
                      ? `0 0 0 2px rgba(16,185,129,0.42), 0 10px 24px rgba(16,185,129,0.14)`
                      : undefined;
                  const dragPreviewLabelLeft = Math.min(
                    Math.max(4, left + Math.max(0, width / 2 - 96)),
                    Math.max(4, timelineWidth - 196),
                  );

                  return (
                    <div
                      key={`${row.id}-timeline`}
                      className={`group/row relative border-b border-black/5 ${
                        row.rowType === 'category'
                          ? 'bg-[#f7faff]'
                          : row.rowType === 'subCategory'
                            ? 'bg-[#fcfdff]'
                            : 'bg-white hover:bg-[#f8fbff]'
                      } ${isDraggingRow ? 'bg-[#edf6ff]' : ''} ${isDependencyTarget ? 'bg-emerald-50/30' : ''}`}
                      style={{ height: rowHeight }}
                    >
                      {/* 周末背景层 */}
                      {visibleTimelineDays.map(({ day, index }) => {
                        const dow = getDayOfWeek(new Date(day.date));
                        const isWeekend = dow === 0 || dow === 6;
                        return isWeekend ? (
                          <div
                            key={`${row.id}-weekend-${day.id}`}
                            className="pointer-events-none absolute inset-y-0 bg-[#fef9f0] opacity-60"
                            style={{ left: index * dayColumnWidth, width: dayColumnWidth }}
                          />
                        ) : null;
                      })}
                      {/* 网格线 */}
                      {visibleTimelineDays.map(({ day, index }) => (
                        <div
                          key={`${row.id}-${day.id}`}
                          className="pointer-events-none absolute inset-y-0 border-r border-[#dfeafb]"
                          style={{ left: index * dayColumnWidth, width: dayColumnWidth }}
                        />
                      ))}

                      {row.entityKind && row.entityId ? (
                        <div
                          className={`absolute inset-0 ${
                            canManageProjectSchedule
                              ? 'cursor-crosshair transition-colors group-hover/row:bg-sky-50/35'
                              : ''
                          }`}
                          onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
                            if (dependencyMode) {
                              return;
                            }
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

                      {taskTimeNodes.map((timeNode, timeNodeIndex) => {
                        const timeNodeLeft = daysBetween(timelineRange.start, timeNode.startDate) * dayColumnWidth;
                        const timeNodeWidth =
                          (daysBetween(timeNode.startDate, timeNode.endDate) + 1) * dayColumnWidth;
                        const laneTop = [4, 20][timeNodeIndex % 2] ?? 4;
                        return (
                          <button
                            key={timeNode.id}
                            className="group/time-node absolute z-20 h-5 cursor-grab rounded-[6px] border border-l-[3px] text-left shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition hover:brightness-[1.03] active:cursor-grabbing"
                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                              event.stopPropagation();
                              if (suppressEditorOpenRef.current) {
                                suppressEditorOpenRef.current = false;
                                return;
                              }
                              if (canManageProjectSchedule) {
                                openTimeNodeEditor(row, timeNode);
                                return;
                              }
                              openDetailPanel(row);
                            }}
                            onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
                              if (!canManageProjectSchedule || dependencyMode) {
                                event.stopPropagation();
                                return;
                              }
                              const rect = event.currentTarget.getBoundingClientRect();
                              const offsetX = event.clientX - rect.left;
                              const edgeHitSize = Math.min(14, Math.max(8, rect.width / 3));
                              if (offsetX <= edgeHitSize) {
                                startTimeNodeResize(event, row, timeNode, 'resize-start');
                                return;
                              }
                              if (rect.width - offsetX <= edgeHitSize) {
                                startTimeNodeResize(event, row, timeNode, 'resize-end');
                                return;
                              }
                              startTimeNodeResize(event, row, timeNode, 'move');
                            }}
                            style={{
                              backgroundColor: palette.fill,
                              borderColor: palette.border,
                              borderLeftColor: palette.border,
                              left: timeNodeLeft,
                              top: laneTop,
                              width: Math.max(14, timeNodeWidth),
                            }}
                            title={`${row.title} / ${timeNode.title}: ${formatShortMonthDay(timeNode.startDate)}-${formatShortMonthDay(timeNode.endDate)}，拖动移动，点击编辑`}
                            type="button"
                          >
                            <span
                              aria-label="调整时间节点开始时间"
                              className="absolute inset-y-0 left-0 z-20 flex w-3 cursor-ew-resize items-center justify-center bg-white/10 opacity-0 transition-opacity group-hover/time-node:opacity-100"
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                startTimeNodeResize(event, row, timeNode, 'resize-start');
                              }}
                              role="button"
                              tabIndex={0}
                            />
                            <span
                              aria-label="调整时间节点结束时间"
                              className="absolute inset-y-0 right-0 z-20 flex w-3 cursor-ew-resize items-center justify-center bg-white/10 opacity-0 transition-opacity group-hover/time-node:opacity-100"
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                startTimeNodeResize(event, row, timeNode, 'resize-end');
                              }}
                              role="button"
                              tabIndex={0}
                            />
                            <span
                              className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white/85"
                              style={{ boxShadow: `0 0 0 2px ${palette.border}` }}
                            />
                            {timeNodeWidth >= 72 ? (
                              <span className="flex min-w-0 items-center gap-1.5 pl-5 pr-2 text-[12px] font-medium leading-5 text-slate-700">
                                <span className="min-w-0 truncate">{taskDisplayMeta.taskShortName}</span>
                                {timeNodeWidth >= 118 ? (
                                  <span className={`shrink-0 rounded px-1 py-0 text-[12px] ${taskDisplayMeta.taskStatusToneClassName}`}>
                                    {taskDisplayMeta.taskStatusLabel}
                                  </span>
                                ) : null}
                                {timeNodeWidth >= 168 ? (
                                  <span className="shrink-0 rounded bg-white/70 px-1 py-0 text-[12px] text-slate-500">
                                    {taskDisplayMeta.responsibleLabel}
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}

                      {hasBar ? (
                        <>
                        <button
                          className={`group/task absolute top-1/2 z-30 h-6 -translate-y-1/2 overflow-hidden rounded-[6px] border border-l-[3px] text-left shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-[filter,box-shadow] hover:brightness-[1.03] ${
                            dependencyMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                          } ${
                            isMicroBar ? 'px-1' : 'px-2'
                          }`}
                          onMouseEnter={() => setHoveredGanttBarId(row.id)}
                          onMouseLeave={() => setHoveredGanttBarId(null)}
                          onDoubleClick={() => {
                            if (!dependencyMode) {
                              openDetailPanel(row);
                            }
                          }}
                          onClick={() => {
                            if (suppressEditorOpenRef.current) {
                              suppressEditorOpenRef.current = false;
                              return;
                            }
                            if (dependencyMode) {
                              void handleDependencyTargetClick(row);
                              return;
                            }
                            openDetailPanel(row);
                          }}
                          onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
                            if (dependencyMode) {
                              event.preventDefault();
                              event.stopPropagation();
                              return;
                            }
                            if (event.detail === 1) {
                              const rect = event.currentTarget.getBoundingClientRect();
                              const offsetX = event.clientX - rect.left;
                              const edgeHitSize = Math.min(16, Math.max(8, rect.width / 3));
                              if (offsetX <= edgeHitSize) {
                                startDrag(event, row, 'resize-start');
                                return;
                              }
                              if (rect.width - offsetX <= edgeHitSize) {
                                startDrag(event, row, 'resize-end');
                                return;
                              }
                              startDrag(event, row, 'move');
                            }
                          }}
                          style={{
                            backgroundColor: palette.fill,
                            borderColor: palette.border,
                            borderLeftColor: palette.border,
                            boxShadow: isDraggingRow
                              ? `0 0 0 2px ${palette.border}66, 0 10px 24px rgba(15,23,42,0.14)`
                              : dependencyShadow ?? (isSelected ? `0 0 0 2px ${palette.border}40` : undefined),
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
                            aria-label="调整开始时间"
                            className="absolute inset-y-0 left-0 z-20 flex w-3 cursor-ew-resize items-center justify-center bg-white/10 opacity-0 transition-opacity group-hover/task:opacity-100"
                            onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                              event.preventDefault();
                              event.stopPropagation();
                              startDrag(event, row, 'resize-start');
                            }}
                            role="button"
                            tabIndex={0}
                          />
                          <span
                            aria-label="调整结束时间"
                            className="absolute inset-y-0 right-0 z-20 flex w-3 cursor-ew-resize items-center justify-center bg-white/10 opacity-0 transition-opacity group-hover/task:opacity-100"
                            onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                              event.preventDefault();
                              event.stopPropagation();
                              startDrag(event, row, 'resize-end');
                            }}
                            role="button"
                            tabIndex={0}
                          />
                          {row.entityKind === 'task' && canManageProjectSchedule ? (
                            <span
                              aria-label={`从${row.title}发起依赖连接`}
                              className={`absolute right-5 top-1/2 z-30 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-sky-600 shadow-sm transition ${
                                isDependencySource
                                  ? 'pointer-events-auto opacity-100'
                                  : 'pointer-events-none opacity-0 group-hover/task:pointer-events-auto group-hover/task:opacity-100'
                              }`}
                              onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                                startDependencyConnect(event, row);
                              }}
                              onMouseDown={(event: React.MouseEvent<HTMLSpanElement>) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              role="button"
                              tabIndex={0}
                              title="建立依赖"
                            >
                              <Link2 className="h-3 w-3" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                            </span>
                          ) : null}

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
                              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[12px] font-medium text-slate-700">
                                {row.entityKind === 'task' ? taskDisplayMeta.taskShortName : row.title}
                              </span>
                            ) : null}
                            {showTaskStatusInline ? (
                              <span className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[12px] font-medium ${taskDisplayMeta.taskStatusToneClassName}`}>
                                {taskDisplayMeta.taskStatusLabel}
                              </span>
                            ) : null}
                            {showOwnerInline ? (
                              <span className="hidden shrink-0 whitespace-nowrap rounded bg-white/70 px-1.5 py-0.5 text-[12px] text-slate-500 lg:inline">
                                {taskDisplayMeta.responsibleLabel}
                              </span>
                            ) : null}
                            {showRoleInline ? (
                              <span className="hidden shrink-0 whitespace-nowrap rounded bg-indigo-50/90 px-1.5 py-0.5 text-[12px] text-indigo-600 xl:inline">
                                {taskDisplayMeta.ownerRoleName}
                              </span>
                            ) : null}
                            {showParticipantInline ? (
                              <span className="hidden shrink-0 whitespace-nowrap rounded bg-slate-100/90 px-1.5 py-0.5 text-[12px] text-slate-500 2xl:inline">
                                {taskDisplayMeta.participantLabel}
                              </span>
                            ) : null}
                            {showAssignAction ? (
                              <span
                                className="shrink-0 cursor-pointer whitespace-nowrap rounded bg-white/75 px-1.5 py-0.5 text-[12px] text-sky-600 opacity-0 transition-opacity group-hover/task:opacity-100"
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
                              <span className={`shrink-0 whitespace-nowrap rounded bg-white/70 px-1.5 py-0.5 text-[12px] ${palette.badge}`}>
                                {normalizeProgress(row.progress)}%
                              </span>
                            ) : null}
                            {showDateRange ? (
                              <span className="hidden shrink-0 whitespace-nowrap text-[12px] text-slate-500 md:inline">
                                {formatShortMonthDay(preview.startDate)}-{formatShortMonthDay(preview.endDate)}
                              </span>
                            ) : null}
                          </div>
                        </button>
                        {hoveredGanttBarId === row.id && row.entityKind === 'task' ? (
                          <div
                            className="absolute left-1/2 bottom-full z-50 mb-2 w-52 -translate-x-1/2 rounded-lg border border-[#e4ebf5] bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
                            onMouseEnter={() => setHoveredGanttBarId(row.id)}
                            onMouseLeave={() => setHoveredGanttBarId(null)}
                          >
                            <div className="mb-1.5 text-[13px] font-semibold text-[#111c33] truncate">{row.title}</div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[12px]">
                                <span className="text-[#8da0bd]">任务状态</span>
                                <span className="font-medium text-[#526681]">{taskDisplayMeta.taskStatusLabel}</span>
                              </div>
                              <div className="flex items-center justify-between text-[12px]">
                                <span className="text-[#8da0bd]">分配状态</span>
                                <span className="font-medium text-[#526681]">{taskDisplayMeta.assignmentStatusLabel}</span>
                              </div>
                              {taskDisplayMeta.responsibleLabel ? (
                                <div className="flex items-center justify-between text-[12px]">
                                  <span className="text-[#8da0bd]">负责人</span>
                                  <span className="font-medium text-[#526681]">{taskDisplayMeta.responsibleLabel}</span>
                                </div>
                              ) : null}
                              {taskDisplayMeta.ownerRoleName ? (
                                <div className="flex items-center justify-between text-[12px]">
                                  <span className="text-[#8da0bd]">角色</span>
                                  <span className="font-medium text-[#526681]">{taskDisplayMeta.ownerRoleName}</span>
                                </div>
                              ) : null}
                              {taskDisplayMeta.participantLabel ? (
                                <div className="flex items-center justify-between text-[12px]">
                                  <span className="text-[#8da0bd]">参与人</span>
                                  <span className="font-medium text-[#526681]">{taskDisplayMeta.participantLabel}</span>
                                </div>
                              ) : null}
                              {row.startDate && row.endDate ? (
                                <div className="flex items-center justify-between text-[12px]">
                                  <span className="text-[#8da0bd]">计划时间</span>
                                  <span className="font-medium text-[#526681]">
                                    {formatShortMonthDay(row.startDate)}-{formatShortMonthDay(row.endDate)}
                                  </span>
                                </div>
                              ) : null}
                              <div className="flex items-center justify-between text-[12px]">
                                <span className="text-[#8da0bd]">进度</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e4ebf5]">
                                    <div className="h-full rounded-full bg-[var(--portal-color-brand-500)]" style={{ width: `${normalizeProgress(row.progress)}%` }} />
                                  </div>
                                  <span className="font-medium text-[#526681]">{normalizeProgress(row.progress)}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="pointer-events-none absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#e4ebf5] bg-white" />
                          </div>
                        ) : null}
                        {canManageProjectSchedule && !dependencyMode ? (
                          <>
                            <button
                              aria-label="调整开始时间"
                              className="absolute top-1/2 z-50 h-8 w-4 -translate-y-1/2 cursor-ew-resize rounded-l-[6px] border border-white/80 bg-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition hover:bg-white"
                              onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
                                event.preventDefault();
                                event.stopPropagation();
                                startDrag(event, row, 'resize-start');
                              }}
                              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              onDragStart={(event: React.DragEvent<HTMLButtonElement>) => {
                                event.preventDefault();
                              }}
                              style={{ left: Math.max(0, left - 6) }}
                              title="调整开始时间"
                              type="button"
                            >
                              <span className="mx-auto block h-4 w-0.5 rounded-full bg-[#6b7f9e]" />
                            </button>
                            <button
                              aria-label="调整结束时间"
                              className="absolute top-1/2 z-50 h-8 w-4 -translate-y-1/2 cursor-ew-resize rounded-r-[6px] border border-white/80 bg-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition hover:bg-white"
                              onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
                                event.preventDefault();
                                event.stopPropagation();
                                startDrag(event, row, 'resize-end');
                              }}
                              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              onDragStart={(event: React.DragEvent<HTMLButtonElement>) => {
                                event.preventDefault();
                              }}
                              style={{ left: Math.max(0, left + width - 10) }}
                              title="调整结束时间"
                              type="button"
                            >
                              <span className="mx-auto block h-4 w-0.5 rounded-full bg-[#6b7f9e]" />
                            </button>
                          </>
                        ) : null}
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
                            <span className="block truncate rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[12px] font-medium text-slate-600 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]">
                              {overflowSegments.join(' · ')}
                            </span>
                          </div>
                        ) : null}
                        {isDraggingRow && preview.startDate && preview.endDate ? (
                          <div
                            className="pointer-events-none absolute top-1 z-40 rounded-md border border-[#bfdbfe] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#1f65e8] shadow-[0_8px_18px_rgba(31,101,232,0.18)]"
                            style={{ left: dragPreviewLabelLeft }}
                          >
                            {dragState ? getDragModeLabel(dragState.mode) : ''}
                            <span className="ml-1 font-medium text-[#526681]">
                              {formatShortMonthDay(preview.startDate)}-{formatShortMonthDay(preview.endDate)}
                            </span>
                          </div>
                        ) : null}
                        </>
                      ) : row.entityKind && !hasAnyTimelineSegment ? (
                        <div
                          className="pointer-events-none absolute top-1/2 flex h-6 -translate-y-1/2 items-center rounded-md border border-dashed border-[#b9d4ff] bg-white/90 px-2.5 text-[12px] font-medium text-[#6b7f9e] opacity-0 shadow-sm transition-opacity group-hover/row:opacity-100"
                          style={{
                            left: unscheduledHintLeft,
                            width: Math.min(220, Math.max(150, timelineViewport.viewportWidth * 0.34)),
                          }}
                        >
                              拖拽新增时间节点
                        </div>
                      ) : null}

                      {row.entityKind && canManageProjectSchedule && hasAnyTimelineSegment ? (
                        <div
                          className={`pointer-events-none absolute top-1/2 z-30 -translate-y-1/2 rounded-md border border-dashed border-[#bfdbfe] bg-white/95 px-2.5 py-1 text-[12px] font-medium text-[#6b7f9e] shadow-sm transition-opacity ${
                            isDraggingRow && dragState?.mode === 'create'
                              ? 'opacity-100'
                              : 'opacity-0 group-hover/row:opacity-100'
                          }`}
                          style={{ left: unscheduledHintLeft }}
                        >
                              拖拽新增时间节点
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
                      height: timelineRowsHeight,
                      overflow: 'visible',
                      top: 0,
                    }}
                    viewBox={`0 0 ${timelineWidth} ${timelineRowsHeight}`}
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
                      const isSelectedRelation =
                        selectedRowId === line.predecessorId ||
                        selectedRowId === line.successorId ||
                        dependencyMode?.sourceRowId === line.predecessorId;
                      const isHighlighted = isHovered || isSelectedRelation;
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
                            strokeWidth={isHighlighted ? 2.5 : 1.5}
                            strokeDasharray={isHighlighted ? 'none' : '5,3'}
                            fill="none"
                            markerEnd={`url(#arrow-${line.dependencyType}-${isHighlighted ? 'hover' : 'normal'})`}
                            opacity={isHighlighted ? 1 : 0.55}
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
                                fontSize="12"
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
        </div>
      </div>
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
            className={`w-full max-w-[420px] ${GANTT_CARD_CLASS}`}
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[#8da0bd]">
                  {createDraft.mode === 'node' ? '节点新增' : '任务新增'}
                </div>
                <div className="mt-2 text-base font-bold text-[#111c33]">
                  {createDraft.mode === 'node'
                    ? createDraft.parentNodeId
                      ? '新增子节点'
                      : '新增一级节点'
                    : '新增任务'}
                </div>
              </div>
              <button
                aria-label="关闭新增面板"
                className="portal-project-shell__icon-button"
                disabled={actionLoading}
                onClick={() => {
                  setCreateDraft(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className={GANTT_FIELD_LABEL_CLASS}>
                  {createDraft.mode === 'node' ? '名称' : '标题'}
                </div>
                <input
                  className={`${GANTT_INPUT_CLASS} mt-2`}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setCreateDraft((current) => (current ? { ...current, title: event.target.value } : current));
                  }}
                  placeholder={createDraft.mode === 'node' ? '请输入节点名称' : '请输入任务标题'}
                  value={createDraft.title}
                />
              </div>

              <div>
                <div className={GANTT_FIELD_LABEL_CLASS}>编码</div>
                <input
                  className={`${GANTT_INPUT_CLASS} mt-2`}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setCreateDraft((current) => (current ? { ...current, code: event.target.value } : current));
                  }}
                  placeholder="可不填，系统自动生成"
                  value={createDraft.code}
                />
              </div>

              {createDraft.mode === 'task' ? (
                <div>
                  <div className={GANTT_FIELD_LABEL_CLASS}>任务内容</div>
                  <textarea
                    className={`${GANTT_TEXTAREA_CLASS} mt-2`}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setCreateDraft((current) => (current ? { ...current, content: event.target.value } : current));
                    }}
                    placeholder="请输入任务内容"
                    value={createDraft.content}
                  />
                </div>
              ) : null}

              <div>
                <div className={GANTT_FIELD_LABEL_CLASS}>备注</div>
                <textarea
                  className={`${GANTT_TEXTAREA_CLASS} mt-2`}
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

      {timeNodeEditor ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm"
          onClick={() => {
            setTimeNodeEditor(null);
          }}
        >
          <Card
            className={`w-full max-w-[420px] ${GANTT_CARD_CLASS}`}
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-[#8da0bd]">时间节点编辑</div>
                <div className="mt-2 max-w-[300px] truncate text-base font-bold text-[#111c33]">
                  {findRow(timeNodeEditor.rowId)?.title ?? '任务时间节点'}
                </div>
              </div>
              <button
                aria-label="关闭时间节点编辑"
                className="portal-project-shell__icon-button"
                onClick={() => {
                  setTimeNodeEditor(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className={GANTT_FIELD_LABEL_CLASS}>节点名称</label>
                <input
                  className={`${GANTT_INPUT_CLASS} mt-2`}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setTimeNodeEditor((current) =>
                      current ? { ...current, title: event.target.value } : current,
                    );
                  }}
                  value={timeNodeEditor.title}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={GANTT_FIELD_LABEL_CLASS}>开始日期</label>
                  <input
                    className={`${GANTT_INPUT_CLASS} mt-2`}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setTimeNodeEditor((current) =>
                        current ? { ...current, startDate: event.target.value } : current,
                      );
                    }}
                    type="date"
                    value={timeNodeEditor.startDate}
                  />
                </div>
                <div>
                  <label className={GANTT_FIELD_LABEL_CLASS}>结束日期</label>
                  <input
                    className={`${GANTT_INPUT_CLASS} mt-2`}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setTimeNodeEditor((current) =>
                        current ? { ...current, endDate: event.target.value } : current,
                      );
                    }}
                    type="date"
                    value={timeNodeEditor.endDate}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                className="flex h-9 items-center gap-2 rounded-md border border-rose-100 bg-rose-50 px-3 text-[13px] font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-100"
                onClick={handleDeleteTimeNodeEditor}
                type="button"
              >
                <Trash2 className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                删除
              </button>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setTimeNodeEditor(null);
                  }}
                  tone="ghost"
                >
                  取消
                </Button>
                <Button onClick={handleSaveTimeNodeEditor}>保存</Button>
              </div>
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
            <div className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white shadow-[0_16px_40px_rgba(24,39,75,0.16)]">
              {/* 标题栏 */}
              <div className="border-b border-[#edf2f8] bg-white px-5 py-4">
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#edf6ff] text-[var(--portal-color-brand-600)]">
                      <CalendarDays className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#111c33]">计划时间编辑</h2>
                      <p className="mt-1 max-w-[280px] truncate text-xs font-medium text-[#6b7f9e]">{findRow(editorState.rowId)?.title ?? '设置任务计划时间'}</p>
                    </div>
                  </div>
                  <button
                    aria-label="关闭计划时间编辑"
                    className="portal-project-shell__icon-button"
                    onClick={() => {
                      setEditorState(null);
                    }}
                    type="button"
                  >
                    <X className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                  </button>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="px-5 py-5">
                {/* 日期输入卡片 */}
                <div className="mb-5 grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="mb-2 flex items-center gap-2 text-xs font-medium text-[#6b7f9e]">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      开始日期
                    </label>
                    <div className="relative">
                      <input
                        className={GANTT_INPUT_CLASS}
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
                    <label className="mb-2 flex items-center gap-2 text-xs font-medium text-[#6b7f9e]">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      结束日期
                    </label>
                    <div className="relative">
                      <input
                        className={GANTT_INPUT_CLASS}
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
                    <label className="mb-2 flex items-center gap-2 text-xs font-medium text-[#6b7f9e]">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#edf6ff] text-[var(--portal-color-brand-600)]">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      依赖管理
                    </label>
                    <button
                      className="group flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#b9d4ff] bg-[#edf6ff] px-4 text-[13px] font-medium text-[var(--portal-color-brand-600)] transition hover:border-[var(--portal-color-brand-500)] hover:bg-[#e4f0ff]"
                      onClick={() => {
                        const row = findRow(editorState.rowId);
                        if (row) openDependencyModal(row);
                      }}
                      type="button"
                    >
                      <svg className="h-4 w-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      管理任务依赖关系
                    </button>
                  </div>
                )}

                {/* 提示信息 */}
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#edf6ff] text-[var(--portal-color-brand-600)]">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-xs font-medium leading-5 text-[#6b7f9e]">
                    设置任务的计划开始和结束时间。如果存在后续依赖任务，可开启「连锁」功能自动调整关联任务日期。
                  </p>
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="border-t border-[#edf2f8] bg-white px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <button
                    className="portal-project-shell__secondary-button border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => {
                      void handleEditorDelete();
                    }}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                    清空时间
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      className="portal-project-shell__secondary-button"
                      onClick={() => {
                        setEditorState(null);
                      }}
                    >
                      取消
                    </button>
                    <button
                      className="portal-project-shell__primary-button disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        void handleEditorSave();
                      }}
                      disabled={actionLoading}
                    >
                      <span className="flex items-center gap-2">
                        {actionLoading ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
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
            className={`w-full max-w-[440px] ${GANTT_CARD_CLASS}`}
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[#8da0bd]">任务人员分配</div>
                <div className="mt-2 text-base font-bold text-[#111c33]">{quickAssignState.taskTitle}</div>
              </div>
              <button
                aria-label="关闭人员分配"
                className="portal-project-shell__icon-button"
                onClick={() => {
                  closeQuickAssign();
                }}
                type="button"
              >
                <X className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <div className={GANTT_FIELD_LABEL_CLASS}>负责人</div>
                <select
                  className={`${GANTT_INPUT_CLASS} mt-2`}
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
                <div className={GANTT_FIELD_LABEL_CLASS}>参与人</div>
                <div className="mt-2 max-h-[220px] space-y-2 overflow-auto rounded-lg border border-[#e4ebf5] bg-[#f8fbff] p-3">
                  {members.filter((member) => member.userId !== quickAssignState.responsibleUserId).length ? (
                    members
                      .filter((member) => member.userId !== quickAssignState.responsibleUserId)
                      .map((member) => {
                        const checked = quickAssignState.participantMembers.some((item) => item.userId === member.userId);
                        return (
                          <label
                            key={member.userId}
                            className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors ${
                              checked
                                ? 'border-[#b9d4ff] bg-[#edf6ff] text-[var(--portal-color-brand-700)]'
                                : 'border-[#d9e3f1] bg-white text-[#526681] hover:border-[#b9d4ff]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium">{member.userName}</div>
                              <div className="truncate text-xs font-medium text-[#8da0bd]">{member.roleName ?? member.dutyContent ?? '项目团队成员'}</div>
                            </div>
                            <input
                              checked={checked}
                              className="h-4 w-4 rounded border-[#d9e3f1] text-[var(--portal-color-brand-600)] focus:ring-[#dceaff]"
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
                    <div className="py-5 text-center text-[13px] font-medium text-[#8da0bd]">暂无可选参与人，请先补充项目团队成员。</div>
                  )}
                </div>
              </div>

              {quickAssignState.participantMembers.length ? (
                <div className="flex flex-wrap gap-2">
                  {quickAssignState.participantMembers.map((member) => (
                    <span key={member.userId} className="rounded-md bg-[#edf6ff] px-2.5 py-1 text-xs font-medium text-[var(--portal-color-brand-700)]">
                      {member.userName}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-medium text-[#8da0bd]">当前未设置参与人</div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="portal-project-shell__secondary-button"
                onClick={() => {
                  closeQuickAssign();
                }}
                type="button"
              >
                取消
              </button>
              <button
                className="portal-project-shell__primary-button disabled:cursor-not-allowed disabled:opacity-50"
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
            className={`w-full max-w-[520px] ${GANTT_CARD_CLASS}`}
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[#8da0bd]">
                  任务依赖管理
                </div>
                <div className="mt-2 text-base font-bold text-[#111c33]">
                  {dependencyModalState.taskTitle}
                </div>
              </div>
              <button
                aria-label="关闭依赖管理"
                className="portal-project-shell__icon-button"
                onClick={() => {
                  setDependencyModalState(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* 现有依赖关系 */}
              <div>
                <div className="mb-3 text-xs font-medium text-[#6b7f9e]">
                  当前依赖关系
                </div>
                {(() => {
                  const deps = getTaskDependencies(dependencyModalState.taskId!);
                  const allDeps = [...deps.predecessors, ...deps.successors];
                  if (allDeps.length === 0) {
                    return (
                      <div className="rounded-lg border border-dashed border-[#d9e3f1] bg-[#f8fbff] py-5 text-center text-[13px] font-medium text-[#8da0bd]">
                        暂无依赖关系
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {/* 前驱任务 */}
                      {deps.predecessors.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-[#6b7f9e]">前驱任务（该任务依赖于）</div>
                          {deps.predecessors.map(dep => (
                            <div
                              key={`pred-${dep.id}`}
                              className="mt-1 flex items-center justify-between rounded-md border border-[#e4ebf5] bg-[#f8fbff] px-3 py-2"
                            >
                              <div>
                                <span className="text-xs font-medium text-[var(--portal-color-brand-600)]">前驱：</span>
                                <span className="text-[13px] font-medium text-[#263653]">{dep.predecessorTaskTitle}</span>
                                <span className="ml-2 text-xs font-medium text-[#8da0bd]">({dep.dependencyTypeDesc})</span>
                              </div>
                              <button
                                className="text-xs font-medium text-rose-500 hover:text-rose-700"
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
                          <div className="text-xs font-medium text-[#6b7f9e]">后继任务（依赖该任务）</div>
                          {deps.successors.map(dep => (
                            <div
                              key={`succ-${dep.id}`}
                              className="mt-1 flex items-center justify-between rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2"
                            >
                              <div>
                                <span className="text-xs font-medium text-emerald-600">后继：</span>
                                <span className="text-[13px] font-medium text-[#263653]">{dep.successorTaskTitle}</span>
                                <span className="ml-2 text-xs font-medium text-[#8da0bd]">({dep.dependencyTypeDesc})</span>
                              </div>
                              <button
                                className="text-xs font-medium text-rose-500 hover:text-rose-700"
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
                <div className="mb-3 text-xs font-medium text-[#6b7f9e]">
                  添加后继任务依赖
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={GANTT_FIELD_LABEL_CLASS}>选择后继任务</label>
                    <select
                      className={GANTT_INPUT_CLASS}
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
                      <label className={GANTT_FIELD_LABEL_CLASS}>依赖类型</label>
                      <select
                        className={GANTT_INPUT_CLASS}
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
                      <label className={GANTT_FIELD_LABEL_CLASS}>滞后天数</label>
                      <input
                        className={GANTT_INPUT_CLASS}
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
                  <div className="text-xs font-medium text-[#8da0bd]">
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
            <div className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white shadow-[0_16px_40px_rgba(24,39,75,0.16)]">
              {/* 标题栏 */}
              <div className="border-b border-[#edf2f8] bg-white px-5 py-4">
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#edf6ff] text-[var(--portal-color-brand-600)]">
                      <ClipboardList className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#111c33]">连锁日期更新</h2>
                      <p className="mt-1 text-xs font-medium text-[#6b7f9e]">系统将自动调整后续任务的日期</p>
                    </div>
                  </div>
                  <button
                    aria-label="关闭连锁日期更新"
                    className="portal-project-shell__icon-button"
                    onClick={() => {
                      setShowCascadeConfirm(false);
                      setCascadePreview(null);
                    }}
                    type="button"
                  >
                    <X className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                  </button>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="px-5 py-5">
                {/* 统计卡片 */}
                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-[#e4ebf5] bg-[#f8fbff] p-4 text-center">
                    <div className="text-xl font-bold text-[#111c33]">{cascadePreview.totalAffectedCount}</div>
                    <div className="text-xs font-medium text-[#6b7f9e]">受影响任务</div>
                  </div>
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-rose-600">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {cascadePreview.affectedTasks.filter(t => t.startTimeOffsetDays && t.startTimeOffsetDays > 0).length}
                    </div>
                    <div className="text-xs font-medium text-rose-600/80">将延后</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-600">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                        <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {cascadePreview.affectedTasks.filter(t => t.startTimeOffsetDays && t.startTimeOffsetDays < 0).length}
                    </div>
                    <div className="text-xs font-medium text-emerald-600/80">将提前</div>
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#edf6ff] text-[var(--portal-color-brand-600)]">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-[13px] font-medium leading-6 text-[#526681]">
                    <span className="font-semibold">操作说明：</span>
                    拖拽将影响 <span className="font-bold text-[var(--portal-color-brand-600)]">{cascadePreview.totalAffectedCount}</span> 个后续关联任务的日期。
                    选择「确认并更新」将同时调整这些任务的计划时间。
                  </div>
                </div>

                {/* 受影响的任务列表 */}
                <div className="mb-5">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-[#263653]">受影响任务预览</h3>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-md bg-[#edf2f8] px-1.5 text-xs font-medium text-[#6b7f9e]">
                      {cascadePreview.affectedTasks.length}
                    </span>
                  </div>
                  <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-lg border border-[#e4ebf5] bg-[#f8fbff] p-2">
                    {cascadePreview.affectedTasks.map((affected, index) => (
                      <div
                        key={`affected-${affected.taskId}-${index}`}
                        className="group relative overflow-hidden rounded-md border border-[#e4ebf5] bg-white p-3 transition-colors hover:border-[#b9d4ff]"
                      >
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#edf2f8] text-xs font-semibold text-[#6b7f9e]">
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                  <div className="truncate text-[13px] font-medium text-[#263653]">
                                  {affected.taskTitle}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#6b7f9e]">
                                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${
                                    affected.dependencyType === 'FS' ? 'bg-blue-100 text-blue-700' :
                                    affected.dependencyType === 'FF' ? 'bg-purple-100 text-purple-700' :
                                    affected.dependencyType === 'SS' ? 'bg-green-100 text-green-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}>
                                    {affected.dependencyType}
                                    <span className="text-[12px] opacity-70">
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
                    className="portal-project-shell__secondary-button disabled:cursor-not-allowed disabled:opacity-50"
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
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GANTT_ICON_STROKE_WIDTH}>
                      <path d="M19 12H5m0 0l7 7m-7-7l7-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    仅保存主任务
                  </button>
                  <button
                    className="portal-project-shell__primary-button disabled:cursor-not-allowed disabled:opacity-50"
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
                    <span className="flex items-center gap-2">
                      {actionLoading ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
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
        <div className="fixed right-0 top-0 z-50 h-full w-[380px] border-l border-[#e4ebf5] shadow-[-14px_0_30px_rgba(24,39,75,0.08)]">
          <div className="flex h-full flex-col bg-white">
            <div className="border-b border-[#edf2f8] bg-white px-5 py-4">
              <div className="relative flex items-start justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#edf6ff] text-[var(--portal-color-brand-600)]">
                    <FolderKanban className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#8da0bd]">项目级管理</div>
                    <h2 className="mt-1 text-base font-bold text-[#111c33]">项目团队</h2>
                    <div className="mt-1 text-xs font-medium leading-5 text-[#6b7f9e]">
                      先维护项目团队，再在每一步任务上分配负责人和参与人。
                    </div>
                  </div>
                </div>
                <button
                  aria-label="关闭项目团队"
                  className="portal-project-shell__icon-button"
                  onClick={closeTeamPanel}
                  type="button"
                >
                  <X className="h-4 w-4" strokeWidth={GANTT_ICON_STROKE_WIDTH} />
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
        hasUnsavedChanges={hasDetailPanelUnsavedChanges}
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
