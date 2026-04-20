import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ConfigWizardModalShellProps = {
  bodyNode: React.ReactNode;
  footerNode: React.ReactNode;
  isFullscreenConfigActive: boolean;
  isModulePreviewStep: boolean;
  isModuleSettingStep: boolean;
  onClose: () => void;
  open: boolean;
  overlayNodes?: React.ReactNode;
  sidebarNode: React.ReactNode;
  toastMessage: string | null;
};

export function ConfigWizardModalShell({
  bodyNode,
  footerNode,
  isFullscreenConfigActive,
  isModulePreviewStep,
  isModuleSettingStep,
  onClose,
  open,
  overlayNodes,
  sidebarNode,
  toastMessage,
}: ConfigWizardModalShellProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex overflow-hidden bg-background-light dark:bg-background-dark"
        >
          <AnimatePresence>
            {toastMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 20, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="fixed left-1/2 top-0 z-[300] flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 font-bold text-white shadow-lg"
              >
                <span className="material-symbols-outlined">error</span>
                {toastMessage}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {overlayNodes}
          {sidebarNode}

          <div className="relative flex min-w-0 flex-1 flex-col bg-slate-100/60 dark:bg-slate-900/50">
            <div className="pointer-events-none absolute inset-0 mesh-bg opacity-20"></div>
            {isFullscreenConfigActive ? (
              <div className="absolute right-6 top-6 z-20">
                <button
                  onClick={onClose}
                  className="flex size-11 items-center justify-center rounded-2xl border border-white/80 bg-white/85 text-slate-500 shadow-[0_20px_35px_-24px_rgba(15,23,42,0.45)] transition-all hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            ) : null}

            <div className={`relative z-10 flex flex-1 flex-col ${
              isFullscreenConfigActive
                ? isModulePreviewStep
                  ? 'overflow-hidden p-0'
                  : 'overflow-hidden p-3 lg:p-4'
                : isModuleSettingStep
                  ? 'overflow-hidden p-0'
                  : 'overflow-y-auto p-6 lg:p-8'
            }`}>
              {bodyNode}
            </div>

            {footerNode}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
