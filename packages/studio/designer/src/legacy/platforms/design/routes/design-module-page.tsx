import type { DesignFixedRoute } from '../../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../../app/registry/platform-registry';
import type { BackendMenuNode } from '../../../lib/backend-menus';
import { DesignFixedRouteShell } from '../design-fixed-route-shell';
import {
  buildDesignModulePath,
  buildDesignWorkspacePath,
  navigateToDesignPath,
} from '../navigation/design-navigation';
import { getDesignRouteMeta } from '../design-route-meta';
import { DesignModuleDetailPanel } from './design-module-detail-panel';
import {
  getEnabledMenuNodes,
  getMenuModuleTypeProfile,
  normalizeMenuCode,
  normalizeMenuTitle,
  resolveModuleCardAccent,
  resolveModuleStatus,
} from './design-module-browser-utils';
import { useDesignModuleBrowser } from './use-design-module-browser';

type DesignModulePageProps = {
  currentPath: string;
  platform: PlatformDefinition;
  route: DesignFixedRoute;
};

export function DesignModulePage({
  currentPath,
  platform,
  route,
}: DesignModulePageProps) {
  const routeMeta = getDesignRouteMeta('module');
  const {
    activeFirstLevelMenu,
    activeSubsystemId,
    expandedSubsystemId,
    firstLevelMenus,
    isLoadingSecondLevelMenus,
    isLoadingSubsystemMenus,
    menuLoadError,
    secondLevelMenus,
    selectedModule,
    selectedSubsystem,
    subsystemMenus,
    setActiveFirstLevelMenuId,
    setActiveSubsystemId,
    setExpandedSubsystemId,
    setSelectedModuleId,
  } = useDesignModuleBrowser(route.context);

  if (!routeMeta) {
    return null;
  }

  const subsystemCount = subsystemMenus.length;
  const firstLevelCount = firstLevelMenus.length;
  const secondLevelCount = secondLevelMenus.length;

  return (
    <DesignFixedRouteShell
      currentPath={currentPath}
      currentRouteKey="module"
      eyebrow="Module design route"
      platform={platform}
      routeMeta={routeMeta}
    >
      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="rounded-[24px] border border-white/70 bg-white/78 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Live menu browser</div>
              <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">Subsystem and module navigation</h3>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 transition-colors hover:border-primary/20 hover:text-primary"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Subsystems</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{subsystemCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Menus</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{firstLevelCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Modules</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{secondLevelCount}</div>
            </div>
          </div>

          {menuLoadError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
              {menuLoadError}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {isLoadingSubsystemMenus ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center text-sm text-slate-500">
                Loading subsystem menus...
              </div>
            ) : subsystemMenus.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center text-sm text-slate-500">
                No subsystem menus are available yet.
              </div>
            ) : (
              subsystemMenus.map((subsystem) => {
                const subsystemMenusForNode = getEnabledMenuNodes<BackendMenuNode>(subsystem.children);
                const isExpanded = expandedSubsystemId === subsystem.id;
                const isActiveSubsystem = activeSubsystemId === subsystem.id;

                return (
                  <div key={subsystem.id} className="rounded-[24px] border border-slate-200/80 bg-white/90">
                    <button
                      type="button"
                      onClick={() => {
                        const nextFirstLevelMenu = subsystemMenusForNode[0] ?? null;
                        setExpandedSubsystemId((prev) => prev === subsystem.id ? null : subsystem.id);
                        setActiveSubsystemId(subsystem.id);
                        setActiveFirstLevelMenuId(nextFirstLevelMenu?.id ?? '');
                        navigateToDesignPath(buildDesignModulePath({
                          menuCode: nextFirstLevelMenu?.code,
                          subsystemCode: subsystem.subsysCode ?? subsystem.code,
                        }));
                      }}
                      className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                        isActiveSubsystem ? 'text-primary' : 'text-slate-700 hover:text-primary'
                      }`}
                    >
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          {normalizeMenuCode(subsystem.subsysCode ?? subsystem.code) || 'SUBSYSTEM'}
                        </div>
                        <div className="mt-2 text-base font-bold">{normalizeMenuTitle(subsystem.title) || 'Unnamed subsystem'}</div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                        {subsystemMenusForNode.length} menus
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-slate-200/80 px-4 py-4">
                        <div className="space-y-2">
                          {subsystemMenusForNode.map((menu) => {
                            const isActiveMenu = activeFirstLevelMenu?.id === menu.id;

                            return (
                              <button
                                key={menu.id}
                                type="button"
                              onClick={() => {
                                  setActiveSubsystemId(subsystem.id);
                                  setActiveFirstLevelMenuId(menu.id);
                                  navigateToDesignPath(buildDesignModulePath({
                                    menuCode: menu.code,
                                    subsystemCode: subsystem.subsysCode ?? subsystem.code,
                                  }));
                                }}
                                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                  isActiveMenu
                                    ? 'border-primary/20 bg-primary/10 text-primary'
                                    : 'border-slate-200/80 bg-slate-50/70 text-slate-700 hover:border-primary/20 hover:bg-white'
                                }`}
                              >
                                <div>
                                  <div className="font-semibold">{normalizeMenuTitle(menu.title) || 'Unnamed menu'}</div>
                                  <div className="mt-1 font-mono text-[11px] text-slate-400">
                                    {normalizeMenuCode(menu.code) || 'MENU'}
                                  </div>
                                </div>
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/70 bg-white/78 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Module cards</div>
              <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                {normalizeMenuTitle(activeFirstLevelMenu?.title) || 'Select a menu'}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                This page now keeps subsystem, first-level menu, and module selection in the URL so refresh and
                collaboration links can reopen the same module context instead of resetting to the default entry.
              </p>
            </div>
            <a
              href={buildDesignWorkspacePath({
                menuCode: activeFirstLevelMenu?.code,
                subsystemCode: selectedSubsystem?.subsysCode ?? selectedSubsystem?.code,
              })}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 transition-colors hover:border-primary/20 hover:text-primary"
            >
              Open workspace
            </a>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{normalizeMenuTitle(selectedSubsystem?.title) || 'No subsystem selected'}</span>
            {' / '}
            <span>{normalizeMenuTitle(activeFirstLevelMenu?.title) || 'No menu selected'}</span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 md:grid-cols-2">
              {isLoadingSecondLevelMenus ? (
                <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center text-sm text-slate-500">
                  Loading module cards...
                </div>
              ) : secondLevelMenus.length === 0 ? (
                <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center text-sm text-slate-500">
                  The selected menu has no second-level module entries yet.
                </div>
              ) : (
                secondLevelMenus.map((menu, index) => {
                  const moduleTypeProfile = getMenuModuleTypeProfile(menu.moduleType);
                  const status = resolveModuleStatus(menu);
                  const accent = resolveModuleCardAccent(index);
                  const menuCode = normalizeMenuCode(menu.code) || `MODULE-${index + 1}`;
                  const menuStruct = normalizeMenuCode(menu.menuStruct) || 'N/A';
                  const purviewId = normalizeMenuCode(menu.purviewId) || 'N/A';

                  return (
                    <article
                      key={menu.id}
                      onClick={() => {
                        setSelectedModuleId(menu.id);
                        navigateToDesignPath(buildDesignModulePath({
                          menuCode: activeFirstLevelMenu?.code,
                          moduleCode: menu.purviewId || menu.code,
                          subsystemCode: selectedSubsystem?.subsysCode ?? selectedSubsystem?.code,
                        }));
                      }}
                      className="group flex cursor-pointer flex-col rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_52px_-36px_rgba(15,23,42,0.3)]"
                    >
                      <div className="flex items-start justify-between px-5 pb-0 pt-5">
                        <div className={`flex size-14 items-center justify-center rounded-2xl border transition-all ${accent.iconClass}`}>
                          <span className="material-symbols-outlined text-3xl">{accent.icon}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-2 rounded-full border px-2.5 py-1 ${status.badgeClass}`}>
                            <span className={`inline-flex size-2 rounded-full ${status.dotClass}`} />
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{status.label}</span>
                          </div>
                          {moduleTypeProfile ? (
                            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${moduleTypeProfile.badgeClass}`}>
                              <span className="material-symbols-outlined text-[14px]">{moduleTypeProfile.icon}</span>
                              <span className="text-[11px] font-semibold tracking-[0.18em]">{moduleTypeProfile.label}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex-1 px-5 pb-5 pt-4">
                        <h4 className="text-lg font-bold tracking-tight text-slate-950">
                          {normalizeMenuTitle(menu.title) || 'Unnamed module'}
                        </h4>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-500">
                            {menuCode}
                          </code>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Menu struct</div>
                            <div className="mt-2 font-mono text-[12px] text-slate-600">{menuStruct}</div>
                          </div>
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Permission key</div>
                            <div className="mt-2 font-mono text-[12px] text-slate-600">{purviewId}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-b-[24px] border-t border-slate-100 bg-slate-50/80 px-5 py-4">
                        <span className="text-[12px] font-semibold text-slate-500">
                          {selectedModule?.id === menu.id ? 'Selected for detail review' : 'Future destination: module workbench'}
                        </span>
                        <a
                          href={buildDesignWorkspacePath({
                            menuCode: activeFirstLevelMenu?.code,
                            subsystemCode: selectedSubsystem?.subsysCode ?? selectedSubsystem?.code,
                          })}
                          className={`text-[13px] font-bold text-slate-500 transition-colors ${accent.actionClass}`}
                        >
                          Continue in workspace
                        </a>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <DesignModuleDetailPanel
              activeFirstLevelMenuName={normalizeMenuTitle(activeFirstLevelMenu?.title)}
              selectedModule={selectedModule}
              selectedSubsystemName={normalizeMenuTitle(selectedSubsystem?.title)}
            />
          </div>
        </section>
      </div>
    </DesignFixedRouteShell>
  );
}
