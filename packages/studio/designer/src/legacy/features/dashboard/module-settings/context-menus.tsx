import React from 'react';

type PreviewContextMenuItem = {
  id: string;
  label?: string;
  actionKey?: string;
  disabled?: boolean;
  disabledCondition?: string;
};

type PreviewContextMenuState = {
  scope: 'main' | 'detail';
  x: number;
  y: number;
  rowId: string | number;
  items: PreviewContextMenuItem[];
} | null;

type BuilderSelectionContextMenuState = {
  kind: 'column' | 'filter';
  scope: 'left' | 'main' | 'detail';
  x: number;
  y: number;
  ids: string[];
} | null;

type PreviewContextMenuOverlayProps = {
  menu: PreviewContextMenuState;
  onClose: () => void;
  onTriggerItem: (item: PreviewContextMenuItem) => void;
};

type BuilderSelectionContextMenuOverlayProps = {
  menu: BuilderSelectionContextMenuState;
  onClose: () => void;
  onDelete: () => void;
};

export function PreviewContextMenuOverlay({
  menu,
  onClose,
  onTriggerItem,
}: PreviewContextMenuOverlayProps) {
  if (!menu) return null;
  const enabledCount = menu.items.filter((item) => !item.disabled && !item.disabledCondition).length;

  return (
    <div
      className="fixed inset-0 z-[75] bg-slate-950/8 backdrop-blur-[1.5px]"
      onClick={onClose}
    >
      <div
        className="absolute min-w-[284px] overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,253,0.99))] p-2.5 shadow-[0_36px_90px_-30px_rgba(15,23,42,0.56)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/96"
        style={{
          left: Math.min(menu.x, window.innerWidth - 308),
          top: Math.min(menu.y, window.innerHeight - 280),
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="overflow-hidden rounded-[20px] border border-slate-200/70 bg-white/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-slate-700 dark:bg-slate-900/70">
          <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-[#1686e3]/10 text-[#1686e3]">
                  <span className="material-symbols-outlined text-[18px]">right_click</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    {menu.scope === 'main' ? '主表右键菜单' : '明细右键菜单'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">第 {menu.rowId} 行 · {enabledCount} 个可用操作</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
          <div className="px-2 py-2">
            {menu.items.map((item) => {
              const isDisabled = Boolean(item.disabled) || Boolean(item.disabledCondition);

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onTriggerItem(item);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[16px] border border-transparent px-3 py-3 text-left transition-all ${
                    isDisabled
                      ? 'cursor-not-allowed opacity-55'
                      : 'hover:border-[#cfe4fd] hover:bg-[#eef6ff] hover:shadow-[0_14px_24px_-22px_rgba(22,134,227,0.55)] dark:hover:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${
                    isDisabled ? 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600' : 'bg-[#1686e3]/10 text-[#1686e3]'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">{isDisabled ? 'block' : 'subdirectory_arrow_right'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[12px] font-bold ${
                      isDisabled ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-100'
                    }`}>
                      {item.label || '未命名菜单'}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {item.actionKey || '未配置动作'}
                      </span>
                      {isDisabled ? (
                        <span className="truncate text-[10px] text-rose-400">
                          禁用: {item.disabledCondition || '手动禁用'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BuilderSelectionContextMenuOverlay({
  menu,
  onClose,
  onDelete,
}: BuilderSelectionContextMenuOverlayProps) {
  if (!menu) return null;

  const count = menu.ids.length;
  const isColumnMenu = menu.kind === 'column';
  const scopeLabel = isColumnMenu
    ? menu.scope === 'left'
      ? '左侧列'
      : menu.scope === 'detail'
        ? '明细列'
        : '主表列'
    : menu.scope === 'left'
      ? '左侧条件'
      : menu.scope === 'detail'
        ? '明细条件'
        : '查询条件';
  const title = isColumnMenu ? '字段批量操作' : '条件批量操作';
  const description = `${scopeLabel} · 已选 ${count} 项`;
  const deleteLabel = isColumnMenu ? `删除所选列${count > 1 ? ` (${count})` : ''}` : `删除所选条件${count > 1 ? ` (${count})` : ''}`;

  return (
    <div
      className="fixed inset-0 z-[76]"
      onClick={onClose}
    >
      <div
        className="absolute min-w-[248px] overflow-hidden rounded-[22px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(246,250,255,0.99))] p-2 shadow-[0_30px_72px_-28px_rgba(15,23,42,0.36)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/96"
        style={{
          left: Math.min(menu.x, window.innerWidth - 268),
          top: Math.min(menu.y, window.innerHeight - 180),
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="overflow-hidden rounded-[18px] border border-slate-200/70 bg-white/92 dark:border-slate-700 dark:bg-slate-900/72">
          <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-[#1686e3]/10 text-[#1686e3]">
                  <span className="material-symbols-outlined text-[17px]">select_check_box</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{title}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{description}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
          <div className="p-2">
            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-3 rounded-[16px] border border-transparent px-3 py-3 text-left transition-all hover:border-rose-200 hover:bg-rose-50 hover:shadow-[0_16px_28px_-24px_rgba(244,63,94,0.35)] dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-bold text-slate-700 dark:text-slate-100">{deleteLabel}</div>
                <div className="mt-1 text-[10px] text-slate-400">右键删除当前多选内容</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
