import type { ChangeEvent } from 'react';

import { Button, Card } from '@lserp/ui';

import type { ProgressSchedule, ScheduleColor } from './types';

type ProgressConfigModalProps = {
  canDelete: boolean;
  errorMessage?: string | null;
  onChange: (schedule: ProgressSchedule) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  open: boolean;
  saving?: boolean;
  schedule: ProgressSchedule | null;
  taskTitle: string | null;
};

const colorOptions: Array<{ label: string; value: ScheduleColor; bgClass: string; ringClass: string }> = [
  { label: '蓝色 / 计划中', value: 'blue', bgClass: 'bg-sky-500', ringClass: 'ring-sky-400' },
  { label: '绿色 / 执行中', value: 'emerald', bgClass: 'bg-emerald-500', ringClass: 'ring-emerald-400' },
  { label: '紫色 / 评审中', value: 'violet', bgClass: 'bg-violet-500', ringClass: 'ring-violet-400' },
];

function clampMonth(value: number) {
  return Math.max(1, Math.min(12, value));
}

function clampDay(value: number) {
  return Math.max(1, Math.min(31, value));
}

export function ProgressConfigModal({
  canDelete,
  errorMessage,
  onChange,
  onClose,
  onDelete,
  onSave,
  open,
  saving = false,
  schedule,
  taskTitle,
}: ProgressConfigModalProps) {
  if (!open || !schedule) {
    return null;
  }

  const currentSchedule: ProgressSchedule = schedule;

  function handleTextInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    if (name === 'owner') {
      onChange({ ...currentSchedule, owner: value });
      return;
    }

    if (name === 'remark') {
      onChange({ ...currentSchedule, remark: value });
      return;
    }

    const numericValue = Number(value || 0);
    if (Number.isNaN(numericValue)) {
      return;
    }

    if (name === 'startMonth') {
      onChange({ ...currentSchedule, startMonth: clampMonth(numericValue) });
      return;
    }

    if (name === 'startDay') {
      onChange({ ...currentSchedule, startDay: clampDay(numericValue) });
      return;
    }

    if (name === 'endMonth') {
      onChange({ ...currentSchedule, endMonth: clampMonth(numericValue) });
      return;
    }

    onChange({ ...currentSchedule, endDay: clampDay(numericValue) });
  }

  function handleColorChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange({
      ...currentSchedule,
      color: event.target.value as ScheduleColor,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/26 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-3xl rounded-[32px] p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
              排期编辑
            </div>
            <div className="theme-text-strong mt-2 text-2xl font-black tracking-tight">
              {taskTitle ?? '任务排期'}
            </div>
            <div className="theme-text-muted mt-2 text-sm leading-7">
              当前甘特轴按月、日展示。这里编辑并保存的是月日粒度的排期块，不再使用时分。
            </div>
          </div>
          <Button disabled={saving} onClick={onClose} tone="ghost">
            关闭
          </Button>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-[20px] border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
              执行人
            </span>
            <input
              className="theme-input h-12 w-full rounded-2xl px-4"
              name="owner"
              onChange={handleTextInputChange}
              value={currentSchedule.owner}
            />
          </label>

          <label className="block space-y-2">
            <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
              颜色
            </span>
            <div className="flex items-center gap-3">
              {colorOptions.map((option) => {
                const isSelected = currentSchedule.color === option.value;
                return (
                  <button
                    key={option.value}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? `ring-2 ${option.ringClass} bg-slate-50 text-slate-700`
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                    onClick={() => onChange({ ...currentSchedule, color: option.value })}
                    title={option.label}
                    type="button"
                  >
                    <span className={`h-4 w-4 rounded-full ${option.bgClass}`} />
                    <span>{option.label.split(' / ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                开始月
              </span>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                max={12}
                min={1}
                name="startMonth"
                onChange={handleTextInputChange}
                type="number"
                value={currentSchedule.startMonth}
              />
            </label>
            <label className="block space-y-2">
              <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                开始日
              </span>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                max={31}
                min={1}
                name="startDay"
                onChange={handleTextInputChange}
                type="number"
                value={currentSchedule.startDay}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                结束月
              </span>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                max={12}
                min={1}
                name="endMonth"
                onChange={handleTextInputChange}
                type="number"
                value={currentSchedule.endMonth}
              />
            </label>
            <label className="block space-y-2">
              <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                结束日
              </span>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                max={31}
                min={1}
                name="endDay"
                onChange={handleTextInputChange}
                type="number"
                value={currentSchedule.endDay}
              />
            </label>
          </div>

          <label className="block space-y-2 md:col-span-2">
            <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
              备注
            </span>
            <input
              className="theme-input h-12 w-full rounded-2xl px-4"
              name="remark"
              onChange={handleTextInputChange}
              value={currentSchedule.remark ?? ''}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button disabled={!canDelete || saving} onClick={onDelete} tone="ghost">
            删除
          </Button>
          <div className="flex items-center gap-3">
            <Button disabled={saving} onClick={onClose} tone="ghost">
              取消
            </Button>
            <Button onClick={onSave}>{saving ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
