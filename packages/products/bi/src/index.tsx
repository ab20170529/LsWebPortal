import { useEffect, useState } from 'react';
import { Card } from '@lserp/ui';

import { getDefaultBiDisplayPath } from './display/display-platform-registry';
import { BiDisplayPlatformPage } from './pages/bi-display-platform-page';
import { BiRuntimePage } from './pages/bi-runtime-page';
import { BiWorkspaceExactPage } from './pages/bi-workspace-exact-page';
import { BiWorkspacePage } from './pages/bi-workspace-page';
import './styles/bi-display.css';
import './styles/bi-workspace.css';
import './styles/bi-workspace-exact.css';
import { replaceBiDisplay, resolveBiDisplayRoute } from './utils/bi-display-routes';
import { resolveBiRoute } from './utils/bi-routes';

type BiWorkspaceVersion = 'classic' | 'new';
type BiHomePageProps = {
  onExitSystem?: () => void;
};

const BI_WORKSPACE_VERSION_PARAM = 'workspaceVersion';
const BI_WORKSPACE_VERSION_STORAGE_KEY = 'lserp.bi.workspaceVersion';
const BI_WORKSPACE_VERSION_OPTIONS: Array<{ label: string; value: BiWorkspaceVersion }> = [
  { label: '经典版', value: 'classic' },
  { label: '新版', value: 'new' },
];

export function BiHomePage({ onExitSystem }: BiHomePageProps = {}) {
  const route = resolveBiRoute(window.location.pathname);

  if (route.kind === 'workspace') {
    return <BiWorkspaceVersionFrame onExitSystem={onExitSystem} />;
  }

  if (
    route.kind === 'menu' ||
    route.kind === 'node' ||
    route.kind === 'screen' ||
    route.kind === 'public-screen' ||
    route.kind === 'share'
  ) {
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

function BiWorkspaceVersionFrame({ onExitSystem }: BiHomePageProps) {
  const [workspaceVersion, setWorkspaceVersion] = useState<BiWorkspaceVersion>(() => readBiWorkspaceVersion());

  useEffect(() => {
    const handlePopState = () => setWorkspaceVersion(readBiWorkspaceVersion());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function handleVersionChange(nextVersion: BiWorkspaceVersion) {
    if (nextVersion === workspaceVersion) {
      return;
    }

    setWorkspaceVersion(nextVersion);
    writeBiWorkspaceVersion(nextVersion);
    replaceBiWorkspaceVersionParam(nextVersion);
  }

  return (
    <div className="bi-workspace-version-frame" data-bi-workspace-version={workspaceVersion}>
      <div className="bi-workspace-version-switch" role="group" aria-label="BI 工作台版本切换">
        <span className="bi-workspace-version-switch-label">工作台版本</span>
        {BI_WORKSPACE_VERSION_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              option.value === workspaceVersion
                ? 'bi-workspace-version-switch-button is-active'
                : 'bi-workspace-version-switch-button'
            }
            aria-pressed={option.value === workspaceVersion}
            onClick={() => handleVersionChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {workspaceVersion === 'new' ? <BiWorkspaceExactPage onExitSystem={onExitSystem} /> : <BiWorkspacePage />}
    </div>
  );
}

function normalizeBiWorkspaceVersion(value: string | null): BiWorkspaceVersion | null {
  return value === 'classic' || value === 'new' ? value : null;
}

function readBiWorkspaceVersion(): BiWorkspaceVersion {
  if (typeof window === 'undefined') {
    return 'classic';
  }

  const params = new URLSearchParams(window.location.search);
  const queryVersion = normalizeBiWorkspaceVersion(params.get(BI_WORKSPACE_VERSION_PARAM));
  if (queryVersion) {
    return queryVersion;
  }

  try {
    return normalizeBiWorkspaceVersion(window.localStorage.getItem(BI_WORKSPACE_VERSION_STORAGE_KEY)) ?? 'classic';
  } catch {
    return 'classic';
  }
}

function writeBiWorkspaceVersion(version: BiWorkspaceVersion) {
  try {
    window.localStorage.setItem(BI_WORKSPACE_VERSION_STORAGE_KEY, version);
  } catch {
    // Some embedded browsers disable storage; the URL state still keeps the switch usable.
  }
}

function replaceBiWorkspaceVersionParam(version: BiWorkspaceVersion) {
  const params = new URLSearchParams(window.location.search);
  params.set(BI_WORKSPACE_VERSION_PARAM, version);
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}
