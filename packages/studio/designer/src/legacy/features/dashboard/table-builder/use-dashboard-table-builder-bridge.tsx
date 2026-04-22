import React from 'react';

import { useDashboardTableBuilderNodes, type TableBuilderNodeInput } from './use-dashboard-table-builder-nodes';
import {
  useDashboardTableBuilderOptions,
  type UseDashboardTableBuilderOptionsParams,
} from './use-dashboard-table-builder-options';
import type { TableBuilderRenderParams } from './use-table-builder-renderer';

type UseDashboardTableBuilderBridgeParams = {
  renderTableBuilder: (params: TableBuilderRenderParams) => React.ReactNode;
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

export function useDashboardTableBuilderBridge({
  renderTableBuilder,
  options,
  nodes,
}: UseDashboardTableBuilderBridgeParams) {
  const {
    activeDetailTableColumns,
    setActiveDetailTableColumns,
    archiveMainTableBuilderOptions,
    documentTreeTableBuilderOptions,
    builderMainTableBuilderOptions,
    documentDetailTableBuilderOptions,
    billDetailTableBuilderOptions,
  } = useDashboardTableBuilderOptions(options);

  return useDashboardTableBuilderNodes({
    renderTableBuilder,
    archiveMain: {
      ...nodes.archiveMain,
      options: archiveMainTableBuilderOptions,
    },
    documentTree: {
      ...nodes.documentTree,
      options: documentTreeTableBuilderOptions,
    },
    builderLeft: nodes.builderLeft,
    builderMain: {
      ...nodes.builderMain,
      options: builderMainTableBuilderOptions,
    },
    documentDetail: {
      ...nodes.documentDetail,
      cols: activeDetailTableColumns,
      setCols: setActiveDetailTableColumns,
      options: documentDetailTableBuilderOptions,
    },
    builderDetail: {
      ...nodes.builderDetail,
      cols: activeDetailTableColumns,
      setCols: setActiveDetailTableColumns,
      options: {
        ...documentDetailTableBuilderOptions,
        ...(nodes.builderDetail.options ?? {}),
        hostSurface: 'embedded',
      },
    },
    billDetail: {
      ...nodes.billDetail,
      options: billDetailTableBuilderOptions,
    },
  });
}
