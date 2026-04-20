import { type Dispatch, type SetStateAction, useCallback } from 'react';

import { type GridOperationActionKey } from './grid-operation-config';

type DetailFillTypeOption = {
  value: string;
};

type InspectorTarget = {
  kind: string;
  id?: string | null;
};

export function useDashboardSelectionActions({
  activeTab,
  currentDetailFillTypeValue,
  detailFillTypeOptions,
  setBuilderSelectionContextMenu,
  setInspectorPanelTab,
  setInspectorTarget,
  setSelectedArchiveNodeId,
}: {
  activeTab: string;
  currentDetailFillTypeValue: string;
  detailFillTypeOptions: DetailFillTypeOption[];
  setBuilderSelectionContextMenu: (value: null) => void;
  setInspectorPanelTab: (tab: 'common') => void;
  setInspectorTarget: Dispatch<SetStateAction<InspectorTarget>>;
  setSelectedArchiveNodeId: Dispatch<SetStateAction<string>>;
}) {
  const isDetailFillTypeValue = useCallback((value: string | null | undefined) => (
    detailFillTypeOptions.some((option) => option.value === value)
  ), [detailFillTypeOptions]);

  const activateColumnSelection = useCallback((scope: 'left' | 'main' | 'detail', columnId: string | null) => {
    setBuilderSelectionContextMenu(null);
    const nextKind = scope === 'left' ? 'left-col' : scope === 'main' ? 'main-col' : 'detail-col';
    setInspectorTarget((prev) => (prev.kind === nextKind && prev.id === columnId ? prev : {
      kind: nextKind,
      id: columnId,
    }));
  }, [setBuilderSelectionContextMenu, setInspectorTarget]);

  const activateConditionSelection = useCallback((scope: 'left' | 'main' | 'detail', conditionId: string | null) => {
    setBuilderSelectionContextMenu(null);
    if (!conditionId) {
      setInspectorTarget((prev) => (prev.kind === 'none' ? prev : { kind: 'none' }));
      return;
    }

    const nextKind = scope === 'left' ? 'left-filter' : scope === 'main' ? 'main-filter' : 'detail-filter';
    setInspectorTarget((prev) => (prev.kind === nextKind && prev.id === conditionId ? prev : {
      kind: nextKind,
      id: conditionId,
    }));
  }, [setBuilderSelectionContextMenu, setInspectorTarget]);

  const activateConditionPanelSelection = useCallback((scope: 'left' | 'main') => {
    setBuilderSelectionContextMenu(null);
    setSelectedArchiveNodeId(scope === 'left' ? 'archive-left-filter' : 'archive-filter');
    const nextKind = scope === 'left' ? 'left-filter-panel' : 'main-filter-panel';
    setInspectorTarget((prev) => (prev.kind === nextKind ? prev : { kind: nextKind }));
  }, [
    setBuilderSelectionContextMenu,
    setInspectorTarget,
    setSelectedArchiveNodeId,
  ]);

  const activateTableConfigSelection = useCallback((
    scope: 'left' | 'main' | 'detail',
    targetId?: string | null,
  ) => {
    setBuilderSelectionContextMenu(null);
    const nextKind = scope === 'left' ? 'left-grid' : scope === 'main' ? 'main-grid' : 'detail-grid';
    setInspectorTarget((prev) => {
      const resolvedDetailId = scope === 'detail'
        ? (
            isDetailFillTypeValue(targetId)
              ? targetId
              : isDetailFillTypeValue(prev.id)
                ? prev.id
                : currentDetailFillTypeValue
          )
        : undefined;

      return prev.kind === nextKind && prev.id === resolvedDetailId
        ? prev
        : {
            kind: nextKind,
            ...(resolvedDetailId ? { id: resolvedDetailId } : {}),
          };
    });
  }, [
    currentDetailFillTypeValue,
    isDetailFillTypeValue,
    setBuilderSelectionContextMenu,
    setInspectorTarget,
  ]);

  const activateGridActionSelection = useCallback((
    scope: 'main' | 'detail',
    actionKey: GridOperationActionKey,
  ) => {
    setBuilderSelectionContextMenu(null);
    setInspectorPanelTab('common');
    setSelectedArchiveNodeId(scope === 'main' ? 'archive-main' : `detail-${activeTab}`);
    const nextKind = scope === 'main' ? 'main-grid-action' : 'detail-grid-action';
    setInspectorTarget((prev) => (
      prev.kind === nextKind && prev.id === actionKey
        ? prev
        : {
            kind: nextKind,
            id: actionKey,
          }
    ));
  }, [
    activeTab,
    setBuilderSelectionContextMenu,
    setInspectorPanelTab,
    setInspectorTarget,
    setSelectedArchiveNodeId,
  ]);

  return {
    activateColumnSelection,
    activateConditionPanelSelection,
    activateConditionSelection,
    activateGridActionSelection,
    activateTableConfigSelection,
  };
}
