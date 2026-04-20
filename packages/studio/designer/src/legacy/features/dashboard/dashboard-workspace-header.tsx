import React from 'react';

export function DashboardWorkspaceHeader({
  activeFirstLevelMenuName,
  activeSubsystemName,
  isFunctionFlowDesignActive,
  isResearchRecordActive,
  isServerPermissionActive,
  isToolFeedbackActive,
}: {
  activeFirstLevelMenuName: string;
  activeSubsystemName: string;
  isFunctionFlowDesignActive: boolean;
  isResearchRecordActive: boolean;
  isServerPermissionActive: boolean;
  isToolFeedbackActive: boolean;
}) {
  const showUtilityActions = !isServerPermissionActive;

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex h-full items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <h2 className="shrink-0 text-base font-bold text-slate-900 dark:text-white">
            {isServerPermissionActive
              ? '权限管理工作台'
              : isResearchRecordActive
                ? '调研记录工作台'
                : isFunctionFlowDesignActive
                  ? '功能流程设计工作台'
                  : isToolFeedbackActive
                    ? '意见上报工作台'
                    : '模块配置工作台'}
          </h2>
          <div className="mx-2 h-4 w-px shrink-0 bg-slate-200 dark:bg-slate-700"></div>
          <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-[13px] text-slate-500">
            {isServerPermissionActive ? (
              <>
                <span className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-200">系统管理</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                <span className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-200">权限管理中心</span>
              </>
            ) : (
              <>
                <span className="truncate transition-colors hover:text-primary">{activeSubsystemName}</span>
                {activeFirstLevelMenuName ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-200">
                      {activeFirstLevelMenuName}
                    </span>
                  </>
                ) : null}
                {isResearchRecordActive ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-200">调研记录</span>
                  </>
                ) : null}
                {isFunctionFlowDesignActive ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-200">功能流程设计</span>
                  </>
                ) : null}
                {isToolFeedbackActive ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-200">意见上报</span>
                  </>
                ) : null}
              </>
            )}
          </nav>
        </div>

        {showUtilityActions ? (
          <div className="flex items-center gap-3">
            <div className="group relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition-colors group-focus-within:text-primary">
                search
              </span>
              <input
                className="w-64 rounded-2xl border border-transparent bg-slate-100/70 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary/30 focus:bg-white dark:bg-slate-800/50 dark:focus:bg-slate-800 xl:w-72"
                placeholder="搜索模块名称、编码或状态..."
                type="text"
              />
            </div>

            <button
              className="hidden items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 xl:inline-flex"
              type="button"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
              <span>notifications</span>
            </button>

            <button
              className="hidden items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 xl:inline-flex"
              type="button"
            >
              <span className="material-symbols-outlined text-[19px]">settings</span>
              <span>settings</span>
            </button>
          </div>
        ) : (
          <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            仅超级管理员可维护权限配置
          </div>
        )}
      </div>
    </header>
  );
}
