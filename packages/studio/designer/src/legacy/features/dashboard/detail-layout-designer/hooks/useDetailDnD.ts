import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useCallback, useMemo, useState } from 'react';

import type { DetailLayoutItemType, DetailLayoutMode, DetailLayoutPaletteItem } from '../types';
import { snapToGrid } from '../utils/snap';

const DETAIL_LAYOUT_PALETTE_DRAG_KIND = 'detail-layout-palette-item';
const DETAIL_LAYOUT_DROP_TARGET_KIND = 'detail-layout-drop-target';

type DetailPaletteDragData = {
  kind: typeof DETAIL_LAYOUT_PALETTE_DRAG_KIND;
  paletteItem: DetailLayoutPaletteItem;
};

type DetailDropTargetData = {
  itemId: string | null;
  kind: typeof DETAIL_LAYOUT_DROP_TARGET_KIND;
  parentId: string | null;
};

type UseDetailDnDOptions = {
  enabled?: boolean;
  gridSize?: number;
  mode?: DetailLayoutMode;
  onAddItem: (paletteItem: DetailLayoutPaletteItem, overrides?: {
    parentId?: string | null;
    x?: number;
    y?: number;
  }) => void;
  onSetActiveParentId?: (parentId: string | null) => void;
  onSetHoveringId?: (itemId: string | null) => void;
};

export function createDetailPaletteDraggableId(paletteItemId: string) {
  return `detail-layout-palette:${paletteItemId}`;
}

export function buildDetailPaletteDragData(paletteItem: DetailLayoutPaletteItem): DetailPaletteDragData {
  return {
    kind: DETAIL_LAYOUT_PALETTE_DRAG_KIND,
    paletteItem,
  };
}

export function buildDetailDropTargetData(parentId: string | null, itemId: string | null = null): DetailDropTargetData {
  return {
    itemId,
    kind: DETAIL_LAYOUT_DROP_TARGET_KIND,
    parentId,
  };
}

function isDetailPaletteDragData(value: unknown): value is DetailPaletteDragData {
  return Boolean(value) && typeof value === 'object' && (value as DetailPaletteDragData).kind === DETAIL_LAYOUT_PALETTE_DRAG_KIND;
}

function isDetailDropTargetData(value: unknown): value is DetailDropTargetData {
  return Boolean(value) && typeof value === 'object' && (value as DetailDropTargetData).kind === DETAIL_LAYOUT_DROP_TARGET_KIND;
}

function getRectPosition(event: DragEndEvent) {
  const translated = event.active.rect.current.translated;
  if (translated) {
    return translated;
  }

  return event.active.rect.current.initial;
}

function clearDnDState(
  setActivePaletteType: (value: DetailLayoutItemType | null) => void,
  onSetActiveParentId?: (parentId: string | null) => void,
  onSetHoveringId?: (itemId: string | null) => void,
) {
  setActivePaletteType(null);
  onSetActiveParentId?.(null);
  onSetHoveringId?.(null);
}

export function useDetailDnD(options: UseDetailDnDOptions) {
  const enabled = Boolean(options.enabled) && (options.mode ?? 'design') === 'design';
  const [activePaletteType, setActivePaletteType] = useState<DetailLayoutItemType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    if (!enabled) {
      return;
    }

    const activeData = event.active.data.current;
    if (!isDetailPaletteDragData(activeData)) {
      return;
    }

    setActivePaletteType(activeData.paletteItem.type);
  }, [enabled]);

  const onDragOver = useCallback((event: DragOverEvent) => {
    if (!enabled) {
      return;
    }

    const activeData = event.active.data.current;
    if (!isDetailPaletteDragData(activeData)) {
      return;
    }

    const overData = event.over?.data.current;
    if (!isDetailDropTargetData(overData)) {
      options.onSetActiveParentId?.(null);
      options.onSetHoveringId?.(null);
      return;
    }

    options.onSetActiveParentId?.(overData.parentId);
    options.onSetHoveringId?.(overData.itemId);
  }, [enabled, options]);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    if (!enabled) {
      clearDnDState(setActivePaletteType, options.onSetActiveParentId, options.onSetHoveringId);
      return;
    }

    const activeData = event.active.data.current;
    const overData = event.over?.data.current;
    if (!isDetailPaletteDragData(activeData) || !isDetailDropTargetData(overData) || !event.over) {
      clearDnDState(setActivePaletteType, options.onSetActiveParentId, options.onSetHoveringId);
      return;
    }

    const activeRect = getRectPosition(event);
    const overRect = event.over.rect;

    const x = snapToGrid(Math.max(0, activeRect.left - overRect.left), options.gridSize ?? 8);
    const y = snapToGrid(Math.max(0, activeRect.top - overRect.top), options.gridSize ?? 8);

    options.onAddItem(activeData.paletteItem, {
      parentId: overData.parentId,
      x,
      y,
    });

    clearDnDState(setActivePaletteType, options.onSetActiveParentId, options.onSetHoveringId);
  }, [enabled, options]);

  const onDragCancel = useCallback(() => {
    clearDnDState(setActivePaletteType, options.onSetActiveParentId, options.onSetHoveringId);
  }, [options]);

  return useMemo(() => ({
    activePaletteType,
    enabled,
    sensors,
    onDragCancel,
    onDragEnd,
    onDragMove() {
      return undefined;
    },
    onDragOver,
    onDragStart,
  }), [activePaletteType, enabled, onDragCancel, onDragEnd, onDragOver, onDragStart, sensors]);
}
