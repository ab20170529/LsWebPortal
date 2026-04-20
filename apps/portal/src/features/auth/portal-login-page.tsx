import { navigate } from '../../router';
import { EmployeeSelector } from './components/employee-selector';
import { PasswordInput } from './components/password-input';
import { RememberCredentials } from './components/remember-credentials';
import { useLoginFormController } from './hooks/use-login-form-controller';

type PortalLoginPageProps = {
  targetLabel?: string;
};

const LOGIN_HIGHLIGHTS = [
  {
    description: '梳理业务诉求、映射流程链路，在开发开始前明确系统边界与交付目标。',
    id: '01',
    title: '需求洞察',
  },
  {
    description: '可视化设计模块结构，对齐数据关系，把复杂流程快速沉淀成可实施方案。',
    id: '02',
    title: '模块架构',
  },
  {
    description: '快速生成可落地的应用骨架与页面结构，大幅减少重复实现与交付成本。',
    id: '03',
    title: 'AI 生成',
  },
] as const;

function normalizeRequestedTarget(target: string) {
  return target.replace(/^\/design\b/, '/designer');
}

function isSystemTarget(target: string) {
  const normalizedTarget = normalizeRequestedTarget(target);
  return (
    normalizedTarget === '/systems'
    || normalizedTarget === '/designer'
    || normalizedTarget.startsWith('/designer/')
    || normalizedTarget === '/erp'
    || normalizedTarget.startsWith('/erp/')
    || normalizedTarget === '/project'
    || normalizedTarget.startsWith('/project/')
    || normalizedTarget === '/bi'
    || normalizedTarget.startsWith('/bi/')
  );
}

function getRequestedTarget() {
  if (typeof window === 'undefined') {
    return null;
  }

  const { hash, pathname, search } = window.location;
  const searchParams = new URLSearchParams(search);
  const redirectTarget = searchParams.get('redirect');
  if (redirectTarget?.startsWith('/')) {
    return normalizeRequestedTarget(redirectTarget);
  }

  if (pathname !== '/') {
    return normalizeRequestedTarget(`${pathname}${search}${hash}`);
  }

  return null;
}

function resolvePostLoginTarget() {
  const requestedTarget = getRequestedTarget();
  if (!requestedTarget) {
    return '/systems';
  }

  if (isSystemTarget(requestedTarget)) {
    return `/systems?redirect=${encodeURIComponent(requestedTarget)}`;
  }

  return requestedTarget;
}

function buildLoginPrompt(_targetLabel?: string) {
  return '请输入您的凭据以访问朗速协同工作平台。';
}

function LoginArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 7L15 12L10 17M14.5 12H4.75M19.25 4.75V19.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PortalLoginPage({ targetLabel }: PortalLoginPageProps) {
  const controller = useLoginFormController({
    onSuccess: () => {
      navigate(resolvePostLoginTarget());
    },
  });

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    await controller.actions.submit();
  };

  return (
    <div className="font-display main-gradient portal-login-scene relative min-h-screen overflow-x-hidden text-slate-900">
      <div className="pointer-events-none fixed inset-0 mesh-bg" />
      <div className="blob -left-24 -top-48 h-[600px] w-[600px] bg-sky-200" />
      <div
        className="blob bottom-0 -right-24 h-[500px] w-[500px] bg-cyan-100"
        style={{ animationDelay: '-5s' }}
      />
      <div
        className="blob left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 bg-blue-100"
        style={{ animationDelay: '-10s' }}
      />

      <div className="portal-login-shell">
        <div className="portal-login-hero">
          <div className="portal-login-brand">
            <div className="portal-login-brand__mark">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z"
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="portal-login-brand__text">
              <span className="portal-login-brand__name">LANGSU AI</span>
              <span className="portal-login-brand__subtitle">AI 开发平台</span>
            </div>
          </div>

          <h1 className="portal-login-heading">
            构建
            <span className="portal-login-heading__emphasis">下一代</span>
            企业级智能应用
          </h1>
        </div>

        <div className="portal-login-stage">
          <div className="portal-login-highlights" aria-hidden="true">
            <div className="portal-login-highlights__stack">
              {LOGIN_HIGHLIGHTS.map((item) => (
                <div key={item.id} className="portal-login-highlight">
                  <div className="portal-login-highlight__badge">{item.id}</div>
                  <div className="portal-login-highlight__body">
                    <h3 className="portal-login-highlight__title">{item.title}</h3>
                    <p className="portal-login-highlight__description">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card portal-login-card">
            <div className="portal-login-card__intro">
              <h2 className="portal-login-card__title">欢迎回来</h2>
              <p className="portal-login-card__description">{buildLoginPrompt(targetLabel)}</p>
            </div>

            {controller.errorMessage ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                {controller.errorMessage}
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <EmployeeSelector
                disabled={controller.isLoadingEmployees || controller.isSubmitting}
                employees={controller.employees}
                helperText={controller.employeeHelperText}
                isLoading={controller.isLoadingEmployees}
                keyword={controller.form.employeeKeyword}
                onKeywordChange={controller.actions.setEmployeeKeyword}
                onSelect={controller.actions.selectEmployee}
                selectedId={controller.form.employeeId}
              />

              <PasswordInput
                disabled={controller.isSubmitting}
                onChange={controller.actions.setPassword}
                onToggleShow={controller.actions.toggleShowPassword}
                showPassword={controller.form.showPassword}
                value={controller.form.password}
              />

              <RememberCredentials
                checked={controller.form.rememberCredentials}
                disabled={controller.isSubmitting}
                helperText="退出后下次自动带入"
                onChange={controller.actions.toggleRememberCredentials}
              />

              <div className="portal-login-submit__wrap">
                <button
                  className="portal-login-submit"
                  disabled={controller.isSubmitting || controller.isLoadingEmployees}
                  type="submit"
                >
                  <span className="portal-login-submit__label">
                    {controller.isSubmitting ? '登录中...' : '立即登录'}
                  </span>
                  <LoginArrowIcon />
                </button>
              </div>
            </form>

            <div className="portal-login-card__legal">
              <p className="portal-login-card__legal-text">
                本系统仅限授权人员使用，未经许可的访问尝试将被记录并接受审计。
                <br />
                © 2024 朗速科技. 保留所有权利。
              </p>
            </div>
          </div>
        </div>

        <div className="portal-login-footer">
          <a className="portal-login-footer__link" href="#">
            技术支持
          </a>
          <a className="portal-login-footer__link" href="#">
            安全条例
          </a>
          <a className="portal-login-footer__link" href="#">
            用户协议
          </a>
        </div>
      </div>
    </div>
  );
}
