import React, { useState, useRef, useCallback, useMemo } from 'react';
import { type DesignRouteContext } from '../app/contracts/platform-routing';
import {
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  type SingleTableDetailDto,
} from '../lib/backend-module-config';
import {
  useWorkbenchResizeState,
} from '../features/dashboard/resize/use-workbench-resize-state';
import { useDashboardTheme } from '../features/dashboard/hooks/use-dashboard-theme';
import {
  designerWorkbenchRowActiveClass,
  designerWorkbenchRowEmptyClass,
  getCompactWorkbenchItemClass,
} from '../features/dashboard/designer/control-item-classes';
import {
  useWorkbenchFieldPreviewRenderer,
} from '../features/dashboard/designer/field-preview';
import {
  createRuntimeClassName,
  createRuntimeDeclarationBlock,
  joinRuntimeDeclarationBlocks,
} from '../features/dashboard/designer/runtime-dimension-rules';
import { DesignerWorkbenchPointerSensor } from '../features/dashboard/dashboard-workbench-pointer-sensor';
import {
  DesignerWorkbenchDraggableItem,
  DesignerWorkbenchDropLane,
} from '../features/dashboard/dashboard-workbench-dnd';
import { buildDashboardScreenRuntimeBuilderConfig } from '../features/dashboard/dashboard-screen-runtime-builder-config';
import type { DashboardWorkbench } from '../features/dashboard/dashboard-workbench-types';
import { useDashboardScreenRuntime } from '../features/dashboard/use-dashboard-screen-runtime';
import {
  type ConditionWorkbenchScope,
} from '../features/dashboard/module-settings/condition-workbench';
import {
  BUSINESS_TYPE_OPTIONS,
  MENU_CONFIG_TABLE_DESC,
  MENU_CONFIG_TABLE_NAME,
  MODULE_GUIDE_PROFILES,
  MODULE_TYPE_OPTIONS,
  getMenuModuleTypeProfile,
  toDraftText,
  type BusinessType,
} from '../features/dashboard/module-settings/dashboard-menu-config-helpers';
import {
  BILL_FORM_DEFAULT_FONT_SIZE,
  BILL_FORM_DEFAULT_LABEL_WIDTH,
  BILL_FORM_DEFAULT_WIDTH,
  BILL_FORM_MAX_WIDTH,
  BILL_FORM_MIN_WIDTH,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
  BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
  getBillFieldLayout,
} from '../features/dashboard/module-settings/dashboard-bill-form-layout-utils';
import {
  mapSingleTableDetailGridFieldToColumn,
  mapSingleTableFieldRecordToColumn,
} from '../features/dashboard/module-settings/dashboard-single-table-field-mappers';
import {
  buildDashboardDefaultBillDetailConfig,
  buildDashboardDefaultLeftTableConfig,
  buildDashboardDefaultMainTableConfig,
  buildDashboardDetailTabConfig,
  buildDashboardGridColorRule,
  buildDashboardGridConfig,
  normalizeDashboardDetailChartConfig,
} from '../features/dashboard/module-settings/dashboard-single-table-grid-config-builders';
import {
  mapSingleTableColorRule as mapDashboardSingleTableColorRule,
  mapSingleTableContextMenuItem as mapDashboardSingleTableContextMenuItem,
  mapSingleTableDetailChartConfig as mapDashboardSingleTableDetailChartConfig,
  mapSingleTableDetailRecord as mapDashboardSingleTableDetailRecord,
} from '../features/dashboard/module-settings/dashboard-single-table-resource-mappers';
import {
  buildDashboardColumn,
  buildDashboardConditionField,
  buildTreeRelationFallbackColumns as buildDashboardTreeRelationFallbackColumns,
  mapSingleTableConditionRecordToField as mapDashboardSingleTableConditionRecordToField,
  mapSingleTableGridFieldRecordToColumn as mapDashboardSingleTableGridFieldRecordToColumn,
  normalizeDashboardColumn,
  normalizeDashboardConditionField,
  parseSqlFieldNames as parseDashboardSqlFieldNames,
} from '../features/dashboard/module-settings/dashboard-single-table-workspace-utils';
import {
  BILL_SOURCE_CONFIG_TYPE_OPTIONS,
  BILL_SOURCE_TYPE_OPTIONS,
  COLUMN_ALIGN_OPTIONS,
  DEFAULT_FIELD_SQL_TAG_OPTIONS,
  FIELD_SQL_TAG_LABEL_FALLBACKS,
  FIELD_TYPE_OPTIONS,
  GRID_COLOR_RULE_OPERATOR_OPTIONS,
  TABLE_TYPE_OPTIONS,
  getDashboardErrorMessage,
  getFieldSqlTagOptionLabel,
  getRecordFieldValue,
  isTreeRelationFieldColumn,
  mapFieldSqlTagToFieldType,
  normalizeFieldSqlTagId,
  normalizeMenuCode,
  normalizeMenuTitle,
  normalizeModuleType,
  resolveColumnFieldSqlTagId,
  stripBraces,
  toRecordNumber,
  toRecordText,
} from '../features/dashboard/module-settings/dashboard-field-type-utils';
import {
  buildDocumentFilterRuntimeRules,
  clampValue,
  CONDITION_PANEL_CONTROL_WIDTH,
  CONDITION_PANEL_MAX_ROWS,
  CONDITION_PANEL_MIN_ROWS,
  CONDITION_PANEL_RESIZE_MAX_WIDTH,
  CONDITION_PANEL_RESIZE_MIN_WIDTH,
  CONDITION_PANEL_ROW_GAP,
  CONDITION_PANEL_ROW_HEIGHT,
  CONDITION_WORKBENCH_HELPERS,
  CONDITION_WORKBENCH_METRICS,
} from '../features/dashboard/module-settings/dashboard-condition-workbench-utils';
import {
  DETAIL_CHART_TYPE_OPTIONS,
  DETAIL_FILL_TYPE_OPTIONS,
  getDetailFillTypeBackendValue,
  getDetailFillTypeMeta,
  isAbsoluteHttpUrl,
  joinHttpUrl,
} from '../features/dashboard/module-settings/dashboard-detail-fill-utils';
import {
  buildResizeSnapCandidates,
  resolveResizeWidthWithSnap,
} from '../features/dashboard/module-settings/dashboard-resize-snap-utils';
import {
  BILL_HEADER_WORKBENCH_MAX_ROWS,
  BILL_HEADER_WORKBENCH_MIN_ROWS,
  COMMON_FUNCTION_OPTIONS,
  DASHBOARD_CONFIG_STEPS,
  MAX_CONFIG_STEP,
  MODULE_PREVIEW_STEP,
  MODULE_SETTING_STEP,
  PROCESS_DESIGN_STEP,
  RESTRICTION_STEP,
  TABLE_COLUMN_AUTO_FIT_MAX_WIDTH,
  TABLE_COLUMN_COLLAPSED_RENDER_WIDTH,
  TABLE_COLUMN_MIN_WIDTH,
  TABLE_COLUMN_RESIZE_MAX_WIDTH,
  TABLE_COLUMN_RESIZE_MIN_WIDTH,
} from '../features/dashboard/module-settings/dashboard-shell-constants';
import { useBillSourceState } from '../features/dashboard/module-settings/use-bill-source-state';
import { useDashboardConfigShellState } from '../features/dashboard/module-settings/use-dashboard-config-shell-state';
import { useDashboardMenuConfigIo } from '../features/dashboard/module-settings/use-dashboard-menu-config-io';
import { useDashboardMenuConfigBootstrap } from '../features/dashboard/module-settings/use-dashboard-menu-config-bootstrap';
import { useDashboardMenuDeleteFlow } from '../features/dashboard/module-settings/use-dashboard-menu-delete-flow';
import { useDashboardMenuInfo } from '../features/dashboard/module-settings/use-dashboard-menu-info';
import { useDashboardMenuGuideActions } from '../features/dashboard/module-settings/use-dashboard-menu-guide-actions';
import { useDashboardMenuWorkspace } from '../features/dashboard/module-settings/use-dashboard-menu-workspace';
import { buildDashboardModuleSettingRuntimeBuilderConfig } from '../features/dashboard/module-settings/dashboard-module-setting-runtime-builder-config';
import {
  parseDetailBoardClipboardColumnIds,
  useDashboardDetailBoardClipboard,
} from '../features/dashboard/module-settings/use-dashboard-detail-board-clipboard';
import { useDashboardDetailTabConfigSync } from '../features/dashboard/module-settings/use-dashboard-detail-tab-config-sync';
import { useDashboardDetailWorkspaceSync } from '../features/dashboard/module-settings/use-dashboard-detail-workspace-sync';
import { useDashboardContextMenuDismiss } from '../features/dashboard/module-settings/use-dashboard-context-menu-dismiss';
import { useDashboardFieldSqlTagOptions } from '../features/dashboard/module-settings/use-dashboard-field-sql-tag-options';
import { useDashboardGridMenuSelectionState } from '../features/dashboard/module-settings/use-dashboard-grid-menu-selection-state';
import { useDashboardWorkbenchColumnActions } from '../features/dashboard/module-settings/use-dashboard-workbench-column-actions';
import { useDashboardDetailBoardActions } from '../features/dashboard/module-settings/use-dashboard-detail-board-actions';
import { useDashboardSelectionActions } from '../features/dashboard/module-settings/use-dashboard-selection-actions';
import { useDashboardSingleTableModuleRuntime } from '../features/dashboard/module-settings/use-dashboard-single-table-module-runtime';
import { useBillTypeSettingsSave } from '../features/dashboard/module-settings/use-bill-type-settings-save';
import { useDashboardSurveyFlow } from '../features/dashboard/module-settings/use-dashboard-survey-flow';
import { useDashboardWorkbenchEditActions } from '../features/dashboard/module-settings/use-dashboard-workbench-edit-actions';
import { useDashboardWorkbenchActions } from '../features/dashboard/module-settings/use-dashboard-workbench-actions';
import { buildDashboardDocumentConditionWorkbenchBuilderConfig } from '../features/dashboard/module-settings/dashboard-document-condition-workbench-builder-config';
import { buildDashboardInspectorRuntimeBuilderConfig } from '../features/dashboard/module-settings/dashboard-inspector-runtime-builder-config';
import { useDashboardInspectorSelectionMeta } from '../features/dashboard/module-settings/use-dashboard-inspector-selection-meta';
import { useDashboardInspectorRuntime } from '../features/dashboard/module-settings/use-dashboard-inspector-runtime';
import { useDashboardInspectorWorkspaceSync } from '../features/dashboard/module-settings/use-dashboard-inspector-workspace-sync';
import { useDashboardModuleDesignerReset } from '../features/dashboard/module-settings/use-dashboard-module-designer-reset';
import { useDashboardModuleSettingFullscreenInit } from '../features/dashboard/module-settings/use-dashboard-module-setting-fullscreen-init';
import { useDashboardDetailWorkspaceMeta } from '../features/dashboard/module-settings/use-dashboard-detail-workspace-meta';
import { useDashboardToast } from '../features/dashboard/module-settings/use-dashboard-toast';
import { useDashboardWorkbenchNav } from '../features/dashboard/module-settings/use-dashboard-workbench-nav';
import { useDashboardWorkspaceMeta } from '../features/dashboard/module-settings/use-dashboard-workspace-meta';
import { useDashboardConfigWizardNav } from '../features/dashboard/module-settings/use-dashboard-config-wizard-nav';
import { useDocumentConditionWorkbench } from '../features/dashboard/module-settings/use-document-condition-workbench';
import { useDocumentWorkspaceLayout } from '../features/dashboard/module-settings/use-document-workspace-layout';
import {
  DETAIL_BOARD_THEME_OPTIONS,
  getDetailBoardTheme,
  normalizeDetailBoardConfig,
} from '../features/dashboard/module-settings/detail-board-config';
import { BillDocumentWorkbench } from '../features/dashboard/module-settings/bill-document-workbench';
import { useBillDocumentLayout } from '../features/dashboard/module-settings/use-bill-document-layout';
import { useBillFieldResize } from '../features/dashboard/module-settings/use-bill-field-resize';
import { useBillHeaderWorkbench } from '../features/dashboard/module-settings/use-bill-header-workbench';
import { buildDashboardConfigWizardStepBuilderConfig } from '../features/dashboard/module-settings/dashboard-config-wizard-step-builder-config';
import { buildDashboardConfigWizardStepNodes } from '../features/dashboard/module-settings/dashboard-config-wizard-step-nodes';
import {
  DETAIL_BOARD_FIELD_DEFAULT_WIDTH,
  DETAIL_BOARD_FIELD_MAX_WIDTH,
  DETAIL_BOARD_FIELD_MIN_WIDTH,
  DETAIL_BOARD_TALL_FIELD_DEFAULT_HEIGHT,
  DETAIL_BOARD_TALL_FIELD_MAX_HEIGHT,
  DETAIL_BOARD_TALL_FIELD_MIN_HEIGHT,
  useLayoutFieldWorkbenchMeta,
} from '../features/dashboard/module-settings/layout-field-workbench-meta';
import { useModuleIntroEditor } from '../features/dashboard/module-settings/use-module-intro-editor';
import { useEnsureSingleTableModule } from '../features/dashboard/module-settings/use-ensure-single-table-module';
import {
  type LongTextEditorState,
} from '../features/dashboard/module-settings/long-text-editor-modal';
import { useRestrictionWorkbenchState } from '../features/dashboard/module-settings/use-restriction-workbench-state';
import { buildDashboardTableBuilderRuntimeBuilderConfig } from '../features/dashboard/table-builder/dashboard-table-builder-runtime-builder-config';
import { useDashboardTableBuilderRuntime } from '../features/dashboard/table-builder/use-dashboard-table-builder-runtime';
import { getStoredAuthSession } from '../lib/auth-session';
import {
  updateCurrentDesignSearch,
} from '../platforms/design/navigation/design-navigation';

