import React from 'react';

import { LegacyDefinitionLayoutWorkbench } from './legacy-definition-layout-workbench';

type DetailBoardLayoutDesignerBridgeProps = {
  availableGridColumns: Record<string, any>[];
  currentDetailBoard: Record<string, any>;
  emptyFieldsNode: React.ReactNode;
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onOpenDetailBoardPreview: (previewRows?: number, sortColumnId?: string | null) => void;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
  selectedDetailBoardGroupId: string | null;
  setSelectedDetailBoardGroupId: (groupId: string | null) => void;
};

export const DetailBoardLayoutDesignerBridge = React.memo(function DetailBoardLayoutDesignerBridge({
  availableGridColumns,
  currentDetailBoard,
  emptyFieldsNode,
  normalizeColumn,
  onOpenDetailBoardPreview,
  onUpdateDetailBoard,
  selectedDetailBoardGroupId,
  setSelectedDetailBoardGroupId,
}: DetailBoardLayoutDesignerBridgeProps) {
  if (availableGridColumns.length === 0) {
    return <>{emptyFieldsNode}</>;
  }

  return (
    <LegacyDefinitionLayoutWorkbench
      availableColumns={availableGridColumns}
      currentDetailBoard={currentDetailBoard}
      normalizeColumn={normalizeColumn}
      onOpenPreview={() => onOpenDetailBoardPreview(1, currentDetailBoard.sortColumnId)}
      onUpdateDetailBoard={onUpdateDetailBoard}
      selectedGroupId={selectedDetailBoardGroupId}
      setSelectedGroupId={setSelectedDetailBoardGroupId}
      title="明细表格布局"
    />
  );
});
