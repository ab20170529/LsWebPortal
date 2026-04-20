import React from 'react';

import { type BackendMenuNode } from '../../lib/backend-menus';
import { getMenuModuleTypeProfile } from './module-settings/dashboard-menu-config-helpers';

const DASHBOARD_OVERVIEW_CARD_STYLES = [
  {
    icon: 'account_balance',
    iconClass:
      'bg-primary/5 text-primary border-primary/10 group-hover:bg-primary group-hover:text-white',
    actionClass: 'hover:text-primary',
  },
  {
    icon: 'groups',
    iconClass:
      'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50 group-hover:bg-indigo-500 group-hover:text-white',
    actionClass: 'hover:text-indigo-600',
  },
  {
    icon: 'inventory_2',
    iconClass:
      'bg-cyan-50 text-cyan-500 dark:bg-cyan-950/30 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50 group-hover:bg-cyan-500 group-hover:text-white',
    actionClass: 'hover:text-cyan-600',
  },
] as const;

function normalizeMenuTitle(value?: string) {
  return value?.trim() || '';
}

function normalizeMenuCode(value?: string) {
  return value?.trim() || '';
}

function isUseflagEnabled(useflag: number | string | undefined, enabled: boolean) {
  if (useflag === 1 || useflag === '1') {
    return true;
  }

  if (useflag === 0 || useflag === '0') {
    return false;
  }

  return enabled !== false;
}

type DashboardOverviewProps = {
  activeFirstLevelMenuName: string;
  activeMenuCode: string;
  activeMenuCodePrefix: string;
  activeMenuName: string;
  activeSubsystemName: string;
  deletingMenuId: string | null;
  isLoadingSecondLevelMenus: boolean;
  menus: BackendMenuNode[];
  onConfigureMenu: (menu: BackendMenuNode) => void;
  onCreateModule: () => void;
  onDeleteMenu: (menu: BackendMenuNode) => void;
  secondLevelMenuCount: number;
};

