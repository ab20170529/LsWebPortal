import { buildDashboardConfigBridgeWorkspaceConfig } from './dashboard-config-bridge-workspace-config';

type DashboardConfigBridgeWorkspaceConfig = Parameters<typeof buildDashboardConfigBridgeWorkspaceConfig>[0];

export function buildDashboardConfigBridgeWorkspaceBuilderConfig({
  businessType,
  activeScope,
  activateConditionPanelSelection,
  builderSelectionContextMenu,
  canSwitchScope,
  conditionWorkbenchHelpers,
  conditionWorkbenchMetrics,
  conditionWorkbenchResizeApi,
  currentModuleCode,
  deleteSelectedColumns,
  deleteSelectedConditions,
  isArchiveLayoutEditorOpen,
  isDocumentConditionWorkbenchOpen,
  leftConditionConfig,
  longTextEditorState,
  mainConditionConfig,
  mainTableColumns,
  normalizedMainDetailBoardConfig,
  normalizeColumn,
  previewContextMenu,
  renderFieldPreview,
  setBuilderSelectionContextMenu,
  setIsArchiveLayoutEditorOpen,
  setIsDocumentConditionWorkbenchOpen,
  setLongTextEditorState,
  setPreviewContextMenu,
  showToast,
  updateMainDetailBoard,
  handleDocumentConditionScopeSwitch,
}: {
  businessType: DashboardConfigBridgeWorkspaceConfig['businessType'];
  activeScope: DashboardConfigBridgeWorkspaceConfig['activeScope'];
  activateConditionPanelSelection: DashboardConfigBridgeWorkspaceConfig['onActivateConditionPanel'];
  builderSelectionContextMenu: DashboardConfigBridgeWorkspaceConfig['builderSelectionContextMenu'];
  canSwitchScope: DashboardConfigBridgeWorkspaceConfig['canSwitchScope'];
  conditionWorkbenchHelpers: DashboardConfigBridgeWorkspaceConfig['conditionWorkbenchHelpers'];
  conditionWorkbenchMetrics: DashboardConfigBridgeWorkspaceConfig['conditionWorkbenchMetrics'];
  conditionWorkbenchResizeApi: DashboardConfigBridgeWorkspaceConfig['conditionWorkbenchResize'];
  currentModuleCode: DashboardConfigBridgeWorkspaceConfig['currentModuleCode'];
  deleteSelectedColumns: DashboardConfigBridgeWorkspaceConfig['deleteSelectedColumns'];
  deleteSelectedConditions: DashboardConfigBridgeWorkspaceConfig['deleteSelectedConditions'];
  isArchiveLayoutEditorOpen: DashboardConfigBridgeWorkspaceConfig['isArchiveLayoutOpen'];
  isDocumentConditionWorkbenchOpen: DashboardConfigBridgeWorkspaceConfig['isConditionWorkbenchOpen'];
  leftConditionConfig: DashboardConfigBridgeWorkspaceConfig['leftConditionConfig'];
  longTextEditorState: DashboardConfigBridgeWorkspaceConfig['longTextEditorState'];
  mainConditionConfig: DashboardConfigBridgeWorkspaceConfig['mainConditionConfig'];
  mainTableColumns: DashboardConfigBridgeWorkspaceConfig['mainTableColumns'];
  normalizedMainDetailBoardConfig: DashboardConfigBridgeWorkspaceConfig['currentDetailBoard'];
  normalizeColumn: DashboardConfigBridgeWorkspaceConfig['normalizeColumn'];
  previewContextMenu: DashboardConfigBridgeWorkspaceConfig['previewContextMenu'];
  renderFieldPreview: DashboardConfigBridgeWorkspaceConfig['renderFieldPreview'];
  setBuilderSelectionContextMenu: DashboardConfigBridgeWorkspaceConfig['onSetBuilderSelectionContextMenu'];
  setIsArchiveLayoutEditorOpen: (open: boolean) => void;
  setIsDocumentConditionWorkbenchOpen: (open: boolean) => void;
  setLongTextEditorState: DashboardConfigBridgeWorkspaceConfig['onLongTextEditorStateChange'];
  setPreviewContextMenu: DashboardConfigBridgeWorkspaceConfig['onSetPreviewContextMenu'];
  showToast: DashboardConfigBridgeWorkspaceConfig['showToast'];
  updateMainDetailBoard: DashboardConfigBridgeWorkspaceConfig['onUpdateDetailBoard'];
  handleDocumentConditionScopeSwitch: DashboardConfigBridgeWorkspaceConfig['onScopeSwitch'];
}) : DashboardConfigBridgeWorkspaceConfig {
  return {
    businessType,
    activeScope,
    builderSelectionContextMenu,
    canSwitchScope,
    conditionWorkbenchHelpers,
    conditionWorkbenchMetrics,
    conditionWorkbenchResize: conditionWorkbenchResizeApi,
    currentDetailBoard: normalizedMainDetailBoardConfig,
    currentModuleCode,
    deleteSelectedColumns,
    deleteSelectedConditions,
    isArchiveLayoutOpen: isArchiveLayoutEditorOpen,
    isConditionWorkbenchOpen: isDocumentConditionWorkbenchOpen,
    leftConditionConfig,
    longTextEditorState,
    mainConditionConfig,
    mainTableColumns,
    normalizeColumn,
    onActivateConditionPanel: activateConditionPanelSelection,
    onCloseArchiveLayout: () => setIsArchiveLayoutEditorOpen(false),
    onCloseConditionWorkbench: () => setIsDocumentConditionWorkbenchOpen(false),
    onLongTextEditorStateChange: setLongTextEditorState,
    onScopeSwitch: handleDocumentConditionScopeSwitch,
    onSetBuilderSelectionContextMenu: setBuilderSelectionContextMenu,
    onSetPreviewContextMenu: setPreviewContextMenu,
    onShowToast: showToast,
    onUpdateDetailBoard: updateMainDetailBoard,
    previewContextMenu,
    renderFieldPreview,
    showToast,
  };
}
