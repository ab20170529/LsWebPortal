import { buildDashboardConfigBridgeWorkspaceInput } from './dashboard-config-bridge-workspace-input';
import type { BuildDashboardConfigBridgeNodesInput } from './dashboard-config-bridge-nodes';

type BuildDashboardConfigBridgeWorkspaceConfig = {
  businessType: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['businessType'];
  activeScope: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['activeScope'];
  builderSelectionContextMenu: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['builderSelectionContextMenu'];
  canSwitchScope: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['canSwitchScope'];
  conditionWorkbenchHelpers: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['helpers'];
  conditionWorkbenchMetrics: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['metrics'];
  conditionWorkbenchResize: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['resize'];
  currentDetailBoard: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['currentDetailBoard'];
  currentModuleCode: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['currentModuleCode'];
  deleteSelectedColumns: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['deleteSelectedColumns'];
  deleteSelectedConditions: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['deleteSelectedConditions'];
  isArchiveLayoutOpen: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['isOpen'];
  isConditionWorkbenchOpen: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['isOpen'];
  leftConditionConfig: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['leftConfig'];
  longTextEditorState: BuildDashboardConfigBridgeNodesInput['workspace']['longTextEditor']['state'];
  mainConditionConfig: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['mainConfig'];
  mainTableColumns: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['mainTableColumns'];
  normalizeColumn: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['normalizeColumn'];
  onActivateConditionPanel: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['onActivatePanel'];
  onCloseArchiveLayout: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['onClose'];
  onCloseConditionWorkbench: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['onClose'];
  onLongTextEditorStateChange: BuildDashboardConfigBridgeNodesInput['workspace']['longTextEditor']['onStateChange'];
  onScopeSwitch: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['onScopeSwitch'];
  onSetBuilderSelectionContextMenu: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['setBuilderSelectionContextMenu'];
  onSetPreviewContextMenu: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['setPreviewContextMenu'];
  onShowToast: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['onShowToast'];
  onUpdateDetailBoard: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['onUpdateDetailBoard'];
  previewContextMenu: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['previewContextMenu'];
  renderFieldPreview: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['renderFieldPreview'];
  showToast: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['showToast'];
};

export function buildDashboardConfigBridgeWorkspaceConfig(
  input: BuildDashboardConfigBridgeWorkspaceConfig,
) {
  return buildDashboardConfigBridgeWorkspaceInput({
    archiveLayoutState: {
      businessType: input.businessType,
      currentDetailBoard: input.currentDetailBoard,
      currentModuleCode: input.currentModuleCode,
      isOpen: input.isArchiveLayoutOpen,
      mainTableColumns: input.mainTableColumns,
    },
    archiveLayoutActions: {
      onClose: input.onCloseArchiveLayout,
      onShowToast: input.onShowToast,
      onUpdateDetailBoard: input.onUpdateDetailBoard,
    },
    archiveLayoutHelpers: {
      normalizeColumn: input.normalizeColumn,
      renderFieldPreview: input.renderFieldPreview,
    },
    conditionWorkbenchState: {
      activeScope: input.activeScope,
      canSwitchScope: input.canSwitchScope,
      isOpen: input.isConditionWorkbenchOpen,
      mainConfig: input.mainConditionConfig,
      leftConfig: input.leftConditionConfig,
    },
    conditionWorkbenchActions: {
      onActivatePanel: input.onActivateConditionPanel,
      onClose: input.onCloseConditionWorkbench,
      onScopeSwitch: input.onScopeSwitch,
    },
    conditionWorkbenchRuntime: {
      renderFieldPreview: input.renderFieldPreview,
      resize: input.conditionWorkbenchResize,
      helpers: input.conditionWorkbenchHelpers,
      metrics: input.conditionWorkbenchMetrics,
    },
    contextMenuState: {
      builderSelectionContextMenu: input.builderSelectionContextMenu,
      previewContextMenu: input.previewContextMenu,
    },
    contextMenuActions: {
      deleteSelectedColumns: input.deleteSelectedColumns,
      deleteSelectedConditions: input.deleteSelectedConditions,
      setBuilderSelectionContextMenu: input.onSetBuilderSelectionContextMenu,
      setPreviewContextMenu: input.onSetPreviewContextMenu,
      showToast: input.showToast,
    },
    longTextEditor: {
      state: input.longTextEditorState,
      onStateChange: input.onLongTextEditorStateChange,
    },
  });
}
