import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';

import { Badge, Button, Card, cx } from '@lserp/ui';

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

// ─── Helpers ────────────────────────────────────────────────────────────────────

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
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

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return '延期申请提交失败，请稍后重试。';
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

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

// ─── Main Component ────────────────────────────────────────────────────────────

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
  const [form, setForm] = useState<DelayFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingReportId !== null) return;
    setForm((current) => ({
      ...current,
      userId: selectedProject?.managerId ?? '',
      userName: selectedProject?.managerName ?? '',
    }));
  }, [editingReportId, selectedProject?.managerId, selectedProject?.managerName]);

  const delayReports = useMemo(() => reports.filter((item) => item.delayFlag), [reports]);

  const targetOptions = useMemo(
    () =>
      form.targetType === 'NODE'
        ? nodes.map((node) => ({
            id: String(node.id),
            label: node.nodeName,
            planEndTime: node.planEndTime ?? null,
            planStartTime: node.planStartTime ?? null,
            status: node.status ?? null,
          }))
        : tasks.map((task) => ({
            id: String(task.id),
            label: task.taskTitle,
            planEndTime: task.planEndTime ?? null,
            planStartTime: task.planStartTime ?? null,
            status: task.status ?? null,
          })),
    [form.targetType, nodes, tasks],
  );

  const selectedTarget = useMemo(() => targetOptions.find((item) => item.id === form.targetId) ?? null, [form.targetId, targetOptions]);

  function resetForm() {
    setEditingReportId(null);
    setForm({
      ...emptyForm,
      userId: selectedProject?.managerId ?? '',
      userName: selectedProject?.managerName ?? '',
    });
  }

  function startEdit(report: DelayApplicationReport) {
    setEditingReportId(report.id);
    setForm({
      coordinationContent: report.coordinationContent ?? '',
      delayReason: report.delayReason ?? '',
      remark: report.remark ?? '',
      reportContent: report.reportContent ?? '',
      reportDate: toDateInput(report.reportDate),
      targetId: report.projectTaskId ? String(report.projectTaskId) : report.projectNodeId ? String(report.projectNodeId) : '',
      targetType: report.projectTaskId ? 'TASK' : 'NODE',
      userId: report.userId ?? selectedProject?.managerId ?? '',
      userName: report.userName ?? selectedProject?.managerName ?? '',
    });
  }

  async function handleSubmit() {
    if (!selectedProject) { pushToast({ message: '请先选择项目。', tone: 'danger' }); return; }
    if (!form.targetId) { pushToast({ message: '请先选择延期对象。', tone: 'danger' }); return; }
    if (!form.userId.trim() || !form.userName.trim()) { pushToast({ message: '请填写申请人信息。', tone: 'danger' }); return; }
    if (!form.delayReason.trim()) { pushToast({ message: '请填写延期原因。', tone: 'danger' }); return; }

    const payload = {
      coordinationContent: form.coordinationContent.trim() || null,
      delayFlag: true,
      delayReason: form.delayReason.trim() || null,
      finishContent: null,
      projectNodeId: form.targetType === 'NODE' ? Number(form.targetId) : null,
      projectTaskId: form.targetType === 'TASK' ? Number(form.targetId) : null,
      remark: form.remark.trim() || null,
      reportContent: form.reportContent.trim() || null,
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
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-lg rounded-3xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900">延期申请</div>
          <div className="mt-3 text-sm leading-7 text-slate-500">
            请先在「项目台账」中选择一个项目，再进入当前页面发起节点或任务延期申请。
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f3f5f9]">

      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[0_8px_20px_-8px_rgba(244,63,94,0.6)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM10 6v4l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900">延期申请</div>
              <div className="mt-0.5 text-sm text-slate-500">统一管理节点与任务的延期申请记录</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            {selectedProject.projectName}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-6 py-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-100 text-rose-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">延期申请</p>
            <p className="text-2xl font-bold text-rose-600 leading-none mt-1">{delayReports.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
              <path d="M2 4h3v3H2zM7 4h3v3H7zM12 4h3v3h-3zM2 9h3v3H2zM7 9h3v3H7zM12 9h3v3h-3zM2 14h3v3H2zM7 14h3v3H7z" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">节点数量</p>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{nodes.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">任务数量</p>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{tasks.length}</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {workspaceError ? (
        <div className="mx-6 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {workspaceError}
        </div>
      ) : null}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6">
        <div className="flex h-full gap-4">

          {/* Left: Application Form */}
          <Card className="w-0 min-w-0 flex-1 overflow-y-auto rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100">
                <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 20 20">
                  <path d="M10 5v6M10 14v1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/>
                  <path d="M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">
                  {editingReportId === null ? '发起延期申请' : '编辑延期申请'}
                </div>
                <div className="text-xs text-slate-400">填写延期信息并提交审核</div>
              </div>
              {editingReportId !== null && (
                <button className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-600" onClick={resetForm} type="button">取消编辑</button>
              )}
            </div>

            <div className="space-y-6">

              {/* Step 1: Target */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">1</div>
                  <span className="text-sm font-bold text-slate-700">选择延期对象</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Field label="对象类型">
                      <select
                        className="field-input"
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => setForm((current) => ({ ...current, targetId: '', targetType: event.target.value as 'NODE' | 'TASK' }))}
                        value={form.targetType}
                      >
                        <option value="TASK">任务</option>
                        <option value="NODE">节点</option>
                      </select>
                    </Field>
                    <Field label="选择对象">
                      <select
                        className="field-input"
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => setForm((current) => ({ ...current, targetId: event.target.value }))}
                        value={form.targetId}
                      >
                        <option value="">请选择</option>
                        {targetOptions.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  {selectedTarget ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">对象信息</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">当前状态</span>
                          <Badge tone="neutral">{getProjectStatusLabel(selectedTarget.status ?? 'NOT_STARTED')}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">计划开始</span>
                          <span className="font-semibold text-slate-700">{formatDateTime(selectedTarget.planStartTime)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">计划结束</span>
                          <span className="font-semibold text-rose-600">{formatDateTime(selectedTarget.planEndTime)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-400">
                      选择延期对象后<br />显示对象当前信息
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Reason */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">2</div>
                  <span className="text-sm font-bold text-slate-700">延期说明</span>
                </div>
                <div className="space-y-3">
                  <Field label="申请日期">
                    <input
                      className="field-input"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, reportDate: event.target.value }))}
                      type="date"
                      value={form.reportDate}
                    />
                  </Field>
                  <Field label="申请人">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="field-input"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, userName: event.target.value }))}
                        placeholder="姓名"
                        value={form.userName}
                      />
                      <input
                        className="field-input"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, userId: event.target.value }))}
                        placeholder="ID"
                        value={form.userId}
                      />
                    </div>
                  </Field>
                  <Field label="延期原因">
                    <textarea
                      className="field-textarea border-rose-200 bg-rose-50"
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((current) => ({ ...current, delayReason: event.target.value }))}
                      placeholder="请详细说明延期原因、对项目的影响以及新的预计完成时间"
                      rows={4}
                      value={form.delayReason}
                    />
                  </Field>
                </div>
              </div>

              {/* Step 3: Details */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-white">3</div>
                  <span className="text-sm font-bold text-slate-700">补充信息（选填）</span>
                </div>
                <div className="space-y-3">
                  <Field label="申请说明">
                    <textarea
                      className="field-textarea"
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((current) => ({ ...current, reportContent: event.target.value }))}
                      placeholder="填写申请背景、涉及工作和调整说明"
                      rows={3}
                      value={form.reportContent}
                    />
                  </Field>
                  <Field label="协调内容">
                    <textarea
                      className="field-textarea"
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((current) => ({ ...current, coordinationContent: event.target.value }))}
                      placeholder="填写需要协同的人员、资源或前置事项"
                      rows={3}
                      value={form.coordinationContent}
                    />
                  </Field>
                  <Field label="补充备注">
                    <textarea
                      className="field-textarea"
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((current) => ({ ...current, remark: event.target.value }))}
                      rows={2}
                      value={form.remark}
                    />
                  </Field>
                </div>
              </div>

              {/* Submit */}
              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-base font-bold text-white shadow-[0_4px_14px_-4px_rgba(244,63,94,0.5)] transition-all hover:shadow-[0_6px_18px_-4px_rgba(244,63,94,0.65)] active:scale-95 disabled:opacity-50"
                disabled={submitting}
                onClick={() => { void handleSubmit(); }}
                type="button"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 20 20">
                      <circle className="opacity-25" cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="3"/>
                    </svg>
                    提交中...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
                      <path d="M10 5v6M10 14v1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/>
                      <path d="M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    {editingReportId === null ? '提交延期申请' : '保存延期申请'}
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Right: Application Records */}
          <Card className="w-[360px] shrink-0 overflow-y-auto rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 20 20">
                  <path d="M4 4h12v12H4z" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 8h6M7 12h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="text-base font-bold text-slate-900">延期申请记录</div>
              <div className="ml-auto rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                {delayReports.length}
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">加载中...</div>
              ) : delayReports.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-slate-400">暂无延期申请记录</div>
                </div>
              ) : (
                delayReports.map((report) => {
                  const relatedNode = report.projectNodeId ? nodes.find((item) => item.id === report.projectNodeId) : null;
                  const relatedTask = report.projectTaskId ? tasks.find((item) => item.id === report.projectTaskId) : null;
                  const targetLabel = relatedTask?.taskTitle ?? relatedNode?.nodeName ?? '未识别对象';
                  const targetTypeLabel = relatedTask ? '任务' : '节点';

                  return (
                    <div
                      key={report.id}
                      className={cx(
                        'group overflow-hidden rounded-2xl border transition-all',
                        editingReportId === report.id
                          ? 'border-sky-300 bg-sky-50'
                          : 'border-slate-200 bg-white hover:border-rose-200 hover:shadow-sm',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="neutral">{targetTypeLabel}</Badge>
                            <Badge tone="danger">延期</Badge>
                          </div>
                          <div className="mt-2 truncate text-sm font-semibold text-slate-900">{targetLabel}</div>
                        </div>
                        <button
                          className={cx(
                            'shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
                            editingReportId === report.id
                              ? 'border-sky-200 bg-sky-100 text-sky-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700',
                          )}
                          onClick={() => startEdit(report)}
                          type="button"
                        >
                          {editingReportId === report.id ? '编辑中' : '编辑'}
                        </button>
                      </div>
                      <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] font-bold text-slate-500">
                            {report.userName.slice(0, 1)}
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{report.userName}</span>
                          <span className="text-xs text-slate-400">{formatDateTime(report.reportDate)}</span>
                        </div>
                        <div className="line-clamp-3 text-xs leading-6 text-slate-600">{report.delayReason ?? report.reportContent ?? '暂无延期原因'}</div>
                        {report.coordinationContent ? (
                          <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                            协调：{report.coordinationContent}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        .field-input {
          display: flex;
          height: 44px;
          width: 100%;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          padding: 0 14px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .field-input:focus {
          border-color: #38bdf8;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
        }
        .field-input::placeholder {
          color: #94a3b8;
        }
        .field-textarea {
          display: flex;
          width: 100%;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          padding: 12px 14px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .field-textarea:focus {
          border-color: #38bdf8;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
        }
        .field-textarea::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
