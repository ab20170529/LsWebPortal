import { buildDashboardModalNodes } from './dashboard-modal-nodes';
import type { BuildDashboardModalNodesInput } from './dashboard-modal-nodes';

type BuildDashboardModalBridgeNodesInput = {
  deleteFlow: Pick<
    BuildDashboardModalNodesInput,
    | 'deletingMenuId'
    | 'getMenuModuleTypeProfile'
    | 'normalizeMenuCode'
    | 'normalizeMenuTitle'
    | 'onCloseDeleteConfirm'
    | 'onConfirmDelete'
    | 'pendingDeleteMenu'
  >;
  detailBoard: Pick<
    BuildDashboardModalNodesInput,
    | 'detailBoardConfig'
    | 'detailBoardSortColumnId'
    | 'getDetailBoardFieldLiveHeight'
    | 'getDetailBoardFieldLiveWidth'
    | 'getLayoutFieldWorkbenchMeta'
    | 'isDetailBoardOpen'
    | 'mainTableColumns'
    | 'onCloseDetailBoard'
    | 'onResetDetailBoardFieldHeight'
    | 'onResetDetailBoardFieldWidth'
    | 'onStartDetailBoardFieldHeightResize'
    | 'onStartDetailBoardFieldResize'
    | 'renderFieldPreview'
    | 'workspaceTheme'
    | 'workspaceThemeVars'
  >;
  hiddenColumns: Pick<
    BuildDashboardModalNodesInput,
    | 'closeMainHiddenColumnsModal'
    | 'hiddenColumns'
    | 'isMainHiddenColumnsModalOpen'
    | 'mainHiddenColumnsSearchText'
    | 'normalizeColumn'
    | 'onRestoreAllHiddenColumns'
    | 'onRestoreSelectedHiddenColumns'
    | 'onSearchHiddenColumnsTextChange'
    | 'onSelectFilteredHiddenColumns'
    | 'onToggleHiddenColumnSelection'
    | 'selectedHiddenColumnIds'
    | 'workspaceThemeVars'
  >;
};

export function buildDashboardModalBridgeNodes(
  input: BuildDashboardModalBridgeNodesInput,
) {
  return buildDashboardModalNodes({
    ...input.deleteFlow,
    ...input.detailBoard,
    ...input.hiddenColumns,
  });
}
