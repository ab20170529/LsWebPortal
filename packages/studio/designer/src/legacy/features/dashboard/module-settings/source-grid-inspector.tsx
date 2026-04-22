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
import { type BillSourceEntry } from './use-bill-source-state';

type SourceGridInspectorContext = {
  icon: string;
  iconClass: string;
  title: string;
};

type SourceGridInspectorProps = {
  activeBillSourceId: string;
  billSources: BillSourceEntry[];
  context: SourceGridInspectorContext;
  onDeleteActiveSource: () => void;
  onSelectDraft: (source: BillSourceEntry) => void;
  onToggleDisabled: (sourceId: string, nextDisabled: boolean) => void;
  workspaceThemeVars: React.CSSProperties;
};

export const SourceGridInspector = React.memo(function SourceGridInspector({
  activeBillSourceId,
  billSources,
  context,
  onDeleteActiveSource,
  onSelectDraft,
  onToggleDisabled,
  workspaceThemeVars,
}: SourceGridInspectorProps) {
  const panelIconShellClass = `${shadcnPanelIconShellClass} size-10 rounded-lg`;

  return (
    <div style={workspaceThemeVars} className={shadcnPanelShellClass}>
      <div className={shadcnPanelHeaderClass}>
        <div className="flex items-center justify-between gap-3">
          <div className={shadcnPanelHeaderMainClass}>
            <div className={`${panelIconShellClass} ${context.iconClass}`}>
              <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={shadcnPanelTitleClass}>{context.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeleteActiveSource}
            disabled={!activeBillSourceId}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-200/70 bg-white text-rose-400 shadow-sm transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-500/20 dark:bg-slate-900 dark:text-rose-300"
            title="删除来源"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>

      <div className={shadcnPanelBodyClass}>
        <div className="flex min-h-0 flex-1 w-full flex-col">
          <section className={`${shadcnInspectorSectionClass} flex min-h-0 flex-1 flex-col`}>
            <div className={shadcnInspectorSectionHeaderClass}>
              <div className={shadcnInspectorSectionTitleClass}>
                <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">database</span>
                <h4>来源列表</h4>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {billSources.map((source) => {
                const isActive = source.id === activeBillSourceId;

                return (
                  <div
                    key={source.id}
                    onClick={() => onSelectDraft(source)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectDraft(source);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`w-full rounded-[18px] border px-3.5 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-soft)]'
                        : 'border-slate-200/80 bg-white/88 hover:border-[color:var(--workspace-accent-border)] dark:border-slate-700 dark:bg-slate-900/56'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
                            {source.sourceName || '未命名来源'}
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleDisabled(source.id, !source.disabled);
                            }}
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                              source.disabled
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20'
                            }`}
                          >
                            {source.disabled ? '已禁用' : '已启用'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});
