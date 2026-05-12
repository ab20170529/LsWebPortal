import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';

import { Button, Card, cx } from '@lserp/ui';

import { createProjectApiClient } from './project-api';
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

const apiClient = createProjectApiClient();

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

const fallbackProjectTypes: BasicProjectType[] = [
  {
    id: 9001,
    sort: 1,
    status: 'ACTIVE',
    typeCode: 'xmgl_demo',
    typeDesc: '项目管理平台标准实施模板',
    typeName: '项目管理开发',
  },
  {
    id: 9002,
    sort: 2,
    status: 'ACTIVE',
    typeCode: 'sjzl_demo',
    typeDesc: '数据治理与报表建设模板',
    typeName: '数据治理项目',
  },
  {
    id: 9003,
    sort: 3,
    status: 'INACTIVE',
    typeCode: 'ywxt_demo',
    typeDesc: '业务系统升级改造模板',
    typeName: '业务系统优化',
  },
];

const fallbackProjectTypeNodesByTypeId: Record<number, ApiProjectTypeNode[]> = {
  9001: [
    { id: 9101, needAudit: true, needCheck: true, nodeCode: '01', nodeName: '项目立项', parentNodeId: null, planDay: 3, sort: 1 },
    { id: 9102, needAudit: true, needCheck: true, nodeCode: '02', nodeName: '项目开发', parentNodeId: null, planDay: 10, sort: 2 },
    { id: 9103, needAudit: true, needCheck: true, nodeCode: '0201', nodeName: '设计界面', parentNodeId: 9102, planDay: 3, sort: 3 },
    { id: 9104, needAudit: true, needCheck: true, nodeCode: '0202', nodeName: '开发代码', parentNodeId: 9102, planDay: 5, sort: 4 },
    { id: 9105, needAudit: true, needCheck: true, nodeCode: '03', nodeName: '验收交付', parentNodeId: null, planDay: 2, sort: 5 },
  ],
  9002: [
    { id: 9201, needAudit: true, needCheck: true, nodeCode: '01', nodeName: '数据盘点', parentNodeId: null, planDay: 4, sort: 1 },
    { id: 9202, needAudit: true, needCheck: true, nodeCode: '02', nodeName: '模型建设', parentNodeId: null, planDay: 8, sort: 2 },
    { id: 9203, needAudit: true, needCheck: true, nodeCode: '03', nodeName: '报表验收', parentNodeId: null, planDay: 3, sort: 3 },
  ],
  9003: [
    { id: 9301, needAudit: false, needCheck: true, nodeCode: '01', nodeName: '需求梳理', parentNodeId: null, planDay: 3, sort: 1 },
    { id: 9302, needAudit: true, needCheck: true, nodeCode: '02', nodeName: '版本升级', parentNodeId: null, planDay: 7, sort: 2 },
  ],
};

const fallbackProjectTypeTasksByTypeId: Record<number, ApiProjectTypeTask[]> = {
  9001: [
    { id: 9401, needAudit: false, needCheck: true, needFile: true, needSettle: false, nodeId: 9101, planDay: 1, sort: 1, taskCode: '01-01', taskTitle: '项目准备', taskContent: '完成项目范围确认、干系人同步与资料准备。' },
    { id: 9402, needAudit: true, needCheck: true, needFile: true, needSettle: false, nodeId: 9103, planDay: 3, sort: 2, taskCode: '02-01', taskTitle: '设计 UI', taskContent: '输出页面高保真设计与交互说明。' },
    { id: 9403, needAudit: true, needCheck: true, needFile: true, needSettle: false, nodeId: 9104, planDay: 5, sort: 3, taskCode: '02-02', taskTitle: '开发代码', taskContent: '完成前端页面与核心交互开发。' },
    { id: 9404, needAudit: true, needCheck: true, needFile: true, needSettle: true, nodeId: 9105, planDay: 2, sort: 4, taskCode: '03-01', taskTitle: '验收确认', taskContent: '完成验收材料归档与交付确认。' },
  ],
  9002: [
    { id: 9501, needAudit: true, needCheck: true, needFile: true, needSettle: false, nodeId: 9201, planDay: 4, sort: 1, taskCode: '01-01', taskTitle: '数据源盘点', taskContent: '梳理业务库、字段口径与负责人。' },
    { id: 9502, needAudit: true, needCheck: true, needFile: true, needSettle: false, nodeId: 9202, planDay: 8, sort: 2, taskCode: '02-01', taskTitle: '指标模型建设', taskContent: '完成主题域、指标层和明细层建设。' },
    { id: 9503, needAudit: true, needCheck: true, needFile: true, needSettle: true, nodeId: 9203, planDay: 3, sort: 3, taskCode: '03-01', taskTitle: '报表验收', taskContent: '按验收清单完成口径核对与交付。' },
  ],
  9003: [
    { id: 9601, needAudit: false, needCheck: true, needFile: false, needSettle: false, nodeId: 9301, planDay: 3, sort: 1, taskCode: '01-01', taskTitle: '需求确认', taskContent: '确认升级范围和影响模块。' },
    { id: 9602, needAudit: true, needCheck: true, needFile: true, needSettle: false, nodeId: 9302, planDay: 7, sort: 2, taskCode: '02-01', taskTitle: '升级实施', taskContent: '完成版本升级、联调与回归验证。' },
  ],
};

