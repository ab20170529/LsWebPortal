import type { ProgressProjectType, ProgressSchedule, ScheduleColor } from './types';

export const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const TOTAL_DAYS = MONTH_LENGTHS.reduce((total, days) => total + days, 0);

export type TimelineDay = {
  day: number;
  index: number;
  label: string;
  month: number;
};

export type TimelineMonthGroup = {
  count: number;
  month: number;
};

function clampMonth(month: number) {
  return Math.max(1, Math.min(12, month));
}

function clampDay(month: number, day: number) {
  const normalizedMonth = clampMonth(month);
  const maxDay = MONTH_LENGTHS[normalizedMonth - 1] ?? 31;
  return Math.max(1, Math.min(maxDay, day));
}

export function createScheduleId() {
  return `slot-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatMonthDay(month: number, day: number) {
  return `${clampMonth(month)}月${clampDay(month, day)}日`;
}

export function toDayIndex(month: number, day: number) {
  const normalizedMonth = clampMonth(month);
  const normalizedDay = clampDay(normalizedMonth, day);
  const daysBeforeMonth = MONTH_LENGTHS.slice(0, normalizedMonth - 1).reduce(
    (total, current) => total + current,
    0,
  );
  return daysBeforeMonth + normalizedDay - 1;
}

export function fromDayIndex(index: number) {
  const normalizedIndex = Math.max(0, Math.min(TOTAL_DAYS - 1, index));
  let remaining = normalizedIndex;

  for (let month = 1; month <= 12; month += 1) {
    const daysInMonth = MONTH_LENGTHS[month - 1] ?? 31;
    if (remaining < daysInMonth) {
      return {
        day: remaining + 1,
        month,
      };
    }
    remaining -= daysInMonth;
  }

  return { day: 31, month: 12 };
}

export function getCurrentMonthDay() {
  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
  };
}

export function getCurrentDayIndex() {
  const current = getCurrentMonthDay();
  return toDayIndex(current.month, current.day);
}

export function getScheduleStartIndex(schedule: ProgressSchedule) {
  return toDayIndex(schedule.startMonth, schedule.startDay);
}

export function getScheduleEndIndex(schedule: ProgressSchedule) {
  return toDayIndex(schedule.endMonth, schedule.endDay);
}

export function getScheduleProgress(schedule: ProgressSchedule, currentDayIndex: number) {
  const start = getScheduleStartIndex(schedule);
  const end = getScheduleEndIndex(schedule);
  const duration = Math.max(1, end - start + 1);
  const progress = ((currentDayIndex - start + 1) / duration) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

export function countTaskTemplates(projectTypes: ProgressProjectType[]) {
  return projectTypes.reduce(
    (total, projectType) =>
      total +
      projectType.nodes.reduce((nodeTotal, node) => nodeTotal + node.tasks.length, 0),
    0,
  );
}

export function countScheduleBlocks(projectTypes: ProgressProjectType[]) {
  return projectTypes.reduce(
    (total, projectType) =>
      total +
      projectType.nodes.reduce(
        (nodeTotal, node) =>
          nodeTotal +
          node.tasks.reduce((taskTotal, task) => taskTotal + task.schedules.length, 0),
        0,
      ),
    0,
  );
}

export function getTimelineRange(projectTypes: ProgressProjectType[]) {
  const indices = projectTypes.flatMap((projectType) =>
    projectType.nodes.flatMap((node) =>
      node.tasks.flatMap((task) =>
        task.schedules.flatMap((schedule) => [
          getScheduleStartIndex(schedule),
          getScheduleEndIndex(schedule),
        ]),
      ),
    ),
  );

  if (indices.length === 0) {
    const current = getCurrentMonthDay();
    const monthStart = toDayIndex(current.month, 1);
    const monthEnd = toDayIndex(current.month, MONTH_LENGTHS[current.month - 1] ?? 31);
    return { end: monthEnd, start: monthStart };
  }

  const min = Math.min(...indices);
  const max = Math.max(...indices);
  const startMonth = fromDayIndex(min).month;
  const endMonth = fromDayIndex(max).month;

  return {
    end: toDayIndex(endMonth, MONTH_LENGTHS[endMonth - 1] ?? 31),
    start: toDayIndex(startMonth, 1),
  };
}

export function buildTimelineDays(startIndex: number, endIndex: number): TimelineDay[] {
  const days: TimelineDay[] = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    const value = fromDayIndex(index);
    days.push({
      day: value.day,
      index,
      label: String(value.day),
      month: value.month,
    });
  }
  return days;
}

export function buildTimelineMonthGroups(days: TimelineDay[]): TimelineMonthGroup[] {
  return days.reduce<TimelineMonthGroup[]>((groups, day) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.month === day.month) {
      lastGroup.count += 1;
      return groups;
    }

    groups.push({
      count: 1,
      month: day.month,
    });
    return groups;
  }, []);
}

export function getScheduleTone(color: ScheduleColor) {
  switch (color) {
    case 'emerald':
      return {
        background: 'color-mix(in srgb, #16a34a 16%, white)',
        border: 'color-mix(in srgb, #16a34a 34%, white)',
      };
    case 'violet':
      return {
        background: 'color-mix(in srgb, #7c3aed 14%, white)',
        border: 'color-mix(in srgb, #7c3aed 28%, white)',
      };
    case 'blue':
    default:
      return {
        background: 'color-mix(in srgb, var(--portal-color-brand-500) 14%, white)',
        border: 'color-mix(in srgb, var(--portal-color-brand-500) 30%, white)',
      };
  }
}
