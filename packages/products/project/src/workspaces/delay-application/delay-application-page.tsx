import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';

import { X } from 'lucide-react';

import { Card, cx } from '@lserp/ui';

import { getProjectStatusLabel } from '../../project-display';
import { useProjectToast } from '../../project-toast';

type DelayApplicationProject = {
  id: number;
  managerId?: string | null;
  managerName?: string | null;
  projectName: string;
  status?: string | null;
};

type DelayApplicationNode = {
  id: number;
  nodeName: string;
  planEndTime?: string | null;
  planStartTime?: string | null;
  status?: string | null;
};

type DelayApplicationTask = {
  id: number;
  planEndTime?: string | null;
  planStartTime?: string | null;
  responsibleName?: string | null;
  status?: string | null;
  taskTitle: string;
};

type DelayApplicationReport = {
  coordinationContent?: string | null;
  delayFlag?: boolean | null;
  delayReason?: string | null;
  id: number;
  projectNodeId?: number | null;
  projectTaskId?: number | null;
  remark?: string | null;
  reportContent?: string | null;
  reportDate?: string | null;
  userId?: string | null;
  userName: string;
};

type DelayApplicationPageProps = {
  loading: boolean;
  nodes: DelayApplicationNode[];
  onCreateReport: (
    projectId: number,
    payload: {
      coordinationContent: string | null;
      delayFlag: boolean | null;
      delayReason: string | null;
      finishContent: string | null;
      projectNodeId: number | null;
      projectTaskId: number | null;
      remark: string | null;
      reportContent: string | null;
      reportDate: string | null;
      reportMonth: string | null;
      reportType: string;
      reportWeek: string | null;
      userId: string;
      userName: string;
    },
  ) => Promise<void>;
  onUpdateReport: (
    projectId: number,
    reportId: number,
    payload: {
      coordinationContent: string | null;
      delayFlag: boolean | null;
      delayReason: string | null;
      finishContent: string | null;
      projectNodeId: number | null;
      projectTaskId: number | null;
      remark: string | null;
      reportContent: string | null;
      reportDate: string | null;
      reportMonth: string | null;
      reportType: string;
      reportWeek: string | null;
      userId: string;
      userName: string;
    },
  ) => Promise<void>;
  reports: DelayApplicationReport[];
  selectedProject: DelayApplicationProject | null;
  tasks: DelayApplicationTask[];
  workspaceError: string | null;
};

type DelayFormState = {
  coordinationContent: string;
  delayReason: string;
  remark: string;
  reportContent: string;
  reportDate: string;
  targetId: string;
  targetType: 'NODE' | 'TASK';
  userId: string;
  userName: string;
};

type DelayTargetOption = {
  id: string;
  label: string;
  ownerName?: string | null;
  planEndTime?: string | null;
  planStartTime?: string | null;
  status?: string | null;
  targetType: DelayFormState['targetType'];
};

type DelayReportRow = {
  report: DelayApplicationReport;
  target: DelayTargetOption | null;
  targetLabel: string;
  targetType: DelayFormState['targetType'];
};

type DelayFormSetter = (value: DelayFormState | ((current: DelayFormState) => DelayFormState)) => void;

const emptyForm: DelayFormState = {
  coordinationContent: '',
  delayReason: '',
  remark: '',
  reportContent: '',
  reportDate: '',
  targetId: '',
  targetType: 'TASK',
  userId: '',
  userName: '',
};

