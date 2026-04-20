import type { BuildDashboardConfigBridgeNodesInput } from './dashboard-config-bridge-nodes';

type BuildDashboardConfigBridgeModalsInput = {
  deleteFlowState: {
    deletingMenuId: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['deletingMenuId'];
    pendingDeleteMenu: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['pendingDeleteMenu'];
  };
  deleteFlowHelpers: {
    getMenuModuleTypeProfile: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['getMenuModuleTypeProfile'];
    normalizeMenuCode: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['normalizeMenuCode'];
    normalizeMenuTitle: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['normalizeMenuTitle'];
  };
  deleteFlowActions: {
    onCloseDeleteConfirm: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['onCloseDeleteConfirm'];
    onConfirmDelete: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['onConfirmDelete'];
  };
  detailBoardState: {
    detailBoardConfig: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['detailBoardConfig'];
    detailBoardSortColumnId: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['detailBoardSortColumnId'];
    isDetailBoardOpen: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['isDetailBoardOpen'];
    mainTableColumns: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['mainTableColumns'];
    workspaceTheme: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['workspaceTheme'];
    workspaceThemeVars: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['workspaceThemeVars'];
  };
  detailBoardActions: {
    onCloseDetailBoard: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onCloseDetailBoard'];
    onResetDetailBoardFieldHeight: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onResetDetailBoardFieldHeight'];
    onResetDetailBoardFieldWidth: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onResetDetailBoardFieldWidth'];
    onStartDetailBoardFieldHeightResize: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onStartDetailBoardFieldHeightResize'];
    onStartDetailBoardFieldResize: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onStartDetailBoardFieldResize'];
  };
  detailBoardHelpers: {
    getDetailBoardFieldLiveHeight: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['getDetailBoardFieldLiveHeight'];
    getDetailBoardFieldLiveWidth: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['getDetailBoardFieldLiveWidth'];
    getLayoutFieldWorkbenchMeta: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['getLayoutFieldWorkbenchMeta'];
    renderFieldPreview: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['renderFieldPreview'];
  };
  hiddenColumnsState: {
    hiddenColumns: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['hiddenColumns'];
    isMainHiddenColumnsModalOpen: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['isMainHiddenColumnsModalOpen'];
    mainHiddenColumnsSearchText: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['mainHiddenColumnsSearchText'];
    selectedHiddenColumnIds: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['selectedHiddenColumnIds'];
    workspaceThemeVars: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['workspaceThemeVars'];
  };
  hiddenColumnsActions: {
    closeMainHiddenColumnsModal: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['closeMainHiddenColumnsModal'];
    onRestoreAllHiddenColumns: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onRestoreAllHiddenColumns'];
    onRestoreSelectedHiddenColumns: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onRestoreSelectedHiddenColumns'];
    onSearchHiddenColumnsTextChange: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onSearchHiddenColumnsTextChange'];
    onSelectFilteredHiddenColumns: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onSelectFilteredHiddenColumns'];
    onToggleHiddenColumnSelection: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onToggleHiddenColumnSelection'];
  };
  hiddenColumnsHelpers: {
    normalizeColumn: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['normalizeColumn'];
  };
};

export function buildDashboardConfigBridgeModalsInput(
  input: BuildDashboardConfigBridgeModalsInput,
): BuildDashboardConfigBridgeNodesInput['modals'] {
  return {
    deleteFlow: {
      ...input.deleteFlowState,
      ...input.deleteFlowHelpers,
      ...input.deleteFlowActions,
    },
    detailBoard: {
      ...input.detailBoardState,
      ...input.detailBoardActions,
      ...input.detailBoardHelpers,
    },
    hiddenColumns: {
      ...input.hiddenColumnsState,
      ...input.hiddenColumnsActions,
      ...input.hiddenColumnsHelpers,
    },
  };
}