interface DashboardWorkspaceState {
  initialConfigOpen?: boolean;
  initialConfigStep?: number;
  initialDetailPreview?: boolean;
  initialModuleCode?: string;
  initialBusinessType?: string;
  initialWorkbench?: DashboardWorkbench;
  initialWorkspaceTheme?: string;
  menuBridge?: {
    initialMenuCode?: string;
    initialModuleCode?: string;
    initialSubsystemCode?: string;
  };
  routeContext?: DesignRouteContext;
  syncMenuIntent?: (intent: Partial<Pick<DesignRouteContext, 'subsystemCode' | 'menuCode' | 'moduleCode'>>, options?: { replace?: boolean }) => void;
  syncUrlState?: (patch: Partial<{
    configOpen: boolean;
    configStep: number | null;
    detailPreview: boolean;
    mode: string | null;
    moduleCode: string | null;
    theme: string | null;
    workbench: DashboardWorkbench | null;
  }>, options?: { replace?: boolean }) => void;
}

interface DashboardProps {
  activeCompanyTitle?: string;
  currentUserName: string;
  onLogout: () => void;
  onSwitchCompany?: () => void;
  routeContext?: DesignRouteContext;
  workspaceState?: DashboardWorkspaceState;
}

const DEFAULT_DESIGN_ROUTE_CONTEXT: DesignRouteContext = {};

