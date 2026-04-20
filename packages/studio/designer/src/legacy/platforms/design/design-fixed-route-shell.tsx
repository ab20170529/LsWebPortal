import type { ReactNode } from 'react';

import type { DesignRouteKey } from '../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../app/registry/platform-registry';
import { PlatformPlaceholderShell } from '../../app/shells/platform-placeholder-shell';
import {
  DESIGN_FIXED_ROUTE_META,
  type DesignRouteMeta,
} from './design-route-meta';

type DesignFixedRouteShellProps = {
  children?: ReactNode;
  currentPath: string;
  currentRouteKey: DesignRouteKey;
  eyebrow?: string;
  platform: PlatformDefinition;
  routeMeta: DesignRouteMeta;
  showPlatformHeader?: boolean;
  showRouteOverview?: boolean;
};

export function DesignFixedRouteShell({
  children,
  currentPath,
  currentRouteKey,
  eyebrow = '设计页面',
  platform,
  routeMeta,
  showPlatformHeader = true,
  showRouteOverview = true,
}: DesignFixedRouteShellProps) {
  const visibleRoutes = DESIGN_FIXED_ROUTE_META.filter((item) => item.key !== 'workspace');
  const routeKeyLabelMap: Record<string, string> = {
    bill: '布局',
    module: '模块',
    settings: '设置',
  };

  return (
    <PlatformPlaceholderShell
      currentPath={currentPath}
      platform={platform}
      showHeader={showPlatformHeader}
      summary={routeMeta.summary}
      title={`${platform.name} / ${routeMeta.title}`}
    >
      {showRouteOverview ? (
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/70 bg-white/72 p-6 shadow-[0_20px_42px_-30px_rgba(15,23,42,0.3)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{routeMeta.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              当前设计端以稳定可用为优先，先把独立页面做顺，再逐步补回真正需要的设计能力，不再默认带出旧工作区逻辑。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {visibleRoutes.map((item) => {
              const isCurrent = item.key === currentRouteKey;

              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={`rounded-3xl border px-5 py-5 transition-all ${
                    isCurrent
                      ? 'border-primary/20 bg-primary/10 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.45)]'
                      : 'border-white/70 bg-white/75 hover:border-primary/20 hover:bg-white'
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{routeKeyLabelMap[item.key] ?? item.key}</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{item.title}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
                </a>
              );
            })}
          </div>

          {children}
        </div>
      ) : children}
    </PlatformPlaceholderShell>
  );
}
