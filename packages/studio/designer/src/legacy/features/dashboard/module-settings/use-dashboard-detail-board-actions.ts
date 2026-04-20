import { type Dispatch, type MouseEvent, type SetStateAction, useCallback } from 'react';

import {
  buildResizeSnapCandidates,
  resolveResizeWidthWithSnap,
} from './dashboard-resize-snap-utils';

type ActiveDetailBoardResize = {
  groupId: string;
  columnId: string;
  label: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  snapCandidates: number[];
};

type ActiveDetailBoardHeightResize = {
  groupId: string;
  columnId: string;
  label: string;
  height: number;
  minHeight: number;
  maxHeight: number;
};

export function useDashboardDetailBoardActions({
  activeDetailBoardHeightResize,
  activeDetailBoardResize,
  defaultFieldHeight,
  defaultFieldWidth,
  getLayoutFieldWorkbenchMeta,
  mainTableColumns,
  maxFieldHeight,
  maxFieldWidth,
  minFieldHeight,
  minFieldWidth,
  normalizedMainDetailBoardConfig,
  setActiveDetailBoardHeightResize,
  setActiveDetailBoardResize,
  updateMainDetailBoard,
}: {
  activeDetailBoardHeightResize: ActiveDetailBoardHeightResize | null;
  activeDetailBoardResize: ActiveDetailBoardResize | null;
  defaultFieldHeight: number;
  defaultFieldWidth: number;
  getLayoutFieldWorkbenchMeta: (column: any, width?: number) => { width: number; height: number };
  mainTableColumns: any[];
  maxFieldHeight: number;
  maxFieldWidth: number;
  minFieldHeight: number;
  minFieldWidth: number;
  normalizedMainDetailBoardConfig: any;
  setActiveDetailBoardHeightResize: Dispatch<SetStateAction<ActiveDetailBoardHeightResize | null>>;
  setActiveDetailBoardResize: Dispatch<SetStateAction<ActiveDetailBoardResize | null>>;
  updateMainDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
}) {
  const startDetailBoardFieldResize = useCallback((
    event: MouseEvent<HTMLButtonElement>,
    groupId: string,
    columnId: string,
    label: string,
    minWidthOverride?: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.pageX;
    const previewItem = event.currentTarget.closest('[data-detail-field-item="true"]') as HTMLElement | null;
    const startWidth = previewItem?.getBoundingClientRect().width ?? defaultFieldWidth;
    const minWidth = Math.max(minFieldWidth, Number(minWidthOverride) || minFieldWidth);
    const maxWidth = maxFieldWidth;
    const currentGroup = normalizedMainDetailBoardConfig.groups.find((group: any) => group.id === groupId);
    const siblingWidths = (currentGroup?.columnIds ?? [])
      .filter((id: string) => id !== columnId)
      .map((id: string) => {
        const siblingColumn = mainTableColumns.find((column: any) => column.id === id);
        return getLayoutFieldWorkbenchMeta(siblingColumn, currentGroup?.columnWidths?.[id]).width;
      });
    const snapCandidates = buildResizeSnapCandidates(siblingWidths, {
      minWidth,
      maxWidth,
      baseWidth: defaultFieldWidth,
    });
    let latestWidth = startWidth;
    let previewFrame: number | null = null;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    setActiveDetailBoardResize({
      groupId,
      columnId,
      label,
      width: startWidth,
      minWidth,
      maxWidth,
      snapCandidates,
    });

    const commitWidth = (nextWidth: number) => {
      updateMainDetailBoard((current: any) => ({
        ...current,
        groups: current.groups.map((group: any) => (
          group.id === groupId
            ? {
                ...group,
                columnWidths: {
                  ...group.columnWidths,
                  [columnId]: nextWidth,
                },
              }
            : group
        )),
      }));
    };

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const { width } = resolveResizeWidthWithSnap(startWidth + (moveEvent.pageX - startX), {
        minWidth,
        maxWidth,
        snapCandidates,
      });
      latestWidth = width;

      if (previewFrame !== null) return;
      previewFrame = window.requestAnimationFrame(() => {
        previewFrame = null;
        setActiveDetailBoardResize((prev) => (
          prev?.groupId === groupId && prev.columnId === columnId
            ? { ...prev, width: latestWidth }
            : prev
        ));
      });
    };

    const handleMouseUp = () => {
      if (previewFrame !== null) {
        window.cancelAnimationFrame(previewFrame);
        previewFrame = null;
      }
      commitWidth(latestWidth);
      setActiveDetailBoardResize((prev) => (
        prev?.groupId === groupId && prev.columnId === columnId ? null : prev
      ));
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [
    defaultFieldWidth,
    getLayoutFieldWorkbenchMeta,
    mainTableColumns,
    maxFieldWidth,
    minFieldWidth,
    normalizedMainDetailBoardConfig,
    setActiveDetailBoardResize,
    updateMainDetailBoard,
  ]);

  const resetDetailBoardFieldWidth = useCallback((
    event: MouseEvent<HTMLButtonElement>,
    groupId: string,
    columnId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    updateMainDetailBoard((current: any) => ({
      ...current,
      groups: current.groups.map((group: any) => (
        group.id === groupId
          ? {
              ...group,
              columnWidths: Object.fromEntries(
                Object.entries(group.columnWidths ?? {}).filter(([key]) => key !== columnId),
              ),
            }
          : group
      )),
    }));
  }, [updateMainDetailBoard]);

  const startDetailBoardFieldHeightResize = useCallback((
    event: MouseEvent<HTMLButtonElement>,
    groupId: string,
    columnId: string,
    label: string,
    minHeightOverride?: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startY = event.pageY;
    const previewItem = event.currentTarget.closest('[data-detail-field-item="true"]') as HTMLElement | null;
    const startHeight = previewItem?.getBoundingClientRect().height ?? defaultFieldHeight;
    const minHeight = Math.max(minFieldHeight, Number(minHeightOverride) || minFieldHeight);
    const maxHeight = maxFieldHeight;
    let latestHeight = startHeight;
    let previewFrame: number | null = null;

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    setActiveDetailBoardHeightResize({
      groupId,
      columnId,
      label,
      height: startHeight,
      minHeight,
      maxHeight,
    });

    const commitHeight = (nextHeight: number) => {
      updateMainDetailBoard((current: any) => ({
        ...current,
        groups: current.groups.map((group: any) => (
          group.id === groupId
            ? {
                ...group,
                columnHeights: {
                  ...(group.columnHeights ?? {}),
                  [columnId]: nextHeight,
                },
              }
            : group
        )),
      }));
    };

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      latestHeight = Math.round(Math.max(minHeight, Math.min(maxHeight, startHeight + (moveEvent.pageY - startY))));
      if (previewFrame !== null) return;
      previewFrame = window.requestAnimationFrame(() => {
        previewFrame = null;
        setActiveDetailBoardHeightResize((prev) => (
          prev?.groupId === groupId && prev.columnId === columnId
            ? { ...prev, height: latestHeight }
            : prev
        ));
      });
    };

    const handleMouseUp = () => {
      if (previewFrame !== null) {
        window.cancelAnimationFrame(previewFrame);
        previewFrame = null;
      }
      commitHeight(latestHeight);
      setActiveDetailBoardHeightResize((prev) => (
        prev?.groupId === groupId && prev.columnId === columnId ? null : prev
      ));
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [
    defaultFieldHeight,
    maxFieldHeight,
    minFieldHeight,
    setActiveDetailBoardHeightResize,
    updateMainDetailBoard,
  ]);

  const resetDetailBoardFieldHeight = useCallback((
    event: MouseEvent<HTMLButtonElement>,
    groupId: string,
    columnId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    updateMainDetailBoard((current: any) => ({
      ...current,
      groups: current.groups.map((group: any) => (
        group.id === groupId
          ? {
              ...group,
              columnHeights: Object.fromEntries(
                Object.entries(group.columnHeights ?? {}).filter(([key]) => key !== columnId),
              ),
            }
          : group
      )),
    }));
  }, [updateMainDetailBoard]);

  const getDetailBoardFieldLiveWidth = useCallback((
    groupId: string,
    columnId: string,
    fallbackWidth: number,
  ) => (
    activeDetailBoardResize?.groupId === groupId && activeDetailBoardResize.columnId === columnId
      ? activeDetailBoardResize.width
      : fallbackWidth
  ), [activeDetailBoardResize]);

  const getDetailBoardFieldLiveHeight = useCallback((
    groupId: string,
    columnId: string,
    fallbackHeight: number,
  ) => (
    activeDetailBoardHeightResize?.groupId === groupId && activeDetailBoardHeightResize.columnId === columnId
      ? activeDetailBoardHeightResize.height
      : fallbackHeight
  ), [activeDetailBoardHeightResize]);

  return {
    getDetailBoardFieldLiveHeight,
    getDetailBoardFieldLiveWidth,
    resetDetailBoardFieldHeight,
    resetDetailBoardFieldWidth,
    startDetailBoardFieldHeightResize,
    startDetailBoardFieldResize,
  };
}
