import React from 'react';
import {
  shadcnFieldClass,
  shadcnInfoCardClass,
  shadcnMutedLabelClass,
  shadcnSectionCardClass,
  shadcnSectionTitleClass,
  shadcnTextareaClass,
} from '../../../components/ui/shadcn-inspector';

type DetailSourceModuleCandidate = {
  isCurrent?: boolean;
  moduleCode: string;
  moduleName?: string;
  tableName?: string;
};

type DetailChartFillMeta = {
  icon?: string;
  value?: string;
} | null;

type GridIdentifierTranslationSectionProps = {
  availableGridColumnCount: number;
  isTranslatingIdentifiers: boolean;
  onTranslate: () => void;
  translatableColumnCount: number;
};

type GridColumnDataSectionProps = {
  availableGridColumns: any[];
  normalizeColumn: (column: any) => any;
  onSelectColumn: (columnId: string) => void;
  title?: string;
};

type GridSqlConfigSectionProps = {
  conditionValue: string;
  conditionLabel?: string;
  hideConditionInput?: boolean;
  hideSqlPrompt?: boolean;
  isDetailConfig: boolean;
  isGeneratingSqlDraft: boolean;
  mainSql: string;
  mainSqlLabel?: string;
  onBlurMainSql?: (value: string) => void;
  onGenerateSqlDraft: () => void;
  onUpdateConditionValue: (value: string) => void;
  onUpdateMainSql: (value: string) => void;
  onUpdateSqlPrompt: (value: string) => void;
  readOnlyMainSql?: boolean;
  sectionDescription?: string;
  sqlPrompt: string;
  title?: string;
  showGenerateButton?: boolean;
};

type DetailSourceSectionProps = {
  availableGridColumnCount: number;
  currentMainSql: string;
  detailSourceModuleCandidates: DetailSourceModuleCandidate[];
  detailSourceModuleCode: string;
  isGeneratingSqlDraft: boolean;
  matchedDetailModuleCandidate: DetailSourceModuleCandidate | null;
  relatedCondition: string;
  relatedModuleField: string;
  relatedValue: string;
  sqlPrompt: string;
  onBlurMainSql: (value: string) => void;
  onGenerateSqlDraft: () => void;
  onSyncDetailColumnsFromConfiguredModule: () => void;
  onSyncDetailColumnsFromSql: () => void;
  onUpdateDetailSourceModuleCode: (value: string) => void;
  onUpdateMainSql: (value: string) => void;
  onUpdateRelatedCondition: (value: string) => void;
  onUpdateRelatedModuleField: (value: string) => void;
  onUpdateRelatedValue: (value: string) => void;
  onUpdateSqlPrompt: (value: string) => void;
};

type DetailTabRelationSectionProps = {
  availableGridColumnCount: number;
  detailSourceModuleCandidates: DetailSourceModuleCandidate[];
  detailSourceModuleCode: string;
  detailSourceMode: 'module' | 'sql';
  matchedDetailModuleCandidate: DetailSourceModuleCandidate | null;
  relatedCondition: string;
  relatedModuleField: string;
  relatedValue: string;
  onSyncDetailColumnsFromConfiguredModule: () => void;
  onUpdateDetailSourceModuleCode: (value: string) => void;
  onUpdateRelatedCondition: (value: string) => void;
  onUpdateRelatedModuleField: (value: string) => void;
  onUpdateRelatedValue: (value: string) => void;
};

type DocumentTableMappingSectionProps = {
  colorRuleCount: number;
  contextMenuCount: number;
  onOpenColorRules: () => void;
  onOpenContextMenus: () => void;
};

type LeftGridMappingSectionProps = {
  colorRuleCount: number;
  contextMenuCount: number;
  documentConditionOwnerSourceId: string;
  hasTreeRelationColumn: boolean;
  leftFilterCount: number;
  onLocateOwnerField: () => void;
  onOpenColorRules: () => void;
  onOpenContextMenus: () => void;
  treeOwnerFieldKey: string;
  treeOwnerFieldName: string;
};

