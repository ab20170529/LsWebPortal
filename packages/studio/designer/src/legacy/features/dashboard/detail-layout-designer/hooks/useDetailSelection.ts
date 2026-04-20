import { useCallback, useMemo, useState } from 'react';

import type { DetailLayoutItem, DetailLayoutSelectionState } from '../types';

export function useDetailSelection(items: DetailLayoutItem[], initialSelectedId: string | null = null) {
  const [selection, setSelection] = useState<DetailLayoutSelectionState>({
    selectedId: initialSelectedId,
  });
  const selectedId = useMemo(() => {
    if (!selection.selectedId) {
      return null;
    }

    return items.some((item) => item.id === selection.selectedId)
      ? selection.selectedId
      : null;
  }, [items, selection.selectedId]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const selectItem = useCallback((itemId: string | null) => {
    setSelection({ selectedId: itemId });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection({ selectedId: null });
  }, []);

  return {
    selectedId,
    selectedItem,
    clearSelection,
    selectItem,
  };
}
