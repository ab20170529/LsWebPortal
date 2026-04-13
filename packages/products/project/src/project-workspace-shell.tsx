import { useEffect, useMemo, useState } from 'react';
import type React from 'react';

import { cx } from '@lserp/ui';

import type {
  ProjectWorkspaceGroup,
  ProjectWorkspaceItem,
} from './project-workspace-config';

type IconProps = React.SVGProps<SVGSVGElement>;

type ProjectWorkspaceShellProps = {
  keyword: string;
  onExitSystem: () => void;
  onKeywordChange: (value: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  selectedProjectName: string;
  workspaceContent: React.ReactNode;
  workspaceGroups: ProjectWorkspaceGroup[];
  workspaceItems: ProjectWorkspaceItem[];
  workspaceMode: string;
};

function GridIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <rect x="3" y="3" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="3" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="12" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.5 12.5 16.5 16.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function BellIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <path
        d="M10 4.25a3.25 3.25 0 0 0-3.25 3.25v1.43c0 .64-.2 1.26-.57 1.79l-.95 1.34a.9.9 0 0 0 .73 1.42h8.08a.9.9 0 0 0 .73-1.42l-.95-1.34a3.11 3.11 0 0 1-.57-1.79V7.5A3.25 3.25 0 0 0 10 4.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8.5 15.25a1.68 1.68 0 0 0 3 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function SettingsIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <path d="M10 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.75v1.5M10 15.75v1.5M15.84 4.16l-1.06 1.06M5.22 14.78l-1.06 1.06M17.25 10h-1.5M4.25 10h-1.5M15.84 15.84l-1.06-1.06M5.22 5.22 4.16 4.16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <path d="m7 5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function FolderIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <path
        d="M3.75 6.5c0-.97.78-1.75 1.75-1.75H8l1.4 1.5h5.1c.97 0 1.75.78 1.75 1.75v5.5c0 .97-.78 1.75-1.75 1.75h-9c-.97 0-1.75-.78-1.75-1.75v-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function StackIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <ellipse cx="10" cy="5.5" rx="5.5" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 5.5v4c0 1.38 2.46 2.5 5.5 2.5s5.5-1.12 5.5-2.5v-4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 9.5v4c0 1.38 2.46 2.5 5.5 2.5s5.5-1.12 5.5-2.5v-4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ExitIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <path d="M8 4.5H5.75A1.75 1.75 0 0 0 4 6.25v7.5c0 .97.78 1.75 1.75 1.75H8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 6.5 15 10l-4 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M14.5 10H8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function CloseIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <path d="M6 6 14 14M14 6 6 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function getWorkspaceIcon(itemId: string) {
  if (itemId === 'project-management' || itemId === 'task-submission') {
    return FolderIcon;
  }

  if (itemId === 'project-gantt-workspace' || itemId === 'project-analysis-dashboard') {
    return StackIcon;
  }

  return GridIcon;
}

