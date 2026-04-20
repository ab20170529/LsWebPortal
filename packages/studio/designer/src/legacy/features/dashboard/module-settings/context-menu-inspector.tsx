import React from 'react';
import {
  shadcnFieldClass,
  shadcnPanelBadgeClass,
  shadcnPanelHeaderClass,
  shadcnPanelIconShellClass,
  shadcnPanelShellClass,
  shadcnPanelTitleClass,
} from '../../../components/ui/shadcn-inspector';
import {
  buildContextMenuItem,
  normalizeContextMenuItem,
} from './context-menu-utils';

type ContextMenuInspectorContext = {
  column: Record<string, any>;
  icon: string;
  iconClass: string;
  title: string;
};

type ContextMenuInspectorProps = {
  context: ContextMenuInspectorContext;
  inspectorTabsNode: React.ReactNode;
  isCommonPanelTab: boolean;
  onUpdateConfig: (patch: Record<string, any>) => void;
};

function AdvancedPlaceholder({ title }: { title: string }) {
  return (
    <section className="rounded-md border border-dashed border-slate-200/80 bg-slate-50/50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-900/35">
      <div className="mx-auto flex size-10 items-center justify-center rounded-md border border-slate-200/80 bg-white text-[#1686e3] dark:border-slate-700 dark:bg-slate-900">
        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
      </div>
      <div className="mt-3 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{title}</div>
    </section>
  );
}

