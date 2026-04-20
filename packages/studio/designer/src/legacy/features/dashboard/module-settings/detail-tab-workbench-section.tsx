import React from 'react';
import {
  shadcnFieldClass,
  shadcnMutedLabelClass,
  shadcnSectionTitleClass,
} from '../../../components/ui/shadcn-inspector';

type DetailFillTypeOption = {
  label: string;
  value: string;
};

type DetailTabWorkbenchSectionProps = {
  activeTab: string;
  currentDetailTabConfig: Record<string, any>;
  currentModuleCode: string;
  currentTabName: string;
  detailFillTypeOptions: DetailFillTypeOption[];
  onUpdateTabConfig: (patch: Record<string, any>) => void;
  onUpdateTabType: (nextType: string) => void;
};

const quietDocumentInspectorCardClass = 'rounded-[16px] border border-slate-200/75 bg-white px-4 py-3 shadow-none dark:border-slate-800 dark:bg-slate-950/78';

export const DetailTabWorkbenchSection = React.memo(function DetailTabWorkbenchSection({
  activeTab,
  currentDetailTabConfig,
  currentModuleCode,
  currentTabName,
  detailFillTypeOptions,
  onUpdateTabConfig,
  onUpdateTabType,
}: DetailTabWorkbenchSectionProps) {
  return (
    <section className={quietDocumentInspectorCardClass}>
      <div className={shadcnSectionTitleClass}>
        <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">tabs</span>
        <div className="min-w-0">
          <h4>明细页签</h4>
          <p className="mt-1 text-[11px] font-normal text-slate-500 dark:text-slate-300">
            页签名称、类型和模板统一在这里维护。
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={shadcnMutedLabelClass}>所属模块编号</label>
          <input
            type="text"
            value={currentDetailTabConfig.tab ?? currentModuleCode}
            onChange={(event) => onUpdateTabConfig({ tab: event.target.value })}
            className={shadcnFieldClass}
          />
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>页签名称</label>
          <input
            type="text"
            value={currentDetailTabConfig.detailName ?? currentTabName}
            onChange={(event) => onUpdateTabConfig({ detailName: event.target.value })}
            className={shadcnFieldClass}
          />
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>类型</label>
          <select
            value={currentDetailTabConfig.detailType ?? ''}
            onChange={(event) => onUpdateTabType(event.target.value)}
            className={shadcnFieldClass}
          >
            {detailFillTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>tabKey</label>
          <input
            type="text"
            value={currentDetailTabConfig.tabKey ?? activeTab}
            onChange={(event) => onUpdateTabConfig({ tabKey: event.target.value })}
            className={shadcnFieldClass}
          />
        </div>
        <div className="md:col-span-2">
          <label className={shadcnMutedLabelClass}>DLL 模板</label>
          <input
            type="text"
            value={currentDetailTabConfig.dllTemplate ?? ''}
            onChange={(event) => onUpdateTabConfig({ dllTemplate: event.target.value })}
            className={shadcnFieldClass}
          />
        </div>
      </div>
    </section>
  );
});
