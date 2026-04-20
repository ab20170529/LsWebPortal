import { type Dispatch, type SetStateAction, useCallback } from 'react';

import { normalizeDetailBoardConfig } from './detail-board-config';

type DetailBoardPatch = Record<string, any> | ((current: any) => any);

export function useDashboardWorkbenchActions({
  hiddenColumnRestoreWidth,
  mainTableColumns,
  mainTableHiddenColumns,
  normalizeColumn,
  selectedMainColId,
  selectedMainHiddenColumnIds,
  setDetailBoardOpenedRowId,
  setDetailBoardSortColumnId,
  setDocumentConditionScope,
  setIsArchiveLayoutEditorOpen,
  setIsDetailBoardOpen,
  setIsDocumentConditionWorkbenchOpen,
  setIsMainHiddenColumnsModalOpen,
  setMainHiddenColumnsSearchText,
  setMainTableColumns,
  setMainTableConfig,
  setSelectedMainHiddenColumnIds,
}: {
  hiddenColumnRestoreWidth: number;
  mainTableColumns: any[];
  mainTableHiddenColumns: any[];
  normalizeColumn: (column: any) => any;
  selectedMainColId: string | null;
  selectedMainHiddenColumnIds: string[];
  setDetailBoardOpenedRowId: Dispatch<SetStateAction<number | null>>;
  setDetailBoardSortColumnId: Dispatch<SetStateAction<string | null>>;
  setDocumentConditionScope: Dispatch<SetStateAction<'left' | 'main'>>;
  setIsArchiveLayoutEditorOpen: Dispatch<SetStateAction<boolean>>;
  setIsDetailBoardOpen: Dispatch<SetStateAction<boolean>>;
  setIsDocumentConditionWorkbenchOpen: Dispatch<SetStateAction<boolean>>;
  setIsMainHiddenColumnsModalOpen: Dispatch<SetStateAction<boolean>>;
  setMainHiddenColumnsSearchText: Dispatch<SetStateAction<string>>;
  setMainTableColumns: Dispatch<SetStateAction<any[]>>;
  setMainTableConfig: Dispatch<SetStateAction<any>>;
  setSelectedMainHiddenColumnIds: Dispatch<SetStateAction<string[]>>;
}) {
  const openDetailBoardPreview = useCallback((rowId: number, preferredSortColumnId?: string | null) => {
    setDetailBoardSortColumnId(preferredSortColumnId ?? selectedMainColId ?? mainTableColumns[0]?.id ?? null);
    setDetailBoardOpenedRowId(rowId);
    setIsDetailBoardOpen(true);
  }, [
    mainTableColumns,
    selectedMainColId,
    setDetailBoardOpenedRowId,
    setDetailBoardSortColumnId,
    setIsDetailBoardOpen,
  ]);

  const updateMainDetailBoard = useCallback((patch: DetailBoardPatch) => {
    setMainTableConfig((prev) => {
      const current = normalizeDetailBoardConfig(prev.detailBoard, mainTableColumns);
      return {
        ...prev,
        detailBoard: typeof patch === 'function'
          ? patch(current)
          : {
              ...current,
              ...patch,
            },
      };
    });
  }, [mainTableColumns, setMainTableConfig]);

  const openArchiveLayoutEditor = useCallback(() => {
    setIsArchiveLayoutEditorOpen(true);
  }, [setIsArchiveLayoutEditorOpen]);

  const openDocumentConditionWorkbench = useCallback((scope: 'left' | 'main' = 'main') => {
    setDocumentConditionScope((prev) => (prev === scope ? prev : scope));
    setIsDocumentConditionWorkbenchOpen(true);
  }, [
    setDocumentConditionScope,
    setIsDocumentConditionWorkbenchOpen,
  ]);

  const openMainHiddenColumnsModal = useCallback(() => {
    if (mainTableHiddenColumns.length === 0) return;
    setSelectedMainHiddenColumnIds([]);
    setMainHiddenColumnsSearchText('');
    setIsMainHiddenColumnsModalOpen(true);
  }, [
    mainTableHiddenColumns.length,
    setIsMainHiddenColumnsModalOpen,
    setMainHiddenColumnsSearchText,
    setSelectedMainHiddenColumnIds,
  ]);

  const closeMainHiddenColumnsModal = useCallback(() => {
    setMainHiddenColumnsSearchText('');
    setIsMainHiddenColumnsModalOpen(false);
  }, [
    setIsMainHiddenColumnsModalOpen,
    setMainHiddenColumnsSearchText,
  ]);

  const toggleMainHiddenColumnSelection = useCallback((columnId: string) => {
    setSelectedMainHiddenColumnIds((prev) => (
      prev.includes(columnId)
        ? prev.filter((item) => item !== columnId)
        : [...prev, columnId]
    ));
  }, [setSelectedMainHiddenColumnIds]);

  const restoreMainHiddenColumns = useCallback((columnIds?: string[]) => {
    const targetIds = new Set(
      (columnIds?.length ? columnIds : selectedMainHiddenColumnIds).filter(Boolean),
    );
    if (targetIds.size === 0) {
      setIsMainHiddenColumnsModalOpen(false);
      return;
    }

    setMainTableColumns((prev) => prev.map((column) => {
      if (!targetIds.has(column.id)) return column;
      const normalizedColumn = normalizeColumn(column);
      const restoredWidth = Number(normalizedColumn.width) > 0
        ? Number(normalizedColumn.width)
        : hiddenColumnRestoreWidth;

      return {
        ...normalizedColumn,
        visible: true,
        width: restoredWidth,
      };
    }));
    setSelectedMainHiddenColumnIds([]);
    setMainHiddenColumnsSearchText('');
    setIsMainHiddenColumnsModalOpen(false);
  }, [
    hiddenColumnRestoreWidth,
    normalizeColumn,
    selectedMainHiddenColumnIds,
    setIsMainHiddenColumnsModalOpen,
    setMainHiddenColumnsSearchText,
    setMainTableColumns,
    setSelectedMainHiddenColumnIds,
  ]);

  return {
    closeMainHiddenColumnsModal,
    openArchiveLayoutEditor,
    openDetailBoardPreview,
    openDocumentConditionWorkbench,
    openMainHiddenColumnsModal,
    restoreMainHiddenColumns,
    toggleMainHiddenColumnSelection,
    updateMainDetailBoard,
  };
}
