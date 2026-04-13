/**
 * 甘特图公共类型定义
 */

// ─────────────────────────────────────────────────────────────────────────────
// 数据模型
// ─────────────────────────────────────────────────────────────────────────────

export type AttachmentItem = {
  fileCategory?: string | null;
  fileName: string;
  fileSize?: number | null;
  id: number;
  uploaderName?: string | null;
};

export type BudgetItem = {
  actualAmount?: number | null;
  feeDesc?: string | null;
  feeItem: string;
  feeType?: string | null;
  id: number;
  operatorName?: string | null;
  planAmount?: number | null;
  remark?: string | null;
};

export type MemberItem = {
  dutyContent?: string | null;
  id: number;
  isManager?: boolean | null;
  remark?: string | null;
  roleCode?: string | null;
  roleName?: string | null;
  userId: string;
  userName: string;
};

export type TaskParticipantItem = {
  userId: string;
  userName: string;
};

export type NodeItem = {
  actualEndTime?: string | null;
  actualStartTime?: string | null;
  id: number;
  level?: number | null;
  nodeName: string;
  parentId?: number | null;
  planEndTime?: string | null;
  planStartTime?: string | null;
  progressRate?: number | null;
  remark?: string | null;
  sort?: number | null;
  status?: string | null;
};

export type StatisticSummary = {
  budgetCount: number;
  completedTaskCount?: number;
  inProgressTaskCount?: number;
  memberCount: number;
  nodeCount: number;
  taskCount: number;
};

export type TaskItem = {
  actualEndTime?: string | null;
  actualStartTime?: string | null;
  auditStatus?: string | null;
  checkStatus?: string | null;
  finishDesc?: string | null;
  id: number;
  planEndTime?: string | null;
  planStartTime?: string | null;
  progressRate?: number | null;
  projectNodeId?: number | null;
  remark?: string | null;
  responsibleName?: string | null;
  responsibleUserId?: string | null;
  status?: string | null;
  taskContent?: string | null;
  taskTitle: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// 依赖关系
// ─────────────────────────────────────────────────────────────────────────────

export type TaskDependency = {
  id: number;
  predecessorTaskId: number;
  predecessorTaskTitle: string;
  successorTaskId: number;
  successorTaskTitle: string;
  dependencyType: 'FS' | 'FF' | 'SS' | 'SF';
  dependencyTypeDesc: string;
  lagDays: number;
  remark?: string | null;
};

export type DependencyEndpoint = {
  x: number;
  y: number;
  type: 'start' | 'end';
};

export type DependencyLine = {
  id: string;
  predecessorId: string;
  successorId: string;
  dependencyType: 'FS' | 'FF' | 'SS' | 'SF';
  from: DependencyEndpoint;
  to: DependencyEndpoint;
  lagDays: number;
};

export const DEPENDENCY_TYPE_CONFIG = {
  FS: { label: '完成-开始', description: '前驱完成后，后继开始', color: '#3b82f6' },
  FF: { label: '完成-完成', description: '前驱完成后，后继完成', color: '#10b981' },
  SS: { label: '开始-开始', description: '前驱开始后，后继开始', color: '#f59e0b' },
  SF: { label: '开始-完成', description: '前驱开始后，后继完成', color: '#8b5cf6' },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 连锁更新
// ─────────────────────────────────────────────────────────────────────────────

export type CascadeUpdateResult = {
  originalTaskId: number;
  originalTaskNewStartTime: string | null;
  originalTaskNewEndTime: string | null;
  affectedTasks: AffectedTaskPreview[];
  applied: boolean;
  totalAffectedCount: number;
};

export type AffectedTaskPreview = {
  taskId: number;
  taskTitle: string;
  originalStartTime: string | null;
  originalEndTime: string | null;
  newStartTime: string | null;
  newEndTime: string | null;
  startTimeOffsetDays: number | null;
  endTimeOffsetDays: number | null;
  dependencyType: string;
  dependencyTypeDesc: string;
  lagDays: number;
  predecessorTaskId: number;
  predecessorTaskTitle: string;
  adjustmentReason: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// 甘特图行模型
// ─────────────────────────────────────────────────────────────────────────────

export type TimelineCategory = {
  count: number;
  id: string;
  node: NodeItem;
  subCategories: TimelineSubCategory[];
  tasks: TaskItem[];
  title: string;
};

export type TimelineSubCategory = {
  id: string;
  node: NodeItem;
  tasks: TaskItem[];
  title: string;
};

export type TimelineRow = {
  categoryId?: string;
  count?: number;
  endDate: Date | null;
  entityId?: number;
  entityKind?: 'node' | 'task';
  id: string;
  owner?: string | null;
  parentNodeId?: number;
  progress: number;
  rowType: 'category' | 'subCategory' | 'item';
  startDate: Date | null;
  status?: string | null;
  subCategoryId?: string;
  title: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// UI 状态
// ─────────────────────────────────────────────────────────────────────────────

export type CreateDraft = {
  categoryId?: string | null;
  code: string;
  content: string;
  mode: 'node' | 'task';
  parentNodeId: number | null;
  remark: string;
  subCategoryId?: string | null;
  title: string;
};

export type EditorState = {
  endDate: string;
  rowId: string;
  startDate: string;
};

export type DragState = {
  anchorIndex: number;
  currentIndex: number;
  mode: 'create' | 'move' | 'resize-end' | 'resize-start';
  originalEndIndex: number;
  originalStartIndex: number;
  rowId: string;
};

export type FeedbackState = {
  message: string;
  tone: 'danger' | 'success';
} | null;

export type OptimisticScheduleMap = Record<
  string,
  {
    endDate: Date | null;
    startDate: Date | null;
  }
>;

export type DetailPanelState = {
  visible: boolean;
  rowId: string | null;
  activeTab: 'info' | 'members' | 'budget' | 'attachments';
};

export type DetailEditState = {
  participantMembers: TaskParticipantItem[];
  taskTitle: string;
  taskContent: string;
  taskRemark: string;
  responsibleName: string;
  responsibleUserId: string | null;
  status: string;
  progressRate: number;
  planStartTime: string | null;
  planEndTime: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 布局常量
// ─────────────────────────────────────────────────────────────────────────────

export const SIDEBAR_WIDTH = 320;
export const DAY_COLUMN_WIDTH = 52;
export const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const CATEGORY_ROW_HEIGHT = 40;
export const SUB_CATEGORY_ROW_HEIGHT = 32;
export const TASK_ROW_HEIGHT = 40;
export const SIDEBAR_SEARCH_BAND_HEIGHT = 56;
