import React from 'react';
import {
  shadcnPanelBadgeClass,
  shadcnPanelHeaderClass,
  shadcnPanelIconShellClass,
  shadcnPanelShellClass,
  shadcnPanelTitleClass,
} from '../../../components/ui/shadcn-inspector';

type EmptyInspectorPanelProps = {
  workspaceThemeVars: React.CSSProperties;
};

type WorkspaceThemeInspectorProps = {
  context: {
    icon: string;
    iconClass: string;
    title: string;
  };
  resolveThemeClasses: (theme: string) => {
    groupLabel: string;
    groupShell: string;
  };
  themeOptions: ReadonlyArray<{
    label: string;
    value: string;
  }>;
  workspaceTheme: string;
  workspaceThemeVars: React.CSSProperties;
  onSelectTheme: (theme: string) => void;
};

export function EmptyInspectorPanel({ workspaceThemeVars }: EmptyInspectorPanelProps) {
  return (
    <div style={workspaceThemeVars} className={shadcnPanelShellClass}>
      <div className={shadcnPanelHeaderClass}>
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-md border border-slate-200/80 bg-slate-50 text-[#1686e3] dark:border-slate-800 dark:bg-slate-900 dark:text-[#7cc0ff]">
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={shadcnPanelBadgeClass}>右侧检查器</span>
            </div>
            <h3 className="mt-1.5 text-[15px] font-semibold tracking-[0.01em] text-slate-800 dark:text-slate-100">详细配置</h3>
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 py-3">
        <div className="w-full rounded-md border border-dashed border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 rounded-md border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#eef6ff] text-[#1686e3] dark:bg-[#1686e3]/14 dark:text-[#7cc0ff]">
              <span className="material-symbols-outlined text-[20px]">touch_app</span>
            </div>
            <div className="min-w-0 text-[12px] font-medium text-slate-600 dark:text-slate-200">选中对象后在这里编辑。</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceThemeInspector({
  context,
  resolveThemeClasses,
  themeOptions,
  workspaceTheme,
  workspaceThemeVars,
  onSelectTheme,
}: WorkspaceThemeInspectorProps) {
  const panelIconShellClass = `${shadcnPanelIconShellClass} size-10 rounded-lg`;
  const themeClasses = resolveThemeClasses(workspaceTheme);

  return (
    <div style={workspaceThemeVars} className={shadcnPanelShellClass}>
      <div className={shadcnPanelHeaderClass}>
        <div className="flex items-start gap-3">
          <div className={`${panelIconShellClass} ${context.iconClass}`}>
            <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={shadcnPanelTitleClass}>{context.title}</h3>
              <span className={shadcnPanelBadgeClass}>独立主题设置</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <section className={`rounded-[18px] border p-4 shadow-[0_18px_30px_-26px_rgba(15,23,42,0.18)] ${themeClasses.groupShell}`}>
          <div className="mb-3 flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-100">
            <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">palette</span>
            选择主题
          </div>
          <div className="grid gap-2.5">
            {themeOptions.map((theme) => {
              const isActiveTheme = workspaceTheme === theme.value;

              return (
                <button
                  key={`workspace-theme-panel-${theme.value}`}
                  type="button"
                  onClick={() => onSelectTheme(theme.value)}
                  className={`flex w-full items-start gap-3 rounded-[16px] border px-3.5 py-3 text-left transition-all ${
                    isActiveTheme
                      ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-tint)] shadow-[0_16px_30px_-24px_var(--workspace-accent-shadow)]'
                      : 'border-slate-200/80 bg-white/90 hover:border-[color:var(--workspace-accent-border)] hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900/78'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[14px] ${
                      theme.value === 'sunset'
                        ? 'bg-[linear-gradient(135deg,rgba(251,146,60,0.18),rgba(244,114,182,0.16))] text-orange-500'
                        : theme.value === 'jade'
                          ? 'bg-[linear-gradient(135deg,rgba(52,211,153,0.18),rgba(16,185,129,0.16))] text-emerald-500'
                          : 'bg-[linear-gradient(135deg,rgba(96,165,250,0.18),rgba(34,211,238,0.16))] text-sky-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">palette</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[13px] font-bold ${isActiveTheme ? 'text-[color:var(--workspace-accent-strong)]' : 'text-slate-700 dark:text-slate-100'}`}>
                        {theme.label}
                      </span>
                      {isActiveTheme ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${themeClasses.groupLabel}`}>
                          已启用
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-[18px] ${isActiveTheme ? 'text-[color:var(--workspace-accent)]' : 'text-slate-300 dark:text-slate-600'}`}>
                    {isActiveTheme ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
