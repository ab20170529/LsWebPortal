import { type Dispatch, type MutableRefObject, type SetStateAction, useCallback } from 'react';

type BuilderFns = {
  buildBillHeaderWorkbenchConfig: () => any;
  buildDefaultBillDetailConfig: () => any;
  buildDefaultLeftTableConfig: () => any;
  buildDefaultMainTableConfig: () => any;
};

type InitialState = {
  initialDetailPreview: boolean;
  initialWorkspaceTheme: string;
};

type ResetFns = {
  clearResizePreview: () => void;
  resetBillSourceState: () => void;
  resetGridMenuSelectionState: () => void;
  resetRestrictionState: () => void;
};

type ResetRefs = {
  moduleSettingFullscreenInitRef: MutableRefObject<boolean>;
};

type ResetSetters = {
  setActiveResize: Dispatch<SetStateAction<any>>;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setBillDetailColumns: Dispatch<SetStateAction<any[]>>;
  setBillDetailConfig: Dispatch<SetStateAction<any>>;
  setBillDocumentTone: Dispatch<SetStateAction<string>>;
  setBillHeaderWorkbenchConfig: Dispatch<SetStateAction<any>>;
  setBillHeaderWorkbenchDrag: Dispatch<SetStateAction<any>>;
  setBillHeaderWorkbenchDropTarget: Dispatch<SetStateAction<any>>;
  setBillMetaFields: Dispatch<SetStateAction<any[]>>;
  setBuilderSelectionContextMenu: Dispatch<SetStateAction<any>>;
  setDetailBoardClipboardIds: Dispatch<SetStateAction<string[]>>;
  setDetailBoardOpenedRowId: Dispatch<SetStateAction<number | null>>;
  setDetailBoardSortColumnId: Dispatch<SetStateAction<string | null>>;
  setDetailFilterFields: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTabConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTableColumns: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTabs: Dispatch<SetStateAction<Array<{ id: string; name: string }>>>;
  setDocumentConditionScope: Dispatch<SetStateAction<'main' | 'left'>>;
  setInspectorPanelTab: Dispatch<SetStateAction<'common' | 'advanced' | 'contextmenu' | 'color'>>;
  setInspectorTarget: Dispatch<SetStateAction<any>>;
  setIsArchiveLayoutEditorOpen: Dispatch<SetStateAction<boolean>>;
  setIsDetailBoardOpen: Dispatch<SetStateAction<boolean>>;
  setIsMainHiddenColumnsModalOpen: Dispatch<SetStateAction<boolean>>;
  setLeftFilterFields: Dispatch<SetStateAction<any[]>>;
  setLeftTableColumns: Dispatch<SetStateAction<any[]>>;
  setLeftTableConfig: Dispatch<SetStateAction<any>>;
  setLongTextEditorState: Dispatch<SetStateAction<any>>;
  setMainFilterFields: Dispatch<SetStateAction<any[]>>;
  setMainHiddenColumnsSearchText: Dispatch<SetStateAction<string>>;
  setMainTableColumns: Dispatch<SetStateAction<any[]>>;
  setMainTableConfig: Dispatch<SetStateAction<any>>;
  setPreviewContextMenu: Dispatch<SetStateAction<any>>;
  setSelectedArchiveNodeId: Dispatch<SetStateAction<string>>;
  setSelectedDetailBoardGroupId: Dispatch<SetStateAction<string | null>>;
  setSelectedDetailColorRuleId: Dispatch<SetStateAction<string | null>>;
  setSelectedDetailContextMenuId: Dispatch<SetStateAction<string | null>>;
  setSelectedDetailFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedDetailForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedLeftFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedLeftForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainHiddenColumnIds: Dispatch<SetStateAction<string[]>>;
  setWorkspaceTheme: Dispatch<SetStateAction<string>>;
  setActiveDetailBoardHeightResize: Dispatch<SetStateAction<any>>;
  setActiveDetailBoardResize: Dispatch<SetStateAction<any>>;
};

export function useDashboardModuleDesignerReset({
  builders,
  initialState,
  resetFns,
  refs,
  setters,
}: {
  builders: BuilderFns;
  initialState: InitialState;
  resetFns: ResetFns;
  refs: ResetRefs;
  setters: ResetSetters;
}) {
  const moduleSettingFullscreenInitRef = refs.moduleSettingFullscreenInitRef;

  return useCallback(() => {
    setters.setLeftTableColumns([]);
    setters.setLeftTableConfig(builders.buildDefaultLeftTableConfig());
    setters.setLeftFilterFields([]);
    setters.setMainTableColumns([]);
    setters.setIsMainHiddenColumnsModalOpen(false);
    setters.setSelectedMainHiddenColumnIds([]);
    setters.setMainHiddenColumnsSearchText('');
    setters.setDetailTabs([]);
    setters.setActiveTab('');
    setters.setMainTableConfig(builders.buildDefaultMainTableConfig());
    setters.setDetailTableConfigs({});
    setters.setMainFilterFields([]);
    setters.setDetailFilterFields({});
    setters.setDetailTabConfigs({});
    resetFns.resetGridMenuSelectionState();
    setters.setSelectedDetailContextMenuId(null);
    setters.setSelectedDetailColorRuleId(null);
    setters.setSelectedLeftForDelete([]);
    setters.setSelectedMainForDelete([]);
    setters.setSelectedLeftFiltersForDelete([]);
    setters.setSelectedMainFiltersForDelete([]);
    setters.setDetailTableColumns({});
    setters.setSelectedDetailForDelete([]);
    setters.setSelectedDetailFiltersForDelete([]);
    setters.setSelectedArchiveNodeId('archive-main');
    resetFns.resetBillSourceState();
    setters.setBillDetailColumns([]);
    setters.setBillDetailConfig(builders.buildDefaultBillDetailConfig());
    setters.setBillMetaFields([]);
    resetFns.resetRestrictionState();
    setters.setDocumentConditionScope('main');
    setters.setBillHeaderWorkbenchConfig(builders.buildBillHeaderWorkbenchConfig());
    setters.setBillDocumentTone('blue');
    resetFns.clearResizePreview();
    setters.setActiveResize(null);
    setters.setIsDetailBoardOpen(initialState.initialDetailPreview);
    setters.setDetailBoardSortColumnId(null);
    setters.setDetailBoardOpenedRowId(initialState.initialDetailPreview ? 1 : null);
    setters.setSelectedDetailBoardGroupId(null);
    setters.setWorkspaceTheme(initialState.initialWorkspaceTheme);
    setters.setDetailBoardClipboardIds([]);
    setters.setActiveDetailBoardResize(null);
    setters.setActiveDetailBoardHeightResize(null);
    setters.setPreviewContextMenu(null);
    setters.setBuilderSelectionContextMenu(null);
    setters.setLongTextEditorState(null);
    setters.setBillHeaderWorkbenchDrag(null);
    setters.setBillHeaderWorkbenchDropTarget(null);
    setters.setIsArchiveLayoutEditorOpen(false);
    setters.setInspectorTarget({ kind: 'main-grid' });
    setters.setInspectorPanelTab('common');
    moduleSettingFullscreenInitRef.current = false;
  }, [
    builders,
    initialState.initialDetailPreview,
    initialState.initialWorkspaceTheme,
    moduleSettingFullscreenInitRef,
    resetFns,
    setters,
  ]);
}
