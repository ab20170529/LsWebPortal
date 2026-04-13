import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';

import { Badge, Button, Card, cx } from '@lserp/ui';

import {
  getCheckinResultLabel,
  getFileCategoryLabel,
  getProjectStatusLabel,
} from '../../project-display';
import { useProjectToast } from '../../project-toast';
import type {
  PlanLogPageProps,
  PlanLogPlan,
  PlanLogReport,
} from './plan-log-types';
import {
  formatDateTime,
  formatPlanType,
  formatReportType,
  groupPlans,
  groupReports,
} from './plan-log-utils';

// ─── Types ──────────────────────────────────────────────────────────────────────

type PlanFormState = {
  managerId: string;
  managerName: string;
  planContent: string;
  planEndDate: string;
  planMonth: string;
  planPeriod: string;
  planStartDate: string;
  planType: string;
  planWeek: string;
  status: string;
};

type ReportFormState = {
  delayFlag: boolean;
  delayReason: string;
  finishContent: string;
  remark: string;
  reportContent: string;
  reportDate: string;
  reportMonth: string;
  reportType: string;
  reportWeek: string;
  userId: string;
  userName: string;
};

type Tab = 'plan' | 'report' | 'attachments';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function toDateInput(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return '操作失败，请稍后重试。';
}

function buildPlanForm(plan: PlanLogPlan | null, selectedProject: PlanLogPageProps['selectedProject']): PlanFormState {
  return {
    managerId: plan?.managerId ?? selectedProject?.managerId ?? '',
    managerName: plan?.managerName ?? selectedProject?.managerName ?? '',
    planContent: plan?.planContent ?? '',
    planEndDate: toDateInput(plan?.planEndDate),
    planMonth: plan?.planMonth ?? '',
    planPeriod: plan?.planPeriod ?? '',
    planStartDate: toDateInput(plan?.planStartDate),
    planType: plan?.planType ?? 'MONTH',
    planWeek: plan?.planWeek ?? '',
    status: plan?.status ?? 'DRAFT',
  };
}

