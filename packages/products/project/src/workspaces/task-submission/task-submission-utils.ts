import type { TaskFormState, TaskSubmissionTask } from './task-submission-types';

export function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return '操作失败，请稍后重试。';
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function toForm(task: TaskSubmissionTask | null): TaskFormState {
  return {
    finishDesc: task?.finishDesc ?? '',
    progressRate: task?.progressRate == null ? '' : String(task.progressRate),
    remark: task?.remark ?? '',
    status: task?.status ?? 'NOT_STARTED',
  };
}

export function toLocalDateTimeString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

export function toNullableNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
