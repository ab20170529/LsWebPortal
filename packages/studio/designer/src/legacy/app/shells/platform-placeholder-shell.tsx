import type { ReactNode } from 'react';

import type { PlatformDefinition } from '../registry/platform-registry';

type PlatformPlaceholderShellProps = {
  children?: ReactNode;
  currentPath: string;
  platform: PlatformDefinition;
  showHeader?: boolean;
  summary: string;
  title: string;
};

function formatRouteMode(routeMode: PlatformDefinition['routeMode']) {
  switch (routeMode) {
    case 'fixed':
      return '固定路由';
    case 'dynamic':
      return '动态路由';
    default:
      return '固定 + 动态';
  }
}

function formatLoginMode(loginMode: PlatformDefinition['loginMode']) {
  return loginMode === 'shared' ? '共享登录' : '独立登录';
}

function formatStatus(status: PlatformDefinition['status']) {
  return status === 'active' ? '启用中' : '规划中';
}

export function PlatformPlaceholderShell({
  children,
  currentPath,
  platform,
  showHeader = true,
  summary,
  title,
}: PlatformPlaceholderShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_28%),linear-gradient(180deg,#eef5ff_0%,#f8fbff_42%,#f2f6fb_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-6 px-4 py-6 lg:px-8">
        {showHeader ? (
          <header className="cloudy-glass-stage rounded-[32px] px-8 py-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                  {platform.name}
                  <span className="text-slate-400">/</span>
                  {formatStatus(platform.status)}
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{summary}</p>
                </div>
              </div>
              <div className="cloudy-glass-panel-soft grid gap-3 rounded-[28px] p-5 text-sm text-slate-600 sm:grid-cols-3 xl:min-w-[420px]">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">路由模式</div>
                  <div className="mt-2 font-semibold text-slate-900">{formatRouteMode(platform.routeMode)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">登录方式</div>
                  <div className="mt-2 font-semibold text-slate-900">{formatLoginMode(platform.loginMode)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">当前路径</div>
                  <div className="mt-2 break-all font-mono text-[12px] text-slate-700">{currentPath}</div>
                </div>
              </div>
            </div>
          </header>
        ) : null}

        <section className="cloudy-glass-panel rounded-[28px] p-4 md:p-6">{children}</section>
      </div>
    </div>
  );
}
