import React from 'react';

import { DetailBoardLayoutModalBridge } from './detail-board-layout-modal-bridge';

type DetailBoardLayoutDesignerBridgeProps = {
  availableGridColumns: Record<string, any>[];
  currentDetailBoard: Record<string, any>;
  emptyFieldsNode: React.ReactNode;
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onOpenDetailBoardPreview: (previewRows?: number, sortColumnId?: string | null) => void;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
  selectedDetailBoardGroupId: string | null;
  setSelectedDetailBoardGroupId: (groupId: string | null) => void;
};

export const DetailBoardLayoutDesignerBridge = React.memo(function DetailBoardLayoutDesignerBridge({
  availableGridColumns,
  currentDetailBoard,
  emptyFieldsNode,
  normalizeColumn,
  onOpenDetailBoardPreview,
  onUpdateDetailBoard,
  selectedDetailBoardGroupId,
  setSelectedDetailBoardGroupId,
}: DetailBoardLayoutDesignerBridgeProps) {
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);

  if (availableGridColumns.length === 0) {
    return <>{emptyFieldsNode}</>;
  }

  return (
    <>
      <div className="rounded-[20px] border border-[#dbe5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.96))] p-4 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Layout</div>
            <div className="mt-1 text-[15px] font-semibold text-slate-900">明细表格布局</div>
            <div className="mt-1 text-[12px] text-slate-500">点击后以弹出框方式打开定义设计。</div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-[#dbe5ef] bg-white px-4 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-[#f8fbff]"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            定义设计
          </button>
        </div>
      </div>

      <DetailBoardLayoutModalBridge
        availableGridColumns={availableGridColumns}
        currentDetailBoard={currentDetailBoard}
        isOpen={isEditorOpen}
        normalizeColumn={normalizeColumn}
        onClose={() => setIsEditorOpen(false)}
        onOpenPreview={() => onOpenDetailBoardPreview(1, currentDetailBoard.sortColumnId)}
        onUpdateDetailBoard={onUpdateDetailBoard}
        selectedGroupId={selectedDetailBoardGroupId}
        setSelectedGroupId={setSelectedDetailBoardGroupId}
        title="明细表格布局"
      />
    </>
  );
});
