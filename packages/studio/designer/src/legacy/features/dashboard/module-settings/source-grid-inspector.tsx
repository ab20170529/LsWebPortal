import React from 'react';
import {
  shadcnFieldClass,
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

type BillSourceEntry = {
  id: string;
  configType: string;
  sourceName: string;
  sourceSql: string;
  sourceDetail: string;
  sourceType: string;
};

type SourceGridInspectorContext = {
  icon: string;
  iconClass: string;
  title: string;
};

type SourceGridInspectorProps = {
  activeBillSourceId: string;
  billSourceDraftMode: 'create' | 'edit';
  billSources: BillSourceEntry[];
  configTypeOptions: string[];
  context: SourceGridInspectorContext;
  currentSourceConfig: BillSourceEntry;
  onCreateDraft: () => void;
  onSaveDraft: () => void;
  onSelectDraft: (source: BillSourceEntry) => void;
  onUpdateDraft: (patch: Partial<BillSourceEntry>) => void;
  sourceTypeOptions: string[];
  workspaceThemeVars: React.CSSProperties;
};

function parseBillSourceDetailFields(sourceDetail?: string) {
  if (!sourceDetail) return [];

  return sourceDetail
    .split(/[\n,，;；|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const SourceGridInspector = React.memo(function SourceGridInspector({
  activeBillSourceId,
  billSourceDraftMode,
  billSources,
  configTypeOptions,
  context,
  currentSourceConfig,
  onCreateDraft,
  onSaveDraft,
  onSelectDraft,
  onUpdateDraft,
  sourceTypeOptions,
  workspaceThemeVars,
}: SourceGridInspectorProps) {
  const panelShellClass = shadcnPanelShellClass;
  const panelHeaderClass = shadcnPanelHeaderClass;
  const panelTitleClass = shadcnPanelTitleClass;
  const panelBadgeClass = shadcnPanelBadgeClass;
  const panelIconShellClass = `${shadcnPanelIconShellClass} size-10 rounded-lg`;
  const compactCardClass = shadcnSectionCardClass;
  const filledCompactCardClass = `${compactCardClass} w-full max-w-none self-stretch`;
  const sectionTitleClass = shadcnSectionTitleClass;
  const mutedLabelClass = shadcnMutedLabelClass;
  const fieldClass = shadcnFieldClass;
  const textareaClass = shadcnTextareaClass;
  const currentSourceFields = parseBillSourceDetailFields(currentSourceConfig.sourceDetail);

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
              <span className={panelBadgeClass}>{billSources.length} 个来源</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-0 py-0">
        <div className="w-full space-y-4">
          <section className={filledCompactCardClass}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">database</span>
                <h4>来源列表</h4>
              </div>
              <button
                type="button"
                onClick={onCreateDraft}
                className="inline-flex h-8 items-center gap-1 rounded-[12px] bg-[color:var(--workspace-accent)] px-3 text-[11px] font-bold text-white"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                新增来源
              </button>
            </div>
            <div className="space-y-2">
              {billSources.map((source) => {
                const isActive = source.id === activeBillSourceId && billSourceDraftMode === 'edit';
                const fieldCount = parseBillSourceDetailFields(source.sourceDetail).length;

                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => onSelectDraft(source)}
                    className={`w-full rounded-[18px] border px-3.5 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-soft)]'
                        : 'border-slate-200/80 bg-white/88 hover:border-[color:var(--workspace-accent-border)] dark:border-slate-700 dark:bg-slate-900/56'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
                          {source.sourceName || '未命名来源'}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {source.configType} · {source.sourceType} · {fieldCount} 项明细
                        </div>
                      </div>
                      {isActive ? (
                        <span className="inline-flex rounded-full bg-[color:var(--workspace-accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--workspace-accent)]">
                          编辑中
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={filledCompactCardClass}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">edit_square</span>
                <h4>{billSourceDraftMode === 'create' ? '新增来源' : '编辑来源'}</h4>
              </div>
              <button
                type="button"
                onClick={onSaveDraft}
                className="inline-flex h-8 items-center gap-1 rounded-[12px] bg-[color:var(--workspace-accent)] px-3 text-[11px] font-bold text-white"
              >
                <span className="material-symbols-outlined text-[14px]">save</span>
                保存来源
              </button>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={mutedLabelClass}>配置类型</label>
                  <select
                    value={currentSourceConfig.configType}
                    onChange={(event) => onUpdateDraft({ configType: event.target.value })}
                    className={fieldClass}
                  >
                    {configTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={mutedLabelClass}>类型</label>
                  <select
                    value={currentSourceConfig.sourceType}
                    onChange={(event) => onUpdateDraft({ sourceType: event.target.value })}
                    className={fieldClass}
                  >
                    {sourceTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={mutedLabelClass}>来源名称</label>
                <input
                  type="text"
                  value={currentSourceConfig.sourceName}
                  onChange={(event) => onUpdateDraft({ sourceName: event.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={mutedLabelClass}>来源 SQL</label>
                <textarea
                  rows={4}
                  value={currentSourceConfig.sourceSql}
                  onChange={(event) => onUpdateDraft({ sourceSql: event.target.value })}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={mutedLabelClass}>来源明细</label>
                <textarea
                  rows={5}
                  value={currentSourceConfig.sourceDetail}
                  onChange={(event) => onUpdateDraft({ sourceDetail: event.target.value })}
                  placeholder="一行一个字段，或用逗号分隔"
                  className={textareaClass}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentSourceFields.length > 0 ? currentSourceFields.map((fieldName) => (
                    <span
                      key={fieldName}
                      className="inline-flex h-8 items-center rounded-full border border-slate-200/80 bg-white/92 px-3 text-[11px] font-bold text-slate-700 shadow-[0_10px_18px_-16px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-slate-900/72 dark:text-slate-100"
                    >
                      {fieldName}
                    </span>
                  )) : (
                    <span className="text-[11px] text-slate-400">保存后这里会自动成为字段绑定可选项</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});
