import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';

import { createApiClient } from '@lserp/http';
import { Button, Card, cx } from '@lserp/ui';

import { ProgressConfigModal } from './progress-config/progress-config-modal';
import { useProjectToast } from './project-toast';
import type { ProgressSchedule, ScheduleColor } from './progress-config/types';
import { createScheduleId, fromDayIndex, getCurrentDayIndex, toDayIndex } from './progress-config/utils';

type BasicProjectType = {
  id: number;
  sort?: number | null;
  status?: string | null;
  typeCode: string;
  typeDesc?: string | null;
  typeName: string;
};

type ApiProjectTypeNode = {
  id: number;
  needAudit?: boolean | null;
  needCheck?: boolean | null;
  nodeCode: string;
  nodeName: string;
  parentNodeId?: number | null;
  planDay?: number | null;
  remark?: string | null;
  sort?: number | null;
};

type ApiProjectTypeTask = {
  id: number;
  needAudit?: boolean | null;
  needCheck?: boolean | null;
  needFile?: boolean | null;
  needSettle?: boolean | null;
  nodeId: number;
  planDay?: number | null;
  remark?: string | null;
  sort?: number | null;
  taskCode: string;
  taskContent?: string | null;
  taskTitle: string;
};

type ApiProjectTypeTaskSchedule = {
  color?: string | null;
  endDay: number;
  endMonth: number;
  id: number;
  nodeId: number;
  ownerName?: string | null;
  projectTypeId: number;
  projectTypeTaskId: number;
  remark?: string | null;
  sort?: number | null;
  startDay: number;
  startMonth: number;
};

type TaskRecord = ApiProjectTypeTask & {
  schedules: ProgressSchedule[];
};

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

type TypeFormState = {
  sort: string;
  status: string;
  typeCode: string;
  typeDesc: string;
  typeName: string;
};

type NodeFormState = {
  needAudit: boolean;
  needCheck: boolean;
  nodeCode: string;
  nodeName: string;
  parentNodeId: number | null;
  planDay: string;
  remark: string;
  sort: string;
};

type TaskFormState = {
  needAudit: boolean;
  needCheck: boolean;
  needFile: boolean;
  needSettle: boolean;
  planDay: string;
  remark: string;
  sort: string;
  taskCode: string;
  taskContent: string;
  taskTitle: string;
};

type Feedback =
  | {
      message: string;
      tone: 'danger' | 'success';
    }
  | null;

type DialogMode = 'create' | 'edit' | null;

type ProjectTypeManagementPageProps = {
  projectTypes: BasicProjectType[];
};

const apiClient = createApiClient({
  baseUrl:
    (import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8080',
});

const initialTypeForm: TypeFormState = {
  sort: '0',
  status: 'ACTIVE',
  typeCode: '',
  typeDesc: '',
  typeName: '',
};

const initialNodeForm: NodeFormState = {
  needAudit: false,
  needCheck: false,
  nodeCode: '',
  nodeName: '',
  parentNodeId: null,
  planDay: '',
  remark: '',
  sort: '0',
};

const initialTaskForm: TaskFormState = {
  needAudit: false,
  needCheck: false,
  needFile: false,
  needSettle: false,
  planDay: '',
  remark: '',
  sort: '0',
  taskCode: '',
  taskContent: '',
  taskTitle: '',
};

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '操作失败，请稍后重试。';
}

async function requestData<T>(path: string, query?: Record<string, string | number>) {
  const response = await apiClient.request<CommonResult<T>>(path, {
    method: 'GET',
    query,
  });
  return response.data;
}

async function mutateData<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: object) {
  const response = await apiClient.request<CommonResult<T>>(path, {
    body,
    method,
  });
  return response.data;
}

function buildCopyCode(typeCode: string) {
  const suffix = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(8, 14);
  return `${typeCode}_COPY_${suffix}`;
}

function buildCopyName(typeName: string) {
  return `${typeName} - 副本`;
}

function toNullableNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isNumericFieldValid(value: string) {
  return !value.trim() || toNullableNumber(value) !== null;
}

function normalizeScheduleColor(color?: string | null): ScheduleColor {
  if (color === 'emerald' || color === 'violet') {
    return color;
  }

  return 'blue';
}

function getPagedItems<T>(data: PagedResult<T> | null | undefined) {
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  if (Array.isArray(data?.list)) {
    return data.list;
  }
  return [];
}

function mapSchedule(schedule: ApiProjectTypeTaskSchedule): ProgressSchedule {
  return {
    color: normalizeScheduleColor(schedule.color),
    endDay: schedule.endDay,
    endMonth: schedule.endMonth,
    id: `schedule-${schedule.id}`,
    owner: schedule.ownerName ?? '',
    remark: schedule.remark ?? undefined,
    sourceId: schedule.id,
    sort: schedule.sort ?? 0,
    startDay: schedule.startDay,
    startMonth: schedule.startMonth,
  };
}

function sortSchedules(left: ProgressSchedule, right: ProgressSchedule) {
  const leftSort = left.sort ?? 0;
  const rightSort = right.sort ?? 0;
  if (leftSort !== rightSort) {
    return leftSort - rightSort;
  }

  return toDayIndex(left.startMonth, left.startDay) - toDayIndex(right.startMonth, right.startDay);
}

function normalizeScheduleDraft(schedule: ProgressSchedule): ProgressSchedule {
  const startIndex = toDayIndex(schedule.startMonth, schedule.startDay);
  const endIndex = toDayIndex(schedule.endMonth, schedule.endDay);
  const normalizedStart = fromDayIndex(startIndex);
  const normalizedEnd = fromDayIndex(endIndex >= startIndex ? endIndex : startIndex);

  return {
    ...schedule,
    endDay: normalizedEnd.day,
    endMonth: normalizedEnd.month,
    owner: schedule.owner.trim(),
    remark: schedule.remark?.trim() || undefined,
    startDay: normalizedStart.day,
    startMonth: normalizedStart.month,
  };
}

function validateScheduleDraft(schedule: ProgressSchedule) {
  if (toDayIndex(schedule.endMonth, schedule.endDay) < toDayIndex(schedule.startMonth, schedule.startDay)) {
    return '结束日期不能早于开始日期。';
  }

  return null;
}

function buildSchedulePayload(schedules: ProgressSchedule[]) {
  return {
    schedules: schedules.map((schedule, index) => ({
      color: schedule.color,
      endDay: schedule.endDay,
      endMonth: schedule.endMonth,
      ownerName: schedule.owner.trim() || null,
      remark: schedule.remark?.trim() || null,
      sort: index,
      startDay: schedule.startDay,
      startMonth: schedule.startMonth,
    })),
  };
}

