import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

import { areDetailLayoutDocumentsEqual } from '../detail-layout-designer/utils/layout';
import { ArchiveLayoutFieldLayoutEditor } from './archive-layout-field-layout-editor';
import {
  buildArchiveDetailLayoutDocumentFromDetailBoard,
  buildDetailBoardFieldOptions,
  buildDetailBoardFromDesignerLayout,
  getDetailBoardFieldDefaultSize,
} from './detail-board-layout-designer-adapter';

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
  onUpdateDetailBoard,
  title = '明细表格布局',
}: DetailBoardLayoutModalBridgeProps) {
  const document = React.useMemo(
    () => buildArchiveDetailLayoutDocumentFromDetailBoard(currentDetailBoard, availableGridColumns, normalizeColumn),
    [availableGridColumns, currentDetailBoard, normalizeColumn],
  );
  const fieldOptions = React.useMemo(
    () => buildDetailBoardFieldOptions(availableGridColumns, normalizeColumn),
    [availableGridColumns, normalizeColumn],
  );

  const handleDocumentChange = React.useCallback((nextDocument: ReturnType<typeof buildArchiveDetailLayoutDocumentFromDetailBoard>) => {
    if (areDetailLayoutDocumentsEqual(document, nextDocument)) {
      return;
    }

    onUpdateDetailBoard((current: any) => buildDetailBoardFromDesignerLayout(current, nextDocument));
  }, [document, onUpdateDetailBoard]);

  if (!isOpen) {
    return null;
  }

  if (typeof globalThis.document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-slate-950/42 backdrop-blur-[6px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.985, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-[121] flex h-full w-full items-center justify-center px-4 py-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-[min(940px,calc(100vh-32px))] w-[min(1780px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(242,247,253,0.98))] shadow-[0_40px_90px_-48px_rgba(15,23,42,0.45)]">
            <div className="border-b border-[#dbe5f2] bg-white/88 px-6 py-4 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.3)]">
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

            <div className="min-h-0 flex-1 overflow-auto p-4">
              <ArchiveLayoutFieldLayoutEditor
                document={document}
                fieldOptions={fieldOptions}
                getDefaultSize={(field) => getDetailBoardFieldDefaultSize(normalizeColumn, field)}
                normalizeColumn={normalizeColumn}
                onDocumentChange={handleDocumentChange}
                renderFieldPreview={() => null}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    globalThis.document.body,
  );
});
