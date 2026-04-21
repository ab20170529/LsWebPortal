import { useEffect } from 'react';
import { Card } from '@lserp/ui';

import { getDefaultBiDisplayPath } from './display/display-platform-registry';
import { BiDisplayPlatformPage } from './pages/bi-display-platform-page';
import { BiRuntimePage } from './pages/bi-runtime-page';
import { BiWorkspacePage } from './pages/bi-workspace-page';
import './styles/bi-display.css';
import './styles/bi-workspace.css';
import { replaceBiDisplay, resolveBiDisplayRoute } from './utils/bi-display-routes';
import { resolveBiRoute } from './utils/bi-routes';

export function BiHomePage() {
  const route = resolveBiRoute(window.location.pathname);

  if (route.kind === 'workspace') {
    return <BiWorkspacePage />;
  }

  if (route.kind === 'node' || route.kind === 'screen' || route.kind === 'share') {
    return <BiRuntimePage route={route} />;
  }

  return (
    <Card className="rounded-[32px] p-8">
      <div className="theme-text-strong text-2xl font-black tracking-tight">
        {'BI \u9875\u9762\u4e0d\u5b58\u5728'}
      </div>
      <p className="theme-text-muted mt-3 text-sm leading-7">
        {
          '\u5f53\u524d\u8def\u7531\u5c1a\u672a\u6620\u5c04\u5230 BI \u5de5\u4f5c\u53f0\u6216 BI \u8fd0\u884c\u65f6\u9875\u9762\u3002'
        }
      </p>
    </Card>
  );
}

export function BiDisplayHomePage() {
  const route = resolveBiDisplayRoute(window.location.pathname);

  if (route.kind === 'home') {
    return <BiDisplayRouteRedirect to={getDefaultBiDisplayPath()} />;
  }

  if (route.kind === 'platform') {
    return <BiDisplayPlatformPage platformCode={route.platformCode} />;
  }

  if (route.kind === 'node') {
    return <BiDisplayPlatformPage nodeCode={route.nodeCode} platformCode={route.platformCode} />;
  }

  return (
    <div className="bi-display-app">
      <div className="bi-display-empty-state">
        <div className="bi-display-empty-title">{'BI \u5c55\u793a\u9875\u9762\u4e0d\u5b58\u5728'}</div>
        <div className="bi-display-empty-text">
          {'\u8bf7\u901a\u8fc7\u5df2\u6ce8\u518c\u7684\u5c55\u793a\u5e73\u53f0\u8def\u7531\u8fdb\u5165\u5177\u4f53\u5927\u5c4f\u3002'}
        </div>
      </div>
    </div>
  );
}

function BiDisplayRouteRedirect({ to }: { to: string }) {
  useEffect(() => {
    replaceBiDisplay(to);
  }, [to]);

  return null;
}
