import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import Login from '../../components/Login';
import type { AuthSession } from '../providers/auth-session-provider';
import { DesignPlatformApp } from '../../platforms/design/design-platform-app';
import {
  resolveDesignRoute,
  resolveRuntimeRoute,
} from '../contracts/platform-routing';
import type { PlatformDefinition } from '../registry/platform-registry';
import {
  getDefaultPlatform,
  getPlatformByBasePath,
  getPlatformById,
  PLATFORM_REGISTRY,
} from '../registry/platform-registry';
import { AppLoadingScreen } from '../shells/app-loading-screen';

const RuntimePlatformApp = lazy(() => import('../../platforms/runtime/runtime-platform-app').then((module) => ({ default: module.RuntimePlatformApp })));
const MesPlatformApp = lazy(() => import('../../platforms/mes/mes-platform-app').then((module) => ({ default: module.MesPlatformApp })));

type AppRouterProps = {
  onLogin: (session: AuthSession) => void;
  onLogout: () => void;
  session: AuthSession | null;
};

type RootRoute = {
  kind: 'root';
  pathname: '/';
};

type LoginRoute = {
  kind: 'login';
  pathname: string;
  platform: PlatformDefinition;
};

type PlatformRoute = {
  kind: 'platform';
  pathname: string;
  platform: PlatformDefinition;
  segments: string[];
};

type NotFoundRoute = {
  kind: 'not-found';
  pathname: string;
};

type AppRoute = RootRoute | LoginRoute | PlatformRoute | NotFoundRoute;

type NavigateOptions = {
  replace?: boolean;
};

const DEFAULT_DESIGN_HOME_PATH = '/design/module';
const DEFAULT_DESIGN_LOGIN_PATH = '/design/login';

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function navigateTo(path: string, options: NavigateOptions = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedPath = normalizePathname(path);
  const nextUrl = `${normalizedPath}${window.location.search}${window.location.hash}`;

  if (options.replace) {
    window.history.replaceState({}, '', nextUrl);
  } else {
    window.history.pushState({}, '', nextUrl);
  }

  window.dispatchEvent(new PopStateEvent('popstate'));
}