export function ProjectWorkspaceShell({
  keyword,
  onExitSystem,
  onKeywordChange,
  onSelectWorkspace,
  selectedProjectName,
  workspaceContent,
  workspaceGroups,
  workspaceItems,
  workspaceMode,
}: ProjectWorkspaceShellProps) {
  const [openedWorkspaceIds, setOpenedWorkspaceIds] = useState<string[]>(() => [workspaceMode]);
  const isGanttWorkspace = workspaceMode === 'project-gantt-workspace';

  useEffect(() => {
    setOpenedWorkspaceIds((current) => {
      const validIds = current.filter((id) => workspaceItems.some((item) => item.id === id));
      return validIds.includes(workspaceMode) ? validIds : [...validIds, workspaceMode];
    });
  }, [workspaceItems, workspaceMode]);

  const currentWorkspace =
    workspaceItems.find((item) => item.id === workspaceMode) ??
    workspaceItems[0] ?? {
      description: '当前工作区尚未配置说明。',
      groupId: 'fallback',
      id: 'project-management' as const,
      label: '工作区',
      shortLabel: '工作区',
    };

  const currentGroup =
    workspaceGroups.find((group) => group.id === currentWorkspace.groupId) ??
    workspaceGroups.find((group) => group.itemIds.includes(currentWorkspace.id)) ?? {
      id: 'fallback',
      itemIds: [],
      label: '工作区',
    };

  const openedWorkspaceItems = useMemo(
    () => workspaceItems.filter((item) => openedWorkspaceIds.includes(item.id)),
    [openedWorkspaceIds, workspaceItems],
  );

  function openWorkspace(workspaceId: string) {
    setOpenedWorkspaceIds((current) =>
      current.includes(workspaceId) ? current : [...current, workspaceId],
    );
    onSelectWorkspace(workspaceId);
  }

  function closeWorkspace(workspaceId: string) {
    setOpenedWorkspaceIds((current) => {
      if (current.length === 1 && current[0] === workspaceId) {
        return current;
      }

      const next = current.filter((id) => id !== workspaceId);
      if (workspaceId === workspaceMode) {
        const fallbackId =
          next[next.length - 1] ??
          workspaceItems.find((item) => item.id === 'project-management')?.id ??
          workspaceItems[0]?.id;

        if (fallbackId) {
          onSelectWorkspace(fallbackId);
          return next.length > 0 ? next : [fallbackId];
        }
      }

      return next;
    });
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (openedWorkspaceItems.length === 0) {
      return;
    }

    if (event.key === 'Home') {
      openWorkspace(openedWorkspaceItems[0]?.id ?? workspaceMode);
      return;
    }

    if (event.key === 'End') {
      openWorkspace(openedWorkspaceItems[openedWorkspaceItems.length - 1]?.id ?? workspaceMode);
      return;
    }

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + openedWorkspaceItems.length) % openedWorkspaceItems.length;
    openWorkspace(openedWorkspaceItems[nextIndex]?.id ?? workspaceMode);
  }

  function handleCloseTab(event: React.MouseEvent<HTMLButtonElement>, workspaceId: string) {
    event.stopPropagation();
    closeWorkspace(workspaceId);
  }

  return (
    <div className="flex h-screen min-h-screen w-full flex-col overflow-hidden bg-[#f3f5f9] text-slate-900">
      <div className="flex h-full min-h-0 flex-1">
        <aside className="hidden w-[252px] shrink-0 border-r border-slate-200 bg-white xl:flex xl:flex-col">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563eb] text-white shadow-[0_18px_30px_-24px_rgba(37,99,235,0.8)]">
                <GridIcon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-black tracking-tight text-slate-900">
                  项目管理平台
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {workspaceGroups.map((group) => {
              const isCurrentGroup = group.id === currentGroup.id;

              return (
                <section key={group.id} className="mb-5">
                  <div
                    className={cx(
                      'flex items-center justify-between rounded-2xl px-3.5 py-2.5',
                      isCurrentGroup ? 'bg-[#eef4ff] text-[#1d4ed8]' : 'text-slate-500',
                    )}
                  >
                    <span className="text-[13px] font-bold tracking-[0.08em]">{group.label}</span>
                    <ChevronIcon className={cx('h-4 w-4 transition-transform', isCurrentGroup ? 'rotate-90' : '')} />
                  </div>

                  <div className="mt-2 space-y-1.5 pl-2">
                    {group.itemIds.map((itemId) => {
                      const item = workspaceItems.find((entry) => entry.id === itemId);
                      if (!item) {
                        return null;
                      }

                      const isActive = item.id === workspaceMode;
                      const ItemIcon = getWorkspaceIcon(item.id);

                      return (
                        <button
                          key={item.id}
                          className={cx(
                            'flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all',
                            isActive
                              ? 'bg-[#2563eb] text-white shadow-[0_18px_30px_-22px_rgba(37,99,235,0.75)]'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                          )}
                          onClick={() => {
                            openWorkspace(item.id);
                          }}
                          type="button"
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {item.label}
                          </span>
                          <ChevronIcon
                            className={cx('h-3.5 w-3.5', isActive ? 'text-white/80' : 'text-slate-300')}
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="px-4 lg:px-6">
              <div className="flex min-h-[52px] flex-col gap-2 py-2.5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
                    <span className="font-semibold text-slate-900">项目管理平台</span>
                    <span>/</span>
                    <span>{currentGroup.label}</span>
                    <span>/</span>
                    <span>{currentWorkspace.label}</span>
                    <span>/</span>
                    <span className="truncate text-slate-700">{selectedProjectName}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative block min-w-[220px] flex-1 xl:w-[320px] xl:flex-none">
                    <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        onKeywordChange(event.target.value);
                      }}
                      placeholder="搜索项目、模块或负责人"
                      value={keyword}
                    />
                  </label>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                    type="button"
                  >
                    <BellIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                    type="button"
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-9 items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 text-sm font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-100"
                    onClick={onExitSystem}
                    type="button"
                  >
                    <ExitIcon className="h-4 w-4" />
                    退出系统
                  </button>
                </div>
              </div>

              <div className="flex min-h-[42px] items-end gap-3 overflow-x-auto border-t border-slate-100 pt-2">
                <div aria-label="工作区标签" className="flex min-w-max items-end gap-1.5" role="tablist">
                  {openedWorkspaceItems.map((tab, index) => {
                    const isActive = tab.id === workspaceMode;

                    return (
                      <div
                        key={tab.id}
                        className={cx(
                          'flex items-center gap-1 rounded-t-xl border border-b-0 px-1.5',
                          isActive
                            ? 'border-slate-200 bg-[#eaf2ff] text-[#1d4ed8]'
                            : 'border-transparent bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                        )}
                      >
                        <button
                          aria-controls={`project-panel-${tab.id}`}
                          aria-selected={isActive}
                          className="flex items-center gap-2 px-2.5 py-2 text-sm font-semibold"
                          id={`project-tab-${tab.id}`}
                          onClick={() => {
                            openWorkspace(tab.id);
                          }}
                          onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
                            handleTabKeyDown(event, index);
                          }}
                          role="tab"
                          tabIndex={isActive ? 0 : -1}
                          type="button"
                        >
                          <span className="text-xs font-bold tracking-[0.18em] opacity-70">
                            {tab.shortLabel}
                          </span>
                          <span>{tab.label}</span>
                        </button>
                        <button
                          aria-label={`关闭${tab.label}`}
                          className={cx(
                            'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors',
                            isActive ? 'hover:bg-[#dbeafe]' : 'hover:bg-slate-100',
                          )}
                          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                            handleCloseTab(event, tab.id);
                          }}
                          type="button"
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </header>

          <main
            className={cx(
              'flex h-full min-h-0 flex-1 overflow-hidden',
              isGanttWorkspace ? 'px-0 py-0' : 'px-4 py-4 lg:px-6 lg:py-5',
            )}
          >
            <section
              aria-labelledby={`project-tab-${workspaceMode}`}
              className={cx(
                'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white',
                isGanttWorkspace
                  ? 'border-0 rounded-none shadow-none'
                  : 'rounded-[24px] border border-slate-200 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.26)]',
              )}
              id={`project-panel-${workspaceMode}`}
              role="tabpanel"
            >
              <div
                className={cx(
                  'flex h-full min-h-0 flex-1 bg-white',
                  isGanttWorkspace ? 'overflow-hidden p-0' : 'p-4 lg:p-6',
                )}
              >
                <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  {workspaceContent}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
