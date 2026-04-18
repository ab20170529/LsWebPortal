import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';

import { Badge, Button, Card, cx } from '@lserp/ui';

import { downloadProjectAttachment } from '../../project-attachments';
import { getFileCategoryLabel, getProjectStatusLabel } from '../../project-display';
import { useProjectToast } from '../../project-toast';
import type {
  PlanLogAttachment,
  PlanLogPageProps,
  PlanLogPlan,
  PlanLogPlanItem,
  PlanLogReport,
} from './plan-log-types';
import { formatDateTime, groupPlans, groupReports } from './plan-log-utils';

type TabKey = 'plan' | 'report' | 'attachments';

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

type PlanItemFormState = {
  assigneeId: string;
  helpDept: string;
  planContent: string;
  planDate: string;
  planRequirement: string;
  projectNodeId: string;
  projectTaskId: string;
  status: string;
  weekDay: string;
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

type AttachmentFormState = {
  file: File | null;
  fileCategory: string;
  remark: string;
};

const INITIAL_ATTACHMENT_FORM: AttachmentFormState = { file: null, fileCategory: 'OTHER', remark: '' };

function toDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
}

function trimToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim() ? error.message : '操作失败，请稍后重试。';
}

function formatFileSize(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveWeekDayLabel(dateValue: string) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()] ?? '';
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

function buildPlanItemForm(item: PlanLogPlanItem | null, tasks: PlanLogPageProps['tasks']): PlanItemFormState {
  const matchedTask = item?.projectTaskId ? tasks.find((task) => task.id === item.projectTaskId) : null;
  return {
    assigneeId: item?.assigneeId ?? '',
    helpDept: item?.helpDept ?? '',
    planContent: item?.planContent ?? '',
    planDate: toDateInput(item?.planDate),
    planRequirement: item?.planRequirement ?? '',
    projectNodeId: String(item?.projectNodeId ?? matchedTask?.projectNodeId ?? ''),
    projectTaskId: String(item?.projectTaskId ?? ''),
    status: item?.status ?? 'DRAFT',
    weekDay: item?.weekDay ?? resolveWeekDayLabel(toDateInput(item?.planDate)),
  };
}

function buildReportForm(report: PlanLogReport | null, selectedProject: PlanLogPageProps['selectedProject'], currentUserId: string, currentUserName: string): ReportFormState {
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
    userId: report?.userId ?? currentUserId ?? selectedProject?.managerId ?? '',
    userName: report?.userName ?? currentUserName ?? selectedProject?.managerName ?? '',
  };
}

function formatPlanWindow(plan: PlanLogPlan) {
  return plan.planPeriod || plan.planWeek || plan.planMonth || [toDateInput(plan.planStartDate), toDateInput(plan.planEndDate)].filter(Boolean).join(' 至 ') || '--';
}

