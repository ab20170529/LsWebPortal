import { startTransition, useEffect, useState } from 'react';
import {
  getGrantedSystemIds,
  type AuthSession,
  usePortalAuth,
} from '@lserp/auth';
import { getPlatformSystemEntry } from '@lserp/contracts';
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
import type { ServerOption } from '../features/auth/types';
import { navigate } from '../router';

function canManageSystems(session: AuthSession): boolean {
  if (session.admin === true) return true;
  const name = (session.employeeName ?? session.displayName ?? '').trim();
  return name === '张又文';
}

type AccessDeniedPageProps = {
  session: AuthSession;
  targetLabel: string;
};

type SystemAccessPageProps = {
  session: AuthSession;
};

const ACCESS_DENIED = '无权限';
const RETURN_TO_SYSTEMS = '返回系统选择';
const RETURN_TO_LOGIN = '返回登录页';
const AVAILABLE_SYSTEMS = 'Available Systems';
const EMPTY_ACCESS = '当前账号暂未配置可访问系统。';
const NO_SYSTEM_TITLE = '当前账号暂无可进入的系统';
const NO_SYSTEM_DESC = '请联系管理员为当前账号配置系统授权后再登录。';
const COMPANY_PANEL_TITLE = '当前业务库';
const COMPANY_REQUIRED_MESSAGE = '请先选择业务库后再进入系统。';

function getAccessDeniedTitle(targetLabel: string) {
  return `当前账号未开通 ${targetLabel}`;
}

const ACCESS_DENIED_DESC =
  '门户会根据当前账号的系统授权控制访问范围。若还未开通该系统，请先返回系统选择页，或联系管理员补齐授权后再进入。';

function normalizeRedirectTarget(rawTarget: string | null) {
  if (!rawTarget || !rawTarget.startsWith('/')) {
    return null;
  }

  const normalizedTarget = rawTarget.replace(/^\/design\b/, '/designer');

  if (
    normalizedTarget === '/bi-display'
    || normalizedTarget.startsWith('/bi-display/')
    || normalizedTarget === '/designer'
    || normalizedTarget.startsWith('/designer/')
    || normalizedTarget === '/erp'
    || normalizedTarget.startsWith('/erp/')
    || normalizedTarget === '/project'
    || normalizedTarget.startsWith('/project/')
    || normalizedTarget === '/bi'
    || normalizedTarget.startsWith('/bi/')
  ) {
    return normalizedTarget;
  }

  return null;
}

