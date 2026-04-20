import { useCallback, useState } from 'react';

import type { BackendMenuNode } from '../../../lib/backend-menus';
import {
  BUSINESS_TYPE_OPTIONS,
  MENU_DEFAULT_COMMON_FIELD_KEYS,
  buildMenuConfigDraftDefaults,
  type BusinessType,
  type ModuleMenuDraft,
} from './dashboard-menu-config-helpers';
import type { RestrictionConfigTabId } from './restriction-workbench';

type UseDashboardConfigShellStateInput = {
  initialBusinessType: BusinessType;
  initialConfigOpen: boolean;
  initialConfigStep: number;
  initialWorkbench?: 'modules' | 'research-record' | 'tool-feedback';
};

export function useDashboardConfigShellState({
  initialBusinessType,
  initialConfigOpen,
  initialConfigStep,
  initialWorkbench,
}: UseDashboardConfigShellStateInput) {
  const [activeWorkbench, setActiveWorkbench] = useState<'modules' | 'research-record' | 'tool-feedback'>(initialWorkbench ?? 'modules');
  const [isConfigOpen, setIsConfigOpen] = useState(initialConfigOpen);
  const [isSubsystemSidebarOpen, setIsSubsystemSidebarOpen] = useState(true);
  const [configStep, setConfigStep] = useState(initialConfigStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [menuPageRefreshNonce, setMenuPageRefreshNonce] = useState(0);
  const [commonFuncs, setCommonFuncs] = useState<string[]>(['import', 'export']);
  const [isFuncPopoverOpen, setIsFuncPopoverOpen] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>(
    BUSINESS_TYPE_OPTIONS.some((option) => option.value === initialBusinessType) ? initialBusinessType : 'document',
  );
  const [menuInfoTab, setMenuInfoTab] = useState<'common' | 'advanced'>('common');
  const [menuPinnedFields, setMenuPinnedFields] = useState<Record<BusinessType, string[]>>(() => ({
    document: [...MENU_DEFAULT_COMMON_FIELD_KEYS.document],
    table: [...MENU_DEFAULT_COMMON_FIELD_KEYS.table],
    tree: [...MENU_DEFAULT_COMMON_FIELD_KEYS.tree],
  }));
  const [menuConfigDraft, setMenuConfigDraft] = useState<ModuleMenuDraft>(() => buildMenuConfigDraftDefaults(initialBusinessType));
  const [activeConfigMenu, setActiveConfigMenu] = useState<BackendMenuNode | null>(null);
  const [isMenuInfoLoading, setIsMenuInfoLoading] = useState(false);
  const [isMenuInfoSaving, setIsMenuInfoSaving] = useState(false);
  const [isSingleTableFieldsLoading, setIsSingleTableFieldsLoading] = useState(false);
  const [menuInfoError, setMenuInfoError] = useState<string | null>(null);
  const [isFullscreenConfig, setIsFullscreenConfig] = useState(false);
  const [restrictionActiveTab, setRestrictionActiveTab] = useState<RestrictionConfigTabId>('guard');

  const prepareMenuWorkspaceSwitch = useCallback(() => {
    setActiveWorkbench('modules');
    setActiveConfigMenu(null);
    setIsConfigOpen(false);
    setMenuInfoError(null);
  }, []);

  const toggleSubsystemSidebarOpen = useCallback(() => {
    setIsSubsystemSidebarOpen((prev) => !prev);
  }, []);

  const toggleCommonFunc = useCallback((id: string) => {
    setCommonFuncs((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  return {
    activeConfigMenu,
    activeWorkbench,
    businessType,
    commonFuncs,
    completedSteps,
    configStep,
    isConfigOpen,
    isFullscreenConfig,
    isFuncPopoverOpen,
    isMenuInfoLoading,
    isMenuInfoSaving,
    isSingleTableFieldsLoading,
    isSubsystemSidebarOpen,
    menuConfigDraft,
    menuInfoError,
    menuInfoTab,
    menuPageRefreshNonce,
    menuPinnedFields,
    prepareMenuWorkspaceSwitch,
    restrictionActiveTab,
    setActiveConfigMenu,
    setActiveWorkbench,
    setBusinessType,
    setCompletedSteps,
    setConfigStep,
    setIsConfigOpen,
    setIsFullscreenConfig,
    setIsFuncPopoverOpen,
    setIsMenuInfoLoading,
    setIsMenuInfoSaving,
    setIsSingleTableFieldsLoading,
    setIsSubsystemSidebarOpen,
    setMenuConfigDraft,
    setMenuInfoError,
    setMenuInfoTab,
    setMenuPageRefreshNonce,
    setMenuPinnedFields,
    setRestrictionActiveTab,
    toggleCommonFunc,
    toggleSubsystemSidebarOpen,
  };
}
