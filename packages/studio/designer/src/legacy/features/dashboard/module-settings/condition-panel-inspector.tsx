import React from 'react';
import {
  shadcnInfoCardClass,
  shadcnMutedLabelClass,
  shadcnPanelBadgeClass,
  shadcnPanelHeaderClass,
  shadcnPanelIconShellClass,
  shadcnPanelShellClass,
  shadcnPanelTitleClass,
  shadcnSectionCardClass,
  shadcnSectionTitleClass,
  shadcnTextareaClass,
} from '../../../components/ui/shadcn-inspector';

export type ConditionPanelConfig = {
  rows: number;
  bulkDraft: string;
};

export type ConditionPanelInspectorContext = {
  appendDraft: () => void;
  config: ConditionPanelConfig;
  fields: any[];
  icon: string;
  iconClass: string;
  replaceDraft: () => void;
  scope: 'filter-panel' | 'left-filter-panel';
  setConfig: React.Dispatch<React.SetStateAction<ConditionPanelConfig>>;
  title: string;
};

type ConditionPanelInspectorProps = {
  context: ConditionPanelInspectorContext;
  metrics: {
    controlWidth: number;
    maxRows: number;
    minRows: number;
  };
  normalizeField: (field: any) => any;
  onSelectField: (scope: 'left' | 'main', fieldId: string) => void;
  workspaceThemeVars: React.CSSProperties;
};

export const ConditionPanelInspector = React.memo(function ConditionPanelInspector({
  context,
  metrics,
  normalizeField,
  onSelectField,
  workspaceThemeVars,
}: ConditionPanelInspectorProps) {
  const panelShellClass = shadcnPanelShellClass;
  const panelHeaderClass = shadcnPanelHeaderClass;
  const panelTitleClass = shadcnPanelTitleClass;
  const panelBadgeClass = shadcnPanelBadgeClass;
  const panelIconShellClass = `${shadcnPanelIconShellClass} size-10 rounded-lg`;
  const compactInfoCardClass = shadcnInfoCardClass;
  const compactCardClass = shadcnSectionCardClass;
  const sectionTitleClass = shadcnSectionTitleClass;
  const mutedLabelClass = shadcnMutedLabelClass;
  const textareaClass = shadcnTextareaClass;
  const isLeftPanel = context.scope === 'left-filter-panel';

  return (
    <div style={workspaceThemeVars} className={panelShellClass}>
      <div className={panelHeaderClass}>
        <div className="flex items-start gap-3">
          <div className={`${panelIconShellClass} ${context.iconClass}`}>
            <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={panelTitleClass}>{context.title}</h3>
              <span className={panelBadgeClass}>总览配置</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={compactInfoCardClass}>
            <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">当前作用域</div>
            <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">
              {isLeftPanel ? '左条件' : '主条件'}
            </div>
          </div>
          <div className={compactInfoCardClass}>
            <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">条件数量</div>
            <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">
              {context.fields.length} 项
            </div>
          </div>
          <div className={compactInfoCardClass}>
            <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">默认宽度</div>
            <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">
              {metrics.controlWidth}px
            </div>
          </div>
        </div>

        <section className={compactCardClass}>
          <div className={sectionTitleClass}>
            <span className="material-symbols-outlined text-[18px] text-primary">dashboard_customize</span>
            <h4>布局总览</h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={mutedLabelClass}>控件行数</label>
              <input
                type="number"
                min={metrics.minRows}
                max={metrics.maxRows}
                value={context.config.rows}
                onChange={(event) => context.setConfig((prev) => ({
                  ...prev,
                  rows: Number(event.target.value) || metrics.minRows,
                }))}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white/96 px-3 text-[12px] text-slate-700 outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900/88 dark:text-slate-200"
              />
            </div>
            <div className={compactInfoCardClass}>
              <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">排布方式</div>
              <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">
                按行拖放
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                直接把条件拖到目标行，无需再配分栏数。
              </div>
            </div>
          </div>
        </section>

        <section className={compactCardClass}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[18px] text-primary">content_paste</span>
              <h4>批量构建条件</h4>
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={context.appendDraft}
                className="inline-flex h-8 items-center gap-1 rounded-[12px] bg-[color:var(--workspace-accent)] px-3 text-[11px] font-bold text-white"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                追加
              </button>
              <button
                type="button"
                onClick={context.replaceDraft}
                className="inline-flex h-8 items-center gap-1 rounded-[12px] border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                重建
              </button>
            </div>
          </div>
          <div>
            <label className={mutedLabelClass}>粘贴 Excel / 列名</label>
            <textarea
              rows={6}
              value={context.config.bulkDraft}
              onChange={(event) => context.setConfig((prev) => ({
                ...prev,
                bulkDraft: event.target.value,
              }))}
              placeholder="每行一个条件名，或直接粘贴 Excel 单列内容。"
              className={`${textareaClass} min-h-[148px]`}
            />
          </div>
        </section>

        <section className={compactCardClass}>
          <div className={sectionTitleClass}>
            <span className="material-symbols-outlined text-[18px] text-primary">view_week</span>
            <h4>当前条件总览</h4>
          </div>
          {context.fields.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {context.fields.map((field) => {
                const normalizedField = normalizeField(field);

                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => onSelectField(isLeftPanel ? 'left' : 'main', field.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-[color:var(--workspace-accent-border)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-[13px] text-[color:var(--workspace-accent)]">
                      {normalizedField.type === '日期框' ? 'calendar_month' : 'tune'}
                    </span>
                    {normalizedField.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200/80 bg-slate-50/75 px-4 py-6 text-[12px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
              当前还没有条件，先输入名称后再批量构建。
            </div>
          )}
        </section>
      </div>
    </div>
  );
});
