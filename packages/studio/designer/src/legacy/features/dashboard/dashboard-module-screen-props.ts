import type { ComponentProps } from 'react';

import { DashboardOverview } from './dashboard-overview';
import { DashboardWorkspaceHeader } from './dashboard-workspace-header';
import { DashboardWorkspaceSidebar } from './dashboard-workspace-sidebar';

type DashboardModuleScreenHeaderProps = ComponentProps<typeof DashboardWorkspaceHeader>;
type DashboardModuleScreenOverviewProps = ComponentProps<typeof DashboardOverview>;
type DashboardModuleScreenSidebarProps = ComponentProps<typeof DashboardWorkspaceSidebar>;

export function buildDashboardModuleScreenProps({
  activeFirstLevelMenuId,
  activeFirstLevelMenuName,
  activeMenu,
  activeMenuCode,
  activeMenuCodePrefix,
  activeMenuName,
  activeSubsystem,
  activeSubsystemName,
  companyTitle,
  currentUserName,
  deletingMenuId,
  expandedSubsystemId,
  handleFirstLevelMenuClick,
  handleSecondLevelMenuConfig,
  isAdmin,
  isFunctionFlowDesignActive,
  isLoadingSecondLevelMenus,
  isLoadingSubsystemMenus,
  isResearchRecordActive,
  isServerPermissionActive,
  isSubsystemOpen,
  isToolFeedbackActive,
  menuLoadError,
  onDeleteMenu,
  onLogout,
  onSwitchCompany,
  onOpenFunctionFlowDesign,
  onOpenServerPermission,
  onOpenResearchRecord,
  onOpenToolFeedback,
  onCreateModule,
  reloadSubsystemMenus,
  researchRecordStorageKey,
  secondLevelMenuCount,
  secondLevelMenus,
  subsystemMenus,
  toggleSubsystemExpansion,
  toggleSubsystemOpen,
}: {
  activeFirstLevelMenuId: DashboardModuleScreenSidebarProps['activeFirstLevelMenuId'];
  activeFirstLevelMenuName: DashboardModuleScreenHeaderProps['activeFirstLevelMenuName'];
  activeMenu: string;
  activeMenuCode: DashboardModuleScreenOverviewProps['activeMenuCode'];
  activeMenuCodePrefix: DashboardModuleScreenOverviewProps['activeMenuCodePrefix'];
  activeMenuName: DashboardModuleScreenOverviewProps['activeMenuName'];
  activeSubsystem: DashboardModuleScreenSidebarProps['activeSubsystem'];
  activeSubsystemName: DashboardModuleScreenHeaderProps['activeSubsystemName'];
  companyTitle: DashboardModuleScreenSidebarProps['companyTitle'];
  currentUserName: DashboardModuleScreenSidebarProps['currentUserName'];
  deletingMenuId: DashboardModuleScreenOverviewProps['deletingMenuId'];
  expandedSubsystemId: DashboardModuleScreenSidebarProps['expandedSubsystemId'];
  handleFirstLevelMenuClick: DashboardModuleScreenSidebarProps['handleFirstLevelMenuClick'];
  handleSecondLevelMenuConfig: DashboardModuleScreenOverviewProps['onConfigureMenu'];
  isAdmin: DashboardModuleScreenSidebarProps['isAdmin'];
  isFunctionFlowDesignActive: DashboardModuleScreenHeaderProps['isFunctionFlowDesignActive'];
  isLoadingSecondLevelMenus: DashboardModuleScreenOverviewProps['isLoadingSecondLevelMenus'];
  isLoadingSubsystemMenus: DashboardModuleScreenSidebarProps['isLoadingSubsystemMenus'];
  isResearchRecordActive: DashboardModuleScreenHeaderProps['isResearchRecordActive'];
  isServerPermissionActive: DashboardModuleScreenHeaderProps['isServerPermissionActive'];
  isSubsystemOpen: DashboardModuleScreenSidebarProps['isSubsystemOpen'];
  isToolFeedbackActive: DashboardModuleScreenHeaderProps['isToolFeedbackActive'];
  menuLoadError: DashboardModuleScreenSidebarProps['menuLoadError'];
  onDeleteMenu: DashboardModuleScreenOverviewProps['onDeleteMenu'];
  onLogout: DashboardModuleScreenSidebarProps['onLogout'];
  onSwitchCompany?: DashboardModuleScreenSidebarProps['onSwitchCompany'];
  onOpenFunctionFlowDesign: DashboardModuleScreenSidebarProps['onOpenFunctionFlowDesign'];
  onOpenServerPermission: DashboardModuleScreenSidebarProps['onOpenServerPermission'];
  onOpenResearchRecord: DashboardModuleScreenSidebarProps['onOpenResearchRecord'];
  onOpenToolFeedback: DashboardModuleScreenSidebarProps['onOpenToolFeedback'];
  onCreateModule: DashboardModuleScreenOverviewProps['onCreateModule'];
  reloadSubsystemMenus: DashboardModuleScreenSidebarProps['reloadSubsystemMenus'];
  researchRecordStorageKey: string;
  secondLevelMenuCount: DashboardModuleScreenOverviewProps['secondLevelMenuCount'];
  secondLevelMenus: DashboardModuleScreenOverviewProps['menus'];
  subsystemMenus: DashboardModuleScreenSidebarProps['subsystemMenus'];
  toggleSubsystemExpansion: DashboardModuleScreenSidebarProps['toggleSubsystemExpansion'];
  toggleSubsystemOpen: DashboardModuleScreenSidebarProps['toggleSubsystemOpen'];
}) {
  return {
    contentKey: isResearchRecordActive || isToolFeedbackActive || isFunctionFlowDesignActive
      ? `workspace:${researchRecordStorageKey}`
      : activeMenu,
    headerProps: {
      activeFirstLevelMenuName,
      activeSubsystemName,
      isFunctionFlowDesignActive,
      isResearchRecordActive,
      isServerPermissionActive,
      isToolFeedbackActive,
    },
    overviewProps: {
      activeFirstLevelMenuName,
      activeMenuCode,
      activeMenuCodePrefix,
      activeMenuName,
      activeSubsystemName,
      deletingMenuId,
      isLoadingSecondLevelMenus,
      menus: secondLevelMenus,
      onConfigureMenu: handleSecondLevelMenuConfig,
      onCreateModule,
      onDeleteMenu,
      secondLevelMenuCount,
    },
    sidebarProps: {
      activeFirstLevelMenuId,
      activeSubsystem,
      companyTitle,
      currentUserName,
      expandedSubsystemId,
      handleFirstLevelMenuClick,
      isAdmin,
      isFunctionFlowDesignActive,
      isLoadingSubsystemMenus,
      isResearchRecordActive,
      isServerPermissionActive,
      isSubsystemOpen,
      isToolFeedbackActive,
      menuLoadError,
      onLogout,
      onSwitchCompany,
      onOpenFunctionFlowDesign,
      onOpenServerPermission,
      onOpenResearchRecord,
      onOpenToolFeedback,
      reloadSubsystemMenus,
      subsystemMenus,
      toggleSubsystemExpansion,
      toggleSubsystemOpen,
    },
  };
}
