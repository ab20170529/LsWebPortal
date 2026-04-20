import { type Dispatch, type SetStateAction, useCallback } from 'react';

type WorkbenchScope = 'left' | 'main' | 'detail';
type InspectorTarget = {
  kind: string;
  id?: string | null;
};

export function useDashboardWorkbenchEditActions({
  activeTab,
  buildDetailTabConfig,
  buildGridConfig,
  businessType,
  detailTabs,
  selectedDetailTabId,
  setBillDetailColumns,
  setBillMetaFields,
  setBuilderSelectionContextMenu,
  setDetailFilterFields,
  setDetailTabConfigs,
  setDetailTableColumns,
  setDetailTableConfigs,
  setDetailTabs,
  setInspectorPanelTab,
  setInspectorTarget,
  setLeftFilterFields,
  setLeftTableColumns,
  setMainFilterFields,
  setMainTableColumns,
  setSelectedArchiveNodeId,
  setSelectedDetailFiltersForDelete,
  setSelectedDetailForDelete,
  setSelectedLeftFiltersForDelete,
  setSelectedLeftForDelete,
  setSelectedMainFiltersForDelete,
  setSelectedMainForDelete,
  setActiveTab,
}: {
  activeTab: string;
  buildDetailTabConfig: (options: { tabKey: string; detailName: string }) => any;
  buildGridConfig: (tableName: string, sourceTableName: string, overrides?: any) => any;
  businessType: string;
  detailTabs: Array<{ id: string; name: string }>;
  selectedDetailTabId: string | null;
  setBillDetailColumns: Dispatch<SetStateAction<any[]>>;
  setBillMetaFields: Dispatch<SetStateAction<any[]>>;
  setBuilderSelectionContextMenu: (value: null) => void;
  setDetailFilterFields: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTabConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTableColumns: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTabs: Dispatch<SetStateAction<Array<{ id: string; name: string }>>>;
  setInspectorPanelTab: (tab: 'common') => void;
  setInspectorTarget: Dispatch<SetStateAction<InspectorTarget>>;
  setLeftFilterFields: Dispatch<SetStateAction<any[]>>;
  setLeftTableColumns: Dispatch<SetStateAction<any[]>>;
  setMainFilterFields: Dispatch<SetStateAction<any[]>>;
  setMainTableColumns: Dispatch<SetStateAction<any[]>>;
  setSelectedArchiveNodeId: Dispatch<SetStateAction<string>>;
  setSelectedDetailFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedDetailForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedLeftFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedLeftForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainForDelete: Dispatch<SetStateAction<string[]>>;
  setActiveTab: Dispatch<SetStateAction<string>>;
}) {
  const clearDeletedColumnInspectorTarget = useCallback((scope: WorkbenchScope, targetIds: string[]) => {
    setInspectorTarget((prev: InspectorTarget) => {
      if (scope === 'left' && prev.kind === 'left-col' && prev.id && targetIds.includes(prev.id)) {
        return { kind: 'none' };
      }
      if (scope === 'main' && prev.kind === 'main-col' && prev.id && targetIds.includes(prev.id)) {
        return { kind: 'none' };
      }
      if (scope === 'detail' && prev.kind === 'detail-col' && prev.id && targetIds.includes(prev.id)) {
        return { kind: 'none' };
      }
      return prev;
    });
  }, [setInspectorTarget]);

  const clearDeletedConditionInspectorTarget = useCallback((scope: WorkbenchScope, targetIds: string[]) => {
    setInspectorTarget((prev: InspectorTarget) => {
      if (scope === 'left' && prev.kind === 'left-filter' && prev.id && targetIds.includes(prev.id)) {
        return { kind: 'none' };
      }
      if (scope === 'main' && prev.kind === 'main-filter' && prev.id && targetIds.includes(prev.id)) {
        return { kind: 'none' };
      }
      if (scope === 'detail' && prev.kind === 'detail-filter' && prev.id && targetIds.includes(prev.id)) {
        return { kind: 'none' };
      }
      return prev;
    });
  }, [setInspectorTarget]);

  const deleteSelectedColumns = useCallback((scope: WorkbenchScope, ids: string[]) => {
    const targetIds = Array.from(new Set(ids.filter(Boolean)));
    if (targetIds.length === 0) return;

    if (scope === 'left') {
      setLeftTableColumns((prev) => prev.filter((column) => !targetIds.includes(column.id)));
      setSelectedLeftForDelete([]);
    }

    if (scope === 'main') {
      setMainTableColumns((prev) => prev.filter((column) => !targetIds.includes(column.id)));
      if (businessType === 'table') {
        setBillMetaFields((prev) => prev.filter((column) => !targetIds.includes(column.id)));
      }
      setSelectedMainForDelete([]);
    }

    if (scope === 'detail') {
      if (businessType === 'table') {
        setBillDetailColumns((prev) => prev.filter((column) => !targetIds.includes(column.id)));
      } else {
        setDetailTableColumns((prev) => ({
          ...prev,
          [activeTab]: (prev[activeTab] || []).filter((column) => !targetIds.includes(column.id)),
        }));
      }
      setSelectedDetailForDelete([]);
    }

    setBuilderSelectionContextMenu(null);
    clearDeletedColumnInspectorTarget(scope, targetIds);
  }, [
    activeTab,
    businessType,
    clearDeletedColumnInspectorTarget,
    setBillDetailColumns,
    setBillMetaFields,
    setBuilderSelectionContextMenu,
    setDetailTableColumns,
    setLeftTableColumns,
    setMainTableColumns,
    setSelectedDetailForDelete,
    setSelectedLeftForDelete,
    setSelectedMainForDelete,
  ]);

  const deleteSelectedConditions = useCallback((scope: WorkbenchScope, ids: string[]) => {
    const targetIds = Array.from(new Set(ids.filter(Boolean)));
    if (targetIds.length === 0) return;

    if (scope === 'left') {
      setLeftFilterFields((prev) => prev.filter((field) => !targetIds.includes(field.id)));
      setSelectedLeftFiltersForDelete([]);
    }

    if (scope === 'main') {
      setMainFilterFields((prev) => prev.filter((field) => !targetIds.includes(field.id)));
      setSelectedMainFiltersForDelete([]);
    }

    if (scope === 'detail') {
      setDetailFilterFields((prev) => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).filter((field) => !targetIds.includes(field.id)),
      }));
      setSelectedDetailFiltersForDelete([]);
    }

    setBuilderSelectionContextMenu(null);
    clearDeletedConditionInspectorTarget(scope, targetIds);
  }, [
    activeTab,
    clearDeletedConditionInspectorTarget,
    setBuilderSelectionContextMenu,
    setDetailFilterFields,
    setLeftFilterFields,
    setMainFilterFields,
    setSelectedDetailFiltersForDelete,
    setSelectedLeftFiltersForDelete,
    setSelectedMainFiltersForDelete,
  ]);

  const addTab = useCallback(() => {
    const newId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `tab_${crypto.randomUUID()}`
      : `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nextTabName = `明细 ${detailTabs.length + 1}`;

    setDetailTabs((prev) => [...prev, { id: newId, name: nextTabName }]);
    setDetailFilterFields((prev) => ({
      ...prev,
      [newId]: prev[newId] ?? [],
    }));
    setDetailTabConfigs((prev) => ({
      ...prev,
      [newId]: prev[newId] ?? buildDetailTabConfig({ tabKey: newId, detailName: nextTabName }),
    }));
    setDetailTableColumns((prev) => ({
      ...prev,
      [newId]: prev[newId] ?? [],
    }));
    setDetailTableConfigs((prev) => ({
      ...prev,
      [newId]: prev[newId] ?? buildGridConfig('', '', {
        sourceCondition: 'parent_id = ${id}',
        contextMenuEnabled: false,
        contextMenuItems: [],
        colorRulesEnabled: false,
        colorRules: [],
      }),
    }));
    setSelectedDetailForDelete([]);
    setSelectedDetailFiltersForDelete([]);
    setActiveTab(newId);
    setInspectorTarget({ kind: 'detail-tab', id: newId });
    setInspectorPanelTab('common');
    setSelectedArchiveNodeId(`detail-${newId}`);
  }, [
    buildDetailTabConfig,
    buildGridConfig,
    detailTabs.length,
    setActiveTab,
    setDetailFilterFields,
    setDetailTabConfigs,
    setDetailTableColumns,
    setDetailTableConfigs,
    setDetailTabs,
    setInspectorPanelTab,
    setInspectorTarget,
    setSelectedArchiveNodeId,
    setSelectedDetailFiltersForDelete,
    setSelectedDetailForDelete,
  ]);

  const removeDetailTab = useCallback((id: string) => {
    const newTabs = detailTabs.filter((tab) => tab.id !== id);
    const fallbackTabId = newTabs[0]?.id ?? '';
    setDetailTabs(newTabs);
    setDetailFilterFields((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDetailTabConfigs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDetailTableColumns((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDetailTableConfigs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeTab === id) {
      setActiveTab(fallbackTabId);
    }
    if (activeTab === id || selectedDetailTabId === id) {
      setInspectorTarget(
        fallbackTabId
          ? { kind: 'detail-tab', id: fallbackTabId }
          : { kind: 'main-grid' },
      );
      setSelectedArchiveNodeId(fallbackTabId ? `detail-${fallbackTabId}` : 'archive-main');
    }
  }, [
    activeTab,
    detailTabs,
    selectedDetailTabId,
    setActiveTab,
    setDetailFilterFields,
    setDetailTabConfigs,
    setDetailTableColumns,
    setDetailTableConfigs,
    setDetailTabs,
    setInspectorTarget,
    setSelectedArchiveNodeId,
  ]);

  return {
    addTab,
    deleteSelectedColumns,
    deleteSelectedConditions,
    removeDetailTab,
  };
}
