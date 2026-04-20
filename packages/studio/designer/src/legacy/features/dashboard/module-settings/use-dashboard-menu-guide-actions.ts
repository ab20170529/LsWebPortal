import { type Dispatch, type SetStateAction, useCallback } from 'react';

import { type BackendMenuNode, type BackendSubsystemNode } from '../../../lib/backend-menus';
import { type SurveyPlan } from '../../../lib/minimax';
import { updateCurrentDesignSearch } from '../../../platforms/design/navigation/design-navigation';
import {
  MENU_DEFAULT_COMMON_FIELD_KEYS,
  buildMenuConfigDraftDefaults,
  getDefaultMenuDllFileName,
  toDraftText,
  type BusinessType,
  type ModuleMenuDraft,
  type ModuleMenuValue,
} from './dashboard-menu-config-helpers';

type SyncWorkspaceUrlState = (patch: Partial<{
  configOpen: boolean;
  configStep: number | null;
  detailPreview: boolean;
  mode: string | null;
  moduleCode: string | null;
  theme: string | null;
  workbench: 'modules' | 'research-record' | null;
}>, options?: { replace?: boolean }) => void;

export function useDashboardMenuGuideActions({
  activeFirstLevelMenu,
  businessType,
  isConfigOpen,
  resetModuleDesignerState,
  selectedSubsystem,
  setActiveConfigMenu,
  setActiveWorkbench,
  setBusinessType,
  setCompletedSteps,
  setConfigStep,
  setIsConfigOpen,
  setIsFullscreenConfig,
  setIsGenerating,
  setIsMenuInfoLoading,
  setIsMenuInfoSaving,
  setMenuConfigDraft,
  setMenuInfoError,
  setMenuInfoTab,
  setMenuPinnedFields,
  setSurveyAnswers,
  setSurveyError,
  setSurveyPlan,
  setSurveyPlanModel,
  setSurveyStep,
  syncWorkspaceUrlState,
}: {
  activeFirstLevelMenu: BackendMenuNode | null;
  businessType: BusinessType;
  isConfigOpen: boolean;
  resetModuleDesignerState: () => void;
  selectedSubsystem: BackendSubsystemNode | null;
  setActiveConfigMenu: Dispatch<SetStateAction<BackendMenuNode | null>>;
  setActiveWorkbench: Dispatch<SetStateAction<'modules' | 'research-record'>>;
  setBusinessType: Dispatch<SetStateAction<BusinessType>>;
  setCompletedSteps: Dispatch<SetStateAction<number[]>>;
  setConfigStep: Dispatch<SetStateAction<number>>;
  setIsConfigOpen: Dispatch<SetStateAction<boolean>>;
  setIsFullscreenConfig: Dispatch<SetStateAction<boolean>>;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  setIsMenuInfoLoading: Dispatch<SetStateAction<boolean>>;
  setIsMenuInfoSaving: Dispatch<SetStateAction<boolean>>;
  setMenuConfigDraft: Dispatch<SetStateAction<ModuleMenuDraft>>;
  setMenuInfoError: Dispatch<SetStateAction<string | null>>;
  setMenuInfoTab: Dispatch<SetStateAction<'common' | 'advanced'>>;
  setMenuPinnedFields: Dispatch<SetStateAction<Record<BusinessType, string[]>>>;
  setSurveyAnswers: Dispatch<SetStateAction<string[]>>;
  setSurveyError: Dispatch<SetStateAction<string | null>>;
  setSurveyPlan: Dispatch<SetStateAction<SurveyPlan | null>>;
  setSurveyPlanModel: Dispatch<SetStateAction<string>>;
  setSurveyStep: Dispatch<SetStateAction<number>>;
  syncWorkspaceUrlState?: SyncWorkspaceUrlState;
}) {
  const handleBusinessTypeChange = useCallback((nextType: BusinessType) => {
    setBusinessType(nextType);
    setMenuConfigDraft((prev) => ({
      ...prev,
      modType: nextType === 'table' ? '2' : '1',
      ...((() => {
        const currentDll = toDraftText(prev.dllFileName).trim();
        const previousDefaultDll = getDefaultMenuDllFileName(businessType);
        const nextDefaultDll = getDefaultMenuDllFileName(nextType);
        if (!currentDll || currentDll === previousDefaultDll) {
          return { dllFileName: nextDefaultDll };
        }
        return {};
      })()),
    }));
    resetModuleDesignerState();
    setMenuInfoTab('common');
    if (isConfigOpen) {
      if (syncWorkspaceUrlState) {
        syncWorkspaceUrlState({
          mode: nextType,
        }, { replace: true });
      } else {
        updateCurrentDesignSearch({
          mode: nextType,
        }, { replace: true });
      }
    }
  }, [businessType, isConfigOpen, resetModuleDesignerState, setBusinessType, setMenuConfigDraft, setMenuInfoTab, syncWorkspaceUrlState]);

  const updateCurrentMenuDraft = useCallback((fieldKey: string, value: ModuleMenuValue) => {
    setMenuConfigDraft((prev) => ({ ...prev, [fieldKey]: value }));
  }, [setMenuConfigDraft]);

  const toggleMenuPinnedField = useCallback((fieldKey: string, shouldPin?: boolean) => {
    setMenuPinnedFields((prev) => {
      const defaultKeys = MENU_DEFAULT_COMMON_FIELD_KEYS[businessType] ?? MENU_DEFAULT_COMMON_FIELD_KEYS.document;
      const currentKeys = prev[businessType] ?? defaultKeys;
      const nextShouldPin = shouldPin ?? !currentKeys.includes(fieldKey);
      const nextKeys = nextShouldPin
        ? currentKeys.includes(fieldKey)
          ? currentKeys
          : [...currentKeys, fieldKey]
        : currentKeys.filter((key) => key !== fieldKey);

      return {
        ...prev,
        [businessType]: nextKeys,
      };
    });
  }, [businessType, setMenuPinnedFields]);

  const openModuleGuide = useCallback((
    nextType: BusinessType,
    options?: {
      completedSteps?: number[];
      initialStep?: number;
      moduleCode?: string | null;
    },
  ) => {
    const nextStep = options?.initialStep ?? 1;
    setIsConfigOpen(true);
    setConfigStep(nextStep);
    setCompletedSteps(options?.completedSteps ?? []);
    handleBusinessTypeChange(nextType);
    setIsFullscreenConfig(false);
    setSurveyStep(0);
    setSurveyAnswers([]);
    setIsGenerating(false);
    setSurveyPlan(null);
    setSurveyPlanModel('');
    setSurveyError(null);

    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({
        configOpen: true,
        configStep: nextStep,
        mode: nextType,
        moduleCode: options?.moduleCode ?? null,
      }, { replace: true });
    } else {
      updateCurrentDesignSearch({
        config: true,
        mode: nextType,
        module: options?.moduleCode,
        step: nextStep,
      }, { replace: true });
    }
  }, [
    handleBusinessTypeChange,
    setCompletedSteps,
    setConfigStep,
    setIsConfigOpen,
    setIsFullscreenConfig,
    setIsGenerating,
    setSurveyAnswers,
    setSurveyError,
    setSurveyPlan,
    setSurveyPlanModel,
    setSurveyStep,
    syncWorkspaceUrlState,
  ]);

  const openNewModuleGuide = useCallback(() => {
    setActiveWorkbench('modules');
    setActiveConfigMenu(null);
    setMenuInfoError(null);
    setIsMenuInfoLoading(false);
    setIsMenuInfoSaving(false);
    setMenuConfigDraft(buildMenuConfigDraftDefaults('document', {
      parentMenuId: toDraftText(activeFirstLevelMenu?.menuId),
      subsystemId: toDraftText(selectedSubsystem?.subsysId),
      useFlag: 'true',
    }));
    openModuleGuide('document', {
      moduleCode: null,
    });
  }, [
    activeFirstLevelMenu,
    openModuleGuide,
    selectedSubsystem,
    setActiveConfigMenu,
    setActiveWorkbench,
    setIsMenuInfoLoading,
    setIsMenuInfoSaving,
    setMenuConfigDraft,
    setMenuInfoError,
  ]);

  return {
    handleBusinessTypeChange,
    openModuleGuide,
    openNewModuleGuide,
    toggleMenuPinnedField,
    updateCurrentMenuDraft,
  };
}
