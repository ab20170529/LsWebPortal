import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { areDetailLayoutDocumentsEqual } from '../detail-layout-designer/utils/layout';
import { ArchiveLayoutFieldLayoutEditor } from './archive-layout-field-layout-editor';
import {
  buildArchiveLayoutDocumentFromScheme,
  buildArchiveDetailLayoutDocumentFromDetailBoard,
  buildSuggestedArchiveLayoutScheme,
  buildDetailBoardFieldOptions,
  buildDetailBoardFromDesignerLayout,
  getDetailBoardFieldDefaultSize,
  normalizeArchiveLayoutSchemes,
} from './detail-board-layout-designer-adapter';

const ARCHIVE_LAYOUT_TITLE = '基础档案详情布局';
const ARCHIVE_LAYOUT_ENTRY_LABEL = '入口';
const ARCHIVE_LAYOUT_FALLBACK_LABEL = '详情布局';
const ARCHIVE_LAYOUT_MODULE_LABEL = '模块';
const ARCHIVE_LAYOUT_DEFAULT_PREVIEW_WIDTH = 1320;

function hasPersistedDesignerLayout(detailBoard: Record<string, any>) {
  const designerLayout = detailBoard?.designerLayout;
  return designerLayout?.version === 1 && Array.isArray(designerLayout?.items);
}

function maximizeArchivePreviewWorkbenchWidth(document: ReturnType<typeof buildArchiveDetailLayoutDocumentFromDetailBoard>) {
  return {
    ...document,
    items: document.items.map((item) => (
      item.type === 'groupbox' && !item.parentId
        ? { ...item, w: Math.max(Number(item.w) || 0, ARCHIVE_LAYOUT_DEFAULT_PREVIEW_WIDTH) }
        : item
    )),
  };
}

type ArchiveLayoutDesignerBridgeProps = {
  currentDetailBoard: Record<string, any>;
  currentModuleCode: string;
  isOpen: boolean;
  isSaving: boolean;
  mainTableColumns: Record<string, any>[];
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onRequestClose: (context: { detailBoard: Record<string, any>; hasUnsavedChanges: boolean }) => void;
  onSave: (detailBoard: Record<string, any>) => Promise<boolean>;
  renderFieldPreview: (column: Record<string, any>, index: number, scope: string) => React.ReactNode;
};

