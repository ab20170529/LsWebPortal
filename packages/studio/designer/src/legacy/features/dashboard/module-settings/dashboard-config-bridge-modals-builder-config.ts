import { buildDashboardConfigBridgeModalsConfig } from './dashboard-config-bridge-modals-config';

type DashboardConfigBridgeModalsConfig = Parameters<typeof buildDashboardConfigBridgeModalsConfig>[0];

export function buildDashboardConfigBridgeModalsBuilderConfig({
  closeDeleteConfirm,
  closeMainHiddenColumnsModal,
  confirmDeleteMenu,
  deletingMenuId,
  detailBoardConfig,
  detailBoardSortColumnId,
  getDetailBoardFieldLiveHeight,
  getDetailBoardFieldLiveWidth,
  getLayoutFieldWorkbenchMeta,
  getMenuModuleTypeProfile,
  hiddenColumns,
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
}: {
  closeDeleteConfirm: DashboardConfigBridgeModalsConfig['onCloseDeleteConfirm'];
  closeMainHiddenColumnsModal: DashboardConfigBridgeModalsConfig['closeMainHiddenColumnsModal'];
  confirmDeleteMenu: DashboardConfigBridgeModalsConfig['onConfirmDelete'];
  deletingMenuId: DashboardConfigBridgeModalsConfig['deletingMenuId'];
  detailBoardConfig: DashboardConfigBridgeModalsConfig['detailBoardConfig'];
  detailBoardSortColumnId: DashboardConfigBridgeModalsConfig['detailBoardSortColumnId'];
  getDetailBoardFieldLiveHeight: DashboardConfigBridgeModalsConfig['getDetailBoardFieldLiveHeight'];
  getDetailBoardFieldLiveWidth: DashboardConfigBridgeModalsConfig['getDetailBoardFieldLiveWidth'];
  getLayoutFieldWorkbenchMeta: DashboardConfigBridgeModalsConfig['getLayoutFieldWorkbenchMeta'];
  getMenuModuleTypeProfile: DashboardConfigBridgeModalsConfig['getMenuModuleTypeProfile'];
  hiddenColumns: DashboardConfigBridgeModalsConfig['hiddenColumns'];
  isDetailBoardOpen: DashboardConfigBridgeModalsConfig['isDetailBoardOpen'];
  isMainHiddenColumnsModalOpen: DashboardConfigBridgeModalsConfig['isMainHiddenColumnsModalOpen'];
  mainHiddenColumnsSearchText: DashboardConfigBridgeModalsConfig['mainHiddenColumnsSearchText'];
  mainTableColumns: DashboardConfigBridgeModalsConfig['mainTableColumns'];
  normalizeColumn: DashboardConfigBridgeModalsConfig['normalizeColumn'];
  normalizeMenuCode: DashboardConfigBridgeModalsConfig['normalizeMenuCode'];
  normalizeMenuTitle: DashboardConfigBridgeModalsConfig['normalizeMenuTitle'];
  pendingDeleteMenu: DashboardConfigBridgeModalsConfig['pendingDeleteMenu'];
  renderFieldPreview: DashboardConfigBridgeModalsConfig['renderFieldPreview'];
  resetDetailBoardFieldHeight: DashboardConfigBridgeModalsConfig['onResetDetailBoardFieldHeight'];
  resetDetailBoardFieldWidth: DashboardConfigBridgeModalsConfig['onResetDetailBoardFieldWidth'];
  restoreMainHiddenColumns: (columnIds?: string[]) => void;
  selectedMainHiddenColumnIds: DashboardConfigBridgeModalsConfig['selectedHiddenColumnIds'];
  setIsDetailBoardOpen: (open: boolean) => void;
  setMainHiddenColumnsSearchText: DashboardConfigBridgeModalsConfig['onSearchHiddenColumnsTextChange'];
  setSelectedMainHiddenColumnIds: DashboardConfigBridgeModalsConfig['onSelectFilteredHiddenColumns'];
  startDetailBoardFieldHeightResize: DashboardConfigBridgeModalsConfig['onStartDetailBoardFieldHeightResize'];
  startDetailBoardFieldResize: DashboardConfigBridgeModalsConfig['onStartDetailBoardFieldResize'];
  toggleMainHiddenColumnSelection: DashboardConfigBridgeModalsConfig['onToggleHiddenColumnSelection'];
  workspaceTheme: DashboardConfigBridgeModalsConfig['workspaceTheme'];
  workspaceThemeVars: DashboardConfigBridgeModalsConfig['workspaceThemeVars'];
}) : DashboardConfigBridgeModalsConfig {
  return {
    closeMainHiddenColumnsModal,
    deletingMenuId,
    detailBoardConfig,
    detailBoardSortColumnId,
    getDetailBoardFieldLiveHeight,
    getDetailBoardFieldLiveWidth,
    getLayoutFieldWorkbenchMeta,
    getMenuModuleTypeProfile,
    hiddenColumns,
    isDetailBoardOpen,
    isMainHiddenColumnsModalOpen,
    mainHiddenColumnsSearchText,
    mainTableColumns,
    normalizeColumn,
    normalizeMenuCode,
    normalizeMenuTitle,
    onCloseDeleteConfirm: closeDeleteConfirm,
    onCloseDetailBoard: () => setIsDetailBoardOpen(false),
    onConfirmDelete: confirmDeleteMenu,
    onResetDetailBoardFieldHeight: resetDetailBoardFieldHeight,
    onResetDetailBoardFieldWidth: resetDetailBoardFieldWidth,
    onRestoreAllHiddenColumns: () => restoreMainHiddenColumns(mainTableColumns.map((column) => column.id)),
    onRestoreSelectedHiddenColumns: () => restoreMainHiddenColumns(),
    onSearchHiddenColumnsTextChange: setMainHiddenColumnsSearchText,
    onSelectFilteredHiddenColumns: setSelectedMainHiddenColumnIds,
    onStartDetailBoardFieldHeightResize: startDetailBoardFieldHeightResize,
    onStartDetailBoardFieldResize: startDetailBoardFieldResize,
    onToggleHiddenColumnSelection: toggleMainHiddenColumnSelection,
    pendingDeleteMenu,
    renderFieldPreview,
    selectedHiddenColumnIds: selectedMainHiddenColumnIds,
    workspaceTheme,
    workspaceThemeVars,
  };
}
