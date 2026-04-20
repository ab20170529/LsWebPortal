import React from 'react';
import {
  alignBillHeaderFieldsToFlowLayout,
  BILL_FORM_MAX_CONTROL_HEIGHT,
  BILL_FORM_MAX_WIDTH,
  BILL_FORM_MIN_CONTROL_HEIGHT,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
  BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
} from './dashboard-bill-form-layout-utils';

type LongTextEditorHandler = (
  title: string,
  value: string,
  onSave: (nextValue: string) => void,
  placeholder?: string,
) => void;

type FieldInspectorControllerProps = {
  billFormDefaultLabelWidth: number;
  billFormMinWidth: number;
  businessType: string;
  clearColumnSelection: () => void;
  columnAlignOptions: string[];
  compactCardClass: string;
  compactInfoCardClass: string;
  conditionPanelControlWidth: number;
  conditionPanelResizeMaxWidth: number;
  conditionPanelResizeMinWidth: number;
  context: any;
  defaultFieldSqlTagOptions: Array<Record<string, any>>;
  deleteSelectedColumns: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
  deleteSelectedConditions: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
  fieldClass: string;
  fieldSqlTagLabelFallbacks: Record<number, string>;
  fieldSqlTagOptions: Array<Record<string, any>>;
  fieldTypeOptions: string[];
  getFieldSqlTagOptionLabel: (option: any) => string;
  isCommonPanelTab: boolean;
  isTreeRelationFieldColumn: (column: any) => boolean;
  mainTableColumns: any[];
  mapFieldSqlTagToFieldType: (showId: unknown, optionLabel: string, fallbackType: string) => string;
  mutedLabelClass: string;
  normalizeColumn: (column: any) => any;
  normalizeConditionField: (field: any) => any;
  normalizeFieldSqlTagId: (value: unknown, fallback?: number) => number;
  onOpenLongTextEditor: LongTextEditorHandler;
  onShowToast: (message: string) => void;
  panelBadgeClass: string;
  panelHeaderClass: string;
  panelIconShellClass: string;
  panelShellClass: string;
  panelTitleClass: string;
  renderInspectorTabsNode: React.ReactNode;
  resolveColumnFieldSqlTagId: (column: any) => unknown;
  sectionTitleClass: string;
  tableColumnResizeMinWidth: number;
  textareaClass: string;
  toRecordText: (value: unknown) => string;
};

