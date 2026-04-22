import React from 'react';

import { DETAIL_LAYOUT_REGISTRY } from '../detail-layout-designer/registry';
import type { FieldBackedDetailLayoutDesignerHelpers } from '../detail-layout-designer/components/FieldBackedDetailLayoutDesigner';

type ArchiveLayoutPropertyPanelProps = {
  helpers: FieldBackedDetailLayoutDesignerHelpers<Record<string, any>>;
};

function NumericInput({
  label,
  min,
  value,
  onChange,
}: {
  label: string;
  min: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm text-slate-600">
      <span className="font-medium">{label}</span>
      <input
        className="h-10 rounded-[14px] border border-slate-200/80 bg-white px-3"
        min={min}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) {
            onChange(nextValue);
          }
        }}
        type="number"
        value={value}
      />
    </label>
  );
}

export const ArchiveLayoutPropertyPanel = React.memo(function ArchiveLayoutPropertyPanel({
  helpers,
}: ArchiveLayoutPropertyPanelProps) {
  const item = helpers.selectedItem;
  const groups = React.useMemo(
    () => helpers.document.items.filter((entry) => entry.type === 'groupbox').sort((left, right) => (left.y - right.y) || (left.x - right.x)),
    [helpers.document.items],
  );

  if (!item) {
    return (
      <aside className="flex min-h-0 flex-col rounded-[24px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_28px_48px_-38px_rgba(15,23,42,0.26)]">
        <div className="rounded-[20px] border border-dashed border-slate-200/80 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-400">
          选中中间画布里的字段或分组后，这里只显示高频设置：标题、所属分组、宽高和只读/必填。
        </div>
      </aside>
    );
  }

  const registryItem = DETAIL_LAYOUT_REGISTRY[item.type];
  const groupOptions = [
    { label: '根画布', value: '' },
    ...groups.map((group) => ({ label: group.title || group.id, value: group.id })),
  ];
  const isGroupbox = item.type === 'groupbox';

  return (
    <aside className="flex min-h-0 flex-col gap-4 overflow-auto rounded-[24px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_28px_48px_-38px_rgba(15,23,42,0.26)]">
      <div className="rounded-[20px] border border-[color:var(--workspace-accent-border,#bfd0ff)] bg-[linear-gradient(180deg,rgba(236,242,255,0.92),rgba(255,255,255,0.96))] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--workspace-accent-strong,#3152c8)]">Selection</div>
            <div className="mt-1 text-base font-semibold text-slate-900">{item.title || registryItem.defaultTitle}</div>
            <div className="mt-1 text-xs text-slate-500">{registryItem.label} · {item.id}</div>
          </div>
          <button
            type="button"
            onClick={() => helpers.deleteItem(item.id)}
            className="inline-flex h-9 items-center justify-center rounded-[14px] border border-rose-200/80 bg-rose-50 px-3 text-xs font-semibold text-rose-600"
          >
            删除
          </button>
        </div>
      </div>

      <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/60 px-4 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">基础设置</div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-sm text-slate-600">
            <span className="font-medium">标题</span>
            <input
              className="h-10 rounded-[14px] border border-slate-200/80 bg-white px-3"
              onChange={(event) => helpers.updateSelectedItem({ title: event.target.value })}
              value={item.title ?? ''}
            />
          </label>

          {!isGroupbox ? (
            <label className="grid gap-1.5 text-sm text-slate-600">
              <span className="font-medium">所属分组</span>
              <select
                className="h-10 rounded-[14px] border border-slate-200/80 bg-white px-3"
                onChange={(event) => helpers.updateSelectedItem({ parentId: event.target.value || null })}
                value={item.parentId ?? ''}
              >
                {groupOptions.map((option) => (
                  <option key={option.value || 'root'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/60 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">尺寸</div>
          <button
            type="button"
            onClick={() => helpers.updateSelectedItem({
              h: registryItem.defaultSize.h,
              w: registryItem.defaultSize.w,
            })}
            className="rounded-[12px] border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            恢复默认
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumericInput
            label="宽度"
            min={registryItem.defaultSize.w}
            onChange={(value) => helpers.updateSelectedItem({ w: value })}
            value={item.w}
          />
          <NumericInput
            label="高度"
            min={registryItem.defaultSize.h}
            onChange={(value) => helpers.updateSelectedItem({ h: value })}
            value={item.h}
          />
        </div>
      </section>

      {!isGroupbox ? (
        <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/60 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">字段状态</div>
          <div className="mt-4 grid gap-2">
            <label className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700">
              <span>必填</span>
              <input
                checked={Boolean(item.required)}
                onChange={(event) => helpers.updateSelectedItem({ required: event.target.checked })}
                type="checkbox"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700">
              <span>只读</span>
              <input
                checked={Boolean(item.readOnly)}
                onChange={(event) => helpers.updateSelectedItem({ readOnly: event.target.checked })}
                type="checkbox"
              />
            </label>
          </div>
        </section>
      ) : null}
    </aside>
  );
});
