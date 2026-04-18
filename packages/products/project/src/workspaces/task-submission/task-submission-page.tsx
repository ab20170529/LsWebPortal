import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';

import { Badge, Button, Card, cx } from '@lserp/ui';

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

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = 'bg-slate-100 text-slate-600' }: { label: string; value: string | number; icon?: ReactNode; color?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      {icon && (
        <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={cx('text-2xl font-bold leading-none mt-1', icon ? color.replace('bg-', 'text-') : 'text-slate-800')}>{value}</p>
      </div>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      {children}
    </label>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 100 ? 'bg-emerald-500' : value >= 50 ? 'bg-sky-500' : value >= 25 ? 'bg-amber-400' : 'bg-slate-300';
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cx('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-bold text-slate-600">{value}%</span>
    </div>
  );
}

// Icon Components
function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 5v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
      <path d="M10 2L2 17h16L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 8v4M10 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.5 10l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: '未开始', tone: 'neutral' as const },
  { value: 'IN_PROGRESS', label: '进行中', tone: 'brand' as const },
  { value: 'COMPLETED', label: '已完成', tone: 'success' as const },
  { value: 'PAUSED', label: '已暂停', tone: 'warning' as const },
];

// ─── Main Component ────────────────────────────────────────────────────────────

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
  const [submitting, setSubmitting] = useState(false);

  const filteredTasks = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return tasks;
    return tasks.filter((task) =>
      `${task.taskTitle} ${task.responsibleName ?? ''} ${task.status ?? ''}`.toLowerCase().includes(search),
    );
  }, [keyword, tasks]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const counts = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'NOT_STARTED' || !t.status).length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
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
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-lg rounded-3xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900">任务填报</div>
          <div className="mt-3 text-sm leading-7 text-slate-500">
            请先在「项目台账」中选择一个项目，再进入当前页面进行任务接收和完成说明填报。
          </div>
          <Button className="mt-6" onClick={() => {}}>
            前往项目台账
          </Button>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.6)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
                <path d="M9 5H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M15 12H9M12 8v8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900">任务填报</div>
              <div className="mt-0.5 text-sm text-slate-500">接收任务、填报进度、填写完成说明</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
            <div className="h-2 w-2 rounded-full bg-violet-500" />
            {selectedProject.projectName}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-6 py-4 xl:grid-cols-4">
        <StatCard label="任务总数" value={counts.total} />
        <StatCard label="进行中" value={counts.inProgress} icon={<ClockIcon />} color="bg-blue-100 text-blue-600" />
        <StatCard label="待跟进" value={counts.pending} icon={<AlertIcon />} color="bg-amber-100 text-amber-600" />
        <StatCard label="已完成" value={counts.completed} icon={<CheckIcon />} color="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Main Content */}
      <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6">
        <div className="flex h-full gap-4">

          {/* Left: Task List */}
          <Card className="flex w-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">我的任务</span>
                <div className="rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                  {filteredTasks.length}
                </div>
              </div>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 20 20">
                  <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M12.5 12.5 16.5 16.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6"/>
                </svg>
                <input
                  className="h-10 w-full min-w-[200px] rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
                  placeholder="搜索任务..."
                  value={keyword}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-5 py-3 pl-6">任务标题</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">进度</th>
                    <th className="px-4 py-3 pr-6">截止时间</th>
                  </tr>
                </thead>
                <tbody>
                  {detailLoading ? (
                    <tr><td className="px-5 py-16 pl-6 text-center text-sm text-slate-400" colSpan={4}>加载中...</td></tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td className="px-5 py-20 pl-6 text-center" colSpan={4}>
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-sm font-semibold text-slate-400">暂无可填报任务</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isSelected = task.id === selectedTaskId;
                      const tone = getProjectStatusTone(task.status);
                      return (
                        <tr
                          key={task.id}
                          className={cx(
                            'group cursor-pointer border-b border-slate-100 transition-all duration-150',
                            isSelected ? 'bg-[#f5f0ff]' : 'hover:bg-slate-50',
                          )}
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <td className="px-4 py-4 pl-6">
                            <div className="flex items-center gap-2.5">
                              <div className={cx(
                                'h-2 w-2 shrink-0 rounded-full transition-all',
                                isSelected ? 'bg-violet-500' : 'bg-slate-300 group-hover:bg-violet-400',
                              )} />
                              <span className={cx(
                                'text-sm font-semibold',
                                isSelected ? 'text-violet-800' : 'text-slate-800',
                              )}>
                                {task.taskTitle}
                              </span>
                            </div>
                            {task.responsibleName && (
                              <div className="mt-1 flex items-center gap-1.5 pl-4.5">
                                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200" />
                                <span className="text-xs text-slate-400">{task.responsibleName}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-semibold">
                              <Badge tone={tone}>
                                {getProjectStatusLabel(task.status ?? 'NOT_STARTED')}
                              </Badge>
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <ProgressBar value={task.progressRate ?? 0} />
                          </td>
                          <td className="px-4 py-4 pr-6">
                            <span className="text-sm text-slate-500">{formatDateTime(task.planEndTime)}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right: Task Detail Form */}
          <Card className="w-[380px] shrink-0 overflow-y-auto rounded-2xl p-6">
            {!selectedTask ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24">
                      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-slate-500">选择左侧任务后<br />再进行填报操作</div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Task Title */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">当前任务</div>
                  <div className="mt-2 text-xl font-black leading-snug tracking-tight text-slate-900">{selectedTask.taskTitle}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={getProjectStatusTone(selectedTask.status)}>
                      {getProjectStatusLabel(selectedTask.status ?? 'NOT_STARTED')}
                    </Badge>
                    <span className="text-sm text-slate-400">
                      {selectedTask.responsibleName ? `负责人：${selectedTask.responsibleName}` : '暂无负责人'}
                    </span>
                  </div>
                </div>

                {/* Time Info */}
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">计划开始</span>
                    <span className="font-semibold text-slate-700">{formatDateTime(selectedTask.planStartTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">计划结束</span>
                    <span className="font-semibold text-slate-700">{formatDateTime(selectedTask.planEndTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">实际开始</span>
                    <span className={cx('font-semibold', selectedTask.actualStartTime ? 'text-emerald-600' : 'text-slate-400')}>
                      {formatDateTime(selectedTask.actualStartTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">完成时间</span>
                    <span className={cx('font-semibold', selectedTask.actualEndTime ? 'text-emerald-600' : 'text-slate-400')}>
                      {formatDateTime(selectedTask.actualEndTime)}
                    </span>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">任务状态</div>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={cx(
                          'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all',
                          form.status === opt.value
                            ? opt.tone === 'success'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : opt.tone === 'brand'
                              ? 'border-sky-300 bg-sky-50 text-sky-700'
                              : opt.tone === 'warning'
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-slate-300 bg-slate-100 text-slate-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                        )}
                        onClick={() => setForm((current) => ({ ...current, status: opt.value }))}
                        type="button"
                      >
                        <span className={cx(
                          'h-1.5 w-1.5 rounded-full',
                          opt.tone === 'success' ? 'bg-emerald-500' : opt.tone === 'brand' ? 'bg-sky-500' : opt.tone === 'warning' ? 'bg-amber-500' : 'bg-slate-300',
                        )} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <Field label="当前进度">
                  <div className="flex items-center gap-3">
                    <input
                      className="field-input flex-1"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setForm((current) => ({ ...current, progressRate: event.target.value }))}
                      placeholder="0 - 100"
                      type="number"
                      min={0}
                      max={100}
                      value={form.progressRate}
                    />
                    <span className="text-sm font-bold text-slate-400">%</span>
                  </div>
                </Field>

                {/* Finish Desc */}
                <Field label="完成说明">
                  <textarea
                    className="field-textarea"
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      setForm((current) => ({ ...current, finishDesc: event.target.value }))}
                    placeholder="填写当前任务的完成说明、结果说明或进展说明"
                    rows={4}
                    value={form.finishDesc}
                  />
                </Field>

                {/* Remark */}
                <Field label="补充备注">
                  <textarea
                    className="field-textarea"
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      setForm((current) => ({ ...current, remark: event.target.value }))}
                    placeholder="补充执行说明或注意事项"
                    rows={3}
                    value={form.remark}
                  />
                </Field>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
                      disabled={submitting}
                      onClick={() => { void handleAcceptTask(); }}
                      type="button"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20">
                        <path d="M5 10l4 4 6-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6"/>
                      </svg>
                      接收任务
                    </button>
                    <button
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                      disabled={submitting}
                      onClick={() => { void handleSaveTask(); }}
                      type="button"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20">
                        <path d="M5 5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 3v2M11 3v2M7 7h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
                      </svg>
                      保存填报
                    </button>
                  </div>
                  <button
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)] transition-all hover:shadow-[0_6px_18px_-4px_rgba(16,185,129,0.65)] active:scale-95 disabled:opacity-50"
                    disabled={submitting || !form.finishDesc.trim()}
                    onClick={() => { void handleCompleteTask(); }}
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20">
                      <path d="M5 10l4 4 6-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
                    </svg>
                    提交完成
                  </button>
                </div>
              </div>
            )}
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
          min-height: 88px;
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