export const ArchiveLayoutDesignerBridge = React.memo(function ArchiveLayoutDesignerBridge({
  currentDetailBoard,
  currentModuleCode,
  isOpen,
  isSaving,
  mainTableColumns,
  normalizeColumn,
  onRequestClose,
  onSave,
  renderFieldPreview,
}: ArchiveLayoutDesignerBridgeProps) {
  const [draftDetailBoard, setDraftDetailBoard] = React.useState<Record<string, any>>(() => currentDetailBoard);
  const [draftDirty, setDraftDirty] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!draftDirty) {
      setDraftDetailBoard(currentDetailBoard);
    }
  }, [currentDetailBoard, draftDirty, isOpen]);

  const document = React.useMemo(
    () => {
      const nextDocument = buildArchiveDetailLayoutDocumentFromDetailBoard(draftDetailBoard, mainTableColumns, normalizeColumn);
      if (hasPersistedDesignerLayout(draftDetailBoard)) {
        return nextDocument;
      }
      return maximizeArchivePreviewWorkbenchWidth(nextDocument);
    },
    [draftDetailBoard, mainTableColumns, normalizeColumn],
  );
  const fieldOptions = React.useMemo(
    () => buildDetailBoardFieldOptions(mainTableColumns, normalizeColumn),
    [mainTableColumns, normalizeColumn],
  );
  const schemes = React.useMemo(
    () => normalizeArchiveLayoutSchemes(draftDetailBoard?.archiveLayoutSchemes, mainTableColumns),
    [draftDetailBoard?.archiveLayoutSchemes, mainTableColumns],
  );
  const suggestedScheme = React.useMemo(
    () => buildSuggestedArchiveLayoutScheme(mainTableColumns, normalizeColumn),
    [mainTableColumns, normalizeColumn],
  );

  const handleDocumentChange = React.useCallback((nextDocument: ReturnType<typeof buildArchiveDetailLayoutDocumentFromDetailBoard>) => {
    if (areDetailLayoutDocumentsEqual(document, nextDocument)) {
      return;
    }

    setDraftDetailBoard((current) => {
      const nextDetailBoard = buildDetailBoardFromDesignerLayout(current, nextDocument);
      return {
        ...nextDetailBoard,
        archiveLayoutDirty: true,
      };
    });
    setDraftDirty(true);
  }, [document]);
  const handleSchemesChange = React.useCallback((nextSchemes: typeof schemes) => {
    setDraftDetailBoard((current) => ({
      ...current,
      archiveLayoutDirty: true,
      archiveLayoutSchemes: nextSchemes,
    }));
    setDraftDirty(true);
  }, []);
  const buildSchemeDocument = React.useCallback((scheme: (typeof schemes)[number], previewWorkbenchWidth?: number) => (
    buildArchiveLayoutDocumentFromScheme(scheme, mainTableColumns, normalizeColumn, previewWorkbenchWidth)
  ), [mainTableColumns, normalizeColumn]);
  const handleSave = React.useCallback(async () => {
    const nextDetailBoard = {
      ...draftDetailBoard,
      archiveLayoutDirty: draftDirty,
    };
    const success = await onSave(nextDetailBoard);
    if (success) {
      setDraftDetailBoard((current) => ({
        ...current,
        archiveLayoutDirty: false,
      }));
      setDraftDirty(false);
    }
    return success;
  }, [draftDetailBoard, draftDirty, onSave]);
  const handleRequestClose = React.useCallback(() => {
    onRequestClose({
      detailBoard: {
        ...draftDetailBoard,
        archiveLayoutDirty: draftDirty,
      },
      hasUnsavedChanges: draftDirty,
    });
  }, [draftDetailBoard, draftDirty, onRequestClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[79] bg-slate-950/42 backdrop-blur-[6px]"
        onClick={handleRequestClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.985, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex h-full w-full items-center justify-center px-4 py-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-[min(940px,calc(100vh-32px))] w-[min(1780px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(242,247,253,0.98))] shadow-[0_40px_90px_-48px_rgba(15,23,42,0.45)]">
            <div className="border-b border-[#dbe5f2] bg-white/88 px-6 py-4 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.3)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-[12px] border border-[#dbe5ef] bg-[#f8fbff] text-[color:var(--workspace-accent)]">
                      <span className="material-symbols-outlined text-[20px]">dashboard_customize</span>
                    </div>
                    <div className="min-w-0 text-[17px] font-semibold text-slate-900">{ARCHIVE_LAYOUT_TITLE}</div>
                  </div>
                  <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#dbe5ef] bg-[#f8fbff] px-3 py-1.5 text-[11px] font-medium text-slate-500">
                    <span>{ARCHIVE_LAYOUT_ENTRY_LABEL}</span>
                    <span className="text-slate-300">/</span>
                    <span>{currentModuleCode.trim() ? `${ARCHIVE_LAYOUT_MODULE_LABEL} ${currentModuleCode.trim()}` : ARCHIVE_LAYOUT_FALLBACK_LABEL}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSave();
                    }}
                    disabled={isSaving}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] border px-4 text-[12px] font-semibold transition-colors ${
                      isSaving
                        ? 'cursor-wait border-primary/20 bg-primary/10 text-primary'
                        : draftDirty
                          ? 'border-primary/20 bg-primary text-white hover:bg-primary/90'
                          : 'border-[#dbe5ef] bg-white text-slate-700 hover:bg-[#f8fbff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{isSaving ? 'progress_activity' : 'save'}</span>
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestClose}
                    className="inline-flex size-10 items-center justify-center rounded-[12px] border border-[#dbe5ef] bg-white text-slate-500 transition-colors hover:bg-[#f8fbff]"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 p-4">
              <ArchiveLayoutFieldLayoutEditor
                document={document}
                fieldOptions={fieldOptions}
                getDefaultSize={(field) => getDetailBoardFieldDefaultSize(normalizeColumn, field)}
                normalizeColumn={normalizeColumn}
                onDocumentChange={handleDocumentChange}
                onSchemesChange={handleSchemesChange}
                buildSchemeDocument={buildSchemeDocument}
                renderFieldPreview={renderFieldPreview}
                schemes={schemes}
                suggestedScheme={suggestedScheme}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
