import { useEffect, useMemo, useState } from 'react';
import { usePortalAuth } from '@lserp/auth';
import { Badge, Button, Card } from '@lserp/ui';

import {
  activateCompanySession,
  fetchAccessibleCompanies,
} from '../features/auth/services/auth-service';
import { resolvePortalBootstrapPayload } from '../features/auth/services/portal-bootstrap-service';
import {
  clearAuthSession,
  persistAuthSession,
  shouldRememberAuthSession,
} from '../features/auth/services/storage-service';
import type { AuthSession, ServerOption } from '../features/auth/types';
import { navigate } from '../router';

function normalizeRedirectTarget(rawTarget: string | null) {
  if (!rawTarget || !rawTarget.startsWith('/')) {
    return null;
  }

  return rawTarget.replace(/^\/design\b/, '/designer');
}

function getRedirectTarget() {
  if (typeof window === 'undefined') {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return normalizeRedirectTarget(searchParams.get('redirect'));
}

export function BusinessDbSelectionPage() {
  const { applyAuthBootstrap, session, signOut } = usePortalAuth();
  const [businessDbs, setBusinessDbs] = useState<ServerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activatingKey, setActivatingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectTarget = useMemo(() => getRedirectTarget(), []);

  useEffect(() => {
    let active = true;

    const loadBusinessDbs = async () => {
      if (!session?.accessToken) {
        setBusinessDbs([]);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextBusinessDbs = await fetchAccessibleCompanies(session.accessToken);
        if (!active) {
          return;
        }

        const normalizedBusinessDbs = Array.isArray(nextBusinessDbs) ? nextBusinessDbs : [];
        setBusinessDbs(normalizedBusinessDbs);
        if (normalizedBusinessDbs.length === 0) {
          const nextSession: AuthSession = {
            ...session,
            accessToken: session.accessToken,
            businessDbRequired: false,
            employeeName: session.employeeName ?? session.displayName,
          };
          persistAuthSession(nextSession, shouldRememberAuthSession());
          const bootstrapPayload = await resolvePortalBootstrapPayload(nextSession);
          applyAuthBootstrap(bootstrapPayload);
          navigate('/systems');
        }
      } catch (error) {
        if (active) {
          setBusinessDbs([]);
          setErrorMessage(error instanceof Error ? error.message : '业务库加载失败，请稍后重试。');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadBusinessDbs();

    return () => {
      active = false;
    };
  }, [applyAuthBootstrap, session]);

  const activateBusinessDb = async (businessDb: ServerOption) => {
    if (!session?.accessToken) {
      setErrorMessage('当前会话缺少访问令牌，请重新登录。');
      return;
    }

    setActivatingKey(businessDb.companyKey);
    setErrorMessage(null);

    try {
      const nextSession = await activateCompanySession(session.accessToken, {
        companyKey: businessDb.companyKey,
      });
      persistAuthSession(nextSession, shouldRememberAuthSession());
      const bootstrapPayload = await resolvePortalBootstrapPayload(nextSession);
      applyAuthBootstrap(bootstrapPayload);
      navigate(redirectTarget ?? '/systems');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '业务库切换失败，请稍后重试。');
    } finally {
      setActivatingKey(null);
    }
  };

  return (
    <div className="portal-system-gate flex min-h-screen items-center justify-center bg-[#f4f6fb] px-6 py-12">
      <div className="w-full max-w-5xl">
        <Card className="rounded-[28px] p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="brand">业务库选择</Badge>
              <h1 className="theme-text-strong mt-4 text-3xl font-black tracking-tight">
                {session?.tenantName ?? '当前租户'}
              </h1>
              <p className="theme-text-muted mt-3 text-sm leading-7">
                选择本次进入 Designer、ERP、Project、BI 共用的业务库上下文。
              </p>
            </div>
            <Button
              onClick={() => {
                clearAuthSession();
                signOut();
                navigate('/');
              }}
              tone="ghost"
            >
              重新登录
            </Button>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4">
            {isLoading ? (
              <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 text-sm text-slate-500">
                正在加载业务库...
              </div>
            ) : businessDbs.length > 0 ? (
              businessDbs.map((businessDb) => {
                const isActivating = activatingKey === businessDb.companyKey;
                return (
                  <button
                    key={`${businessDb.companyKey}:${businessDb.dbGroupId ?? ''}`}
                    className="portal-system-card w-full rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_40px_-34px_rgba(15,23,42,0.22)] disabled:cursor-wait disabled:opacity-70"
                    disabled={Boolean(activatingKey)}
                    onClick={() => {
                      void activateBusinessDb(businessDb);
                    }}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-black tracking-tight text-slate-900">
                          {businessDb.title}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge tone="neutral">{businessDb.dbType ?? 'SQLSERVER'}</Badge>
                          <Badge tone="neutral">{businessDb.runtimeRole ?? 'BUSINESS'}</Badge>
                          <Badge tone="neutral">
                            {businessDb.schemaVersion ? `结构 ${businessDb.schemaVersion}` : '结构待检测'}
                          </Badge>
                          <Badge tone={businessDb.upgradeStatus === 'FAILED' ? 'danger' : 'success'}>
                            {businessDb.upgradeStatus ?? 'CURRENT'}
                          </Badge>
                        </div>
                      </div>
                      <Badge tone="brand">{isActivating ? '进入中' : '进入'}</Badge>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 text-sm text-slate-500">
                当前租户未配置业务库，正在进入系统选择页。
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
