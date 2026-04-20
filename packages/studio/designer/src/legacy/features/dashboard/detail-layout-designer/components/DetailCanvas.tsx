import { useDroppable } from '@dnd-kit/core';
import clsx from 'clsx';
import { Rnd } from 'react-rnd';
import { Fragment, memo, type ReactNode, useMemo, useState } from 'react';

import { DETAIL_LAYOUT_REGISTRY } from '../registry';
import { buildDetailDropTargetData } from '../hooks/useDetailDnD';
import type { DetailLayoutDocument, DetailLayoutItem, DetailLayoutMode, DetailLayoutRect } from '../types';
import { snapRectToGrid } from '../utils/snap';
import { buildDetailLayoutChildrenMap } from '../utils/tree';
import { DetailItemRenderer } from './DetailItemRenderer';
import { GroupBoxRenderer } from './GroupBoxRenderer';

type DetailCanvasProps = {
  className?: string;
  document: DetailLayoutDocument;
  draggingId?: string | null;
  hoveringId?: string | null;
  mode: DetailLayoutMode;
  onBeginDragging?: (itemId: string) => void;
  onBeginResizing?: (itemId: string) => void;
  onCommitItemRect?: (itemId: string, rect: DetailLayoutRect) => void;
  onEndInteraction?: (itemId?: string | null) => void;
  renderItemContent?: (item: DetailLayoutItem) => ReactNode;
  resizingId?: string | null;
  onSelectItem?: (itemId: string | null) => void;
  selectedId?: string | null;
};

type DetailCanvasNodeProps = {
  childrenMap: Map<string | null, DetailLayoutItem[]>;
  document: DetailLayoutDocument;
  hoveringId?: string | null;
  item: DetailLayoutItem;
  mode: DetailLayoutMode;
  onBeginDragging?: (itemId: string) => void;
  onBeginResizing?: (itemId: string) => void;
  onCommitItemRect?: (itemId: string, rect: DetailLayoutRect) => void;
  onEndInteraction?: (itemId?: string | null) => void;
  renderItemContent?: (item: DetailLayoutItem) => ReactNode;
  onSelectItem?: (itemId: string | null) => void;
  selectedId?: string | null;
};

