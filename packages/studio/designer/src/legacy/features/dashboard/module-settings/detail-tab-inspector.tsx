import React from 'react';
import {
  shadcnFieldClass,
  shadcnInspectorSectionClass,
  shadcnInspectorSectionHeaderClass,
  shadcnInspectorSectionTitleClass,
  shadcnMutedLabelClass,
  shadcnPanelBodyClass,
  shadcnPanelHeaderClass,
  shadcnPanelHeaderMainClass,
  shadcnPanelIconShellClass,
  shadcnPanelShellClass,
  shadcnPanelTitleClass,
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
  normalizedDetailType,
  onDeleteTab,
  relationSectionProps,
  onUpdateTabConfig,
  onUpdateTabType,
}: DetailTabInspectorProps) {
  const panelIconShellClass = `${shadcnPanelIconShellClass} size-10 rounded-lg`;
  const mutedLabelClass = shadcnMutedLabelClass;
  const fieldClass = shadcnFieldClass;
  const textareaClass = shadcnTextareaClass;

  return (
    <div className={shadcnPanelShellClass}>
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
            onClick={onDeleteTab}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-rose-200/80 bg-rose-50/85 px-3 text-[11px] font-semibold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100/80 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
            删除明细
          </button>
        </div>
      </div>

      <div className={shadcnPanelBodyClass}>
        <div className="w-full">
          <section className={shadcnInspectorSectionClass}>
            <div className={shadcnInspectorSectionHeaderClass}>
              <div className={shadcnInspectorSectionTitleClass}>
                <span className="material-symbols-outlined text-[15px] text-slate-400">table_rows</span>
                <span>明细定义</span>
              </div>
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
            </div>
          </section>

          {relationSectionProps ? (
            <DetailTabRelationSection {...relationSectionProps} />
          ) : null}

          <section className={shadcnInspectorSectionClass}>
            <div className={shadcnInspectorSectionHeaderClass}>
              <div className={shadcnInspectorSectionTitleClass}>
                <span className="material-symbols-outlined text-[15px] text-slate-400">toggle_on</span>
                <span>开关与权限</span>
              </div>
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

          <section className={shadcnInspectorSectionClass}>
            <div className={shadcnInspectorSectionHeaderClass}>
              <div className={shadcnInspectorSectionTitleClass}>
                <span className="material-symbols-outlined text-[15px] text-slate-400">view_agenda</span>
                <span>布局设置</span>
              </div>
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

          <section className={shadcnInspectorSectionClass}>
            <div className={shadcnInspectorSectionHeaderClass}>
              <div className={shadcnInspectorSectionTitleClass}>
                <span className="material-symbols-outlined text-[15px] text-slate-400">notes</span>
                <span>备注</span>
              </div>
            </div>
            <textarea
              rows={4}
              value={currentTabConfig.Fremark ?? ''}
              onChange={(event) => onUpdateTabConfig({ Fremark: event.target.value })}
              className={textareaClass}
            />
          </section>
        </div>
      </div>
    </div>
  );
});
