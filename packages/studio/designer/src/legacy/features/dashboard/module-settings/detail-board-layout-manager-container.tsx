import React, { useState } from 'react';

import { ArchiveLayoutSummarySection } from './archive-layout-summary-section';
import { DetailBoardLayoutModalBridge } from './detail-board-layout-modal-bridge';

type DetailBoardLayoutManagerContainerProps = {
  DesignerWorkbenchDraggableItem: React.ComponentType<any>;
  DesignerWorkbenchDropLane: React.ComponentType<any>;
  activeDetailBoardResize: {
    groupId: string;
    label: string;
    width: number;
  } | null;
  availableGridColumns: Record<string, any>[];
  compactCardClass: string;
  currentDetailBoard: Record<string, any>;
  designerWorkbenchSensors: any;
  detailBoardClipboardIds: string[];
  detailBoardFieldDefaultWidth: number;
  detailBoardTheme: {
    groupLabel: string;
    groupShell: string;
  };
  emptyFieldsNode: React.ReactNode;
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  selectedDetailBoardGroupId: string | null;
  setSelectedDetailBoardGroupId: (groupId: string | null) => void;
  onOpenDetailBoardPreview: (previewRows?: number, sortColumnId?: string | null) => void;
  onResetDetailBoardFieldWidth: (event: React.MouseEvent<HTMLDivElement>, groupId: string, columnId: string) => void;
  onResetMainSelection: () => void;
  onShowToast: (message: string) => void;
  onStartDetailBoardFieldResize: (event: React.MouseEvent<HTMLDivElement>, groupId: string, columnId: string, label: string) => void;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
  parseDetailBoardClipboardColumnIds: (text: string, availableColumns: Record<string, any>[]) => string[];
  renderFieldPreview: (column: Record<string, any>, index: number, scope: string) => React.ReactNode;
  sectionTitleClass: string;
};

export const DetailBoardLayoutManagerContainer = React.memo(function DetailBoardLayoutManagerContainer({
  availableGridColumns,
  compactCardClass,
  currentDetailBoard,
  emptyFieldsNode,
  normalizeColumn,
  selectedDetailBoardGroupId,
  setSelectedDetailBoardGroupId,
  onOpenDetailBoardPreview,
  onUpdateDetailBoard,
  sectionTitleClass,
}: DetailBoardLayoutManagerContainerProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  if (availableGridColumns.length === 0) {
    return <>{emptyFieldsNode}</>;
  }

  return (
    <>
      <ArchiveLayoutSummarySection
        availableGridColumnCount={availableGridColumns.length}
        compactCardClass={compactCardClass}
        emptyStateText="还没有明细分组"
        groupSummaryTitle="明细分组"
        groups={Array.isArray(currentDetailBoard?.groups) ? currentDetailBoard.groups : []}
        onOpenEditor={() => setIsEditorOpen(true)}
        onOpenPreview={() => onOpenDetailBoardPreview(1, currentDetailBoard.sortColumnId)}
        onSelectGroup={setSelectedDetailBoardGroupId}
        sectionTitleClass={sectionTitleClass}
        selectedGroupId={selectedDetailBoardGroupId}
        title="明细表格布局"
      />

      <DetailBoardLayoutModalBridge
        availableGridColumns={availableGridColumns}
        currentDetailBoard={currentDetailBoard}
        isOpen={isEditorOpen}
        normalizeColumn={normalizeColumn}
        onClose={() => setIsEditorOpen(false)}
        onOpenPreview={() => onOpenDetailBoardPreview(1, currentDetailBoard.sortColumnId)}
        onUpdateDetailBoard={onUpdateDetailBoard}
        selectedGroupId={selectedDetailBoardGroupId}
        setSelectedGroupId={setSelectedDetailBoardGroupId}
        title="明细表格布局"
      />
    </>
  );
});
