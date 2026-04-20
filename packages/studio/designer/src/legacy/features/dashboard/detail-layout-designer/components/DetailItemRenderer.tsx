import clsx from 'clsx';
import type { ReactNode } from 'react';

import { DETAIL_LAYOUT_REGISTRY } from '../registry';
import type { DetailLayoutItem, DetailLayoutMode } from '../types';

type DetailItemRendererProps = {
  className?: string;
  content?: ReactNode;
  item: DetailLayoutItem;
  mode: DetailLayoutMode;
  onSelect?: (itemId: string) => void;
  selected?: boolean;
};

function getPreviewValue(item: DetailLayoutItem) {
  switch (item.type) {
    case 'textarea':
      return '这里显示多行内容预览';
    case 'date':
      return '2026-03-25';
    case 'number':
      return '123.45';
    case 'select':
      return '请选择';
    case 'button':
      return item.title || '按钮';
    case 'label':
      return item.title || '标签';
    default:
      return item.field || item.title || '请输入';
  }
}

export function DetailItemRenderer({ className, content, item, mode, onSelect, selected = false }: DetailItemRendererProps) {
  const registryItem = DETAIL_LAYOUT_REGISTRY[item.type];
  const isAction = item.type === 'button';
  const isLabel = item.type === 'label';

  return (
    <div
      className={clsx(
        'flex h-full flex-col overflow-hidden rounded-[16px] border bg-white shadow-[0_16px_30px_-26px_rgba(15,23,42,0.35)] transition-[border-color,box-shadow,transform] duration-150',
        selected
          ? 'border-[color:var(--workspace-accent,#3162ff)] ring-2 ring-[color:var(--workspace-accent-soft,rgba(49,98,255,0.18))] shadow-[0_26px_46px_-28px_rgba(49,98,255,0.45)]'
          : 'border-slate-200/80',
        mode === 'design' ? 'cursor-default' : 'pointer-events-none',
        className,
      )}
      onMouseDown={() => {
        onSelect?.(item.id);
      }}
    >
      <div className="flex h-full flex-col px-3 py-2.5">
        <div className={clsx('mb-1 flex items-center justify-between gap-2', mode === 'design' ? 'detail-layout-item-handle cursor-move' : '')}>
          <span className="truncate text-[11px] font-semibold text-slate-700">{item.title || registryItem.defaultTitle}</span>
          <div className="flex items-center gap-1.5">
            {selected ? (
              <span className="rounded-full border border-[color:var(--workspace-accent-border,#bfd0ff)] bg-[color:var(--workspace-accent-soft,rgba(49,98,255,0.1))] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--workspace-accent-strong,#3152c8)]">
                已选中
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{registryItem.label}</span>
          </div>
        </div>
        <div
          className={clsx(
            'flex min-h-0 flex-1 items-center rounded-[12px] border px-3 text-[12px]',
            isAction
              ? 'justify-center border-slate-900/5 bg-[color:var(--workspace-accent,#3162ff)] font-semibold text-white'
              : isLabel
                ? 'border-transparent bg-slate-50 text-slate-600'
                : 'border-slate-200/80 bg-slate-50/80 text-slate-500',
            item.type === 'textarea' ? 'items-start py-2 leading-5' : '',
          )}
        >
          {content ?? <span className="truncate">{getPreviewValue(item)}</span>}
        </div>
      </div>
    </div>
  );
}
