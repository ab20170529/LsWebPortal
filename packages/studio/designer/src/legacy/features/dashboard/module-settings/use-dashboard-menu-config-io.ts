import { type Dispatch, type SetStateAction, useCallback } from 'react';

import { type BackendMenuNode, type BackendSubsystemNode } from '../../../lib/backend-menus';
import {
  fetchSubsystemMenuConfig,
  saveSubsystemMenuConfig,
  type SubsystemMenuConfigDto,
} from '../../../lib/backend-subsystem-menu-config';
import { updateCurrentDesignSearch } from '../../../platforms/design/navigation/design-navigation';
import {
  buildCreateModuleRelationPayload as createModuleRelationPayload,
  buildCreatedConfigMenu as createConfigMenuNode,
  buildMenuConfigDraftDefaults,
  getMenuModuleTypeProfile,
  mapMenuConfigDraftToPayload,
  mapSubsystemMenuConfigToDraft,
  toDraftText,
  type BusinessType,
  type ModuleMenuDraft,
} from './dashboard-menu-config-helpers';
import { MODULE_SETTING_STEP } from './dashboard-shell-constants';
import type { DashboardWorkbench } from '../dashboard-workbench-types';

type SyncWorkspaceUrlState = (patch: Partial<{
  configOpen: boolean;
  configStep: number | null;
  detailPreview: boolean;
  mode: string | null;
  moduleCode: string | null;
  theme: string | null;
  workbench: DashboardWorkbench | null;
}>, options?: { replace?: boolean }) => void;

function normalizeMenuTitle(value?: string) {
  return value?.trim() || '';
}

function normalizeMenuCode(value?: string) {
  return value?.trim() || '';
}

function resolveMenuNodeModuleCode(menu: Pick<BackendMenuNode, 'purviewId' | 'code' | 'id'>) {
  return normalizeMenuCode(menu.purviewId) || normalizeMenuCode(menu.code) || menu.id;
}

