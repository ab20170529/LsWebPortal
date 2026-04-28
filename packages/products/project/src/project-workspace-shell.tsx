import { useMemo } from 'react';
import type React from 'react';

import { cx } from '@lserp/ui';

import type {
  ProjectWorkspaceGroup,
  ProjectWorkspaceItem,
} from './project-workspace-config';

type IconProps = React.SVGProps<SVGSVGElement>;

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

function MenuIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <path d="M4.5 6h11M4.5 10h11M4.5 14h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
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

function TaskIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <rect x="5" y="4.5" width="10" height="12" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3.5h4M8 8.25h4M8 11.25h3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function CalendarIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <rect x="4" y="5" width="12" height="11" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.25 3.5v3M12.75 3.5v3M4.25 8h11.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function DelayIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.5v4l2.75 1.7M14.4 5.6l1.2-1.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function AnalysisIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <rect x="4" y="4" width="12" height="12" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 13l2.1-2.7 1.7 1.5L13.5 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function TemplateIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <path d="M6 4.5h3.5v3.5H6zM10.5 4.5H14v3.5h-3.5zM6 12h3.5v3.5H6zM10.5 12H14v3.5h-3.5z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.75 8v4M12.25 8v4M9.5 6.25h1M9.5 13.75h1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function UserIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 15.5c.7-2 2.3-3 4.5-3s3.8 1 4.5 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
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

function getWorkspaceIcon(itemId: string) {
  if (itemId === 'task-submission') {
    return TaskIcon;
  }

  if (itemId === 'plan-log' || itemId === 'project-gantt-workspace') {
    return CalendarIcon;
  }

  if (itemId === 'delay-application') {
    return DelayIcon;
  }

  if (itemId === 'project-management') {
    return FolderIcon;
  }

  if (itemId === 'project-analysis-dashboard') {
    return AnalysisIcon;
  }

  if (itemId === 'milestone-template-management') {
    return TemplateIcon;
  }

  if (itemId === 'project-user-permission-management') {
    return UserIcon;
  }

  if (itemId === 'project-role-permission-management') {
    return SettingsIcon;
  }

  return GridIcon;
}

function HelpIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.35 8.2a1.74 1.74 0 0 1 1.8-1.6c1.06 0 1.85.66 1.85 1.6 0 .78-.42 1.2-1.08 1.64-.55.36-.82.68-.82 1.26v.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M10.08 13.55h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
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

  return (
    <div className="portal-project-shell flex h-screen min-h-screen w-full flex-col overflow-hidden bg-[#f5f8fc]">
      <header className="h-[60px] shrink-0 border-b border-[#e3ebf6] bg-white">
        <div className="flex h-full">
          <div className="flex w-[254px] shrink-0 items-center gap-3 border-r border-[#e3ebf6] px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--portal-color-brand-500)] text-white shadow-[0_10px_20px_-16px_rgba(37,99,235,0.8)]">
              <GridIcon className="h-4 w-4" />
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
                <MenuIcon className="h-5 w-5" />
              </button>
              <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--portal-color-brand-600)]">
                <CurrentWorkspaceIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentWorkspace.label}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-5 text-[13px] font-medium">
              <button className="inline-flex h-8 items-center gap-1.5 text-[#526681] transition-colors hover:text-[#1d2f4f]" type="button">
                <HelpIcon className="h-4 w-4" />
                帮助中心
              </button>
              <button className="relative inline-flex h-8 items-center gap-1.5 text-[#526681] transition-colors hover:text-[#1d2f4f]" type="button">
                <BellIcon className="h-4 w-4" />
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
                <ChevronIcon className="h-3.5 w-3.5 rotate-90 text-[#8da0bd]" />
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
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                              isActive ? 'bg-[#dcecff]' : 'bg-transparent',
                            )}
                          >
                            <ItemIcon className={cx('h-4 w-4 shrink-0', isActive ? 'text-[var(--portal-color-brand-500)]' : 'text-[#30435f]')} />
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
              <ChevronIcon className="h-4 w-4 rotate-180" />
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
