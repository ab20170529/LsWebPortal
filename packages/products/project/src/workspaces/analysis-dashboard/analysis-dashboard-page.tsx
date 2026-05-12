import { useMemo, type ReactNode } from 'react';

import { Card, cx } from '@lserp/ui';

import { getProjectStatusLabel } from '../../project-display';

type AnalysisProject = {
  businessUnit?: string | null;
  id: number;
  managerName?: string | null;
  planEndTime?: string | null;
  planStartTime?: string | null;
  projectCode: string;
  projectDesc?: string | null;
  projectName: string;
  status?: string | null;
};

type AnalysisStatisticSummary = {
  budgetCount: number;
  completedTaskCount?: number | null;
  inProgressTaskCount?: number | null;
  memberCount: number;
  nodeCount: number;
  taskCount: number;
  totalActualAmount?: number | null;
  totalPlanAmount?: number | null;
};

type AnalysisMember = {
  id: number;
  isManager?: boolean | null;
  roleName?: string | null;
  userId: string;
  userName: string;
};

type AnalysisBudget = {
  actualAmount?: number | null;
  feeItem: string;
  feeType?: string | null;
  id: number;
  planAmount?: number | null;
};

type AnalysisNode = {
  id: number;
  nodeName: string;
  planEndTime?: string | null;
  planStartTime?: string | null;
  progressRate?: number | null;
  status?: string | null;
};

type AnalysisTask = {
  id: number;
  planEndTime?: string | null;
  planStartTime?: string | null;
  progressRate?: number | null;
  responsibleName?: string | null;
  status?: string | null;
  taskTitle: string;
};

type AnalysisPlan = {
  id: number;
  planType: string;
  status?: string | null;
};

type AnalysisReport = {
  delayFlag?: boolean | null;
  id: number;
  reportType: string;
};

type AnalysisAttachment = {
  fileName: string;
  fileSize?: number | null;
  id: number;
  uploadTime?: string | null;
  uploaderName?: string | null;
};

type AnalysisGanttRow = {
  end: Date;
  id: string;
  kind: 'node' | 'task';
  owner?: string | null;
  progress: number;
  start: Date;
  status: string;
  title: string;
};

type AnalysisRange = {
  end: Date;
  start: Date;
};

export type ProjectAnalysisDashboardPageProps = {
  attachments: AnalysisAttachment[];
  budgets: AnalysisBudget[];
  detailError: string | null;
  detailLoading: boolean;
  ganttRange: AnalysisRange | null;
  ganttRows: AnalysisGanttRow[];
  ganttTicks: Date[];
  loading: boolean;
  members: AnalysisMember[];
  nodes: AnalysisNode[];
  plans: AnalysisPlan[];
  reports: AnalysisReport[];
  selectedProject: AnalysisProject | null;
  statistics: AnalysisStatisticSummary | null;
  tasks: AnalysisTask[];
  workspaceError: string | null;
};

function formatAmount(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(Number(value));
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDate(value?: string | Date | null) {
  if (!value) return '--';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatAxisLabel(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
  }).format(value);
}