export function useDashboardMenuConfigIo({
  activeConfigMenu,
  activeFirstLevelMenu,
  businessType,
  configStep,
  menuConfigDraft,
  openModuleGuide,
  selectedSubsystem,
  setActiveConfigMenu,
  setActiveWorkbench,
  setIsMenuInfoLoading,
  setIsMenuInfoSaving,
  setMenuConfigDraft,
  setMenuInfoError,
  setSecondLevelMenus,
  showToast,
  syncWorkspaceUrlState,
  markStepCompleted,
}: {
  activeConfigMenu: BackendMenuNode | null;
  activeFirstLevelMenu: BackendMenuNode | null;
  businessType: BusinessType;
  configStep: number;
  markStepCompleted: (stepId: number) => void;
  menuConfigDraft: ModuleMenuDraft;
  openModuleGuide: (nextType: BusinessType, options?: {
    completedSteps?: number[];
    initialStep?: number;
    moduleCode?: string | null;
  }) => void;
  selectedSubsystem: BackendSubsystemNode | null;
  setActiveConfigMenu: Dispatch<SetStateAction<BackendMenuNode | null>>;
  setActiveWorkbench: Dispatch<SetStateAction<DashboardWorkbench>>;
  setIsMenuInfoLoading: Dispatch<SetStateAction<boolean>>;
  setIsMenuInfoSaving: Dispatch<SetStateAction<boolean>>;
  setMenuConfigDraft: Dispatch<SetStateAction<ModuleMenuDraft>>;
  setMenuInfoError: Dispatch<SetStateAction<string | null>>;
  setSecondLevelMenus: Dispatch<SetStateAction<BackendMenuNode[]>>;
  showToast: (message: string) => void;
  syncWorkspaceUrlState?: SyncWorkspaceUrlState;
}) {
  const buildCreatedConfigMenu = useCallback((savedMenu: SubsystemMenuConfigDto, moduleType: 'single-table' | 'bill'): BackendMenuNode => {
    return createConfigMenuNode({
      currentFirstLevelMenu: activeFirstLevelMenu,
      currentSubsystem: selectedSubsystem,
      moduleType,
      savedMenu,
    });
  }, [activeFirstLevelMenu, selectedSubsystem]);

  const buildCreateModuleRelationPayload = useCallback((
    moduleKey: string,
    moduleTitle: string,
    moduleType: 'single-table' | 'bill',
  ) => createModuleRelationPayload({
    activeFirstLevelMenu,
    moduleKey,
    moduleTitle,
    moduleType,
    selectedSubsystem,
  }), [activeFirstLevelMenu, selectedSubsystem]);

  const loadMenuInfoForMenu = useCallback(async (menu: BackendMenuNode) => {
    if (!menu.menuId) {
      const message = '当前菜单缺少菜单编号，无法加载菜单信息。';
      setMenuInfoError(message);
      showToast(message);
      return;
    }

    setIsMenuInfoLoading(true);
    setMenuInfoError(null);

    try {
      const data = await fetchSubsystemMenuConfig(menu.menuId);
      setMenuConfigDraft(mapSubsystemMenuConfigToDraft(data));
      setActiveConfigMenu((prev) => (
        prev && prev.id === menu.id
          ? buildCreatedConfigMenu(data, prev.moduleType === 'bill' ? 'bill' : 'single-table')
          : prev
      ));
    } catch (error) {
      const message = error instanceof Error && error.message.trim() ? error.message : '菜单加载失败，请稍后重试。';
      setMenuInfoError(message);
      showToast(message);
    } finally {
      setIsMenuInfoLoading(false);
    }
  }, [
    buildCreatedConfigMenu,
    setActiveConfigMenu,
    setIsMenuInfoLoading,
    setMenuConfigDraft,
    setMenuInfoError,
    showToast,
  ]);

  const handleSecondLevelMenuConfig = useCallback((menu: BackendMenuNode) => {
    const moduleTypeProfile = getMenuModuleTypeProfile(menu.moduleType);
    const nextType = moduleTypeProfile?.businessType ?? 'document';
    if (!menu.menuId) {
      showToast('当前菜单缺少菜单编号，无法打开配置。');
      return;
    }

    setActiveWorkbench('modules');
    setActiveConfigMenu(menu);
    setMenuInfoError(null);
    setIsMenuInfoSaving(false);
    setMenuConfigDraft(buildMenuConfigDraftDefaults(nextType));
    openModuleGuide(nextType, {
      completedSteps: [1, 2],
      initialStep: MODULE_SETTING_STEP,
      moduleCode: resolveMenuNodeModuleCode(menu),
    });
    void loadMenuInfoForMenu(menu);
  }, [
    loadMenuInfoForMenu,
    openModuleGuide,
    setActiveConfigMenu,
    setActiveWorkbench,
    setIsMenuInfoSaving,
    setMenuConfigDraft,
    setMenuInfoError,
    showToast,
  ]);

  const handleMenuInfoSave = useCallback(async () => {
    if (configStep !== 2) {
      markStepCompleted(configStep);
      if (configStep === 1) {
        showToast('模块类型已确认');
      }
      return;
    }

    const nextModuleType = activeConfigMenu?.moduleType ?? (businessType === 'table' ? 'bill' : 'single-table');
    const nextMenuTitle = normalizeMenuTitle(toDraftText(menuConfigDraft.menuCaption));
    const fallbackModuleKey = normalizeMenuCode(toDraftText(menuConfigDraft.moduleCode));
    const resolvedSubsystemId = toDraftText(menuConfigDraft.subsystemId || selectedSubsystem?.subsysId);
    const resolvedParentMenuId = toDraftText(menuConfigDraft.parentMenuId || activeFirstLevelMenu?.menuId);

    if (!nextMenuTitle) {
      const message = '请先填写菜单名称，再保存菜单信息。';
      setMenuInfoError(message);
      showToast(message);
      return;
    }

    if (!fallbackModuleKey) {
      const message = '请先填写模块标识，再保存菜单信息。';
      setMenuInfoError(message);
      showToast(message);
      return;
    }

    if (!resolvedSubsystemId) {
      const message = '当前缺少子系统编号，无法保存菜单信息。';
      setMenuInfoError(message);
      showToast(message);
      return;
    }

    if (!resolvedParentMenuId) {
      const message = '当前缺少父菜单编号，无法保存菜单信息。';
      setMenuInfoError(message);
      showToast(message);
      return;
    }

    setIsMenuInfoSaving(true);
    setMenuInfoError(null);

    try {
      const payload = mapMenuConfigDraftToPayload({
        ...menuConfigDraft,
        menuCaption: nextMenuTitle,
        moduleCode: fallbackModuleKey,
        parentMenuId: resolvedParentMenuId,
        subsystemId: resolvedSubsystemId,
      });
      const saved = await saveSubsystemMenuConfig({
        ...(activeConfigMenu?.menuId
          ? { menuid: activeConfigMenu.menuId }
          : buildCreateModuleRelationPayload(fallbackModuleKey, nextMenuTitle, nextModuleType)),
        ...payload,
      });
      const nextMenuNode = buildCreatedConfigMenu(saved, nextModuleType);

      setMenuConfigDraft(mapSubsystemMenuConfigToDraft(saved));
      setActiveConfigMenu(nextMenuNode);
      if (syncWorkspaceUrlState) {
        syncWorkspaceUrlState({
          configOpen: true,
          configStep: 2,
          moduleCode: resolveMenuNodeModuleCode(nextMenuNode),
        }, { replace: true });
      } else {
        updateCurrentDesignSearch({
          config: true,
          module: resolveMenuNodeModuleCode(nextMenuNode),
          step: 2,
        }, { replace: true });
      }
      setSecondLevelMenus((prev) => {
        const existingIndex = prev.findIndex((item) => item.menuId === nextMenuNode.menuId || item.id === nextMenuNode.id);
        if (existingIndex === -1) {
          return [...prev, nextMenuNode];
        }

        return prev.map((item, index) => (index === existingIndex ? nextMenuNode : item));
      });

      markStepCompleted(2);
      showToast(activeConfigMenu ? '菜单信息已保存' : '菜单信息已创建');
    } catch (error) {
      const message = error instanceof Error && error.message.trim() ? error.message : '菜单加载失败，请稍后重试。';
      setMenuInfoError(message);
      showToast(message);
    } finally {
      setIsMenuInfoSaving(false);
    }
  }, [
    activeConfigMenu,
    activeFirstLevelMenu,
    buildCreateModuleRelationPayload,
    buildCreatedConfigMenu,
    businessType,
    configStep,
    markStepCompleted,
    menuConfigDraft,
    selectedSubsystem,
    setActiveConfigMenu,
    setIsMenuInfoSaving,
    setMenuConfigDraft,
    setMenuInfoError,
    setSecondLevelMenus,
    showToast,
    syncWorkspaceUrlState,
  ]);

  return {
    buildCreateModuleRelationPayload,
    buildCreatedConfigMenu,
    handleMenuInfoSave,
    handleSecondLevelMenuConfig,
    loadMenuInfoForMenu,
  };
}