function getRedirectTarget() {
  if (typeof window === 'undefined') {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return normalizeRedirectTarget(searchParams.get('redirect'));
}

function openSystemEntry(route: string) {
  navigate(route);
}

function getCurrentCompanyKey(session: AuthSession) {
  return session.activeCompany?.companyKey ?? session.companyKey ?? '';
}

export function AccessDeniedPage({ session, targetLabel }: AccessDeniedPageProps) {
  const grantedEntries = getGrantedSystemIds(session)
    .map((systemId) => getPlatformSystemEntry(systemId))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] p-8">
        <Badge tone="danger">{ACCESS_DENIED}</Badge>
        <h1 className="theme-text-strong mt-4 text-3xl font-black tracking-tight">
          {getAccessDeniedTitle(targetLabel)}
        </h1>
        <p className="theme-text-muted mt-3 max-w-3xl text-sm leading-7">{ACCESS_DENIED_DESC}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              startTransition(() => {
                navigate('/systems');
              });
            }}
          >
            {RETURN_TO_SYSTEMS}
          </Button>
          <Button
            onClick={() => {
              startTransition(() => {
                clearAuthSession();
                navigate('/');
              });
            }}
            tone="ghost"
          >
            {RETURN_TO_LOGIN}
          </Button>
        </div>
      </Card>

      <Card className="rounded-[28px] p-8">
        <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
          {AVAILABLE_SYSTEMS}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {grantedEntries.length > 0 ? (
            grantedEntries.map((entry) => (
              <div key={entry.id} className="theme-surface-subtle rounded-[22px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="theme-text-strong text-sm font-black tracking-tight">{entry.title}</div>
                  <Badge tone={entry.tone}>{entry.shortLabel}</Badge>
                </div>
                <p className="theme-text-muted mt-3 text-sm leading-7">{entry.description}</p>
              </div>
            ))
          ) : (
            <div className="theme-surface-subtle rounded-[22px] p-5 text-sm text-slate-600">{EMPTY_ACCESS}</div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function SystemAccessPage({ session }: SystemAccessPageProps) {
  const { applyAuthBootstrap } = usePortalAuth();
  const accessibleEntries = getGrantedSystemIds(session)
    .map((systemId) => getPlatformSystemEntry(systemId))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const currentCompanyKey = getCurrentCompanyKey(session);
  const redirectTarget = getRedirectTarget();
  const showManageButton = canManageSystems(session);
  const hasActiveCompany = Boolean(currentCompanyKey && session.loginStage === 'company');

  const [companies, setCompanies] = useState<ServerOption[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isActivatingCompanyKey, setIsActivatingCompanyKey] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCompanies = async () => {
      if (hasActiveCompany) {
        setCompanies([]);
        setCompanyError(null);
        setIsLoadingCompanies(false);
        return;
      }

      if (!session.accessToken) {
        if (active) {
          setCompanies([]);
        }
        return;
      }

      setIsLoadingCompanies(true);
      setCompanyError(null);

      try {
        const nextCompanies = await fetchAccessibleCompanies(session.accessToken);
        if (!active) {
          return;
        }

        setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      } catch (error) {
        if (!active) {
          return;
        }

        setCompanies([]);
        setCompanyError(error instanceof Error ? error.message : '业务库加载失败，请稍后重试。');
      } finally {
        if (active) {
          setIsLoadingCompanies(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      active = false;
    };
  }, [hasActiveCompany, session.accessToken]);

  const activateCompany = async (company: ServerOption) => {
    if (!session.accessToken) {
      setCompanyError('当前会话缺少访问令牌，请重新登录。');
      return;
    }

    setGateMessage(null);

    if (company.companyKey === currentCompanyKey && hasActiveCompany) {
      if (redirectTarget) {
        window.location.assign(redirectTarget);
      }
      return;
    }

    setIsActivatingCompanyKey(company.companyKey);
    setCompanyError(null);

    try {
      const nextSession = await activateCompanySession(session.accessToken, {
        companyKey: company.companyKey,
      });

      persistAuthSession(nextSession, shouldRememberAuthSession());
      const bootstrapPayload = await resolvePortalBootstrapPayload(nextSession);
      applyAuthBootstrap(bootstrapPayload);

      if (redirectTarget) {
        window.location.assign(redirectTarget);
        return;
      }

      setGateMessage(`已切换到 ${company.title}，现在可以进入系统。`);
    } catch (error) {
      setCompanyError(error instanceof Error ? error.message : '业务库切换失败，请稍后重试。');
    } finally {
      setIsActivatingCompanyKey(null);
    }
  };

  if (accessibleEntries.length === 0) {
    return (
      <div className="portal-system-gate flex min-h-screen items-center justify-center bg-[#f4f6fb] px-6 py-12">
        <Card className="portal-system-card w-full max-w-xl rounded-[28px] p-10 text-center">
          <div className="theme-text-strong text-xl font-black tracking-tight">{NO_SYSTEM_TITLE}</div>
          <p className="theme-text-muted mt-3 text-sm leading-7">{NO_SYSTEM_DESC}</p>
          {showManageButton && (
            <div className="mt-6 flex justify-center">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                onClick={() => {
                  navigate('/system-manager');
                }}
                type="button"
              >
                系统管理
              </button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="portal-system-gate flex min-h-screen items-center justify-center bg-[#f4f6fb] px-6 py-12">
      <div className="portal-system-gate__frame w-full max-w-6xl">
        {showManageButton && (
          <div className="mb-6 flex justify-end">
            <button
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 hover:shadow-md"
              onClick={() => {
                navigate('/system-manager');
              }}
              type="button"
            >
              系统管理
            </button>
          </div>
        )}

        <div className="portal-system-gate__grid grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="portal-system-card rounded-[28px] p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
                  {COMPANY_PANEL_TITLE}
                </div>
                <div className="theme-text-strong mt-3 text-2xl font-black tracking-tight">
                  {hasActiveCompany
                    ? session.activeCompany?.title ?? session.companyTitle ?? '已选业务库'
                    : '尚未选择业务库'}
                </div>
              </div>
              <Badge tone={hasActiveCompany ? 'success' : 'neutral'}>
                {hasActiveCompany ? 'Ready' : 'Required'}
              </Badge>
            </div>

            <p className="theme-text-muted mt-4 text-sm leading-7">
              登录后先确定当前业务库，再进入 Designer、ERP、Project 或 BI。业务库切换会刷新平台会话，避免串库。
            </p>

            {companyError ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {companyError}
              </div>
            ) : null}

            {gateMessage ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {gateMessage}
              </div>
            ) : null}

            {!hasActiveCompany ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {COMPANY_REQUIRED_MESSAGE}
              </div>
            ) : null}

            <div className="portal-system-gate__side-list mt-6 space-y-3">
              {hasActiveCompany ? (
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                  当前会话已绑定业务库，可以直接进入系统。
                </div>
              ) : isLoadingCompanies ? (
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  正在加载可用业务库...
                </div>
              ) : companies.length > 0 ? (
                companies.map((company) => {
                  const isActive = company.companyKey === currentCompanyKey;
                  const isSwitching = isActivatingCompanyKey === company.companyKey;

                  return (
                    <button
                      key={`${company.companyKey}:${company.basename}:${company.serverport}`}
                      className={`portal-system-card w-full rounded-[22px] border px-5 py-4 text-left transition-all ${
                        isActive
                          ? 'border-sky-200 bg-sky-50 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.24)]'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_40px_-34px_rgba(15,23,42,0.22)]'
                      }`}
                      disabled={Boolean(isActivatingCompanyKey)}
                      onClick={() => {
                        void activateCompany(company);
                      }}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-black tracking-tight text-slate-900">
                            {company.title}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {company.basename} · {company.serverip}:{company.serverport}
                          </div>
                        </div>
                        <Badge tone={isActive ? 'brand' : 'neutral'}>
                          {isSwitching ? '切换中' : isActive ? '当前' : '使用'}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  当前账号没有可用业务库。
                </div>
              )}
            </div>
          </Card>

          <div
            className={
              accessibleEntries.length === 1
                ? 'grid justify-center'
                : accessibleEntries.length === 2
                  ? 'grid gap-6 md:grid-cols-2'
                  : 'grid gap-6 md:grid-cols-2 xl:grid-cols-2'
            }
          >
            {accessibleEntries.map((entry) => {
              const disabled = !hasActiveCompany;

              return (
                <button
                  key={entry.id}
                  className={`portal-system-card group min-h-[220px] rounded-[28px] border p-8 text-left shadow-[0_24px_60px_-42px_rgba(15,23,42,0.26)] transition-all duration-200 ${
                    disabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100/80 opacity-70'
                      : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_28px_70px_-38px_rgba(37,99,235,0.24)]'
                  }`}
                  onClick={() => {
                    if (disabled) {
                      setGateMessage(COMPANY_REQUIRED_MESSAGE);
                      return;
                    }

                    openSystemEntry(entry.route);
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone={entry.tone}>{entry.shortLabel}</Badge>
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300 transition-colors group-hover:text-slate-500">
                      {disabled ? 'Locked' : 'Enter'}
                    </span>
                  </div>
                  <div className="mt-10 text-2xl font-black tracking-tight text-slate-900">{entry.title}</div>
                  <p className="mt-4 text-sm leading-7 text-slate-500">{entry.description}</p>
                  {!disabled ? null : (
                    <p className="mt-6 text-sm font-semibold text-amber-700">先选择业务库后开放入口</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
