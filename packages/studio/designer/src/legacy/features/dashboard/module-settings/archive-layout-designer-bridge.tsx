import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { LegacyDefinitionLayoutWorkbench } from './legacy-definition-layout-workbench';

const ARCHIVE_LAYOUT_TITLE = '\u57fa\u7840\u6863\u6848\u8be6\u60c5\u5e03\u5c40';
const ARCHIVE_LAYOUT_ENTRY_LABEL = '\u5165\u53e3';
const ARCHIVE_LAYOUT_FALLBACK_LABEL = '\u8be6\u60c5\u5e03\u5c40';
const ARCHIVE_LAYOUT_MODULE_LABEL = '\u6a21\u5757';

type ArchiveLayoutDesignerBridgeProps = {
  currentDetailBoard: Record<string, any>;
  currentModuleCode: string;
  isDirty: boolean;
  isOpen: boolean;
  isSaving: boolean;
  mainTableColumns: Record<string, any>[];
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onClose: () => void;
  onSave: () => Promise<boolean>;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
};

export const ArchiveLayoutDesignerBridge = React.memo(function ArchiveLayoutDesignerBridge({
  currentDetailBoard,
  currentModuleCode,
  isDirty,
  isOpen,
  isSaving,
  mainTableColumns,
  normalizeColumn,
  onClose,
  onSave,
  onUpdateDetailBoard,
}: ArchiveLayoutDesignerBridgeProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const handleUpdateDetailBoard = useCallback((patch: Record<string, any> | ((current: any) => any)) => {
    onUpdateDetailBoard((current: any) => {
      const next = typeof patch === 'function'
        ? patch(current)
        : {
          ...current,
          ...patch,
        };

      return {
        ...next,
        archiveLayoutDirty: true,
      };
    });
  }, [onUpdateDetailBoard]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[79] bg-slate-950/38 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex h-screen w-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f2f7fd_100%)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[#dbe5f2] bg-white/88 px-6 py-4 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.3)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-[12px] border border-[#dbe5ef] bg-[#f8fbff] text-[color:var(--workspace-accent)]">
                    <span className="material-symbols-outlined text-[20px]">dashboard_customize</span>
                  </div>
                  <div className="min-w-0 text-[17px] font-semibold text-slate-900">{ARCHIVE_LAYOUT_TITLE}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#dbe5ef] bg-[#f8fbff] px-3 py-2 text-[11px] font-medium text-slate-500">
                  <span>{ARCHIVE_LAYOUT_ENTRY_LABEL}</span>
                  <span className="text-slate-300">/</span>
                  <span>{currentModuleCode.trim() ? `${ARCHIVE_LAYOUT_MODULE_LABEL} ${currentModuleCode.trim()}` : ARCHIVE_LAYOUT_FALLBACK_LABEL}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void onSave();
                  }}
                  disabled={isSaving || !isDirty}
                  className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] border px-4 text-[12px] font-semibold transition-colors ${
                    isSaving
                      ? 'cursor-wait border-primary/20 bg-primary/10 text-primary'
                      : isDirty
                        ? 'border-primary/20 bg-primary text-white hover:bg-primary/90'
                        : 'cursor-not-allowed border-[#dbe5ef] bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{isSaving ? 'progress_activity' : 'save'}</span>
                  {isSaving ? '\u4fdd\u5b58\u4e2d' : '\u4fdd\u5b58'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-10 items-center justify-center rounded-[12px] border border-[#dbe5ef] bg-white text-slate-500 transition-colors hover:bg-[#f8fbff]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4 md:p-5">
            <LegacyDefinitionLayoutWorkbench
              availableColumns={mainTableColumns}
              currentDetailBoard={currentDetailBoard}
              moduleCode={currentModuleCode}
              normalizeColumn={normalizeColumn}
              onUpdateDetailBoard={handleUpdateDetailBoard}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              title={ARCHIVE_LAYOUT_TITLE}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