function usePathname() {
  const [pathname, setPathname] = useState(() => (
    typeof window === 'undefined' ? '/' : normalizePathname(window.location.pathname)
  ));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleLocationChange = () => {
      setPathname(normalizePathname(window.location.pathname));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return pathname;
}

function parseAppRoute(pathname: string): AppRoute {
  if (pathname === '/') {
    return {
      kind: 'root',
      pathname: '/',
    };
  }

  if (pathname === '/login') {
    return {
      kind: 'login',
      pathname,
      platform: getDefaultPlatform(),
    };
  }

  const matchedPlatform = getPlatformByBasePath(pathname);
  if (matchedPlatform) {
    const suffix = pathname.slice(matchedPlatform.basePath.length);
    const normalizedSuffix = suffix.startsWith('/') ? suffix.slice(1) : suffix;
    const segments = normalizedSuffix ? normalizedSuffix.split('/').filter(Boolean) : [];

    if (segments[0] === 'login') {
      return {
        kind: 'login',
        pathname,
        platform: matchedPlatform,
      };
    }

    return {
      kind: 'platform',
      pathname,
      platform: matchedPlatform,
      segments,
    };
  }

  if (pathname === '/app' || pathname.startsWith('/app/')) {
    return {
      kind: 'platform',
      pathname,
      platform: getPlatformById('runtime'),
      segments: pathname === '/app' ? [] : pathname.slice(1).split('/').filter(Boolean),
    };
  }

  return {
    kind: 'not-found',
    pathname,
  };
}

function PlatformLoginFrame({
  onLogin,
  platform,
}: {
  onLogin: (session: AuthSession) => void;
  platform: PlatformDefinition;
}) {
  return (
    <div className="relative">
      <Login onLogin={onLogin} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/72 px-4 py-2 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl">
          <div className="pointer-events-auto text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
            当前入口
            <span className="ml-2 text-primary">{platform.name}</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            {PLATFORM_REGISTRY.map((item) => (
              <a
                key={item.id}
                href={item.loginPath}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                  item.id === platform.id
                    ? 'bg-primary text-white'
                    : 'bg-white/80 text-slate-500 hover:text-primary'
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundPage({ pathname }: { pathname: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] px-6">
      <div className="w-full max-w-3xl rounded-[32px] border border-white/80 bg-white/82 p-8 shadow-[0_32px_72px_-44px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">404</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">No platform entry matched</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The current path <code className="rounded bg-slate-100 px-2 py-1 font-mono text-[12px] text-slate-700">{pathname}</code> does not belong to a registered platform entry.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {PLATFORM_REGISTRY.map((platform) => (
            <a
              key={platform.id}
              href={platform.basePath}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 transition-colors hover:border-primary/20 hover:bg-white"
            >
              <div className="font-semibold text-slate-900">{platform.name}</div>
              <div className="mt-2 text-sm leading-6 text-slate-500">{platform.description}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function resolveLoginPlatform(route: AppRoute) {
  if (route.kind === 'login' || route.kind === 'platform') {
    return route.platform;
  }

  return getDefaultPlatform();
}

function resolvePostLoginPath(route: AppRoute) {
  if (route.kind === 'platform') {
    if (route.platform.id === 'design' && route.pathname === '/design') {
      return DEFAULT_DESIGN_HOME_PATH;
    }

    return route.pathname;
  }

  const platform = resolveLoginPlatform(route);
  if (platform.id === 'design') {
    return DEFAULT_DESIGN_HOME_PATH;
  }

  return platform.basePath;
}

function resolveLogoutPath(route: AppRoute) {
  if (route.kind === 'platform') {
    return route.platform.loginPath;
  }

  return getDefaultPlatform().loginPath;
}

function resolveCurrentUserName(session: AuthSession) {
  return session.employeeName || session.username || 'Current User';
}

function PlatformRouteView({
  onLogout,
  route,
  session,
}: {
  onLogout: () => void;
  route: PlatformRoute;
  session: AuthSession;
}) {
  const currentUserName = resolveCurrentUserName(session);
  const handleLogout = () => {
    onLogout();
    navigateTo(resolveLogoutPath(route), { replace: true });
  };

  switch (route.platform.id) {
    case 'design': {
      const designRoute = resolveDesignRoute(route.pathname, route.segments);

      if (!designRoute) {
        return <NotFoundPage pathname={route.pathname} />;
      }

      return (
        <DesignPlatformApp
          currentPath={route.pathname}
          currentUserName={currentUserName}
          onLogout={handleLogout}
          platform={route.platform}
          route={designRoute}
        />
      );
    }
    case 'runtime':
      return <RuntimePlatformApp currentPath={route.pathname} platform={route.platform} route={resolveRuntimeRoute(route.pathname, route.segments)} />;
    case 'mes':
      return <MesPlatformApp currentPath={route.pathname} platform={route.platform} />;
    default:
      return <NotFoundPage pathname={route.pathname} />;
  }
}

export function AppRouter({ onLogin, onLogout, session }: AppRouterProps) {
  const pathname = usePathname();
  const route = useMemo(() => parseAppRoute(pathname), [pathname]);

  useEffect(() => {
    if (route.kind === 'root') {
      navigateTo(session ? DEFAULT_DESIGN_HOME_PATH : DEFAULT_DESIGN_LOGIN_PATH, { replace: true });
    }
  }, [route, session]);

  useEffect(() => {
    if (session && route.kind === 'platform' && route.platform.id === 'design' && route.pathname === '/design') {
      navigateTo(DEFAULT_DESIGN_HOME_PATH, { replace: true });
    }
  }, [route, session]);

  useEffect(() => {
    if (session && route.kind === 'login') {
      navigateTo(resolvePostLoginPath(route), { replace: true });
    }
  }, [route, session]);

  if (route.kind === 'root') {
    return null;
  }

  if (route.kind === 'not-found') {
    return <NotFoundPage pathname={route.pathname} />;
  }

  if (route.kind === 'login') {
    if (session) {
      return null;
    }

    const loginPlatform = resolveLoginPlatform(route);

    return (
      <Suspense fallback={<AppLoadingScreen title="加载登录页" description="正在准备登录入口。" />}>
        <PlatformLoginFrame
          platform={loginPlatform}
          onLogin={(nextSession) => {
            onLogin(nextSession);
            navigateTo(resolvePostLoginPath(route), { replace: true });
          }}
        />
      </Suspense>
    );
  }

  if (!session) {
    const loginPlatform = resolveLoginPlatform(route);

    return (
      <Suspense fallback={<AppLoadingScreen title="加载登录页" description="正在准备登录入口。" />}>
        <PlatformLoginFrame
          platform={loginPlatform}
          onLogin={(nextSession) => {
            onLogin(nextSession);
            navigateTo(resolvePostLoginPath(route), { replace: true });
          }}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<AppLoadingScreen />}>
      <PlatformRouteView onLogout={onLogout} route={route} session={session} />
    </Suspense>
  );
}
