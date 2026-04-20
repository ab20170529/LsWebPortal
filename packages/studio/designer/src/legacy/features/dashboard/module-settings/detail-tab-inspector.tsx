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
import { DetailTabRelationSection } from './grid-overview-sections';

type DetailFillTypeOption = {
  label: string;
  value: string;
};

type DetailTabInspectorContext = {
  icon: string;
  iconClass: string;
  title: string;
};

type DetailTabInspectorProps = {
  context: DetailTabInspectorContext;
  currentModuleCode: string;
  currentTabConfig: Record<string, any>;
  currentTabId: string;
  currentTabName: string;
  detailFillTypeOptions: DetailFillTypeOption[];
  inspectorTabsNode: React.ReactNode;
  isCommonPanelTab: boolean;
  normalizedDetailType: string;
  onDeleteTab: () => void;
  relationSectionProps?: Record<string, any> | null;
  onUpdateTabConfig: (patch: Record<string, any>) => void;
  onUpdateTabType: (nextType: string) => void;
};

const DETAIL_TAB_SWITCHES = [
  ['autoRefresh', '自动刷新'],
  ['disabled', '禁用'],
  ['rightDisplay', '右边显示'],
  ['addDisplay', '添加显示'],
  ['defaultOpen', '默认打开'],
  ['scanMode', '扫码模式'],
  ['cardMode', '卡片'],
] as const;

export const DetailTabInspector = React.memo(function DetailTabInspector({
  context,
  currentModuleCode,
  currentTabConfig,
  currentTabId,
  currentTabName,
  detailFillTypeOptions,
  inspectorTabsNode,
  isCommonPanelTab,
  normalizedDetailType,
  onDeleteTab,
  relationSectionProps,
  onUpdateTabConfig,
  onUpdateTabType,
}: DetailTabInspectorProps) {
  const panelShellClass = shadcnPanelShellClass;
  const panelHeaderClass = shadcnPanelHeaderClass;
  const panelTitleClass = shadcnPanelTitleClass;
  const panelBadgeClass = shadcnPanelBadgeClass;
  const panelIconShellClass = `${shadcnPanelIconShellClass} size-10 rounded-lg`;
  const compactCardClass = shadcnSectionCardClass;
  const sectionTitleClass = shadcnSectionTitleClass;
  const mutedLabelClass = shadcnMutedLabelClass;
  const fieldClass = shadcnFieldClass;
  const textareaClass = shadcnTextareaClass;

  return (
    <div className={panelShellClass}>
      <div className={panelHeaderClass}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`${panelIconShellClass} ${context.iconClass}`}>
                <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={panelTitleClass}>{context.title}</h3>
                  <span className={panelBadgeClass}>明细页签</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onDeleteTab}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-rose-200/80 bg-rose-50/85 px-3 text-[11px] font-semibold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100/80 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
            >
              <span className="material-symbols-outlined text-[15px]">delete</span>
              删除明细
            </button>
          </div>
          <div className="min-w-0">
            {inspectorTabsNode}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {isCommonPanelTab ? (
          <>
            <section className={compactCardClass}>
              <div className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[15px] text-slate-400">table_rows</span>
                <span>明细列表</span>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                  <div>
                    <label className={mutedLabelClass}>所属模块编号</label>
                    <input
                      value={currentTabConfig.tab ?? currentModuleCode}
                      onChange={(event) => onUpdateTabConfig({ tab: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={mutedLabelClass}>tabKey</label>
                    <input
                      value={currentTabConfig.tabKey ?? currentTabId}
                      onChange={(event) => onUpdateTabConfig({ tabKey: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className={mutedLabelClass}>列表名称</label>
                    <input
                      value={currentTabConfig.detailName ?? currentTabName}
                      onChange={(event) => onUpdateTabConfig({ detailName: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={mutedLabelClass}>类型</label>
                    <select
                      value={normalizedDetailType}
                      onChange={(event) => onUpdateTabType(event.target.value)}
                      className={fieldClass}
                    >
                      {detailFillTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-full">
                    <label className={mutedLabelClass}>DLL 模板</label>
                    <input
                      value={currentTabConfig.dllTemplate ?? ''}
                      onChange={(event) => onUpdateTabConfig({ dllTemplate: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 rounded-[12px] border border-slate-200/80 bg-slate-50/78 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/54 dark:text-slate-300">
                  <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-100">
                    当前明细：{currentTabName}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200/80 px-2 py-0.5 font-semibold dark:border-slate-700">
                    tabKey：{currentTabConfig.tabKey ?? currentTabId}
                  </span>
                </div>
              </div>
            </section>

            {relationSectionProps ? (
              <DetailTabRelationSection {...relationSectionProps} />
            ) : null}

            <section className={compactCardClass}>
              <div className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[15px] text-slate-400">toggle_on</span>
                <span>开关与权限</span>
              </div>
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(132px,1fr))]">
                {DETAIL_TAB_SWITCHES.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-2 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(currentTabConfig[key])}
                      onChange={(event) => onUpdateTabConfig({ [key]: event.target.checked })}
                      className="h-4 w-4 rounded accent-[#1686e3]"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                <div>
                  <label className={mutedLabelClass}>权限</label>
                  <input
                    value={currentTabConfig.privilegeOper ?? ''}
                    onChange={(event) => onUpdateTabConfig({ privilegeOper: event.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="col-span-full">
                  <label className={mutedLabelClass}>禁用条件</label>
                  <textarea
                    rows={4}
                    value={currentTabConfig.disabledCondition ?? ''}
                    onChange={(event) => onUpdateTabConfig({ disabledCondition: event.target.value })}
                    className={textareaClass}
                  />
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className={compactCardClass}>
              <div className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[15px] text-slate-400">view_agenda</span>
                <span>扩展配置</span>
              </div>
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                <div>
                  <label className={mutedLabelClass}>显示行数</label>
                  <input
                    type="number"
                    min={1}
                    value={currentTabConfig.displayRows ?? 12}
                    onChange={(event) => onUpdateTabConfig({ displayRows: Number(event.target.value || 0) })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>列宽</label>
                  <input
                    value={currentTabConfig.bandWidth ?? ''}
                    onChange={(event) => onUpdateTabConfig({ bandWidth: event.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>行高</label>
                  <input
                    value={currentTabConfig.bandHeight ?? ''}
                    onChange={(event) => onUpdateTabConfig({ bandHeight: event.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="col-span-full">
                  <label className={mutedLabelClass}>拖拽条件</label>
                  <textarea
                    rows={4}
                    value={currentTabConfig.dragcond ?? ''}
                    onChange={(event) => onUpdateTabConfig({ dragcond: event.target.value })}
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>MRP 拖拽标记</label>
                  <input
                    value={currentTabConfig.mrpDragTag ?? ''}
                    onChange={(event) => onUpdateTabConfig({ mrpDragTag: event.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>
            </section>

            <section className={compactCardClass}>
              <div className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[15px] text-slate-400">notes</span>
                <span>备注</span>
              </div>
              <textarea
                rows={4}
                value={currentTabConfig.Fremark ?? ''}
                onChange={(event) => onUpdateTabConfig({ Fremark: event.target.value })}
                className={textareaClass}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
});
