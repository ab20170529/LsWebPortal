import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

type DesignerWorkbenchDropLaneProps = {
  children: React.ReactNode;
  className: string;
  data: Record<string, unknown>;
  dropId: string;
  key?: React.Key;
};

export function DesignerWorkbenchDropLane({
  children,
  className,
  data,
  dropId,
}: DesignerWorkbenchDropLaneProps): React.JSX.Element {
  const { setNodeRef } = useDroppable({
    id: dropId,
    data,
  });

  return (
    <div ref={setNodeRef} className={className}>
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
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  role?: string;
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
  onKeyDown,
  role = 'button',
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
  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragNodeRef(node);
    setDropNodeRef(node);
  };
  const dragStyle = transform
    ? { ...(style ?? {}), transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : style;

  return (
    <div
      ref={setNodeRef}
      role={role}
      tabIndex={tabIndex}
      className={className}
      style={dragStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      {...itemAttributes}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