type DocumentMainTableSetupSectionProps = {
  isGeneratingSqlDraft: boolean;
  mainTableHiddenColumnsCount: number;
  mainTableName: string;
  onGenerateSqlDraft: () => void;
  onOpenMainHiddenColumnsModal: () => void;
  onUpdateMainTableName: (value: string) => void;
  showMainHiddenColumnsAction: boolean;
};

type GridConfigSummarySectionProps = {
  activeTitle: string;
  availableGridColumnCount: number;
  chartTitle: string;
  chartTypeLabel: string;
  contextMenuCount: number;
  currentTableType: string;
  detailGridFillTypeMeta: DetailChartFillMeta;
  enabledColorRuleCount: number;
  onUpdateTableType: (nextType: string) => void;
  tableTypeOptions: string[];
  title: string;
  xAxisField: string;
  yAxisField: string;
};

type GridLayoutWorkflowSectionProps = {
  assignedFieldCount: number;
  description: string;
  groupCount: number;
  onApplySuggestedLayout: () => void;
  onOpenPreview: () => void;
  previewDisabled: boolean;
  title: string;
  totalFieldCount: number;
};

const quietDocumentInspectorCardClass = 'w-full rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const quietDocumentInspectorSummaryClass = 'rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-[11px] leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400';
const quietDocumentInspectorActionClass = 'inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100';
const quietDocumentInspectorPrimaryActionClass = 'inline-flex h-8 items-center gap-1.5 rounded-lg bg-[color:var(--workspace-accent)] px-3 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--workspace-accent-strong)]';