function formatPlanItemDate(item: PlanLogPlanItem) {
  return [toDateInput(item.planDate), item.weekDay || resolveWeekDayLabel(toDateInput(item.planDate))].filter(Boolean).join(' / ') || '--';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-2"><div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>{children}</label>;
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button className={cx('rounded-lg border-b-2 px-4 py-2 text-sm font-medium transition', active ? 'border-blue-600 bg-blue-50/50 text-blue-600' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700')} onClick={onClick} type="button">{label}</button>;
}

function EmptyPanel({ description, title }: { description: string; title: string }) {
  return <Card className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><div className="text-base font-semibold text-slate-700">{title}</div><div className="mt-2 text-sm leading-6 text-slate-500">{description}</div></Card>;
}

export function ProjectPlanLogPage({
  attachments,
  currentUserId,
  currentUserName,
  loading,
  members,
  nodes,
  onCreatePlan,
  onCreatePlanItem,
  onCreateReport,
  onDeleteAttachment,
  onUpdatePlan,
  onUpdatePlanItem,
  onUpdateReport,
  onUploadAttachment,
  planItemsByPlanId,
  plans,
  reports,
  selectedProject,
  tasks,
  workspaceError,
}: PlanLogPageProps) {
  const { pushToast } = useProjectToast();
  const [tab, setTab] = useState<TabKey>('plan');
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editingPlanItemId, setEditingPlanItemId] = useState<number | null>(null);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planItemSubmitting, setPlanItemSubmitting] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [attachmentSubmitting, setAttachmentSubmitting] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormState>(buildPlanForm(null, selectedProject));
  const [planItemForm, setPlanItemForm] = useState<PlanItemFormState>(buildPlanItemForm(null, tasks));
  const [reportForm, setReportForm] = useState<ReportFormState>(buildReportForm(null, selectedProject, currentUserId, currentUserName));
  const [attachmentForm, setAttachmentForm] = useState<AttachmentFormState>(INITIAL_ATTACHMENT_FORM);

  const groupedPlans = useMemo(() => groupPlans(plans), [plans]);
  const groupedReports = useMemo(() => groupReports(reports), [reports]);
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node.nodeName])), [nodes]);
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const memberMap = useMemo(() => new Map(members.map((member) => [member.userId, member])), [members]);
  const currentPlan = useMemo(() => plans.find((item) => item.id === activePlanId) ?? null, [activePlanId, plans]);
  const currentPlanItems = useMemo(() => currentPlan ? planItemsByPlanId[currentPlan.id] ?? [] : [], [currentPlan, planItemsByPlanId]);
  const planItemCountMap = useMemo(() => new Map(plans.map((plan) => [plan.id, planItemsByPlanId[plan.id]?.length ?? 0])), [planItemsByPlanId, plans]);
  const availableTasks = useMemo(() => !planItemForm.projectNodeId ? tasks : tasks.filter((task) => String(task.projectNodeId ?? '') === planItemForm.projectNodeId), [planItemForm.projectNodeId, tasks]);

  useEffect(() => {
    if (!plans.length) {
      setActivePlanId(null);
      setEditingPlanId(null);
      setEditingPlanItemId(null);
      return;
    }
    setActivePlanId((current) => current !== null && plans.some((item) => item.id === current) ? current : plans[0]?.id ?? null);
  }, [plans]);

  useEffect(() => {
    if (editingPlanId === null) setPlanForm(buildPlanForm(null, selectedProject));
  }, [editingPlanId, selectedProject]);

  useEffect(() => {
    if (editingPlanItemId === null) setPlanItemForm(buildPlanItemForm(null, tasks));
  }, [editingPlanItemId, tasks]);

  useEffect(() => {
    if (editingReportId === null) setReportForm(buildReportForm(null, selectedProject, currentUserId, currentUserName));
  }, [currentUserId, currentUserName, editingReportId, selectedProject]);

  useEffect(() => {
    if (editingPlanItemId !== null && !currentPlanItems.some((item) => item.id === editingPlanItemId)) {
      setEditingPlanItemId(null);
      setPlanItemForm(buildPlanItemForm(null, tasks));
    }
  }, [currentPlanItems, editingPlanItemId, tasks]);

  async function handlePlanSubmit() {
    if (!selectedProject) return pushToast({ message: '请先选择项目。', tone: 'danger' });
    if (!planForm.planContent.trim()) return pushToast({ message: '请先填写计划内容。', tone: 'danger' });
    setPlanSubmitting(true);
    try {
      const payload = {
        managerId: trimToNull(planForm.managerId),
        managerName: trimToNull(planForm.managerName),
        planContent: trimToNull(planForm.planContent),
        planEndDate: trimToNull(planForm.planEndDate),
        planMonth: trimToNull(planForm.planMonth),
        planPeriod: trimToNull(planForm.planPeriod),
        planStartDate: trimToNull(planForm.planStartDate),
        planType: planForm.planType,
        planWeek: trimToNull(planForm.planWeek),
        status: trimToNull(planForm.status),
      };
      if (editingPlanId === null) await onCreatePlan(selectedProject.id, payload); else await onUpdatePlan(selectedProject.id, editingPlanId, payload);
      setEditingPlanId(null);
      setPlanForm(buildPlanForm(null, selectedProject));
      pushToast({ message: editingPlanId === null ? '计划已创建。' : '计划已更新。', tone: 'success' });
    } catch (error) {
      pushToast({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setPlanSubmitting(false);
    }
  }

  async function handlePlanItemSubmit() {
    if (!selectedProject) return pushToast({ message: '请先选择项目。', tone: 'danger' });
    if (!currentPlan) return pushToast({ message: '请先选择一个计划，再维护明细。', tone: 'danger' });
    if (!planItemForm.planContent.trim()) return pushToast({ message: '请先填写计划明细内容。', tone: 'danger' });
    const selectedAssignee = memberMap.get(planItemForm.assigneeId);
    const selectedTask = taskMap.get(Number(planItemForm.projectTaskId));
    const resolvedNodeId = parseOptionalNumber(planItemForm.projectNodeId) ?? selectedTask?.projectNodeId ?? null;
    setPlanItemSubmitting(true);
    try {
      const payload = {
        assigneeId: trimToNull(planItemForm.assigneeId),
        assigneeName: planItemForm.assigneeId ? selectedAssignee?.userName ?? null : null,
        helpDept: trimToNull(planItemForm.helpDept),
        planContent: planItemForm.planContent.trim(),
        planDate: trimToNull(planItemForm.planDate),
        planRequirement: trimToNull(planItemForm.planRequirement),
        projectNodeId: resolvedNodeId,
        projectTaskId: parseOptionalNumber(planItemForm.projectTaskId),
        status: trimToNull(planItemForm.status),
        weekDay: trimToNull(planItemForm.weekDay || resolveWeekDayLabel(planItemForm.planDate)),
      };
      if (editingPlanItemId === null) await onCreatePlanItem(selectedProject.id, currentPlan.id, payload); else await onUpdatePlanItem(selectedProject.id, currentPlan.id, editingPlanItemId, payload);
      setEditingPlanItemId(null);
      setPlanItemForm(buildPlanItemForm(null, tasks));
      pushToast({ message: editingPlanItemId === null ? '计划明细已新增。' : '计划明细已更新。', tone: 'success' });
    } catch (error) {
      pushToast({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setPlanItemSubmitting(false);
    }
  }

  async function handleReportSubmit() {
    if (!selectedProject) return pushToast({ message: '请先选择项目。', tone: 'danger' });
    if (!reportForm.userId.trim() || !reportForm.userName.trim()) return pushToast({ message: '请完善填报人信息。', tone: 'danger' });
    if (!reportForm.reportContent.trim() && !reportForm.finishContent.trim()) return pushToast({ message: '请至少填写日志内容或完成说明。', tone: 'danger' });
    setReportSubmitting(true);
    try {
      const payload = {
        coordinationContent: null,
        delayFlag: reportForm.delayFlag,
        delayReason: trimToNull(reportForm.delayReason),
        finishContent: trimToNull(reportForm.finishContent),
        projectNodeId: null,
        projectTaskId: null,
        remark: trimToNull(reportForm.remark),
        reportContent: trimToNull(reportForm.reportContent),
        reportDate: trimToNull(reportForm.reportDate),
        reportMonth: trimToNull(reportForm.reportMonth),
        reportType: reportForm.reportType,
        reportWeek: trimToNull(reportForm.reportWeek),
        userId: reportForm.userId.trim(),
        userName: reportForm.userName.trim(),
      };
      if (editingReportId === null) await onCreateReport(selectedProject.id, payload); else await onUpdateReport(selectedProject.id, editingReportId, payload);
      setEditingReportId(null);
      setReportForm(buildReportForm(null, selectedProject, currentUserId, currentUserName));
      pushToast({ message: editingReportId === null ? '日志/总结已提交。' : '日志/总结已更新。', tone: 'success' });
    } catch (error) {
      pushToast({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setReportSubmitting(false);
    }
  }

  async function handleAttachmentUpload() {
    if (!selectedProject) return pushToast({ message: '请先选择项目。', tone: 'danger' });
    if (!currentUserId || !currentUserName) return pushToast({ message: '当前登录人信息不完整，无法上传附件。', tone: 'danger' });
    if (!attachmentForm.file) return pushToast({ message: '请先选择要上传的文件。', tone: 'danger' });
    setAttachmentSubmitting(true);
    try {
      await onUploadAttachment(selectedProject.id, { file: attachmentForm.file, fileCategory: attachmentForm.fileCategory, remark: trimToNull(attachmentForm.remark), uploaderId: currentUserId, uploaderName: currentUserName });
      setAttachmentForm(INITIAL_ATTACHMENT_FORM);
      pushToast({ message: '附件已上传。', tone: 'success' });
    } catch (error) {
      pushToast({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setAttachmentSubmitting(false);
    }
  }

  async function handleAttachmentDelete(attachment: PlanLogAttachment) {
    if (!selectedProject || !window.confirm(`确认删除附件“${attachment.fileName}”吗？`)) return;
    try {
      await onDeleteAttachment(selectedProject.id, attachment.id);
      pushToast({ message: '附件已删除。', tone: 'success' });
    } catch (error) {
      pushToast({ message: normalizeErrorMessage(error), tone: 'danger' });
    }
  }

  if (!selectedProject) {
    return <div className="flex h-full items-center justify-center p-8"><Card className="w-full max-w-lg rounded-3xl p-10 text-center"><div className="text-2xl font-black tracking-tight text-slate-900">计划与日志</div><div className="mt-3 text-sm leading-7 text-slate-500">请先在“项目台账”中选择一个项目，再进入当前页面维护计划、日志和附件资料。</div></Card></div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f3f5f9]">
      <div className="bg-white px-6 pb-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900">计划与日志</div>
            <div className="mt-1 text-sm text-slate-500">月/周/日计划、计划明细、日志总结与附件资料</div>
          </div>
          <Badge tone="neutral">{selectedProject.projectName}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-6">
        <TabButton active={tab === 'plan'} label={`计划填报 (${plans.length})`} onClick={() => setTab('plan')} />
        <TabButton active={tab === 'report'} label="日志 / 总结" onClick={() => setTab('report')} />
        <TabButton active={tab === 'attachments'} label={`附件资料 (${attachments.length})`} onClick={() => setTab('attachments')} />
      </div>
      {workspaceError ? <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{workspaceError}</div> : null}
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {tab === 'plan' ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              {loading ? <Card className="rounded-2xl p-6 text-sm text-slate-400">加载中...</Card> : <>
                {([['月计划', groupedPlans.month], ['周计划', groupedPlans.week], ['日计划', groupedPlans.day]] as const).map(([label, items]) => (
                  <Card key={label} className="rounded-2xl p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-700">{label} ({items.length})</div>
                      <div className="text-xs text-slate-400">点击计划可切换明细</div>
                    </div>
                    {items.length ? <div className="space-y-3">
                      {items.map((item) => {
                        const isActive = item.id === currentPlan?.id;
                        const itemCount = planItemCountMap.get(item.id) ?? 0;
                        return (
                          <div
                            key={item.id}
                            className={cx('rounded-2xl border px-4 py-4 transition', isActive ? 'border-sky-200 bg-sky-50/70' : 'border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-slate-50')}
                            onClick={() => setActivePlanId(item.id)}
                            onKeyDown={(event: { key: string; preventDefault: () => void }) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setActivePlanId(item.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-800">{item.planContent || '--'}</div>
                                  <Badge tone="neutral">明细 {itemCount}</Badge>
                                </div>
                                <div className="mt-2 text-xs leading-6 text-slate-500">{item.managerName ?? '--'} / {formatPlanWindow(item)}</div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <Badge tone="neutral">{getProjectStatusLabel(item.status ?? 'DRAFT')}</Badge>
                                <button
                                  className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                                  onClick={(event: { stopPropagation: () => void }) => {
                                    event.stopPropagation();
                                    setActivePlanId(item.id);
                                    setEditingPlanId(item.id);
                                    setPlanForm(buildPlanForm(item, selectedProject));
                                  }}
                                  type="button"
                                >
                                  编辑
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div> : <div className="py-6 text-center text-sm text-slate-400">暂无记录</div>}
                  </Card>
                ))}
                {currentPlan ? (
                  <Card className="rounded-2xl p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-700">计划明细</div>
                        <div className="mt-1 text-xs text-slate-400">{currentPlan.planContent || '--'} / {formatPlanWindow(currentPlan)}</div>
                      </div>
                      <Badge tone="neutral">{currentPlanItems.length} 条</Badge>
                    </div>
                    {currentPlanItems.length ? <div className="space-y-3">
                      {currentPlanItems.map((item) => {
                        const task = item.projectTaskId ? taskMap.get(item.projectTaskId) : null;
                        return (
                          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-800">{item.planContent}</div>
                                  <Badge tone="neutral">{getProjectStatusLabel(item.status ?? 'DRAFT')}</Badge>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-6 text-slate-500">
                                  <span>{formatPlanItemDate(item)}</span>
                                  <span>负责人：{item.assigneeName ?? '--'}</span>
                                  <span>协助部门：{item.helpDept ?? '--'}</span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-6 text-slate-500">
                                  <span>节点：{item.projectNodeId ? nodeMap.get(item.projectNodeId) ?? `#${item.projectNodeId}` : '--'}</span>
                                  <span>任务：{task ? task.taskTitle : item.projectTaskId ? `#${item.projectTaskId}` : '--'}</span>
                                </div>
                                {item.planRequirement ? <div className="mt-2 text-sm leading-6 text-slate-600">{item.planRequirement}</div> : null}
                              </div>
                              <button
                                className="shrink-0 text-xs font-semibold text-sky-600 hover:text-sky-800"
                                onClick={() => {
                                  setActivePlanId(item.projectPlanId);
                                  setEditingPlanItemId(item.id);
                                  setPlanItemForm(buildPlanItemForm(item, tasks));
                                }}
                                type="button"
                              >
                                编辑明细
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div> : <div className="py-8 text-center text-sm text-slate-400">当前计划还没有拆解明细。</div>}
                  </Card>
                ) : (
                  <EmptyPanel title="计划明细待维护" description="先创建或选择一个计划，再在这里维护计划明细、负责人和节点任务关联。" />
                )}
              </>}
            </div>
            <div className="space-y-5">
              <Card className="rounded-2xl p-5">
                <div className="mb-4 text-sm font-bold text-slate-700">{editingPlanId === null ? '新增计划' : '编辑计划'}</div>
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="计划类型"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanForm((current) => ({ ...current, planType: event.target.value }))} value={planForm.planType}><option value="MONTH">月计划</option><option value="WEEK">周计划</option><option value="DAY">日计划</option></select></Field>
                    <Field label="计划状态"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanForm((current) => ({ ...current, status: event.target.value }))} value={planForm.status}><option value="DRAFT">草稿</option><option value="PENDING">待执行</option><option value="IN_PROGRESS">进行中</option><option value="COMPLETED">已完成</option></select></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="开始日期"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((current) => ({ ...current, planStartDate: event.target.value }))} type="date" value={planForm.planStartDate} /></Field>
                    <Field label="结束日期"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((current) => ({ ...current, planEndDate: event.target.value }))} type="date" value={planForm.planEndDate} /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="计划月份"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((current) => ({ ...current, planMonth: event.target.value }))} value={planForm.planMonth} /></Field>
                    <Field label="计划周次"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((current) => ({ ...current, planWeek: event.target.value }))} value={planForm.planWeek} /></Field>
                  </div>
                  <Field label="周期说明"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanForm((current) => ({ ...current, planPeriod: event.target.value }))} value={planForm.planPeriod} /></Field>
                  <Field label="计划内容"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setPlanForm((current) => ({ ...current, planContent: event.target.value }))} rows={5} value={planForm.planContent} /></Field>
                  <Button className="w-full justify-center rounded-xl" disabled={planSubmitting} onClick={() => { void handlePlanSubmit(); }}>{planSubmitting ? '保存中...' : editingPlanId === null ? '新增计划' : '保存计划'}</Button>
                </div>
              </Card>
              <Card className="rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-700">{editingPlanItemId === null ? '新增计划明细' : '编辑计划明细'}</div>
                    <div className="mt-1 text-xs text-slate-400">{currentPlan ? `当前计划：${currentPlan.planContent || '--'}` : '请先在左侧选择一个计划'}</div>
                  </div>
                  {currentPlan ? <Badge tone="neutral">{currentPlanItems.length} 条明细</Badge> : null}
                </div>
                {currentPlan ? <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="计划日期"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanItemForm((current) => ({ ...current, planDate: event.target.value, weekDay: resolveWeekDayLabel(event.target.value) }))} type="date" value={planItemForm.planDate} /></Field>
                    <Field label="星期"><input className="field-input" disabled value={planItemForm.weekDay || '--'} /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="责任人"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanItemForm((current) => ({ ...current, assigneeId: event.target.value }))} value={planItemForm.assigneeId}><option value="">未指定</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.userName}{member.roleName ? `（${member.roleName}）` : ''}</option>)}</select></Field>
                    <Field label="状态"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanItemForm((current) => ({ ...current, status: event.target.value }))} value={planItemForm.status}><option value="DRAFT">草稿</option><option value="PENDING">待执行</option><option value="IN_PROGRESS">进行中</option><option value="COMPLETED">已完成</option></select></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="关联节点"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanItemForm((current) => ({ ...current, projectNodeId: event.target.value, projectTaskId: tasks.some((task) => String(task.id) === current.projectTaskId && String(task.projectNodeId ?? '') === event.target.value) ? current.projectTaskId : '' }))} value={planItemForm.projectNodeId}><option value="">未关联</option>{nodes.map((node) => <option key={node.id} value={String(node.id)}>{node.nodeName}</option>)}</select></Field>
                    <Field label="关联任务"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => { const matchedTask = tasks.find((task) => String(task.id) === event.target.value); setPlanItemForm((current) => ({ ...current, projectNodeId: matchedTask?.projectNodeId ? String(matchedTask.projectNodeId) : current.projectNodeId, projectTaskId: event.target.value })); }} value={planItemForm.projectTaskId}><option value="">未关联</option>{availableTasks.map((task) => <option key={task.id} value={String(task.id)}>{task.taskTitle}</option>)}</select></Field>
                  </div>
                  <Field label="协助部门"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setPlanItemForm((current) => ({ ...current, helpDept: event.target.value }))} value={planItemForm.helpDept} /></Field>
                  <Field label="明细内容"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setPlanItemForm((current) => ({ ...current, planContent: event.target.value }))} rows={4} value={planItemForm.planContent} /></Field>
                  <Field label="完成要求"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setPlanItemForm((current) => ({ ...current, planRequirement: event.target.value }))} rows={3} value={planItemForm.planRequirement} /></Field>
                  <Button className="w-full justify-center rounded-xl" disabled={planItemSubmitting} onClick={() => { void handlePlanItemSubmit(); }}>{planItemSubmitting ? '保存中...' : editingPlanItemId === null ? '新增计划明细' : '保存计划明细'}</Button>
                </div> : <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">左侧选中一个计划后，这里会显示计划明细编辑表单。</div>}
              </Card>
            </div>
          </div>
        ) : null}
        {tab === 'report' ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              {loading ? <Card className="rounded-2xl p-6 text-sm text-slate-400">加载中...</Card> : <>
                {([['月总结', groupedReports.month], ['周总结', groupedReports.week], ['日志', groupedReports.day]] as const).map(([label, items]) => (
                  <Card key={label} className="rounded-2xl p-5">
                    <div className="mb-4 text-sm font-bold text-slate-700">{label} ({items.length})</div>
                    {items.length ? <div className="space-y-3">
                      {items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-slate-800">{item.userName}</div><div className="mt-2 text-sm leading-6 text-slate-600">{item.reportContent || item.finishContent || '暂无内容'}</div><div className="mt-2 text-xs text-slate-400">{formatDateTime(item.reportDate)}{item.delayFlag ? ' / 含延期说明' : ''}</div></div><button className="shrink-0 text-xs font-semibold text-sky-600 hover:text-sky-800" onClick={() => { setEditingReportId(item.id); setReportForm(buildReportForm(item, selectedProject, currentUserId, currentUserName)); }} type="button">编辑</button></div></div>)}
                    </div> : <div className="py-6 text-center text-sm text-slate-400">暂无记录</div>}
                  </Card>
                ))}
              </>}
            </div>
            <Card className="rounded-2xl p-5">
              <div className="mb-4 text-sm font-bold text-slate-700">{editingReportId === null ? '新增日志 / 总结' : '编辑日志 / 总结'}</div>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="填报类型"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setReportForm((current) => ({ ...current, reportType: event.target.value }))} value={reportForm.reportType}><option value="DAY">日志</option><option value="WEEK">周总结</option><option value="MONTH">月总结</option></select></Field>
                  <Field label="填报日期"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((current) => ({ ...current, reportDate: event.target.value }))} type="date" value={reportForm.reportDate} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="填报人"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((current) => ({ ...current, userName: event.target.value }))} value={reportForm.userName} /></Field>
                  <Field label="填报人ID"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((current) => ({ ...current, userId: event.target.value }))} value={reportForm.userId} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="所属月份"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((current) => ({ ...current, reportMonth: event.target.value }))} value={reportForm.reportMonth} /></Field>
                  <Field label="所属周次"><input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((current) => ({ ...current, reportWeek: event.target.value }))} value={reportForm.reportWeek} /></Field>
                </div>
                <Field label="日志内容"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReportForm((current) => ({ ...current, reportContent: event.target.value }))} rows={4} value={reportForm.reportContent} /></Field>
                <Field label="完成说明"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReportForm((current) => ({ ...current, finishContent: event.target.value }))} rows={4} value={reportForm.finishContent} /></Field>
                <Field label="备注"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReportForm((current) => ({ ...current, remark: event.target.value }))} rows={3} value={reportForm.remark} /></Field>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><input checked={reportForm.delayFlag} className="h-4 w-4 rounded border-slate-300" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((current) => ({ ...current, delayFlag: event.target.checked }))} type="checkbox" />本次填报包含延期说明</label>
                {reportForm.delayFlag ? <Field label="延期原因"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReportForm((current) => ({ ...current, delayReason: event.target.value }))} rows={3} value={reportForm.delayReason} /></Field> : null}
                <Button className="w-full justify-center rounded-xl" disabled={reportSubmitting} onClick={() => { void handleReportSubmit(); }}>{reportSubmitting ? '提交中...' : editingReportId === null ? '新增日志 / 总结' : '保存日志 / 总结'}</Button>
              </div>
            </Card>
          </div>
        ) : null}
        {tab === 'attachments' ? (
          <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="rounded-2xl p-5">
              <div className="mb-4 text-sm font-bold text-slate-700">上传附件</div>
              <div className="space-y-4">
                <Field label="上传人"><input className="field-input" disabled value={currentUserName || '未识别当前登录人'} /></Field>
                <Field label="附件分类"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setAttachmentForm((current) => ({ ...current, fileCategory: event.target.value }))} value={attachmentForm.fileCategory}><option value="MILESTONE">里程碑</option><option value="DELIVERABLE">交付件</option><option value="CONTRACT">合同</option><option value="REPORT">报告</option><option value="OTHER">其他</option></select></Field>
                <Field label="选择文件"><input className="field-input h-auto py-2 file:mr-4 file:border-0 file:bg-slate-100 file:px-3 file:py-2" onChange={(event: ChangeEvent<HTMLInputElement>) => setAttachmentForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} type="file" /></Field>
                <Field label="备注"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAttachmentForm((current) => ({ ...current, remark: event.target.value }))} rows={3} value={attachmentForm.remark} /></Field>
                <Button className="w-full justify-center rounded-xl" disabled={attachmentSubmitting || !currentUserId || !currentUserName} onClick={() => { void handleAttachmentUpload(); }}>{attachmentSubmitting ? '上传中...' : '上传附件'}</Button>
              </div>
            </Card>
            <Card className="rounded-2xl p-5">
              <div className="mb-4 text-sm font-bold text-slate-700">附件资料 ({attachments.length})</div>
              {loading ? <div className="py-6 text-center text-sm text-slate-400">加载中...</div> : attachments.length ? <div className="space-y-3">{attachments.map((attachment) => <div key={attachment.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><div className="truncate text-sm font-semibold text-slate-800">{attachment.fileName}</div><Badge tone="neutral">{getFileCategoryLabel(attachment.fileCategory)}</Badge></div><div className="mt-2 text-xs leading-6 text-slate-500">{attachment.uploaderName ?? '--'} / {formatDateTime(attachment.uploadTime)} / {formatFileSize(attachment.fileSize)}</div>{attachment.remark ? <div className="mt-2 text-sm leading-6 text-slate-600">{attachment.remark}</div> : null}</div><div className="flex shrink-0 items-center gap-2"><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => { void downloadProjectAttachment(attachment, selectedProject.id).catch((error: unknown) => pushToast({ message: normalizeErrorMessage(error), tone: 'danger' })); }} type="button">下载</button><button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100" onClick={() => { void handleAttachmentDelete(attachment); }} type="button">删除</button></div></div></div>)}</div> : <div className="py-6 text-center text-sm text-slate-400">暂无附件资料</div>}
            </Card>
          </div>
        ) : null}
      </div>
      <style>{`.field-input{display:flex;height:44px;width:100%;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;padding:0 14px;font-size:14px;color:#1e293b;outline:none;transition:border-color .15s,background .15s,box-shadow .15s}.field-input:focus{border-color:#38bdf8;background:#fff;box-shadow:0 0 0 3px rgba(56,189,248,.12)}.field-textarea{display:flex;width:100%;min-height:92px;resize:vertical;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;padding:12px 14px;font-size:14px;color:#1e293b;outline:none;transition:border-color .15s,background .15s,box-shadow .15s}.field-textarea:focus{border-color:#38bdf8;background:#fff;box-shadow:0 0 0 3px rgba(56,189,248,.12)}`}</style>
    </div>
  );
}
