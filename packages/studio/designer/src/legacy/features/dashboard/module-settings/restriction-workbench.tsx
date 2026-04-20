import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
} from 'react';

import {
  shadcnFieldClass,
  shadcnMutedLabelClass,
  shadcnPanelShellClass,
  shadcnSectionCardClass,
  shadcnTextareaClass,
} from '../../../components/ui/shadcn-inspector';
import type { ApprovalFlowFamily } from '../../../lib/backend-process-designer';
import type {
  SimpleProcessSchema,
  SimpleProcessSchemaVersion,
} from '../../../lib/simple-process-designer-host';
import { SimpleProcessDesignHostPanel } from './simple-process-design-host-panel';
import type { ProcessDesignerDocument } from './process-designer-types';
import { type LongTextEditorState } from './long-text-editor-modal';

export type RestrictionConfigTabId =
  | 'guard'
  | 'number'
  | 'structure'
  | 'process';

export type RestrictionMeasureItem = {
  id: string;
  businessCategory: string;
  eventType: string;
  stepCode: string;
  judgeRule: string;
  syncAction: string;
  description: string;
  hint: string;
  order: number;
  enabled: boolean;
  confirmRequired: boolean;
  applyDate: string;
  applyUser: string;
};

export type RestrictionNumberRuleItem = {
  id: string;
  moduleCode: string;
  sortOrder: number;
  enabled: boolean;
  sequencePermission: boolean;
  segmentType: string;
  segmentValue: string;
  lengthLimit: number;
  separator: string;
  inputDate: string;
  creator: string;
};

export type RestrictionProcessDesignItem = {
  approvalFamily: ApprovalFlowFamily;
  id: string;
  legacyFlowTypeId?: number;
  planValue: string;
  businessCode: string;
  schemeCode: string;
  schemeName: string;
  permissionScope: string;
  businessType: string;
  actionDescription: string;
  designerDocument: ProcessDesignerDocument;
  simpleSchema?: SimpleProcessSchema;
  simpleSchemaVersion?: SimpleProcessSchemaVersion;
};

export type RestrictionTopStructureItem = {
  id: string;
  mainModuleCode: string;
  tableName: string;
  tableDesc: string;
  remark: string;
  rowId: number;
  moduleCode: string;
  moduleType: string;
  moduleSchema: string;
  fieldPrefix: string;
  sequencePrefix: string;
  sequenceRule: string;
  orderLength: number;
  relationField: string;
};

type RestrictionCardRow =
  | RestrictionMeasureItem
  | RestrictionNumberRuleItem
  | RestrictionTopStructureItem
  | RestrictionProcessDesignItem;

export type RestrictionWorkbenchProps = {
  activeTab: RestrictionConfigTabId;
  currentModuleName: string;
  onActiveTabChange: (tabId: RestrictionConfigTabId) => void;
  onAddItem: () => void;
  onDeleteItem: () => void;
  onDuplicateItem: () => void;
  onOpenLongTextEditor: (state: LongTextEditorState) => void;
  onSaveTab: () => void;
  onSelectedIdChange: (tabId: RestrictionConfigTabId, rowId: string | null) => void;
  restrictionMeasures: RestrictionMeasureItem[];
  restrictionNumberRules: RestrictionNumberRuleItem[];
  restrictionProcessDesigns: RestrictionProcessDesignItem[];
  restrictionSelection: Record<RestrictionConfigTabId, string | null>;
  restrictionTopStructures: RestrictionTopStructureItem[];
  setRestrictionMeasures: Dispatch<SetStateAction<RestrictionMeasureItem[]>>;
  setRestrictionNumberRules: Dispatch<SetStateAction<RestrictionNumberRuleItem[]>>;
  setRestrictionProcessDesigns: Dispatch<SetStateAction<RestrictionProcessDesignItem[]>>;
  setRestrictionTopStructures: Dispatch<SetStateAction<RestrictionTopStructureItem[]>>;
  workspaceThemeTableSurfaceClass: string;
  workspaceThemeVars: React.CSSProperties;
};

const RESTRICTION_BUSINESS_CATEGORY_OPTIONS = ['业务处理', '业务判断', '流程控制', '辅助校验'];
const RESTRICTION_EVENT_TYPE_OPTIONS = ['保存时', '保存后', '提交前', '提交后', '终审时', '终审退返时'];
const RESTRICTION_SEGMENT_TYPE_OPTIONS = ['固定字符串', '两位年', '月', '日', '顺序号', '字段值', '自定义SQL'];

