import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';

type DeleteScope = 'left' | 'main' | 'detail';

export function useDashboardInspectorWorkspaceSync({
  activeTab,
  clearBuilderSelectionContextMenu,
  inspectorTarget,
  setInspectorPanelTab,
  setInspectorTarget,
  setSelectedDetailFiltersForDelete,
  setSelectedDetailForDelete,
  setSelectedLeftFiltersForDelete,
  setSelectedLeftForDelete,
  setSelectedMainFiltersForDelete,
  setSelectedMainForDelete,
}: {
  activeTab: string;
  clearBuilderSelectionContextMenu: (value: null) => void;
  inspectorTarget: { kind: string; id?: string | null };
  setInspectorPanelTab: (tab: 'common') => void;
  setInspectorTarget: (target: { kind: 'none' | 'source-grid' }) => void;
  setSelectedDetailFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedDetailForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedLeftFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedLeftForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainForDelete: Dispatch<SetStateAction<string[]>>;
}) {
  const syncScopedDeleteSelection = useCallback((activeScope?: DeleteScope) => {
    setSelectedLeftForDelete((prev) => (activeScope === 'left' || prev.length === 0 ? prev : []));
    setSelectedMainForDelete((prev) => (activeScope === 'main' || prev.length === 0 ? prev : []));
    setSelectedDetailForDelete((prev) => (activeScope === 'detail' || prev.length === 0 ? prev : []));
  }, [
    setSelectedDetailForDelete,
    setSelectedLeftForDelete,
    setSelectedMainForDelete,
  ]);

  const syncScopedFilterDeleteSelection = useCallback((activeScope?: DeleteScope) => {
    setSelectedLeftFiltersForDelete((prev) => (activeScope === 'left' || prev.length === 0 ? prev : []));
    setSelectedMainFiltersForDelete((prev) => (activeScope === 'main' || prev.length === 0 ? prev : []));
    setSelectedDetailFiltersForDelete((prev) => (activeScope === 'detail' || prev.length === 0 ? prev : []));
  }, [
    setSelectedDetailFiltersForDelete,
    setSelectedLeftFiltersForDelete,
    setSelectedMainFiltersForDelete,
  ]);

  useEffect(() => {
    setInspectorPanelTab('common');
  }, [activeTab, inspectorTarget.id, inspectorTarget.kind, setInspectorPanelTab]);

  useEffect(() => {
    if (inspectorTarget.kind === 'left-col') {
      syncScopedDeleteSelection('left');
      syncScopedFilterDeleteSelection();
      return;
    }

    if (inspectorTarget.kind === 'main-col') {
      syncScopedDeleteSelection('main');
      syncScopedFilterDeleteSelection();
      return;
    }

    if (inspectorTarget.kind === 'detail-col') {
      syncScopedDeleteSelection('detail');
      syncScopedFilterDeleteSelection();
      return;
    }

    if (inspectorTarget.kind === 'main-filter') {
      syncScopedDeleteSelection();
      syncScopedFilterDeleteSelection('main');
      return;
    }

    if (inspectorTarget.kind === 'detail-filter') {
      syncScopedDeleteSelection();
      syncScopedFilterDeleteSelection('detail');
      return;
    }

    syncScopedDeleteSelection();
    syncScopedFilterDeleteSelection();
  }, [
    inspectorTarget.id,
    inspectorTarget.kind,
    syncScopedDeleteSelection,
    syncScopedFilterDeleteSelection,
  ]);

  const clearColumnSelection = useCallback(() => {
    syncScopedDeleteSelection();
    syncScopedFilterDeleteSelection();
    clearBuilderSelectionContextMenu(null);
    setInspectorTarget({ kind: 'none' });
  }, [
    clearBuilderSelectionContextMenu,
    setInspectorTarget,
    syncScopedDeleteSelection,
    syncScopedFilterDeleteSelection,
  ]);

  const activateSourceGridSelection = useCallback(() => {
    clearBuilderSelectionContextMenu(null);
    setInspectorTarget({ kind: 'source-grid' });
    setInspectorPanelTab('common');
  }, [
    clearBuilderSelectionContextMenu,
    setInspectorPanelTab,
    setInspectorTarget,
  ]);

  return {
    activateSourceGridSelection,
    clearColumnSelection,
  };
}
