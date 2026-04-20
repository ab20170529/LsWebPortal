import type { BuildDashboardConfigBridgeNodesInput } from './dashboard-config-bridge-nodes';

type BuildDashboardConfigBridgeWorkspaceInput = {
  archiveLayoutState: {
    businessType: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['businessType'];
    currentDetailBoard: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['currentDetailBoard'];
    currentModuleCode: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['currentModuleCode'];
    isOpen: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['isOpen'];
    mainTableColumns: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['mainTableColumns'];
  };
  archiveLayoutActions: {
    onShowToast: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['onShowToast'];
    onClose: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['onClose'];
    onUpdateDetailBoard: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['onUpdateDetailBoard'];
  };
  archiveLayoutHelpers: {
    normalizeColumn: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['normalizeColumn'];
    renderFieldPreview: BuildDashboardConfigBridgeNodesInput['workspace']['archiveLayout']['renderFieldPreview'];
  };
  conditionWorkbenchState: {
    activeScope: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['activeScope'];
    canSwitchScope: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['canSwitchScope'];
    isOpen: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['isOpen'];
    mainConfig: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['mainConfig'];
    leftConfig: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['leftConfig'];
  };
  conditionWorkbenchActions: {
    onScopeSwitch: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['onScopeSwitch'];
    onActivatePanel: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['onActivatePanel'];
    onClose: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['onClose'];
  };
  conditionWorkbenchRuntime: {
    renderFieldPreview: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['renderFieldPreview'];
    resize: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['resize'];
    helpers: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['helpers'];
    metrics: BuildDashboardConfigBridgeNodesInput['workspace']['conditionWorkbench']['metrics'];
  };
  contextMenuState: {
    builderSelectionContextMenu: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['builderSelectionContextMenu'];
    previewContextMenu: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['previewContextMenu'];
  };
  contextMenuActions: {
    deleteSelectedColumns: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['deleteSelectedColumns'];
    deleteSelectedConditions: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['deleteSelectedConditions'];
    setBuilderSelectionContextMenu: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['setBuilderSelectionContextMenu'];
    setPreviewContextMenu: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['setPreviewContextMenu'];
    showToast: BuildDashboardConfigBridgeNodesInput['workspace']['contextMenus']['showToast'];
  };
  longTextEditor: BuildDashboardConfigBridgeNodesInput['workspace']['longTextEditor'];
};

export function buildDashboardConfigBridgeWorkspaceInput(
  input: BuildDashboardConfigBridgeWorkspaceInput,
): BuildDashboardConfigBridgeNodesInput['workspace'] {
  return {
    archiveLayout: {
      ...input.archiveLayoutState,
      ...input.archiveLayoutActions,
      ...input.archiveLayoutHelpers,
    },
    conditionWorkbench: {
      ...input.conditionWorkbenchState,
      ...input.conditionWorkbenchActions,
      ...input.conditionWorkbenchRuntime,
    },
    contextMenus: {
      ...input.contextMenuState,
      ...input.contextMenuActions,
    },
    longTextEditor: input.longTextEditor,
  };
}
