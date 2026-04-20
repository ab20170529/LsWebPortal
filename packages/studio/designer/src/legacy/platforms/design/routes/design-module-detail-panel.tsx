import type { BackendMenuNode } from '../../../lib/backend-menus';
import { buildDesignBillPath } from '../navigation/design-navigation';
import {
  getMenuModuleTypeProfile,
  normalizeMenuCode,
  normalizeMenuTitle,
  resolveModuleStatus,
} from './design-module-browser-utils';

type DesignModuleDetailPanelProps = {
  activeFirstLevelMenuName: string;
  selectedModule: BackendMenuNode | null;
  selectedSubsystemName: string;
};

function resolveNextRoute(selectedModule: BackendMenuNode | null) {
  const normalizedType = selectedModule?.moduleType?.trim().toLowerCase() || '';
  const moduleCode = selectedModule?.purviewId || selectedModule?.code;

  if (normalizedType === 'bill') {
    return {
      href: buildDesignBillPath({ moduleCode }),
      label: 'Go to bill route',
      summary: 'This module is already marked as a bill-oriented configuration and should move into the dedicated bill route with its module context preserved.',
    };
  }

  return {
    href: '/design/module',
    label: 'Stay on module route',
    summary: 'This module fits the module design route and can adopt table builder, conditions, and schema settings here first.',
  };
}

export function DesignModuleDetailPanel({
  activeFirstLevelMenuName,
  selectedModule,
  selectedSubsystemName,
}: DesignModuleDetailPanelProps) {
  const moduleTypeProfile = getMenuModuleTypeProfile(selectedModule?.moduleType);
  const nextRoute = resolveNextRoute(selectedModule);
  const status = selectedModule ? resolveModuleStatus(selectedModule) : null;

  return (
    <aside className="rounded-[24px] border border-slate-200/80 bg-white/92 p-6">
      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Selected module</div>
      <h4 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        {normalizeMenuTitle(selectedModule?.title) || 'Pick a module card'}
      </h4>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {selectedModule
          ? 'This detail panel is the next step toward pulling module-level configuration flows out of Dashboard.tsx.'
          : 'Select a second-level module card to inspect its current metadata and migration direction.'}
      </p>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Path context</div>
          <div className="mt-2 text-sm font-semibold text-slate-900">
            {selectedSubsystemName || 'No subsystem'} / {activeFirstLevelMenuName || 'No menu'}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Module code</div>
          <div className="mt-2 font-mono text-[12px] text-slate-600">
            {normalizeMenuCode(selectedModule?.code) || 'N/A'}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Permission key</div>
          <div className="mt-2 font-mono text-[12px] text-slate-600">
            {normalizeMenuCode(selectedModule?.purviewId) || 'N/A'}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {status ? (
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${status.badgeClass}`}>
            <span className={`inline-flex size-2 rounded-full ${status.dotClass}`} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{status.label}</span>
          </div>
        ) : null}
        {moduleTypeProfile ? (
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${moduleTypeProfile.badgeClass}`}>
            <span className="material-symbols-outlined text-[16px]">{moduleTypeProfile.icon}</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{moduleTypeProfile.label}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_100%)] p-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Migration recommendation</div>
        <p className="mt-3 text-sm leading-7 text-slate-600">{nextRoute.summary}</p>
        <a
          href={nextRoute.href}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[12px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          <span className="material-symbols-outlined text-[16px]">route</span>
          {nextRoute.label}
        </a>
      </div>

      <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Next extraction targets</div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <div>Module settings wizard</div>
          <div>Condition workbench and restriction panels</div>
          <div>Table builder and field-level schema editing</div>
        </div>
      </div>
    </aside>
  );
}
