import { type Dispatch, type SetStateAction, useEffect } from 'react';

import { type BackendMenuNode } from '../../../lib/backend-menus';
import { resolveDesignModuleSelection } from '../../../platforms/design/navigation/design-navigation';
import {
  buildMenuConfigDraftDefaults,
  getMenuModuleTypeProfile,
  type BusinessType,
  type ModuleMenuDraft,
} from './dashboard-menu-config-helpers';

function normalizeMenuCode(value?: string) {
  return value?.trim() || '';
}

function resolveMenuNodeModuleCode(menu: Pick<BackendMenuNode, 'purviewId' | 'code' | 'id'>) {
  return normalizeMenuCode(menu.purviewId) || normalizeMenuCode(menu.code) || menu.id;
}

export function useDashboardMenuConfigBootstrap({
  activeConfigMenu,
  initialBusinessType,
  initialConfigOpen,
  initialConfigStep,
  initialRouteModuleCode,
  loadMenuInfoForMenu,
  openModuleGuide,
  secondLevelMenus,
  setActiveConfigMenu,
  setIsMenuInfoSaving,
  setMenuConfigDraft,
  setMenuInfoError,
}: {
  activeConfigMenu: BackendMenuNode | null;
  initialBusinessType: BusinessType;
  initialConfigOpen: boolean;
  initialConfigStep: number;
  initialRouteModuleCode: string;
  loadMenuInfoForMenu: (menu: BackendMenuNode) => Promise<void>;
  openModuleGuide: (nextType: BusinessType, options?: {
    completedSteps?: number[];
    initialStep?: number;
    moduleCode?: string | null;
  }) => void;
  secondLevelMenus: BackendMenuNode[];
  setActiveConfigMenu: Dispatch<SetStateAction<BackendMenuNode | null>>;
  setIsMenuInfoSaving: Dispatch<SetStateAction<boolean>>;
  setMenuConfigDraft: Dispatch<SetStateAction<ModuleMenuDraft>>;
  setMenuInfoError: Dispatch<SetStateAction<string | null>>;
}) {
  useEffect(() => {
    if (!initialConfigOpen || !initialRouteModuleCode || activeConfigMenu || secondLevelMenus.length === 0) {
      return;
    }

    const nextMenu = resolveDesignModuleSelection(secondLevelMenus, initialRouteModuleCode);
    if (!nextMenu?.menuId) {
      return;
    }

    const moduleTypeProfile = getMenuModuleTypeProfile(nextMenu.moduleType);
    const nextType = moduleTypeProfile?.businessType ?? initialBusinessType;

    setActiveConfigMenu(nextMenu);
    setMenuInfoError(null);
    setIsMenuInfoSaving(false);
    setMenuConfigDraft(buildMenuConfigDraftDefaults(nextType));
    openModuleGuide(nextType, {
      completedSteps: [1],
      initialStep: Math.max(2, initialConfigStep),
      moduleCode: resolveMenuNodeModuleCode(nextMenu),
    });
    void loadMenuInfoForMenu(nextMenu);
  }, [
    activeConfigMenu,
    initialBusinessType,
    initialConfigOpen,
    initialConfigStep,
    initialRouteModuleCode,
    loadMenuInfoForMenu,
    openModuleGuide,
    secondLevelMenus,
    setActiveConfigMenu,
    setIsMenuInfoSaving,
    setMenuConfigDraft,
    setMenuInfoError,
  ]);
}
