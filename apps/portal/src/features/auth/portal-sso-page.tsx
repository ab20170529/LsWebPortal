import React, { useEffect, useRef, useState } from 'react';
import { usePortalAuth } from '@lserp/auth';

import { exchangePortalSsoTicket } from './services/portal-sso-service';

function normalizeRedirect(value: string | null) {
  const fallback = '/systems';
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }

  const normalized = value.replace(/^\/design\b/, '/designer');
  return normalized === '/auth/sso' || normalized.startsWith('/auth/sso?') ? fallback : normalized;
}

function replaceLocation(to: string) {
  window.history.replaceState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function PortalSsoPage() {
  const { applyAuthBootstrap } = usePortalAuth();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const run = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const ticket = searchParams.get('ticket')?.trim();
      const redirect = normalizeRedirect(searchParams.get('redirect'));

      if (!ticket) {
        setError('免登录票据缺失。');
        return;
      }

      try {
        const payload = await exchangePortalSsoTicket(ticket);
        applyAuthBootstrap(payload);
        replaceLocation(redirect);
      } catch (err) {
        setError(err instanceof Error ? err.message : '免登录票据校验失败。');
      }
    };

    void run();
  }, [applyAuthBootstrap]);

  return (
    <div className="portal-auth-scene">
      <div className="portal-auth-scene__grid">
        <section className="portal-auth-card">
          <div className="portal-auth-form">
            <div>
              <h1>Portal 免登录</h1>
              <p>{error ? '无法完成当前跳转。' : '正在进入目标系统...'}</p>
            </div>
            {error && <div className="portal-auth-alert">{error}</div>}
            {error && (
              <button
                type="button"
                className="portal-auth-submit"
                onClick={() => replaceLocation('/')}
              >
                返回登录
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
