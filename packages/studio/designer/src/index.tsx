import { useEffect, useMemo, useState } from 'react';
import { usePortalAuth } from '@lserp/auth';
import { Badge, Button, Card } from '@lserp/ui';

import type { DesignFixedRoute } from './legacy/app/contracts/platform-routing';
import { resolveDesignRoute } from './legacy/app/contracts/platform-routing';
import type { PlatformDefinition } from './legacy/app/registry/platform-registry';
import { DesignPlatformApp } from './legacy/platforms/design/design-platform-app';
import './legacy/index.css';

const DESIGN_PLATFORM: PlatformDefinition = {
  id: 'design',
  name: '设计平台',
  description: '统一并入 LsERPPortal 的设计工作台宿主。',
  kind: 'studio',
  basePath: '/designer',
  loginMode: 'shared',
  loginPath: '/',
  routeMode: 'fixed',
  status: 'active',
};

const AUTH_KEYS = [
  'lserp.portal.auth.session',
  'lserp.portal.auth.v2',
  'ls-ai-tool-auth-session',
  'ls-ai-tool-login-context',
];

function detectBrowserEngine() {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isChromiumBrowser = /Chrome|Chromium|Edg\//i.test(userAgent);
  const isWebkitBrowser = /Safari/i.test(userAgent) && !isChromiumBrowser;

  if (isChromiumBrowser) {
    return 'chromium';
  }

  if (isWebkitBrowser) {
    return 'webkit';
  }

  return 'other';
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/designer';
  }

  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function buildDesignerRedirectTarget() {
  if (typeof window === 'undefined') {
    return '/designer';
  }

  const pathname = window.location.pathname.replace(/^\/design\b/, '/designer');
  return `${pathname}${window.location.search}${window.location.hash}`;
}

function useDesignerPathname() {
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

function replaceLocation(to: string) {
  const nextPath = normalizePathname(to);
  window.history.replaceState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function resolveDesignerRoute(pathname: string): DesignFixedRoute | null {
  const normalizedPath = pathname.replace(/^\/design\b/, '/designer');
  const relativePath = normalizedPath.replace(/^\/designer\/?/, '');
  const segments = relativePath ? relativePath.split('/').filter(Boolean) : [];

  return resolveDesignRoute(normalizedPath, segments);
}

function clearAuthStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of AUTH_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}

export function DesignerHomePage() {
  const { session, signOut } = usePortalAuth();
  const pathname = useDesignerPathname();
  const route = useMemo(() => resolveDesignerRoute(pathname), [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousBrowserEngine = html.dataset.browserEngine;
    const previousAppMode = html.dataset.appMode;
    const previousDesignerActiveOnHtml = html.dataset.designerActive;
    const previousDesignerActiveOnBody = body.dataset.designerActive;

    html.dataset.browserEngine = detectBrowserEngine();
    html.dataset.appMode = import.meta.env.DEV ? 'dev' : 'prod';
    html.dataset.designerActive = 'true';
    body.dataset.designerActive = 'true';

    return () => {
      if (previousBrowserEngine) {
        html.dataset.browserEngine = previousBrowserEngine;
      } else {
        delete html.dataset.browserEngine;
      }

      if (previousAppMode) {
        html.dataset.appMode = previousAppMode;
      } else {
        delete html.dataset.appMode;
      }

      if (previousDesignerActiveOnHtml) {
        html.dataset.designerActive = previousDesignerActiveOnHtml;
      } else {
        delete html.dataset.designerActive;
      }

      if (previousDesignerActiveOnBody) {
        body.dataset.designerActive = previousDesignerActiveOnBody;
      } else {
        delete body.dataset.designerActive;
      }
    };
  }, []);

  useEffect(() => {
    if (pathname === '/design' || pathname.startsWith('/design/')) {
      replaceLocation(pathname.replace(/^\/design\b/, '/designer'));
    }
  }, [pathname]);

  if (!session) {
    return null;
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_28%),linear-gradient(180deg,#eef5ff_0%,#f8fbff_42%,#f2f6fb_100%)] px-6 py-10">
        <Card className="mx-auto max-w-3xl rounded-[28px] p-8">
          <Badge tone="danger">Designer</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            当前设计路由未匹配到有效页面
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            该地址不在迁入后的固定设计路由范围内，请回到设计工作台主页后继续操作。
          </p>
          <div className="mt-6">
            <Button
              onClick={() => {
                navigate('/designer');
              }}
            >
              返回设计首页
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentUserName = session.employeeName ?? session.displayName;
  const activeCompanyTitle = session.activeCompany?.title ?? session.companyTitle ?? '未选择';

  return (
    <div className="designer-shell relative min-h-screen">
      <DesignPlatformApp
        activeCompanyTitle={activeCompanyTitle}
        currentPath={pathname}
        currentUserName={currentUserName}
        onLogout={() => {
          clearAuthStorage();
          signOut();
          navigate('/');
        }}
        onSwitchCompany={() => {
          navigate(`/systems?redirect=${encodeURIComponent(buildDesignerRedirectTarget())}`);
        }}
        platform={DESIGN_PLATFORM}
        route={route}
      />
    </div>
  );
}
