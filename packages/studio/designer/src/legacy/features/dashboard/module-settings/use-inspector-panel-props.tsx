import { useCallback, useMemo, type CSSProperties, type Dispatch, type MouseEvent, type PointerEvent, type ReactNode, type SetStateAction } from 'react';

import {
  shadcnFieldClass,
  shadcnInspectorActionButtonClass,
  shadcnInspectorSectionClass,
  shadcnMutedLabelClass,
  shadcnPanelHeaderClass,
  shadcnPanelIconShellClass,
  shadcnPanelShellClass,
  shadcnPanelTitleClass,
  shadcnSectionTitleClass,
  shadcnTextareaClass,
} from '../../../components/ui/shadcn-inspector';
import { getDetailBoardTheme } from './detail-board-config';
import { type GridFieldSettingsOpenRequest } from './grid-field-settings-modal-types';
import { type InspectorPanelRouterProps } from './inspector-panel-router';

export type UseInspectorPanelPropsOptions = {
  DesignerWorkbenchDraggableItem: any;
  DesignerWorkbenchDropLane: any;
  activateColumnSelection: (scope: 'left' | 'main' | 'detail', columnId: string | null) => void;
  activateSourceGridSelection: () => void;
  activeBillSourceId: string | null;
  activeDetailBoardResize: any;
  activeTab: string;
  applyDetailModuleInheritanceById: (tabId: string, moduleCode: string, options?: { notify?: boolean }) => Promise<boolean>;
  billDetailColumns: any[];
  billFormDefaultFontSize: number;
  billFormDefaultLabelWidth: number;
  billFormMinWidth: number;
  billHeaderWorkbenchMaxRows: number;
  billHeaderWorkbenchMinRows: number;
  billMetaFields: any[];
  billSourceDraft: Record<string, any>;
  billSourceDraftMode: 'create' | 'edit';
  billSourceFieldMap: Record<string, any>;
  billSources: any[];
  billSourceConfigTypeOptions: string[];
  billSourceTypeOptions: string[];
  buildGridColorRule: (index: number, overrides?: Record<string, any>) => any;
  businessType: string;
  clearColumnSelection: () => void;
  consumeFieldSettingsOpenRequest: () => void;
  columnAlignOptions: any[];
  conditionPanelControlWidth: number;
  conditionPanelResizeMaxWidth: number;
  conditionPanelResizeMinWidth: number;
  currentMenuDraft: Record<string, any>;
  currentModuleCode: string;
  currentModuleName: string;
  defaultFieldSqlTagOptions: any[];
  deleteSelectedColumns: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
  deleteSelectedConditions: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
  deleteDetailTabById: (tabId: string) => void;
  designerWorkbenchSensors: any;
  detailBoardClipboardIds: string[];
  detailBoardFieldDefaultWidth: number;
  detailBoardThemeOptions: ReadonlyArray<any>;
  detailChartTypeOptions: any[];
  detailFillTypeOptions: any[];
  detailTableColumns: Record<string, any[]>;
  detailTabRelationSectionProps?: Record<string, any> | null;
  detailSourceModuleCandidates: any[];
  detailTabs: Array<{ id: string; name: string }>;
  documentConditionOwnerSourceId: string;
  fieldSqlTagLabelFallbacks: Record<string, string>;
  fieldSqlTagOptions: any[];
  fieldTypeOptions: any[];
  getBillHeaderRowCount: () => number;
  getDetailFillTypeBackendValue: (fillType?: string) => string;
  getDetailFillTypeByTabId: (tabId: string) => string;
  getDetailFillTypeMeta: (fillType?: string) => Record<string, any>;
  getDetailTabConfigById: (tabId: string) => Record<string, any>;
  getFieldSqlTagOptionLabel: (option: any) => string;
  getOrderedBillHeaderFields: (...args: any[]) => any[];
  gridColorRuleOperatorOptions: any[];
  handleConditionPanelFieldSelect: (scope: 'left' | 'main', fieldId: string) => void;
  handleDetailModuleCodeChange: (tabId: string, rawModuleCode: string, options?: { notify?: boolean }) => void;
  inspectorPanelTab: any;
  inspectorTarget: any;
  isGeneratingSqlDraft: boolean;
  isTranslatingIdentifiers: boolean;
  isTreeRelationFieldColumn: (column: any) => boolean;
  leftFilterFields: any[];
  loadSingleTableDetailResourcesById: (tabId: string, explicitFillType?: string) => Promise<void>;
  mainTableHiddenColumnsCount: number;
  mainTableColumns: any[];
  mapFieldSqlTagToFieldType: (tagId: string) => string;
  normalizeColumn: (column: any) => any;
  normalizeConditionField: (field: any) => any;
  normalizeDetailChartConfig: (config: any) => any;
  normalizeDetailFillTypeValue: (fillType?: string | null) => string;
  normalizeFieldSqlTagId: (value: unknown, fallback?: number) => number;
  onOpenArchiveLayoutEditor: () => void;
  onOpenConditionWorkbench: (scope: 'left' | 'main') => void;
  fieldSettingsOpenRequest: GridFieldSettingsOpenRequest;
  onOpenMainHiddenColumnsModal: () => void;
  onOpenDetailBoardPreview: (rowId: number, preferredSortColumnId?: string | null) => void;
  onResetDetailBoardFieldWidth: (event: MouseEvent<HTMLButtonElement>, groupId: string, columnId: string) => void;
  onStartDetailBoardFieldResize: (event: MouseEvent<HTMLButtonElement>, groupId: string, columnId: string, label: string, minWidthOverride?: number) => void;
  parseDetailBoardClipboardColumnIds: (text: string, availableColumns: any[]) => string[];
  renderFieldPreview: (rawField: any, rowIndex: number, mode?: 'table' | 'filter' | 'condition') => ReactNode;
  resolveColumnFieldSqlTagId: (column: any) => unknown;
  selectedColumnContext: any | null;
  selectedDetailBoardGroupId: any;
  selectedDetailColorRuleId: string | null;
  selectedDetailContextMenuId: string | null;
  selectedLeftColorRuleId: string | null;
  selectedLeftContextMenuId: string | null;
  selectedMainColorRuleId: string | null;
  selectedMainContextMenuId: string | null;
  selectedPopupMenuParamKey: string | null;
  setBillDetailColumns: Dispatch<SetStateAction<any[]>>;
  setBillMetaFields: Dispatch<SetStateAction<any[]>>;
  setDetailTableColumns: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTabs: Dispatch<SetStateAction<Array<{ id: string; name: string }>>>;
  setInspectorPanelTab: (tabId: any) => void;
  setInspectorTarget: Dispatch<SetStateAction<any>>;
  setIsGeneratingSqlDraft: Dispatch<SetStateAction<boolean>>;
  setIsTranslatingIdentifiers: Dispatch<SetStateAction<boolean>>;
  setLeftTableColumns: Dispatch<SetStateAction<any[]>>;
  setLongTextEditorState: Dispatch<SetStateAction<any>>;
  setMainTableColumns: Dispatch<SetStateAction<any[]>>;
  setSelectedDetailBoardGroupId: Dispatch<SetStateAction<any>>;
  setSelectedDetailColorRuleId: Dispatch<SetStateAction<string | null>>;
  setSelectedDetailContextMenuId: Dispatch<SetStateAction<string | null>>;
  setSelectedLeftColorRuleId: Dispatch<SetStateAction<string | null>>;
  setSelectedLeftContextMenuId: Dispatch<SetStateAction<string | null>>;
  setSelectedMainColorRuleId: Dispatch<SetStateAction<string | null>>;
  setSelectedMainContextMenuId: Dispatch<SetStateAction<string | null>>;
  setSelectedMainForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedPopupMenuParamKey: Dispatch<SetStateAction<string | null>>;
  setWorkspaceTheme: Dispatch<SetStateAction<string>>;
  showToast: (message: string) => void;
  saveCurrentPage: (options?: {
    gridColumnsOverride?: {
      rows: any[];
      scope: 'left-grid' | 'main-grid' | 'detail-grid';
      tabId?: string;
    };
    silent?: boolean;
  }) => Promise<boolean>;
  createBillSourceDraft: () => void;
  deleteBillSourceById: (sourceId: string) => void;
  saveBillSourceDraft: () => void;
  selectBillSourceDraft: (source: any) => void;
  syncDetailColumnsFromSqlById: (tabId: string, sql: string, options?: { notify?: boolean }) => boolean;
  tableColumnResizeMinWidth: number;
  tableTypeOptions: any[];
  toRecordText: (value: unknown, fallback?: number) => string | number;
  treeRelationColumn: any;
  updateActiveDetailTabConfig: (patch: Record<string, any>) => void;
  updateActiveDetailTabType: (nextType: string) => void;
  updateBillHeaderWorkbenchRows: (nextRows: number) => void;
  updateBillSourceById: (sourceId: string, patch: Record<string, any>) => void;
  updateBillSourceDraft: (patch: Record<string, any>) => void;
  updateDetailTabConfigById: (tabId: string, updater: SetStateAction<Record<string, any>>) => void;
  workspaceTheme: string;
  workspaceThemeVars: CSSProperties;
};

