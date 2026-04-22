import React from 'react';
import {
  shadcnFieldClass,
  shadcnInspectorSectionClass,
  shadcnInspectorSectionHeaderClass,
  shadcnInspectorSectionTitleClass,
  shadcnPanelBodyClass,
  shadcnPanelHeaderClass,
  shadcnPanelHeaderMainClass,
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
  onUpdateConfig: (patch: Record<string, any>) => void;
};

function AdvancedPlaceholder({ title }: { title: string }) {
  return (
    <section className="rounded-md border border-dashed border-slate-200/60 bg-white/70 px-4 py-6 text-center backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mx-auto flex size-10 items-center justify-center rounded-md border border-slate-200/60 bg-white/80 text-[#1686e3] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
      </div>
      <div className="mt-3 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{title}</div>
    </section>
  );
}

export const ContextMenuInspector = React.memo(function ContextMenuInspector({
  context,
  onUpdateConfig,
}: ContextMenuInspectorProps) {
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
    <div className={shadcnPanelShellClass}>
      <div className={shadcnPanelHeaderClass}>
        <div className={shadcnPanelHeaderMainClass}>
          <div className={`${panelIconShellClass} ${context.iconClass}`}>
            <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={shadcnPanelTitleClass}>{context.title}</h3>
          </div>
        </div>
      </div>

      <div className={shadcnPanelBodyClass}>
        <section className={shadcnInspectorSectionClass}>
          <div className={shadcnInspectorSectionHeaderClass}>
            <div className={shadcnInspectorSectionTitleClass}>
              <span className="material-symbols-outlined text-[16px] text-[#1686e3]">toggle_on</span>
              <h4>菜单状态</h4>
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
        </section>

        <section className={shadcnInspectorSectionClass}>
          <div className={shadcnInspectorSectionHeaderClass}>
            <div className={shadcnInspectorSectionTitleClass}>
              <span className="material-symbols-outlined text-[16px] text-[#1686e3]">right_click</span>
              <h4>菜单项</h4>
            </div>
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
                <div
                  key={item.id}
                  className="rounded-[18px] border border-slate-200/60 bg-white/80 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold leading-5 text-slate-700 dark:text-slate-100">菜单 {index + 1}</div>
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

                  <div className="grid gap-4">
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
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">禁用条件</label>
                      <textarea
                        rows={3}
                        value={item.disabledCondition ?? ''}
                        onChange={(event) => updateMenuItem(item.id, { disabledCondition: event.target.value })}
                        placeholder="输入禁用条件"
                        className="min-h-[88px] w-full rounded-[18px] border border-slate-200/60 bg-white/80 px-4 py-3 text-[13px] leading-6 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition backdrop-blur-md focus:border-[color:var(--workspace-accent-border)] focus:ring-2 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <AdvancedPlaceholder title="还没有配置右键菜单" />
            )}
          </div>
        </section>

        <section className={shadcnInspectorSectionClass}>
          <div className={shadcnInspectorSectionHeaderClass}>
            <div className={shadcnInspectorSectionTitleClass}>
              <span className="material-symbols-outlined text-[16px] text-[#1686e3]">rule</span>
              <h4>禁用规则</h4>
            </div>
          </div>
          <div className="grid gap-2 text-[12px] text-slate-500 dark:text-slate-300">
            <div>菜单总数 {menuItems.length} 项</div>
            <div>已启用 {enabledMenuCount} 项</div>
            <div>已禁用 {Math.max(0, menuItems.length - enabledMenuCount)} 项</div>
          </div>
        </section>
      </div>
    </div>
  );
});