export const GridLayoutWorkflowSection = React.memo(function GridLayoutWorkflowSection({
  assignedFieldCount,
  description,
  groupCount,
  onApplySuggestedLayout,
  onOpenPreview,
  previewDisabled,
  title,
  totalFieldCount,
}: GridLayoutWorkflowSectionProps) {
  const pendingFieldCount = Math.max(0, totalFieldCount - assignedFieldCount);

  return (
    <section className={`${quietDocumentInspectorCardClass} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className={shadcnSectionTitleClass}>
          <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">view_quilt</span>
          <div className="min-w-0">
            <h4>{title}</h4>
            <p className="mt-1 text-[11px] font-normal leading-5 text-slate-500 dark:text-slate-300">
              {description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onApplySuggestedLayout}
            className={quietDocumentInspectorPrimaryActionClass}
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            推荐布局
          </button>
          <button
            type="button"
            onClick={onOpenPreview}
            disabled={previewDisabled}
            className={`${quietDocumentInspectorActionClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="material-symbols-outlined text-[14px]">preview</span>
            预览效果
          </button>
        </div>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className={quietDocumentInspectorSummaryClass}>
          <div className="text-[10px] font-bold tracking-[0.08em] text-slate-400">分组数量</div>
          <div className="mt-1 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{groupCount} 组</div>
        </div>
        <div className={quietDocumentInspectorSummaryClass}>
          <div className="text-[10px] font-bold tracking-[0.08em] text-slate-400">已排布字段</div>
          <div className="mt-1 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{assignedFieldCount} 项</div>
        </div>
        <div className={quietDocumentInspectorSummaryClass}>
          <div className="text-[10px] font-bold tracking-[0.08em] text-slate-400">待排布字段</div>
          <div className="mt-1 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{pendingFieldCount} 项</div>
        </div>
      </div>
    </section>
  );
});

export const GridSqlConfigSection = React.memo(function GridSqlConfigSection({
  conditionValue,
  conditionLabel,
  hideConditionInput = false,
  hideSqlPrompt = false,
  isDetailConfig,
  isGeneratingSqlDraft,
  mainSql,
  mainSqlLabel,
  onBlurMainSql,
  onGenerateSqlDraft,
  onUpdateConditionValue,
  onUpdateMainSql,
  onUpdateSqlPrompt,
  readOnlyMainSql = false,
  sectionDescription,
  sqlPrompt,
  title,
  showGenerateButton = true,
}: GridSqlConfigSectionProps) {
  const resolvedTitle = title || (isDetailConfig ? '明细 SQL 配置' : '主 SQL 配置');
  const resolvedConditionLabel = conditionLabel || (isDetailConfig ? '关联条件' : '默认查询');
  const resolvedMainSqlLabel = mainSqlLabel || '主 SQL';

  return (
    <section className={`${shadcnSectionCardClass} w-full`}>
      <div className={shadcnSectionTitleClass}>
        <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">frame_source</span>
        <div className="min-w-0">
          <h4>{resolvedTitle}</h4>
          {sectionDescription ? (
            <p className="mt-1 text-[11px] font-normal text-slate-500 dark:text-slate-300">
              {sectionDescription}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4">
        {!hideSqlPrompt ? (
          <div>
            <label className={shadcnMutedLabelClass}>生成描述</label>
            <textarea
              rows={3}
              value={sqlPrompt}
              onChange={(event) => onUpdateSqlPrompt(event.target.value)}
              placeholder="描述需要的字段、筛选条件和排序方式"
              className={shadcnTextareaClass}
            />
          </div>
        ) : null}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className={`${shadcnMutedLabelClass} mb-0`}>{resolvedMainSqlLabel}</label>
            {showGenerateButton && !readOnlyMainSql ? (
              <button
                type="button"
                onClick={onGenerateSqlDraft}
                disabled={isGeneratingSqlDraft}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[12px] px-3 text-[11px] font-bold transition-colors ${
                  isGeneratingSqlDraft
                    ? 'cursor-wait bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    : 'bg-[color:var(--workspace-accent)] text-white shadow-[0_16px_28px_-24px_var(--workspace-accent-shadow)] hover:bg-[color:var(--workspace-accent-strong)]'
                }`}
              >
                <span className={`material-symbols-outlined text-[14px] ${isGeneratingSqlDraft ? 'animate-spin' : ''}`}>
                  {isGeneratingSqlDraft ? 'progress_activity' : 'auto_awesome'}
                </span>
                AI 生成
              </button>
            ) : null}
          </div>
          <textarea
            rows={6}
            value={mainSql}
            readOnly={readOnlyMainSql}
            onChange={(event) => onUpdateMainSql(event.target.value)}
            onBlur={(event) => onBlurMainSql?.(event.target.value)}
            placeholder="SELECT ... FROM ..."
            className={`${shadcnTextareaClass} ${readOnlyMainSql ? 'cursor-default bg-slate-50/90 text-slate-500 dark:bg-slate-900/70 dark:text-slate-300' : ''}`}
          />
        </div>
        {!hideConditionInput ? (
          <div>
            <label className={shadcnMutedLabelClass}>{resolvedConditionLabel}</label>
            <input
              type="text"
              value={conditionValue}
              onChange={(event) => onUpdateConditionValue(event.target.value)}
              placeholder={isDetailConfig ? '输入关联条件' : '输入默认查询条件'}
              className={shadcnFieldClass}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
});

export const DocumentMainTableSetupSection = React.memo(function DocumentMainTableSetupSection({
  isGeneratingSqlDraft,
  mainTableHiddenColumnsCount,
  mainTableName,
  onGenerateSqlDraft,
  onOpenMainHiddenColumnsModal,
  onUpdateMainTableName,
  showMainHiddenColumnsAction,
}: DocumentMainTableSetupSectionProps) {
  return (
    <section className={`${quietDocumentInspectorCardClass} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className={shadcnSectionTitleClass}>
          <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">dataset</span>
          <div className="min-w-0">
            <h4>主表定义</h4>
            <p className="mt-1 text-[11px] font-normal text-slate-500 dark:text-slate-300">
              翻译未转英文的字段标识，生成建表 SQL，并同步主表 SQL。
            </p>
          </div>
        </div>
        {showMainHiddenColumnsAction ? (
          <button
            type="button"
            onClick={onOpenMainHiddenColumnsModal}
            disabled={mainTableHiddenColumnsCount === 0}
            className={`${quietDocumentInspectorActionClass} shrink-0 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="material-symbols-outlined text-[14px]">view_column</span>
            详细列 {mainTableHiddenColumnsCount > 0 ? `(${mainTableHiddenColumnsCount})` : ''}
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <label className={shadcnMutedLabelClass}>主表名</label>
          <input
            type="text"
            value={mainTableName}
            onChange={(event) => onUpdateMainTableName(event.target.value)}
            placeholder="例如：tb_customer_archive"
            className={shadcnFieldClass}
          />
        </div>
        <button
          type="button"
          onClick={onGenerateSqlDraft}
          disabled={isGeneratingSqlDraft}
          className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[14px] px-4 text-[12px] font-semibold transition-colors ${
            isGeneratingSqlDraft
              ? 'cursor-wait bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              : 'bg-[color:var(--workspace-accent)] text-white shadow-[0_16px_28px_-24px_var(--workspace-accent-shadow)] hover:bg-[color:var(--workspace-accent-strong)]'
          }`}
        >
          <span className={`material-symbols-outlined text-[14px] ${isGeneratingSqlDraft ? 'animate-spin' : ''}`}>
            {isGeneratingSqlDraft ? 'progress_activity' : 'auto_awesome'}
          </span>
          AI一键建表
        </button>
      </div>
    </section>
  );
});

export const GridIdentifierTranslationSection = React.memo(function GridIdentifierTranslationSection({
  availableGridColumnCount,
  isTranslatingIdentifiers,
  onTranslate,
  translatableColumnCount,
}: GridIdentifierTranslationSectionProps) {
  return (
    <section className={quietDocumentInspectorCardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className={shadcnSectionTitleClass}>
          <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">translate</span>
          <div className="min-w-0">
            <h4>字段标识</h4>
            <p className="mt-1 text-[11px] font-normal text-slate-500 dark:text-slate-300">
              批量把字段显示名同步到标识字段。
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onTranslate}
          disabled={isTranslatingIdentifiers}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-[11px] font-medium transition-colors ${
            isTranslatingIdentifiers
              ? 'cursor-wait bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              : quietDocumentInspectorActionClass
          }`}
        >
          <span className={`material-symbols-outlined text-[14px] ${isTranslatingIdentifiers ? 'animate-spin' : ''}`}>
            {isTranslatingIdentifiers ? 'progress_activity' : 'translate'}
          </span>
          一键翻译
        </button>
      </div>
      <div className={quietDocumentInspectorSummaryClass}>
        当前列数 {availableGridColumnCount} 个，待翻译 {translatableColumnCount} 个。
      </div>
    </section>
  );
});

export const GridColumnDataSection = React.memo(function GridColumnDataSection({
  availableGridColumns,
  normalizeColumn,
  onSelectColumn,
  title = '列数据',
}: GridColumnDataSectionProps) {
  const normalizedColumns = React.useMemo(
    () => availableGridColumns.map((column) => normalizeColumn(column)),
    [availableGridColumns, normalizeColumn],
  );

  return (
    <section className={`${quietDocumentInspectorCardClass} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className={shadcnSectionTitleClass}>
          <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">table_rows</span>
          <h4>{title}</h4>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center rounded-md border border-slate-200/80 bg-white px-2.5 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          {normalizedColumns.length} 列
        </span>
      </div>

      {normalizedColumns.length > 0 ? (
        <div className="grid gap-2">
          {normalizedColumns.map((column, index) => {
            const columnName = String(column.name || '').trim() || `字段 ${index + 1}`;
            const sourceField = String(column.sourceField || '').trim();
            const columnType = String(column.type || '').trim() || '文本';
            const columnWidth = Number(column.width || 0);
            const isVisible = !(column.visible === false || column.visible === 0 || column.visible === '0');
            const isReadonly = Boolean(column.readonly || column.readOnly);
            const isRequired = Boolean(column.required);

            return (
              <button
                key={column.id || `${columnName}-${index}`}
                type="button"
                onClick={() => {
                  if (column.id) {
                    onSelectColumn(column.id);
                  }
                }}
                className="flex items-start justify-between gap-3 rounded-md border border-slate-200/80 bg-white px-3 py-2.5 text-left transition-colors hover:border-[color:var(--workspace-accent-border)] hover:bg-[color:var(--workspace-accent-tint)] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-[color:var(--workspace-accent-border)] dark:hover:bg-slate-900"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {index + 1}
                    </span>
                    <span className="truncate text-[12px] font-semibold text-slate-700 dark:text-slate-100">{columnName}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-slate-500 dark:text-slate-300">
                    <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                      {sourceField || '未配置标识'}
                    </span>
                    <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                      {columnType}
                    </span>
                    {columnWidth > 0 ? (
                      <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                        {Math.round(columnWidth)}px
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isRequired ? (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-200">
                      必填
                    </span>
                  ) : null}
                  {!isVisible ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-200">
                      隐藏
                    </span>
                  ) : null}
                  {isReadonly ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      只读
                    </span>
                  ) : null}
                  <span className="material-symbols-outlined text-[16px] text-slate-300 dark:text-slate-600">chevron_right</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={quietDocumentInspectorSummaryClass}>
          当前还没有列数据，先在中间表格区增加字段。
        </div>
      )}
    </section>
  );
});

export const DetailSourceSection = React.memo(function DetailSourceSection({
  availableGridColumnCount,
  currentMainSql,
  detailSourceModuleCandidates,
  detailSourceModuleCode,
  isGeneratingSqlDraft,
  matchedDetailModuleCandidate,
  relatedCondition,
  relatedModuleField,
  relatedValue,
  sqlPrompt,
  onBlurMainSql,
  onGenerateSqlDraft,
  onSyncDetailColumnsFromConfiguredModule,
  onSyncDetailColumnsFromSql,
  onUpdateDetailSourceModuleCode,
  onUpdateMainSql,
  onUpdateRelatedCondition,
  onUpdateRelatedModuleField,
  onUpdateRelatedValue,
  onUpdateSqlPrompt,
}: DetailSourceSectionProps) {
  const detailSourceStatusText = detailSourceModuleCode
    ? `继承 ${detailSourceModuleCode}`
    : (currentMainSql ? '自定义 SQL' : '未配置');
  const sourceBadgeText = detailSourceModuleCode ? '模块继承' : 'SQL 构列';

  return (
    <section className={`${quietDocumentInspectorCardClass} space-y-3`}>
      <div className={shadcnSectionTitleClass}>
        <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">dataset_linked</span>
        <div className="min-w-0">
          <h4>表格数据来源</h4>
          <p className="mt-1 text-[11px] font-normal text-slate-500 dark:text-slate-300">
            {sourceBadgeText} · {detailSourceStatusText}
          </p>
        </div>
      </div>
      <div className={quietDocumentInspectorSummaryClass}>
        模块 {matchedDetailModuleCandidate?.moduleName || matchedDetailModuleCandidate?.moduleCode || '未指定'}，
        主表 {matchedDetailModuleCandidate?.tableName || '按 SQL 构列'}，当前字段 {availableGridColumnCount} 个。
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={shadcnMutedLabelClass}>模块编号</label>
          <input
            type="text"
            list={detailSourceModuleCandidates.length > 0 ? 'detail-module-code-candidates' : undefined}
            value={detailSourceModuleCode}
            onChange={(event) => onUpdateDetailSourceModuleCode(event.target.value)}
            onBlur={(event) => onUpdateDetailSourceModuleCode(event.target.value)}
            placeholder="例如：FM-CO-001"
            className={shadcnFieldClass}
          />
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>关联模块字段</label>
          <input
            type="text"
            value={relatedModuleField}
            onChange={(event) => onUpdateRelatedModuleField(event.target.value)}
            placeholder="例如：archive_id"
            className={shadcnFieldClass}
          />
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>关联值</label>
          <input
            type="text"
            value={relatedValue}
            onChange={(event) => onUpdateRelatedValue(event.target.value)}
            placeholder="例如：${id}"
            className={shadcnFieldClass}
          />
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>关联条件</label>
          <input
            type="text"
            value={relatedCondition}
            onChange={(event) => onUpdateRelatedCondition(event.target.value)}
            placeholder="输入关联条件"
            className={shadcnFieldClass}
          />
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className={shadcnMutedLabelClass}>生成描述</label>
          <textarea
            rows={3}
            value={sqlPrompt}
            onChange={(event) => onUpdateSqlPrompt(event.target.value)}
            placeholder="描述需要的字段、筛选条件和排序方式"
            className={shadcnTextareaClass}
          />
        </div>
        <div className={quietDocumentInspectorSummaryClass}>
          明细 SQL 会直接决定字段构列；需要继承主表时先填写模块编号。
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className={`${shadcnMutedLabelClass} mb-0`}>明细 SQL</label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onGenerateSqlDraft}
              disabled={isGeneratingSqlDraft}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[11px] font-medium transition-colors ${
                isGeneratingSqlDraft
                  ? 'cursor-wait bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  : quietDocumentInspectorActionClass
              }`}
            >
              <span className={`material-symbols-outlined text-[14px] ${isGeneratingSqlDraft ? 'animate-spin' : ''}`}>
                {isGeneratingSqlDraft ? 'progress_activity' : 'auto_awesome'}
              </span>
              AI 生成
            </button>
            <button
              type="button"
              onClick={onSyncDetailColumnsFromConfiguredModule}
              disabled={!detailSourceModuleCode}
              className={detailSourceModuleCode ? quietDocumentInspectorPrimaryActionClass : 'inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-100 px-3 text-[11px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500'}
            >
              <span className="material-symbols-outlined text-[14px]">table_rows</span>
              继承主表配置
            </button>
            <button
              type="button"
              onClick={onSyncDetailColumnsFromSql}
              className={quietDocumentInspectorActionClass}
            >
              <span className="material-symbols-outlined text-[14px]">schema</span>
              按 SQL 构列
            </button>
          </div>
        </div>
        <textarea
          rows={5}
          value={currentMainSql}
          onChange={(event) => onUpdateMainSql(event.target.value)}
          onBlur={(event) => onBlurMainSql(event.target.value)}
          placeholder="SELECT ... FROM ..."
          className={shadcnTextareaClass}
        />
      </div>
      {detailSourceModuleCandidates.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {detailSourceModuleCandidates.map((candidate) => {
            const active = candidate.moduleCode === detailSourceModuleCode;
            return (
              <button
                key={candidate.moduleCode}
                type="button"
                onClick={() => onUpdateDetailSourceModuleCode(candidate.moduleCode)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  active
                    ? 'border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)]'
                    : 'border-slate-200/80 bg-white text-slate-500 hover:border-[color:var(--workspace-accent-border)] hover:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                }`}
              >
                {candidate.moduleCode}
                {candidate.isCurrent ? <span className="text-[10px] text-emerald-600 dark:text-emerald-300">当前</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
});

export const DetailTabRelationSection = React.memo(function DetailTabRelationSection({
  availableGridColumnCount,
  detailSourceModuleCandidates,
  detailSourceModuleCode,
  detailSourceMode,
  matchedDetailModuleCandidate,
  relatedCondition,
  relatedModuleField,
  relatedValue,
  onSyncDetailColumnsFromConfiguredModule,
  onUpdateDetailSourceModuleCode,
  onUpdateRelatedCondition,
  onUpdateRelatedModuleField,
  onUpdateRelatedValue,
}: DetailTabRelationSectionProps) {
  const isModuleMode = detailSourceMode === 'module';
  const detailSourceLabel = isModuleMode ? '模块继承' : '明细 SQL';
  const detailSourceSummary = isModuleMode
    ? `当前继承 ${detailSourceModuleCode || '目标模块'} 的主表配置`
    : '当前未关联模块，表格按明细 SQL 单独配置';

  return (
    <section className={`${quietDocumentInspectorCardClass} space-y-3`}>
      <div className={shadcnSectionTitleClass}>
        <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">dataset_linked</span>
        <div className="min-w-0">
          <h4>明细关联</h4>
          <p className="mt-1 text-[11px] font-normal text-slate-500 dark:text-slate-300">
            配置当前明细与主模块的关联关系。
          </p>
        </div>
      </div>
      <div className={quietDocumentInspectorSummaryClass}>
        <span className="font-semibold text-slate-700 dark:text-slate-100">{detailSourceLabel}</span>
        {' · '}
        {detailSourceSummary}
        {' · '}
        已构建字段 {availableGridColumnCount} 个。
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={shadcnMutedLabelClass}>模块编号</label>
          <input
            type="text"
            value={detailSourceModuleCode}
            onChange={(event) => onUpdateDetailSourceModuleCode(event.target.value)}
            onBlur={(event) => onUpdateDetailSourceModuleCode(event.target.value)}
            placeholder="例如：FM-CO-001"
            className={shadcnFieldClass}
          />
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>关联模块字段</label>
          <input
            type="text"
            value={relatedModuleField}
            onChange={(event) => onUpdateRelatedModuleField(event.target.value)}
            placeholder="例如：archive_id"
            className={shadcnFieldClass}
          />
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>关联值</label>
          <input
            type="text"
            value={relatedValue}
            onChange={(event) => onUpdateRelatedValue(event.target.value)}
            placeholder="例如：${id}"
            className={shadcnFieldClass}
          />
        </div>
        <div>
          <label className={shadcnMutedLabelClass}>关联条件</label>
          <input
            type="text"
            value={relatedCondition}
            onChange={(event) => onUpdateRelatedCondition(event.target.value)}
            placeholder="输入关联条件"
            className={shadcnFieldClass}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] leading-5 text-slate-500 dark:text-slate-300">
          {matchedDetailModuleCandidate?.moduleName || matchedDetailModuleCandidate?.moduleCode || detailSourceModuleCode || '未指定模块'}
          {isModuleMode
            ? ` · 主表 ${matchedDetailModuleCandidate?.tableName || '继承目标主表'}`
            : ' · 使用当前明细 SQL'}
        </div>
        <button
          type="button"
          onClick={onSyncDetailColumnsFromConfiguredModule}
          disabled={!detailSourceModuleCode}
          className={detailSourceModuleCode ? quietDocumentInspectorPrimaryActionClass : 'inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-100 px-3 text-[11px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500'}
        >
          <span className="material-symbols-outlined text-[14px]">table_rows</span>
          {isModuleMode ? '重新加载主表配置' : '按模块继承'}
        </button>
      </div>
      {detailSourceModuleCandidates.length > 0 ? (
        <datalist id="detail-module-code-candidates">
          {detailSourceModuleCandidates.map((candidate) => (
            <option key={candidate.moduleCode} value={candidate.moduleCode}>
              {candidate.moduleName || candidate.moduleCode}
            </option>
          ))}
        </datalist>
      ) : null}
    </section>
  );
});

export const DocumentTableMappingSection = React.memo(function DocumentTableMappingSection({
  colorRuleCount,
  contextMenuCount,
  onOpenColorRules,
  onOpenContextMenus,
}: DocumentTableMappingSectionProps) {
  return (
    <section className={`${quietDocumentInspectorCardClass} space-y-3`}>
      <div className={shadcnSectionTitleClass}>
        <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">schema</span>
        <h4>落表映射</h4>
      </div>
      <div className={quietDocumentInspectorSummaryClass}>
        主配置 `p_systemdlltab`，条件 `p_systembillsourcecond`，右键 {contextMenuCount} 项，颜色 {colorRuleCount} 条。
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenContextMenus}
          className={quietDocumentInspectorActionClass}
        >
          右键菜单 {contextMenuCount}
        </button>
        <button
          type="button"
          onClick={onOpenColorRules}
          className={quietDocumentInspectorActionClass}
        >
          颜色规则 {colorRuleCount}
        </button>
      </div>
    </section>
  );
});

export const LeftGridMappingSection = React.memo(function LeftGridMappingSection({
  colorRuleCount,
  contextMenuCount,
  documentConditionOwnerSourceId,
  hasTreeRelationColumn,
  leftFilterCount,
  onLocateOwnerField,
  onOpenColorRules,
  onOpenContextMenus,
  treeOwnerFieldKey,
  treeOwnerFieldName,
}: LeftGridMappingSectionProps) {
  return (
    <section className={`${shadcnSectionCardClass} space-y-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className={shadcnSectionTitleClass}>
          <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">account_tree</span>
          <h4>左表映射</h4>
        </div>
        {hasTreeRelationColumn ? (
          <button
            type="button"
            onClick={onLocateOwnerField}
            className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--workspace-accent-strong)] transition-colors hover:bg-[color:var(--workspace-accent-tint)]"
          >
            <span className="material-symbols-outlined text-[14px]">ads_click</span>
            定位所属字段
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={shadcnInfoCardClass}>
          <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">所属字段</div>
          <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">{treeOwnerFieldName || '未配置树形字段'}</div>
          <div className="mt-1 break-all font-mono text-[11px] text-slate-400">{treeOwnerFieldKey || '未设置 fieldkey'}</div>
        </div>
        <div className={shadcnInfoCardClass}>
          <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">关联条件</div>
          <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">{leftFilterCount} 条</div>
          <div className="mt-1 break-all font-mono text-[11px] text-slate-400">sourceid = {documentConditionOwnerSourceId || '未设置'}</div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={shadcnInfoCardClass}>
          <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">左侧列</div>
          <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">p_systemwordbookgrid</div>
        </div>
        <div className={shadcnInfoCardClass}>
          <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">左侧条件</div>
          <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">p_systembillsourcecond</div>
        </div>
        <button
          type="button"
          onClick={onOpenContextMenus}
          className="flex items-center justify-between rounded-lg border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] px-3 py-2 text-left text-[12px] font-semibold text-[color:var(--workspace-accent-strong)] transition-colors hover:bg-[color:var(--workspace-accent-tint)]"
        >
          <span>左边右键</span>
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-black text-[color:var(--workspace-accent-strong)]">
            {contextMenuCount}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenColorRules}
          className="flex items-center justify-between rounded-lg border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] px-3 py-2 text-left text-[12px] font-semibold text-[color:var(--workspace-accent-strong)] transition-colors hover:bg-[color:var(--workspace-accent-tint)]"
        >
          <span>左边颜色</span>
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-black text-[color:var(--workspace-accent-strong)]">
            {colorRuleCount}
          </span>
        </button>
      </div>
    </section>
  );
});

export const GridConfigSummarySection = React.memo(function GridConfigSummarySection({
  activeTitle,
  availableGridColumnCount,
  chartTitle,
  chartTypeLabel,
  contextMenuCount,
  currentTableType,
  detailGridFillTypeMeta,
  enabledColorRuleCount,
  onUpdateTableType,
  tableTypeOptions,
  title,
  xAxisField,
  yAxisField,
}: GridConfigSummarySectionProps) {
  return (
    <section className={`${quietDocumentInspectorCardClass} space-y-4`}>
      <div className={shadcnSectionTitleClass}>
        <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">
          {detailGridFillTypeMeta?.icon || 'table_chart'}
        </span>
        <h4>{title}</h4>
      </div>
      <div className="grid gap-4">
        <div>
          {detailGridFillTypeMeta?.value !== '图表' ? (
            <div>
              <label className={shadcnMutedLabelClass}>表格类型</label>
              <select
                value={currentTableType}
                onChange={(event) => onUpdateTableType(event.target.value)}
                className={shadcnFieldClass}
              >
                {tableTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              <div>
                <label className={shadcnMutedLabelClass}>图表类型</label>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-[12px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                  {chartTypeLabel || '未设置'}
                </div>
              </div>
              <div>
                <label className={shadcnMutedLabelClass}>图表标题</label>
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-[12px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                  {chartTitle || activeTitle}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={quietDocumentInspectorSummaryClass}>
          {detailGridFillTypeMeta?.value === '图表' ? '当前填充' : '当前表格'} {activeTitle}
          ，显示字段 {availableGridColumnCount} 个，右键菜单 {contextMenuCount} 项，颜色规则 {enabledColorRuleCount} 条生效。
          {detailGridFillTypeMeta?.value === '图表'
            ? ` X轴 ${xAxisField || '未设置'}，Y轴 ${yAxisField || '未设置'}。`
            : ''}
        </div>
      </div>
    </section>
  );
});
