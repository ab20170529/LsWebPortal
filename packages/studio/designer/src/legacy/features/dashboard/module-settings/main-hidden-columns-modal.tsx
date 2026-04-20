import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../../components/ui/button';

type MainHiddenColumnsModalProps = {
  hiddenColumns: Record<string, any>[];
  isOpen: boolean;
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onClose: () => void;
  onRestoreAll: () => void;
  onRestoreSelected: () => void;
  onSearchTextChange: (value: string) => void;
  onSelectFilteredResults: (columnIds: string[]) => void;
  onToggleSelection: (columnId: string) => void;
  searchText: string;
  selectedColumnIds: string[];
  workspaceThemeVars: React.CSSProperties;
};

export const MainHiddenColumnsModal = React.memo(function MainHiddenColumnsModal({
  hiddenColumns,
  isOpen,
  normalizeColumn,
  onClose,
  onRestoreAll,
  onRestoreSelected,
  onSearchTextChange,
  onSelectFilteredResults,
  onToggleSelection,
  searchText,
  selectedColumnIds,
  workspaceThemeVars,
}: MainHiddenColumnsModalProps) {
  if (!isOpen) return null;

  const normalizedSearchText = searchText.trim().toLowerCase();
  const filteredHiddenColumns = normalizedSearchText
    ? hiddenColumns.filter((column) => {
        const normalizedColumn = normalizeColumn(column);
        return [
          normalizedColumn.name,
          normalizedColumn.sourceField,
          normalizedColumn.type,
          column.id,
        ].some((value) => String(value || '').toLowerCase().includes(normalizedSearchText));
      })
    : hiddenColumns;
  const selectedCount = selectedColumnIds.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/35 p-6 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          onClick={(event) => event.stopPropagation()}
          style={workspaceThemeVars}
          className="flex h-[78vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.995),rgba(245,248,252,0.985))] shadow-[0_60px_140px_-52px_rgba(15,23,42,0.68)] dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-[color:var(--workspace-accent)] shadow-[0_16px_28px_-24px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-slate-900/58">
                    <span className="material-symbols-outlined text-[18px]">view_column</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[17px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white">详细列</div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                      隐藏列和宽度为 0 的列会集中显示在这里，勾选后可恢复到主表。
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="inline-flex size-11 items-center justify-center rounded-[18px] border border-white/75 bg-white/80 text-slate-500 transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          <div className="scrollbar-none min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,rgba(250,252,255,0.98),rgba(244,247,251,0.96))] px-5 py-4 dark:bg-slate-900">
            {hiddenColumns.length === 0 ? (
              <div className="flex h-full min-h-[240px] items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white/70 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-950/70">
                当前没有可恢复的隐藏列。
              </div>
            ) : (
              <div className="space-y-2">
                <div className="sticky top-0 z-10 rounded-[18px] border border-white/70 bg-white/88 px-4 py-3 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.24)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/86">
                  <label className="relative block">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) => onSearchTextChange(event.target.value)}
                      placeholder="搜索列名、标识或类型"
                      className="h-11 w-full rounded-[14px] border border-slate-200/85 bg-slate-50/90 pl-10 pr-4 text-[13px] text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                    />
                  </label>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    匹配 {filteredHiddenColumns.length} 项，默认不勾选，按需恢复到主表。
                  </div>
                </div>

                {filteredHiddenColumns.length === 0 ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white/70 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-950/70">
                    没有匹配到可恢复的列。
                  </div>
                ) : filteredHiddenColumns.map((column) => {
                  const normalizedColumn = normalizeColumn(column);
                  const isSelected = selectedColumnIds.includes(column.id);
                  const isHidden = normalizedColumn.visible === false;
                  const isZeroWidth = Number(normalizedColumn.width) <= 0;
                  const statusTags = [
                    isHidden ? '隐藏' : null,
                    isZeroWidth ? '宽度 0' : null,
                  ].filter(Boolean) as string[];

                  return (
                    <label
                      key={column.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                        isSelected
                          ? 'border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)]/70'
                          : 'border-slate-200 bg-white/86 hover:bg-white dark:border-slate-700 dark:bg-slate-950/70 dark:hover:bg-slate-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(column.id)}
                        className="mt-1 size-4 rounded border-slate-300 text-[color:var(--workspace-accent)] focus:ring-[color:var(--workspace-accent-soft)]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                            {normalizedColumn.name}
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            {normalizedColumn.type || '文本'}
                          </span>
                          {statusTags.map((tag) => (
                            <span
                              key={`${column.id}-${tag}`}
                              className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>宽度 {Math.max(0, Number(normalizedColumn.width) || 0)}px</span>
                          <span>{normalizedColumn.sourceField || column.id}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              已选 {selectedCount} 项，共 {hiddenColumns.length} 项隐藏列
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-xl border-slate-200/80 bg-white/80 px-4 text-[12px] font-semibold text-slate-600"
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-xl border-slate-200/80 bg-white/80 px-4 text-[12px] font-semibold text-slate-600"
                onClick={() => onSelectFilteredResults(filteredHiddenColumns.map((column) => column.id))}
                disabled={filteredHiddenColumns.length === 0}
              >
                全选结果
              </Button>
              <Button
                variant="secondary"
                className="h-9 rounded-xl px-4 text-[12px] font-semibold"
                onClick={onRestoreSelected}
                disabled={selectedCount === 0}
              >
                恢复选中
              </Button>
              <Button
                className="h-9 rounded-xl px-4 text-[12px] font-semibold"
                onClick={onRestoreAll}
                disabled={hiddenColumns.length === 0}
              >
                全部恢复
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
