import type { DesignRouteContext } from '../../../app/contracts/platform-routing';
import type { DesignWorkspaceUrlState } from './design-workspace-state';

type DesignWorkspaceRoutePresenterProps = {
  context: DesignRouteContext;
  urlState?: DesignWorkspaceUrlState;
};

function buildContextLabel(label: string, value?: string) {
  const normalizedValue = value?.trim();

  return {
    label,
    value: normalizedValue || '未指定',
  };
}

export function DesignWorkspaceRoutePresenter({
  context,
  urlState,
}: DesignWorkspaceRoutePresenterProps) {
  const workbenchLabel = urlState?.workbench === 'research-record'
    ? '调研记录'
    : urlState?.workbench === 'function-flow-design'
      ? '功能流程设计'
    : urlState?.workbench === 'tool-feedback'
      ? '意见上报'
      : '模块设计';
  const routeContextItems = [
    buildContextLabel('子系统', context.subsystemCode),
    buildContextLabel('一级菜单', context.menuCode),
    buildContextLabel('模块', context.moduleCode || urlState?.moduleCode),
    buildContextLabel('工作台', workbenchLabel),
    buildContextLabel('配置向导', urlState?.configOpen ? `已打开 · Step ${urlState.configStep}` : '未打开'),
    buildContextLabel('主题', urlState?.theme),
  ];

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/88 p-5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">迁移壳上下文</div>
          <h3 className="mt-3 text-lg font-black tracking-tight text-slate-950">Workspace 路由承接层</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            先在 Design 平台里接住旧 Dashboard 的入口参数，把 URL、入口状态和遗留工作台隔开，后续拆模块时不再直接从 App 命中巨石组件。
          </p>
        </div>
        <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">
          Legacy Workspace Bridge
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {routeContextItems.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
            <div className="mt-2 break-all text-sm font-semibold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
