import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';

import {
  CalendarDays,
  Plus,
  X,
} from 'lucide-react';

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><div className="text-sm font-medium text-[#5e7291]">{label}</div>{children}</label>;
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={cx(
        'flex h-10 items-center border-b-2 px-3 text-sm font-semibold transition',
        active ? 'border-[#1f7cff] text-[#1f65e8]' : 'border-transparent text-[#5e7291] hover:text-[#263653]',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function EmptyPanel({ description, title }: { description: string; title: string }) {
  return <Card className="rounded-lg border border-dashed border-[#d9e3f1] bg-white p-6 text-center"><div className="text-base font-bold text-[#263653]">{title}</div><div className="mt-2 text-sm leading-6 text-[#7e91b0]">{description}</div></Card>;
}

function getPlanProgress(status?: string | null) {
  const normalized = (status ?? 'DRAFT').toUpperCase();
  if (normalized === 'COMPLETED') return 100;
  if (normalized === 'IN_PROGRESS') return 60;
  if (normalized === 'PENDING') return 20;
  return 0;
}

function getStatusPillClass(status?: string | null) {
  const normalized = (status ?? 'DRAFT').toUpperCase();
  if (normalized === 'COMPLETED') return 'bg-[#e8fbf5] text-[#12b981]';
  if (normalized === 'IN_PROGRESS') return 'bg-[#eaf3ff] text-[#1f7cff]';
  if (normalized === 'PENDING') return 'bg-[#fff4e5] text-[#ff8a00]';
  return 'bg-[#f2f6fb] text-[#5e7291]';
}

function StatusPill({ status }: { status?: string | null }) {
  return (
    <span className={cx('inline-flex h-6 items-center rounded-full px-3 text-[13px] font-medium', getStatusPillClass(status))}>
      {getProjectStatusLabel(status ?? 'DRAFT')}
    </span>
  );
}

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 text-right text-[13px] font-medium text-[#263653]">{value}%</span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e9eff8]">
        <div className="h-full rounded-full bg-[#1f7cff]" style={{ width: `${value}%` }} />
      </div>
    </div>
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

function PlanPeriodControl({ label }: { label: string }) {
  return (
    <div
      className="inline-flex h-8 max-w-[260px] items-center gap-2 rounded-md border border-[#d9e3f1] bg-[#f8fbff] px-3 text-sm font-medium text-[#526681]"
      title={label}
    >
      <CalendarDays size={14} strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </div>
  );
}

function TableActionButton({
  children,
  danger = false,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        'inline-flex h-7 min-w-[36px] items-center justify-center rounded px-1.5 text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[#dceaff]',
        danger
          ? 'text-rose-700 hover:bg-rose-50 hover:text-rose-800'
          : 'text-[#1f65e8] hover:bg-[#eaf3ff] hover:text-[#1557d7]',
      )}
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

function SectionActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1f7cff] px-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.18)] transition hover:bg-[#176df0]"
      onClick={onClick}
      type="button"
    >
      <Plus size={14} strokeWidth={2} />
      {children}
    </button>
  );
}

