import { useCallback, useEffect, useRef, useState } from 'react';

export type WorkbenchResizeMode = 'column' | 'filter';

export type ActiveWorkbenchResize = {
  id: string;
  label: string;
  width: number;
  mode: WorkbenchResizeMode;
};

export function resolveWorkbenchPreviewWidth(
  width: number | null | undefined,
  fallbackWidth: number,
  minWidth: number,
  activeResize: ActiveWorkbenchResize | null,
  id: string,
  mode: WorkbenchResizeMode,
) {
  const previewWidth = activeResize?.id === id && activeResize.mode === mode ? activeResize.width : width;
  const normalizedWidth = Number(previewWidth);

  return Math.max(
    minWidth,
    Number.isFinite(normalizedWidth) ? Math.round(normalizedWidth) : fallbackWidth,
  );
}

export function updateItemWidthById<T extends { id: string; width?: number }>(
  items: T[],
  id: string,
  width: number,
) {
  const targetIndex = items.findIndex((item) => item.id === id);
  if (targetIndex === -1 || items[targetIndex]?.width === width) {
    return items;
  }

  const next = items.slice();
  next[targetIndex] = { ...next[targetIndex], width };
  return next;
}

export function useWorkbenchResizeState() {
  const [activeResize, setActiveResize] = useState<ActiveWorkbenchResize | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const pendingResizeRef = useRef<ActiveWorkbenchResize | null>(null);

  const scheduleResizePreview = useCallback((nextResize: ActiveWorkbenchResize) => {
    pendingResizeRef.current = nextResize;
    if (resizeFrameRef.current !== null) return;

    resizeFrameRef.current = window.requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      const nextPreview = pendingResizeRef.current;
      if (!nextPreview) return;

      setActiveResize((prev) => (
        prev
        && prev.id === nextPreview.id
        && prev.mode === nextPreview.mode
        && prev.width === nextPreview.width
        && prev.label === nextPreview.label
          ? prev
          : nextPreview
      ));
    });
  }, []);

  const clearResizePreview = useCallback((target?: { id: string; mode: WorkbenchResizeMode }) => {
    if (resizeFrameRef.current !== null) {
      window.cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = null;
    }
    pendingResizeRef.current = null;

    setActiveResize((prev) => {
      if (!prev) return prev;
      if (!target) return null;
      return prev.id === target.id && prev.mode === target.mode ? null : prev;
    });
  }, []);

  useEffect(() => () => {
    if (resizeFrameRef.current !== null) {
      window.cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = null;
    }
    pendingResizeRef.current = null;
  }, []);

  return {
    activeResize,
    clearResizePreview,
    scheduleResizePreview,
    setActiveResize,
  };
}
