import React, {
  startTransition,
  useEffect,
  useMemo,
  useRef,
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
import type { AuthSession as StoredAuthSession, ServerOption } from '../features/auth/types';
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

type PageView = 'spaces' | 'catalog';

const PLATFORM_TITLE = '企业数字化管理平台';
const ACCESS_DENIED = '无权限';
const RETURN_TO_SYSTEMS = '返回系统选择';
const RETURN_TO_LOGIN = '返回登录页';
const COMPANY_LOADING_MESSAGE = '正在加载可用业务空间...';
const COMPANY_LOAD_ERROR_FALLBACK = '业务空间加载失败，请稍后重试。';
const COMPANY_SWITCH_ERROR_FALLBACK = '业务空间切换失败，请稍后重试。';
const COMPANY_SESSION_ERROR = '当前会话缺少访问令牌，请重新登录。';
const DEMO_COMPANY_KEY = 'demo-company';
const DEMO_COMPANY_TITLE = '朗速科技演示库';
const LOCKED_SPACE_PREVIEWS = [
  {
    badge: 'REGIONAL',
    desc: '赋能华东区域的销售与运营管理，实现区域化数据隔离与业务协作闭环。',
    title: '华东大区业务库',
  },
  {
    badge: 'GLOBAL',
    desc: '为跨境贸易与全球供应链量身定制，支持多时区与多语言环境下的业务开展。',
    title: '海外协同业务库',
  },
] as const;
const REQUIRED_COMPANY_MESSAGE = '请先选择业务空间，再进入系统。';
const SWITCHING_COMPANY_MESSAGE = '正在切换业务空间，请稍后进入系统。';
const NO_SYSTEM_TITLE = '当前账号暂无可进入的系统';
const NO_SYSTEM_DESC = '请联系管理员为当前账号补齐系统授权后再重新登录。';
const ACCESS_DENIED_DESC =
  '门户会根据当前账号的系统授权控制访问范围。若还未开通该系统，请先返回系统选择页，或联系管理员补齐授权后再进入。';
const USER_AVATAR_PNG_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAADu0lEQVR42u2b6VrTQBRAeURBQEFAEdkfxn1BxR33FTdE/2ML+AaigC3FDaTaphUcv0ky6Z3JpEty7zSlzPedBzinbTpzk7S07C0zq+20xfZzzji0n82z9nMOHec5OdZxIcc6ORM51vjCJwus7ZRLjfKdE3/YgYsulzi/GydIKxdHlj942WUyxiFaTxQZtXzXZJZ1XXGIl7hh+e6rnC3WfW2rfiH2HXfF6yh/iHOd84s1tXzPDYemlu+5ydlkTS3fe8uhqeV7pzZZ39QGa2r5vtsbrO8OUoRGlT/MufuTxV5+bukvmTznyL2QEajk55a2bWnIe86nEpjyNvd/sLrv8OY+bmvlt/L/JHkIlnx/rQEo5blwWSw3yGdOEUW+/4FDXQ42tcoLuHzCBUO+/+F31jDyggSIEFX+KOdRFREoLnhh5KUIy0UU+YoB4ibvRVh2IkSVH3j8zcbIGAte5aPISwEQ5AeeBATA3uRUDGCFCIAgf4zz9Ks/AsUOLzCAFSLAShFNPjhADOUFyZUiS64UUOQHn+kCIB9sxPY2jvK+ABSnOrGdjSrvBCjYYMkPTq+zoen1UgSKI60UwEIMgCQ/9BwGIDjPewEsxACI8r4AFMMMjAhU8kMvMqUAVJMceKqLIp9cLaDLD0sBCMdY8FQXJ/nhl0oAyhleosYIJuSlACYGmOJUpwL/5yWI5UdercEA5qa3UgBb3C9PccFT5UdewwAG5H2ffoA8/+QFlPJSAEp53de+GnnB/GqBRH50BgYw+JtX5bPiohcgP/9FYKHKj86k5fMAlrx3xQ+44EGyZVDlIejyXgAC+aC/umwlCoIdOUDKIYr86BtdgJjKC6D8gktY+TF9ADz5cpucMPKQBRCAE0Z+bDatnwtiXPAo5X0R0haevB0A4WpPLe8FSAvyNcmPzabK3xuI8j9vQt6L4MrbAbDkRYC4y5ci5D2qkR9/m6ru/mCY7a1peRhgcS2PJ28HCHGwMS0vAnB5EaCcfE0B+Krm4QS4vTUtzxHyHFR5J0C85bURAuTH36XCPSdU6ckMeLDZdfJehDJPZqinOpPyUoBMnkZerKCHE+BZ3rS8FyDjBqCSF0v3cEJVAYjk7QAZGIBQ3ouguT8Phxm7Wl4s9f68OsUxLb+YyZmTF0u9S+sLQCifLe7UV96LAEbX6gzPlPwHEcC0PFxidK2b4VF+7YV8bN4e42Nr3QCTSj627w/qBphighN2kwPlG+YNUlUejrHgMEM91UkA+YZ/l1gnD8/zKnuvmxta/wGB/sStM9KMlAAAAABJRU5ErkJggg==';

const SYSTEM_COPY: Record<string, string> = {
  bi: '深度的业务数据挖掘与多维分析建模。',
  'bi-display': '企业级大屏监控体系与可视化报告输出。',
  designer: '云端协同式界面体验设计与沉淀资产中心。',
  erp: '集成化的全域企业资源计划与泛供应链协同平台。',
  project: '覆盖研发与项目交付里程碑的全生命周期管理跟踪库。',
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
  if (session.admin === true) {
    return true;
  }

  const allowlist = new Set(['管理员', '张又文', '王一帆', '张伟', '张又新']);
  return [session.username, session.employeeName, session.displayName]
    .some((value) => allowlist.has((value ?? '').trim()));
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

function getSpaceBadge(company: ServerOption, index: number): { label: string; subLabel: string } | null {
  const title = company.title;
  if (title.includes('总部') || title.includes('核心') || title.includes('主') || index === 0) {
    return { label: 'PRIMARY', subLabel: '主要' };
  }
  if (title.includes('大区') || title.includes('区域') || title.includes('分部') || title.includes('华东') || title.includes('华南')) {
    return { label: 'REGIONAL', subLabel: '区域' };
  }
  if (title.includes('海外') || title.includes('全球') || title.includes('国际') || title.includes('协同')) {
    return { label: 'GLOBAL', subLabel: '全球' };
  }
  return null;
}

function getSpaceDescription(company: ServerOption): string {
  const title = company.title;
  if (title.includes('总部') || title.includes('核心')) {
    return '作为全局核心主数据的承载平台，提供基础的组织架构、主数据管控及核心中枢服务。';
  }
  if (title.includes('大区') || title.includes('区域') || title.includes('华东') || title.includes('华南')) {
    return '赋能区域化的销售与运营管理，实现区域化数据隔离与业务协作闭环。';
  }
  if (title.includes('海外') || title.includes('全球') || title.includes('国际')) {
    return '为跨境贸易与全球供应链量身定制，支持多时区与多语言环境下的业务开展。';
  }
  return `业务空间 ${company.title}，提供对应的数据模型与应用权限范围。`;
}

function getSpaceIcon(index: number): ReactNode {
  const icons = [
    <IconDatabaseOutline key="db" />,
    <IconBuildingOutline key="building" />,
    <IconGlobeOutline key="globe" />,
  ];
  return icons[index % icons.length];
}

function BrandMark() {
  return (
    <span className="portal-system-gate__brand-mark" aria-hidden="true">
      <img alt="" src={platformLogoUrl} />
    </span>
  );
}

function PlatformHeader({ session }: { session: AuthSession }) {
  const { signOut } = usePortalAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const displayName = session.employeeName ?? session.username ?? '张伟';
  const accountName = session.username || session.displayName || displayName;

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !userMenuRef.current?.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const handleSignOut = () => {
    startTransition(() => {
      setIsUserMenuOpen(false);
      clearAuthSession();
      signOut();
      navigate('/');
    });
  };

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
          <div ref={userMenuRef} className="portal-system-gate__user-menu">
            <button
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              className="portal-system-gate__user"
              onClick={() => {
                setIsUserMenuOpen((current) => !current);
              }}
              type="button"
            >
              <span className="portal-system-gate__avatar">
                <img alt="" src={USER_AVATAR_PNG_SRC} />
              </span>
              <span className="portal-system-gate__user-name">{displayName}</span>
              <span className="portal-system-gate__user-arrow"><IconChevronDown /></span>
            </button>
            {isUserMenuOpen ? (
              <div className="portal-system-gate__user-popover" role="menu">
                <div className="portal-system-gate__user-summary">
                  <strong>{displayName}</strong>
                  <span>{accountName}</span>
                </div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/systems');
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span className="portal-system-gate__menu-icon"><IconGrid /></span>
                  <span>系统选择</span>
                </button>
                <button
                  className="portal-system-gate__user-menu-danger"
                  onClick={handleSignOut}
                  role="menuitem"
                  type="button"
                >
                  <span className="portal-system-gate__menu-icon"><IconSignOut /></span>
                  <span>退出登录</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
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

function BusinessSpaceSelector({
  companies,
  isLoadingCompanies,
  currentCompanyKey,
  isActivatingCompanyKey,
  companyError,
  onSelectCompany,
  onEnterDemoCompany,
}: {
  companies: ServerOption[];
  isLoadingCompanies: boolean;
  currentCompanyKey: string;
  isActivatingCompanyKey: string | null;
  companyError: string | null;
  onSelectCompany: (company: ServerOption) => void;
  onEnterDemoCompany: () => void;
}) {
  if (isLoadingCompanies && companies.length === 0) {
    return (
      <div className="portal-system-gate__spaces">
        <div className="portal-system-gate__spaces-header">
          <h1>选择业务空间</h1>
          <p>业务空间定义了您的系统操作上下文。请点选以加载对应的基础数据模型与应用权限范围。</p>
        </div>
        <div className="portal-system-gate__helper-block portal-system-gate__helper-block--large">
          {COMPANY_LOADING_MESSAGE}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="portal-system-gate__spaces">
        <div className="portal-system-gate__spaces-header">
          <h1>选择业务空间</h1>
          <p>业务空间定义了您的系统操作上下文。请点选以加载对应的基础数据模型与应用权限范围。</p>
        </div>
        <div className="portal-system-gate__space-grid portal-system-gate__space-grid--preview">
          <button
            className="portal-system-gate__space-card portal-system-gate__space-card--demo is-active"
            onClick={onEnterDemoCompany}
            type="button"
          >
            <span className="portal-system-gate__space-card-badge">PRIMARY</span>
            <span className="portal-system-gate__space-card-icon">
              <IconDatabaseOutline />
            </span>
            <span className="portal-system-gate__space-card-title">{DEMO_COMPANY_TITLE}</span>
            <span className="portal-system-gate__space-card-desc">
              使用内置演示业务空间进入系统选择页面，快速预览 ERP、BI、设计与项目模块。
            </span>
            <span className="portal-system-gate__space-card-arrow"><IconChevronRight /></span>
          </button>
          {LOCKED_SPACE_PREVIEWS.map((space, index) => (
            <button
              key={space.title}
              className="portal-system-gate__space-card portal-system-gate__space-card--locked"
              disabled
              type="button"
            >
              <span className="portal-system-gate__space-card-badge">{space.badge}</span>
              <span className="portal-system-gate__space-card-icon">
                {getSpaceIcon(index + 1)}
              </span>
              <span className="portal-system-gate__space-card-title">{space.title}</span>
              <span className="portal-system-gate__space-card-desc">{space.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="portal-system-gate__spaces">
      <div className="portal-system-gate__spaces-header">
        <h1>选择业务空间</h1>
        <p>业务空间定义了您的系统操作上下文。请点选以加载对应的基础数据模型与应用权限范围。</p>
      </div>

      {companyError ? <Banner message={companyError} tone="danger" /> : null}

      <div className="portal-system-gate__space-grid">
        {companies.map((company, index) => {
          const badge = getSpaceBadge(company, index);
          const isActive = company.companyKey === currentCompanyKey;
          const isSwitching = isActivatingCompanyKey === company.companyKey;

          return (
            <button
              key={`${company.companyKey}:${company.basename}:${company.serverport}`}
              className={[
                'portal-system-gate__space-card',
                isActive ? 'is-active' : '',
                isSwitching ? 'is-switching' : '',
              ].filter(Boolean).join(' ')}
              disabled={Boolean(isActivatingCompanyKey)}
              onClick={() => {
                onSelectCompany(company);
              }}
              type="button"
            >
              {badge ? (
                <span className="portal-system-gate__space-card-badge">
                  {badge.label}
                </span>
              ) : null}
              <span className="portal-system-gate__space-card-icon">
                {getSpaceIcon(index)}
              </span>
              <span className="portal-system-gate__space-card-title">{company.title}</span>
              <span className="portal-system-gate__space-card-desc">{getSpaceDescription(company)}</span>
              {isSwitching ? (
                <span className="portal-system-gate__space-card-status">切换中...</span>
              ) : null}
              {!isSwitching ? (
                <span className="portal-system-gate__space-card-arrow"><IconChevronRight /></span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ApplicationCatalog({
  companyTitle,
  entries,
  accessibleEntries,
  searchValue,
  onSearchChange,
  onEnterSystem,
  onSwitchSpace,
  showManageButton,
  canEnterSystem,
  isSwitchingContext,
}: {
  companyTitle: string;
  entries: GrantedSystemEntry[];
  accessibleEntries: GrantedSystemEntry[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onEnterSystem: (entry: GrantedSystemEntry) => void;
  onSwitchSpace: () => void;
  showManageButton: boolean;
  canEnterSystem: boolean;
  isSwitchingContext: boolean;
}) {
  return (
    <div className="portal-system-gate__catalog">
      <div className="portal-system-gate__catalog-header">
        <div className="portal-system-gate__catalog-header-left">
          <h1>应用目录</h1>
          <p>
            正在执行于
            <button
              className="portal-system-gate__catalog-space-name"
              onClick={onSwitchSpace}
              type="button"
            >
              {companyTitle || '未选择'}
            </button>
            环境。请选择要进入的系统应用。
          </p>
        </div>
        <div className="portal-system-gate__view-toggle">
          <button className="is-active" type="button">
            <span className="portal-system-gate__view-toggle-icon"><IconGridSmall /></span>
            <span>网格</span>
          </button>
          <button type="button">
            <span className="portal-system-gate__view-toggle-icon"><IconList /></span>
            <span>列表</span>
          </button>
        </div>
      </div>

      <label className="portal-system-gate__catalog-search">
        <span className="portal-system-gate__catalog-search-icon"><IconSearch /></span>
        <input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onSearchChange(event.target.value);
          }}
          placeholder="搜索系统名称"
          value={searchValue}
        />
      </label>

      {entries.length === 0 && accessibleEntries.length > 0 ? (
        <div className="portal-system-gate__helper-block">没有匹配到系统，请尝试其他关键词。</div>
      ) : entries.length === 0 ? (
        <div className="portal-system-gate__helper-block portal-system-gate__helper-block--large">
          <div className="portal-system-gate__helper-title">{NO_SYSTEM_TITLE}</div>
          <div className="portal-system-gate__helper-copy">{NO_SYSTEM_DESC}</div>
        </div>
      ) : (
        <div className="portal-system-gate__catalog-grid">
          {entries.map((entry) => {
            const visual = getSystemVisual(entry);
            return (
              <button
                key={entry.id}
                className={[
                  'portal-system-gate__catalog-card',
                  canEnterSystem ? '' : 'is-disabled',
                  isSwitchingContext ? 'is-switching' : '',
                ].filter(Boolean).join(' ')}
                disabled={!canEnterSystem || isSwitchingContext}
                onClick={() => {
                  onEnterSystem(entry);
                }}
                type="button"
              >
                <span className={`portal-system-gate__catalog-card-icon ${visual.accentClass}`}>
                  {visual.icon}
                </span>
                <span className="portal-system-gate__catalog-card-body">
                  <span className="portal-system-gate__catalog-card-title">{entry.title}</span>
                  <span className="portal-system-gate__catalog-card-desc">{getSystemDescription(entry)}</span>
                </span>
                <span className="portal-system-gate__catalog-card-arrow"><IconChevronRight /></span>
              </button>
            );
          })}

          <button
            className="portal-system-gate__catalog-card portal-system-gate__catalog-card--add"
            disabled={!showManageButton}
            onClick={() => {
              if (showManageButton) {
                navigate('/system-manager');
              }
            }}
            type="button"
          >
            <span className="portal-system-gate__catalog-add-icon"><IconPlus /></span>
            <span className="portal-system-gate__catalog-add-label">配置新应用接入</span>
          </button>
        </div>
      )}
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
  const hasTenantDefaultContext = (
    session.loginStage === 'tenant' && session.businessDbRequired === false
  );

  const [companies, setCompanies] = useState<ServerOption[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isActivatingCompanyKey, setIsActivatingCompanyKey] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [optimisticCompany, setOptimisticCompany] = useState<ServerOption | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [view, setView] = useState<PageView>('spaces');
  const activationRequestIdRef = React.useRef(0);
  const hasBusinessContext = hasActiveCompany || hasTenantDefaultContext;
  const displayedCompanyKey = optimisticCompany?.companyKey ?? currentCompanyKey;
  const displayedCompanyTitle = optimisticCompany?.title ?? currentCompanyTitle;
  const businessContextTitle = displayedCompanyTitle || (hasBusinessContext ? '当前租户默认库' : '');
  const isSwitchingContext = Boolean(isActivatingCompanyKey);
  const canEnterSystem = hasBusinessContext && !isSwitchingContext;

  useEffect(() => {
    if (hasBusinessContext) {
      setView('catalog');
    } else {
      setView('spaces');
    }
  }, [hasBusinessContext]);

  useEffect(() => {
    let active = true;

    const loadCompanies = async () => {
      const shouldLoadCompanies = (
        session.businessDbRequired !== false
        && (session.loginStage === 'tenant' || !hasActiveCompany)
      );

      if (!shouldLoadCompanies) {
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
  }, [
    hasActiveCompany,
    session.accessToken,
    session.businessDbRequired,
    session.loginStage,
  ]);

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
      } else {
        setView('catalog');
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
      setView('catalog');
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

  const enterDemoCompany = () => {
    const nextSession: AuthSession & StoredAuthSession = {
      ...session,
      accessToken: session.accessToken ?? '',
      activeCompany: {
        companyKey: DEMO_COMPANY_KEY,
        datasourceCode: DEMO_COMPANY_KEY,
        title: DEMO_COMPANY_TITLE,
      },
      businessDbRequired: false,
      companyKey: DEMO_COMPANY_KEY,
      companyTitle: DEMO_COMPANY_TITLE,
      datasourceCode: DEMO_COMPANY_KEY,
      employeeName: session.employeeName ?? session.displayName ?? session.username,
      loginStage: 'company',
    };

    persistAuthSession(nextSession, shouldRememberAuthSession());
    applyAuthBootstrap(buildFallbackPortalBootstrapPayload(nextSession));
    setCompanyError(null);
    setGateMessage(null);
    setOptimisticCompany(null);

    if (redirectTarget) {
      window.location.assign(redirectTarget);
      return;
    }

    setView('catalog');
  };

  const handleEnterSystem = (entry: GrantedSystemEntry) => {
    if (!canEnterSystem) {
      setGateMessage(isSwitchingContext ? SWITCHING_COMPANY_MESSAGE : REQUIRED_COMPANY_MESSAGE);
      return;
    }
    navigate(entry.route);
  };

  return (
    <div className="portal-system-gate">
      <PlatformHeader session={session} />
      <main className="portal-system-gate__main">
        {view === 'spaces' ? (
          <BusinessSpaceSelector
            companies={companies}
            isLoadingCompanies={isLoadingCompanies}
            currentCompanyKey={displayedCompanyKey}
            isActivatingCompanyKey={isActivatingCompanyKey}
            companyError={companyError}
            onSelectCompany={(company) => {
              void activateCompany(company);
            }}
            onEnterDemoCompany={enterDemoCompany}
          />
        ) : (
          <ApplicationCatalog
            companyTitle={businessContextTitle}
            entries={filteredEntries}
            accessibleEntries={accessibleEntries}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onEnterSystem={handleEnterSystem}
            onSwitchSpace={() => {
              setView('spaces');
            }}
            showManageButton={showManageButton}
            canEnterSystem={canEnterSystem}
            isSwitchingContext={isSwitchingContext}
          />
        )}
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

function IconSignOut() {
  return (
    <BaseIcon>
      <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
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

function IconDatabaseOutline() {
  return (
    <BaseIcon>
      <ellipse cx="12" cy="6.5" rx="8.5" ry="3" />
      <path d="M3.5 6.5v11c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3v-11" />
      <path d="M3.5 12c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3" />
    </BaseIcon>
  );
}

function IconBuildingOutline() {
  return (
    <BaseIcon>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4v18" />
      <path d="M19 21V11l-7-4" />
      <path d="M9 9h1" />
      <path d="M9 13h1" />
      <path d="M9 17h1" />
    </BaseIcon>
  );
}

function IconGlobeOutline() {
  return (
    <BaseIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a15.3 15.3 0 0 1 0 18" />
      <path d="M12.5 3a15.3 15.3 0 0 0 0 18" />
    </BaseIcon>
  );
}

function IconGridSmall() {
  return (
    <BaseIcon viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </BaseIcon>
  );
}

function IconList() {
  return (
    <BaseIcon viewBox="0 0 24 24">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </BaseIcon>
  );
}

function IconPlus() {
  return (
    <BaseIcon>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  );
}
