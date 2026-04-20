import type { BuildDashboardConfigBridgeNodesInput } from './dashboard-config-bridge-nodes';

type BuildDashboardConfigBridgeModuleSettingInput = {
  container: BuildDashboardConfigBridgeNodesInput['moduleSetting']['container'];
  commonState: {
    activeResize: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['activeResize'];
    activeTab: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['activeTab'];
    businessType: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['businessType'];
    currentModuleName: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['currentModuleName'];
    currentDetailFillType: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['currentDetailFillType'];
    currentDetailFillTypeValue: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['currentDetailFillTypeValue'];
    detailTabs: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['detailTabs'];
    detailWebUrl: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['detailWebUrl'];
    inspectorPaneWidth: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['inspectorPaneWidth'];
    isConfigFullscreenActive: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['isConfigFullscreenActive'];
    isTreePaneVisible: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['isTreePaneVisible'];
    moduleSettingStageHeightClass: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['moduleSettingStageHeightClass'];
    moduleSettingStageStyle: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['moduleSettingStageStyle'];
    treeRelationColumn: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['treeRelationColumn'];
    workspaceTheme: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['workspaceTheme'];
    workspaceThemeStyles: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['workspaceThemeStyles'];
    workspaceThemeVars: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['workspaceThemeVars'];
  };
  commonNodes: {
    archiveMainTableBuilderNode: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['archiveMainTableBuilderNode'];
    billDocumentWorkbenchNode: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['billDocumentWorkbenchNode'];
    columnOperationPanel: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['columnOperationPanel'];
  };
  commonActions: {
    addTab: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['addTab'];
    onActivateDetailTab: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['onActivateDetailTab'];
    onActivateTableConfig: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['onActivateTableConfig'];
    onOpenMainHiddenColumnsModal: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['onOpenMainHiddenColumnsModal'];
    onToggleFullscreen: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['onToggleFullscreen'];
    setBuilderSelectionContextMenu: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['setBuilderSelectionContextMenu'];
    setInspectorPanelTab: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['setInspectorPanelTab'];
    setSelectedArchiveNodeId: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['setSelectedArchiveNodeId'];
  };
  commonHelpers: {
    renderFieldPreview: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['common']['renderFieldPreview'];
  };
  document: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['document'];
  tree: BuildDashboardConfigBridgeNodesInput['moduleSetting']['shell']['tree'];
};

export function buildDashboardConfigBridgeModuleSettingInput(
  input: BuildDashboardConfigBridgeModuleSettingInput,
): BuildDashboardConfigBridgeNodesInput['moduleSetting'] {
  return {
    container: input.container,
    shell: {
      common: {
        ...input.commonState,
        ...input.commonNodes,
        ...input.commonActions,
        ...input.commonHelpers,
      },
      document: input.document,
      tree: input.tree,
    },
  };
}