const fallbackProjectTypeSchedulesByTypeId: Record<number, ApiProjectTypeTaskSchedule[]> = {
  9001: [
    { color: 'blue', endDay: 12, endMonth: 4, id: 9701, nodeId: 9101, ownerName: '王秀娟', projectTypeId: 9001, projectTypeTaskId: 9401, sort: 1, startDay: 9, startMonth: 4 },
    { color: 'violet', endDay: 15, endMonth: 4, id: 9702, nodeId: 9103, ownerName: '张伟', projectTypeId: 9001, projectTypeTaskId: 9402, sort: 2, startDay: 13, startMonth: 4 },
    { color: 'blue', endDay: 24, endMonth: 4, id: 9703, nodeId: 9104, ownerName: '李明', projectTypeId: 9001, projectTypeTaskId: 9403, sort: 3, startDay: 15, startMonth: 4 },
    { color: 'emerald', endDay: 30, endMonth: 4, id: 9704, nodeId: 9105, ownerName: '陈丽', projectTypeId: 9001, projectTypeTaskId: 9404, sort: 4, startDay: 29, startMonth: 4 },
  ],
  9002: [
    { color: 'blue', endDay: 11, endMonth: 4, id: 9801, nodeId: 9201, ownerName: '王秀娟', projectTypeId: 9002, projectTypeTaskId: 9501, sort: 1, startDay: 8, startMonth: 4 },
    { color: 'violet', endDay: 22, endMonth: 4, id: 9802, nodeId: 9202, ownerName: '张伟', projectTypeId: 9002, projectTypeTaskId: 9502, sort: 2, startDay: 14, startMonth: 4 },
    { color: 'emerald', endDay: 26, endMonth: 4, id: 9803, nodeId: 9203, ownerName: '刘明', projectTypeId: 9002, projectTypeTaskId: 9503, sort: 3, startDay: 24, startMonth: 4 },
  ],
  9003: [
    { color: 'blue', endDay: 10, endMonth: 4, id: 9901, nodeId: 9301, ownerName: '孙浩', projectTypeId: 9003, projectTypeTaskId: 9601, sort: 1, startDay: 8, startMonth: 4 },
    { color: 'violet', endDay: 18, endMonth: 4, id: 9902, nodeId: 9302, ownerName: '孙浩', projectTypeId: 9003, projectTypeTaskId: 9602, sort: 2, startDay: 12, startMonth: 4 },
  ],
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

function StatusPill({ status }: { status?: string | null }) {
  const active = status === 'ACTIVE';
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center rounded-full px-3 text-[13px] font-medium',
        active ? 'bg-[#e8fbf5] text-[#12b981]' : 'bg-[#f2f6fb] text-[#5e7291]',
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function MetricCell({
  label,
  tone = 'default',
  value,
}: {
  label: string;
  tone?: 'blue' | 'default' | 'green' | 'orange';
  value: number | string;
}) {
  return (
    <div className="flex min-h-[78px] flex-col justify-center px-4 py-3">
      <div className="text-[13px] font-medium text-[#6b7f9e]">{label}</div>
      <div
        className={cx(
          'mt-1 text-2xl font-bold leading-8',
          tone === 'blue' ? 'text-[#1f65e8]' : null,
          tone === 'green' ? 'text-[#12b981]' : null,
          tone === 'orange' ? 'text-[#ff8a00]' : null,
          tone === 'default' ? 'text-[#111c33]' : null,
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ModuleShell({
  children,
  extra,
  subtitle,
  title,
}: {
  children: ReactNode;
  extra?: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#edf2f8] px-4 pb-3 pt-4">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-bold text-[#111c33]">{title}</h3>
          {subtitle ? <div className="mt-1 truncate text-[13px] font-medium text-[#6b7f9e]">{subtitle}</div> : null}
        </div>
        {extra}
      </div>
      {children}
    </Card>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#526681] transition hover:bg-[#eaf3ff] hover:text-[#1f65e8] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function PrimaryActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1f7cff] px-3 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.18)] transition hover:bg-[#176df0] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({ accent, label, value }: { accent: string; label: string; value: string | number }) {
  return (
    <div className={`rounded-[22px] ${accent} p-5`}>
      <div className="text-[12px] font-bold text-white/60">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
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
          'group flex cursor-pointer items-center gap-2 rounded-md border-l-2 px-3 py-2 transition',
          isSelected ? 'border-[#1f7cff] bg-[#edf6ff] text-[#1f65e8]' : 'border-transparent text-[#526681] hover:bg-[#f8fbff]'
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/Collapse indicator */}
        <div className="flex h-4 w-4 items-center justify-center" onClick={(e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); hasChildren && onToggleExpand(node.id); }}>
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate text-[13px] font-medium">{node.nodeName}</span>
            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                title="添加子节点"
                className="p-1 hover:text-green-600"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onEdit(node); }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button 
                title="编辑"
                className="p-1 hover:text-blue-600"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onEdit(node); }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                  <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                title="删除"
                className="p-1 hover:text-red-600"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDelete(node); }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                  <path d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v5M10 7v5M3.5 4l.5 9a1 1 0 001 1h6a1 1 0 001-1l.5-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[13px] font-medium text-[#6b7f9e]">{node.nodeCode}</span>
            <span className="text-[13px] font-medium text-[#6b7f9e]">{formatPlanDay(node.planDay)}</span>
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
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-[13px] font-medium transition-colors',
        active ? 'border border-[#cfe1ff] bg-[#eaf3ff] text-[#1f65e8]' : 'border border-[#edf2f8] bg-[#f8fbff] text-[#9badc7]'
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
      className="flex h-8 w-8 items-center justify-center rounded-md text-[#7e91b0] transition hover:bg-[#f2f6fb] hover:text-[#263653] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
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
      <div className="fixed inset-0 z-40 bg-slate-950/16" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-[calc(100vw-24px)] flex-col border-l border-[#e4ebf5] bg-white shadow-[-14px_0_30px_rgba(24,39,75,0.085)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf2f8] px-5 py-4">
          <div>
            <div className="text-[16px] font-bold text-[#111c33]">{title}</div>
            <div className="mt-1 text-[13px] font-medium text-[#6b7f9e]">填写信息后保存</div>
          </div>
          <DrawerCloseIcon onClick={onClose} />
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {/* Footer */}
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-[#edf2f8] px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </>
  );
}

function FieldSection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1f7cff]" />
        <span className="text-[13px] font-semibold text-[#263653]">{label}</span>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
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
  const [typeForm, setTypeForm] = useState<TypeFormState>(() => ({ ...initialTypeForm }));
  const [nodeForm, setNodeForm] = useState<NodeFormState>(() => ({ ...initialNodeForm }));
  const [taskForm, setTaskForm] = useState<TaskFormState>(() => ({ ...initialTaskForm }));
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
    } catch {
      const items = fallbackProjectTypes;
      setProjectTypes(items);
      setSelectedTypeId((current) => {
        if (nextSelectedTypeId && items.some((item) => item.id === nextSelectedTypeId)) {
          return nextSelectedTypeId;
        }
        return current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null;
      });
      setFeedback(null);
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
    } catch {
      const fallbackNodes = fallbackProjectTypeNodesByTypeId[typeId] ?? [];
      const fallbackSchedulesByTaskId = (fallbackProjectTypeSchedulesByTypeId[typeId] ?? []).reduce<Record<number, ProgressSchedule[]>>((accumulator, schedule) => {
        const current = accumulator[schedule.projectTypeTaskId] ?? [];
        current.push(mapSchedule(schedule));
        accumulator[schedule.projectTypeTaskId] = current.sort(sortSchedules);
        return accumulator;
      }, {});
      const fallbackTasks = (fallbackProjectTypeTasksByTypeId[typeId] ?? []).map((task) => ({
        ...task,
        schedules: fallbackSchedulesByTaskId[task.id] ?? [],
      }));

      setFeedback(null);
      setNodes([...fallbackNodes].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0)));
      setTasks([...fallbackTasks].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0)));
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    void loadTypeDetail(selectedTypeId);
  }, [selectedTypeId]);

  function openCreateTypeDialog() {
    setTypeForm({ ...initialTypeForm });
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
    setTaskForm({ ...initialTaskForm });
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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f8fc]">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="hidden">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
              <path d="M3 5.5C3 4.12 4.12 3 5.5 3h9C15.88 3 17 4.12 17 5.5v9c0 1.38-1.12 2.5-2.5 2.5h-9A2.48 2.48 0 0 1 3 14.5v-9Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[20px] font-bold leading-7 text-[#111c33]">里程碑模板管理</h1>
            <p className="mt-1 text-[14px] font-medium text-[#5e7291]">维护项目类型、节点模板、任务模板与标准排期</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden">
            全局规则配置
          </button>
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1f7cff] px-3 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.18)] transition hover:bg-[#176df0] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
            onClick={openCreateTypeDialog}
          >
            创建新模板
          </button>
        </div>
      </div>

      <Card className="mb-2 overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
        <div className="grid divide-y divide-[#edf2f8] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <MetricCell label="模板总数" tone="blue" value={projectTypes.length} />
          <MetricCell label="启用模板" tone="green" value={activeTypeCount} />
          <MetricCell label="节点模板" value={nodes.length} />
          <MetricCell label="排期配置" tone="orange" value={totalScheduleCount} />
        </div>
      </Card>

      {/* Main Content - Three Column Layout */}
      <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[280px_340px_minmax(0,1fr)]">
        
        {/* Level 1: Template Cards (Left 1/4) */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#e4ebf5] bg-white shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
          <div className="flex items-center justify-between border-b border-[#edf2f8] px-4 pb-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="hidden">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 16 16">
                  <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-[14px] font-bold text-[#111c33]">模板主表</span>
            </div>
            <button 
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#526681] transition hover:bg-[#eaf3ff] hover:text-[#1f65e8] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
              onClick={openCreateTypeDialog}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="border-b border-[#edf2f8] px-3 py-3">
            <input
              className="field-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value)}
              placeholder="搜索模板编码或名称"
              value={searchValue}
            />
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {filteredTypes.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedTypeId(item.id)}
                className={cx(
                  'cursor-pointer rounded-md border p-3 transition',
                  selectedTypeId === item.id
                    ? 'border-[#1f7cff] bg-[#edf6ff] text-[#1f65e8]'
                    : 'border-transparent bg-white text-[#526681] hover:bg-[#f8fbff]'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cx('font-mono text-[13px] font-medium', selectedTypeId === item.id ? 'text-[#1f65e8]' : 'text-[#6b7f9e]')}>
                    {item.typeCode}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      className={cx('rounded p-1 transition hover:bg-[#eaf3ff]', selectedTypeId === item.id ? 'text-[#1f65e8]' : 'text-[#8da0bd]')}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); openEditTypeDialog(item); }}
                      title="编辑模板"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className={cx('rounded p-1 transition hover:bg-[#eaf3ff]', selectedTypeId === item.id ? 'text-[#1f65e8]' : 'text-[#8da0bd]')}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); void handleCopyType(item); }}
                      title="复制模板"
                      type="button"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                        <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M1 8V2a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className="truncate text-[13px] font-semibold text-[#263653]">{item.typeName}</h3>
                <div className={cx('mt-2 flex items-center justify-between text-[13px] font-medium', selectedTypeId === item.id ? 'text-[#526681]' : 'text-[#6b7f9e]')}>
                  <span>{item.typeDesc || item.typeName}</span>
                  <span className={cx('rounded-full px-2 py-0.5', selectedTypeId === item.id ? 'bg-white text-[#1f65e8]' : 'bg-[#f2f6fb]')}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 2: Node Tree (Middle 1/3) */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#e4ebf5] bg-white shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
          <div className="flex items-center justify-between border-b border-[#edf2f8] px-4 pb-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="hidden">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 16 16">
                  <path d="M2 4h3v3H2zM7 4h3v3H7zM12 4h2v3h-2zM2 9h3v3H2zM7 9h3v3H7z" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </div>
              <span className="text-[14px] font-bold text-[#111c33]">2. 节点树 (子表)</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="inline-flex h-8 items-center rounded-md px-2 text-[13px] font-semibold text-[#1f65e8] transition hover:bg-[#eaf3ff]"
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
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#526681] transition hover:bg-[#eaf3ff] hover:text-[#1f65e8] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
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
            <div className="mb-3 rounded-md border border-[#edf2f8] bg-[#f8fbff] p-3">
              <p className="mb-1 text-[12px] font-medium text-[#6b7f9e]">当前所属模板</p>
              <p className="truncate text-[13px] font-semibold text-[#263653]">{selectedType?.typeName || '未选择'}</p>
            </div>
            {/* Node Tree */}
            <div className="space-y-1">
              {!selectedType ? (
                <div className="py-8 text-center text-[13px] font-medium text-[#8da0bd]">请先选择里程碑模板</div>
              ) : nodes.length === 0 ? (
                <div className="py-8 text-center text-[13px] font-medium text-[#8da0bd]">
                  <p>暂无节点模板数据</p>
                  <button 
                    className="mt-2 text-[13px] font-semibold text-[#1f65e8]"
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
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#e4ebf5] bg-white shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
          <div className="flex items-center justify-between border-b border-[#edf2f8] px-4 pb-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="hidden">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 16 16">
                  <path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-[14px] font-bold text-[#111c33]">3. 任务列表 (子表)</span>
            </div>
            <button 
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1f7cff] px-3 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.18)] transition hover:bg-[#176df0] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
              onClick={openCreateTaskDialog}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              新增任务
            </button>
          </div>
          
          {/* Current Node Info Bar */}
          <div className="border-b border-[#edf2f8] bg-[#f8fbff] px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-[#6b7f9e]">当前所属节点</p>
                <h4 className="mt-1 text-[13px] font-semibold text-[#263653]">
                  {nodes.find(n => n.id === selectedNodeId)?.nodeName || '未选择节点'}
                </h4>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-[12px] font-medium text-[#6b7f9e]">任务数</span>
                  <span className="text-[13px] font-bold text-[#263653]">{nodeTasks.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto">
            {!selectedNode ? (
              <div className="flex h-full flex-col items-center justify-center p-5 text-[13px] font-medium text-[#8da0bd]">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 48 48">
                  <path d="M8 12h32M8 24h32M8 36h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <p className="text-[13px] font-medium">请先选择节点模板</p>
              </div>
            ) : nodeTasks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-5 text-[13px] font-medium text-[#8da0bd]">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 48 48">
                  <path d="M8 12h32M8 24h32M8 36h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <p className="text-[13px] font-medium">该节点下暂未配置任务模板</p>
                <button 
                  className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-[#1f65e8]"
                  onClick={openCreateTaskDialog}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  立即添加
                </button>
              </div>
            ) : (
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf2f8] bg-[#f8fbff]">
                    <th className="px-4 py-3 text-[13px] font-medium text-[#6b7f9e]">任务详情</th>
                    <th className="px-4 py-3 text-[13px] font-medium text-[#6b7f9e]">控制规则</th>
                    <th className="px-4 py-3 text-right text-[13px] font-medium text-[#6b7f9e]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f8]">
                  {nodeTasks.map((task) => (
                    <tr key={task.id} className="group bg-white text-[13px] font-medium transition hover:bg-[#f8fbff]">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="mb-0.5 font-mono text-[13px] font-medium text-[#6b7f9e]">{task.taskCode}</span>
                          <span className="text-[13px] font-medium text-[#263653]">{task.taskTitle}</span>
                          <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#526681]">{task.taskContent || '--'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <TaskRuleBadge active={Boolean(task.needCheck)} label="验收" icon={<CheckCircleIcon />} />
                          <TaskRuleBadge active={Boolean(task.needAudit)} label="审核" icon={<InfoIcon />} />
                          <TaskRuleBadge active={Boolean(task.needFile)} label="附件" icon={<FileTextIcon />} />
                          <TaskRuleBadge active={Boolean(task.needSettle)} label="结算" icon={<CreditCardIcon />} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
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
          <div className="hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#6b7f9e]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                批量规则维护
              </span>
              <div className="flex gap-2">
                <button className="text-[12px] font-bold text-[#6b7f9e] hover:text-[#263653]">重置</button>
                <button className="text-[12px] font-bold text-[#1f65e8] hover:text-[#1756c9]">应用更改</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[13px] font-medium text-[#526681] group-hover:text-[#263653]">所有任务强制上传附件</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[13px] font-medium text-[#526681] group-hover:text-[#263653]">所有任务需财务结算</span>
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
          <div className="space-y-4">
            <FieldSection label="基本信息">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">模板编码</label>
                  <input
                    className="project-template-field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTypeForm((current) => ({ ...current, typeCode: event.target.value }))
                    }
                    value={typeForm.typeCode}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">模板名称</label>
                  <input
                    className="project-template-field-input"
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
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">状态</label>
                  <select
                    className="project-template-field-input"
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
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">排序</label>
                  <input
                    className="project-template-field-input"
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
                className="project-template-field-textarea"
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
          <div className="space-y-4">
            <FieldSection label="基本信息">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">父节点</label>
                  <select
                    className="project-template-field-input"
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
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">节点编码 <span className="text-[12px] font-medium text-[#1f65e8]">（自动生成）</span></label>
                  <input
                    className="project-template-field-input"
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
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">节点名称</label>
                  <input
                    className="project-template-field-input"
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
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">计划天数</label>
                  <input
                    className="project-template-field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNodeForm((current) => ({ ...current, planDay: event.target.value }))
                    }
                    placeholder="数字，单位：天"
                    value={nodeForm.planDay}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">排序</label>
                  <input
                    className="project-template-field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setNodeForm((current) => ({ ...current, sort: event.target.value }))
                    }
                    value={nodeForm.sort}
                  />
                </div>
              </FieldRow>
            </FieldSection>
            <FieldSection label="流程控制">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2.5 text-[13px] font-medium text-[#263653]">
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
                <label className="flex items-center gap-2.5 text-[13px] font-medium text-[#263653]">
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
                className="project-template-field-textarea"
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
          <div className="space-y-4">
            <FieldSection label="基本信息">
              <FieldRow>
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">任务编码</label>
                  <input
                    className="project-template-field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTaskForm((current) => ({ ...current, taskCode: event.target.value }))
                    }
                    value={taskForm.taskCode}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">任务标题</label>
                  <input
                    className="project-template-field-input"
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
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">计划天数</label>
                  <input
                    className="project-template-field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTaskForm((current) => ({ ...current, planDay: event.target.value }))
                    }
                    placeholder="数字，单位：天"
                    value={taskForm.planDay}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#6b7f9e]">排序</label>
                  <input
                    className="project-template-field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setTaskForm((current) => ({ ...current, sort: event.target.value }))
                    }
                    value={taskForm.sort}
                  />
                </div>
              </FieldRow>
            </FieldSection>
            <FieldSection label="流程控制">
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'needCheck' as const, label: '需要检查' },
                  { key: 'needAudit' as const, label: '需要审核' },
                  { key: 'needFile' as const, label: '需要文件' },
                  { key: 'needSettle' as const, label: '需要结算' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 text-[13px] font-medium text-[#263653]">
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
                className="project-template-field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setTaskForm((current) => ({ ...current, taskContent: event.target.value }))
                }
                placeholder="可选，补充任务执行的具体内容要求..."
                value={taskForm.taskContent}
              />
            </FieldSection>
            <FieldSection label="备注">
              <textarea
                className="project-template-field-textarea"
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
      <style>{`
        .field-input {
          display: flex;
          height: 36px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d9e3f1;
          background: #fff;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 500;
          color: #263653;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .field-input:focus {
          border-color: #1f7cff;
          box-shadow: 0 0 0 2px #dceaff;
        }
        .field-input::placeholder {
          color: #9badc7;
        }
        .field-textarea {
          display: flex;
          width: 100%;
          min-height: 72px;
          resize: vertical;
          border-radius: 6px;
          border: 1px solid #d9e3f1;
          background: #fff;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          line-height: 22px;
          color: #263653;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .field-textarea:focus {
          border-color: #1f7cff;
          box-shadow: 0 0 0 2px #dceaff;
        }
        .field-textarea::placeholder {
          color: #9badc7;
        }
      `}</style>

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

      <style>{`
        .project-template-field-input {
          display: block;
          height: 44px;
          width: 100%;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          padding: 0 14px;
          color: #1e293b;
          font-size: 14px;
          outline: none;
          pointer-events: auto;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .project-template-field-input:focus {
          border-color: #38bdf8;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
        }
        .project-template-field-input::placeholder {
          color: #94a3b8;
        }
        .project-template-field-textarea {
          display: block;
          min-height: 88px;
          width: 100%;
          resize: vertical;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          padding: 12px 14px;
          color: #1e293b;
          font-size: 14px;
          outline: none;
          pointer-events: auto;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .project-template-field-textarea:focus {
          border-color: #38bdf8;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
        }
        .project-template-field-textarea::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
