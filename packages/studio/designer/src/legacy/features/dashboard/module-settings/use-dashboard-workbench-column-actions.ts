import { type ClipboardEvent as ReactClipboardEvent, type Dispatch, type MouseEvent as ReactMouseEvent, type SetStateAction, useCallback, useMemo } from 'react';

import { type ActiveWorkbenchResize, type WorkbenchResizeMode, updateItemWidthById } from '../resize/use-workbench-resize-state';
import {
  estimateWorkbenchColumnWidth,
  parsePastedWorkbenchColumnNames,
} from './dashboard-workbench-column-utils';

type SetColumns = Dispatch<SetStateAction<any[]>>;

export function useDashboardWorkbenchColumnActions({
  activeResize,
  buildColumn,
  clearResizePreview,
  defaultAutoFitMaxWidth,
  defaultMinWidth,
  defaultResizeMaxWidth,
  normalizeColumn,
  removeDetailTab,
  scheduleResizePreview,
  setActiveResize,
}: {
  activeResize: ActiveWorkbenchResize | null;
  buildColumn: (prefix: string, index: number, overrides?: Record<string, any>) => any;
  clearResizePreview: (target?: { id: string; mode: WorkbenchResizeMode }) => void;
  defaultAutoFitMaxWidth: number;
  defaultMinWidth: number;
  defaultResizeMaxWidth: number;
  normalizeColumn: (column: any) => any;
  removeDetailTab: (id: string) => void;
  scheduleResizePreview: (nextResize: ActiveWorkbenchResize) => void;
  setActiveResize: Dispatch<SetStateAction<ActiveWorkbenchResize | null>>;
}) {
  const deleteTab = useCallback((id: string, event: ReactMouseEvent) => {
    event.stopPropagation();
    removeDetailTab(id);
  }, [removeDetailTab]);

  const handlePasteColumns = useCallback((
    event: ReactClipboardEvent,
    setCols: SetColumns,
    options?: {
      createColumn?: (name: string, index: number, currentLength: number) => any;
    },
  ) => {
    const text = event.clipboardData.getData('text');
    if (!text) return;

    const newColNames = parsePastedWorkbenchColumnNames(text);
    if (newColNames.length === 0) return;

    event.preventDefault();
    setCols((prev) => {
      const newCols = newColNames.map((name, index) => (
        options?.createColumn
          ? options.createColumn(name, index, prev.length)
          : buildColumn('col', prev.length + index + 1, { name })
      ));
      return [...prev, ...newCols];
    });
  }, [buildColumn]);

  const estimateColumnWidth = useCallback((
    rawColumn: any,
    minWidth = defaultMinWidth,
    maxWidth = defaultAutoFitMaxWidth,
  ) => estimateWorkbenchColumnWidth(rawColumn, normalizeColumn, { minWidth, maxWidth }), [
    defaultAutoFitMaxWidth,
    defaultMinWidth,
    normalizeColumn,
  ]);

  const autoFitColumnWidth = useCallback((
    event: ReactMouseEvent,
    colId: string,
    cols: any[],
    setCols: SetColumns,
    minWidth = defaultMinWidth,
    maxWidth = defaultAutoFitMaxWidth,
    mode: WorkbenchResizeMode = 'column',
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const targetCol = cols.find((item) => item.id === colId);
    if (!targetCol) return;

    const nextWidth = estimateColumnWidth(targetCol, minWidth, maxWidth);
    setActiveResize({ id: colId, label: targetCol.name || '未命名字段', width: nextWidth, mode });
    setCols((prev) => updateItemWidthById(prev, colId, nextWidth));
    window.setTimeout(() => setActiveResize((prev) => (prev?.id === colId ? null : prev)), 720);
  }, [
    defaultAutoFitMaxWidth,
    defaultMinWidth,
    estimateColumnWidth,
    setActiveResize,
  ]);

  const startResize = useCallback((
    event: ReactMouseEvent,
    colId: string,
    cols: any[],
    setCols: SetColumns,
    minWidth = defaultMinWidth,
    maxWidth = defaultResizeMaxWidth,
    mode: WorkbenchResizeMode = 'column',
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.pageX;
    const targetCol = cols.find((item) => item.id === colId);
    const startWidth = targetCol?.width || 100;
    const resizeLabel = targetCol?.name || '未命名字段';
    let latestWidth = startWidth;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    setActiveResize({ id: colId, label: resizeLabel, width: startWidth, mode });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      latestWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + (moveEvent.pageX - startX)));
      scheduleResizePreview({ id: colId, label: resizeLabel, width: latestWidth, mode });
    };

    const handleMouseUp = () => {
      clearResizePreview({ id: colId, mode });
      setCols((prev) => updateItemWidthById(prev, colId, latestWidth));
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
    document.addEventListener('mouseup', handleMouseUp);
  }, [
    clearResizePreview,
    defaultMinWidth,
    defaultResizeMaxWidth,
    scheduleResizePreview,
    setActiveResize,
  ]);

  const conditionWorkbenchResizeApi = useMemo(() => ({
    activeResize,
    autoFitColumnWidth,
    clearResizePreview,
    scheduleResizePreview,
    setActiveResize,
  }), [
    activeResize,
    autoFitColumnWidth,
    clearResizePreview,
    scheduleResizePreview,
    setActiveResize,
  ]);

  return {
    autoFitColumnWidth,
    conditionWorkbenchResizeApi,
    deleteTab,
    estimateColumnWidth,
    handlePasteColumns,
    startResize,
  };
}