function PlanTableSection({
  currentPlanId,
  emptyText,
  getTaskSummary,
  items,
  onEdit,
  onSelect,
  periodLabel,
  showTaskSummary = true,
  title,
  titleColumn,
}: {
  currentPlanId: number | null;
  emptyText: string;
  getTaskSummary: (plan: PlanLogPlan) => string;
  items: PlanLogPlan[];
  onEdit: (plan: PlanLogPlan) => void;
  onSelect: (planId: number) => void;
  periodLabel: string;
  showTaskSummary?: boolean;
  title: string;
  titleColumn: string;
}) {
  const columnCount = showTaskSummary ? 6 : 5;

  return (
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="shrink-0 text-base font-bold text-[#111c33]">{title}</h3>
          <PlanPeriodControl label={periodLabel} />
        </div>
      </div>
      <div className="overflow-auto">
        <table className={cx('w-full border-collapse', showTaskSummary ? 'min-w-[680px]' : 'min-w-[560px]')}>
          <thead className="bg-[#f8fbff]">
            <tr className="text-left text-[13px] font-medium text-[#6b7f9e]">
              <th className="px-4 py-3">{titleColumn}</th>
              {showTaskSummary ? <th className="px-4 py-3">关键任务</th> : null}
              <th className="px-4 py-3">负责人</th>
              <th className="px-4 py-3">计划进度</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((plan) => {
              const progress = getPlanProgress(plan.status);
              const selected = plan.id === currentPlanId;
              return (
                <tr
                  aria-selected={selected}
                  className={cx(
                    'cursor-pointer border-t border-[#edf2f8] text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#dceaff]',
                    selected ? 'bg-[#edf6ff] hover:bg-[#e8f3ff]' : 'bg-white hover:bg-[#f8fbff]',
                  )}
                  key={plan.id}
                  onClick={() => onSelect(plan.id)}
                  onKeyDown={(event: { key: string; preventDefault: () => void }) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(plan.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <td className={cx(
                    'max-w-[260px] border-l-2 px-4 py-3 font-medium text-[#263653]',
                    selected ? 'border-[#1f7cff] pl-[14px]' : 'border-transparent',
                  )}>{plan.planContent || '--'}</td>
                  {showTaskSummary ? <td className="max-w-[260px] px-4 py-3 text-[#526681]">{getTaskSummary(plan)}</td> : null}
                  <td className="px-4 py-3"><UserCell name={plan.managerName} /></td>
                  <td className="px-4 py-3"><ProgressCell value={progress} /></td>
                  <td className="px-4 py-3"><StatusPill status={plan.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <TableActionButton onClick={() => onSelect(plan.id)}>查看</TableActionButton>
                      <TableActionButton onClick={() => onEdit(plan)}>编辑</TableActionButton>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td className="px-4 py-10 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={columnCount}>{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PlanItemTableSection({
  items,
  onCreate,
  onEdit,
  planTitle,
}: {
  items: PlanLogPlanItem[];
  onCreate: () => void;
  onEdit: (item: PlanLogPlanItem) => void;
  planTitle: string;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-[#111c33]">计划明细</h3>
          <div className="mt-1 text-xs font-medium text-[#8da0bd]">{planTitle}</div>
        </div>
        <SectionActionButton onClick={onCreate}>新增计划明细</SectionActionButton>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead className="bg-[#f8fbff]">
            <tr className="text-left text-[13px] font-medium text-[#6b7f9e]">
              <th className="px-4 py-3">序号</th>
              <th className="px-4 py-3">计划内容</th>
              <th className="px-4 py-3">负责人</th>
              <th className="px-4 py-3">计划日期</th>
              <th className="px-4 py-3">协助部门</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((item, index) => (
              <tr className="border-t border-[#edf2f8] bg-white text-[13px] font-medium transition hover:bg-[#f8fbff]" key={item.id}>
                <td className="px-4 py-3 font-medium text-[#526681]">{index + 1}</td>
                <td className="max-w-[260px] px-4 py-3 font-medium text-[#263653]">{item.planContent}</td>
                <td className="px-4 py-3"><UserCell name={item.assigneeName} /></td>
                <td className="px-4 py-3 text-[#526681]">{toDateInput(item.planDate) || '--'}</td>
                <td className="px-4 py-3 text-[#526681]">{item.helpDept || '--'}</td>
                <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <TableActionButton onClick={() => onEdit(item)}>编辑</TableActionButton>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={7}>当前计划还没有拆解明细。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ReportTableSection({
  emptyText,
  items,
  onEdit,
  title,
}: {
  emptyText: string;
  items: PlanLogReport[];
  onEdit: (item: PlanLogReport) => void;
  title: string;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-[#111c33]">{title}</h3>
          <div className="mt-1 text-xs font-medium text-[#8da0bd]">共 {items.length} 条记录</div>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead className="bg-[#f8fbff]">
            <tr className="text-left text-[13px] font-medium text-[#6b7f9e]">
              <th className="px-4 py-3">填报人</th>
              <th className="px-4 py-3">内容摘要</th>
              <th className="px-4 py-3">填报时间</th>
              <th className="px-4 py-3">延期</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((item) => (
              <tr className="border-t border-[#edf2f8] bg-white text-[13px] font-medium transition hover:bg-[#f8fbff]" key={item.id}>
                <td className="px-4 py-3"><UserCell name={item.userName} /></td>
                <td className="max-w-[420px] px-4 py-3 font-medium leading-6 text-[#263653]">{item.reportContent || item.finishContent || '暂无内容'}</td>
                <td className="px-4 py-3 text-[#526681]">{formatDateTime(item.reportDate)}</td>
                <td className="px-4 py-3">{item.delayFlag ? <span className="inline-flex h-6 items-center rounded-full bg-[#fff4e5] px-2 text-[13px] font-medium text-[#ff8a00]">含延期</span> : <span className="text-[13px] font-medium text-[#8da0bd]">--</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <TableActionButton onClick={() => onEdit(item)}>编辑</TableActionButton>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={5}>{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AttachmentTableSection({
  attachments,
  onDelete,
  onDownload,
}: {
  attachments: PlanLogAttachment[];
  onDelete: (attachment: PlanLogAttachment) => void;
  onDownload: (attachment: PlanLogAttachment) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-[#111c33]">附件资料</h3>
          <div className="mt-1 text-xs font-medium text-[#8da0bd]">共 {attachments.length} 个文件</div>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-[#f8fbff]">
            <tr className="text-left text-[13px] font-medium text-[#6b7f9e]">
              <th className="px-4 py-3">文件名称</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">上传人</th>
              <th className="px-4 py-3">上传信息</th>
              <th className="px-4 py-3">备注</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {attachments.length ? attachments.map((attachment) => (
              <tr className="border-t border-[#edf2f8] bg-white text-[13px] font-medium transition hover:bg-[#f8fbff]" key={attachment.id}>
                <td className="max-w-[260px] px-4 py-3 font-medium text-[#263653]">{attachment.fileName}</td>
                <td className="px-4 py-3"><Badge tone="neutral">{getFileCategoryLabel(attachment.fileCategory)}</Badge></td>
                <td className="px-4 py-3 text-[#526681]">{attachment.uploaderName ?? '--'}</td>
                <td className="px-4 py-3 text-[#526681]">{formatDateTime(attachment.uploadTime)} / {formatFileSize(attachment.fileSize)}</td>
                <td className="max-w-[220px] px-4 py-3 text-[#526681]">{attachment.remark || '--'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <TableActionButton onClick={() => onDownload(attachment)}>下载</TableActionButton>
                    <TableActionButton danger onClick={() => onDelete(attachment)}>删除</TableActionButton>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={6}>暂无附件资料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PlanFormAside({
  editingPlanId,
  members,
  onCancel,
  onChange,
  onSubmit,
  planForm,
  submitting,
}: {
  editingPlanId: number | null;
  members: PlanLogPageProps['members'];
  onCancel: () => void;
  onChange: (updater: (current: PlanFormState) => PlanFormState) => void;
  onSubmit: () => void;
  planForm: PlanFormState;
  submitting: boolean;
}) {
  const progress = getPlanProgress(planForm.status);
  const selectedMemberKnown = planForm.managerId ? members.some((member) => member.userId === planForm.managerId) : true;
  return (
    <Card className="sticky top-0 min-h-[calc(100vh-128px)] overflow-hidden rounded-none border-0 border-l border-[#e4ebf5] bg-white p-0 shadow-[-14px_0_30px_rgba(24,39,75,0.055)]">
      <div className="flex h-14 items-center justify-between px-5">
        <div className="text-base font-bold text-[#111c33]">{editingPlanId === null ? '新增计划' : '编辑计划'}</div>
        <button
          aria-label="关闭计划表单"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#8da0bd] transition hover:bg-[#f3f7fc] hover:text-[#263653]"
          onClick={onCancel}
          type="button"
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>
      <form
        className="space-y-4 px-5 pb-5 pt-2"
        onSubmit={(event: { preventDefault: () => void }) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Field label="计划类型">
          <select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange((current) => ({ ...current, planType: event.target.value }))} value={planForm.planType}>
            <option value="MONTH">月计划</option>
            <option value="WEEK">周计划</option>
            <option value="DAY">日计划</option>
          </select>
        </Field>
        <Field label="所属周期">
          <input className="field-input" onChange={(event: ChangeEvent<HTMLInputElement>) => onChange((current) => ({ ...current, planPeriod: event.target.value }))} placeholder="例如：2024 第18周（4.29 - 5.5）" value={planForm.planPeriod} />
        </Field>
        <Field label="计划目标 *">
          <input className="field-input" maxLength={200} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange((current) => ({ ...current, planContent: event.target.value }))} placeholder="请输入计划目标" value={planForm.planContent} />
        </Field>
        <Field label="负责人 *">
          <select
            className="field-input"
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const selectedMember = members.find((member) => member.userId === event.target.value);
              onChange((current) => ({
                ...current,
                managerId: event.target.value,
                managerName: selectedMember?.userName ?? '',
              }));
            }}
            value={planForm.managerId}
          >
            <option value="">请选择负责人</option>
            {!selectedMemberKnown ? <option value={planForm.managerId}>{planForm.managerName || planForm.managerId}</option> : null}
            {members.map((member) => <option key={member.userId} value={member.userId}>{member.userName}{member.roleName ? `（${member.roleName}）` : ''}</option>)}
          </select>
        </Field>
        <Field label="计划进度">
          <input className="field-input bg-[#f8fbff]" disabled value={`${progress} %`} />
        </Field>
        <Field label="状态 *">
          <select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange((current) => ({ ...current, status: event.target.value }))} value={planForm.status}>
            <option value="DRAFT">未开始</option>
            <option value="PENDING">待推进</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">已完成</option>
          </select>
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="h-9 min-w-[80px] rounded-md border border-[#d9e3f1] bg-white px-4 text-sm font-semibold text-[#5e7291] transition hover:border-[#b8c9e2] hover:text-[#263653]"
            onClick={onCancel}
            type="button"
          >
            取消
          </button>
          <button
            className="h-9 min-w-[96px] rounded-md bg-[#1f7cff] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.22)] transition hover:bg-[#176df0] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </Card>
  );
}

function PlanItemFormAside({
  availableTasks,
  currentPlan,
  currentPlanItemsCount,
  editingPlanItemId,
  members,
  nodes,
  onCancel,
  onChange,
  onSubmit,
  planItemForm,
  submitting,
  tasks,
}: {
  availableTasks: PlanLogPageProps['tasks'];
  currentPlan: PlanLogPlan | null;
  currentPlanItemsCount: number;
  editingPlanItemId: number | null;
  members: PlanLogPageProps['members'];
  nodes: PlanLogPageProps['nodes'];
  onCancel: () => void;
  onChange: (updater: (current: PlanItemFormState) => PlanItemFormState) => void;
  onSubmit: () => void;
  planItemForm: PlanItemFormState;
  submitting: boolean;
  tasks: PlanLogPageProps['tasks'];
}) {
  return (
    <Card className="sticky top-0 min-h-[calc(100vh-128px)] overflow-hidden rounded-none border-0 border-l border-[#e4ebf5] bg-white p-0 shadow-[-14px_0_30px_rgba(24,39,75,0.055)]">
      <div className="flex h-14 items-center justify-between px-5">
        <div>
          <div className="text-base font-bold text-[#111c33]">
            {editingPlanItemId === null ? '新增计划明细' : '编辑计划明细'}
          </div>
          {currentPlan ? (
            <div className="mt-0.5 text-xs font-medium text-[#8da0bd]">
              {currentPlanItemsCount}
              {' '}
              条明细
            </div>
          ) : null}
        </div>
        <button
          aria-label="关闭计划明细表单"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#8da0bd] transition hover:bg-[#f3f7fc] hover:text-[#263653]"
          onClick={onCancel}
          type="button"
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>
      {currentPlan ? (
        <form
          className="space-y-4 px-5 pb-5 pt-2"
          onSubmit={(event: { preventDefault: () => void }) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="rounded-md border border-[#e4ebf5] bg-[#f8fbff] px-3 py-2 text-xs font-medium leading-5 text-[#526681]">
            当前计划：
            {currentPlan.planContent || '--'}
          </div>
          <Field label="计划日期">
            <input
              className="field-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange((current) => ({
                ...current,
                planDate: event.target.value,
                weekDay: resolveWeekDayLabel(event.target.value),
              }))}
              type="date"
              value={planItemForm.planDate}
            />
          </Field>
          <Field label="星期">
            <input className="field-input" disabled value={planItemForm.weekDay || '--'} />
          </Field>
          <Field label="责任人">
            <select
              className="field-input"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange((current) => ({
                ...current,
                assigneeId: event.target.value,
              }))}
              value={planItemForm.assigneeId}
            >
              <option value="">未指定</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.userName}
                  {member.roleName ? `（${member.roleName}）` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="状态">
            <select
              className="field-input"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange((current) => ({
                ...current,
                status: event.target.value,
              }))}
              value={planItemForm.status}
            >
              <option value="DRAFT">草稿</option>
              <option value="PENDING">待执行</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="COMPLETED">已完成</option>
            </select>
          </Field>
          <Field label="关联节点">
            <select
              className="field-input"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange((current) => ({
                ...current,
                projectNodeId: event.target.value,
                projectTaskId: tasks.some((task) => String(task.id) === current.projectTaskId && String(task.projectNodeId ?? '') === event.target.value) ? current.projectTaskId : '',
              }))}
              value={planItemForm.projectNodeId}
            >
              <option value="">未关联</option>
              {nodes.map((node) => (
                <option key={node.id} value={String(node.id)}>{node.nodeName}</option>
              ))}
            </select>
          </Field>
          <Field label="关联任务">
            <select
              className="field-input"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const matchedTask = tasks.find((task) => String(task.id) === event.target.value);
                onChange((current) => ({
                  ...current,
                  projectNodeId: matchedTask?.projectNodeId ? String(matchedTask.projectNodeId) : current.projectNodeId,
                  projectTaskId: event.target.value,
                }));
              }}
              value={planItemForm.projectTaskId}
            >
              <option value="">未关联</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={String(task.id)}>{task.taskTitle}</option>
              ))}
            </select>
          </Field>
          <Field label="协助部门">
            <input
              className="field-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange((current) => ({
                ...current,
                helpDept: event.target.value,
              }))}
              value={planItemForm.helpDept}
            />
          </Field>
          <Field label="明细内容">
            <textarea
              className="field-textarea"
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange((current) => ({
                ...current,
                planContent: event.target.value,
              }))}
              rows={4}
              value={planItemForm.planContent}
            />
          </Field>
          <Field label="完成要求">
            <textarea
              className="field-textarea"
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange((current) => ({
                ...current,
                planRequirement: event.target.value,
              }))}
              rows={3}
              value={planItemForm.planRequirement}
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="h-9 min-w-[80px] rounded-md border border-[#d9e3f1] bg-white px-4 text-sm font-semibold text-[#5e7291] transition hover:border-[#b8c9e2] hover:text-[#263653]"
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
            <button
              className="h-9 min-w-[96px] rounded-md bg-[#1f7cff] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.22)] transition hover:bg-[#176df0] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? '保存中...' : editingPlanItemId === null ? '新增明细' : '保存明细'}
            </button>
          </div>
        </form>
      ) : (
        <div className="px-5 pb-5 pt-2">
          <div className="rounded-lg border border-dashed border-[#d9e3f1] px-4 py-6 text-center text-sm font-medium text-[#8da0bd]">
            请先在左侧选择一个计划，再维护计划明细。
          </div>
        </div>
      )}
    </Card>
  );
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
  const [planPanelOpen, setPlanPanelOpen] = useState(true);
  const [planItemFormOpen, setPlanItemFormOpen] = useState(false);
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
    if (editingPlanId === null && !planPanelOpen) setPlanForm(buildPlanForm(null, selectedProject));
  }, [editingPlanId, planPanelOpen, selectedProject]);

  useEffect(() => {
    if (editingPlanItemId === null) setPlanItemForm(buildPlanItemForm(null, tasks));
  }, [editingPlanItemId, tasks]);

  useEffect(() => {
    if (editingReportId === null) setReportForm(buildReportForm(null, selectedProject, currentUserId, currentUserName));
  }, [currentUserId, currentUserName, editingReportId, selectedProject]);

  useEffect(() => {
    if (editingPlanItemId !== null && !currentPlanItems.some((item) => item.id === editingPlanItemId)) {
      setEditingPlanItemId(null);
      setPlanItemFormOpen(false);
      setPlanItemForm(buildPlanItemForm(null, tasks));
    }
  }, [currentPlanItems, editingPlanItemId, tasks]);

  async function handlePlanSubmit() {
    if (!selectedProject) return pushToast({ message: '请先选择项目。', tone: 'danger' });
    if (!planForm.planContent.trim()) return pushToast({ message: '请先填写计划目标。', tone: 'danger' });
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
      setPlanPanelOpen(true);
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
      setPlanItemFormOpen(false);
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

  function beginCreatePlan(planType: string) {
    setEditingPlanId(null);
    setEditingPlanItemId(null);
    setPlanItemFormOpen(false);
    setPlanForm({ ...buildPlanForm(null, selectedProject), planType });
    setPlanPanelOpen(true);
  }

  function selectPlan(planId: number) {
    setActivePlanId(planId);
    setEditingPlanItemId(null);
    setPlanItemFormOpen(false);
    setPlanItemForm(buildPlanItemForm(null, tasks));
  }

  function beginEditPlan(plan: PlanLogPlan) {
    setActivePlanId(plan.id);
    setEditingPlanId(plan.id);
    setEditingPlanItemId(null);
    setPlanItemFormOpen(false);
    setPlanForm(buildPlanForm(plan, selectedProject));
    setPlanPanelOpen(true);
  }

  function closePlanPanel() {
    setPlanPanelOpen(false);
    setEditingPlanId(null);
    setEditingPlanItemId(null);
    setPlanItemFormOpen(false);
    setPlanForm(buildPlanForm(null, selectedProject));
    setPlanItemForm(buildPlanItemForm(null, tasks));
  }

  function closePlanItemPanel() {
    setEditingPlanItemId(null);
    setPlanItemFormOpen(false);
    setPlanItemForm(buildPlanItemForm(null, tasks));
    setPlanPanelOpen(true);
  }

  function beginCreatePlanItem() {
    setEditingPlanItemId(null);
    setPlanItemForm(buildPlanItemForm(null, tasks));
    setPlanItemFormOpen(true);
    setPlanPanelOpen(true);
  }

  function beginEditPlanItem(item: PlanLogPlanItem) {
    setActivePlanId(item.projectPlanId);
    setEditingPlanItemId(item.id);
    setPlanItemForm(buildPlanItemForm(item, tasks));
    setPlanItemFormOpen(true);
    setPlanPanelOpen(true);
  }

  function getPlanPeriodLabel(items: PlanLogPlan[], fallback: string) {
    return items[0] ? formatPlanWindow(items[0]) : fallback;
  }

  function getPlanTaskSummary(plan: PlanLogPlan) {
    const itemCount = planItemCountMap.get(plan.id) ?? 0;
    const firstItem = planItemsByPlanId[plan.id]?.[0];
    if (firstItem?.planContent) return firstItem.planContent;
    return itemCount ? `${itemCount} 项计划明细` : '暂未拆解明细';
  }

  if (!selectedProject) {
    return <div className="flex h-full items-center justify-center bg-[#f3f6fb]"><Card className="w-full max-w-lg rounded-lg border border-[#e4ebf5] bg-white p-8 text-center shadow-[0_12px_28px_rgba(24,39,75,0.05)]"><div className="text-xl font-bold text-[#111c33]">计划与日志</div><div className="mt-3 text-sm leading-7 text-[#5e7291]">请先在“项目台账”中选择一个项目，再进入当前页面维护计划、日志和附件资料。</div></Card></div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f8fc]">
      <div className="shrink-0">
        <div className="flex items-start justify-between gap-4 pb-3">
          <div>
            <div className="text-xl font-bold leading-7 text-[#111c33]">计划与日志</div>
            <div className="mt-1 text-sm font-medium text-[#5e7291]">月/周/日计划、计划明细、日志总结与附件资料</div>
          </div>
          {tab === 'plan' && !planPanelOpen ? <SectionActionButton onClick={() => beginCreatePlan('WEEK')}>新增计划</SectionActionButton> : null}
        </div>
        <div className="flex h-10 items-center gap-3 border-b border-[#dfe8f4]">
          <TabButton active={tab === 'plan'} label={`计划填报 (${plans.length})`} onClick={() => setTab('plan')} />
          <TabButton active={tab === 'report'} label="日志 / 总结" onClick={() => setTab('report')} />
          <TabButton active={tab === 'attachments'} label={`附件资料 (${attachments.length})`} onClick={() => setTab('attachments')} />
        </div>
      </div>
      {workspaceError ? <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{workspaceError}</div> : null}
      <div className="min-h-0 flex-1 overflow-auto pt-2">
        {tab === 'plan' ? (
          <div className={cx('grid min-h-0 gap-2', planPanelOpen ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : 'grid-cols-1')}>
            <div className="space-y-2">
              {loading ? <Card className="rounded-lg border border-[#e4ebf5] bg-white p-5 text-sm text-[#7e91b0] shadow-[0_12px_28px_rgba(24,39,75,0.05)]">加载中...</Card> : <>
                {groupedPlans.month.length ? (
                  <PlanTableSection
                    currentPlanId={activePlanId}
                    emptyText="暂无月计划"
                    getTaskSummary={getPlanTaskSummary}
                    items={groupedPlans.month}
                    onEdit={beginEditPlan}
                    onSelect={selectPlan}
                    periodLabel={getPlanPeriodLabel(groupedPlans.month, '暂无月份')}
                    title="月计划"
                    titleColumn="月目标"
                  />
                ) : null}
                <PlanTableSection
                  currentPlanId={activePlanId}
                  emptyText="暂无周计划"
                  getTaskSummary={getPlanTaskSummary}
                  items={groupedPlans.week}
                  onEdit={beginEditPlan}
                  onSelect={selectPlan}
                  periodLabel={getPlanPeriodLabel(groupedPlans.week, '暂无周次')}
                  title="周计划"
                  titleColumn="周目标"
                />
                <PlanTableSection
                  currentPlanId={activePlanId}
                  emptyText="暂无日计划"
                  getTaskSummary={getPlanTaskSummary}
                  items={groupedPlans.day}
                  onEdit={beginEditPlan}
                  onSelect={selectPlan}
                  periodLabel={getPlanPeriodLabel(groupedPlans.day, '暂无日期')}
                  showTaskSummary={false}
                  title="日计划"
                  titleColumn="计划内容"
                />
                {currentPlan ? (
                  <PlanItemTableSection
                    items={currentPlanItems}
                    onCreate={beginCreatePlanItem}
                    onEdit={beginEditPlanItem}
                    planTitle={`${currentPlan.planContent || '--'} / ${formatPlanWindow(currentPlan)}`}
                  />
                ) : (
                  <EmptyPanel title="计划明细待维护" description="先创建或选择一个计划，再在这里维护计划明细、负责人和节点任务关联。" />
                )}
              </>}
            </div>
            {planPanelOpen ? (
              planItemFormOpen ? (
                <PlanItemFormAside
                  availableTasks={availableTasks}
                  currentPlan={currentPlan}
                  currentPlanItemsCount={currentPlanItems.length}
                  editingPlanItemId={editingPlanItemId}
                  members={members}
                  nodes={nodes}
                  onCancel={closePlanItemPanel}
                  onChange={setPlanItemForm}
                  onSubmit={() => { void handlePlanItemSubmit(); }}
                  planItemForm={planItemForm}
                  submitting={planItemSubmitting}
                  tasks={tasks}
                />
              ) : (
                <PlanFormAside
                  editingPlanId={editingPlanId}
                  members={members}
                  onCancel={closePlanPanel}
                  onChange={setPlanForm}
                  onSubmit={() => { void handlePlanSubmit(); }}
                  planForm={planForm}
                  submitting={planSubmitting}
                />
              )
            ) : null}
          </div>
        ) : null}
        {tab === 'report' ? (
          <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-2">
              {loading ? <Card className="rounded-lg border border-[#e4ebf5] bg-white p-5 text-sm text-[#7e91b0] shadow-[0_12px_28px_rgba(24,39,75,0.05)]">加载中...</Card> : <>
                {([
                  ['月总结', groupedReports.month, '暂无月总结'],
                  ['周总结', groupedReports.week, '暂无周总结'],
                  ['日志', groupedReports.day, '暂无日志'],
                ] as const).map(([label, items, emptyText]) => (
                  <ReportTableSection
                    emptyText={emptyText}
                    items={items}
                    key={label}
                    onEdit={(item) => {
                      setEditingReportId(item.id);
                      setReportForm(buildReportForm(item, selectedProject, currentUserId, currentUserName));
                    }}
                    title={label}
                  />
                ))}
              </>}
            </div>
            <Card className="rounded-lg border border-[#e4ebf5] bg-white p-5 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
              <div className="mb-4 text-sm font-bold text-[#263653]">{editingReportId === null ? '新增日志 / 总结' : '编辑日志 / 总结'}</div>
              <div className="space-y-3">
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
                <label className="flex items-center gap-3 rounded-md border border-[#d9e3f1] bg-[#f8fbff] px-4 py-2.5 text-sm font-medium text-[#263653]"><input checked={reportForm.delayFlag} className="h-4 w-4 rounded border-[#b8c9e2] text-[#1f7cff]" onChange={(event: ChangeEvent<HTMLInputElement>) => setReportForm((current) => ({ ...current, delayFlag: event.target.checked }))} type="checkbox" />本次填报包含延期说明</label>
                {reportForm.delayFlag ? <Field label="延期原因"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReportForm((current) => ({ ...current, delayReason: event.target.value }))} rows={3} value={reportForm.delayReason} /></Field> : null}
                <Button className="h-9 w-full justify-center rounded-md bg-[#1f7cff] text-sm font-semibold shadow-[0_8px_18px_rgba(31,124,255,0.22)] hover:bg-[#176df0]" disabled={reportSubmitting} onClick={() => { void handleReportSubmit(); }}>{reportSubmitting ? '提交中...' : editingReportId === null ? '新增日志 / 总结' : '保存日志 / 总结'}</Button>
              </div>
            </Card>
          </div>
        ) : null}
        {tab === 'attachments' ? (
          <div className="grid gap-2 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="rounded-lg border border-[#e4ebf5] bg-white p-5 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
              <div className="mb-4 text-sm font-bold text-[#263653]">上传附件</div>
              <div className="space-y-3">
                <Field label="上传人"><input className="field-input" disabled value={currentUserName || '未识别当前登录人'} /></Field>
                <Field label="附件分类"><select className="field-input" onChange={(event: ChangeEvent<HTMLSelectElement>) => setAttachmentForm((current) => ({ ...current, fileCategory: event.target.value }))} value={attachmentForm.fileCategory}><option value="MILESTONE">里程碑</option><option value="DELIVERABLE">交付件</option><option value="CONTRACT">合同</option><option value="REPORT">报告</option><option value="OTHER">其他</option></select></Field>
                <Field label="选择文件"><input className="field-input h-auto py-2 file:mr-4 file:rounded-md file:border-0 file:bg-[#edf4ff] file:px-3 file:py-2 file:text-[#1f65e8]" onChange={(event: ChangeEvent<HTMLInputElement>) => setAttachmentForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} type="file" /></Field>
                <Field label="备注"><textarea className="field-textarea" onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAttachmentForm((current) => ({ ...current, remark: event.target.value }))} rows={3} value={attachmentForm.remark} /></Field>
                <Button className="h-9 w-full justify-center rounded-md bg-[#1f7cff] text-sm font-semibold shadow-[0_8px_18px_rgba(31,124,255,0.22)] hover:bg-[#176df0]" disabled={attachmentSubmitting || !currentUserId || !currentUserName} onClick={() => { void handleAttachmentUpload(); }}>{attachmentSubmitting ? '上传中...' : '上传附件'}</Button>
              </div>
            </Card>
            {loading ? (
              <Card className="rounded-lg border border-[#e4ebf5] bg-white p-5 text-sm text-[#7e91b0] shadow-[0_10px_24px_rgba(24,39,75,0.045)]">加载中...</Card>
            ) : (
              <AttachmentTableSection
                attachments={attachments}
                onDelete={(attachment) => { void handleAttachmentDelete(attachment); }}
                onDownload={(attachment) => {
                  void downloadProjectAttachment(attachment, selectedProject.id).catch((error: unknown) => pushToast({ message: normalizeErrorMessage(error), tone: 'danger' }));
                }}
              />
            )}
          </div>
        ) : null}
      </div>
      <style>{`.field-input{display:flex;height:36px;width:100%;border-radius:6px;border:1px solid #d9e3f1;background:#fff;padding:0 12px;font-size:14px;color:#263653;outline:none;transition:border-color .15s,box-shadow .15s}.field-input:focus{border-color:#1f7cff;box-shadow:0 0 0 2px #dceaff}.field-input:disabled{background:#f6f9fd;color:#7e91b0}.field-textarea{display:flex;width:100%;min-height:72px;resize:vertical;border-radius:6px;border:1px solid #d9e3f1;background:#fff;padding:8px 12px;font-size:14px;line-height:24px;color:#263653;outline:none;transition:border-color .15s,box-shadow .15s}.field-textarea:focus{border-color:#1f7cff;box-shadow:0 0 0 2px #dceaff}`}</style>
    </div>
  );
}