export function FieldInspectorController({
  billFormDefaultLabelWidth,
  billFormMinWidth,
  businessType,
  clearColumnSelection,
  columnAlignOptions,
  compactCardClass,
  compactInfoCardClass,
  conditionPanelControlWidth,
  conditionPanelResizeMaxWidth,
  conditionPanelResizeMinWidth,
  context,
  defaultFieldSqlTagOptions,
  deleteSelectedColumns,
  deleteSelectedConditions,
  fieldClass,
  fieldSqlTagLabelFallbacks,
  fieldSqlTagOptions,
  getFieldSqlTagOptionLabel,
  isCommonPanelTab,
  isTreeRelationFieldColumn,
  mainTableColumns,
  mapFieldSqlTagToFieldType,
  mutedLabelClass,
  normalizeColumn,
  normalizeConditionField,
  normalizeFieldSqlTagId,
  onOpenLongTextEditor,
  onShowToast,
  panelBadgeClass,
  panelHeaderClass,
  panelIconShellClass,
  panelShellClass,
  panelTitleClass,
  renderInspectorTabsNode,
  resolveColumnFieldSqlTagId,
  sectionTitleClass,
  tableColumnResizeMinWidth,
  textareaClass,
  toRecordText,
}: FieldInspectorControllerProps) {
  const isConditionConfig = context.kind === 'condition';
  const currentColumn = isConditionConfig
    ? normalizeConditionField(context.column)
    : normalizeColumn(context.column);
  const isBillScopedField = businessType === 'table'
    && !isConditionConfig
    && (context.scope === 'main' || context.scope === 'detail');
  const isBillHeaderField = isBillScopedField && context.scope === 'main';
  const useCenteredBillFieldHeader = isBillScopedField;
  const filledCompactCardClass = `${compactCardClass} w-full max-w-none self-stretch`;
  const itemNameLabel = isConditionConfig ? '条件名称' : isBillHeaderField ? '用户名' : '字段名称';
  const itemKeyLabel = isConditionConfig ? '条件标识' : isBillHeaderField ? '字段名' : '字段标识';
  const itemTypeLabel = isConditionConfig ? '当前类型' : isBillHeaderField ? '控件类型' : '当前类型';
  const itemWidthLabel = isConditionConfig ? '当前宽度' : isBillHeaderField ? '控件宽度' : '当前宽度';
  const secondaryMetricLabel = isBillHeaderField ? '标签宽度' : '对齐方式';
  const secondaryMetricValue = isBillHeaderField
    ? `${Math.round(currentColumn.labelWidth || billFormDefaultLabelWidth)}px`
    : currentColumn.align;
  const definitionSectionTitle = isConditionConfig ? '条件定义' : isBillHeaderField ? '控件定义' : '基础定义';
  const billHeaderPositionItems = [
    { key: 'controlLeft', label: '横坐标', value: Math.round(Number(currentColumn.canvasX ?? currentColumn.controlLeft ?? 0) || 0) },
    { key: 'controlTop', label: '纵坐标', value: Math.round(Number(currentColumn.canvasY ?? currentColumn.controlTop ?? 0) || 0) },
  ];

  const updateColumn = (patch: Record<string, any>) => {
    context.setCols((prev: any[]) => {
      const nextFields = prev.map((item) => (
        item.id === currentColumn.id ? { ...item, ...patch } : item
      ));
      if (!isBillHeaderField) {
        return nextFields;
      }

      return alignBillHeaderFieldsToFlowLayout(nextFields, {
        gapX: BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
        gapY: BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
        layoutPaddingX: BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
        layoutPaddingY: BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
        maxHeight: BILL_FORM_MAX_CONTROL_HEIGHT,
        maxWidth: BILL_FORM_MAX_WIDTH,
        minHeight: BILL_FORM_MIN_CONTROL_HEIGHT,
        minRowHeight: BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
        minWidth: billFormMinWidth,
      });
    });
  };

  const removeCurrentColumn = () => {
    if (context.scope === 'filter') {
      deleteSelectedConditions('main', [currentColumn.id]);
      return;
    }

    if (context.scope === 'left-filter') {
      deleteSelectedConditions('left', [currentColumn.id]);
      return;
    }

    if (context.scope === 'detail-filter') {
      deleteSelectedConditions('detail', [currentColumn.id]);
      return;
    }

    if (context.scope === 'left' || context.scope === 'main' || context.scope === 'detail') {
      deleteSelectedColumns(context.scope, [currentColumn.id]);
      return;
    }

    clearColumnSelection();
  };

  const propertySwitches = isConditionConfig
    ? [
        { key: 'required', label: '必填条件', desc: '查询前必须填写该条件' },
        { key: 'visible', label: '界面显示', desc: '控制是否在顶部条件区展示' },
        { key: 'searchable', label: '参与查询', desc: '启用后参与查询条件拼装' },
        { key: 'readonly', label: '只读预设', desc: '适合系统回填或固定条件' },
      ]
    : [
        { key: 'required', label: '必填字段', desc: '保存前必须输入或选择值' },
        { key: 'visible', label: '界面显示', desc: '控制是否在列表或表单中展示' },
        { key: 'searchable', label: '支持搜索', desc: '可作为筛选检索字段参与查询' },
        { key: 'readonly', label: '只读模式', desc: '用于系统回填或计算型字段' },
      ];
  const isSingleTableField = !isConditionConfig && businessType !== 'table';
  const currentFieldSqlTagValue = String(resolveColumnFieldSqlTagId(currentColumn));
  const currentFieldSqlTagLabel = toRecordText(
    currentColumn.fieldSqlTagName
    ?? currentColumn.controlTypeName
    ?? currentColumn.controltypename,
  )
    || fieldSqlTagLabelFallbacks[normalizeFieldSqlTagId(currentFieldSqlTagValue, 0)]
    || currentColumn.type;
  const availableFieldSqlTagOptions = (fieldSqlTagOptions.length > 0 ? fieldSqlTagOptions : defaultFieldSqlTagOptions).reduce<Array<Record<string, any>>>((collection, option) => {
    const optionId = normalizeFieldSqlTagId(option.showid, -1);
    if (optionId < 0 || collection.some((item) => normalizeFieldSqlTagId(item.showid, -1) === optionId)) {
      return collection;
    }

    collection.push({
      showid: optionId,
      showname: getFieldSqlTagOptionLabel(option),
    });
    return collection;
  }, []);
  if (!availableFieldSqlTagOptions.some((option) => String(normalizeFieldSqlTagId(option.showid, -1)) === currentFieldSqlTagValue)) {
    availableFieldSqlTagOptions.unshift({
      showid: normalizeFieldSqlTagId(currentFieldSqlTagValue, 0),
      showname: currentFieldSqlTagLabel || `类型 ${currentFieldSqlTagValue}`,
    });
  }
  const existingTreeRelationColumn = isSingleTableField
    ? mainTableColumns.find((column) => isTreeRelationFieldColumn(column)) ?? null
    : null;
  const hasOtherTreeRelationField = Boolean(existingTreeRelationColumn && existingTreeRelationColumn.id !== currentColumn.id);
  const selectableFieldSqlTagOptions = isConditionConfig
    ? availableFieldSqlTagOptions.filter((option) => {
        const optionLabel = getFieldSqlTagOptionLabel(option);
        return mapFieldSqlTagToFieldType(option.showid, optionLabel, '文本') !== '树形节点关联';
      })
    : availableFieldSqlTagOptions;

  const handleFieldTypeChange = (nextValue: string) => {
    const selectedOption = selectableFieldSqlTagOptions.find((option) => String(normalizeFieldSqlTagId(option.showid, -1)) === nextValue);
    if (!selectedOption) {
      return;
    }

    const nextFieldType = mapFieldSqlTagToFieldType(selectedOption.showid, getFieldSqlTagOptionLabel(selectedOption), currentColumn.type);
    if (isSingleTableField && nextFieldType === '树形节点关联' && hasOtherTreeRelationField) {
      onShowToast(`树形节点关联已被字段「${normalizeColumn(existingTreeRelationColumn).name}」占用，其他列不能重复选择。`);
      return;
    }

    updateColumn({
      type: nextFieldType,
      fieldSqlTag: normalizeFieldSqlTagId(selectedOption.showid, 0),
      fieldSqlTagName: getFieldSqlTagOptionLabel(selectedOption),
      controltype: normalizeFieldSqlTagId(selectedOption.showid, 0),
      controlType: normalizeFieldSqlTagId(selectedOption.showid, 0),
      controltypename: getFieldSqlTagOptionLabel(selectedOption),
      controlTypeName: getFieldSqlTagOptionLabel(selectedOption),
    });
  };

  const currentTypeDisplayLabel = isConditionConfig ? currentColumn.type : currentFieldSqlTagLabel;
  const currentWidthDisplayLabel = `${Math.round(
    isConditionConfig
      ? currentColumn.width || conditionPanelControlWidth
      : currentColumn.width,
  )}px`;
  const commonPropertySwitches = propertySwitches.filter((item) => item.key !== 'readonly');
  const advancedPropertySwitches = propertySwitches.filter((item) => item.key === 'readonly');
  const legacyTableMeta = isConditionConfig
    ? context.scope === 'filter'
      ? {
          table: 'p_systembillsourcecond',
          hint: '主表条件的控件、默认值和联动规则统一落这个条件表。',
        }
      : context.scope === 'left-filter'
        ? {
            table: 'p_systembillsourcecond',
            hint: '左侧条件也写入 p_systembillsourcecond，并带上所属树形字段的 sourceid 与 formKey。',
          }
        : {
            table: 'p_systembillsourcecond',
            hint: '明细条件也按条件配置表维护，方便后续统一拼装查询条件。',
          }
    : context.scope === 'left'
      ? {
          table: 'p_systemwordbookgrid',
          hint: '左侧树节点展开后的列配置、显示字段和宽度统一按树表字段配置表维护。',
        }
      : businessType !== 'table'
        ? {
            table: 'p_systemwordbooktab',
            hint: '当前列的名称、标识、交互、联动和展示属性都按字段配置表统一维护。',
          }
        : null;

  return (
    <div className={panelShellClass}>
      <div className={panelHeaderClass}>
        <div className="flex items-start justify-between gap-4">
          <div className={`flex min-w-0 gap-3 ${useCenteredBillFieldHeader ? 'items-center' : 'items-start'}`}>
            <div className={`${panelIconShellClass} ${context.iconClass}`}>
              <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
            </div>
            <div className={`min-w-0 ${useCenteredBillFieldHeader ? 'flex min-h-10 items-center' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={panelTitleClass}>{currentColumn.name}</h3>
                {!isBillScopedField ? (
                  <span className={panelBadgeClass}>{context.title}</span>
                ) : null}
                {legacyTableMeta ? (
                  <span className="inline-flex items-center rounded-full border border-[#1686e3]/18 bg-[#1686e3]/8 px-2.5 py-1 text-[10px] font-bold text-[#1686e3]">
                    {legacyTableMeta.table}
                  </span>
                ) : null}
              </div>
              {legacyTableMeta ? (
                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{legacyTableMeta.hint}</p>
              ) : null}
            </div>
          </div>
          <button
            onClick={removeCurrentColumn}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-200/70 bg-white text-rose-400 shadow-sm transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:border-rose-500/20 dark:bg-slate-900 dark:text-rose-300"
            title={context.removeLabel}
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
        {renderInspectorTabsNode}
      </div>

      <div className="flex min-h-0 flex-1 w-full flex-col overflow-y-auto px-0 py-0">
        <div className="w-full space-y-5">
          {!isBillScopedField ? (
            <section className={filledCompactCardClass}>
              <div className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
                <div className="min-w-0">
                  <h4>当前摘要</h4>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className={compactInfoCardClass}>
                  <div className="text-[11px] font-medium text-slate-400">{itemTypeLabel}</div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-700 dark:text-slate-100">
                    {currentTypeDisplayLabel || '未设置'}
                  </div>
                </div>
                <div className={compactInfoCardClass}>
                  <div className="text-[11px] font-medium text-slate-400">{itemWidthLabel}</div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-700 dark:text-slate-100">
                    {currentWidthDisplayLabel}
                  </div>
                </div>
                <div className={compactInfoCardClass}>
                  <div className="text-[11px] font-medium text-slate-400">{secondaryMetricLabel}</div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-700 dark:text-slate-100">
                    {secondaryMetricValue || '未设置'}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {isCommonPanelTab ? (
            <>
              <section className={filledCompactCardClass}>
                <div className={sectionTitleClass}>
                  <span className="material-symbols-outlined text-[16px] text-primary">view_list</span>
                  <div className="min-w-0">
                    <h4>{definitionSectionTitle}</h4>
                  </div>
                </div>
                <div className="grid w-full gap-4">
                  <div className={isBillScopedField ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
                    <div>
                      <label className={mutedLabelClass}>{itemNameLabel}</label>
                      <input
                        type="text"
                        value={currentColumn.name}
                        onChange={(e) => updateColumn({
                          name: e.target.value,
                          userName: e.target.value,
                          username: e.target.value,
                          username1: e.target.value,
                          displayName: e.target.value,
                        })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={mutedLabelClass}>{itemKeyLabel}</label>
                      <input
                        type="text"
                        value={currentColumn.sourceField || ''}
                        onChange={(e) => updateColumn({
                          sourceField: e.target.value,
                          fieldName: e.target.value,
                          fieldname: e.target.value,
                        })}
                        placeholder={isConditionConfig ? '例如：status_keyword' : '例如：material_code'}
                        className={`${fieldClass} font-mono text-[12px]`}
                      />
                    </div>
                  </div>
                  {isBillHeaderField ? (
                    <>
                      <div>
                        <label className={mutedLabelClass}>控件类型</label>
                        <select
                          value={currentFieldSqlTagValue}
                          onChange={(e) => handleFieldTypeChange(e.target.value)}
                          className={fieldClass}
                        >
                          {selectableFieldSqlTagOptions.map((option) => {
                            const optionId = normalizeFieldSqlTagId(option.showid, -1);
                            const optionLabel = getFieldSqlTagOptionLabel(option);
                            return (
                              <option key={optionId} value={String(optionId)}>
                                {optionLabel}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="grid gap-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 px-3.5 py-3 transition-all hover:border-[color:var(--workspace-accent-soft)] hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/35 dark:hover:bg-slate-900/55">
                          <input
                            type="checkbox"
                            className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                            checked={Boolean(currentColumn.required)}
                            onChange={(e) => updateColumn({ required: e.target.checked })}
                          />
                          <div>
                            <div className="text-[12px] font-bold text-slate-700 dark:text-slate-100">必填</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">来自主字段配置，可直接修改</div>
                          </div>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 px-3.5 py-3 transition-all hover:border-[color:var(--workspace-accent-soft)] hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/35 dark:hover:bg-slate-900/55">
                          <input
                            type="checkbox"
                            className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                            checked={Boolean(currentColumn.readonly)}
                            onChange={(e) => updateColumn({ readonly: e.target.checked })}
                          />
                          <div>
                            <div className="text-[12px] font-bold text-slate-700 dark:text-slate-100">禁编</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">对应主字段的编辑状态</div>
                          </div>
                        </label>
                      </div>
                    </>
                  ) : null}
                  {!isConditionConfig && !isBillHeaderField ? (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <label className={`${mutedLabelClass} mb-0`}>动态 SQL</label>
                        <button
                          type="button"
                          onClick={() => onOpenLongTextEditor(
                            `${currentColumn.name || '字段'} · 动态 SQL`,
                            currentColumn.dynamicSql || '',
                            (nextValue) => updateColumn({ dynamicSql: nextValue }),
                            '例如：SELECT node_id, node_name, parent_id FROM ...',
                          )}
                          className="inline-flex h-7 items-center gap-1 rounded-full border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] px-3 text-[10px] font-bold text-[color:var(--workspace-accent-strong)] transition-colors hover:bg-[color:var(--workspace-accent-tint)]"
                        >
                          <span className="material-symbols-outlined text-[13px]">open_in_full</span>
                          详情编辑
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={currentColumn.dynamicSql}
                        onChange={(e) => updateColumn({ dynamicSql: e.target.value })}
                        placeholder="例如：SELECT node_id, node_name, parent_id FROM ..."
                        className={`${textareaClass} min-h-[124px]`}
                      />
                    </div>
                  ) : null}
                  {!isBillHeaderField ? (
                    <div className={`grid gap-4 ${isBillScopedField ? '' : 'sm:grid-cols-2'}`}>
                      <div>
                        <label className={mutedLabelClass}>{isConditionConfig || isBillHeaderField ? '控件类型' : '字段类型'}</label>
                        <select
                          value={currentFieldSqlTagValue}
                          onChange={(e) => handleFieldTypeChange(e.target.value)}
                          className={fieldClass}
                        >
                          {selectableFieldSqlTagOptions.map((option) => {
                                const optionId = normalizeFieldSqlTagId(option.showid, -1);
                                const optionLabel = getFieldSqlTagOptionLabel(option);
                                const optionFieldType = mapFieldSqlTagToFieldType(option.showid, optionLabel, '文本');
                                const isTreeRelationOption = optionFieldType === '树形节点关联';
                                const isDisabled = isTreeRelationOption && hasOtherTreeRelationField && String(optionId) !== currentFieldSqlTagValue;

                                return (
                                  <option key={optionId} value={String(optionId)} disabled={isDisabled}>
                                    {optionLabel}
                                  </option>
                                );
                              })}
                        </select>
                        {!isConditionConfig && hasOtherTreeRelationField ? (
                          <div className="mt-2 rounded-[14px] border border-sky-200/70 bg-sky-50/85 px-3 py-2 text-[11px] font-medium leading-5 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                            树形节点关联已由“{normalizeColumn(existingTreeRelationColumn).name}”使用，当前列不能重复选择。
                          </div>
                        ) : null}
                      </div>
                      {isConditionConfig ? (
                        <div>
                          <label className={mutedLabelClass}>控件总宽度</label>
                          <input
                            type="number"
                            min={conditionPanelResizeMinWidth}
                            max={conditionPanelResizeMaxWidth}
                            value={Math.round(currentColumn.width || conditionPanelControlWidth)}
                            onChange={(e) => updateColumn({
                              width: Math.max(
                                conditionPanelResizeMinWidth,
                                Math.min(
                                  conditionPanelResizeMaxWidth,
                                  Number(e.target.value) || conditionPanelControlWidth,
                                ),
                              ),
                            })}
                            className={fieldClass}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className={mutedLabelClass}>{isBillHeaderField ? '控件宽度 (px)' : '列宽 (px)'}</label>
                          <input
                            type="number"
                            min={isBillHeaderField ? billFormMinWidth : tableColumnResizeMinWidth}
                            value={Math.round(currentColumn.width)}
                            onChange={(e) => updateColumn({
                              width: Math.max(
                                isBillHeaderField ? billFormMinWidth : tableColumnResizeMinWidth,
                                Number(e.target.value) || (isBillHeaderField ? billFormMinWidth : tableColumnResizeMinWidth),
                              ),
                            })}
                            className={fieldClass}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                  {!isBillHeaderField ? (
                    <div className={`grid gap-4 ${isBillScopedField ? '' : 'sm:grid-cols-2'}`}>
                      <div>
                        <label className={mutedLabelClass}>对齐方式</label>
                        <select
                          value={currentColumn.align}
                          onChange={(e) => updateColumn({ align: e.target.value })}
                          className={fieldClass}
                        >
                          {columnAlignOptions.map((align) => (
                            <option key={align} value={align}>
                              {align}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={mutedLabelClass}>默认值</label>
                        <input
                          type="text"
                          value={currentColumn.defaultValue}
                          onChange={(e) => updateColumn({ defaultValue: e.target.value })}
                          placeholder="例如：默认状态、初始值"
                          className={fieldClass}
                        />
                      </div>
                    </div>
                  ) : null}
                  {!isBillHeaderField ? (
                    <div>
                      <label className={mutedLabelClass}>{isConditionConfig ? '提示文案' : '占位提示'}</label>
                      <input
                        type="text"
                        value={currentColumn.placeholder}
                        onChange={(e) => updateColumn({ placeholder: e.target.value })}
                        placeholder={isConditionConfig ? '输入提示文案' : '输入占位提示'}
                        className={fieldClass}
                      />
                    </div>
                  ) : null}
                </div>
              </section>

              {isBillHeaderField ? (
                <section className={filledCompactCardClass}>
                  <div className={sectionTitleClass}>
                    <span className="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
                    <div className="min-w-0">
                      <h4>位置信息</h4>
                    </div>
                  </div>
                  <div className="grid w-full gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {billHeaderPositionItems.map((item) => (
                        <div key={item.key}>
                          <label className={mutedLabelClass}>{item.label}</label>
                          <input
                            type="text"
                            value={`${item.value}px`}
                            readOnly
                            className={`${fieldClass} cursor-default bg-slate-50/70 text-slate-600`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={mutedLabelClass}>宽度</label>
                        <input
                          type="number"
                          min={billFormMinWidth}
                          max={BILL_FORM_MAX_WIDTH}
                          value={Math.round(Number(currentColumn.width ?? currentColumn.controlWidth ?? billFormMinWidth) || billFormMinWidth)}
                          onChange={(e) => {
                            const nextWidth = Math.max(
                              billFormMinWidth,
                              Math.min(BILL_FORM_MAX_WIDTH, Number(e.target.value) || billFormMinWidth),
                            );
                            updateColumn({
                              controlWidth: nextWidth,
                              width: nextWidth,
                            });
                          }}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={mutedLabelClass}>高度</label>
                        <input
                          type="number"
                          min={BILL_FORM_MIN_CONTROL_HEIGHT}
                          max={BILL_FORM_MAX_CONTROL_HEIGHT}
                          value={Math.round(Number(currentColumn.controlHeight ?? currentColumn.layoutHeight ?? BILL_FORM_MIN_CONTROL_HEIGHT) || BILL_FORM_MIN_CONTROL_HEIGHT)}
                          onChange={(e) => {
                            const nextHeight = Math.max(
                              BILL_FORM_MIN_CONTROL_HEIGHT,
                              Math.min(BILL_FORM_MAX_CONTROL_HEIGHT, Number(e.target.value) || BILL_FORM_MIN_CONTROL_HEIGHT),
                            );
                            updateColumn({
                              controlHeight: nextHeight,
                              layoutHeight: nextHeight,
                            });
                          }}
                          className={fieldClass}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section className={filledCompactCardClass}>
                  <div className={sectionTitleClass}>
                    <span className="material-symbols-outlined text-[16px] text-primary">toggle_on</span>
                    <div className="min-w-0">
                      <h4>{isConditionConfig ? '条件属性' : '交互属性'}</h4>
                    </div>
                  </div>
                  <div className={`grid gap-3 ${isBillScopedField ? '' : 'sm:grid-cols-2'}`}>
                    {commonPropertySwitches.map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 px-3.5 py-3 transition-all hover:border-[color:var(--workspace-accent-soft)] hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/35 dark:hover:bg-slate-900/55"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={Boolean(currentColumn[item.key])}
                          onChange={(e) => updateColumn({ [item.key]: e.target.checked })}
                        />
                        <div>
                          <div className="text-[12px] font-bold text-slate-700 dark:text-slate-100">{item.label}</div>
                          <div className="mt-0.5 text-[10px] text-slate-400">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              <section className={filledCompactCardClass}>
                <div className={sectionTitleClass}>
                  <span className="material-symbols-outlined text-[16px] text-primary">toggle_on</span>
                  <div className="min-w-0">
                    <h4>高级属性</h4>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {advancedPropertySwitches.map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 px-3.5 py-3 transition-all hover:border-[color:var(--workspace-accent-soft)] hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/35 dark:hover:bg-slate-900/55"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={Boolean(currentColumn[item.key])}
                          onChange={(e) => updateColumn({ [item.key]: e.target.checked })}
                        />
                        <div>
                          <div className="text-[12px] font-bold text-slate-700 dark:text-slate-100">{item.label}</div>
                          <div className="mt-0.5 text-[10px] text-slate-400">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className={mutedLabelClass}>帮助文案</label>
                    <textarea
                      rows={3}
                      value={currentColumn.helpText}
                      onChange={(e) => updateColumn({ helpText: e.target.value })}
                      placeholder="输入字段说明"
                      className={textareaClass}
                    />
                  </div>
                </div>
              </section>

              <section className={filledCompactCardClass}>
                <div className={sectionTitleClass}>
                  <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
                  <div className="min-w-0">
                    <h4>{isConditionConfig ? '查询联动' : '业务联动'}</h4>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={mutedLabelClass}>{isConditionConfig ? '下拉数据 / 值集' : '关联字典 / 值集'}</label>
                      <input
                        type="text"
                        value={currentColumn.dictCode}
                        onChange={(e) => updateColumn({ dictCode: e.target.value })}
                        placeholder={isConditionConfig ? '输入值集或逗号分隔选项' : '输入字典编码或值集'}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={mutedLabelClass}>{isConditionConfig ? '默认表达式' : '公式 / 计算表达式'}</label>
                      <input
                        type="text"
                        value={currentColumn.formula}
                        onChange={(e) => updateColumn({ formula: e.target.value })}
                        placeholder={isConditionConfig ? '例如：today() / 本月 / 当前组织' : '例如：price * qty'}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={mutedLabelClass}>{isConditionConfig ? '条件 SQL / 取数逻辑' : '关联 SQL'}</label>
                    <textarea
                      rows={3}
                      value={currentColumn.relationSql}
                      onChange={(e) => updateColumn({ relationSql: e.target.value })}
                      placeholder={isConditionConfig ? 'SELECT code, name FROM ...' : 'SELECT id, name FROM ... '}
                      className={textareaClass}
                    />
                  </div>
                  {isConditionConfig ? (
                    <div>
                      <label className={mutedLabelClass}>联动 SQL / 条件表达式</label>
                      <textarea
                        rows={3}
                        value={currentColumn.dynamicSql}
                        onChange={(e) => updateColumn({ dynamicSql: e.target.value })}
                        placeholder="WHERE org_id = ${orgId} AND enable = 1"
                        className={textareaClass}
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
