import React from 'react';

import { ArchiveLayoutDesignerBridge } from './archive-layout-designer-bridge';
import { useArchiveLayoutDesignerSave } from './use-archive-layout-designer-save';
import { useArchiveLayoutPaletteColumns } from './use-archive-layout-palette-columns';

type ArchiveLayoutCanvasModalContainerProps = {
  businessType: string;
  currentDetailBoard: Record<string, any>;
  currentModuleCode: string;
  isOpen: boolean;
  mainTableColumns: Record<string, any>[];
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onShowToast: (message: string) => void;
  onClose: () => void;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
  renderFieldPreview: (column: Record<string, any>, index: number, scope: string) => React.ReactNode;
};

export const ArchiveLayoutCanvasModalContainer = React.memo(function ArchiveLayoutCanvasModalContainer({
  businessType,
  currentDetailBoard,
  currentModuleCode,
  isOpen,
  mainTableColumns,
  normalizeColumn,
  onShowToast,
  onClose,
  onUpdateDetailBoard,
}: ArchiveLayoutCanvasModalContainerProps) {
  const layoutPaletteColumns = useArchiveLayoutPaletteColumns({
    businessType,
    currentModuleCode,
    isOpen,
    mainTableColumns,
    onUpdateDetailBoard,
    onShowToast,
  });
  const {
    isDirty,
    isSaving,
    saveArchiveLayout,
  } = useArchiveLayoutDesignerSave({
    businessType,
    currentDetailBoard,
    currentModuleCode,
    layoutColumns: layoutPaletteColumns,
    onShowToast,
    onUpdateDetailBoard,
  });

  return (
    <ArchiveLayoutDesignerBridge
      currentDetailBoard={currentDetailBoard}
      currentModuleCode={currentModuleCode}
      isDirty={isDirty}
      isOpen={isOpen}
      isSaving={isSaving}
      mainTableColumns={layoutPaletteColumns}
      normalizeColumn={normalizeColumn}
      onClose={onClose}
      onSave={saveArchiveLayout}
      onUpdateDetailBoard={onUpdateDetailBoard}
    />
  );
});
