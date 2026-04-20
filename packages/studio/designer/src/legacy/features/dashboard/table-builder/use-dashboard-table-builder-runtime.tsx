import React, { useMemo } from 'react';

import { useDashboardTableBuilderBridge } from './use-dashboard-table-builder-bridge';
import {
  createTableBuilderHelpers,
  createTableBuilderMetrics,
  useTableBuilderRenderer,
} from './use-table-builder-renderer';
import type { UseDashboardTableBuilderOptionsParams } from './use-dashboard-table-builder-options';
import type { TableBuilderNodeInput } from './use-dashboard-table-builder-nodes';

type UseDashboardTableBuilderRuntimeParams = {
  runtime: {
    activeResize: any;
    workspaceTheme: string;
    workspaceThemeVars: React.CSSProperties;
    isCompactModuleSetting: boolean;
    businessType: 'document' | 'table' | 'tree';
    activateColumnSelection: (scope: 'left' | 'main' | 'detail', columnId: string | null) => void;
    setBuilderSelectionContextMenu: React.Dispatch<React.SetStateAction<any>>;
    startResize: (...args: any[]) => void;
    autoFitColumnWidth: (...args: any[]) => void;
  };
  helpers: {
    buildColumn: (prefix: string, index: number, overrides?: Record<string, any>) => any;
    getDetailBoardTheme: (theme?: string) => any;
    isRenderableMainColumn: (column: any) => boolean;
    isTreeRelationFieldColumn: (column: Record<string, unknown> | null | undefined) => boolean;
    normalizeColumn: (column: any) => any;
    normalizeDetailBoardConfig: (config: any, columns?: any[]) => any;
  };
  metrics: {
    collapsedRenderWidth: number;
    minWidth: number;
    resizeMaxWidth: number;
    resizeMinWidth: number;
  };
  bridge: {
    options: UseDashboardTableBuilderOptionsParams;
    nodes: {
      archiveMain: Omit<TableBuilderNodeInput, 'options'>;
      documentTree: Omit<TableBuilderNodeInput, 'options'>;
      builderLeft: TableBuilderNodeInput;
      builderMain: Omit<TableBuilderNodeInput, 'options'>;
      documentDetail: Omit<TableBuilderNodeInput, 'cols' | 'setCols' | 'options'>;
      builderDetail: Omit<TableBuilderNodeInput, 'cols' | 'setCols'>;
      billDetail: Omit<TableBuilderNodeInput, 'options'>;
    };
  };
};

export function useDashboardTableBuilderRuntime({
  runtime,
  helpers,
  metrics,
  bridge,
}: UseDashboardTableBuilderRuntimeParams) {
  const tableBuilderHelpers = useMemo(() => createTableBuilderHelpers({
    buildColumn: helpers.buildColumn,
    getDetailBoardTheme: helpers.getDetailBoardTheme,
    isRenderableColumn: helpers.isRenderableMainColumn,
    isTreeRelationFieldColumn: helpers.isTreeRelationFieldColumn,
    normalizeColumn: helpers.normalizeColumn,
    normalizeDetailBoardConfig: helpers.normalizeDetailBoardConfig,
  }), [
    helpers.buildColumn,
    helpers.getDetailBoardTheme,
    helpers.isRenderableMainColumn,
    helpers.isTreeRelationFieldColumn,
    helpers.normalizeColumn,
    helpers.normalizeDetailBoardConfig,
  ]);

  const tableBuilderColumnMetrics = useMemo(() => createTableBuilderMetrics({
    collapsedRenderWidth: metrics.collapsedRenderWidth,
    minWidth: metrics.minWidth,
    resizeMaxWidth: metrics.resizeMaxWidth,
    resizeMinWidth: metrics.resizeMinWidth,
  }), [
    metrics.collapsedRenderWidth,
    metrics.minWidth,
    metrics.resizeMaxWidth,
    metrics.resizeMinWidth,
  ]);

  const renderTableBuilder = useTableBuilderRenderer({
    activeResize: runtime.activeResize,
    workspaceTheme: runtime.workspaceTheme,
    workspaceThemeVars: runtime.workspaceThemeVars,
    isCompactModuleSetting: runtime.isCompactModuleSetting,
    businessType: runtime.businessType,
    activateColumnSelection: runtime.activateColumnSelection,
    setBuilderSelectionContextMenu: runtime.setBuilderSelectionContextMenu,
    startResize: runtime.startResize,
    autoFitColumnWidth: runtime.autoFitColumnWidth,
    helperConfig: tableBuilderHelpers,
    metricConfig: tableBuilderColumnMetrics,
  });

  return useDashboardTableBuilderBridge({
    ...bridge,
    renderTableBuilder,
  });
}
