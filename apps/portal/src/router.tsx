import { useEffect, useState, type ChangeEvent } from 'react';
import { hasSystemAccess, usePortalAuth } from '@lserp/auth';
import { BiHomePage } from '@lserp/bi';
import { getPlatformSystemEntry as getPlatformSystemEntryById } from '@lserp/contracts';
import { DesignerHomePage } from '@lserp/designer';
import { ErpHomePage } from '@lserp/erp';
import { ProjectHomePage } from '@lserp/project';
import { usePortalTheme } from '@lserp/tokens';
import { Badge, Button, Card } from '@lserp/ui';

import { AppShell } from './app/app-shell';
import {
  type PortalShellLayoutId,
  usePortalPresentation,
} from './app/presentation/portal-presentation-provider';
import { PortalLoginPage } from './features/auth/portal-login-page';
import { clearAuthSession } from './features/auth/services/storage-service';
import { AccessDeniedPage, SystemAccessPage } from './pages/system-access-page';
import { PortalSystemManagerPage } from './pages/portal-system-manager-page';

type RouteKey =
  | 'bi'
  | 'designer'
  | 'erp'
  | 'login'
  | 'not-found'
  | 'project'
  | 'settings'
  | 'system-manager'
  | 'systems';

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function navigate(to: string) {
  const nextPath = normalizePathname(to);
  window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function resolveRoute(pathname: string): RouteKey {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === '/bi' || normalizedPath.startsWith('/bi/')) {
    return 'bi';
  }

  switch (normalizedPath) {
    case '/':
      return 'login';
    case '/systems':
      return 'systems';
    case '/designer':
      return 'designer';
    case '/erp':
      return 'erp';
    case '/project':
      return 'project';
    case '/settings':
      return 'settings';
    case '/system-manager':
      return 'system-manager';
    default:
      return 'not-found';
  }
}

function isPlatformSystemRoute(route: RouteKey): route is 'bi' | 'designer' | 'erp' | 'project' {
  return route === 'bi' || route === 'designer' || route === 'erp' || route === 'project';
}

function getPlatformSystemEntry(route: RouteKey) {
  return isPlatformSystemRoute(route) ? getPlatformSystemEntryById(route) : undefined;
}

function usePathname() {
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname));

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(normalizePathname(window.location.pathname));
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return pathname;
}

function NotFoundPage() {
  return (
    <Card className="rounded-[28px] p-8">
      <Badge tone="danger">404</Badge>
      <h1 className="theme-text-strong mt-4 text-3xl font-black tracking-tight">
        当前页面尚未接入门户路由
      </h1>
      <p className="theme-text-muted mt-3 max-w-2xl text-sm leading-7">
        请通过门户统一路由挂接新的业务页面，避免各业务系统自行维护重复的外层壳结构。
      </p>
    </Card>
  );
}

