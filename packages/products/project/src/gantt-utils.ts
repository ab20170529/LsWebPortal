/**
 * 甘特图工具函数
 */
import type {
  DependencyEndpoint,
  DependencyLine,
  NodeItem,
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
  SUB_CATEGORY_ROW_HEIGHT,
  TASK_ROW_HEIGHT,
} from './gantt-types';

// ─────────────────────────────────────────────────────────────────────────────
// 日期工具
// ─────────────────────────────────────────────────────────────────────────────

export function parseDateValue(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatMonthDay(date?: Date | null): string {
  if (!date) return '--';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatShortMonthDay(date?: Date | null): string {
  if (!date) return '--';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatDateInput(date?: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTimeForApi(date: Date | null, mode: 'start' | 'end'): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}${mode === 'start' ? 'T00:00:00' : 'T23:59:00'}`;
}

export function areDatesEqual(left: Date | null, right: Date | null): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.getTime() === right.getTime();
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_IN_MS);
}

export function parseInputDate(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

// ─────────────────────────────────────────────────────────────────────────────
// 数值工具
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeProgress(value?: number | null): number {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

export function buildFeedbackMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return '操作失败，请稍后重试。';
}

// ─────────────────────────────────────────────────────────────────────────────
// 甘特图结构构建
// ─────────────────────────────────────────────────────────────────────────────

export function buildTimelineRange(
  project: { planStartTime?: string | null; planEndTime?: string | null } | null,
  rows: TimelineRow[],
): { start: Date; end: Date } {
  const dates = rows.flatMap((row) => [row.startDate, row.endDate]).filter(Boolean) as Date[];
  const projectStart = parseDateValue(project?.planStartTime);
  const projectEnd = parseDateValue(project?.planEndTime);
  if (projectStart) dates.push(projectStart);
  if (projectEnd) dates.push(projectEnd);

  if (!dates.length) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { end: addDays(today, 30), start: addDays(today, -7) };
  }

  dates.sort((l, r) => l.getTime() - r.getTime());
  const start = addDays(dates[0]!, -2);
  const end = addDays(dates[dates.length - 1]!, 2);
  if (daysBetween(start, end) >= 30) return { end, start };
  return { end: addDays(start, 30), start };
}

export function buildTimelineDays(start: Date, end: Date) {
  const totalDays = Math.max(1, daysBetween(start, end) + 1);
  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      id: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      label: String(date.getDate()),
      month: date.getMonth() + 1,
    };
  });
}

export function buildMonthGroups(days: Array<{ month: number }>): Array<{ count: number; month: number }> {
  const groups: Array<{ count: number; month: number }> = [];
  days.forEach((day) => {
    const last = groups[groups.length - 1];
    if (!last || last.month !== day.month) {
      groups.push({ count: 1, month: day.month });
    } else {
      last.count += 1;
    }
  });
  return groups;
}

export function buildTimelineCategories(nodes: NodeItem[], tasks: TaskItem[]): TimelineCategory[] {
  const sortedNodes = [...nodes].sort((l, r) => {
    const ll = Number(l.level ?? 0), rl = Number(r.level ?? 0);
    if (ll !== rl) return ll - rl;
    const ls = Number(l.sort ?? 0), rs = Number(r.sort ?? 0);
    if (ls !== rs) return ls - rs;
    return l.id - r.id;
  });

  const nodeMap = new Map(sortedNodes.map((n) => [n.id, n]));
  const childrenMap = new Map<number, NodeItem[]>();
  sortedNodes.forEach((node) => {
    const parentId = Number(node.parentId ?? 0);
    if (!parentId || !nodeMap.has(parentId)) return;
    const arr = childrenMap.get(parentId) ?? [];
    arr.push(node);
    childrenMap.set(parentId, arr);
  });

  const tasksByNodeId = new Map<number, TaskItem[]>();
  tasks.forEach((task) => {
    const nodeId = Number(task.projectNodeId ?? 0);
    if (!nodeId) return;
    const arr = tasksByNodeId.get(nodeId) ?? [];
    arr.push(task);
    tasksByNodeId.set(nodeId, arr);
  });

  const roots = sortedNodes.filter((n) => {
    const parentId = Number(n.parentId ?? 0);
    return !parentId || !nodeMap.has(parentId);
  });

  const categories: TimelineCategory[] = roots.map((root) => {
    const subCategories: TimelineSubCategory[] = [];
    const rootTasks = (tasksByNodeId.get(root.id) ?? []).sort((l, r) => l.id - r.id);
    const stack = [...(childrenMap.get(root.id) ?? [])];
    while (stack.length) {
      const cur = stack.shift();
      if (!cur) continue;
      subCategories.push({
        id: `sub-${cur.id}`,
        node: cur,
        tasks: (tasksByNodeId.get(cur.id) ?? []).sort((l, r) => l.id - r.id),
        title: cur.nodeName,
      });
      const children = childrenMap.get(cur.id) ?? [];
      if (children.length) stack.unshift(...children);
    }
    const descendantTaskCount = subCategories.reduce((s, c) => s + c.tasks.length, 0);
    return {
      count: Math.max(1, rootTasks.length + subCategories.length + descendantTaskCount),
      id: `cat-${root.id}`,
      node: root,
      subCategories,
      tasks: rootTasks,
      title: root.nodeName,
    };
  });

  if (categories.length) return categories;

  const orphanTasks = tasks.filter((t) => !t.projectNodeId);
  if (!orphanTasks.length) return [];
  return [{
    count: orphanTasks.length,
    id: 'cat-ungrouped',
    node: { id: 0, nodeName: '未分组任务', status: 'NOT_STARTED' },
    subCategories: [],
    tasks: orphanTasks,
    title: '未分组任务',
  }];
}

export function buildTimelineRows(categories: TimelineCategory[]): TimelineRow[] {
  const rows: TimelineRow[] = [];
  categories.forEach((cat) => {
    rows.push({
      categoryId: cat.id,
      count: cat.count,
      endDate: parseDateValue(cat.node.planEndTime) ?? parseDateValue(cat.node.actualEndTime),
      entityId: cat.node.id > 0 ? cat.node.id : undefined,
      entityKind: cat.node.id > 0 ? 'node' : undefined,
      id: cat.id,
      progress: normalizeProgress(cat.node.progressRate),
      rowType: 'category',
      startDate: parseDateValue(cat.node.planStartTime) ?? parseDateValue(cat.node.actualStartTime),
      status: cat.node.status,
      title: cat.title,
    });
    cat.tasks.forEach((task) => {
      rows.push({
        categoryId: cat.id,
        endDate: parseDateValue(task.planEndTime) ?? parseDateValue(task.actualEndTime),
        entityId: task.id,
        entityKind: 'task',
        id: `task-${task.id}`,
        owner: task.responsibleName,
        parentNodeId: cat.node.id > 0 ? cat.node.id : undefined,
        progress: normalizeProgress(task.progressRate),
        rowType: 'item',
        startDate: parseDateValue(task.planStartTime) ?? parseDateValue(task.actualStartTime),
        status: task.status,
        title: task.taskTitle,
      });
    });
    cat.subCategories.forEach((sub) => {
      rows.push({
        categoryId: cat.id,
        count: sub.tasks.length,
        endDate: parseDateValue(sub.node.planEndTime) ?? parseDateValue(sub.node.actualEndTime),
        entityId: sub.node.id,
        entityKind: 'node',
        id: sub.id,
        progress: normalizeProgress(sub.node.progressRate),
        rowType: 'subCategory',
        startDate: parseDateValue(sub.node.planStartTime) ?? parseDateValue(sub.node.actualStartTime),
        status: sub.node.status,
        subCategoryId: sub.id,
        title: sub.title,
      });
      sub.tasks.forEach((task) => {
        rows.push({
          categoryId: cat.id,
          endDate: parseDateValue(task.planEndTime) ?? parseDateValue(task.actualEndTime),
          entityId: task.id,
          entityKind: 'task',
          id: `task-${task.id}`,
          owner: task.responsibleName,
          parentNodeId: sub.node.id,
          progress: normalizeProgress(task.progressRate),
          rowType: 'item',
          startDate: parseDateValue(task.planStartTime) ?? parseDateValue(task.actualStartTime),
          status: task.status,
          subCategoryId: sub.id,
          title: task.taskTitle,
        });
      });
    });
  });
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// 行样式
// ─────────────────────────────────────────────────────────────────────────────

export function getRowHeight(row: TimelineRow): number {
  if (row.rowType === 'category') return CATEGORY_ROW_HEIGHT;
  if (row.rowType === 'subCategory') return SUB_CATEGORY_ROW_HEIGHT;
  return TASK_ROW_HEIGHT;
}

export function getBarPalette(row: TimelineRow) {
  if (row.entityKind === 'node') {
    return {
      badge: 'bg-sky-500/10 text-sky-700',
      border: '#7cb9ff',
      fill: 'rgba(59, 130, 246, 0.12)',
      progress: 'rgba(59, 130, 246, 0.50)',
    };
  }
  if ((row.status ?? '').toUpperCase() === 'COMPLETED') {
    return {
      badge: 'bg-emerald-500/10 text-emerald-700',
      border: '#4fd1a5',
      fill: 'rgba(16, 185, 129, 0.12)',
      progress: 'rgba(16, 185, 129, 0.50)',
    };
  }
  return {
    badge: 'bg-violet-500/10 text-violet-700',
    border: '#9b8cff',
    fill: 'rgba(139, 92, 246, 0.12)',
    progress: 'rgba(139, 92, 246, 0.50)',
  };
}

export function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

// ─────────────────────────────────────────────────────────────────────────────
// 依赖连线计算
// ─────────────────────────────────────────────────────────────────────────────

function calcEndpointX(
  row: TimelineRow,
  type: 'start' | 'end',
  timelineStart: Date,
  dayCount: number,
): number {
  const date = type === 'start' ? row.startDate : row.endDate;
  if (!date) return type === 'start' ? 0 : dayCount * DAY_COLUMN_WIDTH;
  const days = daysBetween(timelineStart, date);
  return type === 'start' ? days * DAY_COLUMN_WIDTH : (days + 1) * DAY_COLUMN_WIDTH;
}

export function calculateDependencyLines(
  dependencies: TaskDependency[],
  rows: TimelineRow[],
  timelineRange: { start: Date },
  timelineDays: Array<unknown>,
): DependencyLine[] {
  const dayCount = timelineDays.length;
  const taskRowMap = new Map<string, TimelineRow>();
  rows.forEach((row) => {
    if (row.entityKind === 'task') taskRowMap.set(`task-${row.entityId}`, row);
  });

  const lines: DependencyLine[] = [];
  for (const dep of dependencies) {
    const pred = taskRowMap.get(`task-${dep.predecessorTaskId}`);
    const succ = taskRowMap.get(`task-${dep.successorTaskId}`);
    if (!pred || !succ) continue;
    if (!pred.startDate && !pred.endDate) continue;
    if (!succ.startDate && !succ.endDate) continue;

    const predIdx = rows.findIndex((r) => r.id === pred.id);
    const succIdx = rows.findIndex((r) => r.id === succ.id);
    if (predIdx === -1 || succIdx === -1) continue;

    let predY = 0, succY = 0;
    for (let i = 0; i < predIdx; i++) predY += getRowHeight(rows[i]!);
    for (let i = 0; i < succIdx; i++) succY += getRowHeight(rows[i]!);
    predY += getRowHeight(pred) / 2;
    succY += getRowHeight(succ) / 2;

    let fromX: number, toX: number;
    let fromType: 'start' | 'end', toType: 'start' | 'end';
    const lag = (dep.lagDays || 0) * DAY_COLUMN_WIDTH;

    switch (dep.dependencyType) {
      case 'FS':
        fromX = calcEndpointX(pred, 'end', timelineRange.start, dayCount);
        toX = calcEndpointX(succ, 'start', timelineRange.start, dayCount) + lag;
        fromType = 'end'; toType = 'start';
        break;
      case 'FF':
        fromX = calcEndpointX(pred, 'end', timelineRange.start, dayCount);
        toX = calcEndpointX(succ, 'end', timelineRange.start, dayCount) + lag;
        fromType = 'end'; toType = 'end';
        break;
      case 'SS':
        fromX = calcEndpointX(pred, 'start', timelineRange.start, dayCount);
        toX = calcEndpointX(succ, 'start', timelineRange.start, dayCount) + lag;
        fromType = 'start'; toType = 'start';
        break;
      case 'SF':
        fromX = calcEndpointX(pred, 'start', timelineRange.start, dayCount);
        toX = calcEndpointX(succ, 'end', timelineRange.start, dayCount) + lag;
        fromType = 'start'; toType = 'end';
        break;
      default:
        continue;
    }

    lines.push({
      id: `dep-${dep.id}`,
      predecessorId: pred.id,
      successorId: succ.id,
      dependencyType: dep.dependencyType,
      from: { x: fromX, y: predY, type: fromType },
      to: { x: toX, y: succY, type: toType },
      lagDays: dep.lagDays || 0,
    });
  }
  return lines;
}

export function generateDependencyPath(from: DependencyEndpoint, to: DependencyEndpoint): string {
  const offsetX = Math.min(Math.abs(to.x - from.x) * 0.5, 40);
  if (from.x > to.x) {
    const midX = from.x + offsetX + 20;
    return `M ${from.x} ${from.y} H ${midX} C ${midX + 10} ${from.y}, ${midX + 10} ${to.y}, ${midX + 20} ${to.y} H ${to.x}`;
  }
  return `M ${from.x} ${from.y} H ${to.x}`;
}
