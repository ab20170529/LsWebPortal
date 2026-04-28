import React, {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import {
  getGrantedSystemIds,
  type AuthSession,
  usePortalAuth,
} from '@lserp/auth';
import { getPlatformSystemEntry } from '@lserp/contracts';
import { Button } from '@lserp/ui';

import {
  activateCompanySession,
  fetchAccessibleCompanies,
} from '../features/auth/services/auth-service';
import {
  buildFallbackPortalBootstrapPayload,
  resolvePortalBootstrapPayload,
} from '../features/auth/services/portal-bootstrap-service';
import {
  clearAuthSession,
  persistAuthSession,
  shouldRememberAuthSession,
} from '../features/auth/services/storage-service';
import type { ServerOption } from '../features/auth/types';
import { navigate } from '../router';
import platformLogoUrl from '../assets/system-gate-platform-logo.png';

type AccessDeniedPageProps = {
  session: AuthSession;
  targetLabel: string;
};

type SystemAccessPageProps = {
  session: AuthSession;
};

type GrantedSystemEntry = NonNullable<ReturnType<typeof getPlatformSystemEntry>>;
type BusinessContextStatusKind = 'ready' | 'required' | 'switching';

const PLATFORM_TITLE = '企业数字化管理平台';
const HERO_TITLE = '欢迎使用企业数字化管理平台';
const HERO_SUBTITLE = '请先选择业务库，再选择系统进入';
const ACCESS_DENIED = '无权限';
const RETURN_TO_SYSTEMS = '返回系统选择';
const RETURN_TO_LOGIN = '返回登录页';
const COMPANY_LOADING_MESSAGE = '正在加载可用业务库...';
const COMPANY_EMPTY_MESSAGE = '当前账号没有可用业务库。';
const COMPANY_LOAD_ERROR_FALLBACK = '业务库加载失败，请稍后重试。';
const COMPANY_SWITCH_ERROR_FALLBACK = '业务库切换失败，请稍后重试。';
const COMPANY_SESSION_ERROR = '当前会话缺少访问令牌，请重新登录。';
const REQUIRED_COMPANY_MESSAGE = '请先选择业务库，再进入系统。';
const SWITCHING_COMPANY_MESSAGE = '正在切换业务库，请稍后进入系统。';
const NO_SYSTEM_TITLE = '当前账号暂无可进入的系统';
const NO_SYSTEM_DESC = '请联系管理员为当前账号补齐系统授权后再重新登录。';
const ACCESS_DENIED_DESC =
  '门户会根据当前账号的系统授权控制访问范围。若还未开通该系统，请先返回系统选择页，或联系管理员补齐授权后再进入。';
const USER_AVATAR_PNG_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAADu0lEQVR42u2b6VrTQBRAeURBQEFAEdkfxn1BxR33FTdE/2ML+AaigC3FDaTaphUcv0ky6Z3JpEty7zSlzPedBzinbTpzk7S07C0zq+20xfZzzji0n82z9nMOHec5OdZxIcc6ORM51vjCJwus7ZRLjfKdE3/YgYsulzi/GydIKxdHlj942WUyxiFaTxQZtXzXZJZ1XXGIl7hh+e6rnC3WfW2rfiH2HXfF6yh/iHOd84s1tXzPDYemlu+5ydlkTS3fe8uhqeV7pzZZ39QGa2r5vtsbrO8OUoRGlT/MufuTxV5+bukvmTznyL2QEajk55a2bWnIe86nEpjyNvd/sLrv8OY+bmvlt/L/JHkIlnx/rQEo5blwWSw3yGdOEUW+/4FDXQ42tcoLuHzCBUO+/+F31jDyggSIEFX+KOdRFREoLnhh5KUIy0UU+YoB4ibvRVh2IkSVH3j8zcbIGAte5aPISwEQ5AeeBATA3uRUDGCFCIAgf4zz9Ks/AsUOLzCAFSLAShFNPjhADOUFyZUiS64UUOQHn+kCIB9sxPY2jvK+ABSnOrGdjSrvBCjYYMkPTq+zoen1UgSKI60UwEIMgCQ/9BwGIDjPewEsxACI8r4AFMMMjAhU8kMvMqUAVJMceKqLIp9cLaDLD0sBCMdY8FQXJ/nhl0oAyhleosYIJuSlACYGmOJUpwL/5yWI5UdercEA5qa3UgBb3C9PccFT5UdewwAG5H2ffoA8/+QFlPJSAEp53de+GnnB/GqBRH50BgYw+JtX5bPiohcgP/9FYKHKj86k5fMAlrx3xQ+44EGyZVDlIejyXgAC+aC/umwlCoIdOUDKIYr86BtdgJjKC6D8gktY+TF9ADz5cpucMPKQBRCAE0Z+bDatnwtiXPAo5X0R0haevB0A4WpPLe8FSAvyNcmPzabK3xuI8j9vQt6L4MrbAbDkRYC4y5ci5D2qkR9/m6ru/mCY7a1peRhgcS2PJ28HCHGwMS0vAnB5EaCcfE0B+Krm4QS4vTUtzxHyHFR5J0C85bURAuTH36XCPSdU6ckMeLDZdfJehDJPZqinOpPyUoBMnkZerKCHE+BZ3rS8FyDjBqCSF0v3cEJVAYjk7QAZGIBQ3ouguT8Phxm7Wl4s9f68OsUxLb+YyZmTF0u9S+sLQCifLe7UV96LAEbX6gzPlPwHEcC0PFxidK2b4VF+7YV8bN4e42Nr3QCTSj627w/qBphighN2kwPlG+YNUlUejrHgMEM91UkA+YZ/l1gnD8/zKnuvmxta/wGB/sStM9KMlAAAAABJRU5ErkJggg==';
const CONTEXT_REASON_ITEMS = [
  '项目、ERP、BI 数据会按业务库隔离加载。',
  '切换业务库会同步刷新会话和权限上下文。',
];

const CONTEXT_STATUS_COPY: Record<BusinessContextStatusKind, { label: string; message: string }> = {
  ready: {
    label: '已确认',
    message: '当前业务库已激活，可以进入右侧系统开始工作。',
  },
  required: {
    label: '需选择',
    message: '先确认业务库，避免进入系统后看到错误公司的数据。',
  },
  switching: {
    label: '切换中',
    message: '正在刷新业务上下文，稍后即可进入对应系统。',
  },
};

const SYSTEM_COPY: Record<string, string> = {
  bi: '财务核算、预算管理、报表分析',
  'bi-display': '数据报表、可视化分析、决策支持',
  designer: '员工管理、考勤管理、薪酬管理',
  erp: '采购管理、库存管理、供应商管理',
  project: '项目立项、进度管理、成本管理',
};

const SYSTEM_VISUALS: Record<
  string,
  {
    accentClass: string;
    icon: ReactNode;
  }
> = {
  bi: { accentClass: 'portal-system-gate__system-icon--blue', icon: <IconMoney /> },
  'bi-display': { accentClass: 'portal-system-gate__system-icon--purple', icon: <IconChartBar /> },
  designer: { accentClass: 'portal-system-gate__system-icon--green', icon: <IconUsers /> },
  erp: { accentClass: 'portal-system-gate__system-icon--orange', icon: <IconTruck /> },
  project: { accentClass: 'portal-system-gate__system-icon--teal', icon: <IconFolder /> },
};

function canManageSystems(session: AuthSession): boolean {
  if (session.admin === true) return true;
  const name = (session.employeeName ?? session.username ?? '').trim();
  return name === '张伟' || name === '张又新';
}

function getAccessDeniedTitle(targetLabel: string) {
  return `当前账号未开通 ${targetLabel}`;
}

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

function getSystemDescription(entry: GrantedSystemEntry) {
  return SYSTEM_COPY[entry.id] ?? entry.description;
}

function getSystemVisual(entry: GrantedSystemEntry) {
  return SYSTEM_VISUALS[entry.id] ?? {
    accentClass: 'portal-system-gate__system-icon--blue',
    icon: <IconGrid />,
  };
}

function BrandMark() {
  return (
    <span className="portal-system-gate__brand-mark" aria-hidden="true">
      <img alt="" src={platformLogoUrl} />
    </span>
  );
}

function PlatformHeader({ session }: { session: AuthSession }) {
  const displayName = session.employeeName ?? session.username ?? '张伟';

  return (
    <header className="portal-system-gate__topbar">
      <div className="portal-system-gate__topbar-inner">
        <button
          className="portal-system-gate__brand"
          onClick={() => {
            navigate('/systems');
          }}
          type="button"
        >
          <BrandMark />
          <span className="portal-system-gate__brand-title">{PLATFORM_TITLE}</span>
        </button>

        <div className="portal-system-gate__topbar-actions">
          <button className="portal-system-gate__header-action" type="button">
            <span className="portal-system-gate__header-icon"><IconHelp /></span>
            <span>帮助中心</span>
          </button>
          <button className="portal-system-gate__header-action" type="button">
            <span className="portal-system-gate__header-icon">
              <IconBell />
              <span className="portal-system-gate__header-badge">12</span>
            </span>
            <span>消息中心</span>
          </button>
          <button className="portal-system-gate__user" type="button">
            <span className="portal-system-gate__avatar">
              <img alt="" src={USER_AVATAR_PNG_SRC} />
            </span>
            <span className="portal-system-gate__user-name">{displayName}</span>
            <span className="portal-system-gate__user-arrow"><IconChevronDown /></span>
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="portal-system-gate__hero">
      <div className="portal-system-gate__hero-inner">
        <div className="portal-system-gate__hero-copy">
          <h1>{HERO_TITLE}</h1>
          <p>{HERO_SUBTITLE}</p>
        </div>
        <div className="portal-system-gate__hero-art" aria-hidden="true">
          <div className="portal-system-gate__hero-orbit" />
          <div className="portal-system-gate__hero-orbit portal-system-gate__hero-orbit--inner" />
          <div className="portal-system-gate__hero-db" />
          <div className="portal-system-gate__hero-card portal-system-gate__hero-card--left" />
          <div className="portal-system-gate__hero-card portal-system-gate__hero-card--center" />
          <div className="portal-system-gate__hero-card portal-system-gate__hero-card--right" />
          <div className="portal-system-gate__hero-node portal-system-gate__hero-node--left" />
          <div className="portal-system-gate__hero-node portal-system-gate__hero-node--right" />
          <div className="portal-system-gate__hero-node portal-system-gate__hero-node--top" />
          <div className="portal-system-gate__hero-glow" />
        </div>
      </div>
    </section>
  );
}

function StepBadge({ step }: { step: number }) {
  return (
    <span className="portal-system-gate__step-badge-wrap">
      <span className="portal-system-gate__step-badge">{step}</span>
    </span>
  );
}

function Footer() {
  return (
    <footer className="portal-system-gate__footer">
      <div className="portal-system-gate__footer-left">
        <span className="portal-system-gate__footer-shield"><IconShield /></span>
        <div>
          <div className="portal-system-gate__footer-title">安全可靠</div>
          <div className="portal-system-gate__footer-copy">平台采用多重安全防护，保障数据安全</div>
        </div>
      </div>

      <div className="portal-system-gate__footer-center">
        © 2024 企业数字化管理平台 版权所有 ｜ 浙ICP备2024000000号-1
      </div>

      <div className="portal-system-gate__footer-right">
        <div className="portal-system-gate__footer-links">
          <button type="button">用户手册</button>
          <button type="button">隐私政策</button>
          <button type="button">服务条款</button>
        </div>
        <div className="portal-system-gate__footer-status">
          <span className="portal-system-gate__footer-dot" />
          <span>系统状态：正常运行</span>
        </div>
      </div>
    </footer>
  );
}

function Banner({ message, tone }: { message: string; tone: 'danger' | 'success' | 'warning' }) {
  return (
    <div className={`portal-system-gate__banner portal-system-gate__banner--${tone}`}>
      {message}
    </div>
  );
}

function BusinessContextStatus({
  company,
  companyTitle,
  status,
}: {
  company: ServerOption | null;
  companyTitle: string;
  status: BusinessContextStatusKind;
}) {
  const statusCopy = CONTEXT_STATUS_COPY[status];

  return (
    <div className={`portal-system-gate__context-card is-${status}`}>
      <div className="portal-system-gate__context-kicker">当前业务上下文</div>
      <div className="portal-system-gate__context-main">
        <h3>{companyTitle || '尚未选择业务库'}</h3>
        <span className="portal-system-gate__context-badge">{statusCopy.label}</span>
      </div>
      <p>{statusCopy.message}</p>
      <div className="portal-system-gate__context-meta">
        <span>{company ? `${company.serverip}:${company.serverport}` : '等待选择业务库'}</span>
        <span>{company?.basename ?? '业务库未激活'}</span>
      </div>
    </div>
  );
}

function BusinessContextNotes() {
  return (
    <div className="portal-system-gate__context-notes">
      <div className="portal-system-gate__context-notes-title">为什么先确认业务库</div>
      <ul>
        {CONTEXT_REASON_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function CompanyList({
  companies,
  currentCompanyKey,
  isActivatingCompanyKey,
  isLoadingCompanies,
  onActivateCompany,
}: {
  companies: ServerOption[];
  currentCompanyKey: string;
  isActivatingCompanyKey: string | null;
  isLoadingCompanies: boolean;
  onActivateCompany: (company: ServerOption) => void;
}) {
  if (isLoadingCompanies && companies.length === 0) {
    return <div className="portal-system-gate__helper-block">{COMPANY_LOADING_MESSAGE}</div>;
  }

  if (companies.length === 0) {
    return <div className="portal-system-gate__helper-block">{COMPANY_EMPTY_MESSAGE}</div>;
  }

  return (
    <div className="portal-system-gate__company-list">
      {companies.map((company) => {
        const isActive = company.companyKey === currentCompanyKey;
        const isSwitching = isActivatingCompanyKey === company.companyKey;

        return (
          <button
            key={`${company.companyKey}:${company.basename}:${company.serverport}`}
            className={`portal-system-gate__company-card ${isActive ? 'is-active' : ''}`}
            disabled={Boolean(isActivatingCompanyKey)}
            onClick={() => {
              onActivateCompany(company);
            }}
            type="button"
          >
            <div className="portal-system-gate__company-icon"><IconDatabase /></div>
            <div className="portal-system-gate__company-content">
              <div className="portal-system-gate__company-row">
                <div className="portal-system-gate__company-name">{company.title}</div>
                {isActive ? <span className="portal-system-gate__company-tag">当前使用</span> : null}
              </div>
              <div className="portal-system-gate__company-desc">库描述：{company.title}业务数据库</div>
              <div className="portal-system-gate__company-time">
                更新时间：{isSwitching ? '切换中...' : `${company.serverip}:${company.serverport}`}
              </div>
            </div>
            {isActive ? (
              <span className="portal-system-gate__company-check"><IconCheck /></span>
            ) : null}
          </button>
        );
      })}

    </div>
  );
}

function SystemGrid({
  canEnterSystem,
  entries,
  isSwitchingContext,
  onLockedClick,
  showManageButton,
}: {
  canEnterSystem: boolean;
  entries: GrantedSystemEntry[];
  isSwitchingContext: boolean;
  onLockedClick: () => void;
  showManageButton: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="portal-system-gate__helper-block portal-system-gate__helper-block--large">
        <div className="portal-system-gate__helper-title">{NO_SYSTEM_TITLE}</div>
        <div className="portal-system-gate__helper-copy">{NO_SYSTEM_DESC}</div>
      </div>
    );
  }

  return (
    <div className="portal-system-gate__system-grid">
      {entries.map((entry) => {
        const visual = getSystemVisual(entry);
        const stateLabel = isSwitchingContext ? '同步中' : canEnterSystem ? '可进入' : '需选择业务库';

        return (
          <button
            key={entry.id}
            className={[
              'portal-system-gate__system-card',
              entry.id === 'project' ? 'is-primary' : '',
              canEnterSystem ? 'is-ready' : 'is-disabled',
              isSwitchingContext ? 'is-switching' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => {
              if (!canEnterSystem) {
                onLockedClick();
                return;
              }

              navigate(entry.route);
            }}
            type="button"
          >
            <div className={`portal-system-gate__system-icon ${visual.accentClass}`}>{visual.icon}</div>
            <div className="portal-system-gate__system-body">
              <div className="portal-system-gate__system-meta">
                <span>{entry.shortLabel}</span>
                <em>{stateLabel}</em>
              </div>
              <div className="portal-system-gate__system-title">{entry.title}</div>
              <div className="portal-system-gate__system-desc">{getSystemDescription(entry)}</div>
            </div>
            <div className="portal-system-gate__system-arrow"><IconChevronRight /></div>
          </button>
        );
      })}

      <button
        className="portal-system-gate__system-card portal-system-gate__system-card--more"
        disabled={!showManageButton}
        onClick={() => {
          if (showManageButton) {
            navigate('/system-manager');
          }
        }}
        type="button"
      >
        <div className="portal-system-gate__system-icon portal-system-gate__system-icon--slate"><IconGrid /></div>
        <div className="portal-system-gate__system-body">
          <div className="portal-system-gate__system-title">更多系统</div>
          <div className="portal-system-gate__system-desc">查看全部系统</div>
        </div>
        <div className="portal-system-gate__system-arrow"><IconChevronRight /></div>
      </button>
    </div>
  );
}

function AccessDeniedLayout({
  children,
  session,
}: {
  children: ReactNode;
  session: AuthSession;
}) {
  return (
    <div className="portal-system-gate">
      <PlatformHeader session={session} />
      <main className="portal-system-gate__main portal-system-gate__main--denied">
        {children}
      </main>
    </div>
  );
}

export function AccessDeniedPage({ session, targetLabel }: AccessDeniedPageProps) {
  return (
    <AccessDeniedLayout session={session}>
      <div className="portal-system-gate__denied-card">
        <div className="portal-system-gate__denied-tag">{ACCESS_DENIED}</div>
        <h1>{getAccessDeniedTitle(targetLabel)}</h1>
        <p>{ACCESS_DENIED_DESC}</p>
        <div className="portal-system-gate__denied-actions">
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
      </div>
    </AccessDeniedLayout>
  );
}

export function SystemAccessPage({ session }: SystemAccessPageProps) {
  const { applyAuthBootstrap } = usePortalAuth();
  const showManageButton = canManageSystems(session);
  const redirectTarget = getRedirectTarget();
  const currentCompanyKey = session.activeCompany?.companyKey ?? session.companyKey ?? '';
  const currentCompanyTitle = session.activeCompany?.title ?? session.companyTitle ?? '';
  const hasActiveCompany = Boolean(currentCompanyKey && session.loginStage === 'company');

  const accessibleEntries = getGrantedSystemIds(session)
    .map((systemId) => getPlatformSystemEntry(systemId))
    .filter((entry): entry is GrantedSystemEntry => entry !== null);

  const [companies, setCompanies] = useState<ServerOption[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isActivatingCompanyKey, setIsActivatingCompanyKey] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [optimisticCompany, setOptimisticCompany] = useState<ServerOption | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const activationRequestIdRef = React.useRef(0);
  const displayedCompanyKey = optimisticCompany?.companyKey ?? currentCompanyKey;
  const displayedCompanyTitle = optimisticCompany?.title ?? currentCompanyTitle;
  const displayedCompany =
    optimisticCompany ?? companies.find((company) => company.companyKey === displayedCompanyKey) ?? null;
  const isSwitchingContext = Boolean(isActivatingCompanyKey);
  const canEnterSystem = hasActiveCompany && !isSwitchingContext;
  const contextStatus: BusinessContextStatusKind = isActivatingCompanyKey
    ? 'switching'
    : hasActiveCompany
      ? 'ready'
      : 'required';

  useEffect(() => {
    let active = true;

    const loadCompanies = async () => {
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
        setCompanyError(error instanceof Error ? error.message : COMPANY_LOAD_ERROR_FALLBACK);
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
  }, [session.accessToken]);

  useEffect(() => {
    if (optimisticCompany?.companyKey === currentCompanyKey) {
      setOptimisticCompany(null);
    }
  }, [currentCompanyKey, optimisticCompany]);

  const filteredEntries = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) {
      return accessibleEntries;
    }

    return accessibleEntries.filter((entry) => {
      const haystack = `${entry.title} ${getSystemDescription(entry)} ${entry.shortLabel}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [accessibleEntries, searchValue]);

  const activateCompany = async (company: ServerOption) => {
    if (!session.accessToken) {
      setCompanyError(COMPANY_SESSION_ERROR);
      return;
    }

    setGateMessage(null);

    if (company.companyKey === currentCompanyKey && hasActiveCompany) {
      if (redirectTarget) {
        window.location.assign(redirectTarget);
      }
      return;
    }

    const activationRequestId = activationRequestIdRef.current + 1;
    activationRequestIdRef.current = activationRequestId;
    setOptimisticCompany(company);
    setIsActivatingCompanyKey(company.companyKey);
    setCompanyError(null);

    try {
      const nextSession = await activateCompanySession(session.accessToken, {
        companyKey: company.companyKey,
      });

      persistAuthSession(nextSession, shouldRememberAuthSession());
      applyAuthBootstrap(buildFallbackPortalBootstrapPayload(nextSession));

      if (redirectTarget) {
        window.location.assign(redirectTarget);
        return;
      }

      void resolvePortalBootstrapPayload(nextSession).then((bootstrapPayload) => {
        if (activationRequestIdRef.current === activationRequestId) {
          applyAuthBootstrap(bootstrapPayload);
        }
      });

      setGateMessage(null);
    } catch (error) {
      if (activationRequestIdRef.current === activationRequestId) {
        setOptimisticCompany(null);
      }
      setCompanyError(error instanceof Error ? error.message : COMPANY_SWITCH_ERROR_FALLBACK);
    } finally {
      if (activationRequestIdRef.current === activationRequestId) {
        setIsActivatingCompanyKey(null);
      }
    }
  };

  return (
    <div className="portal-system-gate">
      <PlatformHeader session={session} />
      <main className="portal-system-gate__main">
        <HeroSection />

        <div className="portal-system-gate__shell">
          <div className="portal-system-gate__panel">
            <div className="portal-system-gate__panel-left">
              <div className="portal-system-gate__section-head">
                <div className="portal-system-gate__section-title">
                  <StepBadge step={1} />
                  <div>
                    <div className="portal-system-gate__section-row">
                      <h2>选择业务库</h2>
                      <span>请选择您需要操作的业务库</span>
                    </div>
                  </div>
                </div>
              </div>

              <BusinessContextStatus
                company={displayedCompany}
                companyTitle={displayedCompanyTitle}
                status={contextStatus}
              />
              <BusinessContextNotes />

              {companyError ? <Banner message={companyError} tone="danger" /> : null}
              {gateMessage ? <Banner message={gateMessage} tone="success" /> : null}
              {!companyError && !gateMessage && !hasActiveCompany ? (
                <Banner message={REQUIRED_COMPANY_MESSAGE} tone="warning" />
              ) : null}

              <div className="portal-system-gate__subsection-row">
                <span>可用业务库</span>
                <em>{isLoadingCompanies ? '同步中' : `${companies.length} 个上下文`}</em>
              </div>

              <CompanyList
                companies={companies}
                currentCompanyKey={displayedCompanyKey}
                isActivatingCompanyKey={isActivatingCompanyKey}
                isLoadingCompanies={isLoadingCompanies}
                onActivateCompany={(company) => {
                  void activateCompany(company);
                }}
              />
            </div>

            <div className="portal-system-gate__panel-arrow" aria-hidden="true">
              <span><IconArrowRight /></span>
            </div>

            <div className="portal-system-gate__panel-right">
              <div className="portal-system-gate__section-head portal-system-gate__section-head--system">
                <div className="portal-system-gate__section-title">
                  <StepBadge step={2} />
                  <div>
                    <div className="portal-system-gate__section-row">
                      <h2>选择系统</h2>
                      <span>
                        已选择：
                        <em>{displayedCompanyTitle || '请先选择业务库'}</em>
                      </span>
                    </div>
                    <p>请选择您要进入的系统</p>
                  </div>
                </div>

                <div className="portal-system-gate__toolbar">
                  <label className="portal-system-gate__search">
                    <span className="portal-system-gate__search-icon"><IconSearch /></span>
                    <input
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setSearchValue(event.target.value);
                      }}
                      placeholder="搜索系统名称"
                      value={searchValue}
                    />
                  </label>
                </div>
              </div>

              {filteredEntries.length === 0 && accessibleEntries.length > 0 ? (
                <div className="portal-system-gate__helper-block">没有匹配到系统，请尝试其他关键词。</div>
              ) : (
                <SystemGrid
                  canEnterSystem={canEnterSystem}
                  entries={filteredEntries}
                  isSwitchingContext={isSwitchingContext}
                  onLockedClick={() => {
                    setGateMessage(isSwitchingContext ? SWITCHING_COMPANY_MESSAGE : REQUIRED_COMPANY_MESSAGE);
                  }}
                  showManageButton={showManageButton}
                />
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

function BaseIcon({
  children,
  viewBox = '0 0 24 24',
}: {
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
}

function GlyphIcon({
  children,
  viewBox = '0 0 24 24',
}: {
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox={viewBox}>
      {children}
    </svg>
  );
}

function IconHelp() {
  return (
    <BaseIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 4.1 1.9c-.8.7-1.6 1.1-1.6 2.1" />
      <path d="M12 16.7h.01" />
    </BaseIcon>
  );
}

function IconBell() {
  return (
    <BaseIcon>
      <path d="M15 18H9" />
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-1.5 2h15Z" />
    </BaseIcon>
  );
}

function IconChevronDown() {
  return (
    <BaseIcon>
      <path d="m7 10 5 5 5-5" />
    </BaseIcon>
  );
}

function IconChevronRight() {
  return (
    <BaseIcon>
      <path d="m10 7 5 5-5 5" />
    </BaseIcon>
  );
}

function IconArrowRight() {
  return (
    <BaseIcon>
      <path d="M5 12h14" />
      <path d="m13 7 5 5-5 5" />
    </BaseIcon>
  );
}

function IconDatabase() {
  return (
    <GlyphIcon>
      <path d="M12 3.5c-3.67 0-6.64 1.1-6.64 2.45v12.1c0 1.35 2.97 2.45 6.64 2.45 3.66 0 6.64-1.1 6.64-2.45V5.95C18.64 4.6 15.66 3.5 12 3.5Zm0 1.8c3.17 0 4.84.9 4.84 1.55 0 .64-1.67 1.55-4.84 1.55-3.18 0-4.84-.91-4.84-1.55 0-.65 1.66-1.55 4.84-1.55Zm0 11.76c-3.18 0-4.84-.91-4.84-1.55v-1.32c1.2.73 3.05 1.14 4.84 1.14 1.78 0 3.64-.4 4.84-1.14v1.32c0 .64-1.67 1.55-4.84 1.55Zm0-4.45c-3.18 0-4.84-.91-4.84-1.55V9.74c1.2.73 3.05 1.14 4.84 1.14 1.78 0 3.64-.4 4.84-1.14v1.32c0 .64-1.67 1.55-4.84 1.55Z" />
    </GlyphIcon>
  );
}

function IconCheck() {
  return (
    <BaseIcon>
      <path d="m6.5 12.5 3.3 3.3 7-7" />
    </BaseIcon>
  );
}

function IconSearch() {
  return (
    <BaseIcon>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4-4" />
    </BaseIcon>
  );
}

function IconGrid() {
  return (
    <GlyphIcon>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </GlyphIcon>
  );
}

function IconShield() {
  return (
    <BaseIcon>
      <path d="M12 3 5 6v5c0 4.3 2.7 7.7 7 10 4.3-2.3 7-5.7 7-10V6Z" />
      <path d="m9.2 12.2 1.9 1.9 3.9-4.1" />
    </BaseIcon>
  );
}

function IconMoney() {
  return (
    <GlyphIcon>
      <path d="M6 3.5h12A1.5 1.5 0 0 1 19.5 5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Zm6 3.2a.9.9 0 0 0-.9.9v.65c-1.72.2-2.96 1.23-2.96 2.76 0 1.83 1.37 2.45 3.13 2.89 1.48.37 2.07.66 2.07 1.34 0 .72-.7 1.22-1.76 1.22-1.02 0-1.78-.49-2.08-1.32a.9.9 0 1 0-1.7.6c.47 1.33 1.63 2.17 3.3 2.33v.62a.9.9 0 1 0 1.8 0v-.67c1.88-.27 3.05-1.42 3.05-2.95 0-1.96-1.52-2.53-3.3-2.97-1.39-.35-1.9-.62-1.9-1.28 0-.57.57-1 1.5-1 .9 0 1.43.35 1.7 1.02a.9.9 0 1 0 1.67-.68c-.42-1.04-1.3-1.72-2.72-1.9V7.6a.9.9 0 0 0-.9-.9Z" />
    </GlyphIcon>
  );
}

function IconUsers() {
  return (
    <GlyphIcon>
      <path d="M8.3 11a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Zm7.4 0a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2ZM3.8 18.5c0-2.5 2.1-4.5 4.6-4.5 2.55 0 4.6 2 4.6 4.5v1.1H3.8v-1.1Zm7.2 1.1v-1.1c0-.87-.2-1.7-.57-2.44a5.65 5.65 0 0 1 1.98-.36c2.5 0 4.52 2 4.52 4.47V19.6H11Z" />
    </GlyphIcon>
  );
}

function IconTruck() {
  return (
    <GlyphIcon>
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h8a1.5 1.5 0 0 1 1.5 1.5V8H16a2 2 0 0 1 1.6.8l2.2 2.9c.27.35.42.79.42 1.23v2.35a1.25 1.25 0 0 1-1.25 1.25h-.96a2.8 2.8 0 0 1-5.48 0H10a2.8 2.8 0 0 1-5.48 0H4.75A1.25 1.25 0 0 1 3.5 15.35V6.5Zm12 2.75v3.05h3.18l-1.6-2.12a.75.75 0 0 0-.6-.3H15.5Zm-8 8.2a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7Zm8.8 0a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7Z" />
    </GlyphIcon>
  );
}

function IconFolder() {
  return (
    <GlyphIcon>
      <path d="M4.5 6.25A1.75 1.75 0 0 1 6.25 4.5H9.3c.5 0 .98.2 1.33.56l1.16 1.13c.28.27.65.43 1.04.43h4.92A1.75 1.75 0 0 1 19.5 8.38v9.37a1.75 1.75 0 0 1-1.75 1.75H6.25A1.75 1.75 0 0 1 4.5 17.75V6.25Zm4.3 2.4a.9.9 0 1 0 0 1.8h5.7a.9.9 0 1 0 0-1.8H8.8Zm0 3.65a.9.9 0 1 0 0 1.8h7.4a.9.9 0 1 0 0-1.8H8.8Z" />
    </GlyphIcon>
  );
}

function IconChartBar() {
  return (
    <GlyphIcon>
      <path d="M5.75 18.75a.75.75 0 0 1-.75-.75V10.2a.95.95 0 0 1 .95-.95h1.8a.95.95 0 0 1 .95.95V18a.75.75 0 0 1-.75.75H5.75Zm5.35 0a.75.75 0 0 1-.75-.75V6.3a.95.95 0 0 1 .95-.95h1.8a.95.95 0 0 1 .95.95V18a.75.75 0 0 1-.75.75H11.1Zm5.35 0a.75.75 0 0 1-.75-.75V12.85a.95.95 0 0 1 .95-.95h1.8a.95.95 0 0 1 .95.95V18a.75.75 0 0 1-.75.75h-2.2ZM4.5 20a.9.9 0 1 1 0-1.8h15a.9.9 0 1 1 0 1.8h-15Z" />
    </GlyphIcon>
  );
}
