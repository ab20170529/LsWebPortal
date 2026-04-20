import React, { useCallback, useMemo } from 'react';

import type { TableBuilderOptions } from './table-builder';

type DetailTableColumnsState = Record<string, any[]>;
type DetailTableConfigsState = Record<string, any>;
const SINGLE_TABLE_PREVIEW_MIN_COLUMN_WIDTH = 96;

type SingleTablePreviewTemplateParams = {
  canvasLabel: string;
  contextMenuConfig?: TableBuilderOptions['contextMenuConfig'];
  contextMenuScope?: TableBuilderOptions['contextMenuScope'];
  detailBoardConfig?: any;
  layoutVersion?: string;
  normalizedDetailBoardConfig?: any;
  onCanvasDoubleClick?: () => void;
  onSelectTable: () => void;
  renderableColumns?: any[];
  tableSelected: boolean;
};

function buildSingleTablePreviewTemplate({
  canvasLabel,
  contextMenuConfig,
  contextMenuScope,
  detailBoardConfig,
  layoutVersion,
  normalizedDetailBoardConfig,
  onCanvasDoubleClick,
  onSelectTable,
  renderableColumns,
  tableSelected,
}: SingleTablePreviewTemplateParams): TableBuilderOptions {
  return {
    contextMenuScope,
    contextMenuConfig,
    backgroundSelectable: true,
    tableSelected,
    onSelectTable,
    detailBoardConfig,
    normalizedDetailBoardConfig,
    renderableColumns,
    onCanvasDoubleClick,
    canvasLabel,
    surfaceVariant: 'solid',
    surfaceShape: 'square',
    previewReadableMinWidth: SINGLE_TABLE_PREVIEW_MIN_COLUMN_WIDTH,
    layoutVersion,
  };
}

export type UseDashboardTableBuilderOptionsParams = {
  activeTab: string;
  activateTableConfigSelection: (scope: 'left' | 'main' | 'detail', id?: string) => void;
  detailTableColumns: DetailTableColumnsState;
  detailTableConfigs: DetailTableConfigsState;
  detailTabsLength: number;
  inspectorTargetId: string;
  mainDetailBoardEnabled: boolean;
  mainDetailBoardGroupsLength: number;
  mainRenderableColumns: any[];
  mainTableConfig: {
    contextMenuItems?: any[];
    detailBoard?: any;
  };
  normalizedMainDetailBoardConfig: any;
  openDetailBoardPreview: (tabIndex: number) => void;
  selectedTableConfigScope: string | null;
  setDetailTableColumns: React.Dispatch<React.SetStateAction<DetailTableColumnsState>>;
  setSelectedArchiveNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  showDetailGridActionBar: boolean;
};

