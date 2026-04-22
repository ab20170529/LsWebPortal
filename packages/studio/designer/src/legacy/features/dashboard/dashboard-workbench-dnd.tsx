import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { defaultAnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const DASHBOARD_DRAG_MOTION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const DASHBOARD_DRAG_MOTION_BASE_MS = 180;

type DesignerWorkbenchDropLaneProps = {
  children: React.ReactNode;
  className: string;
  data: Record<string, unknown>;
  dropId: string;
  key?: React.Key;
  style?: React.CSSProperties;
};

export function DesignerWorkbenchDropLane({
  children,
  className,
  data,
  dropId,
  style,
}: DesignerWorkbenchDropLaneProps): React.JSX.Element {
  const { setNodeRef } = useDroppable({
    id: dropId,
    data,
  });

  return (
    <div ref={setNodeRef} className={className} style={style}>
      {children}
    </div>
  );
}

type DesignerWorkbenchDraggableItemProps = {
  children: React.ReactNode;
  className: string;
  data: Record<string, unknown>;
  dragId: string;
  dropId: string;
  itemAttributes?: Record<string, string>;
  key?: React.Key;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDownCapture?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUpCapture?: (event: React.MouseEvent<HTMLDivElement>) => void;
  role?: string;
  sortable?: boolean;
  style?: React.CSSProperties;
  tabIndex?: number;
};

export function DesignerWorkbenchDraggableItem({
  children,
  className,
  data,
  dragId,
  dropId,
  itemAttributes,
  onClick,
  onContextMenu,
  onDoubleClick,
  onKeyDown,
  onMouseDown,
  onMouseDownCapture,
  onMouseUp,
  onMouseUpCapture,
  role = 'button',
  sortable = false,
  style,
  tabIndex = 0,
}: DesignerWorkbenchDraggableItemProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef: setDragNodeRef, transform } = useDraggable({
    id: dragId,
    data,
  });
  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: dropId,
    data,
  });
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableNodeRef,
    isDragging: sortableDragging,
    transform: sortableTransform,
    transition: sortableTransition,
  } = useSortable({
    id: dragId,
    data,
    disabled: !sortable,
    animateLayoutChanges: (args) => {
      if (args.isSorting || args.wasDragging) {
        return defaultAnimateLayoutChanges(args);
      }
      return false;
    },
    transition: {
      duration: DASHBOARD_DRAG_MOTION_BASE_MS,
      easing: DASHBOARD_DRAG_MOTION_EASING,
    },
  });
  const setNodeRef = (node: HTMLDivElement | null) => {
    if (sortable) {
      setSortableNodeRef(node);
      return;
    }
    setDragNodeRef(node);
    setDropNodeRef(node);
  };
  const dragStyle = sortable
    ? {
        ...(style ?? {}),
        transform: CSS.Transform.toString(
          sortableTransform
            ? {
                ...sortableTransform,
                scaleX: 1,
                scaleY: 1,
              }
            : null,
        ),
        transformOrigin: '0 0',
        transition: sortableTransition,
        touchAction: 'manipulation',
        willChange: sortableDragging ? 'transform' : undefined,
        zIndex: sortableDragging ? 20 : undefined,
      }
    : transform
      ? {
          ...(style ?? {}),
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          transformOrigin: '0 0',
          touchAction: 'manipulation',
          willChange: 'transform',
          zIndex: 20,
        }
      : style;
  const activeListeners = (sortable ? sortableListeners : listeners) as Record<string, unknown> | undefined;
  const dndPointerDown = activeListeners?.onPointerDown as ((event: React.PointerEvent<HTMLDivElement>) => void) | undefined;
  const dndKeyDown = activeListeners?.onKeyDown as ((event: React.KeyboardEvent<HTMLDivElement>) => void) | undefined;
  const mergedListeners = activeListeners
    ? Object.fromEntries(
        Object.entries(activeListeners).filter(([key]) => key !== 'onPointerDown' && key !== 'onKeyDown'),
      )
    : undefined;
  const shouldBlockDragStart = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(target.closest('[data-workbench-no-drag="true"]'));
  };

  return (
    <div
      ref={setNodeRef}
      role={role}
      tabIndex={tabIndex}
      className={className}
      style={dragStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        dndKeyDown?.(event);
      }}
      onMouseDown={onMouseDown}
      onMouseDownCapture={onMouseDownCapture}
      onPointerDown={(event) => {
        if (shouldBlockDragStart(event.target)) {
          return;
        }
        dndPointerDown?.(event);
      }}
      onMouseUp={onMouseUp}
      onMouseUpCapture={onMouseUpCapture}
      {...itemAttributes}
      {...(sortable ? sortableAttributes : attributes)}
      {...mergedListeners}
    >
      {children}
    </div>
  );
}