function validateTypeForm(form: TypeFormState) {
  if (!form.typeCode.trim()) {
    return '请填写里程碑模板编码。';
  }
  if (!form.typeName.trim()) {
    return '请填写里程碑模板名称。';
  }
  if (!isNumericFieldValid(form.sort)) {
    return '排序必须是数字。';
  }
  return null;
}

function validateNodeForm(form: NodeFormState) {
  if (!form.nodeCode.trim()) {
    return '请填写节点模板编码。';
  }
  if (!form.nodeName.trim()) {
    return '请填写节点模板名称。';
  }
  if (!isNumericFieldValid(form.planDay) || !isNumericFieldValid(form.sort)) {
    return '计划天数和排序必须是数字。';
  }
  return null;
}

function validateTaskForm(form: TaskFormState) {
  if (!form.taskCode.trim()) {
    return '请填写任务模板编码。';
  }
  if (!form.taskTitle.trim()) {
    return '请填写任务模板标题。';
  }
  if (!isNumericFieldValid(form.planDay) || !isNumericFieldValid(form.sort)) {
    return '计划天数和排序必须是数字。';
  }
  return null;
}

// ─── 树形结构类型与辅助函数 ─────────────────────────────────────────────────

type TreeNode = ApiProjectTypeNode & {
  children: TreeNode[];
  level: number;
};

/**
 * 根据 nodeCode 前缀规则构建树形结构
 * 规则：01 是根节点，0101 是 01 的子节点，010101 是 0101 的子节点
 */
function buildNodeTree(flatNodes: ApiProjectTypeNode[]): TreeNode[] {
  const nodeMap = new Map<number, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // 1. 创建所有节点的 TreeNode 副本
  for (const node of flatNodes) {
    nodeMap.set(node.id, { ...node, children: [], level: 0 });
  }

  // 2. 按编码排序，确保父节点在子节点之前处理
  const sortedNodes = [...flatNodes].sort((a, b) => a.nodeCode.localeCompare(b.nodeCode));

  // 3. 构建父子关系：根据 nodeCode 前缀规则
  for (const node of sortedNodes) {
    const current = nodeMap.get(node.id)!;
    const code = node.nodeCode;

    // 找到父节点：编码更短且当前编码以其开头
    let parentNode: TreeNode | null = null;

    for (const other of sortedNodes) {
      if (other.id === node.id) continue;
      const otherCode = other.nodeCode;

      // 父节点编码必须是子节点编码的前缀
      if (code.startsWith(otherCode) && code !== otherCode) {
        // 确保是直接父子关系（中间没有其他节点）
        const remaining = code.slice(otherCode.length);
        if (remaining.length === 2 && /^\d{2}$/.test(remaining)) {
          // 选择编码最短的作为父节点
          if (!parentNode || otherCode.length > parentNode.nodeCode.length) {
            parentNode = nodeMap.get(other.id) ?? null;
          }
        }
      }
    }

    if (parentNode) {
      current.level = parentNode.level + 1;
      parentNode.children.push(current);
    } else {
      rootNodes.push(current);
    }
  }

  return rootNodes;
}

/**
 * 将树形结构展平为带 level 的数组（用于渲染）
 */
function flattenTree(trees: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];

  function traverse(node: TreeNode) {
    result.push(node);
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const root of trees) {
    traverse(root);
  }

  return result;
}

/**
 * 根据父节点编码自动生成子节点编码
 * 例如：父节点 01 → 生成 0101（第一个子节点）
 *      父节点 0101 → 生成 010101
 */
