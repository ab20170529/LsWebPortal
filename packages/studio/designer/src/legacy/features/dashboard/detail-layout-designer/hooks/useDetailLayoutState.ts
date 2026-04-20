import { useCallback, useMemo, useState } from 'react';

import { DETAIL_LAYOUT_REGISTRY } from '../registry';
import type {
  DetailLayoutDocument,
  DetailLayoutRect,
  DetailLayoutItemPatch,
  DetailLayoutItemType,
  DetailLayoutMode,
  DetailLayoutUiState,
} from '../types';
import { createDetailLayoutItem, createEmptyDetailLayoutDocument, appendDetailLayoutItem, removeDetailLayoutItem, updateDetailLayoutItem } from '../utils/layout';
import { isDetailLayoutContainer } from '../utils/tree';
import { useDetailHistory } from './useDetailHistory';
import { useDetailSelection } from './useDetailSelection';

type UseDetailLayoutStateOptions = {
  defaultDocument?: DetailLayoutDocument;
  mode?: DetailLayoutMode;
};

export function useDetailLayoutState(options: UseDetailLayoutStateOptions = {}) {
  const history = useDetailHistory(options.defaultDocument ?? createEmptyDetailLayoutDocument());
  const [mode, setMode] = useState<DetailLayoutMode>(options.mode ?? 'design');
  const [hoveringId, setHoveringId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const selection = useDetailSelection(history.present.items);

  const addItem = useCallback((type: DetailLayoutItemType, overrides: Partial<DetailLayoutDocument['items'][number]> = {}) => {
    const nextIndex = history.present.items.length;
    const selectedParentId = isDetailLayoutContainer(selection.selectedItem)
      ? selection.selectedItem.id
      : selection.selectedItem?.parentId ?? null;
    const resolvedParentId = Object.prototype.hasOwnProperty.call(overrides, 'parentId')
      ? (overrides.parentId ?? null)
      : selectedParentId;

    const item = createDetailLayoutItem(
      type,
      {
        parentId: resolvedParentId,
        x: overrides.x ?? 24 + (nextIndex % 4) * 24,
        y: overrides.y ?? 24 + Math.floor(nextIndex / 4) * 24,
        ...overrides,
      },
      history.present.gridSize,
    );

    history.setPresent((current) => appendDetailLayoutItem(current, item));
    selection.selectItem(item.id);
    return item;
  }, [history, selection]);

  const updateItem = useCallback((itemId: string, patch: DetailLayoutItemPatch) => {
    history.setPresent((current) => updateDetailLayoutItem(current, itemId, patch));
  }, [history]);

  const updateSelectedItem = useCallback((patch: DetailLayoutItemPatch) => {
    if (!selection.selectedId) {
      return;
    }

    history.setPresent((current) => updateDetailLayoutItem(current, selection.selectedId as string, patch));
  }, [history, selection.selectedId]);

  const deleteSelectedItem = useCallback(() => {
    if (!selection.selectedId) {
      return;
    }

    history.setPresent((current) => removeDetailLayoutItem(current, selection.selectedId as string));
    setHoveringId(null);
    setActiveParentId(null);
    setDraggingId(null);
    setResizingId(null);
    selection.clearSelection();
  }, [history, selection]);

  const replaceDocument = useCallback((nextDocument: DetailLayoutDocument) => {
    history.reset(nextDocument);
    setHoveringId(null);
    setActiveParentId(null);
    setDraggingId(null);
    setResizingId(null);
    selection.clearSelection();
  }, [history, selection]);

  const commitItemRect = useCallback((itemId: string, rect: DetailLayoutRect) => {
    history.setPresent((current) => updateDetailLayoutItem(current, itemId, rect));
    setDraggingId((current) => (current === itemId ? null : current));
    setResizingId((current) => (current === itemId ? null : current));
  }, [history]);

  const beginDragging = useCallback((itemId: string) => {
    setDraggingId(itemId);
    setResizingId((current) => (current === itemId ? null : current));
    selection.selectItem(itemId);
  }, [selection]);

  const beginResizing = useCallback((itemId: string) => {
    setResizingId(itemId);
    setDraggingId((current) => (current === itemId ? null : current));
    selection.selectItem(itemId);
  }, [selection]);

  const endInteraction = useCallback((itemId?: string | null) => {
    setDraggingId((current) => (!itemId || current === itemId ? null : current));
    setResizingId((current) => (!itemId || current === itemId ? null : current));
  }, []);

  const ui = useMemo<DetailLayoutUiState>(() => ({
    mode,
    selectedId: selection.selectedId,
    hoveringId,
    draggingId,
    resizingId,
    activeParentId: activeParentId ?? (
      isDetailLayoutContainer(selection.selectedItem)
        ? selection.selectedItem.id
        : selection.selectedItem?.parentId ?? null
    ),
  }), [activeParentId, draggingId, hoveringId, mode, resizingId, selection.selectedId, selection.selectedItem]);

  return {
    addItem,
    beginDragging,
    beginResizing,
    clearSelection: selection.clearSelection,
    commitItemRect,
    deleteSelectedItem,
    document: history.present,
    endInteraction,
    history,
    registry: DETAIL_LAYOUT_REGISTRY,
    replaceDocument,
    selectItem: selection.selectItem,
    selectedId: selection.selectedId,
    selectedItem: selection.selectedItem,
    setActiveParentId,
    setHoveringId,
    setMode,
    ui,
    updateItem,
    updateSelectedItem,
  };
}
