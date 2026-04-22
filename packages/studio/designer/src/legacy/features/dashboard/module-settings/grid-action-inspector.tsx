import React from 'react';

import {
  shadcnInspectorSectionClass,
  shadcnInspectorSectionHeaderClass,
  shadcnInspectorSectionTitleClass,
  shadcnPanelBodyClass,
  shadcnPanelHeaderClass,
  shadcnPanelHeaderMainClass,
  shadcnPanelIconShellClass,
  shadcnPanelShellClass,
  shadcnPanelTitleClass,
} from '../../../components/ui/shadcn-inspector';

type GridActionInspectorProps = {
  context: {
    actionEnabled: boolean;
    actionKey: string;
    actionLabel: string;
    description: string;
    fieldKey?: string | null;
    icon: string;
    iconClass: string;
    locked?: boolean;
    scope?: string;
    setCols: React.Dispatch<React.SetStateAction<any>>;
    title: string;
  };
};

export function GridActionInspector({ context }: GridActionInspectorProps) {
  const inspectorTitle = context.scope === 'detail-grid-action'
    ? `明细按钮设置 · ${context.actionLabel}`
    : `主表按钮设置 · ${context.actionLabel}`;
  const updateActionEnabled = (enabled: boolean) => {
    if (context.locked || !context.fieldKey) {
      return;
    }

    context.setCols((prev: Record<string, any>) => ({
      ...(prev ?? {}),
      [context.fieldKey as string]: enabled ? 1 : 0,
    }));
  };

  return (
    <div className={shadcnPanelShellClass}>
      <div className={shadcnPanelHeaderClass}>
        <div className={shadcnPanelHeaderMainClass}>
          <div className={`${shadcnPanelIconShellClass} size-10 rounded-lg ${context.iconClass}`}>
            <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={shadcnPanelTitleClass}>{inspectorTitle}</h3>
          </div>
        </div>
      </div>

      <div className={shadcnPanelBodyClass}>
        <section className={shadcnInspectorSectionClass}>
          <div className={shadcnInspectorSectionHeaderClass}>
            <div className={shadcnInspectorSectionTitleClass}>
            <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">smart_button</span>
            <div className="min-w-0">
              <h4>{context.actionLabel}</h4>
            </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                context.actionEnabled
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {context.actionEnabled ? '已启用' : '已关闭'}
            </span>
            {context.locked ? (
              <span>保存按钮固定启用，不支持关闭。</span>
            ) : null}
          </div>
        </section>

        {!context.locked ? (
          <section className={shadcnInspectorSectionClass}>
            <div className={shadcnInspectorSectionHeaderClass}>
              <div className={shadcnInspectorSectionTitleClass}>
              <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">toggle_on</span>
              <div className="min-w-0">
                <h4>是否启用</h4>
              </div>
              </div>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => updateActionEnabled(true)}
                className={`flex min-h-10 items-center justify-between rounded-[14px] border px-3.5 py-2.5 text-left transition-all ${
                  context.actionEnabled
                    ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-tint)] text-[color:var(--workspace-accent-strong)]'
                    : 'border-slate-200/80 bg-white text-slate-600 hover:border-[color:var(--workspace-accent-border)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-950/65 dark:text-slate-200'
                }`}
              >
                <span className="text-[13px] font-semibold">启用</span>
                <span className="material-symbols-outlined text-[18px]">
                  {context.actionEnabled ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => updateActionEnabled(false)}
                className={`flex min-h-10 items-center justify-between rounded-[14px] border px-3.5 py-2.5 text-left transition-all ${
                  !context.actionEnabled
                    ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-tint)] text-[color:var(--workspace-accent-strong)]'
                    : 'border-slate-200/80 bg-white text-slate-600 hover:border-[color:var(--workspace-accent-border)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-950/65 dark:text-slate-200'
                }`}
              >
                <span className="text-[13px] font-semibold">关闭</span>
                <span className="material-symbols-outlined text-[18px]">
                  {!context.actionEnabled ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
