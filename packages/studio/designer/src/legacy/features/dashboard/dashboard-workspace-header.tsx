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
    <header className="h-16 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {isServerPermissionActive
            ? '权限配置工作台'
            : isResearchRecordActive
              ? '调研记录工作台'
              : isFunctionFlowDesignActive
                ? '功能流程设计工作台'
              : isToolFeedbackActive
                ? '意见上报工作台'
                : '模块配置工作台'}
        </h2>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
        <nav className="flex items-center gap-2 text-[13px] text-slate-500">
          {isServerPermissionActive ? (
            <>
              <span className="text-slate-900 dark:text-slate-200 font-semibold tracking-tight">系统管理</span>
              <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold tracking-tight">帐套权限</span>
            </>
          ) : (
            <>
              <span className="hover:text-primary transition-colors cursor-pointer">
                {activeSubsystemName}
              </span>
              {activeFirstLevelMenuName ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  <span className="text-slate-900 dark:text-slate-200 font-semibold tracking-tight">
                    {activeFirstLevelMenuName}
                  </span>
                </>
              ) : null}
              {isResearchRecordActive ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  <span className="text-slate-900 dark:text-slate-200 font-semibold tracking-tight">调研记录</span>
                </>
              ) : null}
              {isFunctionFlowDesignActive ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  <span className="text-slate-900 dark:text-slate-200 font-semibold tracking-tight">功能流程设计</span>
                </>
              ) : null}
              {isToolFeedbackActive ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  <span className="text-slate-900 dark:text-slate-200 font-semibold tracking-tight">意见上报</span>
                </>
              ) : null}
            </>
          )}
        </nav>
      </div>

      {showUtilityActions ? (
        <div className="flex items-center gap-6">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-primary">search</span>
            <input className="pl-10 pr-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-sm w-72 transition-all outline-none" placeholder="搜索模块名称、编码或状态..." type="text" />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:text-primary transition-colors relative">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <button className="p-2 text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          仅管理员可维护帐套权限
        </div>
      )}
    </header>
  );
}
