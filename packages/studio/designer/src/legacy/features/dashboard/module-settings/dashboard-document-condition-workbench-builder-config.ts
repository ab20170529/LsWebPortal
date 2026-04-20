import type { useDocumentConditionWorkbench } from './use-document-condition-workbench';

type DocumentConditionWorkbenchInput = Parameters<typeof useDocumentConditionWorkbench>[0];

type DashboardDocumentConditionWorkbenchBuilderConfig = {
  actions: {
    activateConditionPanelSelection: DocumentConditionWorkbenchInput['activateConditionPanelSelection'];
    activateConditionSelection: DocumentConditionWorkbenchInput['activateConditionSelection'];
    deleteSelectedConditions: DocumentConditionWorkbenchInput['deleteSelectedConditions'];
    showToast: DocumentConditionWorkbenchInput['showToast'];
  };
  builders: {
    buildConditionField: DocumentConditionWorkbenchInput['buildConditionField'];
    clampValue: DocumentConditionWorkbenchInput['clampValue'];
  };
  config: {
    maxRows: DocumentConditionWorkbenchInput['maxRows'];
    minRows: DocumentConditionWorkbenchInput['minRows'];
  };
  selection: {
    selectedConditionPanelScope: DocumentConditionWorkbenchInput['selectedConditionPanelScope'];
    selectedLeftFilterId: DocumentConditionWorkbenchInput['selectedLeftFilterId'];
    selectedLeftFiltersForDelete: DocumentConditionWorkbenchInput['selectedLeftFiltersForDelete'];
    selectedMainFilterId: DocumentConditionWorkbenchInput['selectedMainFilterId'];
    selectedMainFiltersForDelete: DocumentConditionWorkbenchInput['selectedMainFiltersForDelete'];
  };
  setters: {
    setDocumentConditionScope: DocumentConditionWorkbenchInput['setDocumentConditionScope'];
    setLeftFilterFields: DocumentConditionWorkbenchInput['setLeftFilterFields'];
    setMainFilterFields: DocumentConditionWorkbenchInput['setMainFilterFields'];
    setSelectedArchiveNodeId: DocumentConditionWorkbenchInput['setSelectedArchiveNodeId'];
    setSelectedLeftFiltersForDelete: DocumentConditionWorkbenchInput['setSelectedLeftFiltersForDelete'];
    setSelectedMainFiltersForDelete: DocumentConditionWorkbenchInput['setSelectedMainFiltersForDelete'];
  };
  state: {
    documentConditionOwnerFieldKey: DocumentConditionWorkbenchInput['documentConditionOwnerFieldKey'];
    documentConditionOwnerSourceId: DocumentConditionWorkbenchInput['documentConditionOwnerSourceId'];
    documentConditionScope: DocumentConditionWorkbenchInput['documentConditionScope'];
    isTreePaneVisible: DocumentConditionWorkbenchInput['isTreePaneVisible'];
    leftFilterFields: DocumentConditionWorkbenchInput['leftFilterFields'];
    mainFilterFields: DocumentConditionWorkbenchInput['mainFilterFields'];
    treeRelationColumn: DocumentConditionWorkbenchInput['treeRelationColumn'];
  };
};

export function buildDashboardDocumentConditionWorkbenchBuilderConfig({
  actions,
  builders,
  config,
  selection,
  setters,
  state,
}: DashboardDocumentConditionWorkbenchBuilderConfig): DocumentConditionWorkbenchInput {
  return {
    ...actions,
    ...builders,
    ...config,
    ...selection,
    ...setters,
    ...state,
  };
}