function Field({ children, label, required = false }: { children: ReactNode; label: string; required?: boolean }) {
  return (
    <label className="block space-y-1.5">
      <div className="text-sm font-medium text-[#5e7291]">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </div>
      {children}
    </label>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function getTodayDateInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim() ? error.message : '延期申请提交失败，请稍后重试。';
}

function trimToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildEmptyForm(project: DelayApplicationProject | null): DelayFormState {
  return {
    ...emptyForm,
    reportDate: getTodayDateInput(),
    userId: project?.managerId ?? '',
    userName: project?.managerName ?? '',
  };
}

function getStatusPillClass(status?: string | null) {
  const normalized = (status ?? 'DRAFT').toUpperCase();
  if (normalized === 'COMPLETED') return 'bg-[#e8fbf5] text-[#12b981]';
  if (normalized === 'IN_PROGRESS') return 'bg-[#eaf3ff] text-[#1f7cff]';
  if (normalized === 'PENDING') return 'bg-[#fff4e5] text-[#ff8a00]';
  if (normalized === 'OVERDUE' || normalized === 'DELAYED') return 'bg-rose-50 text-rose-600';
  return 'bg-[#f2f6fb] text-[#5e7291]';
}

function StatusPill({ status }: { status?: string | null }) {
  return (
    <span className={cx('inline-flex h-6 items-center rounded-full px-3 text-[13px] font-medium', getStatusPillClass(status))}>
      {getProjectStatusLabel(status ?? 'DRAFT')}
    </span>
  );
}

function TargetTypePill({ targetType }: { targetType: DelayFormState['targetType'] }) {
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium',
        targetType === 'TASK' ? 'bg-[#eaf3ff] text-[#1f65e8]' : 'bg-[#f2f6fb] text-[#526681]',
      )}
    >
      {targetType === 'TASK' ? '任务' : '节点'}
    </span>
  );
}

function UserCell({ name }: { name?: string | null }) {
  const displayName = name?.trim() || '--';
  const initial = displayName === '--' ? '-' : displayName.slice(0, 1);
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-xs font-bold text-[#1f65e8]">
        {initial}
      </span>
      <span className="truncate text-[13px] font-medium text-[#263653]">{displayName}</span>
    </div>
  );
}

function TableActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-7 min-w-[44px] items-center justify-center rounded px-1.5 text-[13px] font-medium text-[#1f65e8] transition hover:bg-[#eaf3ff] hover:text-[#1557d7] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
      onClick={(event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function OverviewMetric({
  label,
  tone = 'default',
  value,
}: {
  label: string;
  tone?: 'blue' | 'default' | 'rose';
  value: number;
}) {
  return (
    <div className="flex min-h-[82px] flex-col justify-center px-4 py-3">
      <div className="text-[13px] font-medium text-[#6b7f9e]">{label}</div>
      <div
        className={cx(
          'mt-1 text-2xl font-bold leading-8',
          tone === 'rose' ? 'text-rose-600' : tone === 'blue' ? 'text-[#1f65e8]' : 'text-[#111c33]',
        )}
      >
        {value}
        <span className="ml-1 text-[13px] font-medium text-[#7e91b0]">项</span>
      </div>
    </div>
  );
}

function DelayOverview({
  delayCount,
  nodeCount,
  taskCount,
}: {
  delayCount: number;
  nodeCount: number;
  taskCount: number;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="grid divide-y divide-[#edf2f8] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <OverviewMetric label="延期申请" tone="rose" value={delayCount} />
        <OverviewMetric label="节点数量" tone="blue" value={nodeCount} />
        <OverviewMetric label="任务数量" value={taskCount} />
      </div>
    </Card>
  );
}

function DelayRecordTableSection({
  activeReportId,
  items,
  onEdit,
}: {
  activeReportId: number | null;
  items: DelayReportRow[];
  onEdit: (report: DelayApplicationReport) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-[#111c33]">延期申请记录</h3>
          <div className="mt-1 text-xs font-medium text-[#8da0bd]">共 {items.length} 条记录</div>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-[#f8fbff]">
            <tr className="text-left text-[13px] font-medium text-[#6b7f9e]">
              <th className="px-4 py-3">延期对象</th>
              <th className="px-4 py-3">申请人</th>
              <th className="px-4 py-3">申请日期</th>
              <th className="px-4 py-3">当前状态</th>
              <th className="px-4 py-3">延期原因</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map(({ report, target, targetLabel, targetType }) => {
              const selected = report.id === activeReportId;
              return (
                <tr
                  className={cx(
                    'border-t border-[#edf2f8] text-[13px] font-medium transition',
                    selected ? 'bg-[#edf6ff]' : 'bg-white hover:bg-[#f8fbff]',
                  )}
                  key={report.id}
                >
                  <td className="max-w-[260px] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TargetTypePill targetType={targetType} />
                      <span className="truncate font-medium text-[#263653]">{targetLabel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><UserCell name={report.userName} /></td>
                  <td className="px-4 py-3 text-[#526681]">{formatDate(report.reportDate)}</td>
                  <td className="px-4 py-3"><StatusPill status={target?.status} /></td>
                  <td className="max-w-[320px] px-4 py-3 text-[#526681]">
                    <div className="line-clamp-2 leading-6">{report.delayReason || report.reportContent || '--'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <TableActionButton onClick={() => onEdit(report)}>{selected ? '编辑中' : '编辑'}</TableActionButton>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td className="px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={6}>
                  暂无延期申请记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DelayTargetTableSection({
  activeTargetId,
  activeTargetType,
  items,
  onCreate,
}: {
  activeTargetId: string;
  activeTargetType: DelayFormState['targetType'];
  items: DelayTargetOption[];
  onCreate: (target: DelayTargetOption) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-[#111c33]">可申请延期对象</h3>
          <div className="mt-1 text-xs font-medium text-[#8da0bd]">节点与任务共 {items.length} 项</div>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-[#f8fbff]">
            <tr className="text-left text-[13px] font-medium text-[#6b7f9e]">
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">负责人</th>
              <th className="px-4 py-3">计划开始</th>
              <th className="px-4 py-3">计划结束</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((item) => {
              const selected = item.id === activeTargetId && item.targetType === activeTargetType;
              return (
                <tr
                  className={cx(
                    'border-t border-[#edf2f8] text-[13px] font-medium transition',
                    selected ? 'bg-[#edf6ff]' : 'bg-white hover:bg-[#f8fbff]',
                  )}
                  key={`${item.targetType}-${item.id}`}
                >
                  <td className="px-4 py-3"><TargetTypePill targetType={item.targetType} /></td>
                  <td className="max-w-[280px] px-4 py-3 font-medium text-[#263653]">{item.label}</td>
                  <td className="px-4 py-3"><UserCell name={item.ownerName} /></td>
                  <td className="px-4 py-3 text-[#526681]">{formatDateTime(item.planStartTime)}</td>
                  <td className="px-4 py-3 text-[#526681]">{formatDateTime(item.planEndTime)}</td>
                  <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <TableActionButton onClick={() => onCreate(item)}>{selected ? '已选择' : '申请延期'}</TableActionButton>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td className="px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={7}>
                  暂无节点或任务数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DelayFormAside({
  editingReportId,
  form,
  onCancel,
  onChange,
  onSubmit,
  selectedTarget,
  submitting,
  targetOptions,
}: {
  editingReportId: number | null;
  form: DelayFormState;
  onCancel: () => void;
  onChange: DelayFormSetter;
  onSubmit: () => void;
  selectedTarget: DelayTargetOption | null;
  submitting: boolean;
  targetOptions: DelayTargetOption[];
}) {
  return (
    <Card className="sticky top-0 min-h-[calc(100vh-128px)] overflow-hidden rounded-none border-0 border-l border-[#e4ebf5] bg-white p-0 shadow-[-14px_0_30px_rgba(24,39,75,0.055)]">
      <div className="flex h-full max-h-[calc(100vh-128px)] flex-col">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#edf2f8] px-5 py-4">
          <div>
            <div className="text-base font-bold text-[#111c33]">{editingReportId === null ? '新增延期申请' : '编辑延期申请'}</div>
            <div className="mt-1 text-xs font-medium text-[#8da0bd]">维护延期对象、原因与协同说明</div>
          </div>
          <button
            aria-label="关闭延期申请表单"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#7e91b0] transition hover:bg-[#f2f6fb] hover:text-[#263653] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
            onClick={onCancel}
            type="button"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event: { preventDefault: () => void }) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-auto px-5 py-4">
            <Field label="对象类型" required>
              <select
                className="field-input"
                onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange((current) => ({ ...current, targetId: '', targetType: event.target.value as DelayFormState['targetType'] }))}
                value={form.targetType}
              >
                <option value="TASK">任务</option>
                <option value="NODE">节点</option>
              </select>
            </Field>

            <Field label="延期对象" required>
              <select
                className="field-input"
                onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange((current) => ({ ...current, targetId: event.target.value }))}
                value={form.targetId}
              >
                <option value="">请选择延期对象</option>
                {targetOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </Field>

            <div className="rounded-md border border-[#e4ebf5] bg-[#f8fbff] p-3">
              <div className="mb-2 text-xs font-medium text-[#8da0bd]">当前对象</div>
              {selectedTarget ? (
                <div className="space-y-2 text-[13px] font-medium">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#6b7f9e]">对象名称</span>
                    <span className="truncate text-[#263653]">{selectedTarget.label}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#6b7f9e]">计划开始</span>
                    <span className="text-[#526681]">{formatDateTime(selectedTarget.planStartTime)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#6b7f9e]">计划结束</span>
                    <span className="text-[#526681]">{formatDateTime(selectedTarget.planEndTime)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#6b7f9e]">当前状态</span>
                    <StatusPill status={selectedTarget.status} />
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[13px] font-medium text-[#8da0bd]">请选择延期对象</div>
              )}
            </div>

            <Field label="申请日期" required>
              <input
                className="field-input"
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange((current) => ({ ...current, reportDate: event.target.value }))}
                type="date"
                value={form.reportDate}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="申请人" required>
                <input
                  className="field-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onChange((current) => ({ ...current, userName: event.target.value }))}
                  placeholder="请输入申请人"
                  value={form.userName}
                />
              </Field>
              <Field label="申请人ID" required>
                <input
                  className="field-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onChange((current) => ({ ...current, userId: event.target.value }))}
                  placeholder="请输入申请人ID"
                  value={form.userId}
                />
              </Field>
            </div>

            <Field label="延期原因" required>
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange((current) => ({ ...current, delayReason: event.target.value }))}
                placeholder="请说明延期原因、影响范围及预计调整方式"
                rows={4}
                value={form.delayReason}
              />
            </Field>

            <Field label="申请说明">
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange((current) => ({ ...current, reportContent: event.target.value }))}
                placeholder="填写申请背景、涉及工作或调整说明"
                rows={3}
                value={form.reportContent}
              />
            </Field>

            <Field label="协调内容">
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange((current) => ({ ...current, coordinationContent: event.target.value }))}
                placeholder="填写需要协同的人员、资源或前置事项"
                rows={3}
                value={form.coordinationContent}
              />
            </Field>

            <Field label="备注">
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange((current) => ({ ...current, remark: event.target.value }))}
                placeholder="请输入备注（选填）"
                rows={3}
                value={form.remark}
              />
            </Field>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#edf2f8] bg-white px-5 py-4">
            <button
              className="inline-flex h-9 min-w-[76px] items-center justify-center rounded-md border border-[#d9e3f1] bg-white px-4 text-sm font-semibold text-[#526681] transition hover:bg-[#f8fbff] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
            <button
              className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-md bg-[#1f7cff] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.22)] transition hover:bg-[#176df0] focus:outline-none focus:ring-2 focus:ring-[#dceaff] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? '提交中...' : editingReportId === null ? '提交申请' : '保存申请'}
            </button>
          </div>
        </form>
      </div>
    </Card>
  );
}

export function ProjectDelayApplicationPage({
  loading,
  nodes,
  onCreateReport,
  onUpdateReport,
  reports,
  selectedProject,
  tasks,
  workspaceError,
}: DelayApplicationPageProps) {
  const { pushToast } = useProjectToast();
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [form, setForm] = useState<DelayFormState>(() => buildEmptyForm(selectedProject));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingReportId !== null) return;
    setForm((current) => ({
      ...current,
      reportDate: current.reportDate || getTodayDateInput(),
      userId: selectedProject?.managerId ?? '',
      userName: selectedProject?.managerName ?? '',
    }));
  }, [editingReportId, selectedProject?.managerId, selectedProject?.managerName]);

  const targetRows = useMemo<DelayTargetOption[]>(
    () => [
      ...nodes.map((node) => ({
        id: String(node.id),
        label: node.nodeName,
        ownerName: selectedProject?.managerName ?? null,
        planEndTime: node.planEndTime ?? null,
        planStartTime: node.planStartTime ?? null,
        status: node.status ?? null,
        targetType: 'NODE' as const,
      })),
      ...tasks.map((task) => ({
        id: String(task.id),
        label: task.taskTitle,
        ownerName: task.responsibleName ?? selectedProject?.managerName ?? null,
        planEndTime: task.planEndTime ?? null,
        planStartTime: task.planStartTime ?? null,
        status: task.status ?? null,
        targetType: 'TASK' as const,
      })),
    ],
    [nodes, selectedProject?.managerName, tasks],
  );

  const delayReports = useMemo(() => reports.filter((item) => item.delayFlag), [reports]);

  const targetOptions = useMemo(
    () => targetRows.filter((item) => item.targetType === form.targetType),
    [form.targetType, targetRows],
  );

  const selectedTarget = useMemo(
    () => targetOptions.find((item) => item.id === form.targetId) ?? null,
    [form.targetId, targetOptions],
  );

  const delayReportRows = useMemo<DelayReportRow[]>(
    () => delayReports.map((report) => {
      const targetType: DelayFormState['targetType'] = report.projectTaskId ? 'TASK' : 'NODE';
      const targetId = report.projectTaskId ?? report.projectNodeId ?? null;
      const target = targetId === null
        ? null
        : targetRows.find((item) => item.targetType === targetType && item.id === String(targetId)) ?? null;
      return {
        report,
        target,
        targetLabel: target?.label ?? '未识别对象',
        targetType,
      };
    }),
    [delayReports, targetRows],
  );

  function resetForm() {
    setEditingReportId(null);
    setForm(buildEmptyForm(selectedProject));
  }

  function beginCreateForTarget(target: DelayTargetOption) {
    setEditingReportId(null);
    setForm((current) => ({
      ...buildEmptyForm(selectedProject),
      reportDate: current.reportDate || getTodayDateInput(),
      targetId: target.id,
      targetType: target.targetType,
      userId: current.userId || selectedProject?.managerId || '',
      userName: current.userName || selectedProject?.managerName || '',
    }));
  }

  function startEdit(report: DelayApplicationReport) {
    setEditingReportId(report.id);
    setForm({
      coordinationContent: report.coordinationContent ?? '',
      delayReason: report.delayReason ?? '',
      remark: report.remark ?? '',
      reportContent: report.reportContent ?? '',
      reportDate: toDateInput(report.reportDate) || getTodayDateInput(),
      targetId: report.projectTaskId ? String(report.projectTaskId) : report.projectNodeId ? String(report.projectNodeId) : '',
      targetType: report.projectTaskId ? 'TASK' : 'NODE',
      userId: report.userId ?? selectedProject?.managerId ?? '',
      userName: report.userName ?? selectedProject?.managerName ?? '',
    });
  }

  async function handleSubmit() {
    if (!selectedProject) {
      pushToast({ message: '请先选择项目。', tone: 'danger' });
      return;
    }
    if (!form.targetId) {
      pushToast({ message: '请先选择延期对象。', tone: 'danger' });
      return;
    }
    if (!form.userId.trim() || !form.userName.trim()) {
      pushToast({ message: '请填写申请人信息。', tone: 'danger' });
      return;
    }
    if (!form.delayReason.trim()) {
      pushToast({ message: '请填写延期原因。', tone: 'danger' });
      return;
    }

    const payload = {
      coordinationContent: trimToNull(form.coordinationContent),
      delayFlag: true,
      delayReason: trimToNull(form.delayReason),
      finishContent: null,
      projectNodeId: form.targetType === 'NODE' ? Number(form.targetId) : null,
      projectTaskId: form.targetType === 'TASK' ? Number(form.targetId) : null,
      remark: trimToNull(form.remark),
      reportContent: trimToNull(form.reportContent),
      reportDate: form.reportDate || null,
      reportMonth: null,
      reportType: 'DELAY',
      reportWeek: null,
      userId: form.userId.trim(),
      userName: form.userName.trim(),
    };

    setSubmitting(true);
    try {
      if (editingReportId === null) {
        await onCreateReport(selectedProject.id, payload);
        pushToast({ message: '延期申请已提交。', tone: 'success' });
      } else {
        await onUpdateReport(selectedProject.id, editingReportId, payload);
        pushToast({ message: '延期申请已更新。', tone: 'success' });
      }
      resetForm();
    } catch (error) {
      pushToast({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectedProject) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f5f8fc]">
        <Card className="w-full max-w-lg rounded-lg border border-[#e4ebf5] bg-white p-8 text-center shadow-[0_12px_28px_rgba(24,39,75,0.05)]">
          <div className="text-xl font-bold text-[#111c33]">延期申请</div>
          <div className="mt-3 text-sm leading-7 text-[#5e7291]">
            请先在“项目台账”中选择一个项目，再进入当前页面发起节点或任务延期申请。
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f8fc]">
      <div className="shrink-0">
        <div className="flex items-start justify-between gap-4 pb-3">
          <div>
            <div className="text-xl font-bold leading-7 text-[#111c33]">延期申请</div>
            <div className="mt-1 text-sm font-medium text-[#5e7291]">节点、任务延期申请与协同说明</div>
          </div>
          <div className="inline-flex h-8 max-w-[280px] items-center gap-2 rounded-md border border-[#d9e3f1] bg-white px-3 text-sm font-medium text-[#526681] shadow-[0_6px_16px_rgba(24,39,75,0.045)]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#1f7cff]" />
            <span className="truncate">{selectedProject.projectName}</span>
          </div>
        </div>
      </div>

      {workspaceError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{workspaceError}</div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto pt-2">
        <div className="grid min-h-full gap-2 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-2">
            <DelayOverview delayCount={delayReports.length} nodeCount={nodes.length} taskCount={tasks.length} />

            {loading ? (
              <Card className="rounded-lg border border-[#e4ebf5] bg-white p-5 text-sm text-[#7e91b0] shadow-[0_12px_28px_rgba(24,39,75,0.05)]">
                加载中...
              </Card>
            ) : (
              <>
                <DelayRecordTableSection
                  activeReportId={editingReportId}
                  items={delayReportRows}
                  onEdit={startEdit}
                />
                <DelayTargetTableSection
                  activeTargetId={form.targetId}
                  activeTargetType={form.targetType}
                  items={targetRows}
                  onCreate={beginCreateForTarget}
                />
              </>
            )}
          </div>

          <DelayFormAside
            editingReportId={editingReportId}
            form={form}
            onCancel={resetForm}
            onChange={setForm}
            onSubmit={() => { void handleSubmit(); }}
            selectedTarget={selectedTarget}
            submitting={submitting}
            targetOptions={targetOptions}
          />
        </div>
      </div>

      <style>{`
        .field-input {
          display: flex;
          height: 36px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d9e3f1;
          background: #fff;
          padding: 0 12px;
          font-size: 14px;
          color: #263653;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .field-input:focus {
          border-color: #1f7cff;
          box-shadow: 0 0 0 2px #dceaff;
        }
        .field-input:disabled {
          background: #f6f9fd;
          color: #7e91b0;
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
          font-size: 14px;
          line-height: 24px;
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
    </div>
  );
}
