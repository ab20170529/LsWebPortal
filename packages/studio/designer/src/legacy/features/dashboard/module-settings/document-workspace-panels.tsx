import React, { useMemo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  MemoDocumentConditionWorkbench,
  type ConditionWorkbenchScope,
  type DocumentConditionWorkbenchConfig,
} from './condition-workbench';
import {
  MemoDocumentGridToolbar,
  type DocumentGridToolbarFilterConfig,
  type DocumentGridToolbarOptions,
} from './document-grid-toolbar';

type DocumentTreePanelProps = {
  documentTreeTableBuilderNode: React.ReactNode;
  onPaste: React.ClipboardEventHandler<HTMLDivElement>;
  treeRelationColumn: any;
  workspaceThemeVars: CSSProperties;
};

export function DocumentTreePanel({
  documentTreeTableBuilderNode,
  onPaste,
  treeRelationColumn,
  workspaceThemeVars,
}: DocumentTreePanelProps) {
  if (!treeRelationColumn) return null;

  return (
    <div
      style={workspaceThemeVars}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#d9e2ec] bg-white shadow-none"
    >
      <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
        <div
          className="scrollbar-none min-h-0 flex-1 overflow-auto bg-white px-3 py-3 outline-none dark:bg-slate-900/88"
          tabIndex={0}
          onPaste={onPaste}
        >
          {documentTreeTableBuilderNode}
        </div>
      </div>
    </div>
  );
}

type DocumentGridToolbarBridgeProps = {
  activeResize: any;
  autoFitColumnWidth: (...args: any[]) => void;
  buildDocumentFilterRuntimeRules: (fields: any[], activeResize: any) => string;
  columns: any[];
  extraActions?: React.ReactNode;
  filterConfig?: DocumentGridToolbarFilterConfig;
  metrics: {
    filterControlWidth: number;
    filterResizeMaxWidth: number;
    filterResizeMinWidth: number;
  };
  onAdd: () => void;
  onDelete: () => void;
  onSetBuilderSelectionContextMenu: (menu: any) => void;
  options?: DocumentGridToolbarOptions;
  renderFieldPreview: (rawField: any, rowIndex: number, mode?: 'table' | 'filter' | 'condition') => React.ReactNode;
  selectedCount: number;
  startResize: (...args: any[]) => void;
  tableConfigAction?: {
    active?: boolean;
    onSelect: () => void;
  };
  title: string;
};

export function DocumentGridToolbarBridge({
  activeResize,
  autoFitColumnWidth,
  buildDocumentFilterRuntimeRules,
  columns,
  extraActions,
  filterConfig,
  metrics,
  onAdd,
  onDelete,
  onSetBuilderSelectionContextMenu,
  options,
  renderFieldPreview,
  selectedCount,
  startResize,
  tableConfigAction,
  title,
}: DocumentGridToolbarBridgeProps) {
  const resolvedFilterFields = filterConfig?.fields ?? columns.slice(0, 3);
  const resolvedOptions = useMemo(() => ({
    ...options,
    filterRuntimeRules: options?.filterRuntimeRules ?? buildDocumentFilterRuntimeRules(resolvedFilterFields, activeResize),
  }) satisfies DocumentGridToolbarOptions, [
    activeResize,
    buildDocumentFilterRuntimeRules,
    options,
    resolvedFilterFields,
  ]);

  return (
    <MemoDocumentGridToolbar
      columns={columns}
      title={title}
      selectedCount={selectedCount}
      onDelete={onDelete}
      onAdd={onAdd}
      extraActions={extraActions}
      filterConfig={filterConfig}
      tableConfigAction={tableConfigAction}
      options={resolvedOptions}
      metrics={metrics}
      onSetBuilderSelectionContextMenu={onSetBuilderSelectionContextMenu}
      renderFieldPreview={renderFieldPreview}
      startResize={startResize}
      autoFitColumnWidth={autoFitColumnWidth}
    />
  );
}

type DocumentConditionToolbarBridgeProps = {
  activeScope: ConditionWorkbenchScope;
  canSwitchScope: boolean;
  helpers: any;
  leftConfig?: DocumentConditionWorkbenchConfig | null;
  mainConfig: DocumentConditionWorkbenchConfig;
  metrics: any;
  onActivatePanel: (scope: ConditionWorkbenchScope) => void;
  onClearBuilderSelectionContextMenu: () => void;
  onScopeSwitch: (scope: ConditionWorkbenchScope) => void;
  renderFieldPreview: (rawField: any, rowIndex: number, mode?: 'table' | 'filter' | 'condition') => React.ReactNode;
  resize: any;
};

