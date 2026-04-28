import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  ListTodo,
  Save,
  Search,
  SendHorizontal,
  SlidersHorizontal,
} from 'lucide-react';

import { Badge, Card, cx } from '@lserp/ui';

import { getProjectStatusLabel, getProjectStatusTone } from '../../project-display';
import { useProjectToast } from '../../project-toast';
import type {
  TaskFormState,
  TaskSubmissionPageProps,
  TaskSubmissionTask,
} from './task-submission-types';
import {
  formatDateTime,
  normalizeErrorMessage,
  toForm,
  toLocalDateTimeString,
  toNullableNumber,
} from './task-submission-utils';

const TASK_STATUS_FILTERS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'NOT_STARTED', label: '未开始' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'PAUSED', label: '已暂停' },
];

function clampProgress(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function getProgressTone(value: number) {
  if (value >= 100) return 'bg-[#12b981]';
  if (value >= 50) return 'bg-[#1f7cff]';
  if (value > 0) return 'bg-[#ff8a00]';
  return 'bg-[#d8e2f0]';
}

function StatItem({
  colorClass,
  delta,
  deltaTone = 'text-[#14c59a]',
  icon,
  label,
  valueClass = 'text-[#111c33]',
  value,
}: {
  colorClass: string;
  delta: string;
  deltaTone?: string;
  icon: ReactNode;
  label: string;
  valueClass?: string;
  value: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 px-5 py-4">
      <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg shadow-[0_8px_18px_rgba(37,99,235,0.08)]', colorClass)}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-5 text-[#5e7291]">{label}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={cx('text-[30px] font-bold leading-none', valueClass)}>{value}</span>
          <span className="text-sm font-medium text-[#8da0bd]">项</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[#7e91b0]">
          <span>较昨日</span>
          <span className={deltaTone}>{delta}</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  children,
  label,
  suffix,
}: {
  children: ReactNode;
  label: string;
  suffix?: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#5e7291]">{label}</span>
        {suffix}
      </div>
      {children}
    </label>
  );
}

function ProgressBar({ value }: { value: number }) {
  const progress = clampProgress(value);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#e9eff8]">
        <div
          className={cx('h-full rounded-full transition-all duration-200', getProgressTone(progress))}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="w-11 shrink-0 text-right text-sm font-medium text-[#263653]">{progress}%</span>
    </div>
  );
}

function TaskHeroIllustration() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-[52%] hidden w-[360px] -translate-x-1/2 items-center justify-center lg:flex">
      <div className="relative h-[118px] w-[330px]">
        <div className="absolute left-[70px] top-[32px] h-14 w-14 rounded-full bg-[#d9e9ff] opacity-80" />
        <div className="absolute right-[72px] top-[20px] h-20 w-20 rounded-full bg-[#eef5ff]" />
        <div className="absolute left-[82px] top-[42px] h-12 w-10 -rotate-12 rounded-lg bg-[#dbe9ff] opacity-80" />
        <div className="absolute right-[94px] top-[36px] h-14 w-11 rotate-12 rounded-lg bg-[#dbe9ff] opacity-75" />
        <div className="absolute left-1/2 bottom-1 h-7 w-[158px] -translate-x-1/2 rounded-full bg-[#b9d4ff] opacity-35 blur-sm" />
        <div className="absolute left-1/2 top-[16px] flex h-[92px] w-[72px] -translate-x-1/2 items-center justify-center rounded-[10px] border border-[#98c2ff] bg-white shadow-[0_18px_34px_rgba(42,111,255,0.24)]">
          <div className="absolute -top-4 left-1/2 flex h-8 w-11 -translate-x-1/2 items-center justify-center rounded-md bg-[#2f80ff] text-white shadow-[0_10px_24px_rgba(47,128,255,0.32)]">
            <ClipboardList size={20} strokeWidth={2} />
          </div>
          <div className="mt-3 w-full space-y-2 px-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e8f2ff] text-[#2f80ff] shadow-[inset_0_0_0_1px_rgba(47,128,255,0.12)]">
                  <Check size={11} strokeWidth={2.2} />
                </span>
                <span className="h-2 flex-1 rounded-full bg-[#dbe9ff]" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute right-[92px] top-[55px] flex h-9 w-9 items-center justify-center rounded-full bg-[#2f80ff] text-white shadow-[0_10px_24px_rgba(47,128,255,0.32)]">
          <Check size={20} strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
}

function isPendingTask(task: TaskSubmissionTask) {
  const status = (task.status ?? 'NOT_STARTED').toUpperCase();
  return status === 'NOT_STARTED' || status === 'PAUSED';
}

export function ProjectTaskSubmissionPage({
  detailLoading,
  onUpdateTaskStatus,
  selectedProject,
  tasks,
}: TaskSubmissionPageProps) {
  const { pushToast } = useProjectToast();
  const [keyword, setKeyword] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(tasks[0]?.id ?? null);
  const [form, setForm] = useState<TaskFormState>(toForm(tasks[0] ?? null));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredTasks = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    let nextTasks = tasks;

    if (statusFilter !== 'ALL') {
      nextTasks = nextTasks.filter((task) => (task.status ?? 'NOT_STARTED').toUpperCase() === statusFilter);
    }

    if (!search) return nextTasks;

    return nextTasks.filter((task) =>
      `${task.taskTitle} ${task.responsibleName ?? ''} ${task.status ?? ''}`.toLowerCase().includes(search),
    );
  }, [keyword, statusFilter, tasks]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const counts = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(isPendingTask).length;
    const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  useEffect(() => {
    if (!tasks.length) {
      setSelectedTaskId(null);
      setForm(toForm(null));
      return;
    }
    setSelectedTaskId((current) =>
      current && tasks.some((task) => task.id === current) ? current : tasks[0]?.id ?? null,
    );
  }, [tasks]);

  useEffect(() => {
    setForm(toForm(selectedTask));
  }, [selectedTask]);

  async function submitTask(
    task: TaskSubmissionTask,
    payload: {
      actualEndTime: string | null;
      actualStartTime: string | null;
      progressRate: number | null;
      status: string | null;
    },
  ) {
    if (!selectedProject) {
      pushToast({ message: '请先选择项目。', tone: 'danger' });
      return;
    }

    setSubmitting(true);
    try {
      await onUpdateTaskStatus(selectedProject.id, task.id, {
        actualEndTime: payload.actualEndTime,
        actualStartTime: payload.actualStartTime,
        auditStatus: task.auditStatus ?? null,
        checkStatus: task.checkStatus ?? null,
        finishDesc: form.finishDesc.trim() || null,
        planEndTime: task.planEndTime ?? null,
        planStartTime: task.planStartTime ?? null,
        progressRate: payload.progressRate,
        remark: form.remark.trim() || null,
        status: payload.status,
      });

      pushToast({
        message: payload.status === 'COMPLETED' ? '任务完成说明已提交。' : '任务填报已保存。',
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        message: normalizeErrorMessage(error),
        tone: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcceptTask() {
    if (!selectedTask) {
      pushToast({ message: '请先选择任务。', tone: 'danger' });
      return;
    }
    await submitTask(selectedTask, {
      actualEndTime: selectedTask.actualEndTime ?? null,
      actualStartTime: selectedTask.actualStartTime ?? toLocalDateTimeString(new Date()),
      progressRate: selectedTask.progressRate ?? 0,
      status: 'IN_PROGRESS',
    });
  }

  async function handleSaveTask() {
    if (!selectedTask) {
      pushToast({ message: '请先选择任务。', tone: 'danger' });
      return;
    }
    const progressRate = toNullableNumber(form.progressRate);
    if (progressRate != null && (progressRate < 0 || progressRate > 100)) {
      pushToast({ message: '进度必须在 0 到 100 之间。', tone: 'danger' });
      return;
    }
    await submitTask(selectedTask, {
      actualEndTime: selectedTask.actualEndTime ?? null,
      actualStartTime: selectedTask.actualStartTime ?? null,
      progressRate,
      status: form.status.trim() || selectedTask.status || 'NOT_STARTED',
    });
  }

  async function handleCompleteTask() {
    if (!selectedTask) {
      pushToast({ message: '请先选择任务。', tone: 'danger' });
      return;
    }
    if (!form.finishDesc.trim()) {
      pushToast({ message: '请先填写完成说明。', tone: 'danger' });
      return;
    }
    await submitTask(selectedTask, {
      actualEndTime: toLocalDateTimeString(new Date()),
      actualStartTime: selectedTask.actualStartTime ?? toLocalDateTimeString(new Date()),
      progressRate: 100,
      status: 'COMPLETED',
    });
  }

  if (!selectedProject) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f5f8fc] p-5">
        <Card className="w-full max-w-lg rounded-lg border border-[#e4ebf5] bg-white p-5 text-center shadow-[0_14px_34px_rgba(24,39,75,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#edf4ff] text-[#1f7cff]">
            <ClipboardCheck size={28} strokeWidth={1.9} />
          </div>
          <div className="mt-4 text-xl font-bold text-[#111c33]">任务填报</div>
          <div className="mt-3 text-sm leading-6 text-[#5e7291]">
            请先在项目台账中选择一个项目，再进入当前页面进行任务接收和完成说明填报。
          </div>
        </Card>
      </div>
    );
  }

  const activeProgress = toNullableNumber(form.progressRate) ?? selectedTask?.progressRate ?? 0;
  const progress = clampProgress(activeProgress);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-[#f5f8fc]">
      <div className="relative min-h-[122px] overflow-hidden rounded-lg border border-[#e8eff8] bg-[linear-gradient(96deg,#ffffff_0%,#f7fbff_38%,#eaf3ff_100%)] px-5 shadow-[0_14px_34px_rgba(24,39,75,0.06)]">
        <TaskHeroIllustration />
        <div className="relative z-10 flex h-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6f4cff,#8d35ff)] text-white shadow-[0_12px_22px_rgba(112,72,255,0.32)]">
              <ClipboardCheck size={24} strokeWidth={1.9} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-7 text-[#111c33]">任务填报</h1>
              <p className="mt-1 text-xs font-medium leading-5 text-[#5e7291]">接收任务、填报进度、填写完成说明</p>
            </div>
          </div>
          <div className="hidden h-9 max-w-[260px] shrink-0 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-[#1f65e8] shadow-[0_10px_26px_rgba(31,101,232,0.12)] md:flex">
            <span className="h-2 w-2 rounded-full bg-[#1f7cff]" />
            <span className="truncate">{selectedProject.projectName}</span>
            <ChevronDown size={14} strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-0 flex-col gap-2">
          <Card className="rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_12px_28px_rgba(24,39,75,0.05)]">
            <div className="grid divide-y divide-[#edf2f8] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
              <StatItem
                colorClass="bg-[#edf4ff] text-[#1f7cff]"
                delta="+1"
                icon={<ListTodo size={24} strokeWidth={1.9} />}
                label="任务总数"
                value={counts.total}
              />
              <StatItem
                colorClass="bg-[#edf4ff] text-[#1f7cff]"
                delta="0"
                deltaTone="text-[#7e91b0]"
                icon={<Clock3 size={24} strokeWidth={1.9} />}
                label="进行中"
                valueClass="text-[#1f7cff]"
                value={counts.inProgress}
              />
              <StatItem
                colorClass="bg-[#fff3e8] text-[#ff7a00]"
                delta="+1"
                icon={<AlertTriangle size={24} strokeWidth={1.9} />}
                label="待跟进"
                valueClass="text-[#ff7a00]"
                value={counts.pending}
              />
              <StatItem
                colorClass="bg-[#e9fbf3] text-[#10b981]"
                delta="+1"
                icon={<CheckCircle2 size={24} strokeWidth={1.9} />}
                label="已完成"
                valueClass="text-[#10b981]"
                value={counts.completed}
              />
            </div>
          </Card>

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_12px_28px_rgba(24,39,75,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2f8] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-base font-bold text-[#111c33]">我的任务</span>
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-[#d8e6fa] bg-[#f3f8ff] px-2 text-sm font-semibold text-[#1f65e8]">
                  {filteredTasks.length}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8da0bd]"
                    size={16}
                    strokeWidth={1.8}
                  />
                  <input
                    className="h-9 w-[240px] rounded-md border border-[#d9e3f1] bg-white pl-9 pr-3 text-sm text-[#263653] outline-none transition placeholder:text-[#9badc6] focus:border-[#1f7cff] focus:ring-2 focus:ring-[#dceaff]"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
                    placeholder="搜索任务名称"
                    value={keyword}
                  />
                </div>
                <div className="relative">
                  <button
                    aria-expanded={isStatusFilterOpen}
                    aria-label="任务状态筛选"
                    className={cx(
                      'relative flex h-9 w-9 items-center justify-center rounded-md border bg-white text-[#6f83a3] shadow-[0_2px_5px_rgba(15,23,42,0.03)] transition hover:border-[#b8c9e2] hover:text-[#1f65e8] focus:border-[#1f7cff] focus:outline-none focus:ring-2 focus:ring-[#dceaff]',
                      statusFilter === 'ALL' ? 'border-[#d9e3f1]' : 'border-[#9ec5ff] bg-[#f3f8ff] text-[#1f65e8]',
                    )}
                    onClick={() => setIsStatusFilterOpen((open) => !open)}
                    title="筛选"
                    type="button"
                  >
                    <SlidersHorizontal size={16} strokeWidth={1.9} />
                    {statusFilter !== 'ALL' ? (
                      <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#1f7cff]" />
                    ) : null}
                  </button>
                  {isStatusFilterOpen ? (
                    <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-32 overflow-hidden rounded-md border border-[#d9e3f1] bg-white py-1 shadow-[0_10px_28px_rgba(24,39,75,0.12)]">
                      {TASK_STATUS_FILTERS.map((filter) => {
                        const isActive = statusFilter === filter.value;
                        return (
                          <button
                            className={cx(
                              'flex h-8 w-full items-center justify-between px-3 text-left text-sm font-medium transition',
                              isActive ? 'bg-[#edf4ff] text-[#1f65e8]' : 'text-[#263653] hover:bg-[#f6f9fd]',
                            )}
                            key={filter.value}
                            onClick={() => {
                              setStatusFilter(filter.value);
                              setIsStatusFilterOpen(false);
                            }}
                            type="button"
                          >
                            <span>{filter.label}</span>
                            {isActive ? <Check size={14} strokeWidth={2} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead className="sticky top-0 z-10 bg-[#f8fbff]">
                  <tr className="text-left text-sm font-medium text-[#6b7f9e]">
                    <th className="px-5 py-4">任务标题</th>
                    <th className="px-4 py-4">状态</th>
                    <th className="px-4 py-4">进度</th>
                    <th className="px-4 py-4">截止时间</th>
                    <th className="px-5 py-4">负责人</th>
                  </tr>
                </thead>
                <tbody>
                  {detailLoading ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-sm text-[#7e91b0]" colSpan={5}>
                        加载中...
                      </td>
                    </tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-sm font-medium text-[#7e91b0]" colSpan={5}>
                        暂无可填报任务
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isSelected = task.id === selectedTaskId;
                      const rowProgress = clampProgress(task.progressRate);

                      return (
                        <tr
                          key={task.id}
                          className={cx(
                            'group cursor-pointer border-t border-[#edf2f8] transition-colors duration-150',
                            isSelected ? 'bg-[#f4f0ff]' : 'bg-white hover:bg-[#f8fbff]',
                          )}
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={cx(
                                  'h-2.5 w-2.5 shrink-0 rounded-full',
                                  isSelected ? 'bg-[#7b3ff2]' : 'bg-[#c7d4e6]',
                                )}
                              />
                              <span className="truncate text-sm font-semibold text-[#1b2842]">{task.taskTitle}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge tone={getProjectStatusTone(task.status)}>
                              {getProjectStatusLabel(task.status ?? 'NOT_STARTED')}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <ProgressBar value={rowProgress} />
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-[#526681]">
                            {formatDateTime(task.planEndTime)}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#263653]">
                            {task.responsibleName || '--'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#edf2f8] px-5 py-3">
              <button
                aria-label="上一页"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d9e3f1] text-[#8da0bd] disabled:opacity-60"
                disabled
                type="button"
              >
                <ChevronLeft size={16} strokeWidth={1.8} />
              </button>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-md border border-[#1f7cff] bg-[#eef5ff] px-2 text-sm font-semibold text-[#1f65e8]">
                1
              </span>
              <button
                aria-label="下一页"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d9e3f1] text-[#8da0bd] disabled:opacity-60"
                disabled
                type="button"
              >
                <ChevronRight size={16} strokeWidth={1.8} />
              </button>
            </div>
          </Card>
        </div>

        <Card className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_12px_28px_rgba(24,39,75,0.05)]">
          {!selectedTask ? (
            <div className="flex min-h-[320px] flex-1 items-center justify-center px-5 py-8">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#edf4ff] text-[#1f7cff]">
                  <ClipboardCheck size={28} strokeWidth={1.9} />
                </div>
                <div className="mt-4 text-sm font-semibold text-[#5e7291]">选择左侧任务后再进行填报操作</div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="px-5 pt-4">
                <div className="text-sm font-medium text-[#7e91b0]">当前任务</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 flex-1 text-xl font-bold leading-7 text-[#111c33]">{selectedTask.taskTitle}</h2>
                  <Badge tone={getProjectStatusTone(selectedTask.status)}>
                    {getProjectStatusLabel(selectedTask.status ?? 'NOT_STARTED')}
                  </Badge>
                </div>
                <div className="mt-2 inline-flex h-7 max-w-full items-center rounded-full bg-[#f2f6fb] px-3 text-sm font-medium text-[#5e7291]">
                  {selectedTask.responsibleName ? `负责人：${selectedTask.responsibleName}` : '暂无负责人'}
                </div>
              </div>

              <div className="mx-5 mt-3 space-y-2 rounded-lg bg-[#f7faff] p-3">
                {[
                  ['计划开始', formatDateTime(selectedTask.planStartTime)],
                  ['计划结束', formatDateTime(selectedTask.planEndTime)],
                  ['实际开始', formatDateTime(selectedTask.actualStartTime)],
                  ['完成时间', formatDateTime(selectedTask.actualEndTime)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-[#7e91b0]">{label}</span>
                    <span className="text-right font-semibold text-[#263653]">{value}</span>
                  </div>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-auto px-5 pb-3 pt-3">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#5e7291]">当前进度</span>
                    <div className="flex items-center gap-2">
                      <input
                        className="h-8 w-20 rounded-md border border-[#d9e3f1] bg-white px-3 text-right text-sm font-semibold text-[#263653] outline-none transition focus:border-[#1f7cff] focus:ring-2 focus:ring-[#dceaff]"
                        max={100}
                        min={0}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setForm((current) => ({ ...current, progressRate: event.target.value }))}
                        placeholder="0"
                        type="number"
                        value={form.progressRate}
                      />
                      <span className="text-sm font-semibold text-[#5e7291]">%</span>
                    </div>
                  </div>
                  <ProgressBar value={progress} />
                </div>

                <div className="mt-3 space-y-3">
                  <Field
                    label="完成说明"
                    suffix={<span className="text-xs font-medium text-[#8da0bd]">{form.finishDesc.length}/500</span>}
                  >
                    <textarea
                      className="min-h-[72px] w-full resize-none rounded-md border border-[#d9e3f1] bg-white px-3 py-2 text-sm leading-6 text-[#263653] outline-none transition placeholder:text-[#9badc6] focus:border-[#1f7cff] focus:ring-2 focus:ring-[#dceaff]"
                      maxLength={500}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        setForm((current) => ({ ...current, finishDesc: event.target.value }))}
                      placeholder="填写当前任务的完成说明、结果说明或进展说明"
                      value={form.finishDesc}
                    />
                  </Field>

                  <Field
                    label="补充备注"
                    suffix={<span className="text-xs font-medium text-[#8da0bd]">{form.remark.length}/500</span>}
                  >
                    <textarea
                      className="min-h-[68px] w-full resize-none rounded-md border border-[#d9e3f1] bg-white px-3 py-2 text-sm leading-6 text-[#263653] outline-none transition placeholder:text-[#9badc6] focus:border-[#1f7cff] focus:ring-2 focus:ring-[#dceaff]"
                      maxLength={500}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        setForm((current) => ({ ...current, remark: event.target.value }))}
                      placeholder="补充执行说明或注意事项"
                      value={form.remark}
                    />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-[#edf2f8] px-5 py-2.5">
                <button
                  className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#d9e3f1] bg-white text-[13px] font-semibold text-[#263653] transition hover:border-[#1f7cff] hover:text-[#1f65e8] disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => { void handleAcceptTask(); }}
                  type="button"
                >
                  <Check size={15} strokeWidth={2} />
                  接收任务
                </button>
                <button
                  className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#d9e3f1] bg-white text-[13px] font-semibold text-[#263653] transition hover:border-[#1f7cff] hover:text-[#1f65e8] disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => { void handleSaveTask(); }}
                  type="button"
                >
                  <Save size={15} strokeWidth={1.9} />
                  保存填报
                </button>
                <button
                  className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#1f7cff] text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.22)] transition hover:bg-[#176df0] disabled:opacity-50"
                  disabled={submitting || !form.finishDesc.trim()}
                  onClick={() => { void handleCompleteTask(); }}
                  type="button"
                >
                  <SendHorizontal size={15} strokeWidth={1.9} />
                  提交完成
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