export const ContextMenuInspector = React.memo(function ContextMenuInspector({
  context,
  inspectorTabsNode,
  isCommonPanelTab,
  onUpdateConfig,
}: ContextMenuInspectorProps) {
  const panelShellClass = shadcnPanelShellClass;
  const panelHeaderClass = shadcnPanelHeaderClass;
  const panelTitleClass = shadcnPanelTitleClass;
  const panelBadgeClass = shadcnPanelBadgeClass;
  const panelIconShellClass = `${shadcnPanelIconShellClass} size-10 rounded-lg`;
  const fieldClass = shadcnFieldClass;
  const currentConfig = context.column;
  const menuItems = React.useMemo(
    () => (currentConfig.contextMenuItems ?? []).map((item: any, index: number) => normalizeContextMenuItem(item, index + 1)),
    [currentConfig.contextMenuItems],
  );
  const enabledMenuCount = React.useMemo(
    () => menuItems.filter((item: any) => !item.disabled).length,
    [menuItems],
  );

  const updateMenuItems = React.useCallback((nextMenuItems: Record<string, any>[]) => {
    onUpdateConfig({ contextMenuItems: nextMenuItems });
  }, [onUpdateConfig]);

  const appendMenuItem = React.useCallback(() => {
    updateMenuItems([...menuItems, buildContextMenuItem(menuItems.length + 1)]);
  }, [menuItems, updateMenuItems]);

  const updateMenuItem = React.useCallback((itemId: string, patch: Record<string, any>) => {
    updateMenuItems(menuItems.map((menu: any) => (
      menu.id === itemId ? { ...menu, ...patch } : menu
    )));
  }, [menuItems, updateMenuItems]);

  const removeMenuItem = React.useCallback((itemId: string) => {
    updateMenuItems(menuItems.filter((menu: any) => menu.id !== itemId));
  }, [menuItems, updateMenuItems]);

  return (
    <div className={panelShellClass}>
      <div className={panelHeaderClass}>
        <div className="flex items-start gap-3">
          <div className={`${panelIconShellClass} ${context.iconClass}`}>
            <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={panelTitleClass}>{context.title}</h3>
              <span className={panelBadgeClass}>右键菜单</span>
            </div>
            {inspectorTabsNode}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        {isCommonPanelTab ? (
          <>
            <section className="overflow-hidden rounded-[26px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,252,0.96))] shadow-[0_20px_44px_-36px_rgba(15,23,42,0.42)] dark:border-slate-700 dark:bg-slate-900/48">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-5 dark:border-slate-700">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100">菜单状态</div>
                </div>
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span>{currentConfig.contextMenuEnabled ? '已启用' : '未启用'}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(currentConfig.contextMenuEnabled)}
                    onChange={(event) => onUpdateConfig({ contextMenuEnabled: event.target.checked })}
                    className="h-4 w-4 rounded accent-[#1686e3]"
                  />
                </label>
              </div>
              <div className="grid gap-4 px-5 py-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-slate-200/70 bg-white/92 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/55">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">菜单总数</div>
                    <div className="mt-2 text-[22px] font-black text-slate-800 dark:text-slate-100">{menuItems.length}</div>
                  </div>
                  <div className="rounded-[20px] border border-slate-200/70 bg-white/92 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/55">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">可用项</div>
                    <div className="mt-2 text-[22px] font-black text-emerald-500">{enabledMenuCount}</div>
                  </div>
                  <div className="rounded-[20px] border border-slate-200/70 bg-white/92 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/55">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">禁用项</div>
                    <div className="mt-2 text-[22px] font-black text-amber-500">{Math.max(0, menuItems.length - enabledMenuCount)}</div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[22px] border border-slate-200/70 bg-[#f8fbff] dark:border-slate-700 dark:bg-slate-900/62">
                  <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#1686e3]">preview</span>
                      <span className="text-[12px] font-bold text-slate-700 dark:text-slate-100">右键菜单预览</span>
                    </div>
                  </div>
                  <div className="bg-[radial-gradient(circle_at_top_left,rgba(22,134,227,0.12),transparent_55%),linear-gradient(180deg,rgba(241,247,253,0.94),rgba(255,255,255,0.96))] p-4 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.55),rgba(15,23,42,0.76))]">
                    <div className="mx-auto max-w-[260px] rounded-[18px] border border-white/80 bg-white/96 p-2 shadow-[0_24px_54px_-28px_rgba(15,23,42,0.38)] dark:border-slate-700 dark:bg-slate-900/96">
                      {menuItems.length > 0 ? (
                        menuItems.map((item: any) => {
                          const isDisabled = Boolean(item.disabled) || Boolean(item.disabledCondition);

                          return (
                            <div
                              key={`preview-${item.id}`}
                              className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 ${
                                isDisabled ? 'opacity-55' : 'hover:bg-[#eef6ff] dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className={`flex size-8 items-center justify-center rounded-2xl ${
                                isDisabled ? 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600' : 'bg-[#1686e3]/10 text-[#1686e3]'
                              }`}>
                                <span className="material-symbols-outlined text-[15px]">{isDisabled ? 'block' : 'subdirectory_arrow_right'}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`break-words text-[12px] font-bold leading-5 ${
                                  isDisabled ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-100'
                                }`}>
                                  {item.label || '未命名菜单'}
                                </div>
                                <div className="mt-1 break-all font-mono text-[10px] leading-5 text-slate-400">{item.actionKey || '未配置动作'}</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-[16px] border border-dashed border-slate-200/80 px-4 py-6 text-center text-[12px] text-slate-400 dark:border-slate-700">
                          当前还没有右键菜单项
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-200/70 bg-white/84 p-5 shadow-[0_22px_48px_-38px_rgba(15,23,42,0.32)] dark:border-slate-700 dark:bg-slate-900/45">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100">菜单项编辑</div>
                <button
                  type="button"
                  onClick={appendMenuItem}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#1686e3] bg-[#1686e3] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#1176ca]"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  新增菜单
                </button>
              </div>

              <div className="space-y-3">
                {menuItems.length > 0 ? (
                  menuItems.map((item: any, index: number) => (
                    <div key={item.id} className="rounded-[24px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,253,0.94))] p-4 shadow-[0_22px_40px_-34px_rgba(15,23,42,0.36)] dark:border-slate-700 dark:bg-slate-900/55">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 items-center justify-center rounded-[18px] bg-[#1686e3]/10 text-[#1686e3]">
                            <span className="material-symbols-outlined text-[17px]">right_click</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold leading-5 text-slate-700 dark:text-slate-100">菜单 {index + 1}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMenuItem(item.id)}
                          className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[12px] font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          删除
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_170px]">
                        <div>
                          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">菜单名称</label>
                          <input
                            type="text"
                            value={item.label ?? ''}
                            onChange={(event) => updateMenuItem(item.id, { label: event.target.value })}
                            placeholder="菜单名称"
                            className={fieldClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">动作标识</label>
                          <input
                            type="text"
                            value={item.actionKey ?? ''}
                            onChange={(event) => updateMenuItem(item.id, { actionKey: event.target.value })}
                            placeholder="open-detail"
                            className={`${fieldClass} font-mono text-[12px]`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-200/80 px-4 py-8 text-center text-[12px] text-slate-400 dark:border-slate-700">
                    还没有配置右键菜单
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[26px] border border-slate-200/70 bg-white/84 p-5 shadow-[0_22px_48px_-38px_rgba(15,23,42,0.32)] dark:border-slate-700 dark:bg-slate-900/45">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100">禁用规则</div>
              <button
                type="button"
                onClick={appendMenuItem}
                className="inline-flex items-center gap-1 rounded-xl border border-[#1686e3] bg-[#1686e3] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#1176ca]"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                新增菜单
              </button>
            </div>

            <div className="space-y-3">
              {menuItems.length > 0 ? (
                menuItems.map((item: any, index: number) => (
                  <div key={`advanced-${item.id}`} className="rounded-[22px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/45">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="text-[13px] font-bold text-slate-700 dark:text-slate-100">菜单 {index + 1}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.disabled || item.disabledCondition ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                      }`}>
                        {item.disabled || item.disabledCondition ? '已禁用' : '默认可用'}
                      </span>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">禁用条件</label>
                      <textarea
                        rows={3}
                        value={item.disabledCondition ?? ''}
                        onChange={(event) => updateMenuItem(item.id, { disabledCondition: event.target.value })}
                        placeholder="输入禁用条件"
                        className="min-h-[88px] w-full rounded-[18px] border border-slate-200/80 bg-white/90 px-4 py-3 text-[13px] leading-6 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition focus:border-[color:var(--workspace-accent-border)] focus:ring-2 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-950/72 dark:text-slate-100"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <AdvancedPlaceholder title="还没有扩展右键规则" />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
});