export function DocumentConditionToolbarBridge({
  activeScope,
  canSwitchScope,
  helpers,
  leftConfig,
  mainConfig,
  metrics,
  onActivatePanel,
  onClearBuilderSelectionContextMenu,
  onScopeSwitch,
  renderFieldPreview,
  resize,
}: DocumentConditionToolbarBridgeProps) {
  return (
    <MemoDocumentConditionWorkbench
      activeScope={activeScope}
      canSwitchScope={canSwitchScope}
      mainConfig={mainConfig}
      leftConfig={leftConfig}
      onScopeSwitch={onScopeSwitch}
      onActivatePanel={onActivatePanel}
      onClearBuilderSelectionContextMenu={onClearBuilderSelectionContextMenu}
      renderFieldPreview={renderFieldPreview}
      resize={resize}
      helpers={helpers}
      metrics={metrics}
    />
  );
}

const CONDITION_MODAL_TYPE_OPTIONS = ['文本', '日期框', '数字', '下拉框', '搜索框'];
const CONDITION_MODAL_ALIGN_OPTIONS = ['左对齐', '居中', '右对齐'];

function normalizeModalConditionField(field: any, metrics: DocumentConditionToolbarBridgeProps['metrics']) {
  return {
    required: false,
    visible: true,
    searchable: true,
    readonly: false,
    align: '左对齐',
    placeholder: '',
    defaultValue: '',
    dictCode: '',
    formula: '',
    relationSql: '',
    dynamicSql: '',
    helpText: '',
    ...field,
    width: Math.min(
      metrics.maxWidth,
      Math.max(
        metrics.minWidth,
        Number.isFinite(Number(field?.width)) ? Number(field.width) : metrics.controlWidth,
      ),
    ),
    panelRow: Math.max(
      1,
      Math.min(
        Number.isFinite(Number(field?.panelRow)) ? Number(field.panelRow) : 1,
        Math.max(1, Number(field?.rowCount) || 99),
      ),
    ),
  };
}

type ConditionDetailEditorProps = {
  currentConfig: DocumentConditionWorkbenchConfig;
  metrics: DocumentConditionToolbarBridgeProps['metrics'];
};

