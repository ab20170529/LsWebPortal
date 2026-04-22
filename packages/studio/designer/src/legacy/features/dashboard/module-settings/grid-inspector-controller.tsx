import React from 'react';
import { shadcnInspectorSectionClass, shadcnPanelBodyClass } from '../../../components/ui/shadcn-inspector';

import type { GridFieldSettingsPreferenceScope } from '../../../lib/backend-grid-field-settings-preferences';
import { saveSingleTableModuleConfig } from '../../../lib/backend-module-config';
import {
  requestAiCreateMainTable,
  requestIdentifierTranslation,
  requestSqlDraft,
} from '../../../lib/minimax';
import { ArchiveLayoutSummarySection } from './archive-layout-summary-section';
import { ColorRuleManager } from './color-rule-manager';
import {
  buildContextMenuItem,
  normalizeContextMenuItem,
} from './context-menu-utils';
import {
  getDetailBoardTheme,
  normalizeDetailBoardConfig,
} from './detail-board-config';
import { DetailBoardLayoutManagerContainer } from './detail-board-layout-manager-container';
import { DetailChartConfigSection } from './detail-chart-config-section';
import {
  DocumentMainTableSetupSection,
  GridColumnDataSection,
  GridConfigSummarySection,
  GridIdentifierTranslationSection,
  GridSqlConfigSection,
  LeftGridMappingSection,
} from './grid-overview-sections';
import {
  type GridFieldSettingsModalMode,
  type GridFieldSettingsOpenRequest,
} from './grid-field-settings-modal-types';
import { PopupMenuManager } from './popup-menu-manager';
import { SingleTableMainFieldSettingsModal } from './single-table-main-field-settings-modal';

function isLowQualityTranslatedIdentifier(value: string) {
  return /^(?:field|column|col|unknown|temp|tmp)(?:_\d+)?$/i.test(String(value || '').trim());
}

type DetailFillTypeOption = {
  backendValue?: string;
  label: string;
  value: string;
};

type DetailChartTypeOption = {
  label: string;
  value: string;
};

type GridInspectorControllerProps = {
  DesignerWorkbenchDraggableItem: React.ComponentType<any>;
  DesignerWorkbenchDropLane: React.ComponentType<any>;
  activateColumnSelection: (scope: 'left' | 'main' | 'detail', columnId?: string) => void;
  activeDetailBoardResize: any;
  activeTab: string;
  billHeaderWorkbenchMaxRows: number;
  billHeaderWorkbenchMinRows: number;
  applyDetailModuleInheritanceById: (tabId: string, moduleCode: string) => Promise<boolean>;
  billSources: any[];
  buildGridColorRule: (index: number, overrides?: Record<string, any>) => any;
  businessType: string;
  compactCardClass: string;
  consumeFieldSettingsOpenRequest: () => void;
  context: any;
  currentMenuDraft: Record<string, any>;
  currentModuleCode: string;
  currentModuleName: string;
  designerWorkbenchSensors: any;
  detailBoardClipboardIds: string[];
  detailBoardFieldDefaultWidth: number;
  detailChartTypeOptions: DetailChartTypeOption[];
  detailFillTypeOptions: DetailFillTypeOption[];
  detailSourceModuleCandidates: any[];
  detailTabs: any[];
  documentConditionOwnerSourceId: string;
  getDetailFillTypeBackendValue: (fillType?: string) => string;
  getDetailFillTypeMeta: (fillType?: string) => any;
  getDetailTabConfigById: (tabId: string) => any;
  gridColorRuleOperatorOptions: string[];
  handleDetailModuleCodeChange: (tabId: string, moduleCode: string, options?: Record<string, any>) => void;
  inspectorTabsNode: React.ReactNode;
  inspectorTarget: any;
  isColumnsPanelTab: boolean;
  isColorPanelTab: boolean;
  isCommonPanelTab: boolean;
  isContextMenuPanelTab: boolean;
  isGeneratingSqlDraft: boolean;
  isTranslatingIdentifiers: boolean;
  leftFilterFields: any[];
  fieldSettingsOpenRequest: GridFieldSettingsOpenRequest;
  mainTableColumns: any[];
  loadSingleTableDetailResourcesById: (tabId: string, fillType: string) => Promise<any>;
  mainTableHiddenColumnsCount: number;
  fieldClass: string;
  getBillHeaderRowCount: () => number;
  getOrderedBillHeaderFields: () => any[];
  mutedLabelClass: string;
  normalizeColumn: (column: any) => any;
  normalizeDetailChartConfig: (config: any) => any;
  normalizeDetailFillTypeValue: (fillType?: string) => string;
  onOpenArchiveLayoutEditor: () => void;
  onOpenConditionWorkbench: (scope: 'left' | 'main') => void;
  onOpenMainHiddenColumnsModal: () => void;
  onOpenDetailBoardPreview: (previewRows?: number, sortColumnId?: string | null) => void;
  onOpenColorRules: () => void;
  onOpenContextMenus: () => void;
  onOpenSourceGridSelection: () => void;
  onRenderAdvancedPlaceholder: (message: string) => React.ReactNode;
  onResetDetailBoardFieldWidth: (event: React.MouseEvent<HTMLButtonElement>, groupId: string, columnId: string) => void;
  onResetMainSelection: () => void;
  onStartDetailBoardFieldResize: (groupId: string, columnId: string, dimension: 'width' | 'height', event: React.PointerEvent) => void;
  onUpdateGridColumns: (scope: string, updater: React.SetStateAction<any[]>) => void;
  onUpdateBillHeaderWorkbenchRows: (rows: number) => void;
  panelHeaderClass: string;
  panelIconShellClass: string;
  panelShellClass: string;
  panelTitleClass: string;
  parseDetailBoardClipboardColumnIds: (value: string, availableColumns: any[]) => string[];
  quietDocumentInspectorActionClass: string;
  renderFieldPreview: (...args: any[]) => React.ReactNode;
  sectionTitleClass: string;
  selectedDetailBoardGroupId: string | null;
  selectedDetailColorRuleId: string | null;
  selectedDetailContextMenuId: string | null;
  selectedLeftColorRuleId: string | null;
  selectedLeftContextMenuId: string | null;
  selectedMainColorRuleId: string | null;
  selectedMainContextMenuId: string | null;
  selectedPopupMenuParamKey: string;
  setDetailTabs: React.Dispatch<React.SetStateAction<any[]>>;
  setInspectorTarget: React.Dispatch<React.SetStateAction<any>>;
  setIsGeneratingSqlDraft: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTranslatingIdentifiers: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedDetailBoardGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDetailColorRuleId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDetailContextMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedLeftColorRuleId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedLeftContextMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedMainForDelete: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedMainColorRuleId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedMainContextMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedPopupMenuParamKey: React.Dispatch<React.SetStateAction<string>>;
  showToast: (message: string) => void;
  onSaveCurrentPage?: (options?: {
    gridColumnsOverride?: {
      rows: any[];
      scope: 'left-grid' | 'main-grid' | 'detail-grid';
      tabId?: string;
    };
    silent?: boolean;
  }) => Promise<boolean>;
  setInspectorPanelTab: React.Dispatch<React.SetStateAction<'common' | 'advanced' | 'contextmenu' | 'color' | 'columns'>>;
  syncDetailColumnsFromSqlById: (tabId: string, sql: string, options?: Record<string, any>) => void;
  tableTypeOptions: string[];
  treeRelationColumn: any;
  updateDetailTabConfigById: (tabId: string, updater: (prev: any) => any) => void;
  workspaceTheme: string;
};

