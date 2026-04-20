import React, { type Dispatch, type SetStateAction } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type LongTextEditorState = {
  title: string;
  placeholder?: string;
  draft: string;
  onSave: (value: string) => void;
};

type LongTextEditorModalProps = {
  onStateChange: Dispatch<SetStateAction<LongTextEditorState | null>>;
  state: LongTextEditorState | null;
};

export function LongTextEditorModal({
  onStateChange,
  state,
}: LongTextEditorModalProps) {
  if (!state) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[78] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-sm"
        onClick={() => onStateChange(null)}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.99))] shadow-[0_40px_96px_-32px_rgba(15,23,42,0.42)] dark:border-slate-700 dark:bg-slate-900/96"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-4 dark:border-slate-700">
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{state.title}</div>
              <div className="mt-1 text-[12px] text-slate-400">长内容直接在这里编辑，保存后会回写到当前配置项。</div>
            </div>
            <button
              type="button"
              onClick={() => onStateChange(null)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 px-5 py-4">
            <textarea
              rows={20}
              value={state.draft}
              onChange={(event) => onStateChange((prev) => (prev ? { ...prev, draft: event.target.value } : prev))}
              placeholder={state.placeholder}
              className="h-full min-h-[420px] w-full resize-none rounded-[22px] border border-slate-200/80 bg-white/94 px-4 py-3 font-mono text-[12px] leading-6 text-slate-700 outline-none transition focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-slate-200/70 px-5 py-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onStateChange(null)}
              className="inline-flex h-10 items-center justify-center rounded-[14px] border border-slate-200/80 bg-white px-4 text-[12px] font-bold text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                state.onSave(state.draft);
                onStateChange(null);
              }}
              className="inline-flex h-10 items-center justify-center rounded-[14px] bg-[color:var(--workspace-accent)] px-4 text-[12px] font-bold text-white shadow-[0_18px_30px_-24px_var(--workspace-accent-shadow)] transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
            >
              保存内容
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
