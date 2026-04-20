import { buildDashboardConfigBridgeModalsInput } from './dashboard-config-bridge-modals-input';
import type { BuildDashboardConfigBridgeNodesInput } from './dashboard-config-bridge-nodes';

type BuildDashboardConfigBridgeModalsConfig = {
  closeMainHiddenColumnsModal: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['closeMainHiddenColumnsModal'];
  deletingMenuId: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['deletingMenuId'];
  detailBoardConfig: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['detailBoardConfig'];
  detailBoardSortColumnId: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['detailBoardSortColumnId'];
  getDetailBoardFieldLiveHeight: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['getDetailBoardFieldLiveHeight'];
  getDetailBoardFieldLiveWidth: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['getDetailBoardFieldLiveWidth'];
  getLayoutFieldWorkbenchMeta: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['getLayoutFieldWorkbenchMeta'];
  getMenuModuleTypeProfile: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['getMenuModuleTypeProfile'];
  hiddenColumns: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['hiddenColumns'];
  isDetailBoardOpen: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['isDetailBoardOpen'];
  isMainHiddenColumnsModalOpen: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['isMainHiddenColumnsModalOpen'];
  mainHiddenColumnsSearchText: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['mainHiddenColumnsSearchText'];
  mainTableColumns: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['mainTableColumns'];
  normalizeColumn: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['normalizeColumn'];
  normalizeMenuCode: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['normalizeMenuCode'];
  normalizeMenuTitle: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['normalizeMenuTitle'];
  onCloseDeleteConfirm: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['onCloseDeleteConfirm'];
  onCloseDetailBoard: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onCloseDetailBoard'];
  onConfirmDelete: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['onConfirmDelete'];
  onResetDetailBoardFieldHeight: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onResetDetailBoardFieldHeight'];
  onResetDetailBoardFieldWidth: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onResetDetailBoardFieldWidth'];
  onRestoreAllHiddenColumns: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onRestoreAllHiddenColumns'];
  onRestoreSelectedHiddenColumns: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onRestoreSelectedHiddenColumns'];
  onSearchHiddenColumnsTextChange: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onSearchHiddenColumnsTextChange'];
  onSelectFilteredHiddenColumns: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onSelectFilteredHiddenColumns'];
  onStartDetailBoardFieldHeightResize: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onStartDetailBoardFieldHeightResize'];
  onStartDetailBoardFieldResize: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['onStartDetailBoardFieldResize'];
  onToggleHiddenColumnSelection: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['onToggleHiddenColumnSelection'];
  pendingDeleteMenu: BuildDashboardConfigBridgeNodesInput['modals']['deleteFlow']['pendingDeleteMenu'];
  renderFieldPreview: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['renderFieldPreview'];
  selectedHiddenColumnIds: BuildDashboardConfigBridgeNodesInput['modals']['hiddenColumns']['selectedHiddenColumnIds'];
  workspaceTheme: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['workspaceTheme'];
  workspaceThemeVars: BuildDashboardConfigBridgeNodesInput['modals']['detailBoard']['workspaceThemeVars'];
};

export function buildDashboardConfigBridgeModalsConfig(
  input: BuildDashboardConfigBridgeModalsConfig,
) {
  return buildDashboardConfigBridgeModalsInput({
    deleteFlowState: {
      deletingMenuId: input.deletingMenuId,
      pendingDeleteMenu: input.pendingDeleteMenu,
    },
    deleteFlowHelpers: {
      getMenuModuleTypeProfile: input.getMenuModuleTypeProfile,
      normalizeMenuCode: input.normalizeMenuCode,
      normalizeMenuTitle: input.normalizeMenuTitle,
    },
    deleteFlowActions: {
      onCloseDeleteConfirm: input.onCloseDeleteConfirm,
      onConfirmDelete: input.onConfirmDelete,
    },
    detailBoardState: {
      detailBoardConfig: input.detailBoardConfig,
      detailBoardSortColumnId: input.detailBoardSortColumnId,
      isDetailBoardOpen: input.isDetailBoardOpen,
      mainTableColumns: input.mainTableColumns,
      workspaceTheme: input.workspaceTheme,
      workspaceThemeVars: input.workspaceThemeVars,
    },
    detailBoardActions: {
      onCloseDetailBoard: input.onCloseDetailBoard,
      onResetDetailBoardFieldHeight: input.onResetDetailBoardFieldHeight,
      onResetDetailBoardFieldWidth: input.onResetDetailBoardFieldWidth,
      onStartDetailBoardFieldHeightResize: input.onStartDetailBoardFieldHeightResize,
      onStartDetailBoardFieldResize: input.onStartDetailBoardFieldResize,
    },
    detailBoardHelpers: {
      getDetailBoardFieldLiveHeight: input.getDetailBoardFieldLiveHeight,
      getDetailBoardFieldLiveWidth: input.getDetailBoardFieldLiveWidth,
      getLayoutFieldWorkbenchMeta: input.getLayoutFieldWorkbenchMeta,
      renderFieldPreview: input.renderFieldPreview,
    },
    hiddenColumnsState: {
      hiddenColumns: input.hiddenColumns,
      isMainHiddenColumnsModalOpen: input.isMainHiddenColumnsModalOpen,
      mainHiddenColumnsSearchText: input.mainHiddenColumnsSearchText,
      selectedHiddenColumnIds: input.selectedHiddenColumnIds,
      workspaceThemeVars: input.workspaceThemeVars,
    },
    hiddenColumnsActions: {
      closeMainHiddenColumnsModal: input.closeMainHiddenColumnsModal,
      onRestoreAllHiddenColumns: input.onRestoreAllHiddenColumns,
      onRestoreSelectedHiddenColumns: input.onRestoreSelectedHiddenColumns,
      onSearchHiddenColumnsTextChange: input.onSearchHiddenColumnsTextChange,
      onSelectFilteredHiddenColumns: input.onSelectFilteredHiddenColumns,
      onToggleHiddenColumnSelection: input.onToggleHiddenColumnSelection,
    },
    hiddenColumnsHelpers: {
      normalizeColumn: input.normalizeColumn,
    },
  });
}
