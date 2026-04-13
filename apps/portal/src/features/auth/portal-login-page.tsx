import { navigate } from '../../router';
import { EmployeeSelector } from './components/employee-selector';
import { OrganizationSelector } from './components/organization-selector';
import { PasswordInput } from './components/password-input';
import { RememberCredentials } from './components/remember-credentials';
import { useLoginFormController } from './hooks/use-login-form-controller';

type PortalLoginPageProps = {
  targetLabel?: string;
};

export function PortalLoginPage({ targetLabel }: PortalLoginPageProps) {
  const controller = useLoginFormController({
    onSuccess: () => {
      navigate('/systems');
    },
  });

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    await controller.actions.submit();
  };

  return (
    <div className="main-gradient relative min-h-screen overflow-x-hidden text-slate-900">
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

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-4">
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
            <div className="flex flex-col text-left">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                朗速设计平台
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                DESIGN PLATFORM
              </span>
            </div>
          </div>
          <h1 className="text-4xl font-light text-slate-900 md:text-5xl">
            构建<span className="font-bold">下一代</span>企业级设计与协同能力
          </h1>
        </div>

        <div className="flex w-full max-w-6xl flex-col items-center gap-16 lg:flex-row">
          <div className="hidden flex-1 flex-col space-y-12 lg:flex">
            <div className="space-y-10">
              <div className="group flex items-start gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/50 font-bold text-primary shadow-sm">
                  01
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">需求洞察</h3>
                  <p className="max-w-md text-sm leading-relaxed text-slate-500">
                    梳理业务诉求、映射流程链路，在开发开始前明确系统边界与交付目标。
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/50 font-bold text-primary shadow-sm">
                  02
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">模块架构</h3>
                  <p className="max-w-md text-sm leading-relaxed text-slate-500">
                    可视化设计模块结构，对齐数据关系，把复杂流程快速沉淀成可实施方案。
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/50 font-bold text-primary shadow-sm">
                  03
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">平台协同</h3>
                  <p className="max-w-md text-sm leading-relaxed text-slate-500">
                    登录后统一进入平台能力入口，按权限选择设计平台、ERP 和项目管理系统。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card w-full max-w-md rounded-3xl p-8 md:p-10">
            <div className="mb-10">
              <h2 className="mb-2 text-2xl font-bold text-slate-900">欢迎回来</h2>
              <p className="text-sm text-slate-500">
                {targetLabel
                  ? `请输入您的凭据以继续访问 ${targetLabel}。`
                  : '请输入您的凭据以访问朗速协同工作平台。'}
              </p>
            </div>

            {controller.errorMessage ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                {controller.errorMessage}
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <OrganizationSelector
                disabled={controller.isLoadingOrganizations || controller.isSubmitting}
                helperText={controller.organizationHelperText}
                isLoading={controller.isLoadingOrganizations}
                onChange={controller.actions.setOrganizationKey}
                organizations={controller.organizations}
                selectedKey={controller.form.organizationKey}
              />

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
                onChange={controller.actions.toggleRememberCredentials}
              />

              <div className="pt-2">
                <button
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-erp-blue disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                  disabled={
                    controller.isSubmitting ||
                    controller.isLoadingEmployees ||
                    controller.isLoadingOrganizations
                  }
                  type="submit"
                >
                  <span className="text-sm uppercase tracking-widest">
                    {controller.isSubmitting ? '登录中...' : '立即登录'}
                  </span>
                  <span className="material-symbols-outlined text-lg">login</span>
                </button>
              </div>
            </form>

            <div className="mt-10 border-t border-slate-200/50 pt-6">
              <p className="text-center text-[10px] leading-relaxed text-slate-400">
                本系统仅限授权人员使用，未经许可的访问尝试将被记录并接受审计。
                <br />
                © 2024 朗速科技. 保留所有权利。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
