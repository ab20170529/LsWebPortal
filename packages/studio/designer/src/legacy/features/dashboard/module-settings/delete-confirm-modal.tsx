import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type DeleteConfirmModalProps = {
  isDeleting: boolean;
  menuKey: string;
  menuTitle: string;
  moduleTypeBusinessType?: string;
  moduleTypeLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

export function DeleteConfirmModal({
  isDeleting,
  menuKey,
  menuTitle,
  moduleTypeBusinessType,
  moduleTypeLabel,
  onCancel,
  onConfirm,
  open,
}: DeleteConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/28 px-4 backdrop-blur-[6px]"
        onClick={() => {
          if (!isDeleting) {
            onCancel();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="module-delete-dialog-title"
          className="w-full max-w-[480px] rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,251,255,0.96))] p-6 shadow-[0_36px_90px_-42px_rgba(15,23,42,0.6)] dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[18px] border border-rose-200 bg-rose-50 text-rose-500 shadow-[0_12px_24px_-20px_rgba(244,63,94,0.6)] dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-rose-500 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                危险操作
              </div>
              <div className="space-y-1">
                <h3 id="module-delete-dialog-title" className="text-[22px] font-black tracking-tight text-slate-900 dark:text-white">
                  确认删除模块
                </h3>
                <p className="text-[13px] leading-6 text-slate-500 dark:text-slate-300">
                  删除后，这个二级菜单对应的模块配置会被永久移除，当前操作不可恢复。请确认该模块已经不再使用。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-white/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-slate-700 dark:bg-slate-900/70">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="text-[12px] font-bold tracking-[0.16em] text-slate-400">模块名称</span>
                <span className="text-right text-[14px] font-bold text-slate-900 dark:text-white">{menuTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="text-[12px] font-bold tracking-[0.16em] text-slate-400">模块类型</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[12px] font-bold text-sky-600 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300">
                  <span className="material-symbols-outlined text-[15px]">
                    {moduleTypeBusinessType === 'table' ? 'table_view' : 'article'}
                  </span>
                  {moduleTypeLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] font-bold tracking-[0.16em] text-slate-400">模块标识</span>
                <code className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[12px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {menuKey}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className={`inline-flex min-w-[108px] items-center justify-center rounded-2xl border px-4 py-3 text-[13px] font-bold transition-all ${
                isDeleting
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white'
              }`}
            >
              取消
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className={`inline-flex min-w-[132px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-bold text-white shadow-[0_20px_40px_-24px_rgba(244,63,94,0.72)] transition-all ${
                isDeleting
                  ? 'cursor-not-allowed bg-rose-300 dark:bg-rose-900'
                  : 'bg-rose-500 hover:bg-rose-600 dark:bg-rose-500 dark:hover:bg-rose-400'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDeleting ? 'progress_activity' : 'delete'}
              </span>
              {isDeleting ? '删除中...' : '确认删除'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
