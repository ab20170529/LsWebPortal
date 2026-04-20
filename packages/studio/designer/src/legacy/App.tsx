/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect, useState } from 'react';

import { AppRouter } from './app/router/app-router';
import type { AuthSession } from './app/providers/auth-session-provider';
import {
  clearCurrentAuthSession,
  getInitialAuthSession,
} from './app/providers/auth-session-provider';
import Login from './components/Login';
import { persistAuthSession } from './shared/auth/session';
import { fetchCurrentUserProfile } from './shared/api/auth';
import { clearTransientLoginContext } from './shared/auth/login-context';

const Dashboard = lazy(() => import('./components/Dashboard'));

function DashboardLoadingState() {
  return (
    <div className="main-gradient flex min-h-screen items-center justify-center p-6 text-slate-900">
      <div className="glass-card w-full max-w-sm rounded-3xl p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <h1 className="mb-2 text-lg font-bold text-slate-900">正在进入工作台</h1>
        <p className="text-sm text-slate-500">正在加载模块与配置能力，请稍候。</p>
      </div>
    </div>
  );
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function isPlatformRouterPath(pathname: string) {
  return (
    pathname === '/design'
    || pathname.startsWith('/design/')
    || pathname === '/runtime'
    || pathname.startsWith('/runtime/')
    || pathname === '/mes'
    || pathname.startsWith('/mes/')
    || pathname === '/app'
    || pathname.startsWith('/app/')
  );
}

export default function App() {
  const [pathname, setPathname] = useState(() => (
    typeof window === 'undefined' ? '/' : normalizePathname(window.location.pathname)
  ));
  const [isDebugDashboard, setIsDebugDashboard] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'dashboard';
  });
  const [session, setSession] = useState<AuthSession | null>(() => getInitialAuthSession());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleLocationChange = () => {
      setPathname(normalizePathname(window.location.pathname));
      const params = new URLSearchParams(window.location.search);
      setIsDebugDashboard(params.get('debug') === 'dashboard');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshCurrentSession() {
      if (!session?.accessToken) {
        return;
      }

      try {
        const profile = await fetchCurrentUserProfile();
        if (!active) {
          return;
        }

        const refreshedSession: AuthSession = {
          ...session,
          companyKey: profile.companyKey || session.companyKey,
          companyTitle: profile.companyTitle || session.companyTitle,
          datasourceCode: profile.datasourceCode || session.datasourceCode,
          departmentId: profile.departmentId || session.departmentId,
          employeeId: profile.employeeId || session.employeeId,
          employeeName: profile.employeeName || session.employeeName,
          isAdmin: profile.isAdmin,
          tokenVersion: profile.tokenVersion || session.tokenVersion,
          username: profile.username || session.username,
        };

        setSession(refreshedSession);
        const remember = typeof window !== 'undefined' && window.localStorage.getItem('ls-ai-tool-auth-session') !== null;
        persistAuthSession(refreshedSession, remember);
      } catch {
        // Keep the stored session when profile refresh fails to avoid boot-looping the app.
      }
    }

    void refreshCurrentSession();

    return () => {
      active = false;
    };
  }, [session?.accessToken]);

  const handleLogout = () => {
    clearCurrentAuthSession();
    clearTransientLoginContext();
    setSession(null);
    setIsDebugDashboard(false);
  };

  if (!isDebugDashboard && isPlatformRouterPath(pathname)) {
    return (
      <AppRouter
        onLogin={setSession}
        onLogout={handleLogout}
        session={session}
      />
    );
  }

  if (!isDebugDashboard && !session) {
    return <Login onLogin={setSession} />;
  }

  return (
    <Suspense fallback={<DashboardLoadingState />}>
      <Dashboard
        currentUserName={session?.employeeName || session?.username || '当前用户'}
        onLogout={handleLogout}
      />
    </Suspense>
  );
}
