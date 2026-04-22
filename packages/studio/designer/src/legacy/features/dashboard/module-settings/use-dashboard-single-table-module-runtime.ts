import { useRef, type Dispatch, type SetStateAction } from 'react';

import { buildDashboardDetailGridSourceConfigBuilderConfig } from './dashboard-detail-grid-source-config-builder-config';
import { useDashboardDetailDecorationState } from './use-dashboard-detail-decoration-state';
import { useDashboardDetailResourceLoader } from './use-dashboard-detail-resource-loader';
import { useDashboardDetailTabsBootstrap } from './use-dashboard-detail-tabs-bootstrap';
import { useDashboardSingleTableMainResources } from './use-dashboard-single-table-main-resources';
import { useDashboardSingleTableTreeResources } from './use-dashboard-single-table-tree-resources';
import { useDetailGridSourceConfig } from './use-detail-grid-source-config';
import { useLatestValue } from './use-latest-value';
import { useSingleTableModuleSettingsSave } from './use-single-table-module-settings-save';
import { type BillSourceEntry } from './use-bill-source-state';

type UseDashboardSingleTableModuleRuntimeOptions = {
  builders: {
    buildColumn: (prefix: string, index: number, overrides?: Record<string, any>) => any;
    buildDetailTabConfig: (overrides?: Record<string, any>) => Record<string, any>;
    buildGridConfig: (mainSql: string, defaultQuery: string, overrides?: Record<string, any>) => Record<string, any>;
    buildTreeRelationFallbackColumns: (fields: string[], currentColumns?: any[]) => any[];
    normalizeColumn: (column: any) => any;
    normalizeDetailChartConfig: (config: any) => any;
    normalizeDetailFillTypeValue: (value: string | undefined | null) => string;
    parseSqlFieldNames: (sql: string) => string[];
  };
  config: {
    activeConfigMenu: { moduleType?: string | null } | null;
    activeConfigModuleKey: string;
    activeDetailBackendId: number;
    activeDetailColorRules: any[];
    activeDetailContextMenuItems: any[];
    activeDetailRelatedModuleCode: string;
    activeTab: string;
    businessType: string;
    canLoadSingleTableModuleResources: boolean;
    configStep: number;
    currentDetailFillType: string;
    currentModuleCode: string;
    currentModuleName: string;
    currentPrimaryTableName: string;
    documentConditionOwnerFieldKey: string;
    documentConditionOwnerSourceId: string | number | null | undefined;
    isConfigOpen: boolean;
    moduleSettingStep: number;
    parsedTreeSourceFields: string[];
    restrictionTopStructures: any[];
    shouldLoadBillSources: boolean;
    treeRelationColumn: any;
  };
  helpers: {
    getDashboardErrorMessage: (error: unknown) => string;
    getRecordFieldValue: (record: Record<string, unknown> | null | undefined, ...keys: string[]) => unknown;
    isAbsoluteHttpUrl: (value: string) => boolean;
    joinHttpUrl: (baseUrl: string, path: string) => string;
    showToast: (message: string) => void;
    toRecordNumber: (value: unknown, fallback: number) => number;
    toRecordText: (value: unknown) => string;
  };
  mappings: {
    mapSingleTableColorRule: (rule: any, index: number) => any;
    mapSingleTableConditionRecordToField: (condition: any, index: number, overrides?: Record<string, unknown>) => any;
    mapSingleTableContextMenuItem: (item: any, index: number) => any;
    mapSingleTableDetailChartConfig: (chart: any) => any;
    mapSingleTableDetailGridFieldToColumn: (field: any, index: number, existingColumn?: any) => any;
    mapSingleTableDetailRecord: (detail: any, index: number) => any;
    mapSingleTableFieldRecordToColumn: (field: any, index: number) => any;
    mapSingleTableGridFieldRecordToColumn: (field: any, index: number, existingColumn?: any) => any;
  };
  selection: {
    selectedDetailColorRuleId: string | null;
    selectedDetailContextMenuId: string | null;
  };
  state: {
    detailTabConfigs: Record<string, any>;
    detailTabs: Array<{ id: string; name: string }>;
    detailTableColumns: Record<string, any[]>;
    detailTableConfigs: Record<string, any>;
    leftFilterFields: any[];
    leftTableColumns: any[];
    leftTableConfig: Record<string, any>;
    mainFilterFields: any[];
    mainTableColumns: any[];
    mainTableConfig: Record<string, any>;
  };
  setters: {
    setActiveTab: Dispatch<SetStateAction<string>>;
    setBillDetailColumns: Dispatch<SetStateAction<any[]>>;
    setBillDetailConfig: Dispatch<SetStateAction<Record<string, any>>>;
    setDetailBoardSortColumnId: Dispatch<SetStateAction<string | null>>;
    setDetailFilterFields: Dispatch<SetStateAction<Record<string, any[]>>>;
    setDetailTabConfigs: Dispatch<SetStateAction<Record<string, any>>>;
    setDetailTableColumns: Dispatch<SetStateAction<Record<string, any[]>>>;
    setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
    setDetailTabs: Dispatch<SetStateAction<Array<{ id: string; name: string }>>>;
    setInspectorTarget: Dispatch<SetStateAction<any>>;
    setIsSingleTableFieldsLoading: Dispatch<SetStateAction<boolean>>;
    setLeftFilterFields: Dispatch<SetStateAction<any[]>>;
    setLeftTableColumns: Dispatch<SetStateAction<any[]>>;
    setLeftTableConfig: Dispatch<SetStateAction<Record<string, any>>>;
    setMainFilterFields: Dispatch<SetStateAction<any[]>>;
    setMainTableColumns: Dispatch<SetStateAction<any[]>>;
    setMainTableConfig: Dispatch<SetStateAction<Record<string, any>>>;
    setSelectedDetailColorRuleId: Dispatch<SetStateAction<string | null>>;
    setSelectedDetailContextMenuId: Dispatch<SetStateAction<string | null>>;
    setSelectedDetailFiltersForDelete: Dispatch<SetStateAction<string[]>>;
    setSelectedDetailForDelete: Dispatch<SetStateAction<string[]>>;
    setSelectedLeftFiltersForDelete: Dispatch<SetStateAction<string[]>>;
    setSelectedLeftForDelete: Dispatch<SetStateAction<string[]>>;
    setSelectedMainFiltersForDelete: Dispatch<SetStateAction<string[]>>;
    setSelectedMainForDelete: Dispatch<SetStateAction<string[]>>;
    hydrateBillSources: (sources: BillSourceEntry[]) => void;
  };
};

