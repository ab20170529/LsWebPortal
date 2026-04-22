import React from 'react';

import type { FieldBackedDetailLayoutDesignerHelpers } from '../detail-layout-designer/components/FieldBackedDetailLayoutDesigner';

type ArchiveLayoutDesignerSidebarProps = {
  helpers: FieldBackedDetailLayoutDesignerHelpers<Record<string, any>>;
};

function sortByLayoutPosition<T extends { x?: number; y?: number }>(items: T[]) {
  return [...items].sort((left, right) => (Number(left.y) - Number(right.y)) || (Number(left.x) - Number(right.x)));
}

function sortPlacedEntries<T extends { item: { x?: number; y?: number } }>(items: T[]) {
  return [...items].sort((left, right) => (
    Number(left.item.y) - Number(right.item.y)
  ) || (
    Number(left.item.x) - Number(right.item.x)
  ));
}

export const ArchiveLayoutDesignerSidebar = React.memo(function ArchiveLayoutDesignerSidebar({
  helpers,
}: ArchiveLayoutDesignerSidebarProps) {
  const [keyword, setKeyword] = React.useState('');

  const groups = React.useMemo(
    () => sortByLayoutPosition(helpers.document.items.filter((item) => item.type === 'groupbox')),
    [helpers.document.items],
  );
  const selectedGroupId = React.useMemo(() => {
    if (helpers.selectedItem?.type === 'groupbox') {
      return helpers.selectedItem.id;
    }

    if (helpers.selectedItem?.parentId) {
      return helpers.selectedItem.parentId;
    }

    return groups[0]?.id ?? null;
  }, [groups, helpers.selectedItem]);
  const placedFieldItems = React.useMemo(
    () => sortPlacedEntries(
      helpers.document.items.filter((item) => item.field).map((item) => {
        const fieldOption = helpers.findFieldOption(String(item.field));
        const parentGroup = item.parentId ? groups.find((group) => group.id === item.parentId) : null;
        return {
          fieldLabel: fieldOption?.label ?? String(item.field),
          fieldValue: String(item.field),
          groupLabel: parentGroup?.title || parentGroup?.id || '根画布',
          item,
        };
      }),
    ),
    [groups, helpers],
  );
  const placedFieldIdSet = React.useMemo(
    () => new Set(placedFieldItems.map((entry) => entry.fieldValue)),
    [placedFieldItems],
  );
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredPlacedItems = React.useMemo(
    () => placedFieldItems.filter((entry) => {
      if (!normalizedKeyword) {
        return true;
      }

      return `${entry.fieldLabel} ${entry.fieldValue} ${entry.groupLabel}`.toLowerCase().includes(normalizedKeyword);
    }),
    [normalizedKeyword, placedFieldItems],
  );
  const pendingFieldOptions = React.useMemo(
    () => helpers.fieldOptions.filter((fieldOption) => {
      if (placedFieldIdSet.has(fieldOption.value)) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return `${fieldOption.label} ${fieldOption.value} ${fieldOption.description ?? ''}`.toLowerCase().includes(normalizedKeyword);
    }),
    [helpers.fieldOptions, normalizedKeyword, placedFieldIdSet],
  );

  const handleAddGroup = React.useCallback(() => {
    const nextGroupIndex = groups.length + 1;
    const nextY = groups.reduce((maxBottom, group) => Math.max(maxBottom, group.y + group.h), 24) + 24;
    helpers.addItem('groupbox', {
      h: 260,
      title: `信息分组 ${nextGroupIndex}`,
      w: 520,
      x: 24,
      y: nextY,
    });
  }, [groups, helpers]);

  const handleAddField = React.useCallback((fieldValue: string) => {
    const nextItem = helpers.addFieldOption(fieldValue, {
      parentId: selectedGroupId,
      x: 24,
      y: 24,
    });

    if (nextItem) {
      helpers.selectItem(nextItem.id);
    }
  }, [helpers, selectedGroupId]);

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/92 shadow-[0_28px_48px_-38px_rgba(15,23,42,0.26)]">
      <div className="border-b border-slate-200/80 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Fields</div>
            <div className="mt-1 text-base font-semibold text-slate-900">字段布局</div>
            <div className="mt-1 text-xs leading-5 text-slate-500">左侧只负责放入、移出和定位字段，顺序与大小在中间画布直接调整。</div>
          </div>
          <button
            type="button"
            onClick={handleAddGroup}
            className="inline-flex h-9 items-center justify-center rounded-[14px] border border-slate-200/80 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-[color:var(--workspace-accent-border,#bfd0ff)] hover:bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.08))]"
          >
            新增分组
          </button>
        </div>

        <input
          className="mt-4 h-10 w-full rounded-[14px] border border-slate-200/80 bg-slate-50/80 px-3 text-sm outline-none transition-colors focus:border-[color:var(--workspace-accent-border,#8fb0ff)] focus:bg-white"
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索字段名或编码"
          value={keyword}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-slate-50/60">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">已放入字段</div>
            <span className="rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {filteredPlacedItems.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
            {filteredPlacedItems.length > 0 ? filteredPlacedItems.map((entry) => {
              const selected = helpers.selectedItem?.id === entry.item.id;
              return (
                <div
                  key={entry.item.id}
                  className={`mb-2 flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 text-left transition-colors ${
                    selected
                      ? 'border-[color:var(--workspace-accent-border,#8fb0ff)] bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.08))]'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => helpers.selectItem(entry.item.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-semibold text-slate-900">{entry.fieldLabel}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{entry.fieldValue} · {entry.groupLabel}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => helpers.deleteItem(entry.item.id)}
                    className="inline-flex size-8 items-center justify-center rounded-[12px] border border-rose-200/80 bg-rose-50 text-rose-600"
                    title="移出布局"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                </div>
              );
            }) : (
              <div className="rounded-[16px] border border-dashed border-slate-200/80 bg-white/80 px-4 py-6 text-center text-sm text-slate-400">
                当前没有已放入字段
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-slate-50/60">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">待放入字段</div>
              <div className="mt-1 text-[11px] text-slate-500">
                默认加入到{selectedGroupId ? '当前选中分组' : '首个分组'}
              </div>
            </div>
            <span className="rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {pendingFieldOptions.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
            {pendingFieldOptions.length > 0 ? pendingFieldOptions.map((fieldOption) => (
              <button
                key={fieldOption.value}
                type="button"
                onClick={() => handleAddField(fieldOption.value)}
                className="mb-2 flex w-full items-center gap-3 rounded-[16px] border border-slate-200/80 bg-white px-3 py-3 text-left transition-colors hover:border-[color:var(--workspace-accent-border,#8fb0ff)] hover:bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.06))]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{fieldOption.label}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{fieldOption.value}</div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent-strong,#3152c8)]">add_circle</span>
              </button>
            )) : (
              <div className="rounded-[16px] border border-dashed border-slate-200/80 bg-white/80 px-4 py-6 text-center text-sm text-slate-400">
                没有待放入字段
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
});
