import { useCallback, useEffect, useMemo, useState, type ClipboardEvent } from 'react';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
  buildDetailBoardGroup,
  createSuggestedDetailBoardGroups,
  DETAIL_BOARD_GROUP_MAX_ROWS,
  DETAIL_BOARD_GROUP_MIN_ROWS,
  getDetailBoardGroupColumnRow,
  getDetailBoardGroupRows,
} from './detail-board-config';

type DetailBoardWorkbenchDragData =
  | {
    type: 'detail-board-item';
    fieldId: string;
    groupId: string;
    row: number;
  }
  | {
    type: 'detail-board-row';
    groupId: string;
    row: number;
  };

type UseDetailBoardLayoutManagerOptions = {
  availableGridColumns: Record<string, any>[];
  currentDetailBoard: Record<string, any>;
  selectedDetailBoardGroupId: string | null;
  setSelectedDetailBoardGroupId: (groupId: string | null) => void;
  onResetMainSelection: () => void;
  onShowToast: (message: string) => void;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
  parseDetailBoardClipboardColumnIds: (text: string, availableColumns: Record<string, any>[]) => string[];
};

function isDetailBoardWorkbenchDragData(value: unknown): value is DetailBoardWorkbenchDragData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'type' in value && 'groupId' in value && 'row' in value;
}

