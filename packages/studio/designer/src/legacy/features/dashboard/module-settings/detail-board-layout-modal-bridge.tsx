import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { LegacyDefinitionLayoutWorkbench } from './legacy-definition-layout-workbench';

type DetailBoardLayoutModalBridgeProps = {
  availableGridColumns: Record<string, any>[];
  currentDetailBoard: Record<string, any>;
  isOpen: boolean;
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onClose: () => void;
  onOpenPreview: () => void;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
  title?: string;
};

export const DetailBoardLayoutModalBridge = React.memo(function DetailBoardLayoutModalBridge({
  availableGridColumns,
  currentDetailBoard,
  isOpen,
  normalizeColumn,
  onClose,
  onOpenPreview,
  onUpdateDetailBoard,
  selectedGroupId,
  setSelectedGroupId,
  title = '明细表格布局',
}: DetailBoardLayoutModalBridgeProps) {
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
          <div className="border-b border-[#dbe5f2] bg-white/92 px-6 py-4 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.3)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-[12px] border border-[#dbe5ef] bg-[#f8fbff] text-[color:var(--workspace-accent)]">
                  <span className="material-symbols-outlined text-[20px]">table_chart</span>
                </div>
                <div className="text-[17px] font-semibold text-slate-900">{title}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-10 items-center justify-center rounded-[12px] border border-[#dbe5ef] bg-white text-slate-500 transition-colors hover:bg-[#f8fbff]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4 md:p-5">
            <LegacyDefinitionLayoutWorkbench
              availableColumns={availableGridColumns}
              currentDetailBoard={currentDetailBoard}
              normalizeColumn={normalizeColumn}
              onOpenPreview={onOpenPreview}
              onUpdateDetailBoard={onUpdateDetailBoard}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              title={title}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
