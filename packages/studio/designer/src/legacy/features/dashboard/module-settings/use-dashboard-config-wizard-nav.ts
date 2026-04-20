import { type Dispatch, type SetStateAction, useCallback } from 'react';

import { updateCurrentDesignSearch } from '../../../platforms/design/navigation/design-navigation';

type SyncWorkspaceUrlState = (patch: Partial<{
  configOpen: boolean;
  configStep: number | null;
  detailPreview: boolean;
  mode: string | null;
  moduleCode: string | null;
  theme: string | null;
  workbench: 'modules' | 'research-record' | null;
}>, options?: { replace?: boolean }) => void;

export function useDashboardConfigWizardNav({
  closeConfigWizard,
  configStep,
  isEditingMenu,
  isMenuInfoBuilt,
  isSingleTableModuleEnsuring,
  maxConfigStep,
  moduleSettingStep,
  setCompletedSteps,
  setConfigStep,
  showToast,
  syncWorkspaceUrlState,
}: {
  closeConfigWizard: () => void;
  configStep: number;
  isEditingMenu: boolean;
  isMenuInfoBuilt: boolean;
  isSingleTableModuleEnsuring: boolean;
  maxConfigStep: number;
  moduleSettingStep: number;
  setCompletedSteps: Dispatch<SetStateAction<number[]>>;
  setConfigStep: Dispatch<SetStateAction<number>>;
  showToast: (message: string) => void;
  syncWorkspaceUrlState?: SyncWorkspaceUrlState;
}) {
  const handleConfigStepSelect = useCallback((stepId: number) => {
    if (stepId >= moduleSettingStep && !isMenuInfoBuilt) {
      showToast('请先保存菜单信息，创建模块后再进入模块设置。');
      return;
    }
    if (stepId > moduleSettingStep && isSingleTableModuleEnsuring) {
      showToast('单表模块正在初始化，请稍后再继续。');
      return;
    }
    setConfigStep(stepId);
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({
        configStep: stepId,
      }, { replace: true });
    } else {
      updateCurrentDesignSearch({
        step: stepId,
      }, { replace: true });
    }
  }, [isMenuInfoBuilt, isSingleTableModuleEnsuring, moduleSettingStep, setConfigStep, showToast, syncWorkspaceUrlState]);

  const handleLockedTypeStepSelect = useCallback(() => {
    showToast('编辑模式已锁定类型');
  }, [showToast]);

  const handleConfigPrevious = useCallback(() => {
    if (isEditingMenu && configStep === 2) {
      return;
    }
    const nextStep = Math.max(1, configStep - 1);
    setConfigStep(nextStep);
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({
        configStep: nextStep,
      }, { replace: true });
      return;
    }

    updateCurrentDesignSearch({
      step: nextStep,
    }, { replace: true });
  }, [configStep, isEditingMenu, setConfigStep, syncWorkspaceUrlState]);

  const handleConfigNext = useCallback(() => {
    if (configStep === 2 && !isEditingMenu) {
      showToast('请先保存菜单信息，创建模块后再进入下一步。');
      return;
    }

    const nextStep = configStep + 1;
    if (nextStep >= moduleSettingStep && !isMenuInfoBuilt) {
      showToast('请先保存菜单信息，创建模块后再进入模块设置。');
      return;
    }

    setCompletedSteps((prev) => (prev.includes(configStep) ? prev : [...prev, configStep]));

    if (configStep < maxConfigStep) {
      setConfigStep(nextStep);
      updateCurrentDesignSearch({
        step: nextStep,
      }, { replace: true });
      return;
    }

    closeConfigWizard();
  }, [
    closeConfigWizard,
    configStep,
    isEditingMenu,
    isMenuInfoBuilt,
    maxConfigStep,
    moduleSettingStep,
    setCompletedSteps,
    setConfigStep,
    showToast,
  ]);

  return {
    handleConfigNext,
    handleConfigPrevious,
    handleConfigStepSelect,
    handleLockedTypeStepSelect,
  };
}
