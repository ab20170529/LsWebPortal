import React, { useCallback, useEffect, useState } from 'react';
import {
  shadcnFieldClass,
  shadcnMutedLabelClass,
  shadcnTextareaClass,
} from '../../../components/ui/shadcn-inspector';
import { normalizePopupMenuNumber } from './context-menu-utils';

type PopupMenuItem = Record<string, any>;

type PopupMenuManagerProps = {
  contextMenuItems: PopupMenuItem[];
  enabledMenuCount: number;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onSelectParamKey: (paramKey: string) => void;
  onToggleItemDisabled: (itemId: string, disabled: boolean) => void;
  onUpdateSelectedItem: (patch: Record<string, any>) => void;
  selectedItem: PopupMenuItem | null;
  selectedParamKey: string;
};

const popupMenuParamFields = Array.from({ length: 10 }, (_, index) => ({
  key: `dllpar${index + 1}`,
  label: `参数 ${index + 1}`,
}));

const managerHeaderToolsClass = 'ml-auto flex flex-wrap items-center justify-end gap-2';

function getPopupMenuIconName(value: unknown) {
  if (typeof value !== 'string') return 'right_click';
  const trimmed = value.trim();
  return trimmed && !/[/.:\\]/.test(trimmed) && !/\s/.test(trimmed) ? trimmed : 'right_click';
}