export function useDashboardSingleTableModuleRuntime({
  builders,
  config,
  helpers,
  mappings,
  selection,
  state,
  setters,
}: UseDashboardSingleTableModuleRuntimeOptions) {
  const detailDecorationSnapshotRef = useRef(new Map<string, { colorRules: any[]; contextMenuItems: any[] }>());
  const detailModuleDecorationSnapshotRef = useRef(new Map<string, { colorRules: any[]; contextMenuItems: any[] }>());

  const {
    captureDetailResources,
    captureDetails,
    captureFieldColors,
    captureFieldConditions,
    captureFieldGridFields,
    captureMainColors,
    captureMainConditions,
    captureMainFields,
    captureMainMenus,
    isSaving: isSingleTableModuleSettingsSaving,
    saveCurrentPage: saveSingleTableModuleSettingsPage,
  } = useSingleTableModuleSettingsSave({
    getCachedDetailDecorations: (moduleCode, detailId) => (
      detailDecorationSnapshotRef.current.get(`${moduleCode}:${detailId}`) ?? null
    ),
    getCachedModuleDecorations: (moduleCode) => (
      detailModuleDecorationSnapshotRef.current.get(moduleCode) ?? null
    ),
    onShowToast: helpers.showToast,
    mapColorRule: mappings.mapSingleTableColorRule,
    mapConditionRecordToField: mappings.mapSingleTableConditionRecordToField,
    mapContextMenuItem: mappings.mapSingleTableContextMenuItem,
    mapDetailChartConfig: mappings.mapSingleTableDetailChartConfig,
    mapDetailGridFieldToColumn: mappings.mapSingleTableDetailGridFieldToColumn,
    mapDetailRecord: mappings.mapSingleTableDetailRecord,
    mapFieldGridFieldToColumn: mappings.mapSingleTableGridFieldRecordToColumn,
    mapMainFieldRecordToColumn: mappings.mapSingleTableFieldRecordToColumn,
    setActiveTab: setters.setActiveTab,
    setDetailTabConfigs: setters.setDetailTabConfigs,
    setDetailTableColumns: setters.setDetailTableColumns,
    setDetailTableConfigs: setters.setDetailTableConfigs,
    setDetailTabs: setters.setDetailTabs,
    setLeftFilterFields: setters.setLeftFilterFields,
    setLeftTableColumns: setters.setLeftTableColumns,
    setLeftTableConfig: setters.setLeftTableConfig,
    setMainFilterFields: setters.setMainFilterFields,
    setMainTableColumns: setters.setMainTableColumns,
    setMainTableConfig: setters.setMainTableConfig,
    activeTab: config.activeTab,
    currentModuleCode: config.activeConfigModuleKey,
    currentModuleName: config.currentModuleName,
    detailTabConfigs: state.detailTabConfigs,
    detailTableColumns: state.detailTableColumns,
    detailTableConfigs: state.detailTableConfigs,
    detailTabs: state.detailTabs,
    documentConditionOwnerFieldKey: config.documentConditionOwnerFieldKey,
    documentConditionOwnerSourceId: String(config.documentConditionOwnerSourceId ?? ''),
    isActive: config.canLoadSingleTableModuleResources,
    leftFilterFields: state.leftFilterFields,
    leftTableColumns: state.leftTableColumns,
    leftTableConfig: state.leftTableConfig,
    mainFilterFields: state.mainFilterFields,
    mainTableColumns: state.mainTableColumns,
    mainTableConfig: state.mainTableConfig,
  });

  const detailTableColumnsRef = useLatestValue(state.detailTableColumns);

  useDashboardDetailDecorationState({
    activeConfigModuleKey: config.activeConfigModuleKey,
    activeDetailBackendId: config.activeDetailBackendId,
    activeDetailColorRules: config.activeDetailColorRules,
    activeDetailContextMenuItems: config.activeDetailContextMenuItems,
    activeDetailRelatedModuleCode: config.activeDetailRelatedModuleCode,
    activeTab: config.activeTab,
    buildGridConfig: builders.buildGridConfig,
    canLoadSingleTableModuleResources: config.canLoadSingleTableModuleResources,
    captureDetailResources,
    configStep: config.configStep,
    currentDetailFillType: config.currentDetailFillType,
    detailDecorationSnapshotRef,
    detailModuleDecorationSnapshotRef,
    detailTableColumnsRef,
    getDashboardErrorMessage: helpers.getDashboardErrorMessage,
    getRecordFieldValue: helpers.getRecordFieldValue,
    isConfigOpen: config.isConfigOpen,
    mapSingleTableColorRule: mappings.mapSingleTableColorRule,
    mapSingleTableContextMenuItem: mappings.mapSingleTableContextMenuItem,
    moduleSettingStep: config.moduleSettingStep,
    selectedDetailColorRuleId: selection.selectedDetailColorRuleId,
    selectedDetailContextMenuId: selection.selectedDetailContextMenuId,
    setDetailTableConfigs: setters.setDetailTableConfigs,
    setSelectedDetailColorRuleId: setters.setSelectedDetailColorRuleId,
    setSelectedDetailContextMenuId: setters.setSelectedDetailContextMenuId,
    showToast: helpers.showToast,
    toRecordNumber: helpers.toRecordNumber,
  });

  const {
    loadSingleTableDetailResourcesById,
    resolveDetailModuleSnapshotByCode,
    resolveSingleTableDetailResource,
  } = useDashboardDetailResourceLoader({
    activeConfigModuleKey: config.activeConfigModuleKey,
    buildColumn: builders.buildColumn,
    buildDetailTabConfig: builders.buildDetailTabConfig,
    buildGridConfig: builders.buildGridConfig,
    canLoadSingleTableModuleResources: config.canLoadSingleTableModuleResources,
    captureDetailResources,
    configStep: config.configStep,
    currentModuleCode: config.currentModuleCode,
    currentPrimaryTableName: config.currentPrimaryTableName,
    detailModuleDecorationSnapshotRef,
    detailTabConfigs: state.detailTabConfigs,
    detailTableColumns: state.detailTableColumns,
    detailTableConfigs: state.detailTableConfigs,
    getDashboardErrorMessage: helpers.getDashboardErrorMessage,
    getRecordFieldValue: helpers.getRecordFieldValue,
    isAbsoluteHttpUrl: helpers.isAbsoluteHttpUrl,
    isConfigOpen: config.isConfigOpen,
    joinHttpUrl: helpers.joinHttpUrl,
    mainTableColumns: state.mainTableColumns,
    mainTableConfig: state.mainTableConfig,
    mapSingleTableColorRule: mappings.mapSingleTableColorRule,
    mapSingleTableContextMenuItem: mappings.mapSingleTableContextMenuItem,
    mapSingleTableDetailChartConfig: mappings.mapSingleTableDetailChartConfig,
    mapSingleTableDetailGridFieldToColumn: mappings.mapSingleTableDetailGridFieldToColumn,
    moduleSettingStep: config.moduleSettingStep,
    normalizeColumn: builders.normalizeColumn,
    normalizeDetailFillTypeValue: builders.normalizeDetailFillTypeValue,
    setDetailTableColumns: setters.setDetailTableColumns,
    setDetailTableConfigs: setters.setDetailTableConfigs,
    showToast: helpers.showToast,
    toRecordNumber: helpers.toRecordNumber,
    toRecordText: helpers.toRecordText,
  });

  useDashboardDetailTabsBootstrap({
    activeConfigModuleKey: config.activeConfigModuleKey,
    canLoadSingleTableModuleResources: config.canLoadSingleTableModuleResources,
    captureDetails,
    configStep: config.configStep,
    detailResourceScopeKey: `${String(config.activeConfigMenu?.moduleType ?? '').trim().toLowerCase()}:${config.activeConfigModuleKey}`,
    getDashboardErrorMessage: helpers.getDashboardErrorMessage,
    isConfigOpen: config.isConfigOpen,
    mapSingleTableDetailRecord: mappings.mapSingleTableDetailRecord,
    moduleSettingStep: config.moduleSettingStep,
    resolveSingleTableDetailResource,
    setActiveTab: setters.setActiveTab,
    setDetailFilterFields: setters.setDetailFilterFields,
    setDetailTabConfigs: setters.setDetailTabConfigs,
    setDetailTableColumns: setters.setDetailTableColumns,
    setDetailTableConfigs: setters.setDetailTableConfigs,
    setDetailTabs: setters.setDetailTabs,
    setSelectedDetailFiltersForDelete: setters.setSelectedDetailFiltersForDelete,
    setSelectedDetailForDelete: setters.setSelectedDetailForDelete,
    showToast: helpers.showToast,
  });

  useDashboardSingleTableMainResources({
    activeConfigModuleKey: config.activeConfigModuleKey,
    businessType: config.businessType,
    canLoadSingleTableModuleResources: config.canLoadSingleTableModuleResources,
    captureMainColors,
    captureMainConditions,
    captureMainFields,
    captureMainMenus,
    configStep: config.configStep,
    getDashboardErrorMessage: helpers.getDashboardErrorMessage,
    getRecordFieldValue: helpers.getRecordFieldValue,
    hydrateBillSources: setters.hydrateBillSources,
    isConfigOpen: config.isConfigOpen,
    mainResourceScopeKey: `${String(config.activeConfigMenu?.moduleType ?? '').trim().toLowerCase()}:${config.activeConfigModuleKey}`,
    mapSingleTableColorRule: mappings.mapSingleTableColorRule,
    mapSingleTableConditionRecordToField: mappings.mapSingleTableConditionRecordToField,
    mapSingleTableContextMenuItem: mappings.mapSingleTableContextMenuItem,
    mapSingleTableDetailGridFieldToColumn: mappings.mapSingleTableDetailGridFieldToColumn,
    mapSingleTableFieldRecordToColumn: mappings.mapSingleTableFieldRecordToColumn,
    moduleSettingStep: config.moduleSettingStep,
    setBillDetailColumns: setters.setBillDetailColumns,
    setBillDetailConfig: setters.setBillDetailConfig,
    setDetailBoardSortColumnId: setters.setDetailBoardSortColumnId,
    setInspectorTarget: setters.setInspectorTarget,
    setIsSingleTableFieldsLoading: setters.setIsSingleTableFieldsLoading,
    setMainFilterFields: setters.setMainFilterFields,
    setMainTableColumns: setters.setMainTableColumns,
    setMainTableConfig: setters.setMainTableConfig,
    setSelectedDetailForDelete: setters.setSelectedDetailForDelete,
    setSelectedMainFiltersForDelete: setters.setSelectedMainFiltersForDelete,
    setSelectedMainForDelete: setters.setSelectedMainForDelete,
    shouldLoadBillSources: config.shouldLoadBillSources,
    showToast: helpers.showToast,
    toRecordNumber: helpers.toRecordNumber,
    toRecordText: helpers.toRecordText,
  });

  useDashboardSingleTableTreeResources({
    activeConfigModuleKey: config.activeConfigModuleKey,
    buildTreeRelationFallbackColumns: builders.buildTreeRelationFallbackColumns,
    canLoadSingleTableModuleResources: config.canLoadSingleTableModuleResources,
    captureFieldColors,
    captureFieldConditions,
    captureFieldGridFields,
    configStep: config.configStep,
    documentConditionOwnerFieldKey: config.documentConditionOwnerFieldKey,
    documentConditionOwnerSourceId: config.documentConditionOwnerSourceId,
    getDashboardErrorMessage: helpers.getDashboardErrorMessage,
    getRecordFieldValue: helpers.getRecordFieldValue,
    isConfigOpen: config.isConfigOpen,
    mapSingleTableColorRule: mappings.mapSingleTableColorRule,
    mapSingleTableConditionRecordToField: mappings.mapSingleTableConditionRecordToField,
    mapSingleTableGridFieldRecordToColumn: mappings.mapSingleTableGridFieldRecordToColumn,
    moduleSettingStep: config.moduleSettingStep,
    normalizeColumn: builders.normalizeColumn,
    parsedTreeSourceFields: config.parsedTreeSourceFields,
    setInspectorTarget: setters.setInspectorTarget,
    setLeftFilterFields: setters.setLeftFilterFields,
    setLeftTableColumns: setters.setLeftTableColumns,
    setLeftTableConfig: setters.setLeftTableConfig,
    setSelectedLeftFiltersForDelete: setters.setSelectedLeftFiltersForDelete,
    showToast: helpers.showToast,
    toRecordNumber: helpers.toRecordNumber,
    toRecordText: helpers.toRecordText,
    treeRelationColumn: config.treeRelationColumn,
    treeResourceScopeKey: `${String(config.activeConfigMenu?.moduleType ?? '').trim().toLowerCase()}:${config.activeConfigModuleKey}:${String(config.documentConditionOwnerSourceId ?? '')}`,
  });

  const detailGridSourceConfig = useDetailGridSourceConfig(buildDashboardDetailGridSourceConfigBuilderConfig({
    builders: {
      buildColumn: builders.buildColumn,
      buildDetailTabConfig: builders.buildDetailTabConfig,
      buildGridConfig: builders.buildGridConfig,
    },
    detailState: {
      detailTabConfigs: state.detailTabConfigs,
      detailTabs: state.detailTabs,
      detailTableConfigs: state.detailTableConfigs,
      mainTableColumns: state.mainTableColumns,
      mainTableConfig: state.mainTableConfig,
    },
    feedback: {
      showToast: helpers.showToast,
    },
    helpers: {
      normalizeColumn: builders.normalizeColumn,
      normalizeDetailChartConfig: builders.normalizeDetailChartConfig,
      parseSqlFieldNames: builders.parseSqlFieldNames,
      resolveDetailModuleSnapshotByCode,
    },
    moduleState: {
      businessType: config.businessType,
      currentModuleCode: config.currentModuleCode,
      currentModuleName: config.currentModuleName,
      currentPrimaryTableName: config.currentPrimaryTableName,
      restrictionTopStructures: config.restrictionTopStructures,
    },
    setters: {
      setDetailTabConfigs: setters.setDetailTabConfigs,
      setDetailTableColumns: setters.setDetailTableColumns,
      setDetailTableConfigs: setters.setDetailTableConfigs,
    },
  }));

  return {
    ...detailGridSourceConfig,
    isSingleTableModuleSettingsSaving,
    loadSingleTableDetailResourcesById,
    saveSingleTableModuleSettingsPage,
  };
}
