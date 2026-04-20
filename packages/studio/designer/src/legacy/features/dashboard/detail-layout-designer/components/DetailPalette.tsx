import { useDraggable } from '@dnd-kit/core';
import clsx from 'clsx';
import { CSS } from '@dnd-kit/utilities';
import { Fragment } from 'react';

import { DETAIL_LAYOUT_PALETTE_ITEMS } from '../registry';
import type { DetailLayoutPaletteItem } from '../types';
import { buildDetailPaletteDragData, createDetailPaletteDraggableId } from '../hooks/useDetailDnD';

type DetailPaletteProps = {
  className?: string;
  items?: DetailLayoutPaletteItem[];
  onAddItem: (item: DetailLayoutPaletteItem) => void;
  title?: string;
  description?: string;
  variant?: 'cards' | 'plain';
};

type DetailPaletteCardProps = {
  item: DetailLayoutPaletteItem;
  onAddItem: (item: DetailLayoutPaletteItem) => void;
};

function DetailPaletteCard({ item, onAddItem }: DetailPaletteCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    data: buildDetailPaletteDragData(item),
    id: createDetailPaletteDraggableId(item.id),
  });

  return (
    <button
      ref={setNodeRef}
      className={clsx(
        'rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-3 py-3 text-left transition-colors hover:border-[color:var(--workspace-accent-border,#8fb0ff)] hover:bg-white',
        isDragging ? 'opacity-55 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.3)]' : '',
      )}
      onClick={() => onAddItem(item)}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
      }}
      type="button"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{item.label}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
          {item.defaultSize.w}×{item.defaultSize.h}
        </span>
      </div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{item.description}</div>
    </button>
  );
}

function DetailPalettePlainItem({ item, onAddItem }: DetailPaletteCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    data: buildDetailPaletteDragData(item),
    id: createDetailPaletteDraggableId(item.id),
  });

  return (
    <button
      ref={setNodeRef}
      className={clsx(
        'flex w-full items-center gap-3 rounded-[12px] border border-transparent px-2.5 py-2.5 text-left transition-colors hover:border-[color:var(--workspace-accent-border,#8fb0ff)] hover:bg-white',
        item.type === 'groupbox'
          ? 'bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.08))] text-[color:var(--workspace-accent-strong,#3152c8)]'
          : 'bg-transparent text-slate-700',
        isDragging ? 'opacity-55 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.3)]' : '',
      )}
      onClick={() => onAddItem(item)}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
      }}
      type="button"
      {...attributes}
      {...listeners}
    >
      <span className={clsx(
        'material-symbols-outlined text-[16px]',
        item.type === 'groupbox' ? 'text-[color:var(--workspace-accent-strong,#3152c8)]' : 'text-slate-400',
      )}
      >
        {item.type === 'groupbox' ? 'tab_group' : 'drag_indicator'}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.label}</span>
    </button>
  );
}

export function DetailPalette({
  className,
  items = DETAIL_LAYOUT_PALETTE_ITEMS,
  onAddItem,
  title = '控件物料',
  description = '支持点击添加，也支持用 dnd-kit 从左侧拖入中间画布。',
  variant = 'cards',
}: DetailPaletteProps) {
  const isPlainVariant = variant === 'plain';

  return (
    <aside className={clsx(
      isPlainVariant
        ? 'flex flex-col gap-3 rounded-[18px] border border-slate-200/80 bg-[#f8fafd] p-3 shadow-none'
        : 'flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_24px_44px_-36px_rgba(15,23,42,0.28)]',
      className,
    )}>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Palette</div>
        <h3 className={clsx('mt-2 font-bold text-slate-900', isPlainVariant ? 'text-[15px]' : 'text-lg')}>{title}</h3>
        <p className={clsx('mt-1 text-slate-500', isPlainVariant ? 'text-[12px] leading-5' : 'text-sm leading-6')}>{description}</p>
      </div>

      <div className={clsx(isPlainVariant ? 'grid gap-1.5' : 'grid gap-2')}>
        {items.map((item) => (
          <Fragment key={item.id}>
            {isPlainVariant ? (
              <DetailPalettePlainItem
                item={item}
                onAddItem={onAddItem}
              />
            ) : (
              <DetailPaletteCard
                item={item}
                onAddItem={onAddItem}
              />
            )}
          </Fragment>
        ))}
      </div>
    </aside>
  );
}
