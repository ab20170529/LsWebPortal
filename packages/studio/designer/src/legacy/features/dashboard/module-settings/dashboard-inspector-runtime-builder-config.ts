import type { UseDashboardInspectorRuntimeInput } from './use-dashboard-inspector-runtime';

type DashboardInspectorRuntimeBuilderConfig = {
  actions: {
    activateColumnSelection: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['activateColumnSelection'];
    activateSourceGridSelection: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['activateSourceGridSelection'];
    applyDetailModuleInheritanceById: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['applyDetailModuleInheritanceById'];
    clearColumnSelection: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['clearColumnSelection'];
    consumeFieldSettingsOpenRequest: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['consumeFieldSettingsOpenRequest'];
    createBillSourceDraft: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['createBillSourceDraft'];
    deleteBillSourceById: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['deleteBillSourceById'];
    deleteSelectedColumns: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['deleteSelectedColumns'];
    deleteSelectedConditions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['deleteSelectedConditions'];
    handleConditionPanelFieldSelect: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['handleConditionPanelFieldSelect'];
    handleDetailModuleCodeChange: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['handleDetailModuleCodeChange'];
    loadSingleTableDetailResourcesById: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['loadSingleTableDetailResourcesById'];
    onOpenArchiveLayoutEditor: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['onOpenArchiveLayoutEditor'];
    onOpenConditionWorkbench: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['onOpenConditionWorkbench'];
    onOpenDetailBoardPreview: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['onOpenDetailBoardPreview'];
    onOpenMainHiddenColumnsModal: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['onOpenMainHiddenColumnsModal'];
    onResetDetailBoardFieldWidth: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['onResetDetailBoardFieldWidth'];
    onStartDetailBoardFieldResize: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['onStartDetailBoardFieldResize'];
    removeDetailTab: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['deleteDetailTabById'];
    saveBillSourceDraft: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['saveBillSourceDraft'];
    saveSingleTableModuleSettingsPage: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['saveCurrentPage'];
    selectBillSourceDraft: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectBillSourceDraft'];
    showToast: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['showToast'];
    syncDetailColumnsFromSqlById: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['syncDetailColumnsFromSqlById'];
    updateBillHeaderWorkbenchRows: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['updateBillHeaderWorkbenchRows'];
    updateBillSourceById: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['updateBillSourceById'];
    updateBillSourceDraft: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['updateBillSourceDraft'];
    updateDetailTabConfigById: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['updateDetailTabConfigById'];
  };
  components: {
    DesignerWorkbenchDraggableItem: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['DesignerWorkbenchDraggableItem'];
    DesignerWorkbenchDropLane: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['DesignerWorkbenchDropLane'];
  };
  constants: {
    billFormDefaultFontSize: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billFormDefaultFontSize'];
    billFormDefaultLabelWidth: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billFormDefaultLabelWidth'];
    billFormMinWidth: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billFormMinWidth'];
    billHeaderWorkbenchMaxRows: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billHeaderWorkbenchMaxRows'];
    billHeaderWorkbenchMinRows: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billHeaderWorkbenchMinRows'];
    billSourceConfigTypeOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billSourceConfigTypeOptions'];
    billSourceTypeOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billSourceTypeOptions'];
    columnAlignOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['columnAlignOptions'];
    conditionPanelControlWidth: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['conditionPanelControlWidth'];
    conditionPanelResizeMaxWidth: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['conditionPanelResizeMaxWidth'];
    conditionPanelResizeMinWidth: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['conditionPanelResizeMinWidth'];
    defaultFieldSqlTagOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['defaultFieldSqlTagOptions'];
    detailBoardFieldDefaultWidth: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['detailBoardFieldDefaultWidth'];
    detailBoardThemeOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['detailBoardThemeOptions'];
    detailChartTypeOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['detailChartTypeOptions'];
    detailFillTypeOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['detailFillTypeOptions'];
    fieldSqlTagLabelFallbacks: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['fieldSqlTagLabelFallbacks'];
    fieldTypeOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['fieldTypeOptions'];
    gridColorRuleOperatorOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['gridColorRuleOperatorOptions'];
    mainTableHiddenColumnsCount: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['mainTableHiddenColumnsCount'];
    tableColumnResizeMinWidth: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['tableColumnResizeMinWidth'];
    tableTypeOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['tableTypeOptions'];
  };
  helpers: {
    buildDetailTabConfig: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['buildDetailTabConfig'];
    buildGridColorRule: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['buildGridColorRule'];
    buildGridConfig: UseDashboardInspectorRuntimeInput['columnContextInput']['buildGridConfig'];
    getBillHeaderRowCount: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['getBillHeaderRowCount'];
    getDetailFillTypeBackendValue: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['getDetailFillTypeBackendValue'];
    getDetailFillTypeByTabId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['getDetailFillTypeByTabId'];
    getDetailFillTypeMeta: UseDashboardInspectorRuntimeInput['columnContextInput']['getDetailFillTypeMeta'];
    getDetailTabConfigById: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['getDetailTabConfigById'];
    getFieldSqlTagOptionLabel: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['getFieldSqlTagOptionLabel'];
    getOrderedBillHeaderFields: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['getOrderedBillHeaderFields'];
    getSelectedConditionPanelContext: UseDashboardInspectorRuntimeInput['columnContextInput']['getSelectedConditionPanelContext'];
    isTreeRelationFieldColumn: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['isTreeRelationFieldColumn'];
    mapFieldSqlTagToFieldType: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['mapFieldSqlTagToFieldType'];
    normalizeColumn: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['normalizeColumn'];
    normalizeConditionField: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['normalizeConditionField'];
    normalizeDetailChartConfig: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['normalizeDetailChartConfig'];
    normalizeDetailFillTypeValue: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['normalizeDetailFillTypeValue'];
    normalizeFieldSqlTagId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['normalizeFieldSqlTagId'];
    parseDetailBoardClipboardColumnIds: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['parseDetailBoardClipboardColumnIds'];
    renderFieldPreview: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['renderFieldPreview'];
    resolveColumnFieldSqlTagId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['resolveColumnFieldSqlTagId'];
    toRecordText: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['toRecordText'];
  };
  setters: {
    setBillDetailColumns: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setBillDetailColumns'];
    setBillDetailConfig: UseDashboardInspectorRuntimeInput['columnContextInput']['setBillDetailConfig'];
    setBillMetaFields: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setBillMetaFields'];
    setBillSourceDraft: UseDashboardInspectorRuntimeInput['columnContextInput']['setBillSourceDraft'];
    setDetailFilterFields: UseDashboardInspectorRuntimeInput['columnContextInput']['setDetailFilterFields'];
    setDetailTabConfigs: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setDetailTabConfigs'];
    setDetailTableColumns: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setDetailTableColumns'];
    setDetailTableConfigs: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setDetailTableConfigs'];
    setDetailTabs: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setDetailTabs'];
    setInspectorPanelTab: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setInspectorPanelTab'];
    setInspectorTarget: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setInspectorTarget'];
    setIsGeneratingSqlDraft: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setIsGeneratingSqlDraft'];
    setIsTranslatingIdentifiers: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setIsTranslatingIdentifiers'];
    setLeftFilterFields: UseDashboardInspectorRuntimeInput['columnContextInput']['setLeftFilterFields'];
    setLeftTableColumns: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setLeftTableColumns'];
    setLeftTableConfig: UseDashboardInspectorRuntimeInput['columnContextInput']['setLeftTableConfig'];
    setLongTextEditorState: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setLongTextEditorState'];
    setMainFilterFields: UseDashboardInspectorRuntimeInput['columnContextInput']['setMainFilterFields'];
    setMainTableColumns: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setMainTableColumns'];
    setMainTableConfig: UseDashboardInspectorRuntimeInput['columnContextInput']['setMainTableConfig'];
    setSelectedDetailBoardGroupId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedDetailBoardGroupId'];
    setSelectedDetailColorRuleId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedDetailColorRuleId'];
    setSelectedDetailContextMenuId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedDetailContextMenuId'];
    setSelectedLeftColorRuleId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedLeftColorRuleId'];
    setSelectedLeftContextMenuId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedLeftContextMenuId'];
    setSelectedMainColorRuleId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedMainColorRuleId'];
    setSelectedMainContextMenuId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedMainContextMenuId'];
    setSelectedMainForDelete: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedMainForDelete'];
    setSelectedPopupMenuParamKey: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setSelectedPopupMenuParamKey'];
    setWorkspaceTheme: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['setWorkspaceTheme'];
  };
  state: {
    activeBillSourceId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['activeBillSourceId'];
    activeDetailBoardResize: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['activeDetailBoardResize'];
    activeTab: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['activeTab'];
    billDetailColumns: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billDetailColumns'];
    billDetailConfig: UseDashboardInspectorRuntimeInput['columnContextInput']['billDetailConfig'];
    billMetaFields: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billMetaFields'];
    billSourceDraft: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billSourceDraft'];
    billSourceDraftMode: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billSourceDraftMode'];
    billSourceFieldMap: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billSourceFieldMap'];
    billSources: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['billSources'];
    businessType: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['businessType'];
    currentMenuDraft: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['currentMenuDraft'];
    currentModuleCode: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['currentModuleCode'];
    currentModuleName: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['currentModuleName'];
    designerWorkbenchSensors: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['designerWorkbenchSensors'];
    detailBoardClipboardIds: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['detailBoardClipboardIds'];
    detailFilterFields: UseDashboardInspectorRuntimeInput['columnContextInput']['detailFilterFields'];
    detailSourceModuleCandidates: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['detailSourceModuleCandidates'];
    detailTabConfigs: UseDashboardInspectorRuntimeInput['columnContextInput']['detailTabConfigs'];
    detailTableColumns: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['detailTableColumns'];
    detailTableConfigs: UseDashboardInspectorRuntimeInput['columnContextInput']['detailTableConfigs'];
    detailTabs: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['detailTabs'];
    documentConditionOwnerSourceId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['documentConditionOwnerSourceId'];
    fieldSqlTagOptions: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['fieldSqlTagOptions'];
    inspectorPanelTab: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['inspectorPanelTab'];
    inspectorTarget: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['inspectorTarget'];
    isGeneratingSqlDraft: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['isGeneratingSqlDraft'];
    isTranslatingIdentifiers: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['isTranslatingIdentifiers'];
    leftFilterFields: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['leftFilterFields'];
    fieldSettingsOpenRequest: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['fieldSettingsOpenRequest'];
    leftTableColumns: UseDashboardInspectorRuntimeInput['columnContextInput']['leftTableColumns'];
    leftTableConfig: UseDashboardInspectorRuntimeInput['columnContextInput']['leftTableConfig'];
    mainFilterFields: UseDashboardInspectorRuntimeInput['columnContextInput']['mainFilterFields'];
    mainTableColumns: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['mainTableColumns'];
    mainTableConfig: UseDashboardInspectorRuntimeInput['columnContextInput']['mainTableConfig'];
    selectedDetailBoardGroupId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectedDetailBoardGroupId'];
    selectedDetailColorRuleId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectedDetailColorRuleId'];
    selectedDetailContextMenuId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectedDetailContextMenuId'];
    selectedLeftColorRuleId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectedLeftColorRuleId'];
    selectedLeftContextMenuId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectedLeftContextMenuId'];
    selectedMainColorRuleId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectedMainColorRuleId'];
    selectedMainContextMenuId: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectedMainContextMenuId'];
    selectedPopupMenuParamKey: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['selectedPopupMenuParamKey'];
    treeRelationColumn: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['treeRelationColumn'];
    workspaceTheme: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['workspaceTheme'];
    workspaceThemeVars: UseDashboardInspectorRuntimeInput['inspectorPanelInput']['workspaceThemeVars'];
  };
};

