import clsx from 'clsx';
import type { ChangeEvent } from 'react';

import { DETAIL_LAYOUT_REGISTRY } from '../registry';
import type { DetailLayoutItem, DetailLayoutItemPatch, DetailLayoutMode } from '../types';

type DetailPropertyPanelProps = {
  allowFieldEdit?: boolean;
  allowParentIdEdit?: boolean;
  className?: string;
  fieldOptions?: Array<{ label: string; value: string }>;
  item: DetailLayoutItem | null;
  mode: DetailLayoutMode;
  onChange: (patch: DetailLayoutItemPatch) => void;
};

function getNumericFieldValue(
  item: DetailLayoutItem,
  key: 'x' | 'y' | 'w' | 'h',
  fallbackWidth: number,
  fallbackHeight: number,
) {
  const value = item[key];
  if (Number.isFinite(value)) {
    return value;
  }

  if (key === 'w') {
    return fallbackWidth;
  }

  if (key === 'h') {
    return fallbackHeight;
  }

  return 0;
}

function toNumberPatch(
  event: ChangeEvent<HTMLInputElement>,
  key: 'x' | 'y' | 'w' | 'h',
  onChange: (patch: DetailLayoutItemPatch) => void,
) {
  const nextValue = Number(event.target.value);
  if (Number.isFinite(nextValue)) {
    onChange({ [key]: nextValue } as DetailLayoutItemPatch);
  }
}

