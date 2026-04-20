import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { type BackendMenuNode, type BackendSubsystemNode } from '../../lib/backend-menus';

function normalizeMenuTitle(value?: string) {
  return value?.trim() || '';
}

export function DashboardWorkspaceSidebar({
  activeFirstLevelMenuId,
  activeSubsystem,
  companyTitle,
  expandedSubsystemId,
  handleFirstLevelMenuClick,
  isAdmin,
  isFunctionFlowDesignActive,
  isLoadingSubsystemMenus,
  isResearchRecordActive,
  isServerPermissionActive,
  isSubsystemOpen,
  isToolFeedbackActive,
  menuLoadError,
  onLogout,
  onSwitchCompany,
  onOpenFunctionFlowDesign,
  onOpenServerPermission,
  onOpenResearchRecord,
  onOpenToolFeedback,
  reloadSubsystemMenus,
  subsystemMenus,
  toggleSubsystemExpansion,
  toggleSubsystemOpen,
  currentUserName,
}: {
  activeFirstLevelMenuId: string;
  activeSubsystem: string;
  companyTitle: string;
  currentUserName: string;
  expandedSubsystemId: string | null;
  handleFirstLevelMenuClick: (subsystemId: string, menu: BackendMenuNode) => void;
  isAdmin: boolean;
  isFunctionFlowDesignActive: boolean;
  isLoadingSubsystemMenus: boolean;
  isResearchRecordActive: boolean;
  isServerPermissionActive: boolean;
  isSubsystemOpen: boolean;
  isToolFeedbackActive: boolean;
  menuLoadError: string | null;
  onLogout: () => void;
  onSwitchCompany?: () => void;
  onOpenFunctionFlowDesign: () => void;
  onOpenServerPermission: () => void;
  onOpenResearchRecord: () => void;
  onOpenToolFeedback: () => void;
  reloadSubsystemMenus: () => Promise<void>;
  subsystemMenus: BackendSubsystemNode[];
  toggleSubsystemExpansion: (subsystemId: string) => void;
  toggleSubsystemOpen: () => void;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const currentUserAvatarText = currentUserName.trim().slice(0, 1) || '用';
  const workspaceBrandTitle = normalizeMenuTitle(companyTitle) || '朗速AI';
  const showNoModulePermissionNotice = !isLoadingSubsystemMenus && !menuLoadError && subsystemMenus.length === 0;

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200/80 px-5 pb-4 pt-5 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-2xl">rocket_launch</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1
                  className="max-w-[160px] truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white"
                  title={workspaceBrandTitle}
                >
                  {workspaceBrandTitle}
                </h1>
                <p className="mt-1 text-[10px] font-bold tracking-[0.18em] text-primary">模块工作台</p>
              </div>
              {onSwitchCompany ? (
                <button
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 transition-colors hover:border-sky-200 hover:bg-sky-100"
                  onClick={onSwitchCompany}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>切换业务库</span>
                </button>
              ) : null}
            </div>
            <p className="mt-3 truncate text-xs text-slate-500">
              当前业务库
              <span className="ml-1 font-semibold text-slate-700">{workspaceBrandTitle}</span>
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
        {showNoModulePermissionNotice ? (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-5 text-amber-700">
            当前账套尚未配置模块权限，请联系管理员。
          </div>
        ) : null}

        <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" href="#">
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-sm font-medium">控制台</span>
        </a>

        <div className="space-y-1 pt-2">
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isResearchRecordActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            onClick={onOpenResearchRecord}
            type="button"
          >
            <span className="material-symbols-outlined text-xl">assignment</span>
            <span className="text-sm font-medium">调研记录</span>
          </button>

          <button
            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors ${
              isSubsystemOpen
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            onClick={toggleSubsystemOpen}
            type="button"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">account_tree</span>
              <span className="text-sm font-bold">子系统配置</span>
            </div>
            <motion.span
              animate={{ rotate: isSubsystemOpen ? 180 : 0 }}
              className="material-symbols-outlined text-sm"
            >
              keyboard_arrow_down
            </motion.span>
          </button>

          <AnimatePresence>
            {isSubsystemOpen ? (
              <motion.div
                animate={{ height: 'auto', opacity: 1 }}
                className="ml-4 space-y-1 overflow-hidden border-l border-slate-200 pl-4 dark:border-slate-800"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
              >
                {menuLoadError ? (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-600">
                    <div>{menuLoadError}</div>
                    <button
                      className="mt-2 font-semibold text-rose-700 transition-colors hover:text-rose-800"
                      onClick={() => void reloadSubsystemMenus()}
                      type="button"
                    >
                      重新加载
                    </button>
                  </div>
                ) : null}

                <div className="ml-2 mt-2 space-y-1">
                  {subsystemMenus.map((subsystem) => {
                    const isExpanded = expandedSubsystemId === subsystem.id;
                    const subsystemFirstLevelMenus = (subsystem.children ?? []).filter(
                      (menu): menu is BackendMenuNode => menu.enabled !== false,
                    );
                    const isCurrentSubsystem = activeSubsystem === subsystem.id;

                    return (
                      <div key={subsystem.id} className="space-y-1">
                        <button
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors ${
                            isCurrentSubsystem || isExpanded
                              ? 'bg-primary/5 text-primary'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          onClick={() => toggleSubsystemExpansion(subsystem.id)}
                          type="button"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="material-symbols-outlined text-lg">account_tree</span>
                            <span className="truncate text-sm font-semibold">{normalizeMenuTitle(subsystem.title)}</span>
                          </div>
                          <span className="material-symbols-outlined text-base">
                            {isExpanded ? 'expand_more' : 'chevron_right'}
                          </span>
                        </button>

                        {isExpanded ? (
                          <div className="ml-4 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-800">
                            {subsystemFirstLevelMenus.length > 0 ? (
                              subsystemFirstLevelMenus.map((menu) => {
                                const isFirstLevelActive =
                                  activeSubsystem === subsystem.id && activeFirstLevelMenuId === menu.id;

                                return (
                                  <button
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                                      isFirstLevelActive
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                    key={menu.id}
                                    onClick={() => handleFirstLevelMenuClick(subsystem.id, menu)}
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-base">folder_open</span>
                                    <span className="truncate text-sm font-medium">{normalizeMenuTitle(menu.title)}</span>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-3 py-2 text-xs text-slate-400">当前子系统下暂无一级菜单。</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {isLoadingSubsystemMenus ? (
                    <div className="px-3 py-2 text-xs text-slate-400">正在加载子系统菜单...</div>
                  ) : null}

                  {!isLoadingSubsystemMenus && subsystemMenus.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400">暂无子系统菜单。</div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isFunctionFlowDesignActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            onClick={onOpenFunctionFlowDesign}
            type="button"
          >
            <span className="material-symbols-outlined text-xl">schema</span>
            <span className="text-sm font-medium">功能流程设计</span>
          </button>
        </div>

        <div className="space-y-1 pt-2">
          {isAdmin ? (
            <button
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                isServerPermissionActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
              onClick={onOpenServerPermission}
              type="button"
            >
              <span className="material-symbols-outlined text-xl">shield_lock</span>
              <span className="text-sm font-medium">权限管理</span>
            </button>
          ) : null}

          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isToolFeedbackActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            onClick={onOpenToolFeedback}
            type="button"
          >
            <span className="material-symbols-outlined text-xl">lightbulb</span>
            <span className="text-sm font-medium">意见上报</span>
          </button>
        </div>

        <div className="space-y-1 pt-2">
          <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" href="#">
            <span className="material-symbols-outlined text-xl">schema</span>
            <span className="text-sm font-medium">表单流程</span>
          </a>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" href="#">
            <span className="material-symbols-outlined text-xl">smart_toy</span>
            <span className="text-sm font-medium">AI 生成</span>
          </a>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" href="#">
            <span className="material-symbols-outlined text-xl">menu_book</span>
            <span className="text-sm font-medium">知识中心</span>
          </a>
        </div>
      </nav>

      <div className="relative border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
          onClick={() => setIsProfileOpen((prev) => !prev)}
          type="button"
        >
          <div className="flex min-w-0 items-center gap-3 text-left">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white bg-[linear-gradient(135deg,#eff6ff,#dbeafe)] text-sm font-black text-primary shadow-sm dark:border-slate-700 dark:bg-[linear-gradient(135deg,#1e293b,#334155)] dark:text-sky-200">
              {currentUserAvatarText}
            </div>
            <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{currentUserName}</span>
          </div>
          <span className="material-symbols-outlined text-sm text-slate-400">more_vert</span>
        </button>

        <AnimatePresence>
          {isProfileOpen ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-4 right-4 z-50 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
              exit={{ opacity: 0, y: 10 }}
              initial={{ opacity: 0, y: 10 }}
            >
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                onClick={onLogout}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span className="font-medium">退出登录</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </aside>
  );
}
