import { useMemo } from 'react';

import { isGridOperationActionKey, type GridOperationActionKey } from './grid-operation-config';

export function useDashboardInspectorSelectionMeta({
  configStep,
  inspectorTarget,
  isConfigOpen,
  isFullscreenConfig,
  modulePreviewStep,
  moduleSettingStep,
  processDesignStep,
  restrictionStep,
}: {
  configStep: number;
  inspectorTarget: { kind: string; id?: string | null };
  isConfigOpen: boolean;
  isFullscreenConfig: boolean;
  modulePreviewStep: number;
  moduleSettingStep: number;
  processDesignStep: number;
  restrictionStep: number;
}) {
  return useMemo(() => {
    const selectedLeftColId = inspectorTarget.kind === 'left-col' ? inspectorTarget.id ?? null : null;
    const selectedMainColId = inspectorTarget.kind === 'main-col' ? inspectorTarget.id ?? null : null;
    const selectedDetailColId = inspectorTarget.kind === 'detail-col' ? inspectorTarget.id ?? null : null;
    const selectedLeftFilterId = inspectorTarget.kind === 'left-filter' ? inspectorTarget.id ?? null : null;
    const selectedMainFilterId = inspectorTarget.kind === 'main-filter' ? inspectorTarget.id ?? null : null;
    const selectedDetailTabId = inspectorTarget.kind === 'detail-tab' ? inspectorTarget.id ?? null : null;
    const selectedMainGridAction: GridOperationActionKey | null = (
      inspectorTarget.kind === 'main-grid-action' && isGridOperationActionKey(inspectorTarget.id)
        ? inspectorTarget.id
        : null
    );
    const selectedDetailGridAction: GridOperationActionKey | null = (
      inspectorTarget.kind === 'detail-grid-action' && isGridOperationActionKey(inspectorTarget.id)
        ? inspectorTarget.id
        : null
    );
    const selectedTableConfigScope = inspectorTarget.kind === 'left-grid'
      ? 'left'
      : inspectorTarget.kind === 'main-grid'
        ? 'main'
        : inspectorTarget.kind === 'detail-grid'
          ? 'detail'
          : null;
    const selectedConditionPanelScope = inspectorTarget.kind === 'left-filter-panel'
      ? 'left'
      : inspectorTarget.kind === 'main-filter-panel'
        ? 'main'
        : null;
    const isModuleSettingStep = isConfigOpen && (
      configStep === moduleSettingStep
      || configStep === restrictionStep
      || configStep === processDesignStep
    );
    const isConfigFullscreenActive = isConfigOpen && isFullscreenConfig && (
      configStep === moduleSettingStep
      || configStep === restrictionStep
      || configStep === processDesignStep
      || configStep === modulePreviewStep
    );

    return {
      isCompactModuleSetting: isModuleSettingStep && !isFullscreenConfig,
      isConfigFullscreenActive,
      isModuleSettingStep,
      moduleSettingStageHeightClass: isConfigFullscreenActive ? 'flex-1 min-h-[640px]' : 'flex-1 min-h-0',
      selectedConditionPanelScope,
      selectedDetailColId,
      selectedDetailGridAction,
      selectedDetailTabId,
      selectedLeftColId,
      selectedLeftFilterId,
      selectedMainColId,
      selectedMainFilterId,
      selectedMainGridAction,
      selectedTableConfigScope,
    };
  }, [
    configStep,
    inspectorTarget.id,
    inspectorTarget.kind,
    isConfigOpen,
    isFullscreenConfig,
    modulePreviewStep,
    moduleSettingStep,
    processDesignStep,
    restrictionStep,
  ]);
}