export function GridInspectorController({
  DesignerWorkbenchDraggableItem,
  DesignerWorkbenchDropLane,
  activateColumnSelection,
  activeDetailBoardResize,
  activeTab,
  billHeaderWorkbenchMaxRows,
  billHeaderWorkbenchMinRows,
  buildGridColorRule,
  businessType,
  compactCardClass,
  consumeFieldSettingsOpenRequest,
  context,
  currentMenuDraft,
  currentModuleCode,
  currentModuleName,
  designerWorkbenchSensors,
  detailBoardClipboardIds,
  detailBoardFieldDefaultWidth,
  detailChartTypeOptions,
  detailFillTypeOptions,
  detailTabs,
  documentConditionOwnerSourceId,
  getDetailFillTypeBackendValue,
  getDetailFillTypeMeta,
  getDetailTabConfigById,
  gridColorRuleOperatorOptions,
  inspectorTabsNode,
  inspectorTarget,
  isColumnsPanelTab,
  isColorPanelTab,
  isCommonPanelTab,
  isContextMenuPanelTab,
  isGeneratingSqlDraft,
  isTranslatingIdentifiers,
  leftFilterFields,
  fieldSettingsOpenRequest,
  mainTableColumns,
  mainTableHiddenColumnsCount,
  fieldClass,
  getBillHeaderRowCount,
  mutedLabelClass,
  normalizeColumn,
  normalizeDetailChartConfig,
  normalizeDetailFillTypeValue,
  onOpenArchiveLayoutEditor,
  onOpenConditionWorkbench,
  onOpenMainHiddenColumnsModal,
  onOpenColorRules,
  onOpenContextMenus,
  onOpenDetailBoardPreview,
  onRenderAdvancedPlaceholder,
  onResetDetailBoardFieldWidth,
  onResetMainSelection,
  onStartDetailBoardFieldResize,
  onUpdateGridColumns,
  onUpdateBillHeaderWorkbenchRows,
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
  setIsGeneratingSqlDraft,
  setIsTranslatingIdentifiers,
  setSelectedDetailBoardGroupId,
  setSelectedDetailColorRuleId,
  setSelectedDetailContextMenuId,
  setSelectedLeftColorRuleId,
  setSelectedLeftContextMenuId,
  setSelectedMainForDelete,
  setSelectedMainColorRuleId,
  setSelectedMainContextMenuId,
  setSelectedPopupMenuParamKey,
  setInspectorPanelTab,
  showToast,
  onSaveCurrentPage,
  syncDetailColumnsFromSqlById,
  tableTypeOptions,
  treeRelationColumn,
  updateDetailTabConfigById,
  workspaceTheme,
}: GridInspectorControllerProps) {
  const availableGridColumns = React.useMemo(() => context.availableColumns ?? [], [context.availableColumns]);
  const currentGridConfig = context.column;
  const currentDetailBoard = normalizeDetailBoardConfig(currentGridConfig.detailBoard, availableGridColumns);
  const detailBoardTheme = getDetailBoardTheme(workspaceTheme);
  const treeOwnerField = treeRelationColumn ? normalizeColumn(treeRelationColumn) : null;
  const treeOwnerFieldKey = treeOwnerField?.sourceField || treeRelationColumn?.id || '';
  const isMainGridConfig = context.scope === 'main-grid';
  const isLeftGridConfig = context.scope === 'left-grid';
  const isBillHeadGridConfig = businessType === 'table' && context.scope === 'main-grid';
  const isBillDetailGridConfig = businessType === 'table' && context.scope === 'detail-grid';
  const useCenteredBillGridHeader = isBillHeadGridConfig || isBillDetailGridConfig;
  const isDocumentDetailGrid = businessType !== 'table' && context.scope === 'detail-grid';
  const useDetailSqlConfig = isDocumentDetailGrid || isBillDetailGridConfig;
  const isDocumentArchiveGrid = businessType !== 'table' && (isMainGridConfig || isLeftGridConfig);
  const useQuietDocumentInspector = isDocumentDetailGrid || isDocumentArchiveGrid;
  const hasInspectorTabs = inspectorTabsNode != null;
  const showConditionWorkbenchAction = isDocumentArchiveGrid;
  const selectedDetailInspectorFillType = isDocumentDetailGrid && detailFillTypeOptions.some((option) => option.value === inspectorTarget.id)
    ? inspectorTarget.id
    : '表格';
  const detailGridFillTypeMeta = !isBillHeadGridConfig && !isBillDetailGridConfig && context.scope === 'detail-grid'
    ? getDetailFillTypeMeta(selectedDetailInspectorFillType)
    : null;
  const isDetailChartInspector = detailGridFillTypeMeta?.value === '图表';
  const currentDetailTabConfig = isDocumentDetailGrid
    ? getDetailTabConfigById(activeTab)
    : null;
  const currentDetailSourceModuleCode = String(currentDetailTabConfig?.relatedModule || '').trim();
  const currentDetailTabName = detailTabs.find((tab) => tab.id === activeTab)?.name || currentDetailTabConfig?.detailName || '当前明细';
  const currentDetailChartConfig = normalizeDetailChartConfig(currentGridConfig.chartConfig);
  const isTableLikeDetailInspector = detailGridFillTypeMeta?.value === '表格' || detailGridFillTypeMeta?.value === '树表格';
  const isDetailModuleInheritanceMode = isDocumentDetailGrid
    && isTableLikeDetailInspector
    && !isDetailChartInspector
    && (
      String(currentGridConfig.sourceMode || '').trim() === 'module'
      || currentDetailSourceModuleCode.length > 0
    );
  const detailGridSummaryTitle = detailGridFillTypeMeta?.value === '图表'
    ? '图表加载属性'
    : detailGridFillTypeMeta?.value === '树表格'
      ? '明细树表属性'
      : detailGridFillTypeMeta?.value === '网页'
        ? '网页视图属性'
        : '明细表属性';
  const detailChartFieldOptions = Array.from(
    new Map(
      availableGridColumns
        .map((column: any) => normalizeColumn(column))
        .map((column) => {
          const fieldValue = String(column.sourceField || column.name || '').trim();
          if (!fieldValue) return null;
          return [fieldValue, {
            value: fieldValue,
            label: column.sourceField
              ? `${column.name || column.sourceField} · ${column.sourceField}`
              : (column.name || fieldValue),
          }];
        })
        .filter(Boolean) as [string, { value: string; label: string }][]
    ).values(),
  );
  const contextMenuItems = (currentGridConfig.contextMenuItems ?? []).map((item: any, index: number) => normalizeContextMenuItem(item, index + 1));
  const enabledMenuCount = contextMenuItems.filter((item: any) => !item.disabled).length;
  const colorRules = currentGridConfig.colorRules ?? [];
  const enabledColorRuleCount = colorRules.filter((rule: any) => !rule.disabled).length;
  const canManageDetailGridDecorations = isDocumentDetailGrid && !isDetailChartInspector;
  const documentGridColumnDataTitle = isLeftGridConfig
    ? '左表列数据'
    : isDocumentDetailGrid
      ? '明细列数据'
      : '主表列数据';
  const activeContextMenuSelectionId = isLeftGridConfig
    ? selectedLeftContextMenuId
    : canManageDetailGridDecorations
      ? selectedDetailContextMenuId
      : selectedMainContextMenuId;
  const activeColorRuleSelectionId = isLeftGridConfig
    ? selectedLeftColorRuleId
    : canManageDetailGridDecorations
      ? selectedDetailColorRuleId
      : selectedMainColorRuleId;
  const setActiveContextMenuSelectionId = isLeftGridConfig
    ? setSelectedLeftContextMenuId
    : canManageDetailGridDecorations
      ? setSelectedDetailContextMenuId
      : setSelectedMainContextMenuId;
  const setActiveColorRuleSelectionId = isLeftGridConfig
    ? setSelectedLeftColorRuleId
    : canManageDetailGridDecorations
      ? setSelectedDetailColorRuleId
      : setSelectedMainColorRuleId;
  const [fieldSettingsModalState, setFieldSettingsModalState] = React.useState<{
    initialFieldId?: string | null;
    mode: GridFieldSettingsModalMode;
  } | null>(null);
  const [selectedColumnListItemId, setSelectedColumnListItemId] = React.useState<string | null>(null);
  const handledFieldSettingsOpenRequestRef = React.useRef(0);

  const updateGridConfig = (patch: Record<string, any>) => {
    context.setCols((prev: Record<string, any>) => ({
      ...prev,
      ...patch,
    }));
  };

  const canOpenFieldSettings = !isLeftGridConfig && (isMainGridConfig || isDocumentDetailGrid || isBillDetailGridConfig);
  const selectedGridColumnId = isLeftGridConfig
    ? (inspectorTarget.kind === 'left-col' ? inspectorTarget.id ?? null : null)
    : isMainGridConfig
      ? (inspectorTarget.kind === 'main-col' ? inspectorTarget.id ?? null : null)
    : isDocumentDetailGrid || isBillDetailGridConfig
      ? (inspectorTarget.kind === 'detail-col' ? inspectorTarget.id ?? null : null)
      : null;
  const displayedGridColumnListSelectionId = selectedColumnListItemId ?? selectedGridColumnId;

  React.useEffect(() => {
    setSelectedColumnListItemId(selectedGridColumnId);
  }, [selectedGridColumnId, activeTab, context.scope]);

  const resolveFieldSettingsModeForCurrentScope = React.useCallback((): GridFieldSettingsModalMode | null => {
    if (isLeftGridConfig) {
      return null;
    }

    if (isBillHeadGridConfig) {
      return 'bill-main';
    }

    if (isBillDetailGridConfig) {
      return 'bill-detail';
    }

    if (isDocumentDetailGrid) {
      return 'single-table-detail';
    }

    if (isMainGridConfig) {
      return 'single-table-main';
    }

    return null;
  }, [isBillDetailGridConfig, isBillHeadGridConfig, isDocumentDetailGrid, isLeftGridConfig, isMainGridConfig]);

  const openFieldSettingsModal = React.useCallback((mode: GridFieldSettingsModalMode, fieldId?: string | null) => {
    setFieldSettingsModalState({
      initialFieldId: fieldId ?? null,
      mode,
    });
  }, []);

  const handleColumnListItemDoubleClick = React.useCallback((columnId: string) => {
    const modalMode = resolveFieldSettingsModeForCurrentScope();
    if (!modalMode) {
      return;
    }

    openFieldSettingsModal(modalMode, columnId);
  }, [openFieldSettingsModal, resolveFieldSettingsModeForCurrentScope]);

  React.useEffect(() => {
    if (!fieldSettingsOpenRequest || fieldSettingsOpenRequest.key <= 0) {
      return;
    }

    if (handledFieldSettingsOpenRequestRef.current === fieldSettingsOpenRequest.key) {
      return;
    }

    handledFieldSettingsOpenRequestRef.current = fieldSettingsOpenRequest.key;
    openFieldSettingsModal(fieldSettingsOpenRequest.mode, fieldSettingsOpenRequest.fieldId);
    consumeFieldSettingsOpenRequest();
  }, [consumeFieldSettingsOpenRequest, fieldSettingsOpenRequest, openFieldSettingsModal]);

  const saveFieldSettings = React.useCallback(async (rows: any[]) => {
    const currentMode = fieldSettingsModalState?.mode;
    const saveScope = currentMode === 'single-table-detail' || currentMode === 'bill-detail'
      ? 'detail-grid'
      : 'main-grid';
    const saveTabId = currentMode === 'single-table-detail' ? activeTab : undefined;

    if (onSaveCurrentPage) {
      return onSaveCurrentPage({
        gridColumnsOverride: {
          rows,
          scope: saveScope,
          ...(saveTabId ? { tabId: saveTabId } : {}),
        },
      });
    }

    onUpdateGridColumns(saveScope, rows);
    return true;
  }, [activeTab, fieldSettingsModalState?.mode, onSaveCurrentPage, onUpdateGridColumns]);

  const modalRows = React.useMemo(() => {
    const currentMode = fieldSettingsModalState?.mode;
    if (currentMode === 'single-table-detail' || currentMode === 'bill-detail') {
      return availableGridColumns;
    }

    if (currentMode === 'bill-main') {
      return availableGridColumns.length > 0 ? availableGridColumns : mainTableColumns;
    }

    return mainTableColumns;
  }, [availableGridColumns, fieldSettingsModalState?.mode, mainTableColumns]);

  const modalTableLabel = React.useMemo(() => {
    switch (fieldSettingsModalState?.mode) {
      case 'single-table-detail':
        return currentDetailTabName || context.title || '当前明细表';
      case 'bill-main':
        return currentModuleName || context.title || '单据主表';
      case 'bill-detail':
        return context.title || '单据明细表';
      case 'single-table-main':
      default:
        return context.title || currentModuleName || '主表';
    }
  }, [context.title, currentDetailTabName, currentModuleName, fieldSettingsModalState?.mode]);
  const fieldSettingsPreferenceScope = React.useMemo<GridFieldSettingsPreferenceScope | null>(() => {
    const currentMode = fieldSettingsModalState?.mode;
    const isBillMode = currentMode?.startsWith('bill') === true;
    const ownerCode = isBillMode
      ? String(currentGridConfig?.typeCode || currentGridConfig?.dllCoId || currentModuleCode || '').trim()
      : String(currentModuleCode ?? '').trim();
    if (!currentMode || !ownerCode) {
      return null;
    }

    const viewScope = isBillMode
      ? 'main'
      : (currentMode.endsWith('detail') ? 'detail' : 'main');
    return {
      detailTabKey: viewScope === 'detail'
        ? String(currentDetailTabConfig?.tabKey || activeTab || '').trim() || null
        : null,
      ownerCode,
      ownerType: isBillMode ? 'bill' : 'single-table',
      viewScope,
    };
  }, [activeTab, currentDetailTabConfig?.tabKey, currentGridConfig?.dllCoId, currentGridConfig?.typeCode, currentModuleCode, fieldSettingsModalState?.mode]);
  const fieldSettingsModuleCode = React.useMemo(() => (
    fieldSettingsPreferenceScope?.ownerCode || String(currentModuleCode ?? '').trim()
  ), [currentModuleCode, fieldSettingsPreferenceScope?.ownerCode]);

  const updateActiveDetailTabConfig = (patch: Record<string, any>) => {
    if (!isDocumentDetailGrid) return;
    const normalizedPatch: Record<string, any> = Object.prototype.hasOwnProperty.call(patch, 'detailType')
      ? (() => {
          const normalizedType = normalizeDetailFillTypeValue(patch.detailType);
          return {
            ...patch,
            detailType: normalizedType,
            detailTypeCode: getDetailFillTypeBackendValue(normalizedType),
          };
        })()
      : patch;
    updateDetailTabConfigById(activeTab, (prev) => ({
      ...(prev ?? getDetailTabConfigById(activeTab)),
      ...normalizedPatch,
    }));
  };

  const updateDetailChartConfig = (patch: Record<string, any>) => {
    updateGridConfig({
      chartConfig: {
        ...currentDetailChartConfig,
        ...patch,
      },
    });
  };

  const setGridContextMenuItems = (updater: any[] | ((items: any[]) => any[])) => {
    const nextItems = (typeof updater === 'function' ? updater(contextMenuItems) : updater)
      .map((item: any, index: number) => normalizeContextMenuItem(
        isLeftGridConfig
          ? { ...item, tab: treeOwnerFieldKey }
          : item,
        index + 1,
      ));
    updateGridConfig({
      contextMenuItems: nextItems,
      contextMenuEnabled: nextItems.length > 0,
    });
  };

  const setGridColorRules = (updater: any[] | ((rules: any[]) => any[])) => {
    const nextRules = (typeof updater === 'function' ? updater(colorRules) : updater)
      .map((rule: any) => (
        isLeftGridConfig
          ? { ...rule, tab: treeOwnerFieldKey }
          : rule
      ));
    updateGridConfig({
      colorRules: nextRules,
      colorRulesEnabled: nextRules.some((rule: any) => !rule.disabled),
    });
  };

  const updateDetailBoard = (patch: Record<string, any> | ((current: any) => any)) => {
    updateGridConfig({
      detailBoard: typeof patch === 'function'
        ? patch(currentDetailBoard)
        : {
            ...currentDetailBoard,
            ...patch,
          },
    });
  };

  const isGridDecorationManagerAvailable = isDocumentArchiveGrid || canManageDetailGridDecorations;
  const selectedPopupMenuItem = isGridDecorationManagerAvailable
    ? contextMenuItems.find((item: any) => item.id === activeContextMenuSelectionId) ?? contextMenuItems[0] ?? null
    : null;
  const selectedColorRule = isGridDecorationManagerAvailable
    ? colorRules.find((rule: any) => rule.id === activeColorRuleSelectionId) ?? colorRules[0] ?? null
    : null;
  const popupMenuTabValue = isLeftGridConfig
    ? treeOwnerFieldKey
    : canManageDetailGridDecorations
      ? String(currentDetailTabConfig?.tabKey || activeTab)
      : String(currentMenuDraft.moduleCode ?? '');
  const translatableColumns = availableGridColumns.filter((column: any) => {
    const normalizedColumn = normalizeColumn(column);
    return /[\u4e00-\u9fff]/.test(normalizedColumn.name || '') && !/[A-Za-z]/.test(normalizedColumn.sourceField || '');
  });

  const generateGridSqlDraft = async () => {
    setIsGeneratingSqlDraft(true);

    try {
      const gridDraftTitle = String(
        (isDocumentArchiveGrid && isMainGridConfig ? currentGridConfig.tableName : '') || context.title || '当前表',
      ).trim() || '当前表';
      const response = await requestSqlDraft({
        title: gridDraftTitle,
        description: currentGridConfig.sqlPrompt || '',
        tableType: currentGridConfig.tableType || '普通表格',
        columns: availableGridColumns.map((column: any) => {
          const normalizedColumn = normalizeColumn(column);
          return {
            id: normalizedColumn.id,
            identifier: normalizedColumn.sourceField || '',
            name: normalizedColumn.name,
            type: normalizedColumn.type,
          };
        }),
      });

      updateGridConfig({
        defaultQuery: response.draft.defaultQuery,
        mainSql: response.draft.mainSql,
      });
      showToast('已通过 MiniMax 生成主 SQL 草案');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'MiniMax 生成主 SQL 失败');
    } finally {
      setIsGeneratingSqlDraft(false);
    }
  };

  const createMainTableWithAi = async () => {
    if (!isDocumentArchiveGrid || !isMainGridConfig) {
      void generateGridSqlDraft();
      return;
    }

    const rawTableName = String(currentGridConfig.tableName || '').trim();
    if (!rawTableName) {
      showToast('请先填写主表名');
      return;
    }

    if (availableGridColumns.length === 0) {
      showToast('请先配置主表字段');
      return;
    }

    setIsGeneratingSqlDraft(true);

    try {
      const response = await requestAiCreateMainTable({
        columns: availableGridColumns.map((column: any) => {
          const normalizedColumn = normalizeColumn(column);
          return {
            id: normalizedColumn.id,
            identifier: normalizedColumn.sourceField || '',
            name: normalizedColumn.name,
            type: normalizedColumn.type,
          };
        }),
        description: currentGridConfig.sqlPrompt || '',
        moduleCode: currentModuleCode,
        moduleName: currentModuleName,
        persist: true,
        tableName: rawTableName,
        tableType: currentGridConfig.tableType || '普通表格',
      });

      updateGridConfig({
        createTableSql: response.result.createTableSql,
        defaultQuery: response.result.defaultQuery,
        tableName: response.result.tableName,
      });
      onUpdateGridColumns(context.scope, (prev) => prev.map((column: any) => {
        const matched = response.result.translatedColumns.find((item) => item.id === column.id);
        return matched
          ? { ...column, sourceField: matched.identifier }
          : column;
      }));

      if (import.meta.env.DEV) {
        console.info('[AI一键建表]', response.result);
      }

      const normalizedModuleCode = String(currentModuleCode || '').trim();
      const normalizedModuleName = String(currentModuleName || '').trim();
      let moduleConfigPersistenceSuffix = '，但当前模块编码为空，未同步保存表名配置';

      if (normalizedModuleCode) {
        try {
          await saveSingleTableModuleConfig(normalizedModuleCode, {
            id: currentGridConfig.backendId ?? currentGridConfig.id,
            addDllName: currentGridConfig.addDllName,
            conditionKey: currentGridConfig.conditionKey,
            deleteCond: currentGridConfig.deleteCond,
            dllCoId: normalizedModuleCode,
            dllType: currentGridConfig.dllType,
            formKey: currentGridConfig.formKey,
            isReport: currentGridConfig.isReport,
            mainTable: response.result.tableName,
            modifyCond: currentGridConfig.modifyCond,
            moduleName: normalizedModuleName,
            overbackKey: currentGridConfig.overbackKey,
          });
          moduleConfigPersistenceSuffix = '，表名配置已同步保存';
        } catch (moduleConfigError) {
          const moduleConfigErrorMessage = moduleConfigError instanceof Error ? moduleConfigError.message : '';
          moduleConfigPersistenceSuffix = moduleConfigErrorMessage
            ? `，但表名配置保存失败：${moduleConfigErrorMessage}`
            : '，但表名配置保存失败';

          if (import.meta.env.DEV) {
            console.error('[AI一键建表] 模块配置联动保存失败', moduleConfigError);
          }
        }
      }

      const persistenceMessage = response.result.persistence.message ? `（${response.result.persistence.message}）` : '';
      if (response.result.persistence.status === 'saved') {
        showToast(`AI一键建表完成，主表 SQL 已更新并提交后端保存${persistenceMessage}${moduleConfigPersistenceSuffix}`);
      } else if (response.result.persistence.status === 'failed') {
        showToast(`AI一键建表完成，但后端保存失败${persistenceMessage}${moduleConfigPersistenceSuffix}`);
      } else if (response.result.persistence.status === 'pending') {
        showToast(`AI一键建表完成，界面已更新，后端保存口待接入${persistenceMessage}${moduleConfigPersistenceSuffix}`);
      } else {
        showToast(`AI一键建表完成，主表字段与 SQL 已更新${moduleConfigPersistenceSuffix}`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'AI一键建表失败');
    } finally {
      setIsGeneratingSqlDraft(false);
    }
  };

  const savePageAfterTranslation = async (message: string, nextGridColumns?: any[]) => {
    if (!onSaveCurrentPage) {
      showToast(`${message}，当前版本未接入保存本页`);
      return;
    }

    const saved = await onSaveCurrentPage({
      gridColumnsOverride: nextGridColumns
        ? {
          rows: nextGridColumns,
          scope: context.scope,
          tabId: context.scope === 'detail-grid' ? activeTab : undefined,
        }
        : undefined,
      silent: true,
    });

    showToast(saved
      ? `${message}，并已保存本页`
      : `${message}，但保存本页失败，请手动保存`);
  };

  const translateGridIdentifiers = async () => {
    if (translatableColumns.length === 0) {
      await savePageAfterTranslation('当前表格没有需要翻译的中文字段');
      return;
    }

    setIsTranslatingIdentifiers(true);

    try {
      const response = await requestIdentifierTranslation(
        translatableColumns.map((column: any) => {
          const normalizedColumn = normalizeColumn(column);
          return {
            id: normalizedColumn.id,
            identifier: normalizedColumn.sourceField || '',
            name: normalizedColumn.name,
          };
        }),
      );
      const acceptedItems = response.items.filter((item) => !isLowQualityTranslatedIdentifier(item.identifier));
      const identifierMap = new Map(acceptedItems.map((item) => [item.id, item.identifier]));
      const skippedCount = response.items.length - acceptedItems.length;
      if (acceptedItems.length === 0) {
        await savePageAfterTranslation(skippedCount > 0
          ? `未找到可用翻译结果，${skippedCount} 个低质量结果已忽略`
          : '未找到可用翻译结果');
        return;
      }

      const nextGridColumns = availableGridColumns.map((column) => (
        identifierMap.has(column.id)
          ? { ...column, sourceField: identifierMap.get(column.id) }
          : column
      ));

      onUpdateGridColumns(context.scope, nextGridColumns);

      const translationMessage = skippedCount > 0
        ? `已翻译 ${acceptedItems.length} 个字段标识，${skippedCount} 个低质量结果已忽略`
        : `已翻译 ${acceptedItems.length} 个字段标识`;
      await savePageAfterTranslation(translationMessage, nextGridColumns);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'MiniMax 翻译字段标识失败');
    } finally {
      setIsTranslatingIdentifiers(false);
    }
  };

  const updateSelectedPopupMenuItem = (patch: Record<string, any>) => {
    if (!selectedPopupMenuItem) return;

    const mirroredPatch = {
      ...patch,
      ...(patch.menuname !== undefined ? { label: patch.menuname } : {}),
      ...(patch.label !== undefined ? { menuname: patch.label } : {}),
      ...(patch.dllname !== undefined ? { actionKey: patch.dllname } : {}),
      ...(patch.actionKey !== undefined ? { dllname: patch.actionKey } : {}),
      ...(patch.menuCond !== undefined ? { disabledCondition: patch.menuCond } : {}),
      ...(patch.disabledCondition !== undefined ? { menuCond: patch.disabledCondition } : {}),
    };

    setGridContextMenuItems((menus: any[]) => menus.map((menu: any) => (
      menu.id === selectedPopupMenuItem.id ? { ...menu, ...mirroredPatch } : menu
    )));
  };

  return (
    <div className={panelShellClass}>
      <div className={useQuietDocumentInspector ? 'shrink-0 border-b border-slate-200/60 bg-white/80 px-3 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80' : panelHeaderClass}>
        {useQuietDocumentInspector ? (
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className={`${panelIconShellClass} size-7 rounded-md ${context.iconClass}`}>
                  <span className="material-symbols-outlined text-[16px]">{context.icon}</span>
                </div>
                <div className="min-w-0 text-[13px] font-semibold leading-5 text-slate-800 dark:text-slate-100">
                  {context.title}
                </div>
              </div>
            </div>
            {hasInspectorTabs ? (
              <div className="flex min-w-0 items-center">
                {inspectorTabsNode}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className={`flex min-w-0 gap-3 ${useCenteredBillGridHeader ? 'items-center' : 'items-center'}`}>
              <div className={`${panelIconShellClass} ${context.iconClass}`}>
                <span className="material-symbols-outlined text-[18px]">{context.icon}</span>
              </div>
              <div className={`min-w-0 flex-1 ${useCenteredBillGridHeader ? 'flex min-h-10 items-center' : ''}`}>
                <h3 className={panelTitleClass}>{context.title}</h3>
              </div>
            </div>
            {showConditionWorkbenchAction ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenConditionWorkbench(isLeftGridConfig ? 'left' : 'main')}
                    className={useQuietDocumentInspector ? quietDocumentInspectorActionClass : 'inline-flex h-9 items-center gap-1.5 rounded-[14px] border border-slate-200/80 bg-white/92 px-3 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/72 dark:text-slate-200'}
                  >
                    <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                    条件配置
                  </button>
                </div>
              </div>
            ) : null}
            {hasInspectorTabs ? inspectorTabsNode : null}
          </>
        )}
      </div>

      <div className={shadcnPanelBodyClass}>
        {isContextMenuPanelTab && isGridDecorationManagerAvailable ? (
          <PopupMenuManager
            contextMenuItems={contextMenuItems}
            enabledMenuCount={enabledMenuCount}
            selectedItem={selectedPopupMenuItem}
            selectedParamKey={selectedPopupMenuParamKey}
            onSelectParamKey={setSelectedPopupMenuParamKey}
            onAddItem={() => {
              const nextItem = buildContextMenuItem(contextMenuItems.length + 1, {
                tab: popupMenuTabValue,
              });
              setGridContextMenuItems([...contextMenuItems, nextItem]);
              setActiveContextMenuSelectionId(nextItem.id);
            }}
            onSelectItem={setActiveContextMenuSelectionId}
            onDeleteItem={(itemId) => setGridContextMenuItems((menus: any[]) => menus.filter((menu: any) => menu.id !== itemId))}
            onToggleItemDisabled={(itemId, disabled) => setGridContextMenuItems((menus: any[]) => menus.map((menu: any) => (
              menu.id === itemId ? { ...menu, disabled } : menu
            )))}
            onUpdateSelectedItem={updateSelectedPopupMenuItem}
          />
        ) : isColorPanelTab && isGridDecorationManagerAvailable ? (
          <ColorRuleManager
            colorRules={colorRules}
            enabledColorRuleCount={enabledColorRuleCount}
            selectedRule={selectedColorRule}
            fieldOptions={availableGridColumns.map((column: any) => {
              const normalizedColumn = normalizeColumn(column);
              return {
                label: `${normalizedColumn.name} (${normalizedColumn.sourceField || '未配置标识'})`,
                value: normalizedColumn.sourceField || normalizedColumn.name,
              };
            })}
            operatorOptions={gridColorRuleOperatorOptions}
            onAddRule={() => {
              const nextRule = buildGridColorRule(colorRules.length + 1, isLeftGridConfig ? { tab: treeOwnerFieldKey } : {});
              setGridColorRules([...colorRules, nextRule]);
              setActiveColorRuleSelectionId(nextRule.id);
            }}
            onSelectRule={setActiveColorRuleSelectionId}
            onDeleteRule={(ruleId) => setGridColorRules((rules: any[]) => rules.filter((item: any) => item.id !== ruleId))}
            onToggleRuleDisabled={(ruleId, disabled) => setGridColorRules((rules: any[]) => rules.map((item: any) => (
              item.id === ruleId ? { ...item, disabled } : item
            )))}
            onUpdateRule={(ruleId, patch) => setGridColorRules((rules: any[]) => rules.map((item: any) => (
              item.id === ruleId ? { ...item, ...patch } : item
            )))}
          />
        ) : isColumnsPanelTab ? (
          <div className="space-y-0">
            <GridColumnDataSection
              actionNode={canOpenFieldSettings ? (
                <button
                  type="button"
                  onClick={() => {
                    const modalMode = resolveFieldSettingsModeForCurrentScope();
                    if (modalMode) {
                      openFieldSettingsModal(modalMode, displayedGridColumnListSelectionId);
                    }
                  }}
                  className={`${quietDocumentInspectorActionClass} shrink-0`}
                >
                  <span className="material-symbols-outlined text-[14px]">table_view</span>
                  详细设置
                </button>
              ) : null}
              title={documentGridColumnDataTitle}
              availableGridColumns={availableGridColumns}
              normalizeColumn={normalizeColumn}
              onDoubleClickColumn={handleColumnListItemDoubleClick}
              onSelectColumn={setSelectedColumnListItemId}
              selectedColumnId={displayedGridColumnListSelectionId}
            />
          </div>
        ) : isCommonPanelTab ? (
          isBillHeadGridConfig ? (
            <div className="space-y-0">
              <section className={shadcnInspectorSectionClass}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className={sectionTitleClass}>
                    <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">dashboard_customize</span>
                    <h4>头部设计</h4>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={mutedLabelClass}>控件行数</label>
                    <input
                      type="number"
                      min={billHeaderWorkbenchMinRows}
                      max={billHeaderWorkbenchMaxRows}
                      step={1}
                      inputMode="numeric"
                      value={getBillHeaderRowCount()}
                      onChange={(event) => {
                        const nextRows = Number.parseInt(event.target.value, 10);
                        if (!Number.isFinite(nextRows)) {
                          return;
                        }
                        const clampedRows = Math.min(
                          billHeaderWorkbenchMaxRows,
                          Math.max(billHeaderWorkbenchMinRows, nextRows),
                        );
                        onUpdateBillHeaderWorkbenchRows(clampedRows);
                      }}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </section>
              <GridSqlConfigSection
                isDetailConfig={isDocumentDetailGrid}
                sqlPrompt={currentGridConfig.sqlPrompt || ''}
                mainSql={currentGridConfig.mainSql || ''}
                conditionValue={isDocumentDetailGrid ? (currentGridConfig.sourceCondition || currentGridConfig.defaultQuery || '') : (currentGridConfig.defaultQuery || '')}
                hideConditionInput
                isGeneratingSqlDraft={isGeneratingSqlDraft}
                layoutMode="section"
                onGenerateSqlDraft={generateGridSqlDraft}
                onUpdateSqlPrompt={(value) => updateGridConfig({ sqlPrompt: value })}
                onUpdateMainSql={(value) => updateGridConfig({ mainSql: value })}
                onUpdateConditionValue={(value) => updateGridConfig(
                  isDocumentDetailGrid
                    ? { defaultQuery: value, sourceCondition: value }
                    : { defaultQuery: value },
                )}
              />
            </div>
          ) : isBillDetailGridConfig ? (
            <div className="space-y-0">
              <GridConfigSummarySection
                title="明细表属性"
                activeTitle={context.title}
                currentTableType={currentGridConfig.tableType}
                onUpdateTableType={(nextType) => updateGridConfig({ tableType: nextType })}
                tableTypeOptions={tableTypeOptions}
                detailGridFillTypeMeta={detailGridFillTypeMeta}
                chartTypeLabel={detailChartTypeOptions.find((option) => option.value === String(currentDetailChartConfig.chartType))?.label ?? '未设置'}
                chartTitle={currentDetailChartConfig.chartTitle || context.title}
                availableGridColumnCount={availableGridColumns.length}
                contextMenuCount={contextMenuItems.length}
                enabledColorRuleCount={enabledColorRuleCount}
                xAxisField={currentDetailChartConfig.XLabelField || ''}
                yAxisField={currentDetailChartConfig.YValueField || ''}
              />
              <GridSqlConfigSection
                isDetailConfig={useDetailSqlConfig}
                sqlPrompt={currentGridConfig.sqlPrompt || ''}
                mainSql={currentGridConfig.mainSql || ''}
                conditionValue={useDetailSqlConfig ? (currentGridConfig.sourceCondition || currentGridConfig.defaultQuery || '') : (currentGridConfig.defaultQuery || '')}
                mainSqlLabel="明细 SQL"
                isGeneratingSqlDraft={isGeneratingSqlDraft}
                layoutMode="section"
                onGenerateSqlDraft={generateGridSqlDraft}
                onUpdateSqlPrompt={(value) => updateGridConfig({ sqlPrompt: value })}
                onUpdateMainSql={(value) => updateGridConfig({ mainSql: value })}
                onUpdateConditionValue={(value) => updateGridConfig(
                  useDetailSqlConfig
                    ? { defaultQuery: value, sourceCondition: value }
                    : { defaultQuery: value },
                )}
              />
              <GridIdentifierTranslationSection
                availableGridColumnCount={availableGridColumns.length}
                translatableColumnCount={translatableColumns.length}
                isTranslatingIdentifiers={isTranslatingIdentifiers}
                onTranslate={translateGridIdentifiers}
              />
            </div>
          ) : isLeftGridConfig ? (
            <div className="space-y-0">
              <LeftGridMappingSection
                hasTreeRelationColumn={Boolean(treeRelationColumn)}
                onLocateOwnerField={() => {
                  if (!treeRelationColumn) return;
                  setSelectedMainForDelete([treeRelationColumn.id]);
                  activateColumnSelection('main', treeRelationColumn.id);
                  setInspectorPanelTab('common');
                }}
                treeOwnerFieldName={treeOwnerField?.name || ''}
                treeOwnerFieldKey={treeOwnerFieldKey}
                leftFilterCount={leftFilterFields.length}
                documentConditionOwnerSourceId={documentConditionOwnerSourceId}
                contextMenuCount={contextMenuItems.length}
                colorRuleCount={colorRules.length}
                onOpenContextMenus={onOpenContextMenus}
                onOpenColorRules={onOpenColorRules}
              />
              <GridConfigSummarySection
                title="左侧树表属性"
                activeTitle={context.title}
                currentTableType={currentGridConfig.tableType}
                onUpdateTableType={(nextType) => updateGridConfig({ tableType: nextType })}
                tableTypeOptions={tableTypeOptions}
                detailGridFillTypeMeta={detailGridFillTypeMeta}
                chartTypeLabel={detailChartTypeOptions.find((option) => option.value === String(currentDetailChartConfig.chartType))?.label ?? '未设置'}
                chartTitle={currentDetailChartConfig.chartTitle || context.title}
                availableGridColumnCount={availableGridColumns.length}
                contextMenuCount={contextMenuItems.length}
                enabledColorRuleCount={enabledColorRuleCount}
                xAxisField={currentDetailChartConfig.XLabelField || ''}
                yAxisField={currentDetailChartConfig.YValueField || ''}
              />
            </div>
          ) : isDocumentDetailGrid ? (
            <div className="space-y-0">
              {isDetailChartInspector ? (
                <DetailChartConfigSection
                  chartTypeOptions={detailChartTypeOptions}
                  currentDetailChartConfig={currentDetailChartConfig}
                  currentDetailTabName={currentDetailTabName}
                  datalistId={`detail-chart-field-options-${context.scope}-${activeTab}`}
                  detailChartFieldOptions={detailChartFieldOptions}
                  onUpdateChartConfig={updateDetailChartConfig}
                />
              ) : (
                <>
                  <GridConfigSummarySection
                    title={detailGridSummaryTitle}
                    activeTitle={currentDetailTabName}
                    currentTableType={currentGridConfig.tableType}
                    onUpdateTableType={(nextType) => updateGridConfig({ tableType: nextType })}
                    tableTypeOptions={tableTypeOptions}
                    detailGridFillTypeMeta={detailGridFillTypeMeta}
                    chartTypeLabel={detailChartTypeOptions.find((option) => option.value === String(currentDetailChartConfig.chartType))?.label ?? '未设置'}
                    chartTitle={currentDetailChartConfig.chartTitle || context.title}
                    availableGridColumnCount={availableGridColumns.length}
                    contextMenuCount={contextMenuItems.length}
                    enabledColorRuleCount={enabledColorRuleCount}
                    xAxisField={currentDetailChartConfig.XLabelField || ''}
                    yAxisField={currentDetailChartConfig.YValueField || ''}
                  />
                  <GridSqlConfigSection
                    isDetailConfig={isDocumentDetailGrid}
                    sqlPrompt={currentGridConfig.sqlPrompt || ''}
                    mainSql={currentGridConfig.mainSql || ''}
                    conditionValue={currentGridConfig.sourceCondition || currentGridConfig.defaultQuery || ''}
                    conditionLabel="关联条件"
                    hideSqlPrompt={isDetailModuleInheritanceMode}
                    isGeneratingSqlDraft={isGeneratingSqlDraft}
                    mainSqlLabel={isDetailModuleInheritanceMode ? '继承主表 SQL' : '明细 SQL'}
                    onBlurMainSql={isDetailModuleInheritanceMode ? undefined : (value) => syncDetailColumnsFromSqlById(activeTab, value, { notify: false })}
                    onGenerateSqlDraft={generateGridSqlDraft}
                    onUpdateSqlPrompt={(value) => updateGridConfig({ sqlPrompt: value })}
                    onUpdateMainSql={(value) => updateGridConfig({ mainSql: value })}
                    onUpdateConditionValue={(value) => {
                      updateGridConfig({
                        defaultQuery: value,
                        sourceCondition: value,
                      });
                      updateActiveDetailTabConfig({ relatedCondition: value });
                    }}
                    readOnlyMainSql={isDetailModuleInheritanceMode}
                    sectionDescription={isDetailModuleInheritanceMode
                      ? '当前明细已继承目标模块的主表配置。'
                      : '当前明细使用独立 SQL 配置。'}
                    showGenerateButton={!isDetailModuleInheritanceMode}
                    title={isDetailModuleInheritanceMode ? '继承主表配置' : '明细 SQL'}
                  />
                  {!isDetailModuleInheritanceMode ? (
                    <GridIdentifierTranslationSection
                      availableGridColumnCount={availableGridColumns.length}
                      translatableColumnCount={translatableColumns.length}
                      isTranslatingIdentifiers={isTranslatingIdentifiers}
                      onTranslate={translateGridIdentifiers}
                    />
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {isDocumentArchiveGrid ? (
                <>
                  <DocumentMainTableSetupSection
                    isGeneratingSqlDraft={isGeneratingSqlDraft}
                    mainTableHiddenColumnsCount={mainTableHiddenColumnsCount}
                    mainTableName={String(currentGridConfig.tableName || '')}
                    onGenerateSqlDraft={createMainTableWithAi}
                    onOpenMainHiddenColumnsModal={onOpenMainHiddenColumnsModal}
                    onUpdateMainTableName={(value) => updateGridConfig({ tableName: value })}
                    showMainHiddenColumnsAction={isMainGridConfig}
                  />
                  <GridIdentifierTranslationSection
                    availableGridColumnCount={availableGridColumns.length}
                    translatableColumnCount={translatableColumns.length}
                    isTranslatingIdentifiers={isTranslatingIdentifiers}
                    onTranslate={translateGridIdentifiers}
                  />
                </>
              ) : null}
              <GridConfigSummarySection
                title={detailGridFillTypeMeta?.value === '图表' ? '图表加载属性' : '主表属性'}
                activeTitle={context.title}
                currentTableType={currentGridConfig.tableType}
                onUpdateTableType={(nextType) => updateGridConfig({ tableType: nextType })}
                tableTypeOptions={tableTypeOptions}
                detailGridFillTypeMeta={detailGridFillTypeMeta}
                chartTypeLabel={detailChartTypeOptions.find((option) => option.value === String(currentDetailChartConfig.chartType))?.label ?? '未设置'}
                chartTitle={currentDetailChartConfig.chartTitle || context.title}
                availableGridColumnCount={availableGridColumns.length}
                contextMenuCount={contextMenuItems.length}
                enabledColorRuleCount={enabledColorRuleCount}
                xAxisField={currentDetailChartConfig.XLabelField || ''}
                yAxisField={currentDetailChartConfig.YValueField || ''}
              />
              <GridSqlConfigSection
                isDetailConfig={isDocumentDetailGrid}
                sqlPrompt={currentGridConfig.sqlPrompt || ''}
                mainSql={currentGridConfig.mainSql || ''}
                conditionValue={isDocumentDetailGrid ? (currentGridConfig.sourceCondition || currentGridConfig.defaultQuery || '') : (currentGridConfig.defaultQuery || '')}
                isGeneratingSqlDraft={isGeneratingSqlDraft}
                onGenerateSqlDraft={generateGridSqlDraft}
                onUpdateSqlPrompt={(value) => updateGridConfig({ sqlPrompt: value })}
                onUpdateMainSql={(value) => updateGridConfig({ mainSql: value })}
                onUpdateConditionValue={(value) => updateGridConfig(
                  isDocumentDetailGrid
                    ? { defaultQuery: value, sourceCondition: value }
                    : { defaultQuery: value },
                )}
                showGenerateButton={!isDocumentArchiveGrid}
              />
              {!isDocumentArchiveGrid ? (
                <GridIdentifierTranslationSection
                  availableGridColumnCount={availableGridColumns.length}
                  translatableColumnCount={translatableColumns.length}
                  isTranslatingIdentifiers={isTranslatingIdentifiers}
                  onTranslate={translateGridIdentifiers}
                />
              ) : null}
            </div>
          )
        ) : (
          isBillHeadGridConfig || isBillDetailGridConfig ? (
            <div className="space-y-3">
              {onRenderAdvancedPlaceholder('当前模式暂无扩展配置')}
            </div>
          ) : isLeftGridConfig ? (
            <div className="space-y-3">
              <section className={compactCardClass}>
                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-100">
                  <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">view_stream</span>
                  <h4>左侧布局</h4>
                </div>
                <div className="mt-3 rounded-[16px] border border-dashed border-slate-200/60 bg-white/70 px-4 py-6 text-[12px] leading-6 text-slate-500 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                  左侧树表暂不启用详情分组布局。列、条件、右键和颜色请分别在对应页签维护，动态 SQL 直接在所属树形字段的“基础定义”里配置。
                </div>
              </section>
            </div>
          ) : isDocumentArchiveGrid && isMainGridConfig ? (
            <div className="space-y-3">
              <ArchiveLayoutSummarySection
                availableGridColumnCount={availableGridColumns.length}
                compactCardClass={compactCardClass}
                groups={currentDetailBoard.groups}
                onOpenConditionEditor={() => onOpenConditionWorkbench(isLeftGridConfig ? 'left' : 'main')}
                onOpenEditor={onOpenArchiveLayoutEditor}
                onOpenPreview={() => onOpenDetailBoardPreview(1, currentDetailBoard.sortColumnId)}
                onSelectGroup={setSelectedDetailBoardGroupId}
                sectionTitleClass={sectionTitleClass}
                selectedGroupId={selectedDetailBoardGroupId}
              />
            </div>
          ) : isDocumentDetailGrid && isDetailChartInspector ? (
            <div className="space-y-3">
              {onRenderAdvancedPlaceholder('图表视图暂无额外扩展配置')}
            </div>
          ) : (
            <div className="space-y-3">
              <DetailBoardLayoutManagerContainer
                DesignerWorkbenchDraggableItem={DesignerWorkbenchDraggableItem}
                DesignerWorkbenchDropLane={DesignerWorkbenchDropLane}
                activeDetailBoardResize={activeDetailBoardResize}
                availableGridColumns={availableGridColumns}
                compactCardClass={compactCardClass}
                currentDetailBoard={currentDetailBoard}
                designerWorkbenchSensors={designerWorkbenchSensors}
                detailBoardClipboardIds={detailBoardClipboardIds}
                detailBoardFieldDefaultWidth={detailBoardFieldDefaultWidth}
                detailBoardTheme={detailBoardTheme}
                emptyFieldsNode={onRenderAdvancedPlaceholder('还没有可分组字段')}
                normalizeColumn={normalizeColumn}
                onOpenDetailBoardPreview={onOpenDetailBoardPreview}
                onResetDetailBoardFieldWidth={onResetDetailBoardFieldWidth}
                onResetMainSelection={onResetMainSelection}
                onShowToast={showToast}
                onStartDetailBoardFieldResize={onStartDetailBoardFieldResize}
                onUpdateDetailBoard={updateDetailBoard}
                parseDetailBoardClipboardColumnIds={parseDetailBoardClipboardColumnIds}
                renderFieldPreview={renderFieldPreview}
                sectionTitleClass={sectionTitleClass}
                selectedDetailBoardGroupId={selectedDetailBoardGroupId}
                setSelectedDetailBoardGroupId={setSelectedDetailBoardGroupId}
              />
            </div>
          )
        )}
      </div>
      <SingleTableMainFieldSettingsModal
        currentModuleCode={fieldSettingsModuleCode}
        initialFieldId={fieldSettingsModalState?.initialFieldId ?? null}
        isOpen={fieldSettingsModalState != null}
        mode={fieldSettingsModalState?.mode ?? 'single-table-main'}
        onClose={() => setFieldSettingsModalState(null)}
        onPreferenceError={showToast}
        onSave={saveFieldSettings}
        preferenceScope={fieldSettingsPreferenceScope}
        rows={modalRows}
        tableLabel={modalTableLabel}
      />
    </div>
  );
}