function ConditionDetailEditor({
  currentConfig,
  metrics,
}: ConditionDetailEditorProps) {
  const currentFields = useMemo(
    () => currentConfig.fields.map((field) => normalizeModalConditionField(field, metrics)),
    [currentConfig.fields, metrics],
  );
  const selectedCondition = currentFields.find((field) => field.id === currentConfig.selectedId) ?? null;

  const updateSelectedCondition = (patch: Record<string, any>) => {
    if (!selectedCondition) return;
    currentConfig.setFields((prev) => prev.map((item) => (
      item.id === selectedCondition.id ? { ...item, ...patch } : item
    )));
  };

  const removeSelectedCondition = () => {
    if (!selectedCondition) return;
    const remainingFields = currentFields.filter((field) => field.id !== selectedCondition.id);
    currentConfig.setFields((prev) => prev.filter((item) => item.id !== selectedCondition.id));
    const fallbackId = remainingFields[0]?.id ?? null;
    currentConfig.setSelectedIds(fallbackId ? [fallbackId] : []);
    currentConfig.onActivate(fallbackId);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#dbe4ee] bg-white shadow-[0_26px_56px_-40px_rgba(15,23,42,0.26)] dark:border-slate-800 dark:bg-slate-950/92">
        {selectedCondition ? (
          <>
            <div className="border-b border-[#e6edf5] bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(246,249,253,0.94))] px-4 py-4 dark:border-slate-800 dark:bg-slate-950/96">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-[18px] font-semibold text-slate-900 dark:text-slate-50">{selectedCondition.name || '未命名条件'}</div>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {selectedCondition.type}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      第 {selectedCondition.panelRow} 行
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-6 text-slate-500 dark:text-slate-400">
                    这里保留了条件最常改的基础定义、展示属性和查询联动。改完会直接写回当前条件集合，不需要再切到别的面板。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedCondition}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[14px] border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  删除条件
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/45">
                  <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">view_list</span>
                    基础定义
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">条件名称</label>
                      <input
                        type="text"
                        value={selectedCondition.name || ''}
                        onChange={(event) => updateSelectedCondition({ name: event.target.value })}
                        className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">条件标识</label>
                      <input
                        type="text"
                        value={selectedCondition.sourceField || ''}
                        onChange={(event) => updateSelectedCondition({ sourceField: event.target.value })}
                        placeholder="例如：status_keyword"
                        className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 font-mono text-[12px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">控件类型</label>
                        <select
                          value={selectedCondition.type || '文本'}
                          onChange={(event) => updateSelectedCondition({ type: event.target.value })}
                          className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {CONDITION_MODAL_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">所在行</label>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, currentConfig.rowCount)}
                          value={selectedCondition.panelRow}
                          onChange={(event) => updateSelectedCondition({
                            panelRow: Math.max(1, Math.min(Math.max(1, currentConfig.rowCount), Number(event.target.value) || 1)),
                          })}
                          className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/45">
                  <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">space_dashboard</span>
                    展示与交互
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">控件宽度</label>
                        <input
                          type="number"
                          min={metrics.minWidth}
                          max={metrics.maxWidth}
                          value={Math.round(selectedCondition.width || metrics.controlWidth)}
                          onChange={(event) => updateSelectedCondition({
                            width: Math.max(metrics.minWidth, Math.min(metrics.maxWidth, Number(event.target.value) || metrics.controlWidth)),
                          })}
                          className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">对齐方式</label>
                        <select
                          value={selectedCondition.align || '左对齐'}
                          onChange={(event) => updateSelectedCondition({ align: event.target.value })}
                          className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {CONDITION_MODAL_ALIGN_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">默认值</label>
                        <input
                          type="text"
                          value={selectedCondition.defaultValue || ''}
                          onChange={(event) => updateSelectedCondition({ defaultValue: event.target.value })}
                          placeholder="例如：当前组织 / 默认状态"
                          className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">提示文案</label>
                        <input
                          type="text"
                          value={selectedCondition.placeholder || ''}
                          onChange={(event) => updateSelectedCondition({ placeholder: event.target.value })}
                          placeholder="例如：请输入关键字 / 请选择日期"
                          className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['required', '必填条件', '查询前必须先填写'],
                        ['visible', '界面显示', '是否在顶部条件区展示'],
                        ['searchable', '参与查询', '是否拼入查询条件'],
                        ['readonly', '只读预设', '适合系统回填或固定条件'],
                      ].map(([key, label, desc]) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-slate-200/80 bg-white/90 px-3.5 py-3 transition-colors hover:border-[color:var(--workspace-accent-border)] dark:border-slate-700 dark:bg-slate-900/70"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded border-slate-300 text-[color:var(--workspace-accent)] focus:ring-[color:var(--workspace-accent)]"
                            checked={Boolean(selectedCondition[key])}
                            onChange={(event) => updateSelectedCondition({ [key]: event.target.checked })}
                          />
                          <div>
                            <div className="text-[12px] font-bold text-slate-700 dark:text-slate-100">{label}</div>
                            <div className="mt-1 text-[11px] leading-5 text-slate-400">{desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/45">
                  <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">hub</span>
                    查询联动
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">值集 / 字典</label>
                        <input
                          type="text"
                          value={selectedCondition.dictCode || ''}
                          onChange={(event) => updateSelectedCondition({ dictCode: event.target.value })}
                          placeholder="输入值集编码或逗号分隔选项"
                          className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">默认表达式</label>
                        <input
                          type="text"
                          value={selectedCondition.formula || ''}
                          onChange={(event) => updateSelectedCondition({ formula: event.target.value })}
                          placeholder="例如：today() / 本月 / 当前组织"
                          className="h-10 w-full rounded-[14px] border border-slate-200/90 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">条件 SQL / 取数逻辑</label>
                      <textarea
                        rows={4}
                        value={selectedCondition.relationSql || ''}
                        onChange={(event) => updateSelectedCondition({ relationSql: event.target.value })}
                        placeholder="SELECT code, name FROM ..."
                        className="min-h-[112px] w-full rounded-[16px] border border-slate-200/90 bg-white px-3 py-2.5 text-[12px] leading-6 text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">联动 SQL / 条件表达式</label>
                      <textarea
                        rows={4}
                        value={selectedCondition.dynamicSql || ''}
                        onChange={(event) => updateSelectedCondition({ dynamicSql: event.target.value })}
                        placeholder="WHERE org_id = ${orgId} AND enable = 1"
                        className="min-h-[112px] w-full rounded-[16px] border border-slate-200/90 bg-white px-3 py-2.5 text-[12px] leading-6 text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-400">帮助说明</label>
                      <textarea
                        rows={3}
                        value={selectedCondition.helpText || ''}
                        onChange={(event) => updateSelectedCondition({ helpText: event.target.value })}
                        placeholder="描述这个条件的业务用途、默认取值规则或使用注意事项"
                        className="min-h-[96px] w-full rounded-[16px] border border-slate-200/90 bg-white px-3 py-2.5 text-[12px] leading-6 text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[320px] flex-1 items-center justify-center px-6 py-10 text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)]">
                <span className="material-symbols-outlined text-[28px]">rule_settings</span>
              </div>
              <div className="mt-4 text-[18px] font-semibold text-slate-900 dark:text-slate-50">先选中一条条件</div>
              <p className="mt-2 text-[12px] leading-6 text-slate-500 dark:text-slate-400">
                左边的条件条目现在只负责排布和切换，选中后右侧会展示完整详情。这样拖放和编辑不会抢空间，也更接近你在弹窗里集中配置的使用习惯。
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

type DocumentConditionWorkbenchModalBridgeProps = DocumentConditionToolbarBridgeProps & {
  isOpen: boolean;
  onClose: () => void;
};

export function DocumentConditionWorkbenchModalBridge({
  activeScope,
  canSwitchScope,
  helpers,
  leftConfig,
  mainConfig,
  metrics,
  onClearBuilderSelectionContextMenu,
  onClose,
  onScopeSwitch,
  renderFieldPreview,
  resize,
  isOpen,
}: DocumentConditionWorkbenchModalBridgeProps) {
  const activeConfig = activeScope === 'left' && leftConfig ? leftConfig : mainConfig;
  const activeScopeLabel = activeConfig.scope === 'left' ? '左条件' : '主条件';
  const totalConditionCount = mainConfig.fields.length + (leftConfig?.fields.length ?? 0);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[78] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex h-[80vh] w-full max-w-[1360px] flex-col overflow-hidden rounded-[28px] border border-[#dbe4ee] bg-[#f8fafc] shadow-[0_44px_96px_-36px_rgba(15,23,42,0.34)] dark:border-slate-700 dark:bg-slate-950/96"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#e6edf5] bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-md border border-[#dbe5ef] bg-[#f7fafc] text-[color:var(--workspace-accent)] dark:border-slate-700 dark:bg-slate-900">
                      <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                    </div>
                    <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">条件配置</div>
                  </div>
                  <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                    当前作用域：{activeScopeLabel}，共 {totalConditionCount} 项条件。左边拖放排序、切换作用域和新增删除，右边专门承接点击条件后的详细设置，避免弹窗里只剩条目排布没有配置入口。
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-9 items-center justify-center rounded-md border border-[#dbe5ef] bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-3">
              <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1.12fr)_420px]">
                <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#dbe4ee] bg-white shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950">
                  <div className="border-b border-[#e6edf5] bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(246,249,253,0.94))] px-4 py-3 dark:border-slate-800 dark:bg-slate-950/96">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-50">条件工作台</div>
                        <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                          这里保留条件拖放排序、行内排布和主/左条件切换；点击任意条件，右侧立即切换到对应详情。
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/90 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[14px] text-[color:var(--workspace-accent)]">drag_pan</span>
                        拖放 + 点击双通道
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden px-3 py-3">
                    <MemoDocumentConditionWorkbench
                      activeScope={activeScope}
                      canSwitchScope={canSwitchScope}
                      mainConfig={mainConfig}
                      leftConfig={leftConfig}
                      onScopeSwitch={onScopeSwitch}
                      onActivatePanel={() => undefined}
                      onClearBuilderSelectionContextMenu={onClearBuilderSelectionContextMenu}
                      renderFieldPreview={renderFieldPreview}
                      resize={resize}
                      helpers={helpers}
                      metrics={metrics}
                    />
                  </div>
                </div>

                <ConditionDetailEditor
                  currentConfig={activeConfig}
                  metrics={metrics}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