function normalizeProgress(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

function sumAmount(items: AnalysisBudget[], key: 'actualAmount' | 'planAmount') {
  return items.reduce((total, item) => total + (Number(item[key] ?? 0) || 0), 0);
}

function isCompleted(status?: string | null) {
  const normalized = (status ?? '').toUpperCase();
  return normalized.includes('DONE') || normalized.includes('SUCCESS') || normalized.includes('FINISH') || normalized.includes('COMPLETE') || normalized === 'APPROVED';
}

function isInProgress(status?: string | null) {
  const normalized = (status ?? '').toUpperCase();
  return normalized.includes('RUNNING') || normalized.includes('PROGRESS') || normalized.includes('PROCESS');
}

function isRisk(status?: string | null) {
  const normalized = (status ?? '').toUpperCase();
  return normalized.includes('RISK') || normalized.includes('ERROR') || normalized.includes('STOP') || normalized.includes('REJECTED') || normalized.includes('OVERDUE') || normalized.includes('DELAY');
}

function getStatusPillClass(status?: string | null) {
  if (isCompleted(status)) return 'bg-[#e8fbf5] text-[#12b981]';
  if (isRisk(status)) return 'bg-rose-50 text-rose-600';
  if (isInProgress(status) || (status ?? '').toUpperCase() === 'WAITING' || (status ?? '').toUpperCase() === 'PENDING') return 'bg-[#eaf3ff] text-[#1f7cff]';
  return 'bg-[#f2f6fb] text-[#5e7291]';
}

function StatusPill({ status }: { status?: string | null }) {
  return (
    <span className={cx('inline-flex h-6 items-center rounded-full px-3 text-[13px] font-medium', getStatusPillClass(status))}>
      {getProjectStatusLabel(status ?? 'NOT_STARTED')}
    </span>
  );
}

function ModuleCard({
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
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div>
          <h3 className="text-base font-bold text-[#111c33]">{title}</h3>
          {subtitle ? <div className="mt-1 text-xs font-medium text-[#8da0bd]">{subtitle}</div> : null}
        </div>
        {extra}
      </div>
      {children}
    </Card>
  );
}

function MetricCell({
  label,
  tone = 'default',
  value,
  suffix,
}: {
  label: string;
  suffix?: string;
  tone?: 'blue' | 'default' | 'green' | 'orange' | 'rose';
  value: number | string;
}) {
  return (
    <div className="flex min-h-[86px] flex-col justify-center px-4 py-3">
      <div className="text-[13px] font-medium text-[#6b7f9e]">{label}</div>
      <div
        className={cx(
          'mt-1 text-2xl font-bold leading-8',
          tone === 'blue' ? 'text-[#1f65e8]' : null,
          tone === 'green' ? 'text-[#12b981]' : null,
          tone === 'orange' ? 'text-[#ff8a00]' : null,
          tone === 'rose' ? 'text-rose-600' : null,
          tone === 'default' ? 'text-[#111c33]' : null,
        )}
      >
        {value}
        {suffix ? <span className="ml-1 text-[13px] font-medium text-[#7e91b0]">{suffix}</span> : null}
      </div>
    </div>
  );
}

function OverviewMetrics({
  attachmentCount,
  budgetUsePercent,
  delayCount,
  memberCount,
  nodeCount,
  overallProgress,
  taskCount,
}: {
  attachmentCount: number;
  budgetUsePercent: number;
  delayCount: number;
  memberCount: number;
  nodeCount: number;
  overallProgress: number;
  taskCount: number;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="grid divide-y divide-[#edf2f8] sm:grid-cols-3 sm:divide-x sm:divide-y-0 xl:grid-cols-6">
        <MetricCell label="整体进度" suffix="%" tone="blue" value={Math.round(overallProgress)} />
        <MetricCell label="节点数量" suffix="项" value={nodeCount} />
        <MetricCell label="任务数量" suffix="项" tone="green" value={taskCount} />
        <MetricCell label="项目成员" suffix="人" value={memberCount} />
        <MetricCell label="延期记录" suffix="项" tone={delayCount ? 'rose' : 'default'} value={delayCount} />
        <MetricCell label="预算使用" suffix="%" tone="orange" value={Math.round(budgetUsePercent)} />
      </div>
      <div className="border-t border-[#edf2f8] px-4 py-3 text-[13px] font-medium text-[#6b7f9e]">
        附件资料 {attachmentCount} 项，分析数据来自当前项目详情、计划、汇报与附件。
      </div>
    </Card>
  );
}

function progressBarClass(tone: 'blue' | 'green' | 'orange' | 'rose' | 'slate') {
  if (tone === 'green') return 'bg-[#12b981]';
  if (tone === 'orange') return 'bg-[#ff8a00]';
  if (tone === 'rose') return 'bg-rose-500';
  if (tone === 'slate') return 'bg-[#8da0bd]';
  return 'bg-[#1f7cff]';
}

function BarLine({
  count,
  label,
  max,
  tone = 'blue',
}: {
  count: number;
  label: string;
  max: number;
  tone?: 'blue' | 'green' | 'orange' | 'rose' | 'slate';
}) {
  const width = max > 0 ? Math.max(4, (count / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[84px_minmax(0,1fr)_40px] items-center gap-3 text-[13px] font-medium">
      <div className="truncate text-[#526681]">{label}</div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e9eff8]">
        <div className={cx('h-full rounded-full', progressBarClass(tone))} style={{ width: `${width}%` }} />
      </div>
      <div className="text-right text-[#263653]">{count}</div>
    </div>
  );
}

function buildGanttBarStyle(row: AnalysisGanttRow, range: AnalysisRange) {
  const total = Math.max(1, range.end.getTime() - range.start.getTime());
  const left = ((row.start.getTime() - range.start.getTime()) / total) * 100;
  const width = ((row.end.getTime() - row.start.getTime()) / total) * 100;
  return {
    left: `${Math.max(0, Math.min(96, left))}%`,
    width: `${Math.max(4, Math.min(100, width))}%`,
  };
}

function GanttAnalysisCard({
  rows,
  range,
  ticks,
}: {
  range: AnalysisRange | null;
  rows: AnalysisGanttRow[];
  ticks: Date[];
}) {
  return (
    <ModuleCard
      extra={<span className="inline-flex h-6 items-center rounded-full bg-[#f2f6fb] px-2.5 text-[13px] font-medium text-[#526681]">{rows.length} 项</span>}
      subtitle="展示节点与任务的计划周期、进度和当前状态"
      title="项目进度甘特分析"
    >
      {!range || rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]">暂无可展示的节点或任务时间数据</div>
      ) : (
        <div className="px-4 pb-4">
          <div className="grid min-w-[760px] grid-cols-[240px_minmax(0,1fr)] gap-3 border-t border-[#edf2f8] pt-3">
            <div className="text-[13px] font-medium text-[#6b7f9e]">对象</div>
            <div className="grid text-[13px] font-medium text-[#6b7f9e]" style={{ gridTemplateColumns: `repeat(${Math.max(ticks.length, 2)}, minmax(0, 1fr))` }}>
              {ticks.map((tick) => <span key={tick.toISOString()}>{formatAxisLabel(tick)}</span>)}
            </div>
          </div>
          <div className="mt-2 overflow-auto">
            <div className="min-w-[760px] space-y-2">
              {rows.map((row) => (
                <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-3" key={row.id}>
                  <div className="flex h-10 min-w-0 items-center justify-between gap-2 rounded-md border border-[#edf2f8] bg-[#f8fbff] px-3">
                    <span className="truncate text-[13px] font-medium text-[#263653]">{row.title}</span>
                    <span className={cx('inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium', row.kind === 'node' ? 'bg-[#eaf3ff] text-[#1f65e8]' : 'bg-[#e8fbf5] text-[#12b981]')}>
                      {row.kind === 'node' ? '节点' : '任务'}
                    </span>
                  </div>
                  <div className="relative h-10 overflow-hidden rounded-md border border-[#edf2f8] bg-[#f8fbff]">
                    <div className="absolute inset-y-0 left-0 right-0 bg-[linear-gradient(90deg,#e8eef7_1px,transparent_1px)] bg-[length:12.5%_100%]" />
                    <div
                      className={cx(
                        'absolute top-2 h-6 overflow-hidden rounded-md border px-2',
                        row.kind === 'node' ? 'border-[#9cc8ff] bg-[#eaf3ff]' : isCompleted(row.status) ? 'border-[#8de4c6] bg-[#e8fbf5]' : 'border-[#aed1ff] bg-white',
                      )}
                      style={buildGanttBarStyle(row, range)}
                    >
                      <div className={cx('absolute inset-y-0 left-0 rounded-md', row.kind === 'node' ? 'bg-[#1f7cff]/25' : 'bg-[#12b981]/25')} style={{ width: `${row.progress}%` }} />
                      <span className="relative text-xs font-semibold text-[#263653]">{row.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ModuleCard>
  );
}

function ProgressAnalysisCard({
  completed,
  inProgress,
  notStarted,
  risk,
}: {
  completed: number;
  inProgress: number;
  notStarted: number;
  risk: number;
}) {
  const max = Math.max(completed, inProgress, notStarted, risk, 1);
  return (
    <ModuleCard subtitle="按任务与节点状态聚合" title="进度分布">
      <div className="space-y-3 border-t border-[#edf2f8] px-4 py-4">
        <BarLine count={completed} label="已完成" max={max} tone="green" />
        <BarLine count={inProgress} label="进行中" max={max} tone="blue" />
        <BarLine count={notStarted} label="未开始" max={max} tone="slate" />
        <BarLine count={risk} label="风险项" max={max} tone="rose" />
      </div>
    </ModuleCard>
  );
}

function MemberWorkloadCard({ items }: { items: Array<{ name: string; role?: string | null; taskCount: number }> }) {
  const max = Math.max(...items.map((item) => item.taskCount), 1);
  return (
    <ModuleCard subtitle="按任务负责人统计" title="成员工作量">
      <div className="space-y-3 border-t border-[#edf2f8] px-4 py-4">
        {items.length ? items.map((item) => (
          <div className="grid grid-cols-[72px_minmax(0,1fr)_38px] items-center gap-3 text-[13px] font-medium" key={`${item.name}-${item.role ?? ''}`}>
            <div className="min-w-0">
              <div className="truncate text-[#263653]">{item.name}</div>
              <div className="mt-0.5 truncate text-xs text-[#8da0bd]">{item.role ?? '--'}</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e9eff8]">
              <div className="h-full rounded-full bg-[#1f7cff]" style={{ width: `${Math.max(4, (item.taskCount / max) * 100)}%` }} />
            </div>
            <div className="text-right text-[#526681]">{item.taskCount}</div>
          </div>
        )) : (
          <div className="py-8 text-center text-[13px] font-medium text-[#8da0bd]">暂无成员任务数据</div>
        )}
      </div>
    </ModuleCard>
  );
}

function BudgetAnalysisCard({
  actualAmount,
  budgets,
  planAmount,
}: {
  actualAmount: number;
  budgets: AnalysisBudget[];
  planAmount: number;
}) {
  const percent = planAmount > 0 ? Math.min(100, (actualAmount / planAmount) * 100) : 0;
  return (
    <ModuleCard subtitle="计划金额与实际金额对比" title="费用分析">
      <div className="space-y-4 border-t border-[#edf2f8] px-4 py-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-[13px] font-medium">
            <span className="text-[#526681]">预算使用率</span>
            <span className="text-[#263653]">{formatPercent(percent)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e9eff8]">
            <div className="h-full rounded-full bg-[#ff8a00]" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-[#edf2f8] bg-[#f8fbff] px-3 py-2">
            <div className="text-xs font-medium text-[#8da0bd]">计划金额</div>
            <div className="mt-1 text-[15px] font-bold text-[#263653]">{formatAmount(planAmount)}</div>
          </div>
          <div className="rounded-md border border-[#edf2f8] bg-[#f8fbff] px-3 py-2">
            <div className="text-xs font-medium text-[#8da0bd]">实际金额</div>
            <div className="mt-1 text-[15px] font-bold text-[#263653]">{formatAmount(actualAmount)}</div>
          </div>
        </div>
        <div className="space-y-2">
          {budgets.slice(0, 5).map((budget) => (
            <div className="flex items-center justify-between gap-3 text-[13px] font-medium" key={budget.id}>
              <span className="truncate text-[#526681]">{budget.feeItem}</span>
              <span className="shrink-0 text-[#263653]">{formatAmount(budget.actualAmount)} / {formatAmount(budget.planAmount)}</span>
            </div>
          ))}
          {!budgets.length ? <div className="py-4 text-center text-[13px] font-medium text-[#8da0bd]">暂无费用数据</div> : null}
        </div>
      </div>
    </ModuleCard>
  );
}

function FocusTable({ tasks }: { tasks: AnalysisTask[] }) {
  return (
    <ModuleCard subtitle="优先关注未完成且进度较低的任务" title="任务关注清单">
      <div className="overflow-auto border-t border-[#edf2f8]">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-[#f8fbff]">
            <tr className="text-left text-[13px] font-medium text-[#6b7f9e]">
              <th className="px-4 py-3">任务名称</th>
              <th className="px-4 py-3">负责人</th>
              <th className="px-4 py-3">截止时间</th>
              <th className="px-4 py-3">进度</th>
              <th className="px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length ? tasks.map((task) => (
              <tr className="border-t border-[#edf2f8] bg-white text-[13px] font-medium transition hover:bg-[#f8fbff]" key={task.id}>
                <td className="max-w-[280px] px-4 py-3 text-[#263653]">{task.taskTitle}</td>
                <td className="px-4 py-3 text-[#526681]">{task.responsibleName ?? '--'}</td>
                <td className="px-4 py-3 text-[#526681]">{formatDate(task.planEndTime)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 text-right text-[13px] font-medium text-[#263653]">{normalizeProgress(task.progressRate)}%</span>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e9eff8]">
                      <div className="h-full rounded-full bg-[#1f7cff]" style={{ width: `${normalizeProgress(task.progressRate)}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusPill status={task.status} /></td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={5}>暂无需要关注的任务</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModuleCard>
  );
}

function CollaborationCard({
  attachments,
  delayCount,
  plans,
  reports,
}: {
  attachments: AnalysisAttachment[];
  delayCount: number;
  plans: AnalysisPlan[];
  reports: AnalysisReport[];
}) {
  const monthPlans = plans.filter((plan) => plan.planType === 'MONTH').length;
  const weekPlans = plans.filter((plan) => plan.planType === 'WEEK').length;
  const dayPlans = plans.filter((plan) => plan.planType === 'DAY').length;
  const monthReports = reports.filter((report) => report.reportType === 'MONTH').length;
  const weekReports = reports.filter((report) => report.reportType === 'WEEK').length;
  const dayReports = reports.filter((report) => report.reportType === 'DAY').length;

  return (
    <ModuleCard subtitle="计划、汇报、延期与附件输入" title="协同资料">
      <div className="space-y-4 border-t border-[#edf2f8] px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-[#edf2f8] bg-[#f8fbff] px-3 py-2">
            <div className="text-xs font-medium text-[#8da0bd]">计划</div>
            <div className="mt-1 text-[15px] font-bold text-[#263653]">{plans.length}</div>
            <div className="mt-1 text-xs text-[#7e91b0]">月 {monthPlans} / 周 {weekPlans} / 日 {dayPlans}</div>
          </div>
          <div className="rounded-md border border-[#edf2f8] bg-[#f8fbff] px-3 py-2">
            <div className="text-xs font-medium text-[#8da0bd]">汇报</div>
            <div className="mt-1 text-[15px] font-bold text-[#263653]">{reports.length}</div>
            <div className="mt-1 text-xs text-[#7e91b0]">月 {monthReports} / 周 {weekReports} / 日 {dayReports}</div>
          </div>
          <div className="rounded-md border border-[#edf2f8] bg-[#f8fbff] px-3 py-2">
            <div className="text-xs font-medium text-[#8da0bd]">延期</div>
            <div className="mt-1 text-[15px] font-bold text-rose-600">{delayCount}</div>
          </div>
          <div className="rounded-md border border-[#edf2f8] bg-[#f8fbff] px-3 py-2">
            <div className="text-xs font-medium text-[#8da0bd]">附件</div>
            <div className="mt-1 text-[15px] font-bold text-[#263653]">{attachments.length}</div>
          </div>
        </div>
        <div className="space-y-2">
          {attachments.slice(0, 4).map((attachment) => (
            <div className="flex items-center justify-between gap-3 text-[13px] font-medium" key={attachment.id}>
              <span className="truncate text-[#526681]">{attachment.fileName}</span>
              <span className="shrink-0 text-[#8da0bd]">{attachment.uploaderName ?? '--'}</span>
            </div>
          ))}
          {!attachments.length ? <div className="py-4 text-center text-[13px] font-medium text-[#8da0bd]">暂无附件资料</div> : null}
        </div>
      </div>
    </ModuleCard>
  );
}

export function ProjectAnalysisDashboardPage({
  attachments,
  budgets,
  detailError,
  detailLoading,
  ganttRange,
  ganttRows,
  ganttTicks,
  loading,
  members,
  nodes,
  plans,
  reports,
  selectedProject,
  statistics,
  tasks,
  workspaceError,
}: ProjectAnalysisDashboardPageProps) {
  const budgetPlanAmount = statistics?.totalPlanAmount ?? sumAmount(budgets, 'planAmount');
  const budgetActualAmount = statistics?.totalActualAmount ?? sumAmount(budgets, 'actualAmount');
  const budgetUsePercent = budgetPlanAmount > 0 ? (budgetActualAmount / budgetPlanAmount) * 100 : 0;
  const delayCount = reports.filter((report) => report.delayFlag).length;

  const progressValues = useMemo(
    () => [...nodes.map((node) => normalizeProgress(node.progressRate)), ...tasks.map((task) => normalizeProgress(task.progressRate))],
    [nodes, tasks],
  );
  const overallProgress = progressValues.length ? progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length : 0;

  const statusSummary = useMemo(() => {
    const allItems = [...nodes, ...tasks];
    return allItems.reduce(
      (summary, item) => {
        if (isCompleted(item.status)) summary.completed += 1;
        else if (isRisk(item.status)) summary.risk += 1;
        else if (isInProgress(item.status)) summary.inProgress += 1;
        else summary.notStarted += 1;
        return summary;
      },
      { completed: 0, inProgress: 0, notStarted: 0, risk: 0 },
    );
  }, [nodes, tasks]);

  const memberWorkload = useMemo(() => {
    const taskCountByName = new Map<string, number>();
    tasks.forEach((task) => {
      const name = task.responsibleName?.trim() || '未分配';
      taskCountByName.set(name, (taskCountByName.get(name) ?? 0) + 1);
    });
    const rows = members.map((member) => ({
      name: member.userName,
      role: member.isManager ? '项目负责人' : member.roleName,
      taskCount: taskCountByName.get(member.userName) ?? 0,
    }));
    if (taskCountByName.has('未分配')) {
      rows.push({ name: '未分配', role: '待分配任务', taskCount: taskCountByName.get('未分配') ?? 0 });
    }
    return rows.sort((left, right) => right.taskCount - left.taskCount).slice(0, 6);
  }, [members, tasks]);

  const focusTasks = useMemo(
    () => tasks
      .filter((task) => !isCompleted(task.status))
      .sort((left, right) => normalizeProgress(left.progressRate) - normalizeProgress(right.progressRate))
      .slice(0, 8),
    [tasks],
  );

  if (!selectedProject) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f5f8fc]">
        <Card className="w-full max-w-lg rounded-lg border border-[#e4ebf5] bg-white p-8 text-center shadow-[0_12px_28px_rgba(24,39,75,0.05)]">
          <div className="text-xl font-bold text-[#111c33]">项目分析看板</div>
          <div className="mt-3 text-sm leading-7 text-[#5e7291]">请先在“项目台账”中选择一个项目，再查看当前项目的进度、任务、成员和费用分析。</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f8fc]">
      <div className="shrink-0">
        <div className="flex items-start justify-between gap-4 pb-3">
          <div>
            <div className="text-xl font-bold leading-7 text-[#111c33]">项目分析看板</div>
            <div className="mt-1 text-sm font-medium text-[#5e7291]">进度、任务、成员、费用与协同资料分析</div>
          </div>
          <div className="inline-flex h-8 max-w-[280px] items-center gap-2 rounded-md border border-[#d9e3f1] bg-white px-3 text-sm font-medium text-[#526681] shadow-[0_6px_16px_rgba(24,39,75,0.045)]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#1f7cff]" />
            <span className="truncate">{selectedProject.projectName}</span>
          </div>
        </div>
      </div>

      {detailError ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{detailError}</div> : null}
      {workspaceError ? <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{workspaceError}</div> : null}

      <div className="min-h-0 flex-1 overflow-auto pt-2">
        {detailLoading ? (
          <Card className="rounded-lg border border-[#e4ebf5] bg-white p-5 text-sm text-[#7e91b0] shadow-[0_12px_28px_rgba(24,39,75,0.05)]">正在加载项目分析数据...</Card>
        ) : (
          <div className="space-y-2">
            <ModuleCard
              extra={<StatusPill status={selectedProject.status} />}
              subtitle={`${selectedProject.projectCode} / ${selectedProject.managerName ?? '--'} / ${formatDate(selectedProject.planStartTime)} - ${formatDate(selectedProject.planEndTime)}`}
              title={selectedProject.projectName}
            >
              <div className="border-t border-[#edf2f8] px-4 py-3 text-[13px] font-medium leading-6 text-[#526681]">
                {selectedProject.projectDesc || selectedProject.businessUnit || '暂无项目描述'}
              </div>
            </ModuleCard>

            <OverviewMetrics
              attachmentCount={attachments.length}
              budgetUsePercent={budgetUsePercent}
              delayCount={delayCount}
              memberCount={statistics?.memberCount ?? members.length}
              nodeCount={statistics?.nodeCount ?? nodes.length}
              overallProgress={overallProgress}
              taskCount={statistics?.taskCount ?? tasks.length}
            />

            <GanttAnalysisCard range={ganttRange} rows={ganttRows} ticks={ganttTicks} />

            <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-2">
                <div className="grid gap-2 lg:grid-cols-2">
                  <ProgressAnalysisCard
                    completed={statusSummary.completed}
                    inProgress={statusSummary.inProgress}
                    notStarted={statusSummary.notStarted}
                    risk={statusSummary.risk}
                  />
                  <BudgetAnalysisCard actualAmount={budgetActualAmount} budgets={budgets} planAmount={budgetPlanAmount} />
                </div>
                <FocusTable tasks={focusTasks} />
              </div>

              <div className="space-y-2">
                <MemberWorkloadCard items={memberWorkload} />
                <CollaborationCard attachments={attachments} delayCount={delayCount} plans={plans} reports={reports} />
                {loading ? (
                  <Card className="rounded-lg border border-[#e4ebf5] bg-white p-4 text-[13px] font-medium text-[#7e91b0] shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
                    正在加载计划、汇报与附件数据...
                  </Card>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