function PopupMenuEditModal({
  item,
  onClose,
  onSelectParamKey,
  onUpdateItem,
  selectedParamKey,
}: {
  item: PopupMenuItem;
  onClose: () => void;
  onSelectParamKey: (paramKey: string) => void;
  onUpdateItem: (patch: Record<string, any>) => void;
  selectedParamKey: string;
}) {
  const displayName = item.menuname || item.label || '未命名菜单';
  const activeParamField = popupMenuParamFields.find((f) => f.key === selectedParamKey) ?? popupMenuParamFields[0];
  const activeParamValue = String(item[activeParamField.key] ?? '');
  const configuredParamCount = popupMenuParamFields.filter((f) => String(item[f.key] ?? '').trim().length > 0).length;
  const updateNumber = (key: string, value: string, fallback = 0) => {
    onUpdateItem({ [key]: value === '' ? fallback : normalizePopupMenuNumber(value, fallback) });
  };

  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-[3px]"
      onClick={handleBackdropClick}
    >
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] dark:border-slate-700 dark:bg-slate-900">
        {/* 顶栏：标题 + 关闭 */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)]">
              <span className="material-symbols-outlined text-[16px]">{getPopupMenuIconName(item.defailtimage)}</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">编辑右键菜单</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">{displayName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 内容区 — 统一滚动 */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mx-auto grid w-full grid-cols-3 gap-6">
            
            {/* 1. 核心配置区 */}
            <section className="flex flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">1</span>
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">核心配置</h4>
              </div>
              <div className="flex flex-1 flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div>
                  <label className={shadcnMutedLabelClass}>菜单名称</label>
                  <input
                    type="text"
                    value={item.menuname ?? item.label ?? ''}
                    onChange={(event) => onUpdateItem({ menuname: event.target.value })}
                    placeholder="菜单名称"
                    className={shadcnFieldClass}
                  />
                </div>
                <div>
                  <label className={shadcnMutedLabelClass}>调用模板名</label>
                  <input
                    type="text"
                    value={item.dllname ?? ''}
                    onChange={(event) => onUpdateItem({ dllname: event.target.value })}
                    placeholder="例如：open_archive_detail"
                    className={`${shadcnFieldClass} font-mono text-[12px]`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={shadcnMutedLabelClass}>右键类型</label>
                    <input type="number" value={item.menuType ?? 0} onChange={(e) => updateNumber('menuType', e.target.value, 0)} className={shadcnFieldClass} />
                  </div>
                  <div>
                    <label className={shadcnMutedLabelClass}>加载方式</label>
                    <input type="number" value={item.showMode ?? 0} onChange={(e) => updateNumber('showMode', e.target.value, 0)} className={shadcnFieldClass} />
                  </div>
                  <div>
                    <label className={shadcnMutedLabelClass}>添加方式</label>
                    <input type="number" value={item.addShowMode ?? 0} onChange={(e) => updateNumber('addShowMode', e.target.value, 0)} className={shadcnFieldClass} />
                  </div>
                  <div>
                    <label className={shadcnMutedLabelClass}>事件类型</label>
                    <input type="number" value={item.actiontype ?? 0} onChange={(e) => updateNumber('actiontype', e.target.value, 0)} className={shadcnFieldClass} />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. 参数配置区 */}
            <section className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">2</span>
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">参数配置</h4>
                </div>
                {configuredParamCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    已配置 {configuredParamCount} 项
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                {/* 顶部：参数列表 (2行5列) */}
                <div className="grid grid-cols-5 gap-1.5">
                  {popupMenuParamFields.map((field, index) => {
                    const hasValue = Boolean(String(item[field.key] ?? '').trim());
                    const isActive = activeParamField.key === field.key;
                    return (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => onSelectParamKey(field.key)}
                        className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-[11px] transition-all ${
                          isActive
                            ? 'bg-[color:var(--workspace-accent)] font-bold text-white shadow-sm'
                            : hasValue
                              ? 'bg-white font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                              : 'text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>P{index + 1}</span>
                        {hasValue && !isActive && <span className="size-1.5 rounded-full bg-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
                {/* 底部：选中参数的编辑器 */}
                <div className="flex min-h-[200px] min-w-0 flex-1 flex-col rounded-lg border border-slate-200/60 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-100">{activeParamField.label}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateItem({ [activeParamField.key]: '' })}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition-colors hover:text-rose-500"
                    >
                      <span className="material-symbols-outlined text-[12px]">ink_eraser</span>
                      清空
                    </button>
                  </div>
                  <textarea
                    value={activeParamValue}
                    onChange={(event) => onUpdateItem({ [activeParamField.key]: event.target.value })}
                    placeholder={`输入 ${activeParamField.label} 值`}
                    className={`${shadcnTextareaClass} h-full min-h-0 flex-1 resize-none font-mono text-[12px]`}
                  />
                </div>
              </div>
            </section>

            {/* 3. 脚本与提示区 */}
            <section className="flex flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">3</span>
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">事件脚本与提示</h4>
              </div>
              <div className="flex flex-1 flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="flex-1">
                  <label className={shadcnMutedLabelClass}>事件脚本</label>
                  <textarea
                    value={item.action ?? ''}
                    onChange={(event) => onUpdateItem({ action: event.target.value })}
                    placeholder="脚本 / 事件表达式"
                    className={`${shadcnTextareaClass} h-full min-h-[120px] font-mono text-[12px]`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={shadcnMutedLabelClass}>执行前提示</label>
                    <textarea rows={2} value={item.beforeMsg ?? ''} onChange={(e) => onUpdateItem({ beforeMsg: e.target.value })} className={`${shadcnTextareaClass} text-[11px]`} />
                  </div>
                  <div>
                    <label className={shadcnMutedLabelClass}>成功提示</label>
                    <textarea rows={2} value={item.msgSuccess ?? ''} onChange={(e) => onUpdateItem({ msgSuccess: e.target.value })} className={`${shadcnTextareaClass} text-[11px]`} />
                  </div>
                  <div>
                    <label className={shadcnMutedLabelClass}>错误提示</label>
                    <textarea rows={2} value={item.msgError ?? ''} onChange={(e) => onUpdateItem({ msgError: e.target.value })} className={`${shadcnTextareaClass} text-[11px]`} />
                  </div>
                  <div>
                    <label className={shadcnMutedLabelClass}>补充说明</label>
                    <textarea rows={2} value={item.Fremark ?? ''} onChange={(e) => onUpdateItem({ Fremark: e.target.value })} className={`${shadcnTextareaClass} text-[11px]`} />
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* 底栏 */}
        <div className="flex shrink-0 items-center justify-end border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[color:var(--workspace-accent)] px-6 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

export const PopupMenuManager = React.memo(function PopupMenuManager({
  contextMenuItems,
  enabledMenuCount,
  onAddItem,
  onDeleteItem,
  onSelectItem,
  onSelectParamKey,
  onToggleItemDisabled,
  onUpdateSelectedItem,
  selectedItem,
  selectedParamKey,
}: PopupMenuManagerProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const editingItem = editingItemId ? contextMenuItems.find((i) => i.id === editingItemId) ?? null : null;

  const handleItemClick = (itemId: string) => {
    onSelectItem(itemId);
    setEditingItemId(itemId);
  };

  return (
    <div className="space-y-0">
      <section className="px-3 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)]">
              <span className="material-symbols-outlined text-[16px]">list_alt</span>
            </div>
            <h4 className="text-[13px] font-bold text-slate-700 dark:text-slate-100">右键菜单</h4>
          </div>
          <div className={managerHeaderToolsClass}>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-bold text-slate-600 dark:text-slate-200">{enabledMenuCount}</span>
              <span>/</span>
              <span>{contextMenuItems.length}</span>
              <span>可用</span>
            </div>
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[color:var(--workspace-accent)] bg-[color:var(--workspace-accent)] px-3 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
            >
              <span className="material-symbols-outlined text-[13px]">add</span>
              新增
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          {contextMenuItems.length > 0 ? contextMenuItems.map((item, index) => {
            const isSelected = selectedItem?.id === item.id;
            const iconName = getPopupMenuIconName(item.defailtimage);
            const isDisabled = Boolean(item.disabled);

            return (
              <div
                key={item.id}
                className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all ${
                  isSelected
                    ? 'border-[color:var(--workspace-accent)]/30 bg-[color:var(--workspace-accent-soft)]/60 shadow-sm'
                    : 'border-transparent bg-slate-50/80 hover:border-slate-200/80 hover:bg-white dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-[color:var(--workspace-accent)] bg-[color:var(--workspace-accent)] text-white'
                      : 'border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)]'
                  }`}>
                    <span className="material-symbols-outlined text-[15px]">{iconName}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-slate-700 dark:text-slate-100">
                      {item.menuname || item.label || `菜单 ${index + 1}`}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                      {item.dllname && <span className="truncate font-mono">{item.dllname}</span>}
                      {isDisabled && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">禁用</span>}
                    </div>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleItemDisabled(item.id, !isDisabled); }}
                    className={`inline-flex size-7 items-center justify-center rounded-lg text-[14px] transition-colors ${
                      !isDisabled
                        ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={isDisabled ? '启用' : '禁用'}
                  >
                    <span className="material-symbols-outlined text-[16px]">{isDisabled ? 'toggle_off' : 'toggle_on'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                    className="inline-flex size-7 items-center justify-center rounded-lg text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    title="删除"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-xl border border-dashed border-slate-200/80 px-4 py-10 text-center dark:border-slate-700">
              <span className="material-symbols-outlined mb-2 text-[28px] text-slate-300 dark:text-slate-600">right_click</span>
              <div className="text-[12px] text-slate-400">还没有配置右键菜单</div>
              <button
                type="button"
                onClick={onAddItem}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:border-[color:var(--workspace-accent)] hover:text-[color:var(--workspace-accent)] dark:border-slate-700 dark:text-slate-400"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                新增菜单
              </button>
            </div>
          )}
        </div>
      </section>

      {editingItem ? (
        <PopupMenuEditModal
          item={editingItem}
          onClose={() => setEditingItemId(null)}
          onSelectParamKey={onSelectParamKey}
          onUpdateItem={onUpdateSelectedItem}
          selectedParamKey={selectedParamKey}
        />
      ) : null}
    </div>
  );
});
