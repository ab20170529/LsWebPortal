import React, { useCallback } from 'react';
import {
  MemoTableBuilder,
  type TableBuilderColumnMetrics,
  type TableBuilderHelpers,
  type TableBuilderOptions,
} from './table-builder';
import type { ActiveWorkbenchResize, WorkbenchResizeMode } from '../resize/use-workbench-resize-state';

export type TableBuilderScope = 'left' | 'main' | 'detail';
type BusinessType = 'document' | 'table' | 'tree';

export type TableBuilderRenderParams = {
  scope: TableBuilderScope;
  cols: any[];
  setCols: React.Dispatch<React.SetStateAction<any[]>>;
  selectedId: string | null;
  selectedForDelete: string[];
  setSelectedForDelete: React.Dispatch<React.SetStateAction<string[]>>;
  options?: TableBuilderOptions;
};

type UseTableBuilderRendererParams = {
  activeResize: ActiveWorkbenchResize | null;
  workspaceTheme: string;
  workspaceThemeVars: React.CSSProperties;
  isCompactModuleSetting: boolean;
  businessType: BusinessType;
  activateColumnSelection: (scope: TableBuilderScope, columnId: string | null) => void;
  setBuilderSelectionContextMenu: React.Dispatch<React.SetStateAction<any>>;
  startResize: (
    event: React.MouseEvent,
    colId: string,
    cols: any[],
    setCols: React.Dispatch<React.SetStateAction<any[]>>,
    minWidth?: number,
    maxWidth?: number,
    mode?: WorkbenchResizeMode,
  ) => void;
  autoFitColumnWidth: (
    event: React.MouseEvent,
    colId: string,
    cols: any[],
    setCols: React.Dispatch<React.SetStateAction<any[]>>,
    minWidth?: number,
    maxWidth?: number,
    mode?: WorkbenchResizeMode,
  ) => void;
  helperConfig: TableBuilderHelpers;
  metricConfig: TableBuilderColumnMetrics;
};

type CreateTableBuilderHelpersParams = {
  buildColumn: TableBuilderHelpers['buildColumn'];
  getDetailBoardTheme: TableBuilderHelpers['getDetailBoardTheme'];
  isRenderableColumn: TableBuilderHelpers['isRenderableColumn'];
  isTreeRelationFieldColumn: TableBuilderHelpers['isTreeRelationFieldColumn'];
  normalizeColumn: TableBuilderHelpers['normalizeColumn'];
  normalizeDetailBoardConfig: TableBuilderHelpers['normalizeDetailBoardConfig'];
};

type CreateTableBuilderMetricsParams = {
  collapsedRenderWidth: number;
  minWidth: number;
  resizeMaxWidth: number;
  resizeMinWidth: number;
};

export function createTableBuilderHelpers({
  buildColumn,
  getDetailBoardTheme,
  isRenderableColumn,
  isTreeRelationFieldColumn,
  normalizeColumn,
  normalizeDetailBoardConfig,
}: CreateTableBuilderHelpersParams): TableBuilderHelpers {
  return {
    buildColumn,
    getDetailBoardTheme,
    isRenderableColumn,
    isTreeRelationFieldColumn,
    normalizeColumn,
    normalizeDetailBoardConfig,
  };
}

export function createTableBuilderMetrics({
  collapsedRenderWidth,
  minWidth,
  resizeMaxWidth,
  resizeMinWidth,
}: CreateTableBuilderMetricsParams): TableBuilderColumnMetrics {
  return {
    collapsedRenderWidth,
    minWidth,
    resizeMaxWidth,
    resizeMinWidth,
  };
}

export function useTableBuilderRenderer({
  activeResize,
  workspaceTheme,
  workspaceThemeVars,
  isCompactModuleSetting,
  businessType,
  activateColumnSelection,
  setBuilderSelectionContextMenu,
  startResize,
  autoFitColumnWidth,
  helperConfig,
  metricConfig,
}: UseTableBuilderRendererParams) {
  return useCallback(({
    scope,
    cols,
    setCols,
    selectedId,
    selectedForDelete,
    setSelectedForDelete,
    options,
  }: TableBuilderRenderParams) => (
    <MemoTableBuilder
      scope={scope}
      cols={cols}
      setCols={setCols}
      selectedId={selectedId}
      selectedForDelete={selectedForDelete}
      setSelectedForDelete={setSelectedForDelete}
      options={options}
      activeResize={activeResize}
      workspaceTheme={workspaceTheme}
      workspaceThemeVars={workspaceThemeVars}
      isCompactModuleSetting={isCompactModuleSetting}
      businessType={businessType}
      activateColumnSelection={activateColumnSelection}
      setBuilderSelectionContextMenu={setBuilderSelectionContextMenu}
      startResize={startResize}
      autoFitColumnWidth={autoFitColumnWidth}
      helpers={helperConfig}
      metrics={metricConfig}
    />
  ), [
    activeResize,
    activateColumnSelection,
    autoFitColumnWidth,
    businessType,
    isCompactModuleSetting,
    setBuilderSelectionContextMenu,
    startResize,
    helperConfig,
    metricConfig,
    workspaceTheme,
    workspaceThemeVars,
  ]);
}