function buildReportForm(report: PlanLogReport | null, selectedProject: PlanLogPageProps['selectedProject']): ReportFormState {
  return {
    delayFlag: report?.delayFlag ?? false,
    delayReason: report?.delayReason ?? '',
    finishContent: report?.finishContent ?? '',
    remark: report?.remark ?? '',
    reportContent: report?.reportContent ?? '',
    reportDate: toDateInput(report?.reportDate),
    reportMonth: report?.reportMonth ?? '',
    reportType: report?.reportType ?? 'DAY',
    reportWeek: report?.reportWeek ?? '',
    userId: report?.userId ?? selectedProject?.managerId ?? '',
    userName: report?.userName ?? selectedProject?.managerName ?? '',
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      {children}
    </label>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className={cx(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-b-2',
        active
          ? 'border-blue-600 text-blue-600 bg-blue-50/50'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function RecordCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Card className="rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span className="text-sm font-bold text-slate-700">{title}</span>
      </div>
      {children}
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ProjectPlanLogPage({
  attachments,
  checkIns,
  loading,
  onCreatePlan,
  onCreateReport,
  onUpdatePlan,
  onUpdateReport,
  reports,
  selectedProject,
  workspaceError,
  plans,
}: PlanLogPageProps) {
  const { pushToast } = useProjectToast();
  const planGroups = groupPlans(plans);
  const reportGroups = groupReports(reports);
  const [tab, setTab] = useState<Tab>('plan');
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormState>(buildPlanForm(null, selectedProject));
  const [reportForm, setReportForm] = useState<ReportFormState>(buildReportForm(null, selectedProject));

  useEffect(() => {
    if (editingPlanId === null) setPlanForm(buildPlanForm(null, selectedProject));
    if (editingReportId === null) setReportForm(buildReportForm(null, selectedProject));
  }, [editingPlanId, editingReportId, selectedProject]);

  async function handlePlanSubmit() {
    if (!selectedProject) { pushToast({ message: '请先选择项目。', tone: 'danger' }); return; }
    if (!planForm.planContent.trim()) { pushToast({ message: '请先填写计划内容。', tone: 'danger' }); return; }

    const payload = {
      managerId: planForm.managerId.trim() || null,
      managerName: planForm.managerName.trim() || null,
      planContent: planForm.planContent.trim() || null,
      planEndDate: planForm.planEndDate || null,
      planMonth: planForm.planMonth.trim() || null,
      planPeriod: planForm.planPeriod.trim() || null,
      planStartDate: planForm.planStartDate || null,
      planType: planForm.planType,
      planWeek: planForm.planWeek.trim() || null,
      status: planForm.status.trim() || null,
    };

    setPlanSubmitting(true);
    try {
      if (editingPlanId === null) {
        await onCreatePlan(selectedProject.id, payload);
        pushToast({ message: '计划已创建。', tone: 'success' });
      } else {
        await onUpdatePlan(selectedProject.id, editingPlanId, payload);
        pushToast({ message: '计划已更新。', tone: 'success' });
      }
      setEditingPlanId(null);
      setPlanForm(buildPlanForm(null, selectedProject));
    } catch (error) {
      pushToast({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setPlanSubmitting(false);
    }
  }

  async function handleReportSubmit() {
    if (!selectedProject) { pushToast({ message: '请先选择项目。', tone: 'danger' }); return; }
    if (!reportForm.userId.trim() || !reportForm.userName.trim()) { pushToast({ message: '请填写填报人信息。', tone: 'danger' }); return; }
    if (!reportForm.reportContent.trim() && !reportForm.finishContent.trim()) { pushToast({ message: '请至少填写日志内容或完成说明。', tone: 'danger' }); return; }

    const payload = {
      coordinationContent: null,
      delayFlag: reportForm.delayFlag,
      delayReason: reportForm.delayReason.trim() || null,
      finishContent: reportForm.finishContent.trim() || null,
      projectNodeId: null,
      projectTaskId: null,
      remark: reportForm.remark.trim() || null,
      reportContent: reportForm.reportContent.trim() || null,
      reportDate: reportForm.reportDate || null,
      reportMonth: reportForm.reportMonth.trim() || null,
      reportType: reportForm.reportType,
      reportWeek: reportForm.reportWeek.trim() || null,
      userId: reportForm.userId.trim(),
      userName: reportForm.userName.trim(),
    };

    setReportSubmitting(true);
    try {
      if (editingReportId === null) {
        await onCreateReport(selectedProject.id, payload);
        pushToast({ message: '日志/总结已提交。', tone: 'success' });
      } else {
        await onUpdateReport(selectedProject.id, editingReportId, payload);
        pushToast({ message: '日志/总结已更新。', tone: 'success' });
      }
      setEditingReportId(null);
      setReportForm(buildReportForm(null, selectedProject));
    } catch (error) {
      pushToast({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setReportSubmitting(false);
    }
  }

  if (!selectedProject) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-lg rounded-3xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900">计划与日志</div>
          <div className="mt-3 text-sm leading-7 text-slate-500">
            请先在「项目台账」中选择一个项目，再进入当前页面维护计划、日志与总结。
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_8px_20px_-8px_rgba(249,115,22,0.6)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
                <path d="M6 2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900">计划与日志</div>
              <div className="mt-0.5 text-sm text-slate-500">月/周/日计划、日志录入与总结汇报</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            {selectedProject.projectName}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-6 pb-0">
        <TabButton
          active={tab === 'plan'}
          label="计划填报"
          onClick={() => setTab('plan')}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
            </svg>
          }
        />
        <TabButton
          active={tab === 'report'}
          label="日志 / 总结"
          onClick={() => setTab('report')}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20">
              <path d="M4 6h12M4 10h8M4 14h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6"/>
            </svg>
          }
        />
        <TabButton
          active={tab === 'attachments'}
          label={`打卡与附件 (${checkIns.length + attachments.length})`}
          onClick={() => setTab('attachments')}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20">
              <path d="M10.5 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0V2.5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5.5 7a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0ZM5.5 7v8M14.5 7v8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
            </svg>
          }
        />
      </div>

      {/* Error Banner */}
      {workspaceError ? (
        <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {workspaceError}
        </div>
      ) : null}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-6">

        {/* ── Plan Tab ── */}
        {tab === 'plan' && (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            {/* Plan Records */}
            <div className="space-y-4">
              {loading ? (
                <Card className="flex items-center justify-center rounded-2xl py-16 text-sm text-slate-400">加载中...</Card>
              ) : (
                <>
                  <RecordCard title={`月计划 (${planGroups.month.length})`}>
                    {planGroups.month.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-400">暂无月计划记录</div>
                    ) : planGroups.month.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800">{item.planContent}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>{item.managerName ?? '--'}</span>
                            <span>·</span>
                            <span>{toDateInput(item.planStartDate)} - {toDateInput(item.planEndDate)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone="neutral">{getProjectStatusLabel(item.status ?? 'DRAFT')}</Badge>
                          <button className="text-xs font-semibold text-sky-600 hover:text-sky-800" onClick={() => { setEditingPlanId(item.id); setPlanForm(buildPlanForm(item, selectedProject)); }} type="button">编辑</button>
                        </div>
                      </div>
                    ))}
                  </RecordCard>
                  <RecordCard title={`周计划 (${planGroups.week.length})`}>
                    {planGroups.week.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-400">暂无周计划记录</div>
                    ) : planGroups.week.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800">{item.planContent}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>{item.managerName ?? '--'}</span>
                            <span>·</span>
                            <span>{item.planPeriod || item.planWeek || ''}</span>
                            <span>·</span>
                            <span>{toDateInput(item.planStartDate)} - {toDateInput(item.planEndDate)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone="neutral">{getProjectStatusLabel(item.status ?? 'DRAFT')}</Badge>
                          <button className="text-xs font-semibold text-sky-600 hover:text-sky-800" onClick={() => { setEditingPlanId(item.id); setPlanForm(buildPlanForm(item, selectedProject)); }} type="button">编辑</button>
                        </div>
                      </div>
                    ))}
                  </RecordCard>
                  <RecordCard title={`日计划 (${planGroups.day.length})`}>
                    {planGroups.day.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-400">暂无日计划记录</div>
                    ) : planGroups.day.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800">{item.planContent}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span>{item.managerName ?? '--'}</span>
                            <span>·</span>
                            <span>{toDateInput(item.planStartDate)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone="neutral">{getProjectStatusLabel(item.status ?? 'DRAFT')}</Badge>
                          <button className="text-xs font-semibold text-sky-600 hover:text-sky-800" onClick={() => { setEditingPlanId(item.id); setPlanForm(buildPlanForm(item, selectedProject)); }} type="button">编辑</button>
                        </div>
                      </div>
                    ))}
                  </RecordCard>
                </>
              )}
            </div>

            {/* Plan Form */}
            <Card className="rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
                <span className="text-sm font-bold text-slate-700">
                  {editingPlanId === null ? '新增计划' : '编辑计划'}
                </span>
                {editingPlanId !== null && (
                  <button className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-600" onClick={() => { setEditingPlanId(null); setPlanForm(buildPlanForm(null, selectedProject)); }} type="button">取消</button>
                )}
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="计划类型">
                    <select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanForm((c) => ({ ...c, planType: event.target.value }))} value={planForm.planType}>
                      <option value="MONTH">月计划</option>
                      <option value="WEEK">周计划</option>
                      <option value="DAY">日计划</option>
                    </select>
                  </Field>
                  <Field label="计划状态">
                    <select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanForm((c) => ({ ...c, status: event.target.value }))} value={planForm.status}>
                      <option value="DRAFT">草稿</option>
                      <option value="PENDING">待执行</option>
                      <option value="IN_PROGRESS">进行中</option>
                      <option value="COMPLETED">已完成</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="开始日期">
                    <input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((c) => ({ ...c, planStartDate: event.target.value }))} type="date" value={planForm.planStartDate} />
                  </Field>
                  <Field label="结束日期">
                    <input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((c) => ({ ...c, planEndDate: event.target.value }))} type="date" value={planForm.planEndDate} />
                  </Field>
                </div>
                <Field label="计划月份">
                  <input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((c) => ({ ...c, planMonth: event.target.value }))} placeholder="例如 2026-04" value={planForm.planMonth} />
                </Field>
                <Field label="计划周期说明">
                  <input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((c) => ({ ...c, planPeriod: event.target.value }))} placeholder="例如 4月第2周" value={planForm.planPeriod} />
                </Field>
                <Field label="计划内容">
                  <textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setPlanForm((c) => ({ ...c, planContent: event.target.value }))} placeholder="填写本阶段目标、安排和重点工作" rows={4} value={planForm.planContent} />
                </Field>
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)] transition-all hover:shadow-[0_6px_18px_-4px_rgba(37,99,235,0.65)] active:scale-95 disabled:opacity-50"
                  disabled={planSubmitting}
                  onClick={() => { void handlePlanSubmit(); }}
                  type="button"
                >
                  {planSubmitting ? '保存中...' : editingPlanId === null ? '新增计划' : '保存计划'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ── Report Tab ── */}
        {tab === 'report' && (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            {/* Report Records */}
            <div className="space-y-4">
              {loading ? (
                <Card className="flex items-center justify-center rounded-2xl py-16 text-sm text-slate-400">加载中...</Card>
              ) : (
                <>
                  <RecordCard title={`月总结 (${reportGroups.month.length})`}>
                    {reportGroups.month.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-400">暂无月总结</div>
                    ) : reportGroups.month.map((item) => (
                      <div key={item.id} className="border-b border-slate-100 py-3 last:border-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600 flex items-center justify-center">{item.userName.slice(0, 1)}</div>
                            <span className="text-sm font-semibold text-slate-800">{item.userName}</span>
                            <span className="text-xs text-slate-400">{formatDateTime(item.reportDate)}</span>
                          </div>
                          <button className="text-xs font-semibold text-sky-600 hover:text-sky-800" onClick={() => { setEditingReportId(item.id); setReportForm(buildReportForm(item, selectedProject)); }} type="button">编辑</button>
                        </div>
                        <div className="mt-2 pl-8 text-sm text-slate-600">{item.reportContent || item.finishContent || '暂无内容'}</div>
                        {item.delayFlag && (
                          <div className="mt-2 ml-8 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">延期：{item.delayReason}</div>
                        )}
                      </div>
                    ))}
                  </RecordCard>
                  <RecordCard title={`周总结 (${reportGroups.week.length})`}>
                    {reportGroups.week.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-400">暂无周总结</div>
                    ) : reportGroups.week.map((item) => (
                      <div key={item.id} className="border-b border-slate-100 py-3 last:border-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600 flex items-center justify-center">{item.userName.slice(0, 1)}</div>
                            <span className="text-sm font-semibold text-slate-800">{item.userName}</span>
                            <span className="text-xs text-slate-400">{formatDateTime(item.reportDate)}</span>
                          </div>
                          <button className="text-xs font-semibold text-sky-600 hover:text-sky-800" onClick={() => { setEditingReportId(item.id); setReportForm(buildReportForm(item, selectedProject)); }} type="button">编辑</button>
                        </div>
                        <div className="mt-2 pl-8 text-sm text-slate-600">{item.reportContent || item.finishContent || '暂无内容'}</div>
                        {item.delayFlag && (
                          <div className="mt-2 ml-8 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">延期：{item.delayReason}</div>
                        )}
                      </div>
                    ))}
                  </RecordCard>
                  <RecordCard title={`日志 (${reportGroups.day.length})`}>
                    {reportGroups.day.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-400">暂无日志记录</div>
                    ) : reportGroups.day.slice(0, 10).map((item) => (
                      <div key={item.id} className="border-b border-slate-100 py-3 last:border-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600 flex items-center justify-center">{item.userName.slice(0, 1)}</div>
                            <span className="text-sm font-semibold text-slate-800">{item.userName}</span>
                            <span className="text-xs text-slate-400">{formatDateTime(item.reportDate)}</span>
                          </div>
                          <button className="text-xs font-semibold text-sky-600 hover:text-sky-800" onClick={() => { setEditingReportId(item.id); setReportForm(buildReportForm(item, selectedProject)); }} type="button">编辑</button>
                        </div>
                        <div className="mt-2 pl-8 text-sm text-slate-600">{item.reportContent || item.finishContent || '暂无内容'}</div>
                        {item.delayFlag && (
                          <div className="mt-2 ml-8 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">延期：{item.delayReason}</div>
                        )}
                      </div>
                    ))}
                  </RecordCard>
                </>
              )}
            </div>

            {/* Report Form */}
            <Card className="rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-700">
                  {editingReportId === null ? '新增日志 / 总结' : '编辑日志 / 总结'}
                </span>
                {editingReportId !== null && (
                  <button className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-600" onClick={() => { setEditingReportId(null); setReportForm(buildReportForm(null, selectedProject)); }} type="button">取消</button>
                )}
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="日志类型">
                    <select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setReportForm((c) => ({ ...c, reportType: event.target.value }))} value={reportForm.reportType}>
                      <option value="DAY">日志</option>
                      <option value="WEEK">周总结</option>
                      <option value="MONTH">月总结</option>
                    </select>
                  </Field>
                  <Field label="填报日期">
                    <input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((c) => ({ ...c, reportDate: event.target.value }))} type="date" value={reportForm.reportDate} />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="填报人">
                    <input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((c) => ({ ...c, userName: event.target.value }))} placeholder="姓名" value={reportForm.userName} />
                  </Field>
                  <Field label="填报人ID">
                    <input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((c) => ({ ...c, userId: event.target.value }))} placeholder="ID" value={reportForm.userId} />
                  </Field>
                </div>
                <Field label="日志内容">
                  <textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReportForm((c) => ({ ...c, reportContent: event.target.value }))} placeholder="填写本期工作内容或总结说明" rows={3} value={reportForm.reportContent} />
                </Field>
                <Field label="完成说明">
                  <textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReportForm((c) => ({ ...c, finishContent: event.target.value }))} placeholder="填写已完成事项和结果说明" rows={3} value={reportForm.finishContent} />
                </Field>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    checked={reportForm.delayFlag}
                    className="h-4 w-4 rounded border-slate-300 text-rose-500"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((c) => ({ ...c, delayFlag: event.target.checked }))}
                    type="checkbox"
                  />
                  本次填报包含延期说明
                </label>
                {reportForm.delayFlag && (
                  <Field label="延期原因">
                    <textarea className="field-textarea border-amber-200 bg-amber-50" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReportForm((c) => ({ ...c, delayReason: event.target.value }))} placeholder="填写延期原因和影响说明" rows={3} value={reportForm.delayReason} />
                  </Field>
                )}
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)] transition-all hover:shadow-[0_6px_18px_-4px_rgba(16,185,129,0.65)] active:scale-95 disabled:opacity-50"
                  disabled={reportSubmitting}
                  onClick={() => { void handleReportSubmit(); }}
                  type="button"
                >
                  {reportSubmitting ? '提交中...' : editingReportId === null ? '新增日志 / 总结' : '保存'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ── Attachments Tab ── */}
        {tab === 'attachments' && (
          <div className="grid gap-5 xl:grid-cols-2">
            <RecordCard title={`打卡记录 (${checkIns.length})`}>
              {loading ? (
                <div className="py-6 text-center text-sm text-slate-400">加载中...</div>
              ) : checkIns.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">暂无打卡记录</div>
              ) : checkIns.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 text-xs font-bold text-cyan-700 flex items-center justify-center">{item.userName.slice(0, 1)}</div>
                      <span className="text-sm font-semibold text-slate-800">{item.userName}</span>
                      <Badge tone="neutral">{getCheckinResultLabel(item.result)}</Badge>
                    </div>
                    <div className="mt-1 pl-8 text-xs text-slate-400">{formatDateTime(item.checkInTime)} {item.address ? `· ${item.address}` : ''}</div>
                  </div>
                </div>
              ))}
            </RecordCard>
            <RecordCard title={`附件资料 (${attachments.length})`}>
              {loading ? (
                <div className="py-6 text-center text-sm text-slate-400">加载中...</div>
              ) : attachments.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">暂无附件资料</div>
              ) : attachments.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 20 20">
                          <path d="M13.5 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0V2.5Z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M5.5 7a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0ZM5.5 7v8M14.5 7v8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-800">{item.fileName}</div>
                        <div className="text-xs text-slate-400">{item.uploaderName ?? '--'} · {formatDateTime(item.uploadTime)}</div>
                      </div>
                    </div>
                  </div>
                  <Badge tone="neutral">{getFileCategoryLabel(item.fileCategory)}</Badge>
                </div>
              ))}
            </RecordCard>
          </div>
        )}
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
