import { Badge, Button, Card } from '@lserp/ui';

import type { ProgressProjectType, ProgressTaskTemplate } from './types';
import {
  buildTimelineDays,
  buildTimelineMonthGroups,
  formatMonthDay,
  getCurrentDayIndex,
  getScheduleEndIndex,
  getScheduleProgress,
  getScheduleStartIndex,
  getScheduleTone,
  getTimelineRange,
} from './utils';

type ProgressConfigTimelineProps = {
  onQuickAdd: (typeId: string, nodeId: string, taskId: string) => void;
  onSelectBlock: (typeId: string, nodeId: string, taskId: string, scheduleId: string) => void;
  projectTypes: ProgressProjectType[];
  selectedTaskId: string | null;
};

function TimelineRow({
  days,
  nodeId,
  onQuickAdd,
  onSelectBlock,
  selectedTaskId,
  task,
  typeId,
}: {
  days: ReturnType<typeof buildTimelineDays>;
  nodeId: string;
  onQuickAdd: (typeId: string, nodeId: string, taskId: string) => void;
  onSelectBlock: (typeId: string, nodeId: string, taskId: string, scheduleId: string) => void;
  selectedTaskId: string | null;
  task: ProgressTaskTemplate;
  typeId: string;
}) {
  const currentDayIndex = getCurrentDayIndex();
  const isSelected = selectedTaskId === task.id;
  const timelineStart = days[0]?.index ?? 0;
  const timelineEnd = days[days.length - 1]?.index ?? timelineStart;
  const totalDays = Math.max(1, timelineEnd - timelineStart + 1);

  return (
    <div className="grid min-w-[1560px] grid-cols-[280px_minmax(0,1fr)] border-b border-black/5">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <div className="theme-text-strong text-sm font-semibold">{task.title}</div>
          <div className="theme-text-muted mt-1 text-xs leading-6">
            {task.code} / {task.leadRole}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={isSelected ? 'brand' : 'neutral'}>{task.schedules.length}</Badge>
          <Button
            onClick={() => {
              onQuickAdd(typeId, nodeId, task.id);
            }}
            tone="ghost"
          >
            新增
          </Button>
        </div>
      </div>

      <div className="relative h-[76px]">
        {days.map((day) => (
          <div
            key={`${task.id}-grid-${day.index}`}
            className="pointer-events-none absolute inset-y-0 border-l border-black/5"
            style={{ left: `${((day.index - timelineStart) / totalDays) * 100}%` }}
          />
        ))}

        {currentDayIndex >= timelineStart && currentDayIndex <= timelineEnd ? (
          <div
            className="pointer-events-none absolute inset-y-0 border-l border-dashed"
            style={{
              borderColor: 'color-mix(in srgb, var(--portal-color-brand-500) 24%, white)',
              left: `${((currentDayIndex - timelineStart) / totalDays) * 100}%`,
            }}
          />
        ) : null}

        {task.schedules.map((schedule) => {
          const startIndex = getScheduleStartIndex(schedule);
          const endIndex = getScheduleEndIndex(schedule);
          const left = ((startIndex - timelineStart) / totalDays) * 100;
          const width = (((endIndex - startIndex + 1) / totalDays) * 100);
          const tone = getScheduleTone(schedule.color);
          const progress = getScheduleProgress(schedule, currentDayIndex);

          return (
            <button
              key={schedule.id}
              className="absolute top-1/2 h-[42px] -translate-y-1/2 overflow-hidden rounded-2xl px-3 text-left shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-[calc(50%+2px)]"
              onClick={() => {
                onSelectBlock(typeId, nodeId, task.id, schedule.id);
              }}
              style={{
                backgroundColor: tone.background,
                border: `1px solid ${tone.border}`,
                left: `${Math.max(0, left)}%`,
                width: `${Math.max(width, 2.8)}%`,
              }}
              type="button"
            >
              <div className="theme-text-strong text-xs font-bold uppercase tracking-[0.16em]">
                {formatMonthDay(schedule.startMonth, schedule.startDay)} -{' '}
                {formatMonthDay(schedule.endMonth, schedule.endDay)}
              </div>
              <div className="theme-text-muted mt-1 truncate text-xs">
                {schedule.owner || '未指派'} / {progress}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProgressConfigTimeline({
  onQuickAdd,
  onSelectBlock,
  projectTypes,
  selectedTaskId,
}: ProgressConfigTimelineProps) {
  const range = getTimelineRange(projectTypes);
  const days = buildTimelineDays(range.start, range.end);
  const monthGroups = buildTimelineMonthGroups(days);

  return (
    <Card className="overflow-hidden rounded-[32px]">
      <div className="border-b border-black/5 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.22em]">
              时间轴画布
            </div>
            <div className="theme-text-strong mt-2 text-2xl font-black tracking-tight">
              任务排期画布
            </div>
          </div>
          <Badge tone="neutral">月 / 日</Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1560px] border-b border-black/5 bg-black/[0.02]">
          <div className="grid grid-cols-[280px_minmax(0,1fr)]">
            <div className="theme-text-soft row-span-2 px-5 py-4 text-xs font-bold uppercase tracking-[0.18em]">
              任务模板
            </div>
            <div
              className="grid border-b border-black/5 px-2 py-3"
              style={{
                gridTemplateColumns: `repeat(${days.length}, minmax(36px, 1fr))`,
              }}
            >
              {monthGroups.map((group) => (
                <div
                  key={`month-${group.month}`}
                  className="theme-text-soft border-r border-black/5 px-2 text-xs font-bold uppercase tracking-[0.14em]"
                  style={{ gridColumn: `span ${group.count}` }}
                >
                  {group.month}月
                </div>
              ))}
            </div>
            <div
              className="grid grid-cols-[repeat(auto-fit,minmax(36px,1fr))] px-2 py-4"
              style={{
                gridTemplateColumns: `repeat(${days.length}, minmax(36px, 1fr))`,
              }}
            >
              {days.map((day) => (
                <div
                  key={`day-${day.index}`}
                  className="theme-text-soft text-center text-[11px] font-bold uppercase tracking-[0.14em]"
                >
                  {day.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {projectTypes.map((projectType) => (
            <div key={projectType.id}>
              <div className="border-b border-black/5 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="theme-text-strong text-sm font-black tracking-tight">
                      {projectType.title}
                    </div>
                    <div className="theme-text-muted mt-1 text-sm leading-6">
                      {projectType.description}
                    </div>
                  </div>
                  <Badge tone="brand">{projectType.nodes.length} 个节点</Badge>
                </div>
              </div>

              {projectType.nodes.map((node) => (
                <div key={node.id}>
                  <div className="theme-surface-subtle px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="theme-text-strong text-sm font-semibold">{node.title}</div>
                      <Badge tone="neutral">{node.tasks.length} 个任务</Badge>
                    </div>
                  </div>

                  {node.tasks.map((task) => (
                    <TimelineRow
                      key={task.id}
                      days={days}
                      nodeId={node.id}
                      onQuickAdd={onQuickAdd}
                      onSelectBlock={onSelectBlock}
                      selectedTaskId={selectedTaskId}
                      task={task}
                      typeId={projectType.id}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
