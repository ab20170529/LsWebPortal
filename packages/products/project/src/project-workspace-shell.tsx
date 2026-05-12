import { useMemo } from 'react';
import type React from 'react';
import {
  Bell,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  CircleQuestionMark,
  ClipboardList,
  Clock3,
  FolderKanban,
  Grid2x2,
  Home,
  Menu,
  PanelsTopLeft,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import { cx } from '@lserp/ui';

import type {
  ProjectWorkspaceGroup,
  ProjectWorkspaceItem,
} from './project-workspace-config';

type ProjectWorkspaceShellProps = {
  currentUserName: string;
  onExitSystem: () => void;
  onSelectWorkspace: (workspaceId: string) => void;
  workspaceContent: React.ReactNode;
  workspaceGroups: ProjectWorkspaceGroup[];
  workspaceItems: ProjectWorkspaceItem[];
  workspaceMode: string;
};

type ShellSectionTone = 'amber' | 'emerald' | 'indigo' | 'sky' | 'slate';

type ShellSection = {
  description: string;
  emphasis: 'primary' | 'secondary';
  id: string;
  itemIds: ProjectWorkspaceItem['id'][];
  label: string;
  tone: ShellSectionTone;
};

const SHELL_SECTION_BLUEPRINTS: ShellSection[] = [
  {
    id: 'my-work',
    label: '我的工作',
    description: '成员填报、计划日志和延期申请等日常执行入口。',
    tone: 'emerald',
    emphasis: 'primary',
    itemIds: ['task-submission', 'plan-log', 'delay-application'],
  },
  {
    id: 'project-control',
    label: '项目控制',
    description: '项目台账与排期协同，承接项目建立、排期和交付推进。',
    tone: 'sky',
    emphasis: 'primary',
    itemIds: ['project-management', 'project-gantt-workspace'],
  },
  {
    id: 'insight',
    label: '洞察分析',
    description: '聚焦项目分析与全局理解，适合查看与复盘。',
    tone: 'indigo',
    emphasis: 'primary',
    itemIds: ['project-analysis-dashboard'],
  },
  {
    id: 'standards',
    label: '标准配置',
    description: '模板与标准能力，适合配置而不是高频日常操作。',
    tone: 'amber',
    emphasis: 'secondary',
    itemIds: ['milestone-template-management'],
  },
  {
    id: 'admin',
    label: '权限治理',
    description: '用户与角色权限配置，默认降低视觉权重。',
    tone: 'slate',
    emphasis: 'secondary',
    itemIds: [
      'project-user-permission-management',
      'project-role-permission-management',
    ],
  },
];

const SHELL_ICON_STROKE_WIDTH = 1.8;

function getWorkspaceIcon(itemId: string): LucideIcon {
  if (itemId === 'task-submission') {
    return ClipboardList;
  }

  if (itemId === 'plan-log' || itemId === 'project-gantt-workspace') {
    return CalendarDays;
  }

  if (itemId === 'delay-application') {
    return Clock3;
  }

  if (itemId === 'project-management') {
    return FolderKanban;
  }

  if (itemId === 'project-analysis-dashboard') {
    return ChartNoAxesColumnIncreasing;
  }

  if (itemId === 'milestone-template-management') {
    return PanelsTopLeft;
  }

  if (itemId === 'project-user-permission-management') {
    return UserRound;
  }

  if (itemId === 'project-role-permission-management') {
    return Settings;
  }

  return Grid2x2;
}

function buildShellSections(
  workspaceGroups: ProjectWorkspaceGroup[],
  workspaceItems: ProjectWorkspaceItem[],
): ShellSection[] {
  const availableIds = new Set(workspaceItems.map((item) => item.id));
  const mappedIds = new Set<ProjectWorkspaceItem['id']>();

  const sections = SHELL_SECTION_BLUEPRINTS.map((section) => {
    const itemIds = section.itemIds.filter((itemId) => availableIds.has(itemId));
    itemIds.forEach((itemId) => {
      mappedIds.add(itemId);
    });
    return {
      ...section,
      itemIds,
    };
  }).filter((section) => section.itemIds.length > 0);

  for (const group of workspaceGroups) {
    const itemIds = group.itemIds.filter(
      (itemId) => availableIds.has(itemId) && !mappedIds.has(itemId),
    );

    if (itemIds.length === 0) {
      continue;
    }

    sections.push({
      id: group.id,
      label: group.label,
      description: '补充工作区分组。',
      tone: 'slate',
      emphasis: 'secondary',
      itemIds,
    });
  }

  return sections;
}

export function ProjectWorkspaceShell({
  currentUserName,
  onExitSystem,
  onSelectWorkspace,
  workspaceContent,
  workspaceGroups,
  workspaceItems,
  workspaceMode,
}: ProjectWorkspaceShellProps) {
  const shellSections = useMemo(
    () => buildShellSections(workspaceGroups, workspaceItems),
    [workspaceGroups, workspaceItems],
  );

  const currentWorkspace =
    workspaceItems.find((item) => item.id === workspaceMode) ??
    workspaceItems[0] ?? {
      description: '当前工作区尚未配置说明。',
      groupId: 'fallback',
      id: 'project-management' as const,
      label: '工作区',
      shortLabel: '工作区',
    };

  const normalizedUserName = currentUserName?.trim() || '张伟';
  const CurrentWorkspaceIcon = getWorkspaceIcon(currentWorkspace.id);

  function openWorkspace(workspaceId: string) {
    onSelectWorkspace(workspaceId);
  }

  function returnToSystemPage() {
    if (typeof window !== 'undefined') {
      window.location.href = '/systems';
    }
  }

  return (
    <div className="portal-project-shell flex h-screen min-h-screen w-full flex-col overflow-hidden bg-[#f5f8fc]">
      <header className="h-[60px] shrink-0 border-b border-[#e3ebf6] bg-white">
        <div className="flex h-full">
          <div className="flex w-[254px] shrink-0 items-center gap-3 border-r border-[#e3ebf6] px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--portal-color-brand-500)] text-white shadow-[0_10px_20px_-16px_rgba(37,99,235,0.8)]">
              <Grid2x2 className="h-4 w-4" strokeWidth={SHELL_ICON_STROKE_WIDTH} />
            </div>
            <div className="truncate text-[18px] font-bold leading-none text-slate-900">
              项目管理平台
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-between px-4 text-[#526681]">
            <div className="flex min-w-0 items-center gap-5">
              <button
                aria-label="展开菜单"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#6f83a3] transition-colors hover:bg-[#f3f7fc] hover:text-[#263653]"
                type="button"
              >
                <Menu className="h-4 w-4" strokeWidth={SHELL_ICON_STROKE_WIDTH} />
              </button>
              <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--portal-color-brand-600)]">
                <CurrentWorkspaceIcon className="h-4 w-4 shrink-0" strokeWidth={SHELL_ICON_STROKE_WIDTH} />
                <span className="truncate">{currentWorkspace.label}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-5 text-[13px] font-medium">
              <button
                aria-label="返回主系统页面"
                className="inline-flex h-8 items-center gap-1.5 text-[#526681] transition-colors hover:text-[var(--portal-color-brand-600)]"
                onClick={returnToSystemPage}
                type="button"
              >
                <Home className="h-4 w-4" strokeWidth={SHELL_ICON_STROKE_WIDTH} />
                返回主系统
              </button>
              <button aria-label="帮助中心" className="inline-flex h-8 items-center gap-1.5 text-[#526681] transition-colors hover:text-[#1d2f4f]" type="button">
                <CircleQuestionMark className="h-4 w-4" strokeWidth={SHELL_ICON_STROKE_WIDTH} />
                帮助中心
              </button>
              <button aria-label="消息中心" className="relative inline-flex h-8 items-center gap-1.5 text-[#526681] transition-colors hover:text-[#1d2f4f]" type="button">
                <Bell className="h-4 w-4" strokeWidth={SHELL_ICON_STROKE_WIDTH} />
                消息中心
                <span className="absolute -top-1 left-3.5 min-w-[20px] rounded-full bg-[#ff2d55] px-1.5 text-center text-[10px] font-bold leading-4 text-white">
                  12
                </span>
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md px-1 text-[13px] font-semibold text-[#1d2f4f] transition-colors hover:bg-[#f3f7fc]" type="button">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#eef4fb]">
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src="/drawio/img/people/Suit_Man_Blue_128x128.png"
                  />
                </span>
                <span>{normalizedUserName}</span>
                <ChevronRight className="h-3.5 w-3.5 rotate-90 text-[#8da0bd]" strokeWidth={SHELL_ICON_STROKE_WIDTH} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[254px] shrink-0 border-r border-[#e3ebf6] bg-white xl:flex xl:flex-col">
          <nav className="flex-1 overflow-y-auto px-5 py-4">
            {shellSections.map((section) => {
              return (
                <section key={section.id} className="mb-7">
                  <div className="text-xs font-semibold leading-5 text-[#8da0bd]">
                    {section.label}
                  </div>

                  <div className="mt-2 space-y-1">
                    {section.itemIds.map((itemId) => {
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
                            'flex h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--project-control-focus-ring)]',
                            isActive
                              ? 'bg-[#edf5ff] font-semibold text-[var(--portal-color-brand-600)]'
                              : 'font-semibold text-[#263653] hover:bg-[#f6f9fd] hover:text-[#111c33]',
                          )}
                          onClick={() => {
                            openWorkspace(item.id);
                          }}
                          type="button"
                        >
                          <span
                            className={cx(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                              isActive ? 'bg-[#dcecff]' : 'bg-transparent',
                            )}
                          >
                            <ItemIcon className={cx('h-4 w-4 shrink-0', isActive ? 'text-[var(--portal-color-brand-500)]' : 'text-[#30435f]')} strokeWidth={SHELL_ICON_STROKE_WIDTH} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </nav>
          <div className="shrink-0 border-t border-transparent px-5 pb-5 pt-3">
            <button
              className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-semibold text-[#8da0bd] transition-colors hover:bg-[#f6f9fd] hover:text-[#526681]"
              type="button"
            >
              <ChevronRight className="h-4 w-4 rotate-180" strokeWidth={SHELL_ICON_STROKE_WIDTH} />
              <span>收起菜单</span>
            </button>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f5f8fc] p-4">
          <section
            aria-label={currentWorkspace.label}
            className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            id={`project-panel-${workspaceMode}`}
            role="tabpanel"
          >
            {workspaceContent}
          </section>
        </main>
      </div>
    </div>
  );
}