export function useInspectorPanelProps({
  DesignerWorkbenchDraggableItem,
  DesignerWorkbenchDropLane,
  activateColumnSelection,
  activateSourceGridSelection,
  activeBillSourceId,
  activeDetailBoardResize,
  activeTab,
  applyDetailModuleInheritanceById,
  billFormDefaultFontSize,
  billFormDefaultLabelWidth,
  billFormMinWidth,
  billHeaderWorkbenchMaxRows,
  billHeaderWorkbenchMinRows,
  billMetaFields,
  billSourceFieldMap,
  billSources,
  buildGridColorRule,
  businessType,
  clearColumnSelection,
  consumeFieldSettingsOpenRequest,
  columnAlignOptions,
  conditionPanelControlWidth,
  conditionPanelResizeMaxWidth,
  conditionPanelResizeMinWidth,
  currentMenuDraft,
  currentModuleCode,
  currentModuleName,
  defaultFieldSqlTagOptions,
  deleteDetailTabById,
  deleteSelectedColumns,
  deleteSelectedConditions,
  designerWorkbenchSensors,
  detailBoardClipboardIds,
  detailBoardFieldDefaultWidth,
  detailBoardThemeOptions,
  detailChartTypeOptions,
  detailFillTypeOptions,
  detailTabRelationSectionProps,
  detailSourceModuleCandidates,
  detailTabs,
  documentConditionOwnerSourceId,
  fieldSqlTagLabelFallbacks,
  fieldSqlTagOptions,
  fieldTypeOptions,
  getBillHeaderRowCount,
  getDetailFillTypeBackendValue,
  getDetailFillTypeByTabId,
  getDetailFillTypeMeta,
  getDetailTabConfigById,
  getFieldSqlTagOptionLabel,
  getOrderedBillHeaderFields,
  gridColorRuleOperatorOptions,
  handleConditionPanelFieldSelect,
  handleDetailModuleCodeChange,
  inspectorPanelTab,
  inspectorTarget,
  isGeneratingSqlDraft,
  isTranslatingIdentifiers,
  isTreeRelationFieldColumn,
  leftFilterFields,
  loadSingleTableDetailResourcesById,
  mainTableHiddenColumnsCount,
  mainTableColumns,
  mapFieldSqlTagToFieldType,
  normalizeColumn,
  normalizeConditionField,
  normalizeDetailChartConfig,
  normalizeDetailFillTypeValue,
  normalizeFieldSqlTagId,
  onOpenArchiveLayoutEditor,
  onOpenConditionWorkbench,
  fieldSettingsOpenRequest,
  onOpenMainHiddenColumnsModal,
  onOpenDetailBoardPreview,
  onResetDetailBoardFieldWidth,
  onStartDetailBoardFieldResize,
  parseDetailBoardClipboardColumnIds,
  renderFieldPreview,
  resolveColumnFieldSqlTagId,
  selectedColumnContext,
  selectedDetailBoardGroupId,
  selectedDetailColorRuleId,
  selectedDetailContextMenuId,
  selectedLeftColorRuleId,
  selectedLeftContextMenuId,
  selectedMainColorRuleId,
  selectedMainContextMenuId,
  selectedPopupMenuParamKey,
  setBillDetailColumns,
  setBillMetaFields,
  setDetailTableColumns,
  setDetailTabs,
  setInspectorPanelTab,
  setInspectorTarget,
  setIsGeneratingSqlDraft,
  setIsTranslatingIdentifiers,
  setLeftTableColumns,
  setLongTextEditorState,
  setMainTableColumns,
  setSelectedDetailBoardGroupId,
  setSelectedDetailColorRuleId,
  setSelectedDetailContextMenuId,
  setSelectedLeftColorRuleId,
  setSelectedLeftContextMenuId,
  setSelectedMainColorRuleId,
  setSelectedMainContextMenuId,
  setSelectedMainForDelete,
  setSelectedPopupMenuParamKey,
  setWorkspaceTheme,
  showToast,
  saveCurrentPage,
  deleteBillSourceById,
  selectBillSourceDraft,
  syncDetailColumnsFromSqlById,
  tableColumnResizeMinWidth,
  tableTypeOptions,
  toRecordText,
  treeRelationColumn,
  updateActiveDetailTabConfig,
  updateActiveDetailTabType,
  updateBillHeaderWorkbenchRows,
  updateBillSourceById,
  updateDetailTabConfigById,
  workspaceTheme,
  workspaceThemeVars,
}: UseInspectorPanelPropsOptions): InspectorPanelRouterProps {
  const renderAdvancedPlaceholder = useCallback((title: string) => (
    <section className="rounded-md border border-dashed border-slate-200/80 bg-slate-50/50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-900/35">
      <div className="mx-auto flex size-10 items-center justify-center rounded-md border border-slate-200/80 bg-white text-[#1686e3] dark:border-slate-700 dark:bg-slate-900">
        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
      </div>
      <div className="mt-3 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{title}</div>
    </section>
  ), []);

  const updateGridColumnsForScope = useCallback((scope: string, updater: SetStateAction<any[]>) => {
    if (scope === 'left-grid') {
      setLeftTableColumns((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      return;
    }

    if (scope === 'main-grid') {
      if (businessType === 'table') {
        const metaIdSet = new Set(billMetaFields.map((field) => field.id));
        const currentFields = [...billMetaFields, ...mainTableColumns];
        const nextFields = typeof updater === 'function' ? updater(currentFields) : updater;

        setBillMetaFields(nextFields.filter((field) => metaIdSet.has(field.id)));
        setMainTableColumns(nextFields.filter((field) => !metaIdSet.has(field.id)));
        return;
      }

      setMainTableColumns((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      return;
    }

    if (businessType === 'table') {
      setBillDetailColumns((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      return;
    }

    setDetailTableColumns((prev) => ({
      ...prev,
      [activeTab]: typeof updater === 'function' ? updater(prev[activeTab] || []) : updater,
    }));
  }, [
    activeTab,
    billMetaFields,
    businessType,
    mainTableColumns,
    setBillDetailColumns,
    setBillMetaFields,
    setDetailTableColumns,
    setLeftTableColumns,
    setMainTableColumns,
  ]);

  return useMemo(() => {
    const fieldClass = shadcnFieldClass;
    const textareaClass = shadcnTextareaClass;
    const panelShellClass = shadcnPanelShellClass;
    const panelHeaderClass = shadcnPanelHeaderClass;
    const panelTitleClass = shadcnPanelTitleClass;
    const panelIconShellClass = `${shadcnPanelIconShellClass} size-10 rounded-lg`;
    const compactCardClass = shadcnInspectorSectionClass;
    const sectionTitleClass = shadcnSectionTitleClass;
    const mutedLabelClass = shadcnMutedLabelClass;
    const quietDocumentInspectorActionClass = shadcnInspectorActionButtonClass;

    const detailTabContext = selectedColumnContext?.kind === 'detail-tab' ? selectedColumnContext : null;
    const currentDetailTabConfig = detailTabContext?.column;
    const currentTabId = activeTab;
    const currentTabMeta = detailTabs.find((tab) => tab.id === currentTabId);
    const currentTabName = currentTabMeta?.name || currentDetailTabConfig?.detailName || '当前明细模块';
    const contextMenuContext = selectedColumnContext?.kind === 'contextmenu' ? selectedColumnContext : null;

    return {
      activeTab,
      businessType,
      conditionPanelProps: {
        context: selectedColumnContext,
        workspaceThemeVars,
        metrics: {
          controlWidth: conditionPanelControlWidth,
          maxRows: 4,
          minRows: 1,
        },
        normalizeField: normalizeConditionField,
        onSelectField: handleConditionPanelFieldSelect,
      },
      contextMenuProps: {
        context: contextMenuContext,
        onUpdateConfig: (patch: Record<string, any>) => {
          if (!contextMenuContext) return;
          contextMenuContext.setCols((prev: Record<string, any>) => ({
            ...prev,
            ...patch,
          }));
        },
      },
      detailTabProps: {
        context: detailTabContext,
        currentModuleCode,
        currentTabConfig: currentDetailTabConfig,
        currentTabId,
        currentTabName,
        detailFillTypeOptions,
        normalizedDetailType: normalizeDetailFillTypeValue(currentDetailTabConfig?.detailType),
        onDeleteTab: () => deleteDetailTabById(currentTabId),
        relationSectionProps: detailTabRelationSectionProps,
        onUpdateTabConfig: updateActiveDetailTabConfig,
        onUpdateTabType: updateActiveDetailTabType,
      },
      emptyInspectorProps: {
        workspaceThemeVars,
      },
      fieldProps: {
        activateSourceGridSelection,
        billFormDefaultFontSize,
        billFormDefaultLabelWidth,
        billFormMinWidth,
        billSourceFieldMap,
        billSources,
        businessType,
        clearColumnSelection,
        columnAlignOptions,
        compactCardClass,
        conditionPanelControlWidth,
        conditionPanelResizeMaxWidth,
        conditionPanelResizeMinWidth,
        context: selectedColumnContext,
        defaultFieldSqlTagOptions,
        deleteSelectedColumns,
        deleteSelectedConditions,
        fieldClass,
        fieldSqlTagLabelFallbacks,
        fieldSqlTagOptions,
        fieldTypeOptions,
        getFieldSqlTagOptionLabel,
        isTreeRelationFieldColumn,
        mainTableColumns,
        mapFieldSqlTagToFieldType,
    deleteDetailTabById,
        mutedLabelClass,
        normalizeColumn,
        normalizeConditionField,
        normalizeFieldSqlTagId,
        onOpenLongTextEditor: (title: string, value: string, onSave: (nextValue: string) => void, placeholder?: string) => {
          setLongTextEditorState({
            title,
            placeholder,
            draft: value,
            onSave,
          });
        },
        onShowToast: showToast,
        panelHeaderClass,
        panelIconShellClass,
        panelShellClass,
        panelTitleClass,
        resolveColumnFieldSqlTagId,
        sectionTitleClass,
        tableColumnResizeMinWidth,
        textareaClass,
        toRecordText,
      },
      getDetailFillTypeByTabId,
      gridProps: {
        DesignerWorkbenchDraggableItem,
        DesignerWorkbenchDropLane,
        activateColumnSelection,
        activeDetailBoardResize,
        activeTab,
        applyDetailModuleInheritanceById,
        billHeaderWorkbenchMaxRows,
        billHeaderWorkbenchMinRows,
        billSources,
        buildGridColorRule,
        businessType,
        compactCardClass,
        consumeFieldSettingsOpenRequest,
        context: selectedColumnContext,
        currentMenuDraft,
        currentModuleCode,
        currentModuleName,
        designerWorkbenchSensors,
        detailBoardClipboardIds,
        detailBoardFieldDefaultWidth,
        detailChartTypeOptions,
        detailFillTypeOptions,
        detailSourceModuleCandidates,
        detailTabs,
        documentConditionOwnerSourceId,
        fieldClass,
        getBillHeaderRowCount,
        getDetailFillTypeBackendValue,
        getDetailFillTypeMeta,
        getDetailTabConfigById,
        getOrderedBillHeaderFields,
        gridColorRuleOperatorOptions,
        handleDetailModuleCodeChange,
        inspectorTarget,
        isGeneratingSqlDraft,
        isTranslatingIdentifiers,
        leftFilterFields,
        mainTableColumns,
        loadSingleTableDetailResourcesById,
        fieldSettingsOpenRequest,
        mainTableHiddenColumnsCount,
        mutedLabelClass,
        normalizeColumn,
        normalizeDetailChartConfig,
        normalizeDetailFillTypeValue,
        onOpenArchiveLayoutEditor,
        onOpenConditionWorkbench,
        onOpenMainHiddenColumnsModal,
        onOpenColorRules: () => setInspectorPanelTab('color'),
        onOpenContextMenus: () => setInspectorPanelTab('contextmenu'),
        onOpenDetailBoardPreview,
        onOpenSourceGridSelection: activateSourceGridSelection,
        onRenderAdvancedPlaceholder: renderAdvancedPlaceholder,
        onResetDetailBoardFieldWidth,
        onResetMainSelection: () => setSelectedMainForDelete([]),
        onStartDetailBoardFieldResize: (groupId: string, columnId: string, _dimension: 'width' | 'height', event: PointerEvent) => {
          onStartDetailBoardFieldResize(event as unknown as MouseEvent<HTMLButtonElement>, groupId, columnId, '');
        },
        onUpdateBillHeaderWorkbenchRows: updateBillHeaderWorkbenchRows,
        onUpdateGridColumns: updateGridColumnsForScope,
        panelHeaderClass,
        panelIconShellClass,
        panelShellClass,
        panelTitleClass,
        parseDetailBoardClipboardColumnIds,
        quietDocumentInspectorActionClass,
        renderFieldPreview,
        sectionTitleClass,
        selectedDetailBoardGroupId,
        selectedDetailColorRuleId,
        selectedDetailContextMenuId,
        selectedLeftColorRuleId,
        selectedLeftContextMenuId,
        selectedMainColorRuleId,
        selectedMainContextMenuId,
        selectedPopupMenuParamKey,
        setDetailTabs,
        setInspectorPanelTab,
        setInspectorTarget,
        setIsGeneratingSqlDraft,
        setIsTranslatingIdentifiers,
        setSelectedDetailBoardGroupId,
        setSelectedDetailColorRuleId,
        setSelectedDetailContextMenuId,
        setSelectedLeftColorRuleId,
        setSelectedLeftContextMenuId,
        setSelectedMainColorRuleId,
        setSelectedMainContextMenuId,
        setSelectedMainForDelete,
        setSelectedPopupMenuParamKey,
        showToast,
        onSaveCurrentPage: saveCurrentPage,
        syncDetailColumnsFromSqlById,
        tableTypeOptions,
        treeRelationColumn,
        updateDetailTabConfigById,
        workspaceTheme,
      },
      inspectorPanelTab,
      inspectorTarget,
      normalizeDetailFillTypeValue,
      onSelectInspectorTab: setInspectorPanelTab,
      selectedColumnContext,
      sourceGridProps: {
        context: selectedColumnContext,
        workspaceThemeVars,
        activeBillSourceId,
        billSources,
        onDeleteActiveSource: () => {
          if (!activeBillSourceId) return;
          deleteBillSourceById(activeBillSourceId);
        },
        onSelectDraft: selectBillSourceDraft,
        onToggleDisabled: (sourceId: string, nextDisabled: boolean) => updateBillSourceById(sourceId, { disabled: nextDisabled }),
      },
      workspaceThemeProps: {
        context: selectedColumnContext,
        workspaceThemeVars,
        workspaceTheme,
        themeOptions: detailBoardThemeOptions,
        onSelectTheme: setWorkspaceTheme,
        resolveThemeClasses: getDetailBoardTheme,
      },
    } satisfies InspectorPanelRouterProps;
  }, [
    DesignerWorkbenchDraggableItem,
    DesignerWorkbenchDropLane,
    activateColumnSelection,
    activateSourceGridSelection,
    activeBillSourceId,
    activeDetailBoardResize,
    activeTab,
    applyDetailModuleInheritanceById,
    billFormDefaultFontSize,
    billFormDefaultLabelWidth,
    billFormMinWidth,
    billHeaderWorkbenchMaxRows,
    billHeaderWorkbenchMinRows,
    billSourceFieldMap,
    billSources,
    buildGridColorRule,
    businessType,
    clearColumnSelection,
    consumeFieldSettingsOpenRequest,
    columnAlignOptions,
    conditionPanelControlWidth,
    conditionPanelResizeMaxWidth,
    conditionPanelResizeMinWidth,
    currentMenuDraft,
    currentModuleCode,
    currentModuleName,
    defaultFieldSqlTagOptions,
    deleteDetailTabById,
    deleteSelectedColumns,
    deleteSelectedConditions,
    designerWorkbenchSensors,
    detailBoardClipboardIds,
    detailBoardFieldDefaultWidth,
    detailBoardThemeOptions,
    detailChartTypeOptions,
    detailFillTypeOptions,
    detailTabRelationSectionProps,
    detailSourceModuleCandidates,
    detailTabs,
    documentConditionOwnerSourceId,
    fieldSqlTagLabelFallbacks,
    fieldSqlTagOptions,
    fieldTypeOptions,
    getBillHeaderRowCount,
    getDetailFillTypeBackendValue,
    getDetailFillTypeByTabId,
    getDetailFillTypeMeta,
    getDetailTabConfigById,
    getFieldSqlTagOptionLabel,
    getOrderedBillHeaderFields,
    gridColorRuleOperatorOptions,
    handleConditionPanelFieldSelect,
    handleDetailModuleCodeChange,
    inspectorPanelTab,
    inspectorTarget,
    isGeneratingSqlDraft,
    isTranslatingIdentifiers,
    isTreeRelationFieldColumn,
    leftFilterFields,
    loadSingleTableDetailResourcesById,
    fieldSettingsOpenRequest,
    mainTableColumns,
    mapFieldSqlTagToFieldType,
    mainTableHiddenColumnsCount,
    normalizeColumn,
    normalizeConditionField,
    normalizeDetailChartConfig,
    normalizeDetailFillTypeValue,
    normalizeFieldSqlTagId,
    onOpenArchiveLayoutEditor,
    onOpenConditionWorkbench,
    onOpenDetailBoardPreview,
    onOpenMainHiddenColumnsModal,
    onResetDetailBoardFieldWidth,
    onStartDetailBoardFieldResize,
    parseDetailBoardClipboardColumnIds,
    renderAdvancedPlaceholder,
    renderFieldPreview,
    resolveColumnFieldSqlTagId,
    selectedColumnContext,
    selectedDetailBoardGroupId,
    selectedDetailColorRuleId,
    selectedDetailContextMenuId,
    selectedLeftColorRuleId,
    selectedLeftContextMenuId,
    selectedMainColorRuleId,
    selectedMainContextMenuId,
    selectedPopupMenuParamKey,
    setDetailTabs,
    setInspectorPanelTab,
    setInspectorTarget,
    setIsGeneratingSqlDraft,
    setIsTranslatingIdentifiers,
    setLongTextEditorState,
    setSelectedDetailBoardGroupId,
    setSelectedDetailColorRuleId,
    setSelectedDetailContextMenuId,
    setSelectedLeftColorRuleId,
    setSelectedLeftContextMenuId,
    setSelectedMainColorRuleId,
    setSelectedMainContextMenuId,
    setSelectedMainForDelete,
    setSelectedPopupMenuParamKey,
    setWorkspaceTheme,
    showToast,
    saveCurrentPage,
    deleteBillSourceById,
    selectBillSourceDraft,
    syncDetailColumnsFromSqlById,
    tableColumnResizeMinWidth,
    tableTypeOptions,
    toRecordText,
    treeRelationColumn,
    updateActiveDetailTabConfig,
    updateActiveDetailTabType,
    updateBillHeaderWorkbenchRows,
    updateBillSourceById,
    updateDetailTabConfigById,
    updateGridColumnsForScope,
    workspaceTheme,
    workspaceThemeVars,
  ]);
}