type BillCanvasFieldScope = 'main' | 'meta';
type BillHeaderWorkbenchConfig = {
  rows: number;
};
export default function Dashboard({
  activeCompanyTitle,
  currentUserName,
  onLogout,
  onSwitchCompany,
  routeContext,
  workspaceState,
}: DashboardProps) {
  const resolvedRouteContext = workspaceState?.routeContext ?? routeContext ?? DEFAULT_DESIGN_ROUTE_CONTEXT;
  const menuBridgeState = workspaceState?.menuBridge;
  const syncWorkspaceMenuIntent = workspaceState?.syncMenuIntent;
  const syncWorkspaceUrlState = workspaceState?.syncUrlState;
  const initialConfigStep = Number.isFinite(workspaceState?.initialConfigStep)
    ? Math.min(MAX_CONFIG_STEP, Math.max(1, Number(workspaceState?.initialConfigStep)))
    : 1;
  const initialConfigOpen = workspaceState?.initialConfigOpen ?? false;
  const initialDetailPreview = workspaceState?.initialDetailPreview ?? false;
  const initialRouteModuleCode = normalizeMenuCode(
    workspaceState?.initialModuleCode || menuBridgeState?.initialModuleCode || '',
  );
  const initialBusinessType = BUSINESS_TYPE_OPTIONS.some((option) => option.value === workspaceState?.initialBusinessType)
    ? (String(workspaceState?.initialBusinessType) as BusinessType)
    : 'document';
  const initialWorkspaceTheme = DETAIL_BOARD_THEME_OPTIONS.some((option) => option.value === workspaceState?.initialWorkspaceTheme)
    ? String(workspaceState?.initialWorkspaceTheme)
    : 'aurora';
  const authSession = useMemo(() => getStoredAuthSession(), []);
  const isCurrentUserAdmin = Boolean(authSession?.isAdmin);
  const [isServerPermissionWorkbenchActive, setIsServerPermissionWorkbenchActive] = useState(false);
  const {
    activeConfigMenu,
    activeWorkbench,
    businessType,
    commonFuncs,
    completedSteps,
    configStep,
    isConfigOpen,
    isFullscreenConfig,
    isFuncPopoverOpen,
    isMenuInfoLoading,
    isMenuInfoSaving,
    isSingleTableFieldsLoading,
    isSubsystemSidebarOpen,
    menuConfigDraft,
    menuInfoError,
    menuInfoTab,
    menuPageRefreshNonce,
    menuPinnedFields,
    prepareMenuWorkspaceSwitch,
    restrictionActiveTab,
    setActiveConfigMenu,
    setActiveWorkbench,
    setBusinessType,
    setCompletedSteps,
    setConfigStep,
    setIsConfigOpen,
    setIsFullscreenConfig,
    setIsFuncPopoverOpen,
    setIsMenuInfoLoading,
    setIsMenuInfoSaving,
    setIsSingleTableFieldsLoading,
    setMenuConfigDraft,
    setMenuInfoError,
    setMenuInfoTab,
    setMenuPageRefreshNonce,
    setMenuPinnedFields,
    setRestrictionActiveTab,
    toggleCommonFunc,
    toggleSubsystemSidebarOpen,
  } = useDashboardConfigShellState({
    initialBusinessType,
    initialConfigOpen,
    initialConfigStep,
    initialWorkbench: workspaceState?.initialWorkbench,
  });
  const {
    activeFirstLevelMenu,
    activeFirstLevelMenuId,
    activeSubsystem,
    expandedSubsystemId,
    handleFirstLevelMenuClick,
    isLoadingSecondLevelMenus,
    isLoadingSubsystemMenus,
    menuLoadError,
    reloadSubsystemMenus,
    secondLevelMenus,
    selectedSubsystem,
    setSecondLevelMenus,
    subsystemMenus,
    toggleSubsystemExpansion,
  } = useDashboardMenuWorkspace({
    initialMenuCode: menuBridgeState?.initialMenuCode,
    initialSubsystemCode: menuBridgeState?.initialSubsystemCode,
    menuPageRefreshNonce,
    onFirstLevelMenuClick: prepareMenuWorkspaceSwitch,
    routeMenuCode: resolvedRouteContext.menuCode,
    routeSubsystemCode: resolvedRouteContext.subsystemCode,
    syncWorkspaceMenuIntent,
  });
  const currentModuleCode = String(menuConfigDraft.moduleCode || activeConfigMenu?.purviewId || '');
  const currentModuleName = String(menuConfigDraft.menuCaption || activeConfigMenu?.title || '');
  const activeConfigModuleKey = normalizeMenuCode(toDraftText(menuConfigDraft.moduleCode || activeConfigMenu?.purviewId));
  const {
    advancedFilledMenuFieldCount,
    commonFilledMenuFieldCount,
    currentAdvancedMenuKeys,
    currentAdvancedMenuSections,
    currentMenuDraft,
    currentMenuFieldEntries,
    currentMenuFieldMap,
    currentModuleGuide,
    currentPinnedMenuKeys,
    currentPinnedMenuKeySet,
    currentCommonMenuSections,
    filledMenuFieldCount,
  } = useDashboardMenuInfo({
    businessType,
    menuConfigDraft,
    menuPinnedFields,
  });

  // Step 2: Editor
  const moduleSettingsSectionRef = useRef<HTMLDivElement | null>(null);
  const {
    showToast,
    toastMessage,
  } = useDashboardToast();
  const {
    generateSurveyPlan,
    isGenerating,
    isGeneratingSqlDraft,
    isTranslatingIdentifiers,
    resetSurveyFlow,
    setIsGenerating,
    setIsGeneratingSqlDraft,
    setIsTranslatingIdentifiers,
    setSurveyAnswers,
    setSurveyError,
    setSurveyPlan,
    setSurveyPlanModel,
    setSurveyStep,
    surveyAnswers,
    surveyError,
    surveyPlan,
    surveyPlanModel,
    surveyStep,
  } = useDashboardSurveyFlow({ showToast });

  const isSingleTableModuleBranch = normalizeModuleType(activeConfigMenu?.moduleType) === 'single-table';
  const isMenuInfoBuilt = Boolean(activeConfigMenu?.menuId && activeConfigModuleKey);
  const {
    isReady: isSingleTableModuleReady,
    isLoading: isSingleTableModuleEnsuring,
  } = useEnsureSingleTableModule({
    currentModuleCode: activeConfigModuleKey,
    currentModuleName,
    isActive: isConfigOpen && configStep >= MODULE_SETTING_STEP && isSingleTableModuleBranch && isMenuInfoBuilt,
    onShowToast: showToast,
  });
  const canLoadSingleTableModuleResources = (
    isConfigOpen
    && configStep === MODULE_SETTING_STEP
    && isSingleTableModuleBranch
    && Boolean(activeConfigModuleKey)
    && isSingleTableModuleReady
  );
  const [isDocumentConditionWorkbenchOpen, setIsDocumentConditionWorkbenchOpen] = useState(false);
  const closeConfigWizard = useCallback(() => {
    setIsConfigOpen(false);
    setIsDocumentConditionWorkbenchOpen(false);
    setMenuPageRefreshNonce((prev) => prev + 1);
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({
        configOpen: false,
        moduleCode: null,
      }, { replace: true });
    } else {
      updateCurrentDesignSearch({
        config: null,
        module: null,
        step: null,
      }, { replace: true });
    }
  }, [
    setIsConfigOpen,
    setIsDocumentConditionWorkbenchOpen,
    setMenuPageRefreshNonce,
    syncWorkspaceUrlState,
  ]);

  const {
    closeDeleteConfirm,
    confirmDeleteMenu,
    deletingMenuId,
    pendingDeleteMenu,
    requestDeleteMenu: setPendingDeleteMenu,
  } = useDashboardMenuDeleteFlow({
    activeConfigMenu,
    closeConfigWizard,
    setActiveConfigMenu,
    setMenuInfoError,
    setSecondLevelMenus,
    showToast,
  });

  const {
    isFullscreenEditor,
    moduleIntroActions,
    moduleIntroBlockType,
    moduleIntroRefs,
    moduleIntroSelectedImageWidth,
  } = useModuleIntroEditor({
    isActive: configStep === 3,
    showToast,
  });

  const markStepCompleted = useCallback((stepId: number) => {
    setCompletedSteps((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]));
  }, [setCompletedSteps]);

  const {
    handleConfigNext,
    handleConfigPrevious,
    handleConfigStepSelect,
    handleLockedTypeStepSelect,
  } = useDashboardConfigWizardNav({
    closeConfigWizard,
    configStep,
    isEditingMenu: activeConfigMenu !== null,
    isMenuInfoBuilt,
    isSingleTableModuleEnsuring,
    maxConfigStep: MAX_CONFIG_STEP,
    moduleSettingStep: MODULE_SETTING_STEP,
    setCompletedSteps,
    setConfigStep,
    showToast,
    syncWorkspaceUrlState,
  });

  const buildColumn = useCallback((prefix: string, index: number, overrides: Record<string, any> = {}) => (
    buildDashboardColumn(prefix, index, overrides)
  ), []);
  const buildConditionField = useCallback((index: number, overrides: Record<string, any> = {}) => (
    buildDashboardConditionField(index, overrides)
  ), []);
  const buildBillHeaderWorkbenchConfig = useCallback((overrides: Partial<BillHeaderWorkbenchConfig> = {}): BillHeaderWorkbenchConfig => ({
    rows: 3,
    ...overrides,
  }), []);
  const buildGridColorRule = useCallback((index: number, overrides: Record<string, any> = {}) => (
    buildDashboardGridColorRule(index, overrides)
  ), []);
  const mapSingleTableContextMenuItem = useCallback((item: any, index: number) => (
    mapDashboardSingleTableContextMenuItem(item, index)
  ), []);
  const mapSingleTableColorRule = useCallback((rule: any, index: number) => (
    mapDashboardSingleTableColorRule(rule, index)
  ), []);
  const normalizeDetailChartConfig = useCallback((config: any) => (
    normalizeDashboardDetailChartConfig(config)
  ), []);
  const buildGridConfig = useCallback((mainSql: string, defaultQuery: string, overrides: Record<string, any> = {}) => (
    buildDashboardGridConfig(mainSql, defaultQuery, overrides)
  ), []);
  const buildDefaultLeftTableConfig = useCallback(() => buildDashboardDefaultLeftTableConfig(), []);
  const buildDefaultMainTableConfig = useCallback(() => buildDashboardDefaultMainTableConfig(), []);
  const buildDefaultBillDetailConfig = useCallback(() => buildDashboardDefaultBillDetailConfig(), []);
  const buildDetailTabConfig = useCallback((overrides: Record<string, any> = {}) => (
    buildDashboardDetailTabConfig(currentModuleCode, overrides)
  ), [currentModuleCode]);
  const mapSingleTableDetailChartConfig = useCallback((chart: any) => (
    mapDashboardSingleTableDetailChartConfig(chart)
  ), []);
  const mapSingleTableDetailRecord = useCallback((detail: SingleTableDetailDto, index: number) => (
    mapDashboardSingleTableDetailRecord(detail, index, currentModuleCode)
  ), [currentModuleCode]);
  const parseSqlFieldNames = useCallback((sql: string) => parseDashboardSqlFieldNames(sql), []);
  const normalizeColumn = useCallback((column: any) => normalizeDashboardColumn(column), []);
  const buildTreeRelationFallbackColumns = useCallback((fields: string[], currentColumns: any[] = []) => (
    buildDashboardTreeRelationFallbackColumns(fields, currentColumns)
  ), []);
  const mapSingleTableGridFieldRecordToColumn = useCallback((field: any, index: number, existingColumn?: any) => (
    mapDashboardSingleTableGridFieldRecordToColumn(field, index, existingColumn)
  ), []);
  const normalizeConditionField = useCallback((field: any) => normalizeDashboardConditionField(field), []);
  const mapSingleTableConditionRecordToField = useCallback((condition: any, index: number, overrides: Record<string, unknown> = {}) => (
    mapDashboardSingleTableConditionRecordToField(condition, index, overrides)
  ), []);
  const [leftTableColumns, setLeftTableColumns] = useState<any[]>([]);
  const [leftTableConfig, setLeftTableConfig] = useState(() => buildDefaultLeftTableConfig());
  const [leftFilterFields, setLeftFilterFields] = useState<any[]>([]);
  const [mainTableColumns, setMainTableColumns] = useState<any[]>([]);
  const [isMainHiddenColumnsModalOpen, setIsMainHiddenColumnsModalOpen] = useState(false);
  const [selectedMainHiddenColumnIds, setSelectedMainHiddenColumnIds] = useState<string[]>([]);
  const [mainHiddenColumnsSearchText, setMainHiddenColumnsSearchText] = useState('');
  const [detailTabs, setDetailTabs] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState('');
  const [mainTableConfig, setMainTableConfig] = useState(() => buildDefaultMainTableConfig());
  const currentPrimaryTableName = String(mainTableConfig.tableName || '').trim();
  const isRenderableMainColumn = (column: any) => {
    const normalizedColumn = normalizeColumn(column);
    return normalizedColumn.visible !== false && Number(normalizedColumn.width) > 0;
  };
  const [detailTableConfigs, setDetailTableConfigs] = useState<Record<string, any>>({});
  const [mainFilterFields, setMainFilterFields] = useState<any[]>([]);
  const [detailFilterFields, setDetailFilterFields] = useState<Record<string, any[]>>({});
  const [detailTabConfigs, setDetailTabConfigs] = useState<Record<string, any>>({});
  const {
    activeDetailBackendId,
    activeDetailColorRules,
    activeDetailContextMenuItems,
    activeDetailGridConfig,
    activeDetailRelatedModuleCode,
    activeDetailWebUrl,
    currentDetailFillType,
    currentDetailFillTypeValue,
    documentConditionOwnerFieldKey,
    documentConditionOwnerSourceId,
    getDetailFillTypeByTabId,
    isTreeMainTableSyncing,
    isTreePaneVisible,
    normalizeDetailFillTypeValue,
    parsedTreeSourceFields,
    showDetailGridActionBar,
    treeRelationColumn,
  } = useDashboardDetailWorkspaceMeta({
    activeConfigMenuModuleType: activeConfigMenu?.moduleType,
    activeTab,
    buildGridConfig,
    detailFillTypeOptions: DETAIL_FILL_TYPE_OPTIONS,
    detailTabConfigs,
    detailTableConfigs,
    isSingleTableFieldsLoading,
    isTreeRelationFieldColumn,
    mainTableColumns,
    normalizeColumn,
    parseSqlFieldNames,
    stripBraces,
    toRecordNumber,
    toRecordText,
  });
  useDashboardDetailTabConfigSync({
    buildDetailTabConfig,
    currentModuleCode,
    detailTabs,
    setDetailTabConfigs,
  });
  const [inspectorTarget, setInspectorTarget] = useState<{
    kind:
      | 'none'
      | 'left-col'
      | 'main-col'
      | 'detail-col'
      | 'left-filter'
      | 'main-filter'
      | 'detail-filter'
      | 'left-filter-panel'
      | 'main-filter-panel'
      | 'detail-tab'
      | 'left-grid'
      | 'main-grid'
      | 'detail-grid'
      | 'main-grid-action'
      | 'detail-grid-action'
      | 'source-grid'
      | 'workspace-theme'
      | 'main-context'
      | 'detail-context';
    id?: string | null;
  }>({ kind: 'main-grid' });
  const [inspectorPanelTab, setInspectorPanelTab] = useState<'common' | 'advanced' | 'contextmenu' | 'color' | 'columns'>('common');
  const [selectedLeftContextMenuId, setSelectedLeftContextMenuId] = useState<string | null>(null);
  const [selectedMainContextMenuId, setSelectedMainContextMenuId] = useState<string | null>(null);
  const [selectedDetailContextMenuId, setSelectedDetailContextMenuId] = useState<string | null>(null);
  const [selectedLeftColorRuleId, setSelectedLeftColorRuleId] = useState<string | null>(null);
  const [selectedMainColorRuleId, setSelectedMainColorRuleId] = useState<string | null>(null);
  const [selectedDetailColorRuleId, setSelectedDetailColorRuleId] = useState<string | null>(null);
  const [selectedPopupMenuParamKey, setSelectedPopupMenuParamKey] = useState<string>('dllpar1');
  const [selectedLeftForDelete, setSelectedLeftForDelete] = useState<string[]>([]);
  const [selectedMainForDelete, setSelectedMainForDelete] = useState<string[]>([]);
  const [selectedLeftFiltersForDelete, setSelectedLeftFiltersForDelete] = useState<string[]>([]);
  const [selectedMainFiltersForDelete, setSelectedMainFiltersForDelete] = useState<string[]>([]);
  const fieldSqlTagOptions = useDashboardFieldSqlTagOptions({
    defaultFieldSqlTagOptions: DEFAULT_FIELD_SQL_TAG_OPTIONS,
    getFieldSqlTagOptionLabel,
    normalizeFieldSqlTagId,
  });
  const { resetGridMenuSelectionState } = useDashboardGridMenuSelectionState({
    inspectorTargetKind: inspectorTarget.kind,
    leftColorRules: leftTableConfig.colorRules ?? [],
    leftContextMenuItems: leftTableConfig.contextMenuItems ?? [],
    mainColorRules: mainTableConfig.colorRules ?? [],
    mainContextMenuItems: mainTableConfig.contextMenuItems ?? [],
    selectedLeftColorRuleId,
    selectedLeftContextMenuId,
    selectedMainColorRuleId,
    selectedMainContextMenuId,
    setSelectedLeftColorRuleId,
    setSelectedLeftContextMenuId,
    setSelectedMainColorRuleId,
    setSelectedMainContextMenuId,
    setSelectedPopupMenuParamKey,
  });

  const [detailTableColumns, setDetailTableColumns] = useState<Record<string, any[]>>({});
  const [selectedDetailForDelete, setSelectedDetailForDelete] = useState<string[]>([]);
  const [, setSelectedDetailFiltersForDelete] = useState<string[]>([]);
  const [, setSelectedArchiveNodeId] = useState('archive-main');
  const {
    activeBillSourceId,
    billSourceDraft,
    billSourceDraftMode,
    billSourceFieldMap,
    billSources,
    createBillSourceDraft,
    resetBillSourceState,
    saveBillSourceDraft,
    selectBillSourceDraft,
    setBillSourceDraft,
    updateBillSourceDraft,
  } = useBillSourceState({ showToast });
  const [billDetailColumns, setBillDetailColumns] = useState<any[]>([]);
  const [billDetailConfig, setBillDetailConfig] = useState(() => buildDefaultBillDetailConfig());
  const [billMetaFields, setBillMetaFields] = useState<any[]>([]);
  const {
    buildRestrictionMeasure,
    buildRestrictionNumberRule,
    buildRestrictionProcessDesign,
    buildRestrictionTopStructure,
    createRestrictionProcessDesignEntry,
    handleSaveRestrictionTab,
    isRestrictionTabSaving,
    resetRestrictionState,
    restrictionMeasures,
    restrictionNumberRules,
    restrictionProcessDesigns,
    restrictionSelection,
    restrictionTopStructures,
    selectedRestrictionProcessDesign,
    setRestrictionMeasures,
    setRestrictionNumberRules,
    setRestrictionProcessDesigns,
    setRestrictionSelection,
    setRestrictionTopStructures,
    updateSelectedRestrictionProcessDesign,
  } = useRestrictionWorkbenchState({
    businessType,
    currentModuleCode,
    currentModuleName,
    currentPrimaryTableName,
    getErrorMessage: getDashboardErrorMessage,
    isConfigOpen,
    isMenuInfoBuilt,
    showToast,
  });
  const [documentConditionScope, setDocumentConditionScope] = useState<ConditionWorkbenchScope>('main');
  const [billHeaderWorkbenchConfig, setBillHeaderWorkbenchConfig] = useState<BillHeaderWorkbenchConfig>(
    buildBillHeaderWorkbenchConfig(),
  );
  const [billDocumentTone, setBillDocumentTone] = useState<'blue' | 'red'>('blue');
  const {
    activeResize,
    clearResizePreview,
    scheduleResizePreview,
    setActiveResize,
  } = useWorkbenchResizeState();
  const normalizedMainDetailBoardConfig = useMemo(
    () => normalizeDetailBoardConfig(mainTableConfig.detailBoard, mainTableColumns),
    [mainTableConfig.detailBoard, mainTableColumns],
  );
  const mainDetailBoardGroups = normalizedMainDetailBoardConfig.groups;
  const mainDetailBoardEnabled = normalizedMainDetailBoardConfig.enabled;
  const {
    renderableColumns: mainRenderableColumns,
    hiddenColumns: mainTableHiddenColumns,
  } = useMemo(() => {
    const renderableColumns: any[] = [];
    const hiddenColumns: any[] = [];

    mainTableColumns.forEach((column) => {
      const normalizedColumn = normalizeColumn(column);
      if (normalizedColumn.visible !== false && Number(normalizedColumn.width) > 0) {
        renderableColumns.push(column);
        return;
      }

      hiddenColumns.push(column);
    });

    return {
      renderableColumns,
      hiddenColumns,
    };
  }, [mainTableColumns, normalizeColumn]);
  const mainDocumentFilterRuntimeRules = useMemo(
    () => buildDocumentFilterRuntimeRules(mainFilterFields, activeResize),
    [activeResize, mainFilterFields],
  );
  const conditionWorkbenchHelpers = CONDITION_WORKBENCH_HELPERS;
  const conditionWorkbenchMetrics = CONDITION_WORKBENCH_METRICS;
  const designerWorkbenchSensors = useSensors(
    useSensor(DesignerWorkbenchPointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );
  const [isDetailBoardOpen, setIsDetailBoardOpen] = useState(initialDetailPreview);
  const [detailBoardSortColumnId, setDetailBoardSortColumnId] = useState<string | null>(initialDetailPreview ? mainTableColumns[0]?.id ?? null : null);
  const [, setDetailBoardOpenedRowId] = useState<number | null>(initialDetailPreview ? 1 : null);
  const [selectedDetailBoardGroupId, setSelectedDetailBoardGroupId] = useState<string | null>(null);
  const [workspaceTheme, setWorkspaceTheme] = useState(initialWorkspaceTheme);
  const [detailBoardClipboardIds, setDetailBoardClipboardIds] = useState<string[]>([]);
  const [activeDetailBoardResize, setActiveDetailBoardResize] = useState<{
    groupId: string;
    columnId: string;
    label: string;
    width: number;
    minWidth: number;
    maxWidth: number;
    snapCandidates: number[];
  } | null>(null);
  const [activeDetailBoardHeightResize, setActiveDetailBoardHeightResize] = useState<{
    groupId: string;
    columnId: string;
    label: string;
    height: number;
    minHeight: number;
    maxHeight: number;
  } | null>(null);
  const [previewContextMenu, setPreviewContextMenu] = useState<{
    scope: 'main' | 'detail';
    rowId: number;
    x: number;
    y: number;
    items: any[];
  } | null>(null);
  const [builderSelectionContextMenu, setBuilderSelectionContextMenu] = useState<{
    kind: 'column' | 'filter';
    scope: 'left' | 'main' | 'detail';
    x: number;
    y: number;
    ids: string[];
  } | null>(null);
  const [longTextEditorState, setLongTextEditorState] = useState<LongTextEditorState | null>(null);
  const [billHeaderWorkbenchDrag, setBillHeaderWorkbenchDrag] = useState<{
    id: string;
    scope: BillCanvasFieldScope;
  } | null>(null);
  const [billHeaderWorkbenchDropTarget, setBillHeaderWorkbenchDropTarget] = useState<{
    row: number;
    beforeId: string | null;
  } | null>(null);
  const [isArchiveLayoutEditorOpen, setIsArchiveLayoutEditorOpen] = useState(false);
  const billDocumentViewportRef = useRef<HTMLDivElement | null>(null);
  const billDocumentPaperRef = useRef<HTMLDivElement | null>(null);
  const billHeaderCanvasRef = useRef<HTMLDivElement | null>(null);
  const moduleSettingFullscreenInitRef = useDashboardModuleSettingFullscreenInit({
    configStep,
    isConfigOpen,
    moduleSettingStep: MODULE_SETTING_STEP,
    processDesignStep: PROCESS_DESIGN_STEP,
    restrictionStep: RESTRICTION_STEP,
  });
  useDashboardContextMenuDismiss({
    setBuilderSelectionContextMenu,
    setPreviewContextMenu,
  });
  const resetModuleDesignerState = useDashboardModuleDesignerReset({
    builders: {
      buildBillHeaderWorkbenchConfig,
      buildDefaultBillDetailConfig,
      buildDefaultLeftTableConfig,
      buildDefaultMainTableConfig,
    },
    initialState: {
      initialDetailPreview,
      initialWorkspaceTheme,
    },
    resetFns: {
      clearResizePreview,
      resetBillSourceState,
      resetGridMenuSelectionState,
      resetRestrictionState,
    },
    refs: {
      moduleSettingFullscreenInitRef,
    },
    setters: {
      setActiveResize,
      setActiveTab,
      setBillDetailColumns,
      setBillDetailConfig,
      setBillDocumentTone,
      setBillHeaderWorkbenchConfig,
      setBillHeaderWorkbenchDrag,
      setBillHeaderWorkbenchDropTarget,
      setBillMetaFields,
      setBuilderSelectionContextMenu,
      setDetailBoardClipboardIds,
      setDetailBoardOpenedRowId,
      setDetailBoardSortColumnId,
      setDetailFilterFields,
      setDetailTabConfigs,
      setDetailTableColumns,
      setDetailTableConfigs,
      setDetailTabs,
      setDocumentConditionScope,
      setInspectorPanelTab,
      setInspectorTarget,
      setIsArchiveLayoutEditorOpen,
      setIsDetailBoardOpen,
      setIsMainHiddenColumnsModalOpen,
      setLeftFilterFields,
      setLeftTableColumns,
      setLeftTableConfig,
      setLongTextEditorState,
      setMainFilterFields,
      setMainHiddenColumnsSearchText,
      setMainTableColumns,
      setMainTableConfig,
      setPreviewContextMenu,
      setSelectedArchiveNodeId,
      setSelectedDetailBoardGroupId,
      setSelectedDetailColorRuleId,
      setSelectedDetailContextMenuId,
      setSelectedDetailFiltersForDelete,
      setSelectedDetailForDelete,
      setSelectedLeftFiltersForDelete,
      setSelectedLeftForDelete,
      setSelectedMainFiltersForDelete,
      setSelectedMainForDelete,
      setSelectedMainHiddenColumnIds,
      setWorkspaceTheme,
      setActiveDetailBoardHeightResize,
      setActiveDetailBoardResize,
    },
  });
  const {
    isCompactModuleSetting,
    isConfigFullscreenActive,
    isModuleSettingStep,
    moduleSettingStageHeightClass,
    selectedConditionPanelScope,
    selectedDetailColId,
    selectedDetailGridAction,
    selectedDetailTabId,
    selectedLeftColId,
    selectedLeftFilterId,
    selectedMainColId,
    selectedMainFilterId,
    selectedMainGridAction,
    selectedTableConfigScope,
  } = useDashboardInspectorSelectionMeta({
    configStep,
    inspectorTarget,
    isConfigOpen,
    isFullscreenConfig,
    modulePreviewStep: MODULE_PREVIEW_STEP,
    moduleSettingStep: MODULE_SETTING_STEP,
    processDesignStep: PROCESS_DESIGN_STEP,
    restrictionStep: RESTRICTION_STEP,
  });
  const {
    moduleSettingStageStyle,
    workspaceThemeStyles,
    workspaceThemeVars,
  } = useDashboardTheme({
    isConfigFullscreenActive,
    workspaceTheme,
  });
  const {
    documentLeftPaneWidth,
    inspectorPaneWidth,
    startDocumentLeftResize,
  } = useDocumentWorkspaceLayout({
    isConfigFullscreenActive,
  });
  const {
    autoArrangeBillHeaderFields,
    commitBillHeaderFields,
    getBillHeaderDragItemId,
    getBillHeaderDropItemId,
    getBillHeaderRowCount,
    getBillHeaderRowDropId,
    getOrderedBillHeaderFields,
    moveBillHeaderField,
    updateBillHeaderWorkbenchRows,
  } = useBillHeaderWorkbench({
    billHeaderCanvasRef,
    billHeaderWorkbenchRows: billHeaderWorkbenchConfig.rows,
    billMetaFields,
    mainTableColumns,
    setBillHeaderWorkbenchConfig,
    setBillMetaFields,
    setMainTableColumns,
    clampValue,
    normalizeColumn,
    constants: {
      defaultWidth: BILL_FORM_DEFAULT_WIDTH,
      gapX: BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
      gapY: BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
      layoutPaddingX: BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
      layoutPaddingY: BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
      maxRows: BILL_HEADER_WORKBENCH_MAX_ROWS,
      maxWidth: BILL_FORM_MAX_WIDTH,
      minRows: BILL_HEADER_WORKBENCH_MIN_ROWS,
      minWidth: BILL_FORM_MIN_WIDTH,
      rowHeight: BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
    },
  });
  const {
    activeBillResizeId,
    billFieldLivePreview,
    startBillFieldResize,
  } = useBillFieldResize({
    billHeaderCanvasRef,
    billHeaderWorkbenchRows: billHeaderWorkbenchConfig.rows,
    billMetaFields,
    mainTableColumns,
    setBillMetaFields,
    setMainTableColumns,
    clampValue,
    normalizeColumn,
    buildResizeSnapCandidates,
    resolveResizeWidthWithSnap,
    constants: {
      defaultWidth: BILL_FORM_DEFAULT_WIDTH,
      layoutPaddingX: BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
      maxRows: BILL_HEADER_WORKBENCH_MAX_ROWS,
      maxWidth: BILL_FORM_MAX_WIDTH,
      minRows: BILL_HEADER_WORKBENCH_MIN_ROWS,
      minWidth: BILL_FORM_MIN_WIDTH,
    },
  });
  const { billDocumentScale } = useBillDocumentLayout({
    autoArrangeBillHeaderFields,
    billDocumentPaperRef,
    billDocumentViewportRef,
    billDetailColumnCount: billDetailColumns.length,
    billMetaFields,
    businessType,
    isModuleSettingFullscreen: isConfigOpen && configStep === MODULE_SETTING_STEP && isFullscreenConfig,
    mainTableColumns,
    getBillFieldLayout,
    normalizeColumn,
    constants: {
      defaultWidth: BILL_FORM_DEFAULT_WIDTH,
      minWidth: BILL_FORM_MIN_WIDTH,
    },
  });
  const {
    activateSourceGridSelection,
    clearColumnSelection,
  } = useDashboardInspectorWorkspaceSync({
    activeTab,
    clearBuilderSelectionContextMenu: setBuilderSelectionContextMenu,
    inspectorTarget,
    setInspectorPanelTab,
    setInspectorTarget,
    setSelectedDetailFiltersForDelete,
    setSelectedDetailForDelete,
    setSelectedLeftFiltersForDelete,
    setSelectedLeftForDelete,
    setSelectedMainFiltersForDelete,
    setSelectedMainForDelete,
  });
  const {
    activateDetailWorkbenchTab,
  } = useDashboardDetailWorkspaceSync({
    activeTab,
    businessType,
    currentDetailFillType,
    detailTabs,
    inspectorTarget,
    isTreePaneVisible,
    setActiveTab,
    setBuilderSelectionContextMenu,
    setDocumentConditionScope,
    setInspectorPanelTab,
    setInspectorTarget,
    setPreviewContextMenu,
    setSelectedArchiveNodeId,
    setSelectedDetailFiltersForDelete,
    setSelectedDetailForDelete,
  });
  const {
    activateColumnSelection,
    activateConditionPanelSelection,
    activateConditionSelection,
    activateGridActionSelection,
    activateTableConfigSelection,
  } = useDashboardSelectionActions({
    activeTab,
    currentDetailFillTypeValue,
    detailFillTypeOptions: DETAIL_FILL_TYPE_OPTIONS,
    setBuilderSelectionContextMenu,
    setInspectorPanelTab,
    setInspectorTarget,
    setSelectedArchiveNodeId,
  });
  const {
    closeMainHiddenColumnsModal,
    openArchiveLayoutEditor,
    openDetailBoardPreview,
    openDocumentConditionWorkbench,
    openMainHiddenColumnsModal,
    restoreMainHiddenColumns,
    toggleMainHiddenColumnSelection,
    updateMainDetailBoard,
  } = useDashboardWorkbenchActions({
    hiddenColumnRestoreWidth: BILL_FORM_DEFAULT_WIDTH,
    mainTableColumns,
    mainTableHiddenColumns,
    normalizeColumn,
    selectedMainColId,
    selectedMainHiddenColumnIds,
    setDetailBoardOpenedRowId,
    setDetailBoardSortColumnId,
    setDocumentConditionScope,
    setIsArchiveLayoutEditorOpen,
    setIsDetailBoardOpen,
    setIsDocumentConditionWorkbenchOpen,
    setIsMainHiddenColumnsModalOpen,
    setMainHiddenColumnsSearchText,
    setMainTableColumns,
    setMainTableConfig,
    setSelectedMainHiddenColumnIds,
  });
  const {
    addTab,
    deleteSelectedColumns,
    deleteSelectedConditions,
    removeDetailTab,
  } = useDashboardWorkbenchEditActions({
    activeTab,
    buildDetailTabConfig,
    buildGridConfig,
    businessType,
    detailTabs,
    selectedDetailTabId,
    setBillDetailColumns,
    setBillMetaFields,
    setBuilderSelectionContextMenu,
    setDetailFilterFields,
    setDetailTabConfigs,
    setDetailTableColumns,
    setDetailTableConfigs,
    setDetailTabs,
    setInspectorPanelTab,
    setInspectorTarget,
    setLeftFilterFields,
    setLeftTableColumns,
    setMainFilterFields,
    setMainTableColumns,
    setSelectedArchiveNodeId,
    setSelectedDetailFiltersForDelete,
    setSelectedDetailForDelete,
    setSelectedLeftFiltersForDelete,
    setSelectedLeftForDelete,
    setSelectedMainFiltersForDelete,
    setSelectedMainForDelete,
    setActiveTab,
  });
  const {
    autoFitColumnWidth,
    conditionWorkbenchResizeApi,
    deleteTab,
    handlePasteColumns,
    startResize,
  } = useDashboardWorkbenchColumnActions({
    activeResize,
    buildColumn,
    clearResizePreview,
    defaultAutoFitMaxWidth: TABLE_COLUMN_AUTO_FIT_MAX_WIDTH,
    defaultMinWidth: TABLE_COLUMN_MIN_WIDTH,
    defaultResizeMaxWidth: TABLE_COLUMN_RESIZE_MAX_WIDTH,
    normalizeColumn,
    removeDetailTab,
    scheduleResizePreview,
    setActiveResize,
  });
  useDashboardDetailBoardClipboard({
    mainTableColumns,
    selectedMainForDelete,
    setDetailBoardClipboardIds,
    showToast,
  });

  const {
    handleBusinessTypeChange,
    openModuleGuide,
    openNewModuleGuide,
    toggleMenuPinnedField,
    updateCurrentMenuDraft,
  } = useDashboardMenuGuideActions({
    activeFirstLevelMenu,
    businessType,
    isConfigOpen,
    resetModuleDesignerState,
    selectedSubsystem,
    setActiveConfigMenu,
    setActiveWorkbench,
    setBusinessType,
    setCompletedSteps,
    setConfigStep,
    setIsConfigOpen,
    setIsFullscreenConfig,
    setIsGenerating,
    setIsMenuInfoLoading,
    setIsMenuInfoSaving,
    setMenuConfigDraft,
    setMenuInfoError,
    setMenuInfoTab,
    setMenuPinnedFields,
    setSurveyAnswers,
    setSurveyError,
    setSurveyPlan,
    setSurveyPlanModel,
    setSurveyStep,
    syncWorkspaceUrlState,
  });

  const {
    handleMenuInfoSave,
    handleSecondLevelMenuConfig,
    loadMenuInfoForMenu,
  } = useDashboardMenuConfigIo({
    activeConfigMenu,
    activeFirstLevelMenu,
    businessType,
    configStep,
    markStepCompleted,
    menuConfigDraft,
    openModuleGuide,
    selectedSubsystem,
    setActiveConfigMenu,
    setActiveWorkbench,
    setIsMenuInfoLoading,
    setIsMenuInfoSaving,
    setMenuConfigDraft,
    setMenuInfoError,
    setSecondLevelMenus,
    showToast,
    syncWorkspaceUrlState,
  });

  useDashboardMenuConfigBootstrap({
    activeConfigMenu,
    initialBusinessType,
    initialConfigOpen,
    initialConfigStep,
    initialRouteModuleCode,
    loadMenuInfoForMenu,
    openModuleGuide,
    secondLevelMenus,
    setActiveConfigMenu,
    setIsMenuInfoSaving,
    setMenuConfigDraft,
    setMenuInfoError,
  });

  const configWizardStepNodes = buildDashboardConfigWizardStepNodes(
    buildDashboardConfigWizardStepBuilderConfig({
      menuInfo: {
        activeConfigMenuId: activeConfigMenu?.id ?? null,
        activeConfigModuleKey,
        advancedFilledMenuFieldCount,
        businessType,
        commonFilledMenuFieldCount,
        commonFuncs,
        currentModuleCode,
        currentAdvancedMenuKeys,
        currentAdvancedMenuSections,
        currentMenuDraft,
        currentMenuFieldEntriesCount: currentMenuFieldEntries.length,
        currentMenuFieldMap,
        currentModuleGuideLabel: currentModuleGuide.label,
        currentModuleName,
        currentPinnedMenuKeys,
        currentPinnedMenuKeySet,
        currentCommonMenuSections,
        filledMenuFieldCount,
        funcOptions: COMMON_FUNCTION_OPTIONS,
        isFuncPopoverOpen,
        isMenuInfoLoading,
        isMenuInfoSaving,
        menuConfigTableDesc: MENU_CONFIG_TABLE_DESC,
        menuConfigTableName: MENU_CONFIG_TABLE_NAME,
        menuInfoError,
        menuInfoTab,
        onBackToTypeSelect: () => setConfigStep(1),
        onCloseFuncPopover: () => setIsFuncPopoverOpen(false),
        onMenuInfoTabChange: setMenuInfoTab,
        onToggleFieldPinned: toggleMenuPinnedField,
        onToggleFunc: toggleCommonFunc,
        onToggleFuncPopover: () => setIsFuncPopoverOpen((prev) => !prev),
        onUpdateMenuDraft: updateCurrentMenuDraft,
      },
      moduleIntro: {
        isFullscreenEditor,
        moduleIntroActions,
        moduleIntroBlockType,
        moduleIntroRefs,
        moduleIntroSelectedImageWidth,
      },
      processDesign: {
        createRestrictionProcessDesignEntry,
        currentModuleName,
        currentUserName,
        selectedRestrictionProcessDesign,
        showToast,
        updateSelectedRestrictionProcessDesign,
      },
      survey: {
        generateSurveyPlan,
        isGenerating,
        resetSurveyFlow,
        setSurveyAnswers,
        setSurveyStep,
        surveyAnswers,
        surveyError,
        surveyPlan,
        surveyPlanModel,
        surveyStep,
      },
      typeSelection: {
        businessType,
        menuConfigTableName: MENU_CONFIG_TABLE_NAME,
        moduleGuideProfiles: MODULE_GUIDE_PROFILES,
        moduleTypeOptions: MODULE_TYPE_OPTIONS,
        onBusinessTypeChange: handleBusinessTypeChange,
      },
    }),
  );

  const renderFieldPreview = useWorkbenchFieldPreviewRenderer(normalizeColumn);

  const getLayoutFieldWorkbenchMeta = useLayoutFieldWorkbenchMeta(normalizeColumn);
  const {
    getDetailBoardFieldLiveHeight,
    getDetailBoardFieldLiveWidth,
    resetDetailBoardFieldHeight,
    resetDetailBoardFieldWidth,
    startDetailBoardFieldHeightResize,
    startDetailBoardFieldResize,
  } = useDashboardDetailBoardActions({
    activeDetailBoardHeightResize,
    activeDetailBoardResize,
    defaultFieldHeight: DETAIL_BOARD_TALL_FIELD_DEFAULT_HEIGHT,
    defaultFieldWidth: DETAIL_BOARD_FIELD_DEFAULT_WIDTH,
    getLayoutFieldWorkbenchMeta,
    mainTableColumns,
    maxFieldHeight: DETAIL_BOARD_TALL_FIELD_MAX_HEIGHT,
    maxFieldWidth: DETAIL_BOARD_FIELD_MAX_WIDTH,
    minFieldHeight: DETAIL_BOARD_TALL_FIELD_MIN_HEIGHT,
    minFieldWidth: DETAIL_BOARD_FIELD_MIN_WIDTH,
    normalizedMainDetailBoardConfig,
    setActiveDetailBoardHeightResize,
    setActiveDetailBoardResize,
    updateMainDetailBoard,
  });

  const {
    archiveMainTableBuilderNode,
    documentTreeTableBuilderNode,
    builderLeftTableBuilderNode,
    builderMainTableBuilderNode,
    documentDetailTableBuilderNode,
    builderDetailTableBuilderNode,
    billDetailTableBuilderNode,
  } = useDashboardTableBuilderRuntime(
    buildDashboardTableBuilderRuntimeBuilderConfig({
      actions: {
        activateColumnSelection,
        activateTableConfigSelection,
        autoFitColumnWidth,
        openDetailBoardPreview,
        setBuilderSelectionContextMenu,
        setDetailTableColumns,
        setSelectedArchiveNodeId,
        setSelectedDetailForDelete,
        setSelectedLeftForDelete,
        setSelectedMainForDelete,
        startResize,
      },
      columns: {
        billDetailColumns,
        detailTableColumns,
        detailTableConfigs,
        leftTableColumns,
        mainRenderableColumns,
        mainTableColumns,
        mainTableConfig,
      },
      helpers: {
        buildColumn,
        getDetailBoardTheme,
        isRenderableMainColumn,
        isTreeRelationFieldColumn,
        normalizeColumn,
        normalizeDetailBoardConfig,
      },
      metrics: {
        collapsedRenderWidth: TABLE_COLUMN_COLLAPSED_RENDER_WIDTH,
        minWidth: TABLE_COLUMN_MIN_WIDTH,
        resizeMaxWidth: TABLE_COLUMN_RESIZE_MAX_WIDTH,
        resizeMinWidth: TABLE_COLUMN_RESIZE_MIN_WIDTH,
      },
      selection: {
        inspectorTargetId: inspectorTarget.id,
        selectedDetailColId,
        selectedDetailForDelete,
        selectedLeftColId,
        selectedLeftForDelete,
        selectedMainColId,
        selectedMainForDelete,
        selectedTableConfigScope,
      },
      setters: {
        setBillDetailColumns,
        setLeftTableColumns,
        setMainTableColumns,
      },
      state: {
        activeResize,
        activeTab,
        businessType,
        detailTabsLength: detailTabs.length,
        isCompactModuleSetting,
        mainDetailBoardEnabled,
        mainDetailBoardGroupsLength: mainDetailBoardGroups.length,
        normalizedMainDetailBoardConfig,
        showDetailGridActionBar,
        workspaceTheme,
        workspaceThemeVars,
      },
    }),
  );

  const configSteps = DASHBOARD_CONFIG_STEPS;
  const {
    activeFirstLevelMenuName,
    activeMenu,
    activeMenuCode,
    activeMenuCodePrefix,
    activeMenuName,
    activeSubsystemName,
    isFunctionFlowDesignActive,
    isResearchRecordActive,
    isToolFeedbackActive,
    researchCaptureModules,
    researchRecordStorageKey,
    secondLevelMenuCount,
  } = useDashboardWorkspaceMeta({
    activeFirstLevelMenu,
    activeFirstLevelMenuId,
    activeSubsystem,
    activeWorkbench,
    secondLevelMenus,
    selectedSubsystem,
  });
  const {
    closeFunctionFlowDesignWorkbench,
    closeResearchRecordWorkbench,
    openFunctionFlowDesignWorkbench,
    openResearchRecordWorkbench,
    openToolFeedbackWorkbench,
  } = useDashboardWorkbenchNav({
    setActiveWorkbench,
    syncWorkspaceUrlState,
  });
  const openServerPermissionWorkbench = useCallback(() => {
    if (!isCurrentUserAdmin) {
      return;
    }

    setIsServerPermissionWorkbenchActive(true);
    setActiveWorkbench('modules');
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({ workbench: null }, { replace: true });
      return;
    }

    updateCurrentDesignSearch({ workbench: null }, { replace: true });
  }, [isCurrentUserAdmin, setActiveWorkbench, syncWorkspaceUrlState]);
  const handleFirstLevelMenuClickWithWorkbenchReset = useCallback((subsystemId: string, menu: Parameters<typeof handleFirstLevelMenuClick>[1]) => {
    setIsServerPermissionWorkbenchActive(false);
    handleFirstLevelMenuClick(subsystemId, menu);
  }, [handleFirstLevelMenuClick]);
  const openResearchRecordWorkbenchWithReset = useCallback(() => {
    setIsServerPermissionWorkbenchActive(false);
    openResearchRecordWorkbench();
  }, [openResearchRecordWorkbench]);
  const openFunctionFlowDesignWorkbenchWithReset = useCallback(() => {
    setIsServerPermissionWorkbenchActive(false);
    openFunctionFlowDesignWorkbench();
  }, [openFunctionFlowDesignWorkbench]);
  const openToolFeedbackWorkbenchWithReset = useCallback(() => {
    setIsServerPermissionWorkbenchActive(false);
    openToolFeedbackWorkbench();
  }, [openToolFeedbackWorkbench]);
  const billDocumentWorkbenchNode = (
    <BillDocumentWorkbench
      state={{
        activeBillResizeId,
        activeMenuName,
        billDocumentScale,
        billDocumentTone,
        billFieldLivePreview,
        billHeaderWorkbenchDrag,
        billHeaderWorkbenchDropTarget,
        billMetaFields,
        isConfigFullscreenActive,
        mainTableColumns,
        selectedMainColId,
        selectedMainForDelete,
        selectedTableConfigScope,
        workspaceThemeTableSurfaceClass: workspaceThemeStyles.tableSurface,
        workspaceThemeVars,
      }}
      refs={{
        billDocumentPaperRef,
        billDocumentViewportRef,
        billHeaderCanvasRef,
      }}
      nodes={{
        billDetailTableBuilderNode,
      }}
      actions={{
        activateColumnSelection,
        activateSourceGridSelection,
        activateTableConfigSelection,
        autoArrangeBillHeaderFields,
        buildColumn,
        commitBillHeaderFields,
        deleteSelectedColumns,
        moveBillHeaderField,
        setBillDocumentTone,
        setBillHeaderWorkbenchDrag,
        setBillHeaderWorkbenchDropTarget,
        setBuilderSelectionContextMenu,
        setSelectedMainForDelete,
        showToast,
        startBillFieldResize,
      }}
      helpers={{
        clampValue,
        createRuntimeClassName,
        createRuntimeDeclarationBlock,
        getBillHeaderDragItemId,
        getBillHeaderDropItemId,
        getBillHeaderRowCount,
        getBillHeaderRowDropId,
        getCompactWorkbenchItemClass,
        getOrderedBillHeaderFields,
        joinRuntimeDeclarationBlocks,
        normalizeColumn,
        renderFieldPreview,
      }}
      dnd={{
        DesignerWorkbenchDraggableItem,
        DesignerWorkbenchDropLane,
        rowActiveClass: designerWorkbenchRowActiveClass,
        rowEmptyClass: designerWorkbenchRowEmptyClass,
        sensors: designerWorkbenchSensors,
      }}
      constants={{
        billFormDefaultFontSize: BILL_FORM_DEFAULT_FONT_SIZE,
        billFormDefaultWidth: BILL_FORM_DEFAULT_WIDTH,
        billFormMaxWidth: BILL_FORM_MAX_WIDTH,
        billFormMinWidth: BILL_FORM_MIN_WIDTH,
        billHeaderWorkbenchMinRows: BILL_HEADER_WORKBENCH_MIN_ROWS,
        conditionPanelRowGap: CONDITION_PANEL_ROW_GAP,
        conditionPanelRowHeight: CONDITION_PANEL_ROW_HEIGHT,
      }}
    />
  );
  const {
    applyDetailModuleInheritanceById,
    detailSourceModuleCandidates,
    getDetailTabConfigById,
    handleDetailModuleCodeChange,
    isSingleTableModuleSettingsSaving,
    loadSingleTableDetailResourcesById,
    saveSingleTableModuleSettingsPage,
    syncDetailColumnsFromSqlById,
    updateDetailTabConfigById,
  } = useDashboardSingleTableModuleRuntime({
    builders: {
      buildColumn,
      buildDetailTabConfig,
      buildGridConfig,
      buildTreeRelationFallbackColumns,
      normalizeColumn,
      normalizeDetailChartConfig,
      normalizeDetailFillTypeValue,
      parseSqlFieldNames,
    },
    config: {
      activeConfigMenu,
      activeConfigModuleKey,
      activeDetailBackendId,
      activeDetailColorRules,
      activeDetailContextMenuItems,
      activeDetailRelatedModuleCode,
      activeTab,
      businessType,
      canLoadSingleTableModuleResources,
      configStep,
      currentDetailFillType,
      currentModuleCode,
      currentModuleName,
      currentPrimaryTableName,
      documentConditionOwnerFieldKey,
      documentConditionOwnerSourceId,
      isConfigOpen,
      moduleSettingStep: MODULE_SETTING_STEP,
      parsedTreeSourceFields,
      restrictionTopStructures,
      treeRelationColumn,
    },
    helpers: {
      getDashboardErrorMessage,
      getRecordFieldValue,
      isAbsoluteHttpUrl,
      joinHttpUrl,
      showToast,
      toRecordNumber,
      toRecordText,
    },
    mappings: {
      mapSingleTableColorRule,
      mapSingleTableConditionRecordToField,
      mapSingleTableContextMenuItem,
      mapSingleTableDetailChartConfig,
      mapSingleTableDetailGridFieldToColumn,
      mapSingleTableDetailRecord,
      mapSingleTableFieldRecordToColumn,
      mapSingleTableGridFieldRecordToColumn,
    },
    selection: {
      selectedDetailColorRuleId,
      selectedDetailContextMenuId,
    },
    state: {
      detailTabConfigs,
      detailTabs,
      detailTableColumns,
      detailTableConfigs,
      leftFilterFields,
      leftTableColumns,
      leftTableConfig,
      mainFilterFields,
      mainTableColumns,
      mainTableConfig,
    },
    setters: {
      setActiveTab,
      setBillDetailColumns,
      setBillDetailConfig,
      setDetailBoardSortColumnId,
      setDetailFilterFields,
      setDetailTabConfigs,
      setDetailTableColumns,
      setDetailTableConfigs,
      setDetailTabs,
      setInspectorTarget,
      setIsSingleTableFieldsLoading,
      setLeftFilterFields,
      setLeftTableColumns,
      setLeftTableConfig,
      setMainFilterFields,
      setMainTableColumns,
      setMainTableConfig,
      setSelectedDetailColorRuleId,
      setSelectedDetailContextMenuId,
      setSelectedDetailFiltersForDelete,
      setSelectedDetailForDelete,
      setSelectedLeftFiltersForDelete,
      setSelectedLeftForDelete,
      setSelectedMainFiltersForDelete,
      setSelectedMainForDelete,
    },
  });
  const {
    isSaving: isBillTypeSettingsSaving,
    saveCurrentPage: saveBillTypeSettingsPage,
  } = useBillTypeSettingsSave({
    billDetailColumns,
    billDetailConfig,
    currentModuleCode: activeConfigModuleKey,
    currentModuleName,
    isActive: (
      isConfigOpen
      && configStep === MODULE_SETTING_STEP
      && businessType === 'table'
      && Boolean(activeConfigModuleKey)
      && isMenuInfoBuilt
    ),
    mapSingleTableDetailGridFieldToColumn,
    mainTableColumns,
    mainTableConfig,
    onShowToast: showToast,
    setBillDetailColumns,
    setBillDetailConfig,
    setMainTableColumns,
    setMainTableConfig,
  });
  const isModuleSettingsPageSaving = businessType === 'table'
    ? isBillTypeSettingsSaving
    : isSingleTableModuleSettingsSaving;
  const saveCurrentModuleSettingsPage = useCallback((options?: Parameters<typeof saveSingleTableModuleSettingsPage>[0]) => (
    businessType === 'table'
      ? saveBillTypeSettingsPage(options)
      : saveSingleTableModuleSettingsPage(options)
  ), [businessType, saveBillTypeSettingsPage, saveSingleTableModuleSettingsPage]);

  const handleConfigPageSave = async () => {
    if (configStep === MODULE_SETTING_STEP && (isSingleTableModuleBranch || businessType === 'table')) {
      const saved = await saveCurrentModuleSettingsPage();
      if (saved) {
        markStepCompleted(configStep);
      }
      return;
    }

    if (configStep === RESTRICTION_STEP || configStep === PROCESS_DESIGN_STEP) {
      const saved = await handleSaveRestrictionTab('process');
      if (saved) {
        markStepCompleted(configStep);
      }
      return;
    }

    await handleMenuInfoSave();
  };

  const {
    activeDocumentConditionScope,
    getSelectedConditionPanelContext,
    handleConditionPanelFieldSelect,
    handleDocumentConditionScopeSwitch,
    leftDocumentConditionConfig,
    mainDocumentConditionConfig,
  } = useDocumentConditionWorkbench(buildDashboardDocumentConditionWorkbenchBuilderConfig({
    actions: {
      activateConditionPanelSelection,
      activateConditionSelection,
      deleteSelectedConditions,
      showToast,
    },
    builders: {
      buildConditionField,
      clampValue,
    },
    config: {
      maxRows: CONDITION_PANEL_MAX_ROWS,
      minRows: CONDITION_PANEL_MIN_ROWS,
    },
    selection: {
      selectedConditionPanelScope,
      selectedLeftFilterId,
      selectedLeftFiltersForDelete,
      selectedMainFilterId,
      selectedMainFiltersForDelete,
    },
    setters: {
      setDocumentConditionScope,
      setLeftFilterFields,
      setMainFilterFields,
      setSelectedArchiveNodeId,
      setSelectedLeftFiltersForDelete,
      setSelectedMainFiltersForDelete,
    },
    state: {
      documentConditionOwnerFieldKey,
      documentConditionOwnerSourceId,
      documentConditionScope,
      isTreePaneVisible,
      leftFilterFields,
      mainFilterFields,
      treeRelationColumn,
    },
  }));

  const columnOperationPanel = useDashboardInspectorRuntime(buildDashboardInspectorRuntimeBuilderConfig({
    actions: {
      activateColumnSelection,
      activateSourceGridSelection,
      applyDetailModuleInheritanceById,
      clearColumnSelection,
      createBillSourceDraft,
      deleteSelectedColumns,
      deleteSelectedConditions,
      handleConditionPanelFieldSelect,
      handleDetailModuleCodeChange,
      loadSingleTableDetailResourcesById,
      onOpenArchiveLayoutEditor: openArchiveLayoutEditor,
      onOpenConditionWorkbench: openDocumentConditionWorkbench,
      onOpenDetailBoardPreview: openDetailBoardPreview,
      onOpenMainHiddenColumnsModal: openMainHiddenColumnsModal,
      onResetDetailBoardFieldWidth: resetDetailBoardFieldWidth,
      onStartDetailBoardFieldResize: startDetailBoardFieldResize,
      removeDetailTab: removeDetailTab,
      saveBillSourceDraft,
      saveSingleTableModuleSettingsPage: saveCurrentModuleSettingsPage,
      selectBillSourceDraft,
      showToast,
      syncDetailColumnsFromSqlById,
      updateBillHeaderWorkbenchRows,
      updateBillSourceDraft,
      updateDetailTabConfigById,
    },
    components: {
      DesignerWorkbenchDraggableItem,
      DesignerWorkbenchDropLane,
    },
    constants: {
      billFormDefaultFontSize: BILL_FORM_DEFAULT_FONT_SIZE,
      billFormDefaultLabelWidth: BILL_FORM_DEFAULT_LABEL_WIDTH,
      billFormMinWidth: BILL_FORM_MIN_WIDTH,
      billHeaderWorkbenchMaxRows: BILL_HEADER_WORKBENCH_MAX_ROWS,
      billHeaderWorkbenchMinRows: BILL_HEADER_WORKBENCH_MIN_ROWS,
      billSourceConfigTypeOptions: BILL_SOURCE_CONFIG_TYPE_OPTIONS,
      billSourceTypeOptions: BILL_SOURCE_TYPE_OPTIONS,
      columnAlignOptions: COLUMN_ALIGN_OPTIONS,
      conditionPanelControlWidth: CONDITION_PANEL_CONTROL_WIDTH,
      conditionPanelResizeMaxWidth: CONDITION_PANEL_RESIZE_MAX_WIDTH,
      conditionPanelResizeMinWidth: CONDITION_PANEL_RESIZE_MIN_WIDTH,
      defaultFieldSqlTagOptions: DEFAULT_FIELD_SQL_TAG_OPTIONS,
      detailBoardFieldDefaultWidth: DETAIL_BOARD_FIELD_DEFAULT_WIDTH,
      detailBoardThemeOptions: DETAIL_BOARD_THEME_OPTIONS,
      detailChartTypeOptions: DETAIL_CHART_TYPE_OPTIONS,
      detailFillTypeOptions: DETAIL_FILL_TYPE_OPTIONS,
      fieldSqlTagLabelFallbacks: FIELD_SQL_TAG_LABEL_FALLBACKS,
      fieldTypeOptions: FIELD_TYPE_OPTIONS,
      gridColorRuleOperatorOptions: GRID_COLOR_RULE_OPERATOR_OPTIONS,
      mainTableHiddenColumnsCount: mainTableHiddenColumns.length,
      tableColumnResizeMinWidth: TABLE_COLUMN_RESIZE_MIN_WIDTH,
      tableTypeOptions: TABLE_TYPE_OPTIONS,
    },
    helpers: {
      buildDetailTabConfig,
      buildGridColorRule,
      buildGridConfig,
      getBillHeaderRowCount,
      getDetailFillTypeBackendValue,
      getDetailFillTypeByTabId,
      getDetailFillTypeMeta,
      getDetailTabConfigById,
      getFieldSqlTagOptionLabel,
      getOrderedBillHeaderFields,
      getSelectedConditionPanelContext,
      isTreeRelationFieldColumn,
      mapFieldSqlTagToFieldType,
      normalizeColumn,
      normalizeConditionField,
      normalizeDetailChartConfig,
      normalizeDetailFillTypeValue,
      normalizeFieldSqlTagId,
      parseDetailBoardClipboardColumnIds,
      renderFieldPreview,
      resolveColumnFieldSqlTagId,
      toRecordText,
    },
    setters: {
      setBillDetailColumns,
      setBillDetailConfig,
      setBillMetaFields,
      setBillSourceDraft,
      setDetailFilterFields,
      setDetailTabConfigs,
      setDetailTableColumns,
      setDetailTableConfigs,
      setDetailTabs,
      setInspectorPanelTab,
      setInspectorTarget,
      setIsGeneratingSqlDraft,
      setIsTranslatingIdentifiers,
      setLeftFilterFields,
      setLeftTableColumns,
      setLeftTableConfig,
      setLongTextEditorState,
      setMainFilterFields,
      setMainTableColumns,
      setMainTableConfig,
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
    },
    state: {
      activeBillSourceId,
      activeDetailBoardResize,
      activeTab,
      billDetailColumns,
      billDetailConfig,
      billMetaFields,
      billSourceDraft,
      billSourceDraftMode,
      billSourceFieldMap,
      billSources,
      businessType,
      currentMenuDraft,
      currentModuleCode,
      currentModuleName,
      designerWorkbenchSensors,
      detailBoardClipboardIds,
      detailFilterFields,
      detailSourceModuleCandidates,
      detailTabConfigs,
      detailTableColumns,
      detailTableConfigs,
      detailTabs,
      documentConditionOwnerSourceId,
      fieldSqlTagOptions,
      inspectorPanelTab,
      inspectorTarget,
      isGeneratingSqlDraft,
      isTranslatingIdentifiers,
      leftFilterFields,
      leftTableColumns,
      leftTableConfig,
      mainFilterFields,
      mainTableColumns,
      mainTableConfig,
      selectedDetailBoardGroupId,
      selectedDetailColorRuleId,
      selectedDetailContextMenuId,
      selectedLeftColorRuleId,
      selectedLeftContextMenuId,
      selectedMainColorRuleId,
      selectedMainContextMenuId,
      selectedPopupMenuParamKey,
      treeRelationColumn,
      workspaceTheme,
      workspaceThemeVars,
    },
  }));
  const moduleSettingConfig = {
    ...buildDashboardModuleSettingRuntimeBuilderConfig({
    activeDetailGridConfig,
    activateGridActionSelection,
    activeResize,
    activeTab,
    addTab,
    archiveMainTableBuilderNode,
    autoFitColumnWidth,
    billDocumentWorkbenchNode,
    buildColumn,
    buildConditionField,
    buildDocumentFilterRuntimeRules,
    builderDetailTableBuilderNode,
    builderLeftTableBuilderNode,
    builderMainTableBuilderNode,
    businessType,
    columnOperationPanel,
    conditionPanelControlWidth: CONDITION_PANEL_CONTROL_WIDTH,
    conditionPanelResizeMaxWidth: CONDITION_PANEL_RESIZE_MAX_WIDTH,
    conditionPanelResizeMinWidth: CONDITION_PANEL_RESIZE_MIN_WIDTH,
    currentDetailFillType,
    currentDetailFillTypeValue,
    currentModuleName,
    deleteSelectedColumns,
    deleteSelectedConditions,
    deleteTab,
    detailTabs,
    detailWebUrl: activeDetailWebUrl,
    documentDetailTableBuilderNode,
    documentLeftPaneWidth,
    documentTreeTableBuilderNode,
    handlePasteColumns,
    inspectorPaneWidth,
    inspectorTarget,
    isConfigFullscreenActive,
    isSingleTableSyncing: isTreeMainTableSyncing,
    isTreePaneVisible,
    mainDocumentFilterRuntimeRules,
    mainFilterFields,
    mainTableColumns,
    mainTableConfig,
    mainTableHiddenColumnsCount: mainTableHiddenColumns.length,
    moduleSettingStageHeightClass,
    moduleSettingStageStyle,
    onActivateCondition: activateConditionSelection,
    onActivateDetailTab: activateDetailWorkbenchTab,
    onActivateTableConfig: activateTableConfigSelection,
    onOpenMainHiddenColumnsModal: openMainHiddenColumnsModal,
    onStartDocumentLeftResize: startDocumentLeftResize,
    renderFieldPreview,
    selectedDetailForDelete,
    selectedDetailGridAction,
    selectedLeftForDelete,
    selectedMainFilterId,
    selectedMainFiltersForDelete,
    selectedMainForDelete,
    selectedMainGridAction,
    setBuilderSelectionContextMenu,
    setDetailTableColumns,
    setInspectorPanelTab,
    setIsFullscreenConfig,
    setLeftTableColumns,
    setMainFilterFields,
    setMainTableColumns,
    setSelectedArchiveNodeId,
    setSelectedMainFiltersForDelete,
    showDetailGridActionBar,
    startResize,
    treeRelationColumn,
    workspaceTheme,
    workspaceThemeStyles,
    workspaceThemeVars,
    }),
    moduleSettingsSectionRef,
  };

  const dashboardScreenRuntimeConfig = buildDashboardScreenRuntimeBuilderConfig({
    modals: {
      closeDeleteConfirm,
      closeMainHiddenColumnsModal,
      confirmDeleteMenu,
      deletingMenuId,
      detailBoardConfig: normalizedMainDetailBoardConfig,
      detailBoardSortColumnId,
      getDetailBoardFieldLiveHeight,
      getDetailBoardFieldLiveWidth,
      getLayoutFieldWorkbenchMeta,
      getMenuModuleTypeProfile,
      hiddenColumns: mainTableHiddenColumns,
      isDetailBoardOpen,
      isMainHiddenColumnsModalOpen,
      mainHiddenColumnsSearchText,
      mainTableColumns,
      normalizeColumn,
      normalizeMenuCode,
      normalizeMenuTitle,
      pendingDeleteMenu,
      renderFieldPreview,
      resetDetailBoardFieldHeight,
      resetDetailBoardFieldWidth,
      restoreMainHiddenColumns,
      selectedMainHiddenColumnIds,
      setIsDetailBoardOpen,
      setMainHiddenColumnsSearchText,
      setSelectedMainHiddenColumnIds,
      startDetailBoardFieldHeightResize,
      startDetailBoardFieldResize,
      toggleMainHiddenColumnSelection,
      workspaceTheme,
      workspaceThemeVars,
    },
    restriction: {
      buildRestrictionMeasure,
      buildRestrictionNumberRule,
      buildRestrictionProcessDesign,
      buildRestrictionTopStructure,
      currentModuleName,
      handleSaveRestrictionTab,
      restrictionActiveTab,
      restrictionMeasures,
      restrictionNumberRules,
      restrictionProcessDesigns,
      restrictionSelection,
      restrictionTopStructures,
      setLongTextEditorState,
      setRestrictionActiveTab,
      setRestrictionMeasures,
      setRestrictionNumberRules,
      setRestrictionProcessDesigns,
      setRestrictionSelection,
      setRestrictionTopStructures,
      showToast,
      workspaceThemeTableSurfaceClass: workspaceThemeStyles.tableSurface,
      workspaceThemeVars,
    },
    screen: {
      configModal: {
        configStep,
        isConfigOpen,
        isFullscreenConfigActive: isConfigFullscreenActive,
        isModuleSettingStep,
        modulePreviewStep: MODULE_PREVIEW_STEP,
        onClose: closeConfigWizard,
        toastMessage,
      },
      functionFlowDesignWorkbenchProps: {
        currentUserName,
        initialSubsystemId: activeSubsystem || null,
        isLoadingSubsystemMenus,
        menuLoadError,
        onExit: closeFunctionFlowDesignWorkbench,
        onReloadSubsystemMenus: reloadSubsystemMenus,
        onShowToast: showToast,
        subsystemMenus,
      },
      isFunctionFlowDesignActive,
      isResearchRecordActive,
      isServerPermissionActive: isServerPermissionWorkbenchActive,
      isToolFeedbackActive,
      moduleScreenInput: {
        activeFirstLevelMenuId,
        activeFirstLevelMenuName,
        activeMenu,
        activeMenuCode,
        activeMenuCodePrefix,
        activeMenuName,
        activeSubsystem,
        activeSubsystemName,
        companyTitle: activeCompanyTitle ?? authSession?.companyTitle ?? '',
        currentUserName,
        deletingMenuId,
        expandedSubsystemId,
        handleFirstLevelMenuClick: handleFirstLevelMenuClickWithWorkbenchReset,
        handleSecondLevelMenuConfig,
        isAdmin: isCurrentUserAdmin,
        isFunctionFlowDesignActive,
        isLoadingSecondLevelMenus,
        isLoadingSubsystemMenus,
        isResearchRecordActive,
        isServerPermissionActive: isServerPermissionWorkbenchActive,
        isSubsystemOpen: isSubsystemSidebarOpen,
        isToolFeedbackActive,
        menuLoadError,
        onCreateModule: openNewModuleGuide,
        onDeleteMenu: setPendingDeleteMenu,
        onLogout,
        onSwitchCompany,
        onOpenFunctionFlowDesign: openFunctionFlowDesignWorkbenchWithReset,
        onOpenServerPermission: openServerPermissionWorkbench,
        onOpenResearchRecord: openResearchRecordWorkbenchWithReset,
        onOpenToolFeedback: openToolFeedbackWorkbenchWithReset,
        reloadSubsystemMenus,
        researchRecordStorageKey,
        secondLevelMenuCount,
        secondLevelMenus,
        subsystemMenus,
        toggleSubsystemExpansion,
        toggleSubsystemOpen: toggleSubsystemSidebarOpen,
      },
      researchRecordWorkbenchProps: {
        activeFirstLevelMenuName,
        activeSubsystemName,
        availableModules: researchCaptureModules,
        currentUserName,
        onExit: closeResearchRecordWorkbench,
        onShowToast: showToast,
        storageKey: researchRecordStorageKey,
      },
      serverPermissionWorkbenchProps: {
        currentUserName,
      },
      toolFeedbackWorkbenchProps: {
        activeFirstLevelMenuName,
        activeSubsystemName,
        currentUserName,
      },
    },
    wizard: {
      activeConfigMenuId: activeConfigMenu?.id ?? null,
      hasActiveConfigMenu: activeConfigMenu !== null,
      canGoBack: !(configStep === 1 || (activeConfigMenu !== null && configStep === 2)),
      completedSteps,
      configStep,
      configSteps,
      handleConfigNext,
      handleConfigPageSave,
      handleConfigPrevious,
      handleConfigStepSelect,
      handleLockedTypeStepSelect,
      isConfigFullscreenActive,
      isMenuInfoBuilt,
      isMenuInfoLoading,
      isMenuInfoSaving,
      isModuleSettingStep,
      isRestrictionTabSaving,
      isSingleTableModuleEnsuring,
      isSingleTableModuleSettingsSaving: isModuleSettingsPageSaving,
      menuInfoNode: configWizardStepNodes.menuInfoNode,
      moduleIntroEditorNode: configWizardStepNodes.moduleIntroEditorNode,
      modulePreviewNode: configWizardStepNodes.modulePreviewNode,
      modulePreviewStep: MODULE_PREVIEW_STEP,
      moduleSettingStep: MODULE_SETTING_STEP,
      moduleTypeSelectionNode: configWizardStepNodes.moduleTypeSelectionNode,
      nextLabel: configStep === MODULE_PREVIEW_STEP ? '完成配置' : '下一步',
      onClose: closeConfigWizard,
      onToggleFullscreen: () => setIsFullscreenConfig((prev) => !prev),
      processDesignNode: configWizardStepNodes.processDesignNode,
      processDesignStep: PROCESS_DESIGN_STEP,
      restrictionStep: RESTRICTION_STEP,
      saveLabel: configStep === 2 && isMenuInfoSaving
        ? (activeConfigMenu ? '保存中...' : '创建中...')
        : configStep === MODULE_SETTING_STEP && isModuleSettingsPageSaving
          ? '保存中...'
          : (configStep === RESTRICTION_STEP || configStep === PROCESS_DESIGN_STEP) && isRestrictionTabSaving
            ? '保存中...'
            : '保存本页',
      surveyPlanningNode: configWizardStepNodes.surveyPlanningNode,
    },
    workspace: {
      businessType,
      activeScope: activeDocumentConditionScope,
      activateConditionPanelSelection,
      builderSelectionContextMenu: builderSelectionContextMenu as any,
      canSwitchScope: Boolean(leftDocumentConditionConfig),
      conditionWorkbenchHelpers,
      conditionWorkbenchMetrics,
      conditionWorkbenchResizeApi: conditionWorkbenchResizeApi,
      currentModuleCode,
      deleteSelectedColumns,
      deleteSelectedConditions,
      handleDocumentConditionScopeSwitch,
      isArchiveLayoutEditorOpen,
      isDocumentConditionWorkbenchOpen,
      leftConditionConfig: leftDocumentConditionConfig,
      longTextEditorState,
      mainConditionConfig: mainDocumentConditionConfig,
      mainTableColumns,
      normalizedMainDetailBoardConfig,
      normalizeColumn,
      previewContextMenu: previewContextMenu as any,
      renderFieldPreview,
      setBuilderSelectionContextMenu,
      setIsArchiveLayoutEditorOpen,
      setIsDocumentConditionWorkbenchOpen,
      setLongTextEditorState,
      setPreviewContextMenu,
      showToast,
      updateMainDetailBoard,
    },
  });
  const dashboardScreen = useDashboardScreenRuntime({
    ...dashboardScreenRuntimeConfig,
    bridgeInputs: {
      ...dashboardScreenRuntimeConfig.bridgeInputs,
      moduleSettingConfig,
    },
  });

  return dashboardScreen;
}