function SettingsPage() {
  const { setShellLayoutId, shellLayoutId } = usePortalPresentation();
  const { overrides, presetId, presets, resetOverrides, setPreset, tokens, updateOverrides } =
    usePortalTheme();

  const layoutOptions: Array<{
    description: string;
    id: PortalShellLayoutId;
    label: string;
  }> = [
    {
      id: 'sidebar',
      label: '侧栏布局',
      description: '适合系统切换频繁、导航层级较深的企业后台场景。',
    },
    {
      id: 'topbar',
      label: '顶栏布局',
      description: '适合内容横向空间更重要的业务工作台。',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] p-8">
        <Badge>平台设置</Badge>
        <h1 className="theme-text-strong mt-4 text-3xl font-black tracking-tight">
          主题、布局与视图治理
        </h1>
        <p className="theme-text-muted mt-3 max-w-3xl text-sm leading-7">
          主题切换、布局切换与 Token 覆盖都属于平台层能力。页面表现可以变化，但不应反向侵入业务逻辑和运行时协议。
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] p-8">
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">主题预设</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {presets.map((preset) => {
              const isActive = preset.id === presetId;

              return (
                <button
                  key={preset.id}
                  className="rounded-[22px] border p-5 text-left transition-transform hover:-translate-y-0.5"
                  onClick={() => {
                    setPreset(preset.id);
                  }}
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--portal-color-brand-500) 9%, white)'
                      : 'color-mix(in srgb, var(--portal-color-surface-panel) 84%, white)',
                    borderColor: isActive
                      ? 'color-mix(in srgb, var(--portal-color-brand-500) 28%, white)'
                      : 'color-mix(in srgb, var(--portal-color-border-soft) 76%, white)',
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="theme-text-strong text-sm font-black tracking-tight">{preset.label}</div>
                    {isActive ? <Badge tone="brand">当前</Badge> : null}
                  </div>
                  <p className="theme-text-muted mt-3 text-sm leading-6">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-[28px] p-8">
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">布局模式</div>
          <div className="mt-5 space-y-4">
            {layoutOptions.map((layoutOption) => {
              const isActive = layoutOption.id === shellLayoutId;

              return (
                <button
                  key={layoutOption.id}
                  className="w-full rounded-[22px] border p-5 text-left transition-transform hover:-translate-y-0.5"
                  onClick={() => {
                    setShellLayoutId(layoutOption.id);
                  }}
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--portal-color-brand-500) 9%, white)'
                      : 'color-mix(in srgb, var(--portal-color-surface-panel) 84%, white)',
                    borderColor: isActive
                      ? 'color-mix(in srgb, var(--portal-color-brand-500) 28%, white)'
                      : 'color-mix(in srgb, var(--portal-color-border-soft) 76%, white)',
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="theme-text-strong text-sm font-black tracking-tight">
                      {layoutOption.label}
                    </div>
                    {isActive ? <Badge tone="brand">当前</Badge> : null}
                  </div>
                  <p className="theme-text-muted mt-3 text-sm leading-6">{layoutOption.description}</p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="rounded-[28px] p-8">
        <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">Token Overrides</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="theme-text-muted text-sm font-semibold">品牌主色</span>
            <input
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                updateOverrides({ brand500: event.target.value });
              }}
              type="color"
              value={overrides.brand500 ?? tokens.brand500}
            />
          </label>

          <label className="block space-y-2">
            <span className="theme-text-muted text-sm font-semibold">主文字色</span>
            <input
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                updateOverrides({ textPrimary: event.target.value });
              }}
              type="color"
              value={overrides.textPrimary ?? tokens.textPrimary}
            />
          </label>

          <label className="block space-y-2">
            <span className="theme-text-muted text-sm font-semibold">面板底色</span>
            <input
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                updateOverrides({ surfacePanel: event.target.value });
              }}
              type="color"
              value={overrides.surfacePanel ?? tokens.surfacePanel}
            />
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={resetOverrides} tone="ghost">
            重置自定义覆盖
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function PortalRouter() {
  const { isAuthenticated, session, signOut } = usePortalAuth();
  const pathname = usePathname();
  const route = resolveRoute(pathname);
  const isPublicBiShareRoute = pathname === '/bi/share' || pathname.startsWith('/bi/share/');

  useEffect(() => {
    if (isAuthenticated && session && route === 'login') {
      navigate('/systems');
    }
  }, [isAuthenticated, route, session]);

  if (route === 'login') {
    return <PortalLoginPage />;
  }

  if (route === 'bi' && isPublicBiShareRoute) {
    return <BiHomePage />;
  }

  if (!isAuthenticated || !session) {
    if (route === 'not-found') {
      return <PortalLoginPage targetLabel="目标页面" />;
    }

    const targetLabel =
      route === 'settings'
        ? '平台设置'
        : route === 'systems'
          ? '系统选择'
          : getPlatformSystemEntry(route)?.title ?? '目标系统';

    return <PortalLoginPage targetLabel={targetLabel} />;
  }

  if (route === 'systems') {
    return <SystemAccessPage session={session} />;
  }

  if (route === 'system-manager') {
    // 检查是否有管理权限（管理员或张又文）
    const isAdmin = session.admin === true;
    const isZhangYouwen = (session.employeeName ?? session.displayName ?? '').trim() === '张又文';
    if (!isAdmin && !isZhangYouwen) {
      return (
        <AppShell pathname={pathname}>
          <AccessDeniedPage session={session} targetLabel="系统管理" />
        </AppShell>
      );
    }
    return <PortalSystemManagerPage />;
  }

  if (route === 'project') {
    if (!hasSystemAccess(session, 'project')) {
      return (
        <AppShell pathname={pathname}>
          <AccessDeniedPage session={session} targetLabel="项目管理系统" />
        </AppShell>
      );
    }

    return (
      <ProjectHomePage
        onExitSystem={() => {
          clearAuthSession();
          signOut();
          navigate('/');
        }}
      />
    );
  }

  if (route === 'bi') {
    if (!hasSystemAccess(session, 'bi')) {
      return (
        <AppShell pathname={pathname}>
          <AccessDeniedPage session={session} targetLabel="BI 分析平台" />
        </AppShell>
      );
    }

    return <BiHomePage />;
  }

  let content = <NotFoundPage />;

  if (route === 'designer' || route === 'erp') {
    const targetLabel = getPlatformSystemEntry(route)?.title ?? route;

    if (!hasSystemAccess(session, route)) {
      content = <AccessDeniedPage session={session} targetLabel={targetLabel} />;
    } else {
      content = route === 'designer' ? <DesignerHomePage /> : <ErpHomePage />;
    }
  } else if (route === 'settings') {
    content = <SettingsPage />;
  }

  return <AppShell pathname={pathname}>{content}</AppShell>;
}