export function useDashboardTableBuilderOptions({
  activeTab,
  activateTableConfigSelection,
  detailTableColumns,
  detailTableConfigs,
  detailTabsLength,
  inspectorTargetId,
  mainDetailBoardEnabled,
  mainDetailBoardGroupsLength,
  mainRenderableColumns,
  mainTableConfig,
  normalizedMainDetailBoardConfig,
  openDetailBoardPreview,
  selectedTableConfigScope,
  setDetailTableColumns,
  setSelectedArchiveNodeId,
  showDetailGridActionBar,
}: UseDashboardTableBuilderOptionsParams) {
  const activeDetailTableColumns = useMemo(() => detailTableColumns[activeTab] || [], [activeTab, detailTableColumns]);
  const activeDetailTableConfig = detailTableConfigs[activeTab];
  const isDetailGridTableSelected = selectedTableConfigScope === 'detail' && inspectorTargetId === '表格';

  const setActiveDetailTableColumns = useCallback((newCols: React.SetStateAction<any[]>) => {
    setDetailTableColumns((prev) => ({
      ...prev,
      [activeTab]: typeof newCols === 'function' ? newCols(prev[activeTab] || []) : newCols,
    }));
  }, [activeTab, setDetailTableColumns]);

  const handleArchiveMainTableSelect = useCallback(() => {
    setSelectedArchiveNodeId('archive-main');
    activateTableConfigSelection('main');
  }, [activateTableConfigSelection, setSelectedArchiveNodeId]);

  const handleArchiveMainTablePreview = useCallback(() => {
    if (mainDetailBoardGroupsLength === 0) return;
    openDetailBoardPreview(1);
  }, [mainDetailBoardGroupsLength, openDetailBoardPreview]);

  const handleArchiveLeftTableSelect = useCallback(() => {
    setSelectedArchiveNodeId('archive-left-grid');
    activateTableConfigSelection('left');
  }, [activateTableConfigSelection, setSelectedArchiveNodeId]);

  const handleBuilderMainTableSelect = useCallback(() => {
    activateTableConfigSelection('main');
  }, [activateTableConfigSelection]);

  const handleBuilderMainTablePreview = useCallback(() => {
    if (!mainDetailBoardEnabled) return;
    openDetailBoardPreview(1);
  }, [mainDetailBoardEnabled, openDetailBoardPreview]);

  const handleActiveDetailTableSelect = useCallback(() => {
    setSelectedArchiveNodeId(`detail-${activeTab}`);
    activateTableConfigSelection('detail', '表格');
  }, [activeTab, activateTableConfigSelection, setSelectedArchiveNodeId]);

  const handleBillDetailTableSelect = useCallback(() => {
    activateTableConfigSelection('detail');
  }, [activateTableConfigSelection]);

  const archiveMainTableBuilderOptions = useMemo<TableBuilderOptions>(() => buildSingleTablePreviewTemplate({
    contextMenuScope: 'main',
    contextMenuConfig: {
      enabled: (mainTableConfig.contextMenuItems ?? []).length > 0,
      items: mainTableConfig.contextMenuItems ?? [],
    },
    tableSelected: selectedTableConfigScope === 'main',
    onSelectTable: handleArchiveMainTableSelect,
    detailBoardConfig: mainTableConfig.detailBoard,
    normalizedDetailBoardConfig: normalizedMainDetailBoardConfig,
    renderableColumns: mainRenderableColumns,
    onCanvasDoubleClick: handleArchiveMainTablePreview,
    canvasLabel: '点击配置基础档案主表',
    layoutVersion: detailTabsLength > 0 ? 'main-with-detail' : 'main-without-detail',
  }), [
    detailTabsLength,
    handleArchiveMainTablePreview,
    handleArchiveMainTableSelect,
    mainRenderableColumns,
    mainTableConfig.contextMenuItems,
    mainTableConfig.detailBoard,
    normalizedMainDetailBoardConfig,
    selectedTableConfigScope,
  ]);

  const documentTreeTableBuilderOptions = useMemo<TableBuilderOptions>(() => ({
    backgroundSelectable: true,
    tableSelected: selectedTableConfigScope === 'left',
    onSelectTable: handleArchiveLeftTableSelect,
    canvasLabel: '点击配置左侧表',
    surfaceVariant: 'solid',
    surfaceShape: 'square',
  }), [handleArchiveLeftTableSelect, selectedTableConfigScope]);

  const builderMainTableBuilderOptions = useMemo<TableBuilderOptions>(() => ({
    backgroundSelectable: true,
    tableSelected: selectedTableConfigScope === 'main',
    onSelectTable: handleBuilderMainTableSelect,
    detailBoardConfig: mainTableConfig.detailBoard,
    normalizedDetailBoardConfig: normalizedMainDetailBoardConfig,
    renderableColumns: mainRenderableColumns,
    onCanvasDoubleClick: handleBuilderMainTablePreview,
    canvasLabel: '点击配置主表属性',
    surfaceVariant: 'solid',
    surfaceShape: 'square',
  }), [
    handleBuilderMainTablePreview,
    handleBuilderMainTableSelect,
    mainRenderableColumns,
    mainTableConfig.detailBoard,
    normalizedMainDetailBoardConfig,
    selectedTableConfigScope,
  ]);

  const documentDetailTableBuilderOptions = useMemo<TableBuilderOptions>(() => buildSingleTablePreviewTemplate({
    contextMenuScope: 'detail',
    contextMenuConfig: {
      enabled: Boolean(activeDetailTableConfig?.contextMenuEnabled),
      items: activeDetailTableConfig?.contextMenuItems ?? [],
    },
    tableSelected: isDetailGridTableSelected,
    onSelectTable: handleActiveDetailTableSelect,
    detailBoardConfig: activeDetailTableConfig?.detailBoard,
    renderableColumns: activeDetailTableColumns,
    canvasLabel: '点击配置明细表属性',
    layoutVersion: `detail-tabs-${detailTabsLength}-footer-${showDetailGridActionBar ? 1 : 0}`,
  }), [
    activeDetailTableColumns,
    activeDetailTableConfig?.contextMenuEnabled,
    activeDetailTableConfig?.contextMenuItems,
    activeDetailTableConfig?.detailBoard,
    detailTabsLength,
    handleActiveDetailTableSelect,
    isDetailGridTableSelected,
    showDetailGridActionBar,
  ]);

  const billDetailTableBuilderOptions = useMemo<TableBuilderOptions>(() => ({
    backgroundSelectable: true,
    tableSelected: selectedTableConfigScope === 'detail',
    onSelectTable: handleBillDetailTableSelect,
    canvasLabel: '点击配置单据明细表',
  }), [handleBillDetailTableSelect, selectedTableConfigScope]);

  return {
    activeDetailTableColumns,
    setActiveDetailTableColumns,
    archiveMainTableBuilderOptions,
    documentTreeTableBuilderOptions,
    builderMainTableBuilderOptions,
    documentDetailTableBuilderOptions,
    billDetailTableBuilderOptions,
  };
}