export function buildDashboardInspectorRuntimeBuilderConfig({
  actions,
  components,
  constants,
  helpers,
  setters,
  state,
}: DashboardInspectorRuntimeBuilderConfig): UseDashboardInspectorRuntimeInput {
  const columnContextInput: UseDashboardInspectorRuntimeInput['columnContextInput'] = {
      activeTab: state.activeTab,
      billDetailColumns: state.billDetailColumns,
      billDetailConfig: state.billDetailConfig,
      billMetaFields: state.billMetaFields,
      billSourceDraft: state.billSourceDraft,
      billSources: state.billSources,
      businessType: state.businessType,
      buildDetailTabConfig: helpers.buildDetailTabConfig,
      buildGridConfig: helpers.buildGridConfig,
      detailFillTypeOptions: constants.detailFillTypeOptions,
      detailFilterFields: state.detailFilterFields,
      detailTabConfigs: state.detailTabConfigs,
      detailTableColumns: state.detailTableColumns,
      detailTableConfigs: state.detailTableConfigs,
      detailTabs: state.detailTabs,
      getDetailFillTypeByTabId: helpers.getDetailFillTypeByTabId,
      getDetailFillTypeMeta: helpers.getDetailFillTypeMeta,
      getSelectedConditionPanelContext: helpers.getSelectedConditionPanelContext,
      inspectorTarget: state.inspectorTarget,
      leftFilterFields: state.leftFilterFields,
      leftTableColumns: state.leftTableColumns,
      leftTableConfig: state.leftTableConfig,
      mainFilterFields: state.mainFilterFields,
      mainTableColumns: state.mainTableColumns,
      mainTableConfig: state.mainTableConfig,
      setBillDetailColumns: setters.setBillDetailColumns,
      setBillDetailConfig: setters.setBillDetailConfig,
      setBillMetaFields: setters.setBillMetaFields,
      setBillSourceDraft: setters.setBillSourceDraft,
      setDetailFilterFields: setters.setDetailFilterFields,
      setDetailTabConfigs: setters.setDetailTabConfigs,
      setDetailTableColumns: setters.setDetailTableColumns,
      setDetailTableConfigs: setters.setDetailTableConfigs,
      setLeftFilterFields: setters.setLeftFilterFields,
      setLeftTableColumns: setters.setLeftTableColumns,
      setLeftTableConfig: setters.setLeftTableConfig,
      setMainFilterFields: setters.setMainFilterFields,
      setMainTableColumns: setters.setMainTableColumns,
      setMainTableConfig: setters.setMainTableConfig,
      workspaceTheme: state.workspaceTheme,
    };
  const inspectorPanelInput: UseDashboardInspectorRuntimeInput['inspectorPanelInput'] = {
      ...actions,
      ...components,
      ...constants,
      ...helpers,
      ...setters,
      activeBillSourceId: state.activeBillSourceId,
      activeDetailBoardResize: state.activeDetailBoardResize,
      activeTab: state.activeTab,
      billDetailColumns: state.billDetailColumns,
      billMetaFields: state.billMetaFields,
      billSourceDraft: state.billSourceDraft,
      billSourceDraftMode: state.billSourceDraftMode,
      billSourceFieldMap: state.billSourceFieldMap,
      billSources: state.billSources,
      businessType: state.businessType,
      currentMenuDraft: state.currentMenuDraft,
      currentModuleCode: state.currentModuleCode,
      currentModuleName: state.currentModuleName,
      deleteDetailTabById: actions.removeDetailTab,
      designerWorkbenchSensors: state.designerWorkbenchSensors,
      detailBoardClipboardIds: state.detailBoardClipboardIds,
      detailSourceModuleCandidates: state.detailSourceModuleCandidates,
      detailTableColumns: state.detailTableColumns,
      detailTabs: state.detailTabs,
      documentConditionOwnerSourceId: state.documentConditionOwnerSourceId,
      fieldSqlTagOptions: state.fieldSqlTagOptions,
      inspectorPanelTab: state.inspectorPanelTab,
      inspectorTarget: state.inspectorTarget,
      isGeneratingSqlDraft: state.isGeneratingSqlDraft,
      isTranslatingIdentifiers: state.isTranslatingIdentifiers,
      leftFilterFields: state.leftFilterFields,
      fieldSettingsOpenRequest: state.fieldSettingsOpenRequest,
      mainTableColumns: state.mainTableColumns,
      saveCurrentPage: actions.saveSingleTableModuleSettingsPage,
      selectedDetailBoardGroupId: state.selectedDetailBoardGroupId,
      selectedDetailColorRuleId: state.selectedDetailColorRuleId,
      selectedDetailContextMenuId: state.selectedDetailContextMenuId,
      selectedLeftColorRuleId: state.selectedLeftColorRuleId,
      selectedLeftContextMenuId: state.selectedLeftContextMenuId,
      selectedMainColorRuleId: state.selectedMainColorRuleId,
      selectedMainContextMenuId: state.selectedMainContextMenuId,
      selectedPopupMenuParamKey: state.selectedPopupMenuParamKey,
      treeRelationColumn: state.treeRelationColumn,
      workspaceTheme: state.workspaceTheme,
      workspaceThemeVars: state.workspaceThemeVars,
    };

  return {
    columnContextInput,
    inspectorPanelInput,
  };
}
