import React from 'react';
import { DetailBoardPreviewModal } from './detail-board-preview-modal';
import { DeleteConfirmModal } from './delete-confirm-modal';
import { MainHiddenColumnsModal } from './main-hidden-columns-modal';
import type { LayoutFieldWorkbenchMetaResolver } from './layout-field-workbench-meta';

export type BuildDashboardModalNodesInput = {
  closeMainHiddenColumnsModal: () => void;
  deletingMenuId: string | null;
  detailBoardConfig: Record<string, any>;
  detailBoardSortColumnId: string | null;
  getDetailBoardFieldLiveHeight: (groupId: string, columnId: string, fallbackHeight: number) => number;
  getDetailBoardFieldLiveWidth: (groupId: string, columnId: string, fallbackWidth: number) => number;
  getLayoutFieldWorkbenchMeta: LayoutFieldWorkbenchMetaResolver;
  getMenuModuleTypeProfile: (moduleType: any) => { businessType?: string; label?: string } | null | undefined;
  hiddenColumns: Record<string, any>[];
  isDetailBoardOpen: boolean;
  isMainHiddenColumnsModalOpen: boolean;
  mainHiddenColumnsSearchText: string;
  mainTableColumns: Record<string, any>[];
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  normalizeMenuCode: (value: any) => string;
  normalizeMenuTitle: (value: any) => string;
  onCloseDeleteConfirm: () => void;
  onCloseDetailBoard: () => void;
  onConfirmDelete: () => void;
  onResetDetailBoardFieldHeight: (event: React.MouseEvent<any>, groupId: string, columnId: string) => void;
  onResetDetailBoardFieldWidth: (event: React.MouseEvent<any>, groupId: string, columnId: string) => void;
  onRestoreAllHiddenColumns: () => void;
  onRestoreSelectedHiddenColumns: () => void;
  onSearchHiddenColumnsTextChange: (value: string) => void;
  onSelectFilteredHiddenColumns: (columnIds: string[]) => void;
  onStartDetailBoardFieldHeightResize: (
    event: React.MouseEvent<any>,
    groupId: string,
    columnId: string,
    label: string,
    minHeightOverride?: number,
  ) => void;
  onStartDetailBoardFieldResize: (
    event: React.MouseEvent<any>,
    groupId: string,
    columnId: string,
    label: string,
    minWidthOverride?: number,
  ) => void;
  onToggleHiddenColumnSelection: (columnId: string) => void;
  pendingDeleteMenu: Record<string, any> | null;
  renderFieldPreview: (column: Record<string, any>, index: number, scope: string) => React.ReactNode;
  selectedHiddenColumnIds: string[];
  workspaceTheme: string;
  workspaceThemeVars: React.CSSProperties;
};

export function buildDashboardModalNodes(input: BuildDashboardModalNodesInput) {
  const deleteConfirmNode = input.pendingDeleteMenu ? (
    <DeleteConfirmModal
      isDeleting={input.deletingMenuId === input.pendingDeleteMenu.id}
      menuKey={input.normalizeMenuCode(input.pendingDeleteMenu.purviewId) || '未提供'}
      menuTitle={input.normalizeMenuTitle(input.pendingDeleteMenu.title) || '当前模块'}
      moduleTypeBusinessType={input.getMenuModuleTypeProfile(input.pendingDeleteMenu.moduleType)?.businessType}
      moduleTypeLabel={input.getMenuModuleTypeProfile(input.pendingDeleteMenu.moduleType)?.label ?? '未定义'}
      onCancel={input.onCloseDeleteConfirm}
      onConfirm={input.onConfirmDelete}
      open
    />
  ) : null;

  const detailBoardPreviewNode = (
    <DetailBoardPreviewModal
      detailBoardConfig={input.detailBoardConfig}
      detailBoardSortColumnId={input.detailBoardSortColumnId}
      getDetailBoardFieldLiveHeight={input.getDetailBoardFieldLiveHeight}
      getDetailBoardFieldLiveWidth={input.getDetailBoardFieldLiveWidth}
      getLayoutFieldWorkbenchMeta={input.getLayoutFieldWorkbenchMeta}
      isOpen={input.isDetailBoardOpen}
      mainTableColumns={input.mainTableColumns}
      onClose={input.onCloseDetailBoard}
      onResetDetailBoardFieldHeight={input.onResetDetailBoardFieldHeight}
      onResetDetailBoardFieldWidth={input.onResetDetailBoardFieldWidth}
      onStartDetailBoardFieldHeightResize={input.onStartDetailBoardFieldHeightResize}
      onStartDetailBoardFieldResize={input.onStartDetailBoardFieldResize}
      renderFieldPreview={input.renderFieldPreview}
      workspaceTheme={input.workspaceTheme}
      workspaceThemeVars={input.workspaceThemeVars}
    />
  );

  const mainHiddenColumnsModalNode = (
    <MainHiddenColumnsModal
      hiddenColumns={input.hiddenColumns}
      isOpen={input.isMainHiddenColumnsModalOpen}
      normalizeColumn={input.normalizeColumn}
      onClose={input.closeMainHiddenColumnsModal}
      onRestoreAll={input.onRestoreAllHiddenColumns}
      onRestoreSelected={input.onRestoreSelectedHiddenColumns}
      onSearchTextChange={input.onSearchHiddenColumnsTextChange}
      onSelectFilteredResults={input.onSelectFilteredHiddenColumns}
      onToggleSelection={input.onToggleHiddenColumnSelection}
      searchText={input.mainHiddenColumnsSearchText}
      selectedColumnIds={input.selectedHiddenColumnIds}
      workspaceThemeVars={input.workspaceThemeVars}
    />
  );

  return {
    deleteConfirmNode,
    detailBoardPreviewNode,
    mainHiddenColumnsModalNode,
  };
}