export function RestrictionWorkbench({
  activeTab,
  currentModuleName,
  onActiveTabChange,
  onAddItem,
  onDeleteItem,
  onDuplicateItem,
  onOpenLongTextEditor,
  onSaveTab,
  onSelectedIdChange,
  restrictionMeasures,
  restrictionNumberRules,
  restrictionProcessDesigns,
  restrictionSelection,
  restrictionTopStructures,
  setRestrictionMeasures,
  setRestrictionNumberRules,
  setRestrictionProcessDesigns,
  setRestrictionTopStructures,
  workspaceThemeTableSurfaceClass,
  workspaceThemeVars,
}: RestrictionWorkbenchProps) {
  const restrictionRowsByTab = useMemo<Record<RestrictionConfigTabId, RestrictionCardRow[]>>(() => ({
    guard: restrictionMeasures,
    number: restrictionNumberRules,
    structure: restrictionTopStructures,
    process: restrictionProcessDesigns,
  }), [
    restrictionMeasures,
    restrictionNumberRules,
    restrictionProcessDesigns,
    restrictionTopStructures,
  ]);

  const restrictionTabMeta = useMemo(() => ([
    { id: 'guard' as RestrictionConfigTabId, label: '管控限制措施', icon: 'rule_settings', count: restrictionMeasures.length, accent: 'text-rose-500' },
    { id: 'number' as RestrictionConfigTabId, label: '编号规则管理', icon: 'tag', count: restrictionNumberRules.length, accent: 'text-cyan-500' },
    { id: 'structure' as RestrictionConfigTabId, label: '顶层数据结构', icon: 'schema', count: restrictionTopStructures.length, accent: 'text-emerald-500' },
    { id: 'process' as RestrictionConfigTabId, label: '流程设计管理', icon: 'account_tree', count: restrictionProcessDesigns.length, accent: 'text-amber-500' },
  ]), [
    restrictionMeasures.length,
    restrictionNumberRules.length,
    restrictionProcessDesigns.length,
    restrictionTopStructures.length,
  ]);

  useEffect(() => {
    if (!restrictionTabMeta.some((item) => item.id === activeTab)) {
      onActiveTabChange('guard');
    }
  }, [activeTab, onActiveTabChange, restrictionTabMeta]);

  const activeRestrictionRows = restrictionRowsByTab[activeTab] ?? [];
  const activeRestrictionSelectedId = restrictionSelection[activeTab];
  const activeRestrictionRow = activeRestrictionRows.find((row) => row.id === activeRestrictionSelectedId) ?? activeRestrictionRows[0] ?? null;
  const selectedGuardRule = restrictionMeasures.find((item) => item.id === restrictionSelection.guard) ?? restrictionMeasures[0] ?? null;
  const selectedNumberRule = restrictionNumberRules.find((item) => item.id === restrictionSelection.number) ?? restrictionNumberRules[0] ?? null;
  const selectedTopStructure = restrictionTopStructures.find((item) => item.id === restrictionSelection.structure) ?? restrictionTopStructures[0] ?? null;
  const selectedProcessDesign = restrictionProcessDesigns.find((item) => item.id === restrictionSelection.process) ?? restrictionProcessDesigns[0] ?? null;

  const restrictionPanelClass = shadcnPanelShellClass;
  const restrictionCardClass = `${shadcnSectionCardClass} flex h-full flex-col`;
  const restrictionHeroClass = 'overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50/85 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70';
  const restrictionFieldClass = shadcnFieldClass;
  const restrictionTextareaClass = shadcnTextareaClass;
  const restrictionDetailGridClass = 'grid gap-4 xl:grid-cols-12';
  const restrictionHeroTitleInputClass = 'mt-3 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3.5 text-[15px] font-semibold tracking-[-0.02em] text-slate-900 shadow-sm outline-none transition-[border-color,box-shadow,color] placeholder:text-slate-400 focus-visible:border-[color:var(--workspace-accent-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-accent-soft)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50';
  const restrictionHeroMetricGridClass = 'grid min-w-[280px] gap-3 sm:grid-cols-2 xl:w-[360px]';
  const restrictionLabelClass = shadcnMutedLabelClass;

  const restrictionBadge = (enabled: boolean, activeLabel: string, inactiveLabel: string) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${enabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
      {enabled ? activeLabel : inactiveLabel}
    </span>
  );

  const restrictionMetaChip = (icon: string, value: string) => (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800/86 dark:text-slate-300">
      <span className="material-symbols-outlined text-[12px]">{icon}</span>
      <span className="truncate">{value || '-'}</span>
    </span>
  );

  const restrictionMetric = (label: string, value: string, tone: 'default' | 'accent' | 'success' = 'default') => {
    const toneClass = tone === 'accent'
      ? 'border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)]'
      : tone === 'success'
        ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
        : 'border-slate-200/80 bg-white/90 text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200';

    return (
      <div className={`rounded-md border px-3 py-2.5 ${toneClass}`}>
        <div className="text-[10px] font-bold tracking-[0.08em] opacity-70">{label}</div>
        <div className="mt-1 truncate text-[13px] font-black tracking-[-0.02em]">{value || '-'}</div>
      </div>
    );
  };

  const restrictionSectionHeader = (title: string, _hint?: string, action?: React.ReactNode) => (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[14px] font-black tracking-[-0.02em] text-slate-800 dark:text-slate-100">{title}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );

  const restrictionToggleTile = (
    label: string,
    _hint: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
  ) => (
    <label className={`flex h-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
      checked
        ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)] shadow-sm'
        : 'border-slate-200/80 bg-white/92 text-slate-600 hover:border-[color:var(--workspace-accent-border)] dark:border-slate-700 dark:bg-slate-900/72 dark:text-slate-200'
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded accent-[color:var(--workspace-accent)]"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{label}</div>
      </div>
    </label>
  );

  const restrictionLongTextButton = (
    title: string,
    draft: string,
    placeholder: string,
    onSave: (value: string) => void,
  ) => (
    <button
      type="button"
      onClick={() => onOpenLongTextEditor({ title, draft, placeholder, onSave })}
      className="inline-flex h-7 items-center rounded-full border border-slate-200/80 bg-white px-2.5 text-[10px] font-bold text-slate-500 transition-colors hover:border-[color:var(--workspace-accent-border-strong)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      详情编辑
    </button>
  );

  const getRestrictionCardTitle = (row: RestrictionCardRow | null) => {
    if (!row) return '未命名配置';
    if (activeTab === 'guard') return (row as RestrictionMeasureItem).description || '限制措施';
    if (activeTab === 'number') return (row as RestrictionNumberRuleItem).segmentValue || (row as RestrictionNumberRuleItem).segmentType || '编号规则';
    if (activeTab === 'structure') return (row as RestrictionTopStructureItem).tableDesc || (row as RestrictionTopStructureItem).tableName || '顶层结构';
    return (row as RestrictionProcessDesignItem).schemeName || (row as RestrictionProcessDesignItem).schemeCode || '流程方案';
  };

  const getRestrictionCardSubtitle = (row: RestrictionCardRow | null) => {
    if (!row) return '';
    if (activeTab === 'guard') {
      const item = row as RestrictionMeasureItem;
      return `${item.businessCategory || '未分类'} · ${item.eventType || '未设置事件'}`;
    }
    if (activeTab === 'number') {
      const item = row as RestrictionNumberRuleItem;
      return `${item.segmentType || '组成元素'} · 顺序 ${item.sortOrder ?? 0}`;
    }
    if (activeTab === 'structure') {
      const item = row as RestrictionTopStructureItem;
      return item.tableName || item.mainModuleCode || '未设置表名';
    }
    const item = row as RestrictionProcessDesignItem;
    return `${item.schemeCode || '未编号'} · ${item.businessType || '未分类'}`;
  };

  const getRestrictionCardSummary = (row: RestrictionCardRow | null) => {
    if (!row) return '暂无说明';
    if (activeTab === 'guard') {
      const item = row as RestrictionMeasureItem;
      return item.hint || item.judgeRule || '暂无规则说明';
    }
    if (activeTab === 'number') {
      const item = row as RestrictionNumberRuleItem;
      return item.segmentValue || `长度限制 ${item.lengthLimit ?? 0}`;
    }
    if (activeTab === 'structure') {
      const item = row as RestrictionTopStructureItem;
      return item.remark || `${item.fieldPrefix || '-'} / ${item.sequenceRule || '-'}`;
    }
    const item = row as RestrictionProcessDesignItem;
    if (item.simpleSchema) {
      return '已切换为 Vue Simple 设计器草稿';
    }
    return item.actionDescription || item.permissionScope || '暂无流程说明';
  };

  const getRestrictionCardPills = (row: RestrictionCardRow | null) => {
    if (!row) return [] as string[];
    if (activeTab === 'guard') {
      const item = row as RestrictionMeasureItem;
      return [
        item.stepCode ? `步骤 ${item.stepCode}` : '步骤 -',
        `${item.enabled ? '启用' : '停用'}${item.confirmRequired ? ' · 需确认' : ''}`,
      ];
    }
    if (activeTab === 'number') {
      const item = row as RestrictionNumberRuleItem;
      return [
        `长度 ${item.lengthLimit ?? 0}`,
        `${item.sequencePermission ? '受限' : '开放'} · ${item.enabled ? '启用' : '停用'}`,
      ];
    }
    if (activeTab === 'structure') {
      const item = row as RestrictionTopStructureItem;
      return [
        item.moduleSchema || '未设结构',
        item.fieldPrefix ? `前缀 ${item.fieldPrefix}` : '未设前缀',
      ];
    }
    const item = row as RestrictionProcessDesignItem;
    return [
      item.planValue ? `方案 ${item.planValue}` : '未设方案',
      item.businessCode || '未设业务号',
    ];
  };

  const getRestrictionCardReadonlyMeta = (row: RestrictionCardRow | null) => {
    if (!row) return [] as Array<{ icon: string; value: string }>;
    if (activeTab === 'guard') {
      const item = row as RestrictionMeasureItem;
      return [
        { icon: 'calendar_month', value: item.applyDate || '-' },
        { icon: 'person', value: item.applyUser || '-' },
      ];
    }
    if (activeTab === 'number') {
      const item = row as RestrictionNumberRuleItem;
      return [
        { icon: 'calendar_month', value: item.inputDate || '-' },
        { icon: 'badge', value: item.creator || '-' },
      ];
    }
    return [] as Array<{ icon: string; value: string }>;
  };

  const renderRestrictionMasterList = () => {
    const activeTabIcon = restrictionTabMeta.find((item) => item.id === activeTab)?.icon ?? 'rule_settings';

    if (activeRestrictionRows.length === 0) {
      return (
        <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-white/65 px-5 text-center text-[12px] text-slate-400 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-500">
          当前页签还没有配置内容
        </div>
      );
    }

    return (
      <div className="scrollbar-none min-h-0 flex-1 overflow-auto pr-1">
        <div className="grid content-start gap-2.5">
          {activeRestrictionRows.map((row, index) => {
            const selected = row.id === activeRestrictionRow?.id;
            const title = getRestrictionCardTitle(row);
            const subtitle = getRestrictionCardSubtitle(row);
            const summary = getRestrictionCardSummary(row);
            const pills = getRestrictionCardPills(row);
            const readonlyMeta = getRestrictionCardReadonlyMeta(row);

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelectedIdChange(activeTab, row.id)}
                className={`group overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all ${
                  selected
                    ? 'border-[color:var(--workspace-accent-border-strong)] bg-[linear-gradient(180deg,rgba(245,249,255,0.98),rgba(241,246,255,0.95))] shadow-[0_18px_36px_-32px_var(--workspace-accent-shadow)] dark:border-[color:var(--workspace-accent-border)] dark:bg-slate-900/90'
                    : 'border-slate-200/80 bg-white/92 hover:-translate-y-0.5 hover:border-[color:var(--workspace-accent-border)] hover:shadow-[0_16px_30px_-26px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900/72'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-[16px] ${
                      selected
                        ? 'bg-[color:var(--workspace-accent)] text-white'
                        : 'bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)]'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">{activeTabIcon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-black tracking-[-0.02em] text-slate-800 dark:text-slate-100">{title}</div>
                      <div className="mt-1 truncate text-[11px] font-semibold text-slate-400">{subtitle}</div>
                    </div>
                  </div>
                  <div className={`inline-flex min-w-[28px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-black ${
                    selected
                      ? 'bg-white text-[color:var(--workspace-accent-strong)] dark:bg-slate-800'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {pills.map((pill) => (
                    <span
                      key={`${row.id}-${pill}`}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        selected
                          ? 'bg-white/88 text-[color:var(--workspace-accent-strong)] dark:bg-slate-800 dark:text-slate-100'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {pill}
                    </span>
                  ))}
                </div>
                <div className="mt-2.5 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-300">
                  {summary}
                </div>
                {readonlyMeta.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2 border-t border-slate-200/70 pt-2.5 dark:border-slate-700">
                    {readonlyMeta.map((item) => (
                      <React.Fragment key={`${row.id}-${item.icon}-${item.value}`}>
                        {restrictionMetaChip(item.icon, item.value)}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRestrictionMeasureDetail = () => {
    if (!selectedGuardRule) {
      return (
        <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 text-[12px] text-slate-400 dark:border-slate-700">
          先在上面选一条限制措施
        </div>
      );
    }

    const updateSelectedRule = (patch: Partial<RestrictionMeasureItem>) => {
      setRestrictionMeasures((prev) => prev.map((item) => (item.id === selectedGuardRule.id ? { ...item, ...patch } : item)));
    };

    return (
      <div className={restrictionDetailGridClass}>
        <section className={`${restrictionHeroClass} xl:col-span-12`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 items-center rounded-full bg-[color:var(--workspace-accent)] px-3 text-[11px] font-black text-white shadow-[0_18px_30px_-24px_var(--workspace-accent-shadow)]">
                  管控限制措施
                </span>
                {restrictionBadge(selectedGuardRule.enabled, '启用中', '已停用')}
                {selectedGuardRule.confirmRequired && restrictionBadge(true, '要求确认', '无确认')}
              </div>
              <input
                type="text"
                value={selectedGuardRule.description}
                onChange={(event) => updateSelectedRule({ description: event.target.value })}
                placeholder="输入限制措施名称"
                className={restrictionHeroTitleInputClass}
              />
            </div>
            <div className={restrictionHeroMetricGridClass}>
              {restrictionMetric('业务类型', selectedGuardRule.businessCategory || '未设置', 'accent')}
              {restrictionMetric('事件类型', selectedGuardRule.eventType || '未设置')}
              {restrictionMetric('步骤代码', selectedGuardRule.stepCode || '-', 'default')}
              {restrictionMetric('管理顺序', String(selectedGuardRule.order ?? 0), 'success')}
            </div>
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-7`}>
          {restrictionSectionHeader('规则身份', '锁定触发位置和执行顺序')}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={restrictionLabelClass}>业务类型</label>
              <select value={selectedGuardRule.businessCategory} onChange={(event) => updateSelectedRule({ businessCategory: event.target.value })} className={restrictionFieldClass}>
                {RESTRICTION_BUSINESS_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className={restrictionLabelClass}>事件类型</label>
              <select value={selectedGuardRule.eventType} onChange={(event) => updateSelectedRule({ eventType: event.target.value })} className={restrictionFieldClass}>
                {RESTRICTION_EVENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className={restrictionLabelClass}>步骤代码</label>
              <input type="text" value={selectedGuardRule.stepCode} onChange={(event) => updateSelectedRule({ stepCode: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>管理顺序</label>
              <input type="number" value={selectedGuardRule.order} onChange={(event) => updateSelectedRule({ order: Number(event.target.value) || 0 })} className={restrictionFieldClass} />
            </div>
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-5`}>
          {restrictionSectionHeader('生效与确认', '只保留执行相关开关')}
          <div className="grid gap-3 sm:grid-cols-2">
            {restrictionToggleTile('启用此限制', '参与执行', selectedGuardRule.enabled, (checked) => updateSelectedRule({ enabled: checked }))}
            {restrictionToggleTile('触发时要求确认', '二次确认', selectedGuardRule.confirmRequired, (checked) => updateSelectedRule({ confirmRequired: checked }))}
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-12`}>
          {restrictionSectionHeader('提示信息')}
          <div>
            <label className={restrictionLabelClass}>提示信息</label>
            <textarea rows={3} value={selectedGuardRule.hint} onChange={(event) => updateSelectedRule({ hint: event.target.value })} className={`${restrictionTextareaClass} h-[112px] resize-none`} />
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-6`}>
          {restrictionSectionHeader(
            '判断限制代码',
            'SQL / 脚本',
            restrictionLongTextButton('判断限制代码', selectedGuardRule.judgeRule, '输入判断限制 SQL / 脚本', (value) => updateSelectedRule({ judgeRule: value })),
          )}
          <textarea rows={6} value={selectedGuardRule.judgeRule} onChange={(event) => updateSelectedRule({ judgeRule: event.target.value })} placeholder="exists(select 1 from ...)" className={`${restrictionTextareaClass} min-h-[168px] flex-1 resize-none font-mono text-[12px]`} />
        </section>
        <section className={`${restrictionCardClass} xl:col-span-6`}>
          {restrictionSectionHeader(
            '同步操作代码',
            '保存后执行',
            restrictionLongTextButton('同步操作代码', selectedGuardRule.syncAction, '输入更新脚本 / 过程调用', (value) => updateSelectedRule({ syncAction: value })),
          )}
          <textarea rows={6} value={selectedGuardRule.syncAction} onChange={(event) => updateSelectedRule({ syncAction: event.target.value })} placeholder="update ... / exec ..." className={`${restrictionTextareaClass} min-h-[168px] flex-1 resize-none font-mono text-[12px]`} />
        </section>
      </div>
    );
  };

  const renderRestrictionNumberDetail = () => {
    if (!selectedNumberRule) {
      return <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 text-[12px] text-slate-400 dark:border-slate-700">先在上面选一条编号规则</div>;
    }

    const updateSelectedRule = (patch: Partial<RestrictionNumberRuleItem>) => {
      setRestrictionNumberRules((prev) => prev.map((item) => (item.id === selectedNumberRule.id ? { ...item, ...patch } : item)));
    };

    const orderedNumberRules = restrictionNumberRules.slice().sort((left, right) => left.sortOrder - right.sortOrder);
    const previewValue = orderedNumberRules
      .filter((item) => item.enabled)
      .map((item) => item.segmentValue || item.segmentType)
      .join(selectedNumberRule.separator || '') || '编号预览';

    return (
      <div className={restrictionDetailGridClass}>
        <section className={`${restrictionHeroClass} xl:col-span-12`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 items-center rounded-full bg-[color:var(--workspace-accent)] px-3 text-[11px] font-black text-white shadow-[0_18px_30px_-24px_var(--workspace-accent-shadow)]">
                  编号规则
                </span>
                {restrictionBadge(selectedNumberRule.enabled, '启用中', '已停用')}
                {selectedNumberRule.sequencePermission && restrictionBadge(true, '受权限控制', '开放')}
              </div>
              <input
                type="text"
                value={selectedNumberRule.segmentValue}
                onChange={(event) => updateSelectedRule({ segmentValue: event.target.value })}
                placeholder="输入固定值、表达式或片段"
                className={restrictionHeroTitleInputClass}
              />
            </div>
            <div className={restrictionHeroMetricGridClass}>
              {restrictionMetric('组成元素', selectedNumberRule.segmentType || '未设置', 'accent')}
              {restrictionMetric('组成顺序', String(selectedNumberRule.sortOrder ?? 0))}
              {restrictionMetric('长度限制', String(selectedNumberRule.lengthLimit ?? 0), 'success')}
              {restrictionMetric('分隔符', selectedNumberRule.separator || '无')}
            </div>
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-6`}>
          {restrictionSectionHeader('编号段定义', '顺序、类型和长度')}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={restrictionLabelClass}>模块编码</label>
              <input type="text" value={selectedNumberRule.moduleCode} onChange={(event) => updateSelectedRule({ moduleCode: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>组成顺序</label>
              <input type="number" value={selectedNumberRule.sortOrder} onChange={(event) => updateSelectedRule({ sortOrder: Number(event.target.value) || 0 })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>组成元素</label>
              <select value={selectedNumberRule.segmentType} onChange={(event) => updateSelectedRule({ segmentType: event.target.value })} className={restrictionFieldClass}>
                {RESTRICTION_SEGMENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className={restrictionLabelClass}>长度限制</label>
              <input type="number" value={selectedNumberRule.lengthLimit} onChange={(event) => updateSelectedRule({ lengthLimit: Number(event.target.value) || 0 })} className={restrictionFieldClass} />
            </div>
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-6`}>
          {restrictionSectionHeader('生成控制', '分隔符和权限开关')}
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
              <div>
                <label className={restrictionLabelClass}>分割符</label>
                <input type="text" value={selectedNumberRule.separator} onChange={(event) => updateSelectedRule({ separator: event.target.value })} className={restrictionFieldClass} placeholder="例如 - / 空值" />
              </div>
              {restrictionToggleTile('序号受权限控制', '按权限决定是否参与生成', selectedNumberRule.sequencePermission, (checked) => updateSelectedRule({ sequencePermission: checked }))}
            </div>
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-12`}>
          {restrictionSectionHeader('效果查验', '看段位顺序和最终编号')}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,0.96))] p-5 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">编号段序列</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {orderedNumberRules.map((item) => (
                  <span key={item.id} className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold ${
                    item.id === selectedNumberRule.id
                      ? 'bg-[color:var(--workspace-accent)] text-white'
                      : item.enabled
                        ? 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-200'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}>
                    {item.segmentType} · {item.segmentValue || '空'}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] border border-dashed border-slate-200/80 bg-white/92 p-5 dark:border-slate-700 dark:bg-slate-900/78">
              <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">最终编号预览</div>
              <div className="mt-4 rounded-[18px] border border-slate-200/80 bg-slate-950 px-4 py-4 font-mono text-[14px] font-bold tracking-[0.04em] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:border-slate-700">
                {previewValue}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderRestrictionStructureDetail = () => {
    if (!selectedTopStructure) {
      return <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 text-[12px] text-slate-400 dark:border-slate-700">先在上面选一条顶层数据结构</div>;
    }

    const updateSelectedStructure = (patch: Partial<RestrictionTopStructureItem>) => {
      setRestrictionTopStructures((prev) => prev.map((item) => (item.id === selectedTopStructure.id ? { ...item, ...patch } : item)));
    };

    return (
      <div className={restrictionDetailGridClass}>
        <section className={`${restrictionHeroClass} xl:col-span-12`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 items-center rounded-full bg-[color:var(--workspace-accent)] px-3 text-[11px] font-black text-white shadow-[0_18px_30px_-24px_var(--workspace-accent-shadow)]">
                  顶层数据结构
                </span>
                <span className="inline-flex h-8 items-center rounded-full bg-white/92 px-3 text-[11px] font-bold text-slate-500 dark:bg-slate-900/78 dark:text-slate-300">
                  {selectedTopStructure.tableName || '未设表名'}
                </span>
              </div>
              <input
                type="text"
                value={selectedTopStructure.tableDesc}
                onChange={(event) => updateSelectedStructure({ tableDesc: event.target.value })}
                placeholder="输入结构说明或表名描述"
                className={restrictionHeroTitleInputClass}
              />
            </div>
            <div className={restrictionHeroMetricGridClass}>
              {restrictionMetric('模块结构', selectedTopStructure.moduleSchema || '未设置', 'accent')}
              {restrictionMetric('字段前缀', selectedTopStructure.fieldPrefix || '无')}
              {restrictionMetric('流水前缀', selectedTopStructure.sequencePrefix || '无')}
              {restrictionMetric('顺序位数', String(selectedTopStructure.orderLength || 0), 'success')}
            </div>
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-7`}>
          {restrictionSectionHeader('结构主信息', '模块号、表名与结构归类')}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={restrictionLabelClass}>主模块号</label>
              <input type="text" value={selectedTopStructure.mainModuleCode} onChange={(event) => updateSelectedStructure({ mainModuleCode: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>模块编码</label>
              <input type="text" value={selectedTopStructure.moduleCode} onChange={(event) => updateSelectedStructure({ moduleCode: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>模块表名</label>
              <input type="text" value={selectedTopStructure.tableName} onChange={(event) => updateSelectedStructure({ tableName: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>模块类型</label>
              <input type="text" value={selectedTopStructure.moduleType} onChange={(event) => updateSelectedStructure({ moduleType: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={restrictionLabelClass}>模块结构</label>
              <input type="text" value={selectedTopStructure.moduleSchema} onChange={(event) => updateSelectedStructure({ moduleSchema: event.target.value })} className={restrictionFieldClass} />
            </div>
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-5`}>
          {restrictionSectionHeader('前缀与关联', '编码前缀与主表关联')}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={restrictionLabelClass}>字段前缀</label>
              <input type="text" value={selectedTopStructure.fieldPrefix} onChange={(event) => updateSelectedStructure({ fieldPrefix: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>流水号前缀</label>
              <input type="text" value={selectedTopStructure.sequencePrefix} onChange={(event) => updateSelectedStructure({ sequencePrefix: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>流水号规则</label>
              <input type="text" value={selectedTopStructure.sequenceRule} onChange={(event) => updateSelectedStructure({ sequenceRule: event.target.value })} className={restrictionFieldClass} />
            </div>
            <div>
              <label className={restrictionLabelClass}>顺序号长度</label>
              <input type="number" value={selectedTopStructure.orderLength} onChange={(event) => updateSelectedStructure({ orderLength: Number(event.target.value) || 0 })} className={restrictionFieldClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={restrictionLabelClass}>关联主表字段</label>
              <input type="text" value={selectedTopStructure.relationField} onChange={(event) => updateSelectedStructure({ relationField: event.target.value })} className={restrictionFieldClass} />
            </div>
          </div>
        </section>
        <section className={`${restrictionCardClass} xl:col-span-12`}>
          {restrictionSectionHeader('备注说明')}
          <textarea rows={4} value={selectedTopStructure.remark} onChange={(event) => updateSelectedStructure({ remark: event.target.value })} className={`${restrictionTextareaClass} min-h-[152px] resize-none`} />
        </section>
      </div>
    );
  };

  const renderRestrictionProcessDetail = () => {
    if (!selectedProcessDesign) {
      return <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 text-[12px] text-slate-400 dark:border-slate-700">先在上面选一条流程设计</div>;
    }

    const updateSelectedProcess = (patch: Partial<RestrictionProcessDesignItem>) => {
      setRestrictionProcessDesigns((prev) => prev.map((item) => (item.id === selectedProcessDesign.id ? { ...item, ...patch } : item)));
    };

    return (
      <SimpleProcessDesignHostPanel
        currentModuleName={currentModuleName}
        mode="workspace"
        onUpdate={updateSelectedProcess}
        processDesign={selectedProcessDesign}
      />
    );
  };

  const renderRestrictionDetailPanel = () => {
    if (activeTab === 'guard') return renderRestrictionMeasureDetail();
    if (activeTab === 'number') return renderRestrictionNumberDetail();
    if (activeTab === 'structure') return renderRestrictionStructureDetail();
    return renderRestrictionProcessDetail();
  };

  const activeRestrictionTabLabel = restrictionTabMeta.find((item) => item.id === activeTab)?.label ?? '限制措施';
  const activeRestrictionSummary = activeRestrictionRow
    ? activeTab === 'guard'
      ? ((activeRestrictionRow as RestrictionMeasureItem).description || '限制措施')
      : activeTab === 'number'
        ? `${(activeRestrictionRow as RestrictionNumberRuleItem).segmentType || '编号段'} · ${(activeRestrictionRow as RestrictionNumberRuleItem).segmentValue || '空值'}`
        : activeTab === 'structure'
          ? ((activeRestrictionRow as RestrictionTopStructureItem).tableDesc || (activeRestrictionRow as RestrictionTopStructureItem).tableName || '结构项')
          : ((activeRestrictionRow as RestrictionProcessDesignItem).schemeName || '流程方案')
    : '暂无选中项';

  return (
    <div style={workspaceThemeVars} className={`cloudy-glass-stage cloudy-cloud-grid studio-grid-bg flex h-full flex-1 min-h-0 overflow-hidden rounded-[36px] p-2.5 ${workspaceThemeTableSurfaceClass}`}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,248,252,0.96))] px-4 pb-4 pt-3 shadow-[0_32px_80px_-56px_rgba(15,23,42,0.42)] dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.96))]">
        <div className="min-w-0">
          <div className="truncate text-[20px] font-black tracking-[-0.03em] text-slate-900 dark:text-white">{currentModuleName}</div>
        </div>
        <div className="scrollbar-none mt-3 flex flex-nowrap gap-2 overflow-x-auto border-b border-slate-200/80 pb-3 dark:border-slate-700">
          {restrictionTabMeta.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onActiveTabChange(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${active ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)] shadow-[0_16px_30px_-26px_var(--workspace-accent-shadow)]' : 'border-slate-200/80 bg-white/90 text-slate-500 hover:border-[color:var(--workspace-accent-border)] hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-slate-100'}`}
              >
                <span className={`material-symbols-outlined text-[16px] ${active ? 'text-[color:var(--workspace-accent)]' : tab.accent}`}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black ${active ? 'bg-white text-[color:var(--workspace-accent-strong)]' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-200'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(320px,392px)_minmax(0,1fr)]">
          <section className={`${restrictionPanelClass} min-h-0`}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">{activeRestrictionTabLabel}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100">规则列表</div>
                  <span className="rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                    {activeRestrictionRows.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={onAddItem} className="inline-flex h-8 items-center gap-1.5 rounded-[13px] bg-[color:var(--workspace-accent)] px-3.5 text-[11px] font-bold text-white shadow-[0_18px_30px_-24px_var(--workspace-accent-shadow)] transition-colors hover:bg-[color:var(--workspace-accent-strong)]">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  新增
                </button>
                <button type="button" onClick={onDuplicateItem} className="inline-flex h-8 items-center gap-1.5 rounded-[13px] border border-slate-200/80 bg-white px-3.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-[color:var(--workspace-accent-border-strong)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  复制
                </button>
                <button type="button" onClick={onDeleteItem} className="inline-flex h-8 items-center gap-1.5 rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 text-[11px] font-bold text-rose-500 transition-colors hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10">
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  删除
                </button>
                <button type="button" onClick={onSaveTab} className="inline-flex h-8 items-center gap-1.5 rounded-[13px] border border-slate-200/80 bg-white px-3.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-[color:var(--workspace-accent-border-strong)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span className="material-symbols-outlined text-[14px]">save</span>
                  保存
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-3">
              {renderRestrictionMasterList()}
            </div>
          </section>
          <section className={`${restrictionPanelClass} min-h-0`}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">配置面板</div>
                <div className="mt-1 truncate text-[15px] font-black tracking-[-0.02em] text-slate-800 dark:text-slate-100">{activeRestrictionSummary}</div>
              </div>
              <div className="rounded-full bg-slate-100/90 px-3 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                {activeRestrictionTabLabel}
              </div>
            </div>
            <div className="scrollbar-none min-h-0 flex-1 overflow-auto px-4 pb-3 pt-2.5">
              {renderRestrictionDetailPanel()}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