function generateChildNodeCode(parentNodeCode: string | null, siblingCodes: string[]): string {
  const prefix = parentNodeCode ?? '';

  // 找出所有同级的兄弟节点编码
  const siblings = siblingCodes.filter(code =>
    prefix === '' ? code.length === 2 : code.startsWith(prefix) && code.length === prefix.length + 2
  );

  if (siblings.length === 0) {
    // 没有兄弟节点，生成第一个子节点
    return prefix ? `${prefix}01` : '01';
  }

  // 找出最大的序号
  let maxSeq = 0;
  for (const code of siblings) {
    const seqStr = prefix ? code.slice(prefix.length) : code;
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  // 生成下一个序号
  const nextSeq = maxSeq + 1;
  const seqStr = nextSeq.toString().padStart(2, '0');
  return prefix ? `${prefix}${seqStr}` : seqStr;
}

function formatPlanDay(value?: number | null) {
  return value == null ? '--' : `${value} 天`;
}

function formatScheduleRange(schedule: ProgressSchedule) {
  return `${schedule.startMonth}/${schedule.startDay} - ${schedule.endMonth}/${schedule.endDay}`;
}

function getStatusLabel(value?: string | null) {
  switch (value) {
    case 'ACTIVE':
      return '启用';
    case 'INACTIVE':
      return '停用';
    default:
      return value ?? '--';
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ accent, label, value }: { accent: string; label: string; value: string | number }) {
  return (
    <div className={`rounded-[22px] ${accent} p-5`}>
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}

// Tree Node Item for Node Tree display
function NodeTreeItem({
  node,
  selectedNodeId,
  onSelect,
  onEdit,
  onDelete,
  expandedIds,
  onToggleExpand,
  level,
}: {
  node: TreeNode;
  selectedNodeId: number | null;
  onSelect: (id: number) => void;
  onEdit: (item: ApiProjectTypeNode) => void;
  onDelete: (item: ApiProjectTypeNode) => void;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  level: number;
}) {
  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  
  return (
    <>
      <div 
        className={cx(
          'group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all',
          isSelected ? 'bg-blue-50 text-blue-700 shadow-sm' : 'hover:bg-slate-50 text-slate-700'
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/Collapse indicator */}
        <div className="w-4 h-4 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); hasChildren && onToggleExpand(node.id); }}>
          {hasChildren ? (
            <svg 
              className={cx('w-3 h-3 text-slate-400 transition-transform', isExpanded && 'rotate-90')} 
              fill="none" 
              viewBox="0 0 12 12"
            >
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <div className={cx('h-2 w-2 rounded-full', isSelected ? 'bg-blue-500' : 'bg-slate-300')} />
          )}
        </div>
        
        {/* Drag handle */}
        <div className="cursor-grab opacity-0 group-hover:opacity-100">
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 14 14">
            <path d="M4 3h1.5v1.5H4zM4 6h1.5v1.5H4zM4 9h1.5v1.5H4zM8.5 3H10v1.5H8.5zM8.5 6H10v1.5H8.5zM8.5 9H10v1.5H8.5z" fill="currentColor"/>
          </svg>
        </div>
        
        {/* Node content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{node.nodeName}</span>
            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                title="添加子节点"
                className="p-1 hover:text-green-600"
                onClick={(e) => { e.stopPropagation(); onEdit(node); }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button 
                title="编辑"
                className="p-1 hover:text-blue-600"
                onClick={(e) => { e.stopPropagation(); onEdit(node); }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                  <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                title="删除"
                className="p-1 hover:text-red-600"
                onClick={(e) => { e.stopPropagation(); onDelete(node); }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                  <path d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v5M10 7v5M3.5 4l.5 9a1 1 0 001 1h6a1 1 0 001-1l.5-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-400">{node.nodeCode}</span>
            <span className="text-[10px] text-slate-400">{formatPlanDay(node.planDay)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// Task Rule Badge component
function TaskRuleBadge({ active, label, icon }: { active: boolean; label: string; icon: ReactNode }) {
  return (
    <div 
      className={cx(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors',
        active ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-300 border border-slate-100'
      )}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

// SVG Icons as inline components
function CheckCircleIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
      <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6L9 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 1v5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 9h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 7h14" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3 10h2M8 10h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
      <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
      <path d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v5M10 7v5M3.5 4l.5 9a1 1 0 001 1h6a1 1 0 001-1l.5-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="3" r="1" fill="currentColor"/>
      <circle cx="8" cy="8" r="1" fill="currentColor"/>
      <circle cx="8" cy="13" r="1" fill="currentColor"/>
    </svg>
  );
}

function DrawerCloseIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      onClick={onClick}
      type="button"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function DrawerShell({
  children,
  footer,
  onClose,
  title,
}: {
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-slideInRight fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-[-12px_0_48px_-16px_rgba(15,23,42,0.18)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-base font-bold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-400">填写信息后保存</div>
          </div>
          <DrawerCloseIcon onClick={onClose} />
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {/* Footer */}
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </>
  );
}

function FieldSection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function withStoppedRowAction(action: () => void) {
  return (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    action();
  };
}

// ─── Page Component ──────────────────────────────────────────────────────────

export function ProjectTypeManagementPage({ projectTypes: externalTypes }: ProjectTypeManagementPageProps) {
  const { pushToast } = useProjectToast();
  const [projectTypes, setProjectTypes] = useState<BasicProjectType[]>(externalTypes);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(externalTypes[0]?.id ?? null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<ApiProjectTypeNode[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [typeDialogMode, setTypeDialogMode] = useState<DialogMode>(null);
  const [nodeDialogMode, setNodeDialogMode] = useState<DialogMode>(null);
  const [taskDialogMode, setTaskDialogMode] = useState<DialogMode>(null);
  const [typeForm, setTypeForm] = useState<TypeFormState>(initialTypeForm);
  const [nodeForm, setNodeForm] = useState<NodeFormState>(initialNodeForm);
  const [taskForm, setTaskForm] = useState<TaskFormState>(initialTaskForm);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [draftSchedule, setDraftSchedule] = useState<ProgressSchedule | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<number>>(new Set());

  const filteredTypes = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) {
      return projectTypes;
    }
    return projectTypes.filter((item) =>
      `${item.typeCode} ${item.typeName} ${item.typeDesc ?? ''}`.toLowerCase().includes(keyword),
    );
  }, [projectTypes, searchValue]);

  const selectedType = useMemo(
    () => projectTypes.find((item) => item.id === selectedTypeId) ?? null,
    [projectTypes, selectedTypeId],
  );
  const selectedNode = useMemo(
    () => nodes.find((item) => item.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const nodeTasks = useMemo(
    () =>
      selectedNodeId === null
        ? []
        : tasks
            .filter((task) => task.nodeId === selectedNodeId)
            .sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0)),
    [selectedNodeId, tasks],
  );
  const selectedTask = useMemo(
    () => tasks.find((item) => item.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );
  const activeTypeCount = useMemo(
    () => projectTypes.filter((item) => item.status === 'ACTIVE').length,
    [projectTypes],
  );
  const totalScheduleCount = useMemo(
    () => tasks.reduce((total, task) => total + task.schedules.length, 0),
    [tasks],
  );

  // 构建节点树
  const nodeTree = useMemo(() => buildNodeTree(nodes), [nodes]);

  // 展平树形结构用于渲染
  const flattenedNodes = useMemo(() => {
    return flattenTree(nodeTree);
  }, [nodeTree]);

  // 切换节点展开/收起
  function toggleNodeExpand(nodeId: number) {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

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
    if (!scheduleError) {
      return;
    }

    pushToast({
      message: scheduleError,
      tone: 'danger',
    });
    setScheduleError(null);
  }, [pushToast, scheduleError]);

  useEffect(() => {
    if (!projectTypes.length && externalTypes.length) {
      setProjectTypes(externalTypes);
    }
  }, [externalTypes, projectTypes.length]);

  useEffect(() => {
    if (!projectTypes.length) {
      setSelectedTypeId(null);
      return;
    }
    setSelectedTypeId((current) =>
      current && projectTypes.some((item) => item.id === current) ? current : projectTypes[0]?.id ?? null,
    );
  }, [projectTypes]);

  useEffect(() => {
    if (!nodes.length) {
      setSelectedNodeId(null);
      return;
    }
    setSelectedNodeId((current) =>
      current && nodes.some((item) => item.id === current) ? current : nodes[0]?.id ?? null,
    );
  }, [nodes]);

  useEffect(() => {
    if (!nodeTasks.length) {
      setSelectedTaskId(null);
      return;
    }
    setSelectedTaskId((current) =>
      current && nodeTasks.some((item) => item.id === current) ? current : nodeTasks[0]?.id ?? null,
    );
  }, [nodeTasks]);

  async function loadTypes(nextSelectedTypeId?: number | null) {
    setLoadingTypes(true);
    try {
      const response = await requestData<PagedResult<BasicProjectType>>('/api/project/types', {
        pageNumber: 1,
        pageSize: 200,
      });
      const items = getPagedItems(response);
      setProjectTypes(items);
      setSelectedTypeId((current) => {
        if (nextSelectedTypeId && items.some((item) => item.id === nextSelectedTypeId)) {
          return nextSelectedTypeId;
        }
        return current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null;
      });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setLoadingTypes(false);
    }
  }

  useEffect(() => {
    void loadTypes(selectedTypeId);
    // Mount-time authoritative fetch; page should not depend on stale parent snapshots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTypeDetail(typeId: number | null) {
    if (!typeId) {
      setNodes([]);
      setTasks([]);
      return;
    }

    setLoadingDetail(true);
    try {
      const [nodeRows, taskRows, scheduleRows] = await Promise.all([
        requestData<ApiProjectTypeNode[]>(`/api/project/types/${typeId}/nodes`),
        requestData<ApiProjectTypeTask[]>(`/api/project/types/${typeId}/tasks`),
        requestData<ApiProjectTypeTaskSchedule[]>(`/api/project/types/${typeId}/task-schedules`),
      ]);
      const schedulesByTaskId = scheduleRows.reduce<Record<number, ProgressSchedule[]>>((accumulator, schedule) => {
        const current = accumulator[schedule.projectTypeTaskId] ?? [];
        current.push(mapSchedule(schedule));
        accumulator[schedule.projectTypeTaskId] = current.sort(sortSchedules);
        return accumulator;
      }, {});
      setNodes([...nodeRows].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0)));
      setTasks(
        [...taskRows]
          .sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0))
          .map((task) => ({ ...task, schedules: schedulesByTaskId[task.id] ?? [] })),
      );
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
      setNodes([]);
      setTasks([]);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    void loadTypeDetail(selectedTypeId);
  }, [selectedTypeId]);

  function openCreateTypeDialog() {
    setTypeForm(initialTypeForm);
    setTypeDialogMode('create');
  }

  function openEditTypeDialog(item: BasicProjectType) {
    setSelectedTypeId(item.id);
    setTypeForm({
      sort: item.sort == null ? '0' : String(item.sort),
      status: item.status ?? 'ACTIVE',
      typeCode: item.typeCode,
      typeDesc: item.typeDesc ?? '',
      typeName: item.typeName,
    });
    setTypeDialogMode('edit');
  }

  function openCreateNodeDialog(parentNode: ApiProjectTypeNode | null = null) {
    if (!selectedType) {
      setFeedback({ message: '请先选择里程碑模板。', tone: 'danger' });
      return;
    }

    // 自动生成节点编码
    const siblingCodes = nodes.map(n => n.nodeCode);
    const parentCode = parentNode?.nodeCode ?? null;
    const newCode = generateChildNodeCode(parentCode, siblingCodes);

    setNodeForm({
      ...initialNodeForm,
      nodeCode: newCode,
      parentNodeId: parentNode?.id ?? null,
    });
    setNodeDialogMode('create');
  }

  function openEditNodeDialog(item: ApiProjectTypeNode) {
    setSelectedNodeId(item.id);
    setNodeForm({
      needAudit: Boolean(item.needAudit),
      needCheck: Boolean(item.needCheck),
      nodeCode: item.nodeCode,
      nodeName: item.nodeName,
      parentNodeId: item.parentNodeId ?? null,
      planDay: item.planDay == null ? '' : String(item.planDay),
      remark: item.remark ?? '',
      sort: item.sort == null ? '0' : String(item.sort),
    });
    setNodeDialogMode('edit');
  }

  function openCreateTaskDialog() {
    if (!selectedType || !selectedNode) {
      setFeedback({ message: '请先选择节点模板。', tone: 'danger' });
      return;
    }
    setTaskForm(initialTaskForm);
    setTaskDialogMode('create');
  }

  function openEditTaskDialog(item: TaskRecord) {
    setSelectedTaskId(item.id);
    setTaskForm({
      needAudit: Boolean(item.needAudit),
      needCheck: Boolean(item.needCheck),
      needFile: Boolean(item.needFile),
      needSettle: Boolean(item.needSettle),
      planDay: item.planDay == null ? '' : String(item.planDay),
      remark: item.remark ?? '',
      sort: item.sort == null ? '0' : String(item.sort),
      taskCode: item.taskCode,
      taskContent: item.taskContent ?? '',
      taskTitle: item.taskTitle,
    });
    setTaskDialogMode('edit');
  }

  function openCreateScheduleDialog() {
    if (!selectedTask) {
      setFeedback({ message: '请先选择任务模板。', tone: 'danger' });
      return;
    }
    const currentDayIndex = getCurrentDayIndex();
    const startValue = fromDayIndex(currentDayIndex);
    const endValue = fromDayIndex(Math.min(currentDayIndex + 2, 364));
    setEditingScheduleId(null);
    setScheduleError(null);
    setDraftSchedule({
      color: 'blue',
      endDay: endValue.day,
      endMonth: endValue.month,
      id: createScheduleId(),
      owner: '',
      remark: '',
      startDay: startValue.day,
      startMonth: startValue.month,
    });
  }

  function openEditScheduleDialog(schedule: ProgressSchedule) {
    setEditingScheduleId(schedule.id);
    setScheduleError(null);
    setDraftSchedule({ ...schedule });
  }

  async function handleSubmitType() {
    const validationMessage = validateTypeForm(typeForm);
    if (validationMessage) {
      setFeedback({ message: validationMessage, tone: 'danger' });
      return;
    }
    setSubmitting(typeDialogMode === 'create' ? 'create-type' : 'update-type');
    try {
      if (typeDialogMode === 'create') {
        const created = await mutateData<BasicProjectType>('/api/project/types', 'POST', {
          sort: toNullableNumber(typeForm.sort) ?? 0,
          status: typeForm.status.trim() || 'ACTIVE',
          typeCode: typeForm.typeCode.trim(),
          typeDesc: typeForm.typeDesc.trim() || null,
          typeName: typeForm.typeName.trim(),
        });
        await loadTypes(created.id);
      } else if (typeDialogMode === 'edit' && selectedType) {
        await mutateData<BasicProjectType>(`/api/project/types/${selectedType.id}`, 'PUT', {
          sort: toNullableNumber(typeForm.sort) ?? 0,
          status: typeForm.status.trim() || 'ACTIVE',
          typeCode: typeForm.typeCode.trim(),
          typeDesc: typeForm.typeDesc.trim() || null,
          typeName: typeForm.typeName.trim(),
        });
        await loadTypes(selectedType.id);
      }
      setTypeDialogMode(null);
      setFeedback({ message: '保存成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteType(item: BasicProjectType) {
    if (!window.confirm(`确认删除里程碑模板"${item.typeName}"吗？`)) {
      return;
    }
    setSubmitting('delete-type');
    try {
      await mutateData<boolean>(`/api/project/types/${item.id}`, 'DELETE');
      await loadTypes(selectedTypeId === item.id ? null : selectedTypeId);
      setFeedback({ message: '删除成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCopyType(item: BasicProjectType) {
    setSubmitting('copy-type');
    try {
      const [sourceNodes, sourceTasks, sourceSchedules] = await Promise.all([
        requestData<ApiProjectTypeNode[]>(`/api/project/types/${item.id}/nodes`),
        requestData<ApiProjectTypeTask[]>(`/api/project/types/${item.id}/tasks`),
        requestData<ApiProjectTypeTaskSchedule[]>(`/api/project/types/${item.id}/task-schedules`),
      ]);

      const createdType = await mutateData<BasicProjectType>('/api/project/types', 'POST', {
        sort: item.sort ?? 0,
        status: item.status?.trim() || 'ACTIVE',
        typeCode: buildCopyCode(item.typeCode),
        typeDesc: item.typeDesc?.trim() || null,
        typeName: buildCopyName(item.typeName),
      });

      const nodeIdMap = new Map<number, number>();
      for (const node of [...sourceNodes].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0))) {
        const createdNode = await mutateData<ApiProjectTypeNode>(`/api/project/types/${createdType.id}/nodes`, 'POST', {
          needAudit: Boolean(node.needAudit),
          needCheck: Boolean(node.needCheck),
          nodeCode: node.nodeCode,
          nodeName: node.nodeName,
          planDay: node.planDay ?? null,
          remark: node.remark ?? null,
          sort: node.sort ?? 0,
        });
        nodeIdMap.set(node.id, createdNode.id);
      }

      const taskIdMap = new Map<number, number>();
      for (const task of [...sourceTasks].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0))) {
        const mappedNodeId = nodeIdMap.get(task.nodeId);
        if (!mappedNodeId) {
          continue;
        }
        const createdTask = await mutateData<ApiProjectTypeTask>(`/api/project/types/${createdType.id}/tasks`, 'POST', {
          needAudit: Boolean(task.needAudit),
          needCheck: Boolean(task.needCheck),
          needFile: Boolean(task.needFile),
          needSettle: Boolean(task.needSettle),
          nodeId: mappedNodeId,
          planDay: task.planDay ?? null,
          remark: task.remark ?? null,
          sort: task.sort ?? 0,
          taskCode: task.taskCode,
          taskContent: task.taskContent ?? null,
          taskTitle: task.taskTitle,
        });
        taskIdMap.set(task.id, createdTask.id);
      }

      const schedulesByTask = sourceSchedules.reduce<Record<number, ApiProjectTypeTaskSchedule[]>>((accumulator, schedule) => {
        const current = accumulator[schedule.projectTypeTaskId] ?? [];
        current.push(schedule);
        accumulator[schedule.projectTypeTaskId] = current;
        return accumulator;
      }, {});

      for (const [sourceTaskId, createdTaskId] of taskIdMap.entries()) {
        const relatedSchedules = (schedulesByTask[sourceTaskId] ?? [])
          .sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0))
          .map((schedule, index) => ({
            color: schedule.color ?? 'blue',
            endDay: schedule.endDay,
            endMonth: schedule.endMonth,
            ownerName: schedule.ownerName ?? null,
            remark: schedule.remark ?? null,
            sort: schedule.sort ?? index,
            startDay: schedule.startDay,
            startMonth: schedule.startMonth,
          }));

        if (relatedSchedules.length) {
          await mutateData<ApiProjectTypeTaskSchedule[]>(
            `/api/project/types/${createdType.id}/tasks/${createdTaskId}/schedules`,
            'PUT',
            { schedules: relatedSchedules },
          );
        }
      }

      await loadTypes(createdType.id);
      await loadTypeDetail(createdType.id);
      setFeedback({ message: '模板复制成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSubmitNode() {
    if (!selectedType) {
      setFeedback({ message: '请先选择里程碑模板。', tone: 'danger' });
      return;
    }
    const validationMessage = validateNodeForm(nodeForm);
    if (validationMessage) {
      setFeedback({ message: validationMessage, tone: 'danger' });
      return;
    }
    setSubmitting(nodeDialogMode === 'create' ? 'create-node' : 'update-node');
    try {
      const payload = {
        needAudit: nodeForm.needAudit,
        needCheck: nodeForm.needCheck,
        nodeCode: nodeForm.nodeCode.trim(),
        nodeName: nodeForm.nodeName.trim(),
        parentNodeId: nodeForm.parentNodeId,
        planDay: toNullableNumber(nodeForm.planDay),
        remark: nodeForm.remark.trim() || null,
        sort: toNullableNumber(nodeForm.sort) ?? 0,
      };
      if (nodeDialogMode === 'create') {
        await mutateData<ApiProjectTypeNode>(`/api/project/types/${selectedType.id}/nodes`, 'POST', payload);
      } else if (nodeDialogMode === 'edit' && selectedNode) {
        await mutateData<ApiProjectTypeNode>(`/api/project/types/${selectedType.id}/nodes/${selectedNode.id}`, 'PUT', payload);
      }
      await loadTypeDetail(selectedType.id);
      setNodeDialogMode(null);
      setFeedback({ message: '保存成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteNode(item: ApiProjectTypeNode) {
    if (!selectedType || !window.confirm(`确认删除节点模板"${item.nodeName}"吗？`)) {
      return;
    }
    setSubmitting('delete-node');
    try {
      await mutateData<boolean>(`/api/project/types/${selectedType.id}/nodes/${item.id}`, 'DELETE');
      await loadTypeDetail(selectedType.id);
      setFeedback({ message: '删除成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCopyNode(item: ApiProjectTypeNode) {
    if (!selectedType) {
      return;
    }
    setSubmitting('copy-node');
    try {
      // 复制节点
      const createdNode = await mutateData<ApiProjectTypeNode>(`/api/project/types/${selectedType.id}/nodes`, 'POST', {
        needAudit: Boolean(item.needAudit),
        needCheck: Boolean(item.needCheck),
        nodeCode: `${item.nodeCode}_COPY`,
        nodeName: `${item.nodeName} - 副本`,
        planDay: item.planDay ?? null,
        remark: item.remark ?? null,
        sort: (item.sort ?? 0) + 1,
      });

      // 复制该节点下的任务和排期
      const sourceTasks = tasks.filter((t) => t.nodeId === item.id);
      for (const task of sourceTasks) {
        const createdTask = await mutateData<ApiProjectTypeTask>(`/api/project/types/${selectedType.id}/tasks`, 'POST', {
          needAudit: Boolean(task.needAudit),
          needCheck: Boolean(task.needCheck),
          needFile: Boolean(task.needFile),
          needSettle: Boolean(task.needSettle),
          nodeId: createdNode.id,
          planDay: task.planDay ?? null,
          remark: task.remark ?? null,
          sort: task.sort ?? 0,
          taskCode: `${task.taskCode}_COPY`,
          taskContent: task.taskContent ?? null,
          taskTitle: `${task.taskTitle} - 副本`,
        });

        // 复制任务的排期
        if (task.schedules.length > 0) {
          await mutateData(
            `/api/project/types/${selectedType.id}/tasks/${createdTask.id}/schedules`,
            'PUT',
            buildSchedulePayload(task.schedules),
          );
        }
      }

      await loadTypeDetail(selectedType.id);
      setFeedback({ message: '节点模板复制成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSubmitTask() {
    if (!selectedType || !selectedNode) {
      setFeedback({ message: '请先选择节点模板。', tone: 'danger' });
      return;
    }
    const validationMessage = validateTaskForm(taskForm);
    if (validationMessage) {
      setFeedback({ message: validationMessage, tone: 'danger' });
      return;
    }
    setSubmitting(taskDialogMode === 'create' ? 'create-task' : 'update-task');
    try {
      const payload = {
        needAudit: taskForm.needAudit,
        needCheck: taskForm.needCheck,
        needFile: taskForm.needFile,
        needSettle: taskForm.needSettle,
        nodeId: selectedNode.id,
        planDay: toNullableNumber(taskForm.planDay),
        remark: taskForm.remark.trim() || null,
        sort: toNullableNumber(taskForm.sort) ?? 0,
        taskCode: taskForm.taskCode.trim(),
        taskContent: taskForm.taskContent.trim() || null,
        taskTitle: taskForm.taskTitle.trim(),
      };
      if (taskDialogMode === 'create') {
        await mutateData<ApiProjectTypeTask>(`/api/project/types/${selectedType.id}/tasks`, 'POST', payload);
      } else if (taskDialogMode === 'edit' && selectedTask) {
        await mutateData<ApiProjectTypeTask>(`/api/project/types/${selectedType.id}/tasks/${selectedTask.id}`, 'PUT', payload);
      }
      await loadTypeDetail(selectedType.id);
      setTaskDialogMode(null);
      setFeedback({ message: '保存成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteTask(item: TaskRecord) {
    if (!selectedType || !window.confirm(`确认删除任务模板"${item.taskTitle}"吗？`)) {
      return;
    }
    setSubmitting('delete-task');
    try {
      await mutateData<boolean>(`/api/project/types/${selectedType.id}/tasks/${item.id}`, 'DELETE');
      await loadTypeDetail(selectedType.id);
      setFeedback({ message: '删除成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCopyTask(item: TaskRecord) {
    if (!selectedType || !selectedNode) {
      return;
    }
    setSubmitting('copy-task');
    try {
      const createdTask = await mutateData<ApiProjectTypeTask>(`/api/project/types/${selectedType.id}/tasks`, 'POST', {
        needAudit: Boolean(item.needAudit),
        needCheck: Boolean(item.needCheck),
        needFile: Boolean(item.needFile),
        needSettle: Boolean(item.needSettle),
        nodeId: selectedNode.id,
        planDay: item.planDay ?? null,
        remark: item.remark ?? null,
        sort: (item.sort ?? 0) + 1,
        taskCode: `${item.taskCode}_COPY`,
        taskContent: item.taskContent ?? null,
        taskTitle: `${item.taskTitle} - 副本`,
      });

      // 复制任务的排期
      if (item.schedules.length > 0) {
        await mutateData(
          `/api/project/types/${selectedType.id}/tasks/${createdTask.id}/schedules`,
          'PUT',
          buildSchedulePayload(item.schedules),
        );
      }

      await loadTypeDetail(selectedType.id);
      setFeedback({ message: '任务模板复制成功。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(null);
    }
  }

  async function persistSchedules(nextSchedules: ProgressSchedule[]) {
    if (!selectedType || !selectedTask) {
      throw new Error('请先选择任务模板。');
    }
    const response = await mutateData<ApiProjectTypeTaskSchedule[]>(
      `/api/project/types/${selectedType.id}/tasks/${selectedTask.id}/schedules`,
      'PUT',
      buildSchedulePayload(nextSchedules),
    );
    setTasks((current) =>
      current.map((item) =>
        item.id === selectedTask.id
          ? { ...item, schedules: response.map((schedule) => mapSchedule(schedule)).sort(sortSchedules) }
          : item,
      ),
    );
  }

  async function handleSaveSchedule() {
    if (!selectedTask || !draftSchedule) {
      return;
    }
    const validationMessage = validateScheduleDraft(draftSchedule);
    if (validationMessage) {
      setScheduleError(validationMessage);
      return;
    }
    const normalizedDraft = normalizeScheduleDraft(draftSchedule);
    const nextSchedules = editingScheduleId
      ? selectedTask.schedules.map((item) => (item.id === editingScheduleId ? normalizedDraft : item))
      : [...selectedTask.schedules, normalizedDraft];
    setScheduleSaving(true);
    setScheduleError(null);
    try {
      await persistSchedules(nextSchedules);
      setDraftSchedule(null);
      setEditingScheduleId(null);
      setFeedback({ message: '保存成功。', tone: 'success' });
    } catch (error) {
      setScheduleError(normalizeErrorMessage(error));
    } finally {
      setScheduleSaving(false);
    }
  }

  async function handleDeleteSchedule() {
    if (!selectedTask || !editingScheduleId) {
      return;
    }
    if (!window.confirm('确认删除当前排期模板吗？')) {
      return;
    }
    setScheduleSaving(true);
    setScheduleError(null);
    try {
      await persistSchedules(selectedTask.schedules.filter((item) => item.id !== editingScheduleId));
      setDraftSchedule(null);
      setEditingScheduleId(null);
      setFeedback({ message: '删除成功。', tone: 'success' });
    } catch (error) {
      setScheduleError(normalizeErrorMessage(error));
    } finally {
      setScheduleSaving(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
              <path d="M3 5.5C3 4.12 4.12 3 5.5 3h9C15.88 3 17 4.12 17 5.5v9c0 1.38-1.12 2.5-2.5 2.5h-9A2.48 2.48 0 0 1 3 14.5v-9Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">里程碑模板配置中心</h1>
            <p className="text-slate-500 text-sm">从管理维度配置标准化流程，从用户维度提供清晰的任务指引。</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
            全局规则配置
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors text-sm font-medium shadow-md shadow-blue-100"
            onClick={openCreateTypeDialog}
          >
            创建新模板
          </button>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Level 1: Template Cards (Left 1/4) */}
        <div className="w-1/4 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 16 16">
                  <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-700">1. 模板主表</span>
            </div>
            <button 
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              onClick={openCreateTypeDialog}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTypes.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedTypeId(item.id)}
                className={cx(
                  'p-3 cursor-pointer rounded-xl transition-all border',
                  selectedTypeId === item.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                    : 'hover:bg-slate-50 border-transparent text-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cx('text-[10px] font-mono', selectedTypeId === item.id ? 'text-blue-100' : 'text-slate-400')}>
                    {item.typeCode}
                  </span>
                  <button 
                    className={cx('p-1 rounded hover:bg-white/20', selectedTypeId === item.id ? 'text-white' : 'text-slate-400')}
                    onClick={(e) => { e.stopPropagation(); void handleCopyType(item); }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M1 8V2a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <h3 className="text-sm font-bold truncate">{item.typeName}</h3>
                <div className={cx('mt-2 flex items-center justify-between text-[10px]', selectedTypeId === item.id ? 'text-blue-100' : 'text-slate-400')}>
                  <span>{item.typeDesc || item.typeName}</span>
                  <span className={cx('px-1.5 py-0.5 rounded-full', selectedTypeId === item.id ? 'bg-white/20' : 'bg-slate-100')}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 2: Node Tree (Middle 1/3) */}
        <div className="w-1/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 16 16">
                  <path d="M2 4h3v3H2zM7 4h3v3H7zM12 4h2v3h-2zM2 9h3v3H2zM7 9h3v3H7z" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-700">2. 节点树 (子表)</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                onClick={() => {
                  // 展开所有有子节点的节点
                  const allParentIds = new Set<number>();
                  flattenedNodes.forEach(node => {
                    if (node.children.length > 0) {
                      allParentIds.add(node.id);
                    }
                  });
                  setExpandedNodeIds(allParentIds);
                }}
              >
                展开全部
              </button>
              <button 
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500"
                onClick={() => openCreateNodeDialog(null)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {/* Current Template Badge */}
            <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">当前所属模板</p>
              <p className="text-sm font-bold text-slate-800">{selectedType?.typeName || '未选择'}</p>
            </div>
            {/* Node Tree */}
            <div className="space-y-1">
              {!selectedType ? (
                <div className="py-8 text-center text-slate-400 text-sm">请先选择里程碑模板</div>
              ) : nodes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <p>暂无节点模板数据</p>
                  <button 
                    className="mt-2 text-blue-600 text-xs font-bold hover:underline"
                    onClick={openCreateNodeDialog}
                  >
                    立即添加
                  </button>
                </div>
              ) : (
                flattenedNodes.map((node) => {
                  // 如果节点有父节点且父节点未展开，则不渲染
                  const parentNode = nodes.find(n => {
                    const nCode = n.nodeCode;
                    const nodeCode = node.nodeCode;
                    return nodeCode.startsWith(nCode) && nodeCode !== nCode && node.level > 0;
                  });
                  if (parentNode && !expandedNodeIds.has(parentNode.id)) {
                    return null;
                  }
                  return (
                    <NodeTreeItem
                      key={node.id}
                      node={node}
                      selectedNodeId={selectedNodeId}
                      onSelect={setSelectedNodeId}
                      onEdit={(item) => {
                        // 编辑时作为新增子节点处理，自动生成子节点编码
                        if (nodeDialogMode === null) {
                          openCreateNodeDialog(item);
                        } else {
                          openEditNodeDialog(item);
                        }
                      }}
                      onDelete={(item) => void handleDeleteNode(item)}
                      expandedIds={expandedNodeIds}
                      onToggleExpand={toggleNodeExpand}
                      level={node.level}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Level 3: Task List (Right, flex-1) */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 16 16">
                  <path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-700">3. 任务列表 (子表)</span>
            </div>
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
              onClick={openCreateTaskDialog}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              新增任务
            </button>
          </div>
          
          {/* Current Node Info Bar */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">当前所属节点</p>
                <h4 className="text-sm font-bold text-slate-800">
                  {nodes.find(n => n.id === selectedNodeId)?.nodeName || '未选择节点'}
                </h4>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">任务数</span>
                  <span className="text-sm font-bold text-slate-700">{nodeTasks.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto">
            {!selectedNode ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 48 48">
                  <path d="M8 12h32M8 24h32M8 36h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <p className="text-sm font-medium">请先选择节点模板</p>
              </div>
            ) : nodeTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 48 48">
                  <path d="M8 12h32M8 24h32M8 36h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <p className="text-sm font-medium">该节点下暂未配置任务模板</p>
                <button 
                  className="mt-4 text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"
                  onClick={openCreateTaskDialog}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  立即添加
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">任务详情</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">控制规则</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodeTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-slate-400 mb-0.5">{task.taskCode}</span>
                          <span className="text-sm font-bold text-slate-800">{task.taskTitle}</span>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.taskContent || '--'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5">
                          <TaskRuleBadge active={task.needCheck} label="验收" icon={<CheckCircleIcon />} />
                          <TaskRuleBadge active={task.needAudit} label="审核" icon={<InfoIcon />} />
                          <TaskRuleBadge active={task.needFile} label="附件" icon={<FileTextIcon />} />
                          <TaskRuleBadge active={task.needSettle} label="结算" icon={<CreditCardIcon />} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={withStoppedRowAction(() => openEditTaskDialog(task))}
                          >
                            <EditIcon />
                          </button>
                          <button 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={withStoppedRowAction(() => void handleDeleteTask(task))}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                        <button className="p-1.5 text-slate-300 group-hover:hidden">
                          <MoreIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Batch Rules Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                批量规则维护
              </span>
              <div className="flex gap-2">
                <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase">重置</button>
                <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase">应用更改</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-slate-600 group-hover:text-slate-900">所有任务强制上传附件</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-slate-600 group-hover:text-slate-900">所有任务需财务结算</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Drawer: 里程碑模板编辑 ────────────────────── */}
      {typeDialogMode ? (
        <DrawerShell
          footer={
            <>
              <Button onClick={() => setTypeDialogMode(null)} tone="ghost">
                取消
              </Button>
              <Button disabled={Boolean(submitting)} onClick={() => void handleSubmitType()}>
                保存
              </Button>
            </>
          }
          onClose={() => setTypeDialogMode(null)}
          title={typeDialogMode === 'create' ? '新增里程碑模板' : '编辑里程碑模板'}
        >
          <div className="space-y-8">
            <FieldSection label="基本信息">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">模板编码</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTypeForm((current) => ({ ...current, typeCode: event.target.value }))
                    }
                    value={typeForm.typeCode}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">模板名称</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTypeForm((current) => ({ ...current, typeName: event.target.value }))
                    }
                    value={typeForm.typeName}
                  />
                </div>
              </FieldRow>
            </FieldSection>
            <FieldSection label="配置">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">状态</label>
                  <select
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setTypeForm((current) => ({ ...current, status: event.target.value }))
                    }
                    value={typeForm.status}
                  >
                    <option value="ACTIVE">启用</option>
                    <option value="INACTIVE">停用</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">排序</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTypeForm((current) => ({ ...current, sort: event.target.value }))
                    }
                    value={typeForm.sort}
                  />
                </div>
              </FieldRow>
            </FieldSection>
            <FieldSection label="备注">
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setTypeForm((current) => ({ ...current, typeDesc: event.target.value }))
                }
                placeholder="可选，补充业务说明或使用场景..."
                value={typeForm.typeDesc}
              />
            </FieldSection>
          </div>
        </DrawerShell>
      ) : null}

      {/* ── Drawer: 节点模板编辑 ───────────────────────── */}
      {nodeDialogMode ? (
        <DrawerShell
          footer={
            <>
              <Button onClick={() => setNodeDialogMode(null)} tone="ghost">
                取消
              </Button>
              <Button disabled={Boolean(submitting)} onClick={() => void handleSubmitNode()}>
                保存
              </Button>
            </>
          }
          onClose={() => setNodeDialogMode(null)}
          title={nodeDialogMode === 'create' ? '新增节点模板' : '编辑节点模板'}
        >
          <div className="space-y-8">
            <FieldSection label="基本信息">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">父节点</label>
                  <select
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                      const parentId = event.target.value ? parseInt(event.target.value, 10) : null;
                      const parentNode = nodes.find(n => n.id === parentId);
                      const siblingCodes = nodes.filter(n => n.id !== nodeForm.parentNodeId).map(n => n.nodeCode);
                      const newCode = generateChildNodeCode(parentNode?.nodeCode ?? null, siblingCodes);
                      setNodeForm((current) => ({ 
                        ...current, 
                        parentNodeId: parentId,
                        nodeCode: current.nodeName ? newCode : current.nodeCode, // 只有填写了名称才重新生成
                      }));
                    }}
                    value={nodeForm.parentNodeId ?? ''}
                  >
                    <option value="">无（作为根节点）</option>
                    {nodes.filter(n => n.id !== selectedNodeId).map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.nodeCode} - {node.nodeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">节点编码 <span className="text-blue-500 text-[10px]">（自动生成）</span></label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNodeForm((current) => ({ ...current, nodeCode: event.target.value }))
                    }
                    value={nodeForm.nodeCode}
                    placeholder="根据父节点自动生成"
                  />
                </div>
              </FieldRow>
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">节点名称</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNodeForm((current) => ({ ...current, nodeName: event.target.value }))
                    }
                    value={nodeForm.nodeName}
                  />
                </div>
              </FieldRow>
            </FieldSection>
            <FieldSection label="计划">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">计划天数</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNodeForm((current) => ({ ...current, planDay: event.target.value }))
                    }
                    placeholder="数字，单位：天"
                    value={nodeForm.planDay}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">排序</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNodeForm((current) => ({ ...current, sort: event.target.value }))
                    }
                    value={nodeForm.sort}
                  />
                </div>
              </FieldRow>
            </FieldSection>
            <FieldSection label="流程控制">
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2.5 text-sm text-slate-700">
                  <input
                    checked={nodeForm.needCheck}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-200"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNodeForm((current) => ({ ...current, needCheck: event.target.checked }))
                    }
                    type="checkbox"
                  />
                  需要检查
                </label>
                <label className="flex items-center gap-2.5 text-sm text-slate-700">
                  <input
                    checked={nodeForm.needAudit}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-200"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNodeForm((current) => ({ ...current, needAudit: event.target.checked }))
                    }
                    type="checkbox"
                  />
                  需要审核
                </label>
              </div>
            </FieldSection>
            <FieldSection label="备注">
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setNodeForm((current) => ({ ...current, remark: event.target.value }))
                }
                placeholder="可选，补充说明..."
                value={nodeForm.remark}
              />
            </FieldSection>
          </div>
        </DrawerShell>
      ) : null}

      {/* ── Drawer: 任务模板编辑 ───────────────────────── */}
      {taskDialogMode ? (
        <DrawerShell
          footer={
            <>
              <Button onClick={() => setTaskDialogMode(null)} tone="ghost">
                取消
              </Button>
              <Button disabled={Boolean(submitting)} onClick={() => void handleSubmitTask()}>
                保存
              </Button>
            </>
          }
          onClose={() => setTaskDialogMode(null)}
          title={taskDialogMode === 'create' ? '新增任务模板' : '编辑任务模板'}
        >
          <div className="space-y-8">
            <FieldSection label="基本信息">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">任务编码</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTaskForm((current) => ({ ...current, taskCode: event.target.value }))
                    }
                    value={taskForm.taskCode}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">任务标题</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTaskForm((current) => ({ ...current, taskTitle: event.target.value }))
                    }
                    value={taskForm.taskTitle}
                  />
                </div>
              </FieldRow>
            </FieldSection>
            <FieldSection label="计划">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">计划天数</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTaskForm((current) => ({ ...current, planDay: event.target.value }))
                    }
                    placeholder="数字，单位：天"
                    value={taskForm.planDay}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-500">排序</label>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTaskForm((current) => ({ ...current, sort: event.target.value }))
                    }
                    value={taskForm.sort}
                  />
                </div>
              </FieldRow>
            </FieldSection>
            <FieldSection label="流程控制">
              <div className="flex flex-wrap gap-6">
                {[
                  { key: 'needCheck' as const, label: '需要检查' },
                  { key: 'needAudit' as const, label: '需要审核' },
                  { key: 'needFile' as const, label: '需要文件' },
                  { key: 'needSettle' as const, label: '需要结算' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <input
                      checked={taskForm[item.key]}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-200"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setTaskForm((current) => ({ ...current, [item.key]: event.target.checked }))
                      }
                      type="checkbox"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </FieldSection>
            <FieldSection label="任务内容">
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setTaskForm((current) => ({ ...current, taskContent: event.target.value }))
                }
                placeholder="可选，补充任务执行的具体内容要求..."
                value={taskForm.taskContent}
              />
            </FieldSection>
            <FieldSection label="备注">
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setTaskForm((current) => ({ ...current, remark: event.target.value }))
                }
                placeholder="可选..."
                value={taskForm.remark}
              />
            </FieldSection>
          </div>
        </DrawerShell>
      ) : null}

      {/* ── ProgressConfigModal (排期编辑，保持原有 modal) ── */}
      <ProgressConfigModal
        canDelete={Boolean(editingScheduleId)}
        errorMessage={null}
        onChange={setDraftSchedule}
        onClose={() => {
          setDraftSchedule(null);
          setEditingScheduleId(null);
          setScheduleError(null);
        }}
        onDelete={() => void handleDeleteSchedule()}
        onSave={() => void handleSaveSchedule()}
        open={Boolean(draftSchedule)}
        saving={scheduleSaving}
        schedule={draftSchedule}
        taskTitle={selectedTask?.taskTitle ?? null}
      />
    </div>
  );
}