export function DashboardOverview({
  activeFirstLevelMenuName,
  activeMenuCode,
  activeMenuCodePrefix,
  activeMenuName,
  activeSubsystemName,
  deletingMenuId,
  isLoadingSecondLevelMenus,
  menus,
  onConfigureMenu,
  onCreateModule,
  onDeleteMenu,
  secondLevelMenuCount,
}: DashboardOverviewProps) {
  return (
    <>
      <div className="mb-10 flex shrink-0 items-start justify-between">
        <div className="space-y-2">
          <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {activeMenuName} <span className="ml-1 text-2xl text-primary/40">/</span> <span className="text-lg font-medium text-slate-400">{activeMenuCode}</span>
          </h3>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
            管理{activeSubsystemName}子系统下的{activeMenuName}相关业务模块。在这里您可以进行精细化核算配置、数据模型定义以及 AI 增强逻辑的导入。
          </p>
        </div>
        <button onClick={onCreateModule} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-xl shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0">
          <span className="material-symbols-outlined text-xl">add</span>
          <span>新增业务模块</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {isLoadingSecondLevelMenus ? (
          <div className="col-span-full flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-8 py-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
            正在加载二级菜单明细...
          </div>
        ) : secondLevelMenuCount > 0 ? (
          menus.map((menu, index) => {
            const cardStyle = DASHBOARD_OVERVIEW_CARD_STYLES[index % DASHBOARD_OVERVIEW_CARD_STYLES.length];
            const isDeletingMenu = deletingMenuId === menu.id;
            const isMenuEnabled = isUseflagEnabled(menu.useflag, menu.enabled);
            const menuCodeLabel = normalizeMenuCode(menu.code) || `${activeMenuCodePrefix}-${index + 1}`;
            const menuStructLabel = normalizeMenuCode(menu.menuStruct) || '未配置';
            const purviewLabel = normalizeMenuCode(menu.purviewId) || '未配置';
            const moduleTypeProfile = getMenuModuleTypeProfile(menu.moduleType);
            const moduleTypeLabel = moduleTypeProfile?.label ?? '未定义类型';
            const moduleTypeBadgeClass =
              moduleTypeProfile?.badgeClass ??
              'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
            const moduleTypeIcon = moduleTypeProfile?.icon ?? 'category';
            const statusBadgeClass = isMenuEnabled
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/50';
            const statusDotClass = isMenuEnabled ? 'bg-emerald-500' : 'bg-amber-500';
            const statusText = isMenuEnabled ? '已启用' : '已禁用';

            return (
              <div
                key={menu.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/50"
              >
                <div className="flex items-start justify-between p-6 pb-0">
                  <div className={`size-14 rounded-2xl border flex items-center justify-center transition-all duration-300 ${cardStyle.iconClass}`}>
                    <span className="material-symbols-outlined text-3xl">{cardStyle.icon}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-2 rounded-full border px-2.5 py-1 ${statusBadgeClass}`}>
                      <span className={`status-dot ${statusDotClass}`}></span>
                      <span className="text-[11px] font-bold uppercase tracking-wide">
                        {statusText}
                      </span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${moduleTypeBadgeClass}`}>
                      <span className="material-symbols-outlined text-[14px]">{moduleTypeIcon}</span>
                      <span className="text-[11px] font-semibold tracking-wide">{moduleTypeLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6 pt-5">
                  <h4 className="mb-1 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-primary dark:text-white">
                    {normalizeMenuTitle(menu.title)}
                  </h4>
                  <div className="mb-4 flex items-center gap-2">
                    <code className="rounded border border-slate-200/50 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      {menuCodeLabel}
                    </code>
                  </div>
                  <p className="line-clamp-3 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                    隶属 {activeSubsystemName} / {activeMenuName}，菜单结构 {menuStructLabel}，权限标识 {purviewLabel}。
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-b-2xl border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="flex gap-4">
                    <button
                      onClick={() => onConfigureMenu(menu)}
                      disabled={isDeletingMenu}
                      className={`flex items-center gap-1.5 text-[13px] font-bold text-slate-500 transition-colors ${cardStyle.actionClass}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                      配置
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingMenu}
                      onClick={() => onDeleteMenu(menu)}
                      className={`flex items-center gap-1.5 text-[13px] font-bold transition-colors ${
                        isDeletingMenu
                          ? 'cursor-not-allowed text-rose-300 dark:text-rose-800'
                          : 'text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      {isDeletingMenu ? '删除中...' : '删除'}
                    </button>
                  </div>
                  <button className={`flex size-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-white dark:hover:border-slate-600 dark:hover:bg-slate-700 ${cardStyle.actionClass}`}>
                    <span className="material-symbols-outlined text-lg">more_horiz</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-8 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <span className="material-symbols-outlined text-4xl">view_module</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">暂无二级菜单卡片</div>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              {activeFirstLevelMenuName
                ? `当前一级菜单「${activeFirstLevelMenuName}」下还没有返回二级菜单数据。`
                : '请先从左侧选择一级菜单，右侧会加载对应的二级菜单明细卡片。'}
            </p>
          </div>
        )}
        <button onClick={onCreateModule} className="group relative flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/40 p-8 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-slate-100 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:bg-primary dark:bg-slate-800">
            <span className="material-symbols-outlined text-4xl text-slate-400 transition-colors group-hover:text-white">add</span>
          </div>
          <div className="text-center">
            <h5 className="mb-2 text-base font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-white">新增业务模块</h5>
            <p className="max-w-[180px] text-[13px] leading-relaxed text-slate-500">基于 AI 模型快速生成，或手动配置新的业务单元。</p>
          </div>
          <div className="mt-8 flex gap-2">
            <span className="rounded border border-slate-100 bg-white px-3 py-1 text-[11px] font-medium text-slate-400 transition-colors group-hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800">快速配置</span>
            <span className="rounded border border-slate-100 bg-white px-3 py-1 text-[11px] font-medium text-slate-400 transition-colors group-hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800">AI 生成</span>
          </div>
        </button>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <p>展示 <span className="font-bold text-slate-900 dark:text-white">{secondLevelMenuCount}</span> 个菜单明细卡片</p>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5"><span className="status-dot bg-emerald-500"></span> {secondLevelMenuCount} 已加载</div>
            {isLoadingSecondLevelMenus ? (
              <div className="flex items-center gap-1.5"><span className="status-dot bg-amber-500"></span> 同步中</div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-[12px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-primary">folder_managed</span>
          {activeSubsystemName}
          {activeFirstLevelMenuName ? ` / ${activeFirstLevelMenuName}` : ''}
        </div>
      </div>
    </>
  );
}
