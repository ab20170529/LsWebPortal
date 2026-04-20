import { useEffect, type Dispatch, type SetStateAction } from 'react';

const DETAIL_BOARD_CLIPBOARD_PREFIX = '__LS_DETAIL_BOARD_COLUMNS__';

export function parseDetailBoardClipboardColumnIds(text: string, availableColumns: any[]) {
  const availableIds = new Set(availableColumns.map((column) => column.id));

  if (text.startsWith(DETAIL_BOARD_CLIPBOARD_PREFIX)) {
    try {
      const payload = JSON.parse(text.slice(DETAIL_BOARD_CLIPBOARD_PREFIX.length));
      if (Array.isArray(payload?.columnIds)) {
        return payload.columnIds.filter((columnId: string) => availableIds.has(columnId));
      }
    } catch {
      return [];
    }
  }

  const pastedTokens = text
    .split(/[\n,，;；|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (pastedTokens.length === 0) return [];

  const matchedColumns = availableColumns.filter((column) => (
    pastedTokens.includes(column.id) || pastedTokens.includes(column.name)
  ));

  return matchedColumns.map((column) => column.id);
}

export function useDashboardDetailBoardClipboard({
  mainTableColumns,
  selectedMainForDelete,
  setDetailBoardClipboardIds,
  showToast,
}: {
  mainTableColumns: any[];
  selectedMainForDelete: string[];
  setDetailBoardClipboardIds: Dispatch<SetStateAction<string[]>>;
  showToast: (message: string) => void;
}) {
  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (selectedMainForDelete.length === 0) return;

      const copiedIds = Array.from(new Set(
        selectedMainForDelete.filter((id) => mainTableColumns.some((column) => column.id === id)),
      ));
      if (copiedIds.length === 0) return;

      const payload = {
        type: 'detail-board-columns',
        columnIds: copiedIds,
      };

      event.preventDefault();
      event.clipboardData?.setData('text/plain', `${DETAIL_BOARD_CLIPBOARD_PREFIX}${JSON.stringify(payload)}`);
      setDetailBoardClipboardIds(copiedIds);
      showToast(`已复制 ${copiedIds.length} 个主表字段`);
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [
    mainTableColumns,
    selectedMainForDelete,
    setDetailBoardClipboardIds,
    showToast,
  ]);
}