const MemoDetailCanvasNode = memo(function DetailCanvasNode({
  childrenMap,
  document,
  hoveringId,
  item,
  mode,
  onBeginDragging,
  onBeginResizing,
  onCommitItemRect,
  onEndInteraction,
  renderItemContent,
  onSelectItem,
  selectedId,
}: DetailCanvasNodeProps) {
  const registryItem = DETAIL_LAYOUT_REGISTRY[item.type];
  const selected = selectedId === item.id;
  const [interactionMode, setInteractionMode] = useState<'idle' | 'dragging' | 'resizing'>('idle');
  const itemRect = useMemo<DetailLayoutRect>(() => ({
    h: item.h,
    w: item.w,
    x: item.x,
    y: item.y,
  }), [item.h, item.w, item.x, item.y]);
  const [liveRect, setLiveRect] = useState<DetailLayoutRect>({
    h: item.h,
    w: item.w,
    x: item.x,
    y: item.y,
  });
  const activeRect = interactionMode === 'idle' ? itemRect : liveRect;
  const snappedLiveRect = useMemo(() => snapRectToGrid(activeRect, document.gridSize), [activeRect, document.gridSize]);
  const showSnapOverlay = mode === 'design' && interactionMode !== 'idle';
  const {
    isOver: isGroupDropOver,
    setNodeRef: setGroupDropNodeRef,
  } = useDroppable({
    data: buildDetailDropTargetData(item.id, item.id),
    disabled: item.type !== 'groupbox' || mode !== 'design',
    id: `detail-layout-groupbox-drop:${item.id}`,
  });

  const content = useMemo(() => (
    item.type === 'groupbox' ? (
      <GroupBoxRenderer
        childCount={(childrenMap.get(item.id) ?? []).length}
        bodyClassName={clsx(
          hoveringId === item.id || isGroupDropOver ? 'border-[color:var(--workspace-accent-border,#8fb0ff)] bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.08))]' : '',
        )}
        bodyRef={setGroupDropNodeRef}
        dropHintText="把字段或控件拖进这个分组框"
        isDropActive={Boolean(isGroupDropOver)}
        item={item}
        mode={mode}
        onSelect={onSelectItem}
        selected={selected}
      >
        {(childrenMap.get(item.id) ?? []).map((child) => (
          <Fragment key={child.id}>
            <MemoDetailCanvasNode
              childrenMap={childrenMap}
              document={document}
              hoveringId={hoveringId}
              item={child}
              mode={mode}
              onBeginDragging={onBeginDragging}
              onBeginResizing={onBeginResizing}
              onCommitItemRect={onCommitItemRect}
              onEndInteraction={onEndInteraction}
              renderItemContent={renderItemContent}
              onSelectItem={onSelectItem}
              selectedId={selectedId}
            />
          </Fragment>
        ))}
      </GroupBoxRenderer>
    ) : (
      <DetailItemRenderer
        content={renderItemContent?.(item)}
        item={item}
        mode={mode}
        onSelect={onSelectItem}
        selected={selected}
      />
    )
  ), [
    childrenMap,
    document,
    hoveringId,
    isGroupDropOver,
    item,
    mode,
    onBeginDragging,
    onBeginResizing,
    onCommitItemRect,
    onEndInteraction,
    onSelectItem,
    renderItemContent,
    setGroupDropNodeRef,
    selected,
    selectedId,
  ]);

  if (mode !== 'design') {
    return (
      <div
        className={clsx('absolute', selected ? 'z-20' : 'z-10')}
        style={{
          height: item.h,
          left: item.x,
          top: item.y,
          width: item.w,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <Rnd
      bounds="parent"
      className={clsx(
        interactionMode !== 'idle'
          ? 'z-40'
          : selected
            ? 'z-20'
            : 'z-10',
      )}
      dragGrid={[document.gridSize, document.gridSize]}
      dragHandleClassName={item.type === 'groupbox' ? 'detail-layout-groupbox-handle' : 'detail-layout-item-handle'}
      enableResizing={{
        bottom: true,
        bottomLeft: true,
        bottomRight: true,
        left: true,
        right: true,
        top: true,
        topLeft: true,
        topRight: true,
      }}
      minHeight={registryItem.defaultSize.h}
      minWidth={registryItem.defaultSize.w}
      onDrag={(event, data) => {
        event.stopPropagation();
        setLiveRect((current) => ({
          ...current,
          x: data.x,
          y: data.y,
        }));
      }}
      onDragStart={(event) => {
        event.stopPropagation();
        onSelectItem?.(item.id);
        setLiveRect(itemRect);
        setInteractionMode('dragging');
        onBeginDragging?.(item.id);
      }}
      onDragStop={(event, data) => {
        event.stopPropagation();
        const nextRect = {
          ...liveRect,
          x: data.x,
          y: data.y,
        };
        setLiveRect(nextRect);
        setInteractionMode('idle');
        onCommitItemRect?.(item.id, nextRect);
        onEndInteraction?.(item.id);
      }}
      onResize={(event, _direction, ref, _delta, position) => {
        event.stopPropagation();
        setLiveRect({
          h: ref.offsetHeight,
          w: ref.offsetWidth,
          x: position.x,
          y: position.y,
        });
      }}
      onResizeStart={(event) => {
        event.stopPropagation();
        onSelectItem?.(item.id);
        setLiveRect(itemRect);
        setInteractionMode('resizing');
        onBeginResizing?.(item.id);
      }}
      onResizeStop={(event, _direction, ref, _delta, position) => {
        event.stopPropagation();
        const nextRect = {
          h: ref.offsetHeight,
          w: ref.offsetWidth,
          x: position.x,
          y: position.y,
        };
        setLiveRect(nextRect);
        setInteractionMode('idle');
        onCommitItemRect?.(item.id, nextRect);
        onEndInteraction?.(item.id);
      }}
      position={{
        x: activeRect.x,
        y: activeRect.y,
      }}
      resizeGrid={[document.gridSize, document.gridSize]}
      size={{
        height: activeRect.h,
        width: activeRect.w,
      }}
    >
      <div
        className={clsx(
          'relative h-full w-full rounded-[22px]',
          showSnapOverlay ? 'shadow-[0_0_0_2px_rgba(49,98,255,0.22),0_18px_40px_-28px_rgba(49,98,255,0.5)]' : '',
        )}
        style={{
          willChange: interactionMode !== 'idle' ? 'transform,width,height' : undefined,
        }}
      >
        {showSnapOverlay ? (
          <>
            <div className="pointer-events-none absolute left-2 top-2 z-40 rounded-full border border-[color:var(--workspace-accent-border,#8fb0ff)] bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.14))] px-2.5 py-1 text-[10px] font-semibold text-[color:var(--workspace-accent-strong,#3152c8)] shadow-[0_10px_24px_-20px_rgba(49,98,255,0.55)]">
              X {snappedLiveRect.x} / Y {snappedLiveRect.y}
            </div>
            <div className="pointer-events-none absolute right-2 top-2 z-40 rounded-full border border-[color:var(--workspace-accent-border,#8fb0ff)] bg-white/94 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.38)]">
              已吸附 {document.gridSize}px 网格
            </div>
            <div className="pointer-events-none absolute bottom-2 right-2 z-40 rounded-full border border-slate-200/90 bg-white/94 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.38)]">
              W {snappedLiveRect.w} / H {snappedLiveRect.h}
            </div>
          </>
        ) : null}
        {content}
      </div>
    </Rnd>
  );
});

export function DetailCanvas({
  className,
  document,
  draggingId,
  hoveringId,
  mode,
  onBeginDragging,
  onBeginResizing,
  onCommitItemRect,
  onEndInteraction,
  renderItemContent,
  resizingId,
  onSelectItem,
  selectedId,
}: DetailCanvasProps) {
  const childrenMap = useMemo(() => buildDetailLayoutChildrenMap(document.items), [document.items]);
  const rootItems = childrenMap.get(null) ?? [];
  const hasCanvasInteraction = mode === 'design' && Boolean(draggingId || resizingId);
  const {
    isOver: isRootDropOver,
    setNodeRef: setRootDropNodeRef,
  } = useDroppable({
    data: buildDetailDropTargetData(null, null),
    disabled: mode !== 'design',
    id: 'detail-layout-root-drop',
  });

  return (
    <div
      ref={setRootDropNodeRef}
      className={clsx(
        'relative min-h-[640px] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/88 shadow-[0_28px_48px_-40px_rgba(15,23,42,0.32)]',
        (isRootDropOver && mode === 'design') ? 'border-[color:var(--workspace-accent-border,#8fb0ff)] bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.04))]' : '',
        className,
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onSelectItem?.(null);
        }
      }}
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)
        `,
        backgroundSize: `${document.gridSize}px ${document.gridSize}px`,
      }}
    >
      {mode === 'design' ? (
        <div
          className={clsx(
            'pointer-events-none absolute left-4 right-4 top-4 z-30 flex flex-wrap items-center justify-between gap-2 transition-opacity duration-150',
            hasCanvasInteraction ? 'opacity-0' : 'opacity-100',
          )}
        >
          <div className="rounded-full border border-white/80 bg-white/88 px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.3)]">
            设计画布 · {document.gridSize}px 网格 · {rootItems.length} 个根级控件
          </div>
          <div
            className={clsx(
              'rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-[0_10px_20px_-18px_rgba(15,23,42,0.3)] transition-colors',
              isRootDropOver
                ? 'border-[color:var(--workspace-accent-border,#8fb0ff)] bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.12))] text-[color:var(--workspace-accent-strong,#3152c8)]'
                : 'border-white/80 bg-white/88 text-slate-500',
            )}
          >
            {isRootDropOver ? '释放到根画布' : '拖控件到画布或 GroupBox'}
          </div>
        </div>
      ) : null}

      {rootItems.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-slate-400">
          <div className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
            Detail Canvas
          </div>
          <div className="max-w-sm text-sm leading-6">
            从左侧把控件拖进来，或直接点击物料快速添加。支持设计态选中、移动、缩放和 GroupBox 容器落点。
          </div>
        </div>
      ) : null}

      {rootItems.length > 0 && mode === 'design' ? (
        <div
          className={clsx(
            'pointer-events-none absolute bottom-4 left-4 z-30 rounded-full border border-white/80 bg-white/88 px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.3)] transition-opacity duration-150',
            hasCanvasInteraction ? 'opacity-0' : 'opacity-100',
          )}
        >
          选中后去右侧微调属性；双击缩放手柄可恢复默认尺寸，容器通过头部拖动
        </div>
      ) : null}

      {rootItems.map((item) => (
        <Fragment key={item.id}>
          <MemoDetailCanvasNode
            childrenMap={childrenMap}
            document={document}
            hoveringId={hoveringId}
            item={item}
            mode={mode}
            onBeginDragging={onBeginDragging}
            onBeginResizing={onBeginResizing}
            onCommitItemRect={onCommitItemRect}
            onEndInteraction={onEndInteraction}
            renderItemContent={renderItemContent}
            onSelectItem={onSelectItem}
            selectedId={selectedId}
          />
        </Fragment>
      ))}
    </div>
  );
}
