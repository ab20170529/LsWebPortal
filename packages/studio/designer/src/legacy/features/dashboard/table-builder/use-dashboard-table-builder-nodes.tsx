import React, { useMemo } from 'react';

import type { TableBuilderRenderParams } from './use-table-builder-renderer';

export type TableBuilderNodeInput = Omit<TableBuilderRenderParams, 'scope'>;

export type UseDashboardTableBuilderNodesParams = {
  renderTableBuilder: (params: TableBuilderRenderParams) => React.ReactNode;
  archiveMain: TableBuilderNodeInput;
  documentTree: TableBuilderNodeInput;
  builderLeft: TableBuilderNodeInput;
  builderMain: TableBuilderNodeInput;
  documentDetail: TableBuilderNodeInput;
  builderDetail: TableBuilderNodeInput;
  billDetail: TableBuilderNodeInput;
};

function useTableBuilderNode(
  renderTableBuilder: (params: TableBuilderRenderParams) => React.ReactNode,
  scope: TableBuilderRenderParams['scope'],
  input: TableBuilderNodeInput,
) {
  const {
    cols,
    setCols,
    selectedId,
    selectedForDelete,
    setSelectedForDelete,
    options,
  } = input;

  return useMemo(() => renderTableBuilder({
    scope,
    cols,
    setCols,
    selectedId,
    selectedForDelete,
    setSelectedForDelete,
    options,
  }), [
    cols,
    options,
    renderTableBuilder,
    scope,
    selectedForDelete,
    selectedId,
    setCols,
    setSelectedForDelete,
  ]);
}

export function useDashboardTableBuilderNodes({
  renderTableBuilder,
  archiveMain,
  documentTree,
  builderLeft,
  builderMain,
  documentDetail,
  builderDetail,
  billDetail,
}: UseDashboardTableBuilderNodesParams) {
  const archiveMainTableBuilderNode = useTableBuilderNode(renderTableBuilder, 'main', archiveMain);
  const documentTreeTableBuilderNode = useTableBuilderNode(renderTableBuilder, 'left', documentTree);
  const builderLeftTableBuilderNode = useTableBuilderNode(renderTableBuilder, 'left', builderLeft);
  const builderMainTableBuilderNode = useTableBuilderNode(renderTableBuilder, 'main', builderMain);
  const documentDetailTableBuilderNode = useTableBuilderNode(renderTableBuilder, 'detail', documentDetail);
  const builderDetailTableBuilderNode = useTableBuilderNode(renderTableBuilder, 'detail', builderDetail);
  const billDetailTableBuilderNode = useTableBuilderNode(renderTableBuilder, 'detail', billDetail);

  return {
    archiveMainTableBuilderNode,
    documentTreeTableBuilderNode,
    builderLeftTableBuilderNode,
    builderMainTableBuilderNode,
    documentDetailTableBuilderNode,
    builderDetailTableBuilderNode,
    billDetailTableBuilderNode,
  };
}