export function useDetailBoardLayoutManager({
  availableGridColumns,
  currentDetailBoard,
  selectedDetailBoardGroupId,
  setSelectedDetailBoardGroupId,
  onResetMainSelection,
  onShowToast,
  onUpdateDetailBoard,
  parseDetailBoardClipboardColumnIds,
}: UseDetailBoardLayoutManagerOptions) {
  const [detailBoardWorkbenchDrag, setDetailBoardWorkbenchDrag] = useState<{
    groupId: string;
    columnId: string;
  } | null>(null);
  const [detailBoardWorkbenchDropTarget, setDetailBoardWorkbenchDropTarget] = useState<{
    groupId: string;
    row: number;
    beforeId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!currentDetailBoard.groups.some((group: any) => group.id === selectedDetailBoardGroupId)) {
      setSelectedDetailBoardGroupId(currentDetailBoard.groups[0]?.id ?? null);
    }
  }, [currentDetailBoard.groups, selectedDetailBoardGroupId, setSelectedDetailBoardGroupId]);

  const detailBoardReady = currentDetailBoard.groups.length > 0;

  const selectedDetailGroup = useMemo(
    () => currentDetailBoard.groups.find((group: any) => group.id === selectedDetailBoardGroupId) ?? currentDetailBoard.groups[0] ?? null,
    [currentDetailBoard.groups, selectedDetailBoardGroupId],
  );

  const selectedDetailGroupRows = selectedDetailGroup
    ? getDetailBoardGroupRows(selectedDetailGroup)
    : DETAIL_BOARD_GROUP_MIN_ROWS;

  const selectedDetailGroupRowNumbers = useMemo(
    () => Array.from({ length: selectedDetailGroupRows }, (_, index) => index + 1),
    [selectedDetailGroupRows],
  );

  const availableUnassignedDetailColumns = useMemo(() => {
    const assignedDetailGroupFieldIds = new Set(
      currentDetailBoard.groups.flatMap((group: any) => group.columnIds ?? []),
    );
    return availableGridColumns.filter((column: any) => !assignedDetailGroupFieldIds.has(column.id));
  }, [availableGridColumns, currentDetailBoard.groups]);

  const updateDetailGroup = useCallback((groupId: string, updater: Record<string, any> | ((group: any) => any)) => {
    onUpdateDetailBoard((current: any) => ({
      ...current,
      groups: current.groups.map((group: any) => (
        group.id === groupId
          ? typeof updater === 'function'
            ? updater(group)
            : { ...group, ...updater }
          : group
      )),
    }));
  }, [onUpdateDetailBoard]);

  const addDetailGroup = useCallback(() => {
    const nextGroup = buildDetailBoardGroup(currentDetailBoard.groups.length + 1);
    onUpdateDetailBoard((current: any) => ({
      ...current,
      groups: [...current.groups, nextGroup],
    }));
    setSelectedDetailBoardGroupId(nextGroup.id);
  }, [currentDetailBoard.groups.length, onUpdateDetailBoard, setSelectedDetailBoardGroupId]);

  const applySuggestedDetailLayout = useCallback(() => {
    const suggestedGroups = createSuggestedDetailBoardGroups(availableGridColumns);
    onUpdateDetailBoard({
      ...currentDetailBoard,
      groups: suggestedGroups,
      sortColumnId: availableGridColumns[0]?.id ?? null,
    });
    setSelectedDetailBoardGroupId(suggestedGroups[0]?.id ?? null);
    onShowToast('已应用推荐详情分组布局');
  }, [
    availableGridColumns,
    currentDetailBoard,
    onShowToast,
    onUpdateDetailBoard,
    setSelectedDetailBoardGroupId,
  ]);

  const mergeDetailGroupColumns = useCallback((groupId: string, columnIds: string[]) => {
    const occupiedIds = new Set(
      currentDetailBoard.groups
        .filter((group: any) => group.id !== groupId)
        .flatMap((group: any) => group.columnIds ?? []),
    );
    const validIds = Array.from(new Set(columnIds.filter((columnId) => (
      availableGridColumns.some((column) => column.id === columnId)
      && !occupiedIds.has(columnId)
    ))));
    if (validIds.length === 0) {
      onShowToast('剪贴板里没有可加入当前分组的主表字段');
      return;
    }

    onResetMainSelection();
    const currentGroup = currentDetailBoard.groups.find((group: any) => group.id === groupId);
    const nextIds = Array.from(new Set([...(currentGroup?.columnIds ?? []), ...validIds]));
    const addedCount = nextIds.length - (currentGroup?.columnIds?.length ?? 0);
    if (addedCount <= 0) {
      onShowToast('这些字段已经都在当前分组里了');
      return;
    }

    updateDetailGroup(groupId, (group: any) => ({
      ...group,
      columnIds: nextIds,
      columnRows: {
        ...(group.columnRows ?? {}),
        ...Object.fromEntries(validIds.map((columnId) => [columnId, getDetailBoardGroupRows(group)])),
      },
    }));
    onShowToast(`已加入 ${addedCount} 个字段`);
  }, [
    availableGridColumns,
    currentDetailBoard.groups,
    onResetMainSelection,
    onShowToast,
    updateDetailGroup,
  ]);

  const removeDetailGroupColumn = useCallback((groupId: string, columnId: string) => {
    updateDetailGroup(groupId, (group: any) => ({
      ...group,
      columnIds: group.columnIds.filter((id: string) => id !== columnId),
      columnRows: Object.fromEntries(
        Object.entries(group.columnRows ?? {}).filter(([key]) => key !== columnId),
      ),
      columnWidths: Object.fromEntries(
        Object.entries(group.columnWidths ?? {}).filter(([key]) => key !== columnId),
      ),
    }));
  }, [updateDetailGroup]);

  const handleDetailGroupPaste = useCallback((event: ClipboardEvent<HTMLDivElement>, groupId: string) => {
    const text = event.clipboardData.getData('text/plain') || event.clipboardData.getData('text');
    const nextColumnIds = parseDetailBoardClipboardColumnIds(text, availableGridColumns);
    if (nextColumnIds.length === 0) {
      onShowToast('剪贴板里没有匹配到主表字段');
      return;
    }
    event.preventDefault();
    mergeDetailGroupColumns(groupId, nextColumnIds);
  }, [availableGridColumns, mergeDetailGroupColumns, onShowToast, parseDetailBoardClipboardColumnIds]);

  const clearDetailGroups = useCallback(() => {
    onUpdateDetailBoard({
      ...currentDetailBoard,
      groups: [],
    });
    setSelectedDetailBoardGroupId(null);
  }, [currentDetailBoard, onUpdateDetailBoard, setSelectedDetailBoardGroupId]);

  const deleteSelectedDetailGroup = useCallback(() => {
    if (!selectedDetailGroup) return;
    const remainingGroups = currentDetailBoard.groups.filter((group: any) => group.id !== selectedDetailGroup.id);
    onUpdateDetailBoard({
      ...currentDetailBoard,
      groups: remainingGroups,
    });
    setSelectedDetailBoardGroupId(remainingGroups[0]?.id ?? null);
  }, [currentDetailBoard, onUpdateDetailBoard, selectedDetailGroup, setSelectedDetailBoardGroupId]);

  const updateSelectedDetailGroupName = useCallback((name: string) => {
    if (!selectedDetailGroup) return;
    updateDetailGroup(selectedDetailGroup.id, { name });
  }, [selectedDetailGroup, updateDetailGroup]);

  const updateSelectedDetailGroupRows = useCallback((rows: number) => {
    if (!selectedDetailGroup) return;
    const nextRows = Math.min(DETAIL_BOARD_GROUP_MAX_ROWS, Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, rows));
    updateDetailGroup(selectedDetailGroup.id, (group: any) => ({
      ...group,
      rows: nextRows,
      columnRows: Object.fromEntries(
        (group.columnIds ?? []).map((columnId: string) => [
          columnId,
          Math.min(nextRows, Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, getDetailBoardGroupColumnRow(group, columnId))),
        ]),
      ),
    }));
  }, [
    selectedDetailGroup,
    updateDetailGroup,
  ]);

  const moveDetailGroupColumn = useCallback((groupId: string, columnId: string, rowNumber: number, beforeId: string | null = null) => {
    updateDetailGroup(groupId, (group: any) => {
      const rows = getDetailBoardGroupRows(group);
      const nextRow = Math.min(rows, Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, rowNumber));
      const currentColumnIds = Array.isArray(group.columnIds) ? group.columnIds : [];
      const sourceIndex = currentColumnIds.indexOf(columnId);
      if (sourceIndex === -1) return group;
      if (beforeId && beforeId === columnId) return group;

      const remaining = currentColumnIds.filter((id: string) => id !== columnId);
      let insertIndex = beforeId ? remaining.indexOf(beforeId) : -1;
      if (insertIndex === -1) {
        insertIndex = remaining.findIndex((id: string) => getDetailBoardGroupColumnRow(group, id) > nextRow);
        if (insertIndex === -1) {
          insertIndex = remaining.length;
        }
      }

      return {
        ...group,
        columnIds: [
          ...remaining.slice(0, insertIndex),
          columnId,
          ...remaining.slice(insertIndex),
        ],
        columnRows: {
          ...(group.columnRows ?? {}),
          [columnId]: nextRow,
        },
      };
    });
  }, [updateDetailGroup]);

  const clearDetailBoardWorkbenchDragState = useCallback(() => {
    setDetailBoardWorkbenchDrag(null);
    setDetailBoardWorkbenchDropTarget(null);
  }, []);

  const handleDetailGroupWorkbenchDragStart = useCallback((event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (!isDetailBoardWorkbenchDragData(activeData) || activeData.type !== 'detail-board-item') {
      return;
    }

    setDetailBoardWorkbenchDrag({ groupId: activeData.groupId, columnId: activeData.fieldId });
    setDetailBoardWorkbenchDropTarget(null);
  }, []);

  const handleDetailGroupWorkbenchDragOver = useCallback((event: DragOverEvent) => {
    const activeData = event.active.data.current;
    const overData = event.over?.data.current;
    if (!isDetailBoardWorkbenchDragData(activeData) || activeData.type !== 'detail-board-item') {
      return;
    }

    if (!selectedDetailGroup || activeData.groupId !== selectedDetailGroup.id || !isDetailBoardWorkbenchDragData(overData) || overData.groupId !== selectedDetailGroup.id) {
      setDetailBoardWorkbenchDropTarget(null);
      return;
    }

    if (overData.type === 'detail-board-item') {
      if (overData.fieldId === activeData.fieldId) {
        setDetailBoardWorkbenchDropTarget(null);
        return;
      }

      setDetailBoardWorkbenchDropTarget({
        groupId: selectedDetailGroup.id,
        row: overData.row,
        beforeId: overData.fieldId,
      });
      return;
    }

    setDetailBoardWorkbenchDropTarget({
      groupId: selectedDetailGroup.id,
      row: overData.row,
      beforeId: null,
    });
  }, [selectedDetailGroup]);

  const handleDetailGroupWorkbenchDragEnd = useCallback((event: DragEndEvent) => {
    const activeData = event.active.data.current;
    const overData = event.over?.data.current;
    if (!isDetailBoardWorkbenchDragData(activeData) || activeData.type !== 'detail-board-item') {
      clearDetailBoardWorkbenchDragState();
      return;
    }

    if (!selectedDetailGroup || activeData.groupId !== selectedDetailGroup.id || !isDetailBoardWorkbenchDragData(overData) || overData.groupId !== selectedDetailGroup.id) {
      clearDetailBoardWorkbenchDragState();
      return;
    }

    if (overData.type === 'detail-board-item') {
      if (overData.fieldId !== activeData.fieldId) {
        moveDetailGroupColumn(selectedDetailGroup.id, activeData.fieldId, overData.row, overData.fieldId);
      }
      clearDetailBoardWorkbenchDragState();
      return;
    }

    moveDetailGroupColumn(selectedDetailGroup.id, activeData.fieldId, overData.row);
    clearDetailBoardWorkbenchDragState();
  }, [clearDetailBoardWorkbenchDragState, moveDetailGroupColumn, selectedDetailGroup]);

  return {
    addDetailGroup,
    applySuggestedDetailLayout,
    availableUnassignedDetailColumns,
    clearDetailBoardWorkbenchDragState,
    clearDetailGroups,
    deleteSelectedDetailGroup,
    detailBoardReady,
    detailBoardWorkbenchDrag,
    detailBoardWorkbenchDropTarget,
    handleDetailGroupPaste,
    handleDetailGroupWorkbenchDragEnd,
    handleDetailGroupWorkbenchDragOver,
    handleDetailGroupWorkbenchDragStart,
    mergeDetailGroupColumns,
    removeDetailGroupColumn,
    selectedDetailGroup,
    selectedDetailGroupRowNumbers,
    selectedDetailGroupRows,
    updateSelectedDetailGroupName,
    updateSelectedDetailGroupRows,
  };
}
