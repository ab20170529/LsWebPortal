import { useMemo } from 'react';

import { type BackendMenuNode, type BackendSubsystemNode } from '../../../lib/backend-menus';
import { type ResearchWorkbenchModuleOption } from '../research-record-workbench';
import type { DashboardWorkbench } from '../dashboard-workbench-types';
import { getMenuModuleTypeProfile } from './dashboard-menu-config-helpers';

function normalizeMenuTitle(value?: string) {
  return value?.trim() || '';
}

function normalizeMenuCode(value?: string) {
  return value?.trim() || '';
}

function resolveMenuNodeModuleCode(menu: Pick<BackendMenuNode, 'purviewId' | 'code' | 'id'>) {
  return normalizeMenuCode(menu.purviewId) || normalizeMenuCode(menu.code) || menu.id;
}

export function useDashboardWorkspaceMeta({
  activeFirstLevelMenu,
  activeFirstLevelMenuId,
  activeSubsystem,
  activeWorkbench,
  secondLevelMenus,
  selectedSubsystem,
}: {
  activeFirstLevelMenu: BackendMenuNode | null;
  activeFirstLevelMenuId: string;
  activeSubsystem: string;
  activeWorkbench: DashboardWorkbench;
  secondLevelMenus: BackendMenuNode[];
  selectedSubsystem: BackendSubsystemNode | null;
}) {
  const activeMenu = activeFirstLevelMenu?.id ?? selectedSubsystem?.id ?? 'workspace';
  const activeMenuName =
    normalizeMenuTitle(activeFirstLevelMenu?.title) ||
    normalizeMenuTitle(selectedSubsystem?.title) ||
    '模块工作台';
  const activeMenuCode =
    normalizeMenuCode(activeFirstLevelMenu?.code) ||
    normalizeMenuCode(selectedSubsystem?.subsysCode ?? selectedSubsystem?.code) ||
    'MODULE';
  const activeMenuCodePrefix = activeMenuCode.replace(/\s+/g, '').toUpperCase().slice(0, 2) || 'MO';
  const activeSubsystemName = normalizeMenuTitle(selectedSubsystem?.title) || '未选择子系统';
  const activeFirstLevelMenuName = normalizeMenuTitle(activeFirstLevelMenu?.title);
  const isResearchRecordActive = activeWorkbench === 'research-record';
  const isFunctionFlowDesignActive = activeWorkbench === 'function-flow-design';
  const isToolFeedbackActive = activeWorkbench === 'tool-feedback';
  const researchRecordStorageKey = [
    normalizeMenuCode(selectedSubsystem?.subsysCode ?? selectedSubsystem?.code) || activeSubsystem || 'subsystem',
    normalizeMenuCode(activeFirstLevelMenu?.code) || activeFirstLevelMenuId || 'workspace',
  ].join(':');
  const researchCaptureModules = useMemo<ResearchWorkbenchModuleOption[]>(() => (
    secondLevelMenus.flatMap((menu) => {
      const profile = getMenuModuleTypeProfile(menu.moduleType);
      if (!profile || profile.businessType !== 'document') {
        return [];
      }

      return [{
        id: menu.id,
        menuId: menu.menuId ?? null,
        moduleCode: resolveMenuNodeModuleCode(menu),
        moduleName: normalizeMenuTitle(menu.title) || '未命名模块',
        moduleType: 'single-table',
      }];
    })
  ), [secondLevelMenus]);

  return {
    activeFirstLevelMenuName,
    activeMenu,
    activeMenuCode,
    activeMenuCodePrefix,
    activeMenuName,
    activeSubsystemName,
    isFunctionFlowDesignActive,
    isResearchRecordActive,
    isToolFeedbackActive,
    researchCaptureModules,
    researchRecordStorageKey,
    secondLevelMenuCount: secondLevelMenus.length,
  };
}
