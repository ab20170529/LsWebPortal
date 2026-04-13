import type React from 'react';
import {
  startTransition,
  useMemo,
  type CSSProperties,
  type PropsWithChildren,
} from 'react';
import {
  getGrantedSystemIds,
  hasSystemAccess,
  usePortalAuth,
} from '@lserp/auth';
import { getPlatformSystemEntry, portalNavItems } from '@lserp/contracts';
import { AppLogo, Badge, Button, Card, cx } from '@lserp/ui';

import { clearAuthSession } from '../features/auth/services/storage-service';
import { navigate } from '../router';
import { usePortalPresentation } from './presentation/portal-presentation-provider';

type AppShellProps = PropsWithChildren<{
  pathname: string;
}>;

const activeNavStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--portal-color-brand-500) 28%, white)',
  backgroundColor: 'color-mix(in srgb, var(--portal-color-brand-500) 10%, white)',
  boxShadow: '0 22px 44px -30px rgba(15, 23, 42, 0.35)',
};

const idleNavStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--portal-color-border-soft) 76%, white)',
  backgroundColor: 'color-mix(in srgb, var(--portal-color-surface-panel) 82%, white)',
};

const userPillStyle: CSSProperties = {
  border: '1px solid color-mix(in srgb, var(--portal-color-border-soft) 76%, white)',
  background:
    'color-mix(in srgb, var(--portal-color-surface-panel) 84%, transparent)',
  color: 'var(--portal-color-text-secondary)',
};

export function AppShell({ children, pathname }: AppShellProps) {
  const { isAuthenticated, session, signOut } = usePortalAuth();
  const { shellLayoutId } = usePortalPresentation();
  const grantedSystemIds = useMemo(() => getGrantedSystemIds(session), [session]);
  const accessibleSystemTitles = grantedSystemIds
    .map((systemId) => getPlatformSystemEntry(systemId)?.title ?? systemId)
    .join('、');
  const visibleNavItems = useMemo(
    () =>
      portalNavItems.filter((item) => {
        if (item.kind === 'shell') {
          return item.requiresAuth ? isAuthenticated : true;
        }

        return item.systemId ? hasSystemAccess(session, item.systemId) : false;
      }),
    [isAuthenticated, session],
  );

  const shellIntro = (
    <div>
      <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.26em]">
        Portal Shell
      </div>
      <h1 className="theme-text-strong mt-2 text-3xl font-black tracking-tight">
        登录、选系统、主题和布局统一归平台层管理
      </h1>
      <p className="theme-text-muted mt-3 max-w-3xl text-sm leading-7">
        业务系统只挂接到门户壳层里，不再各自重复实现登录页和导航框架。这样主题切换、布局切换和入口治理都可以在运行时统一生效。
      </p>
    </div>
  );

  const shellUserActions = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="rounded-full px-4 py-2 text-sm" style={userPillStyle}>
        {session ? `当前用户：${session.displayName}` : '当前用户：访客'}
      </div>
      <Button
        onClick={() => {
          startTransition(() => {
            clearAuthSession();
            signOut();
            navigate('/');
          });
        }}
        tone="neutral"
      >
        退出登录
      </Button>
    </div>
  );

  const navigation = (
    <nav className="portal-shell__nav" data-layout={shellLayoutId}>
      <div className="portal-shell__nav-list">
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.to || pathname.startsWith(`${item.to}/`);

          return (
            <a
              key={item.id}
              className={cx('portal-shell__nav-link')}
              data-layout={shellLayoutId}
              href={item.to}
              onClick={(
                event: Parameters<NonNullable<React.ComponentProps<'a'>['onClick']>>[0],
              ) => {
                event.preventDefault();
                startTransition(() => {
                  navigate(item.to);
                });
              }}
              style={isActive ? activeNavStyle : idleNavStyle}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="theme-text-strong text-sm font-bold">
                  {item.title}
                </div>
                <Badge tone={item.tone}>{item.shortLabel}</Badge>
              </div>
              <p className="theme-text-muted mt-2 text-sm leading-6">
                {item.description}
              </p>
            </a>
          );
        })}
      </div>

      {shellLayoutId === 'topbar' ? <div>{shellUserActions}</div> : null}
    </nav>
  );

  return (
    <div className="portal-shell">
      <div className="portal-shell__grid" data-layout={shellLayoutId}>
        {shellLayoutId === 'sidebar' ? (
          <aside className="portal-shell__sidebar glass-panel rounded-[32px]">
            <div className="space-y-5">
              <AppLogo subtitle="Unified Access Portal" title="LsERPPortal" />

              <p className="theme-text-muted max-w-xs text-sm leading-7">
                平台母基座统一接管登录入口、系统网关、主题和布局能力，让
                Designer、ERP、Project 在一个壳层下协同运行。
              </p>
            </div>

            {navigation}

            <Card className="rounded-[28px] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
                    Workspace Status
                  </div>
                  <div className="theme-text-strong mt-2 text-lg font-black tracking-tight">
                    已授权系统入口
                  </div>
                </div>
                <Badge tone="success">v1</Badge>
              </div>
              <p className="theme-text-muted mt-3 text-sm leading-7">
                当前版本已经把系统权限展示收回到门户层，登录账号不同，系统入口会跟着变化。
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone="neutral">
                  {isAuthenticated ? `系统数：${grantedSystemIds.length}` : '系统数：0'}
                </Badge>
                {isAuthenticated && accessibleSystemTitles ? (
                  <div className="theme-text-muted text-sm leading-7">
                    {accessibleSystemTitles}
                  </div>
                ) : null}
              </div>
            </Card>
          </aside>
        ) : (
          <header className="portal-shell__topbar glass-panel rounded-[32px]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <AppLogo subtitle="Unified Access Portal" title="LsERPPortal" />
                <p className="theme-text-muted max-w-3xl text-sm leading-7">
                  统一壳层支持运行时布局切换。当前是顶栏布局，业务内容和路由逻辑不需要跟着改。
                </p>
              </div>
              {shellUserActions}
            </div>
            <div className="mt-5">{navigation}</div>
          </header>
        )}

        <main className="portal-shell__content" data-layout={shellLayoutId}>
          {shellLayoutId === 'sidebar' ? (
            <header className="glass-panel flex flex-col gap-5 rounded-[32px] p-6 lg:flex-row lg:items-center lg:justify-between">
              {shellIntro}
              {shellUserActions}
            </header>
          ) : (
            <section className="glass-panel rounded-[32px] p-6">
              {shellIntro}
            </section>
          )}

          <section className="min-h-0 flex-1">{children}</section>
        </main>
      </div>
    </div>
  );
}
