import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';

import { type ConditionWorkbenchScope } from './condition-workbench';

export function useDashboardDetailWorkspaceSync({
  activeTab,
  businessType,
  currentDetailFillType,
  detailTabs,
  inspectorTarget,
  isTreePaneVisible,
  setActiveTab,
  setBuilderSelectionContextMenu,
  setDocumentConditionScope,
  setInspectorPanelTab,
  setInspectorTarget,
  setPreviewContextMenu,
  setSelectedArchiveNodeId,
  setSelectedDetailFiltersForDelete,
  setSelectedDetailForDelete,
}: {
  activeTab: string;
  businessType: string;
  currentDetailFillType: string;
  detailTabs: Array<{ id: string; name: string }>;
  inspectorTarget: { kind: string; id?: string | null };
  isTreePaneVisible: boolean;
  setActiveTab: (tabId: string) => void;
  setBuilderSelectionContextMenu: (value: null) => void;
  setDocumentConditionScope: Dispatch<SetStateAction<ConditionWorkbenchScope>>;
  setInspectorPanelTab: (tab: 'common') => void;
  setInspectorTarget: Dispatch<SetStateAction<any>>;
  setPreviewContextMenu: (value: null) => void;
  setSelectedArchiveNodeId: (value: string) => void;
  setSelectedDetailFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedDetailForDelete: Dispatch<SetStateAction<string[]>>;
}) {
  useEffect(() => {
    if (businessType === 'table' && detailTabs[0] && activeTab !== detailTabs[0].id) {
      setActiveTab(detailTabs[0].id);
    }
  }, [activeTab, businessType, detailTabs, setActiveTab]);

  useEffect(() => {
    setSelectedDetailForDelete([]);
    setSelectedDetailFiltersForDelete([]);
    setInspectorTarget((prev: { kind?: string }) => {
      if (prev.kind === 'detail-tab') {
        if (!activeTab) {
          return { kind: 'main-grid' };
        }
        return { kind: 'detail-tab', id: activeTab };
      }
      if (prev.kind === 'detail-col' || prev.kind === 'detail-filter' || prev.kind === 'detail-grid') {
        if (!activeTab) {
          return { kind: 'main-grid' };
        }
        return { kind: 'detail-grid', id: currentDetailFillType };
      }
      return prev;
    });
    setBuilderSelectionContextMenu(null);
    setPreviewContextMenu(null);
  }, [
    activeTab,
    currentDetailFillType,
    setBuilderSelectionContextMenu,
    setInspectorTarget,
    setPreviewContextMenu,
    setSelectedDetailFiltersForDelete,
    setSelectedDetailForDelete,
  ]);

  useEffect(() => {
    setInspectorTarget((prev: { kind?: string }) => (prev.kind === 'detail-filter' ? { kind: 'none' } : prev));
  }, [setInspectorTarget]);

  useEffect(() => {
    if (!isTreePaneVisible) {
      setDocumentConditionScope('main');
      return;
    }
    if (inspectorTarget.kind.startsWith('left')) {
      setDocumentConditionScope((prev) => (prev === 'left' ? prev : 'left'));
      return;
    }
    if (inspectorTarget.kind.startsWith('main')) {
      setDocumentConditionScope((prev) => (prev === 'main' ? prev : 'main'));
    }
  }, [
    inspectorTarget.kind,
    isTreePaneVisible,
    setDocumentConditionScope,
  ]);

  const activateDetailWorkbenchTab = useCallback((tabId: string) => {
    setBuilderSelectionContextMenu(null);
    if (activeTab !== tabId) {
      setActiveTab(tabId);
    }
    setInspectorTarget({
      kind: 'detail-tab',
      id: tabId,
    });
    setInspectorPanelTab('common');
    setSelectedArchiveNodeId(`detail-${tabId}`);
  }, [
    activeTab,
    setActiveTab,
    setBuilderSelectionContextMenu,
    setInspectorPanelTab,
    setInspectorTarget,
    setSelectedArchiveNodeId,
  ]);

  return {
    activateDetailWorkbenchTab,
  };
}