export function DetailPropertyPanel({
  allowFieldEdit = true,
  allowParentIdEdit = true,
  className,
  fieldOptions,
  item,
  mode,
  onChange,
}: DetailPropertyPanelProps) {
  const registryItem = item ? DETAIL_LAYOUT_REGISTRY[item.type] : null;
  const fallbackWidth = registryItem?.defaultSize.w ?? 0;
  const fallbackHeight = registryItem?.defaultSize.h ?? 0;
  const resolvedTitle = item ? (item.title || registryItem?.defaultTitle || '未命名控件') : '';
  const positionSummary = item
    ? `${getNumericFieldValue(item, 'x', fallbackWidth, fallbackHeight)}, ${getNumericFieldValue(item, 'y', fallbackWidth, fallbackHeight)}`
    : '';
  const sizeSummary = item
    ? `${getNumericFieldValue(item, 'w', fallbackWidth, fallbackHeight)} × ${getNumericFieldValue(item, 'h', fallbackWidth, fallbackHeight)}`
    : '';

  return (
    <aside className={clsx('flex h-full min-h-0 flex-col gap-4 overflow-auto rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_24px_44px_-36px_rgba(15,23,42,0.28)]', className)}>
      <div className="rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.9))] px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Property</div>
        <h3 className="mt-2 text-lg font-bold text-slate-900">右侧属性面板</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">选中控件后，集中在这里调整标题、绑定关系和布局数值，画布只保留轻量选中提示。</p>
      </div>

      {!item ? (
        <div className="rounded-[22px] border border-dashed border-slate-200/80 bg-slate-50/60 px-4 py-6 text-sm leading-6 text-slate-400">
          当前未选中控件。点击画布中的控件后，右侧会展示它的标题、字段、位置、尺寸和状态配置。
        </div>
      ) : (
        <>
          <div className="rounded-[22px] border border-[color:var(--workspace-accent-border,#bfd0ff)] bg-[linear-gradient(180deg,rgba(236,242,255,0.9),rgba(248,250,252,0.96))] px-4 py-4 shadow-[0_18px_36px_-32px_rgba(49,98,255,0.42)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--workspace-accent-strong,#3152c8)]">
                  当前选中
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">{resolvedTitle}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">控件 ID：{item.id}</div>
              </div>
              <div className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold text-[color:var(--workspace-accent-strong,#3152c8)] shadow-sm">
                {registryItem?.label}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">布局坐标</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{positionSummary}</div>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">尺寸</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{sizeSummary}</div>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">字段</div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-900">{item.field || '未绑定'}</div>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">父级</div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-900">{item.parentId || '根画布'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/70 px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">内容与绑定</div>
            <div className="mt-1 text-sm leading-6 text-slate-500">先处理用户能感知到的标题、字段和层级关系。</div>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm text-slate-600">
                <span className="font-medium">标题</span>
                <input
                  className="h-10 rounded-[14px] border border-slate-200/80 bg-white px-3"
                  onChange={(event) => onChange({ title: event.target.value })}
                  value={item.title ?? ''}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-slate-600">
                  <span className="font-medium">字段</span>
                  {fieldOptions && allowFieldEdit ? (
                    <select
                      className="h-10 rounded-[14px] border border-slate-200/80 bg-white px-3"
                      onChange={(event) => onChange({ field: event.target.value || undefined })}
                      value={item.field ?? ''}
                    >
                      <option value="">未绑定</option>
                      {fieldOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="h-10 rounded-[14px] border border-slate-200/80 bg-white px-3"
                      onChange={(event) => onChange({ field: event.target.value || undefined })}
                      readOnly={!allowFieldEdit}
                      value={item.field ?? ''}
                    />
                  )}
                </label>

                <label className="grid gap-1.5 text-sm text-slate-600">
                  <span className="font-medium">父级控件 ID</span>
                  <input
                    className="h-10 rounded-[14px] border border-slate-200/80 bg-white px-3"
                    onChange={(event) => onChange({ parentId: event.target.value || null })}
                    readOnly={!allowParentIdEdit}
                    value={item.parentId ?? ''}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">布局与尺寸</div>
                <div className="mt-1 text-sm leading-6 text-slate-500">拖动画布优先，右侧数值用于微调位置和尺寸。</div>
              </div>
              <button
                className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                onClick={() => onChange({ h: fallbackHeight, w: fallbackWidth })}
                type="button"
              >
                恢复默认尺寸
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {(['x', 'y', 'w', 'h'] as const).map((key) => (
                <label key={key} className="grid gap-1.5 text-sm text-slate-600">
                  <span className="font-medium uppercase">{key}</span>
                  <input
                    className="h-10 rounded-[14px] border border-slate-200/80 bg-white px-3"
                    min={
                      key === 'x' || key === 'y'
                        ? 0
                        : key === 'w'
                          ? (registryItem?.defaultSize.w ?? 0)
                          : (registryItem?.defaultSize.h ?? 0)
                    }
                    onChange={(event) => toNumberPatch(event, key, onChange)}
                    type="number"
                    value={getNumericFieldValue(item, key, fallbackWidth, fallbackHeight)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 rounded-[18px] border border-dashed border-slate-200/80 bg-slate-50/70 px-4 py-3 text-[11px] leading-5 text-slate-500">
              坐标不能小于 0，尺寸不能小于当前控件默认尺寸。拖动后如果要精确对齐，再回到右侧微调数值。
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/70 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">状态与限制</div>
                <div className="mt-1 text-sm leading-6 text-slate-500">这些开关决定运行态是否可编辑以及是否必填。</div>
              </div>
              <div className="rounded-full border border-slate-200/80 bg-white/85 px-3 py-1 text-[11px] font-medium text-slate-500">
                当前模式：{mode === 'design' ? '设计态' : '运行态'}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <label className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-700">
                <div>
                  <div className="font-medium">必填</div>
                  <div className="text-xs text-slate-400">提交前必须填写该控件。</div>
                </div>
                <input
                  checked={Boolean(item.required)}
                  onChange={(event) => onChange({ required: event.target.checked })}
                  type="checkbox"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-700">
                <div>
                  <div className="font-medium">只读</div>
                  <div className="text-xs text-slate-400">运行态展示值，但不允许直接编辑。</div>
                </div>
                <input
                  checked={Boolean(item.readOnly)}
                  onChange={(event) => onChange({ readOnly: event.target.checked })}
                  type="checkbox"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[20px] border border-slate-200/80 bg-white/75 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">只读标识</div>
            <div className="mt-3">
              <label className="grid gap-1.5 text-sm text-slate-600">
                <span className="font-medium">ID</span>
                <input className="h-10 rounded-[14px] border border-slate-200/80 bg-slate-50/80 px-3 text-slate-500" readOnly value={item.id} />
              </label>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
